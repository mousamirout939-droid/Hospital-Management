const mongoose = require('mongoose');

const invoiceItemSchema = new mongoose.Schema(
  {
    description: { type: String, required: true }, // e.g. "Consultation Fee", "Lab Test - CBC"
    quantity: { type: Number, default: 1, min: 1 },
    unitPrice: { type: Number, required: true, min: 0 },
    total: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const invoiceSchema = new mongoose.Schema(
  {
    invoiceNumber: {
      type: String,
      unique: true,
      required: true,
    },
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    doctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Doctor',
    },
    appointment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Appointment',
    },
    items: {
      type: [invoiceItemSchema],
      validate: {
        validator: (arr) => Array.isArray(arr) && arr.length > 0,
        message: 'At least one billing item is required',
      },
    },
    subtotal: {
      type: Number,
      required: true,
      min: 0,
    },
    taxPercent: {
      type: Number,
      default: 0,
      min: 0,
    },
    taxAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    discount: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    paymentMethod: {
      type: String,
      enum: ['cash', 'card', 'insurance', 'upi', 'bank-transfer', 'pending'],
      default: 'pending',
    },
    paymentStatus: {
      type: String,
      enum: ['unpaid', 'paid', 'partially-paid', 'refunded'],
      default: 'unpaid',
    },
    paidAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    dueDate: {
      type: Date,
    },
    paidAt: {
      type: Date,
    },
    notes: {
      type: String,
      default: '',
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

invoiceSchema.index({ patient: 1, createdAt: -1 });
invoiceSchema.index({ paymentStatus: 1 });

module.exports = mongoose.model('Invoice', invoiceSchema);
