const mongoose = require('mongoose');

const testParameterSchema = new mongoose.Schema(
  {
    parameterName: { type: String, required: true }, // e.g. "Hemoglobin"
    result: { type: String, required: true }, // e.g. "13.5"
    unit: { type: String, default: '' }, // e.g. "g/dL"
    normalRange: { type: String, default: '' }, // e.g. "13.0 - 17.0"
    flag: {
      type: String,
      enum: ['normal', 'low', 'high', ''],
      default: '',
    },
  },
  { _id: false }
);

const labReportSchema = new mongoose.Schema(
  {
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
    testName: {
      type: String,
      required: [true, 'Test name is required'], // e.g. "Complete Blood Count"
    },
    testType: {
      type: String,
      default: 'General',
    },
    sampleCollectedAt: {
      type: Date,
    },
    reportDate: {
      type: Date,
      default: Date.now,
    },
    parameters: {
      type: [testParameterSchema],
      default: [],
    },
    summary: {
      type: String,
      default: '',
    },
    fileUrl: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['pending', 'in-progress', 'completed'],
      default: 'pending',
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

labReportSchema.index({ patient: 1, reportDate: -1 });

module.exports = mongoose.model('LabReport', labReportSchema);
