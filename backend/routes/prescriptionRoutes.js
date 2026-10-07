const express = require('express');
const { body } = require('express-validator');
const {
  createPrescription,
  getMyPrescriptions,
  getPatientPrescriptions,
  getAllPrescriptions,
  getPrescriptionById,
  updatePrescriptionStatus,
} = require('../controllers/prescriptionController');
const { protect, restrictTo } = require('../middleware/authMiddleware');
const validate = require('../middleware/validateMiddleware');

const router = express.Router();

router.use(protect);

router.get('/my', restrictTo('patient'), getMyPrescriptions);

router.post(
  '/',
  restrictTo('admin', 'doctor'),
  [
    body('patient').notEmpty().withMessage('Patient is required'),
    body('medicines').isArray({ min: 1 }).withMessage('At least one medicine is required'),
  ],
  validate,
  createPrescription
);

router.get('/patient/:patientId', restrictTo('admin', 'doctor'), getPatientPrescriptions);
router.get('/', restrictTo('admin', 'doctor', 'pharmacist'), getAllPrescriptions);
router.put('/:id/status', restrictTo('admin', 'doctor', 'pharmacist'), updatePrescriptionStatus);

router.get('/:id', getPrescriptionById); // owner-or-admin check happens in controller

module.exports = router;
