const express = require('express');
const { body } = require('express-validator');
const {
  getDoctors,
  getDoctorsAdmin,
  getDepartments,
  getDoctorById,
  createDoctor,
  updateDoctor,
  deleteDoctor,
  getAvailableSlots,
} = require('../controllers/doctorController');
const { protect, restrictTo } = require('../middleware/authMiddleware');
const validate = require('../middleware/validateMiddleware');

const router = express.Router();

// Public routes
router.get('/', getDoctors);
router.get('/departments', getDepartments);
router.get('/:id', getDoctorById);
router.get('/:id/available-slots', getAvailableSlots);

// Admin routes
router.get('/admin/all', protect, restrictTo('admin'), getDoctorsAdmin);

router.post(
  '/',
  protect,
  restrictTo('admin'),
  [
    body('name').trim().notEmpty().withMessage('Doctor name is required'),
    body('email').isEmail().withMessage('A valid email is required'),
    body('specialization').trim().notEmpty().withMessage('Specialization is required'),
    body('department').trim().notEmpty().withMessage('Department is required'),
    body('consultationFee').isFloat({ min: 0 }).withMessage('Consultation fee must be a positive number'),
  ],
  validate,
  createDoctor
);

router.put('/:id', protect, restrictTo('admin'), updateDoctor);
router.delete('/:id', protect, restrictTo('admin'), deleteDoctor);

module.exports = router;
