const Contact = require('../models/Contact');
const { json2csv } = require('json-2-csv');

// GET /api/contacts
const getContacts = async (req, res, next) => {
  try {
    const {
      search,
      page = 1,
      limit = 10,
      sort = 'name',
      favorite,
      recent,
      upcomingBirthdays,
    } = req.query;

    let query = { user: req.user._id };

    if (favorite === 'true') query.favorite = true;

    if (recent === 'true') {
      const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      query.createdAt = { $gte: cutoff };
    }

    // birthday filter — a bit involved, we pull ids first then query by id
    if (upcomingBirthdays === 'true') {
      const today = new Date();
      const withDob = await Contact.find({ user: req.user._id, dateOfBirth: { $ne: null } });

      const ids = withDob
        .filter(c => {
          const dob = new Date(c.dateOfBirth);
          const thisYear = new Date(today.getFullYear(), dob.getMonth(), dob.getDate());
          const diff = Math.ceil((thisYear - today) / 86400000);
          return (
            (dob.getMonth() === today.getMonth() && dob.getDate() === today.getDate()) ||
            (diff > 0 && diff <= 7) ||
            (diff < 0 && diff + 365 <= 7)  // wraps around new year
          );
        })
        .map(c => c._id);

      query._id = { $in: ids };
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const pg = parseInt(page);
    const lim = parseInt(limit);
    const sortDir = sort.startsWith('-') ? -1 : 1;
    const sortKey = sort.replace(/^-/, '');

    const [contacts, total] = await Promise.all([
      Contact.find(query)
        .sort({ [sortKey]: sortDir })
        .limit(lim)
        .skip((pg - 1) * lim),
      Contact.countDocuments(query),
    ]);

    res.json({
      contacts,
      pagination: { total, currentPage: pg, pages: Math.ceil(total / lim) },
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/contacts/analytics
const getAnalytics = async (req, res, next) => {
  try {
    const uid = req.user._id;
    const now = new Date();
    const week = new Date(now - 7 * 24 * 60 * 60 * 1000);

    const [total, favorites, recent, all] = await Promise.all([
      Contact.countDocuments({ user: uid }),
      Contact.countDocuments({ user: uid, favorite: true }),
      Contact.countDocuments({ user: uid, createdAt: { $gte: week } }),
      Contact.find({ user: uid, dateOfBirth: { $ne: null } }),
    ]);

    const todayBirths = [];
    const upcoming = [];

    all.forEach(c => {
      const dob = new Date(c.dateOfBirth);
      const thisYear = new Date(now.getFullYear(), dob.getMonth(), dob.getDate());
      const diff = Math.ceil((thisYear - now) / 86400000);

      if (dob.getMonth() === now.getMonth() && dob.getDate() === now.getDate()) {
        todayBirths.push(c);
      } else if (diff > 0 && diff <= 7) {
        upcoming.push(c);
      } else if (diff < 0 && diff + 365 <= 7) {
        upcoming.push(c);
      }
    });

    res.json({
      total,
      favorites,
      recent,
      birthdaysToday: todayBirths,
      upcomingBirthdays: upcoming,
      upcomingBirthdaysCount: upcoming.length,
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/contacts/export
const exportContacts = async (req, res, next) => {
  try {
    const contacts = await Contact.find({ user: req.user._id }).select(
      'name phone email notes -_id'
    );

    if (!contacts.length) {
      res.status(404);
      throw new Error('No contacts to export');
    }

    const csv = await json2csv(contacts);
    res.header('Content-Type', 'text/csv');
    res.attachment('contacts.csv');
    res.send(csv);
  } catch (err) {
    next(err);
  }
};

// POST /api/contacts
const createContact = async (req, res, next) => {
  try {
    const { name, email, phone, notes, dateOfBirth, favorite, image } = req.body;

    if (!name || !phone) {
      res.status(400);
      throw new Error('Name and phone number are required');
    }

    // check for dupes within this user's contacts
    const dupConditions = [{ phone }];
    if (email) dupConditions.push({ email });

    const dup = await Contact.findOne({ user: req.user._id, $or: dupConditions });
    if (dup) {
      res.status(400);
      const field = dup.phone === phone ? 'Phone number' : 'Email';
      throw new Error(`${field} already exists in your contacts`);
    }

    const contact = await Contact.create({
      user: req.user._id,
      name,
      email,
      phone,
      notes,
      dateOfBirth,
      favorite,
      image,
    });

    res.status(201).json(contact);
  } catch (err) {
    next(err);
  }
};

// GET /api/contacts/:id
const getContactById = async (req, res, next) => {
  try {
    const contact = await Contact.findById(req.params.id);

    if (!contact) {
      res.status(404);
      throw new Error('Contact not found');
    }

    if (contact.user.toString() !== req.user._id.toString()) {
      res.status(403);
      throw new Error('Not your contact');
    }

    res.json(contact);
  } catch (err) {
    next(err);
  }
};

// PUT /api/contacts/:id
const updateContact = async (req, res, next) => {
  try {
    const contact = await Contact.findById(req.params.id);

    if (!contact) {
      res.status(404);
      throw new Error('Contact not found');
    }

    if (contact.user.toString() !== req.user._id.toString()) {
      res.status(403);
      throw new Error('Not your contact');
    }

    const { email, phone } = req.body;

    // only check for dupes if email/phone actually changed
    if ((email && email !== contact.email) || (phone && phone !== contact.phone)) {
      const orArr = [];
      if (email && email !== contact.email) orArr.push({ email });
      if (phone && phone !== contact.phone) orArr.push({ phone });

      if (orArr.length) {
        const clash = await Contact.findOne({
          user: req.user._id,
          _id: { $ne: req.params.id },
          $or: orArr,
        });
        if (clash) {
          res.status(400);
          throw new Error(`${clash.email === email ? 'Email' : 'Phone'} already taken`);
        }
      }
    }

    const updated = await Contact.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.json(updated);
  } catch (err) {
    next(err);
  }
};

// DELETE /api/contacts/:id
const deleteContact = async (req, res, next) => {
  try {
    const contact = await Contact.findById(req.params.id);

    if (!contact) {
      res.status(404);
      throw new Error('Contact not found');
    }

    if (contact.user.toString() !== req.user._id.toString()) {
      res.status(403);
      throw new Error('Not your contact');
    }

    await contact.deleteOne();

    res.json({ message: 'Contact removed', id: req.params.id });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getContacts,
  getContactById,
  createContact,
  updateContact,
  deleteContact,
  exportContacts,
  getAnalytics,
};
