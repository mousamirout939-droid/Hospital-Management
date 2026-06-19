const mongoose = require('mongoose');

const medicineItemSchema = new mongoose.Schema(
  {
    medicineName: { type: String, required: true },
    dosage: { type: String, required: true }, // e.g. "500mg"
    frequency: { type: String, required: true }, // e.g. "Twice a day"
    duration: { type: String, required: true }, // e.g. "5 days"
    instructions: { type: String, default: '' }, // e.g. "After food"
  },
  { _id: false }
);

const prescriptionSchema = new mongoose.Schema(
  {
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    doctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Doctor',
      required: true,
    },
    appointment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Appointment',
    },
    medicalRecord: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MedicalRecord',
    },
    medicines: {
      type: [medicineItemSchema],
      validate: {
        validator: (arr) => Array.isArray(arr) && arr.length > 0,
        message: 'At least one medicine is required',
      },
    },
    additionalNotes: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['active', 'fulfilled', 'cancelled'],
      default: 'active',
    },
    issuedDate: {
      type: Date,
      default: Date.now,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

prescriptionSchema.index({ patient: 1, issuedDate: -1 });

module.exports = mongoose.model('Prescription', prescriptionSchema);
