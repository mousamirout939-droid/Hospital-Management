const express = require('express');
const { body } = require('express-validator');
const {
  createInvoice,
  getMyInvoices,
  getAllInvoices,
  getInvoiceById,
  recordPayment,
} = require('../controllers/invoiceController');
const { protect, restrictTo } = require('../middleware/authMiddleware');
const validate = require('../middleware/validateMiddleware');

const router = express.Router();

router.use(protect);

router.get('/my', restrictTo('patient'), getMyInvoices);

router.post(
  '/',
  restrictTo('admin'),
  [
    body('patient').notEmpty().withMessage('Patient is required'),
    body('items').isArray({ min: 1 }).withMessage('At least one billing item is required'),
  ],
  validate,
  createInvoice
);

router.get('/', restrictTo('admin'), getAllInvoices);
router.put('/:id/pay', restrictTo('admin'), recordPayment);

router.get('/:id', getInvoiceById); // owner-or-admin check happens in controller

module.exports = router;
