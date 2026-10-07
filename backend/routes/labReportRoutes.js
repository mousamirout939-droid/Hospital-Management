const express = require('express');
const multer = require('multer');
const path = require('path');
const { body } = require('express-validator');
const {
  analyzeUploadedLabReport,
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
const pdfUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter: (req, file, callback) => {
    if (path.extname(file.originalname).toLowerCase() !== '.pdf' || file.mimetype !== 'application/pdf') {
      callback(new Error('Upload a PDF file no larger than 5 MB'));
      return;
    }
    callback(null, true);
  },
});

const handlePdfUpload = (req, res, next) => {
  pdfUpload.single('file')(req, res, (error) => {
    if (error) {
      res.status(error.code === 'LIMIT_FILE_SIZE' ? 413 : 400);
      next(error);
      return;
    }
    next();
  });
};

router.use(protect);

router.get('/my', restrictTo('patient'), getMyLabReports);
router.post('/analyze', restrictTo('patient'), handlePdfUpload, analyzeUploadedLabReport);

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
router.get('/', restrictTo('admin', 'lab-technician'), getAllLabReports);
router.put('/:id', restrictTo('admin', 'lab-technician'), updateLabReport);
router.delete('/:id', restrictTo('admin'), deleteLabReport);

router.get('/:id', getLabReportById); // owner-or-admin check happens in controller

module.exports = router;
