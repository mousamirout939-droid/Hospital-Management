const express = require('express');
const { body } = require('express-validator');
const {
  updateMyProfile,
  getAllPatients,
  getPatientById,
  updatePatientStatus,
  getAdminStats,
  createStaffAccount,
  searchPatients,
  createPatientAccount,
} = require('../controllers/userController');
const { protect, restrictTo } = require('../middleware/authMiddleware');
const validate = require('../middleware/validateMiddleware');

const router = express.Router();

router.use(protect);

router.put(
  '/profile',
  [body('name').optional().trim().notEmpty().withMessage('Name cannot be empty')],
  validate,
  updateMyProfile
);

// Admin-only routes
router.post(
  '/staff',
  restrictTo('admin'),
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('A valid email is required'),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
    body('role').isIn(['receptionist', 'pharmacist', 'lab-technician']).withMessage('Choose a valid staff role'),
  ],
  validate,
  createStaffAccount
);
router.get('/patients', restrictTo('admin', 'receptionist'), getAllPatients);
router.get('/patient-search', restrictTo('admin', 'receptionist'), searchPatients);
router.post(
  '/patients',
  restrictTo('admin', 'receptionist'),
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('A valid email is required'),
    body('password').isLength({ min: 8 }).withMessage('Temporary password must be at least 8 characters'),
  ],
  validate,
  createPatientAccount
);
router.get('/patients/:id', restrictTo('admin'), getPatientById);
router.put('/patients/:id/status', restrictTo('admin'), updatePatientStatus);
router.get('/admin/stats', restrictTo('admin'), getAdminStats);

module.exports = router;
