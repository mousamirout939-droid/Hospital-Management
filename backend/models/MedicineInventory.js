const mongoose = require('mongoose');

const medicineInventorySchema = new mongoose.Schema(
  {
    medicineName: {
      type: String,
      required: [true, 'Medicine name is required'],
      trim: true,
      maxlength: 120,
    },
    category: {
      type: String,
      trim: true,
      maxlength: 80,
      default: 'General',
    },
    batchNumber: {
      type: String,
      trim: true,
      maxlength: 80,
      default: '',
    },
    quantity: {
      type: Number,
      required: true,
      min: 0,
      validate: { validator: Number.isInteger, message: 'Stock quantity must be a whole number' },
    },
    unit: {
      type: String,
      trim: true,
      maxlength: 30,
      default: 'units',
    },
    reorderLevel: {
      type: Number,
      min: 0,
      default: 10,
      validate: { validator: Number.isInteger, message: 'Reorder level must be a whole number' },
    },
    expiryDate: {
      type: Date,
      default: null,
    },
    supplier: {
      type: String,
      trim: true,
      maxlength: 120,
      default: '',
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

medicineInventorySchema.index({ medicineName: 1, expiryDate: 1 });

module.exports = mongoose.model('MedicineInventory', medicineInventorySchema);
