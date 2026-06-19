const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema(
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
    appointmentDate: {
      type: Date,
      required: [true, 'Appointment date is required'],
    },
    timeSlot: {
      type: String,
      required: [true, 'Time slot is required'], // e.g. "10:00 - 10:30"
    },
    reasonForVisit: {
      type: String,
      required: [true, 'Reason for visit is required'],
      maxlength: 500,
    },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'completed', 'cancelled', 'no-show'],
      default: 'pending',
    },
    notes: {
      type: String,
      default: '',
    },
    cancellationReason: {
      type: String,
      default: '',
    },
    cancelledBy: {
      type: String,
      enum: ['patient', 'admin', ''],
      default: '',
    },
    consultationFee: {
      type: Number,
      default: 0,
    },
    isPaid: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

appointmentSchema.index({ doctor: 1, appointmentDate: 1, timeSlot: 1 });
appointmentSchema.index({ patient: 1, appointmentDate: -1 });
appointmentSchema.index({ status: 1 });

module.exports = mongoose.model('Appointment', appointmentSchema);
