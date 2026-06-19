const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');
const User = require('../models/User');

/**
 * Protect routes - verifies JWT from cookie or Authorization header
 */
const protect = asyncHandler(async (req, res, next) => {
  let token;

  if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  } else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    res.status(401);
    throw new Error('Not authorized. Please log in to access this resource.');
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id);
    if (!user) {
      res.status(401);
      throw new Error('User belonging to this token no longer exists.');
    }

    if (!user.isActive) {
      res.status(403);
      throw new Error('Your account has been deactivated. Please contact support.');
    }

    if (user.changedPasswordAfter(decoded.iat)) {
      res.status(401);
      throw new Error('Password was recently changed. Please log in again.');
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      res.status(401);
      throw new Error('Invalid or expired session. Please log in again.');
    }
    throw error;
  }
});

/**
 * Restrict access to specific roles.
 * Usage: restrictTo('admin') or restrictTo('admin', 'patient')
 */
const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      res.status(403);
      throw new Error('You do not have permission to perform this action.');
    }
    next();
  };
};

module.exports = { protect, restrictTo };
