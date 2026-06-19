const express = require('express');
const { body } = require('express-validator');
const {
  registerUser,
  loginUser,
  logoutUser,
  getMe,
  updatePassword,
  forgotPassword,
  resetPassword,
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const validate = require('../middleware/validateMiddleware');

const router = express.Router();

router.post(
  '/register',
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('A valid email is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  ],
  validate,
  registerUser
);

router.post(
  '/login',
  [
    body('email').isEmail().withMessage('A valid email is required'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  validate,
  loginUser
);

router.post('/logout', logoutUser);
router.get('/me', protect, getMe);

router.put(
  '/update-password',
  protect,
  [
    body('currentPassword').notEmpty().withMessage('Current password is required'),
    body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters'),
  ],
  validate,
  updatePassword
);

router.post(
  '/forgot-password',
  [body('email').isEmail().withMessage('A valid email is required')],
  validate,
  forgotPassword
);

router.put(
  '/reset-password/:token',
  [body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')],
  validate,
  resetPassword
);

module.exports = router;
