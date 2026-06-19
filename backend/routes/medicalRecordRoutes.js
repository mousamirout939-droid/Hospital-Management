const express = require('express');
const { body } = require('express-validator');
const {
  createMedicalRecord,
  getMyMedicalRecords,
  getPatientMedicalRecords,
  getMedicalRecordById,
  updateMedicalRecord,
  deleteMedicalRecord,
} = require('../controllers/medicalRecordController');
const { protect, restrictTo } = require('../middleware/authMiddleware');
const validate = require('../middleware/validateMiddleware');

const router = express.Router();

router.use(protect);

router.get('/my', restrictTo('patient'), getMyMedicalRecords);

router.post(
  '/',
  restrictTo('admin'),
  [
    body('patient').notEmpty().withMessage('Patient is required'),
    body('doctor').notEmpty().withMessage('Doctor is required'),
    body('diagnosis').trim().notEmpty().withMessage('Diagnosis is required'),
  ],
  validate,
  createMedicalRecord
);

router.get('/patient/:patientId', restrictTo('admin'), getPatientMedicalRecords);
router.put('/:id', restrictTo('admin'), updateMedicalRecord);
router.delete('/:id', restrictTo('admin'), deleteMedicalRecord);

router.get('/:id', getMedicalRecordById); // owner-or-admin check happens in controller

module.exports = router;
