const express = require('express');
const { body } = require('express-validator');
const {
  bookAppointment,
  getMyAppointments,
  getAllAppointments,
  getAppointmentById,
  updateAppointmentStatus,
  cancelMyAppointment,
  getTodaysAppointments,
} = require('../controllers/appointmentController');
const { protect, restrictTo } = require('../middleware/authMiddleware');
const validate = require('../middleware/validateMiddleware');

const router = express.Router();

router.use(protect);

router.post(
  '/',
  restrictTo('patient'),
  [
    body('doctorId').notEmpty().withMessage('Doctor is required'),
    body('appointmentDate').isISO8601().withMessage('A valid appointment date is required'),
    body('timeSlot').notEmpty().withMessage('Time slot is required'),
    body('reasonForVisit').trim().notEmpty().withMessage('Reason for visit is required'),
  ],
  validate,
  bookAppointment
);

router.get('/my', restrictTo('patient'), getMyAppointments);
router.put('/:id/cancel', restrictTo('patient'), cancelMyAppointment);

router.get('/', restrictTo('admin'), getAllAppointments);
router.get('/admin/today', restrictTo('admin'), getTodaysAppointments);
router.put('/:id/status', restrictTo('admin'), updateAppointmentStatus);

router.get('/:id', getAppointmentById); // owner-or-admin check happens in controller

module.exports = router;
