const mongoose = require('mongoose');

const vitalsSchema = new mongoose.Schema(
  {
    bloodPressure: { type: String, default: '' },
    heartRate: { type: String, default: '' },
    temperature: { type: String, default: '' },
    weight: { type: String, default: '' },
    height: { type: String, default: '' },
    oxygenSaturation: { type: String, default: '' },
  },
  { _id: false }
);

const medicalRecordSchema = new mongoose.Schema(
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
    visitDate: {
      type: Date,
      default: Date.now,
    },
    diagnosis: {
      type: String,
      required: [true, 'Diagnosis is required'],
    },
    symptoms: {
      type: String,
      default: '',
    },
    treatmentPlan: {
      type: String,
      default: '',
    },
    vitals: {
      type: vitalsSchema,
      default: () => ({}),
    },
    attachments: [
      {
        fileName: String,
        fileUrl: String,
        uploadedAt: { type: Date, default: Date.now },
      },
    ],
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

medicalRecordSchema.index({ patient: 1, visitDate: -1 });

module.exports = mongoose.model('MedicalRecord', medicalRecordSchema);
