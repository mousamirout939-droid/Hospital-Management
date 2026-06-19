const express = require('express');
const { body } = require('express-validator');
const {
  updateMyProfile,
  getAllPatients,
  getPatientById,
  updatePatientStatus,
  getAdminStats,
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
router.get('/patients', restrictTo('admin'), getAllPatients);
router.get('/patients/:id', restrictTo('admin'), getPatientById);
router.put('/patients/:id/status', restrictTo('admin'), updatePatientStatus);
router.get('/admin/stats', restrictTo('admin'), getAdminStats);

module.exports = router;
