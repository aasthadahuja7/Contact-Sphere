const User = require('../models/User');
const jwt = require('jsonwebtoken');

const makeToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });

// POST /api/auth/register
const registerUser = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      res.status(400);
      throw new Error('Please fill in all fields');
    }

    const existing = await User.findOne({ email });
    if (existing) {
      res.status(400);
      throw new Error('An account with that email already exists');
    }

    const user = await User.create({ name, email, password });

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      token: makeToken(user._id),
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/auth/login
const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400);
      throw new Error('Email and password are required');
    }

    const user = await User.findOne({ email });
    const pwMatch = user && (await user.matchPassword(password));

    if (!pwMatch) {
      res.status(401);
      throw new Error('Wrong email or password');
    }

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      token: makeToken(user._id),
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/auth/me  (protected)
const getMe = async (req, res) => {
  res.json(req.user);
};

module.exports = { registerUser, loginUser, getMe };
