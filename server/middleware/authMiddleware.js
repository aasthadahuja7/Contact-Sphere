const jwt = require('jsonwebtoken');
const User = require('../models/User');

// middleware to protect private routes
const protect = async (req, res, next) => {
  let token = null;

  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  }

  if (!token) {
    res.status(401);
    throw new Error('No token — access denied');
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select('-password');

    if (!req.user) {
      res.status(401);
      throw new Error('User no longer exists');
    }

    next();
  } catch (err) {
    res.status(401);
    throw new Error('Token check failed, please log in again');
  }
};

module.exports = { protect };
