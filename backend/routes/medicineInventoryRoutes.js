const express = require('express');
const { body } = require('express-validator');
const {
  getInventory,
  createInventoryItem,
  updateInventoryItem,
} = require('../controllers/medicineInventoryController');
const { protect, restrictTo } = require('../middleware/authMiddleware');
const validate = require('../middleware/validateMiddleware');

const router = express.Router();
const pharmacyStaff = restrictTo('admin', 'pharmacist');
const inventoryValidation = [
  body('medicineName').trim().notEmpty().withMessage('Medicine name is required').isLength({ max: 120 }),
  body('category').optional().trim().isLength({ max: 80 }),
  body('batchNumber').optional().trim().isLength({ max: 80 }),
  body('quantity').isInt({ min: 0 }).withMessage('Stock quantity must be a non-negative whole number'),
  body('unit').optional().trim().isLength({ max: 30 }),
  body('reorderLevel').isInt({ min: 0 }).withMessage('Reorder level must be a non-negative whole number'),
  body('expiryDate').optional({ values: 'falsy' }).isISO8601().withMessage('Enter a valid expiry date'),
  body('supplier').optional().trim().isLength({ max: 120 }),
];

router.use(protect, pharmacyStaff);
router.get('/', getInventory);
router.post('/', inventoryValidation, validate, createInventoryItem);
router.put('/:id', inventoryValidation, validate, updateInventoryItem);

module.exports = router;
