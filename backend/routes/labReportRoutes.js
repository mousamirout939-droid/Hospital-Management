const express = require('express');
const { body } = require('express-validator');
const {
  createLabReport,
  getMyLabReports,
  getPatientLabReports,
  getAllLabReports,
  getLabReportById,
  updateLabReport,
  deleteLabReport,
} = require('../controllers/labReportController');
const { protect, restrictTo } = require('../middleware/authMiddleware');
const validate = require('../middleware/validateMiddleware');

const router = express.Router();

router.use(protect);

router.get('/my', restrictTo('patient'), getMyLabReports);

router.post(
  '/',
  restrictTo('admin'),
  [
    body('patient').notEmpty().withMessage('Patient is required'),
    body('testName').trim().notEmpty().withMessage('Test name is required'),
  ],
  validate,
  createLabReport
);

router.get('/patient/:patientId', restrictTo('admin'), getPatientLabReports);
router.get('/', restrictTo('admin'), getAllLabReports);
router.put('/:id', restrictTo('admin'), updateLabReport);
router.delete('/:id', restrictTo('admin'), deleteLabReport);

router.get('/:id', getLabReportById); // owner-or-admin check happens in controller

module.exports = router;
