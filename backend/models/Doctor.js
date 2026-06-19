const mongoose = require('mongoose');

const availabilitySlotSchema = new mongoose.Schema(
  {
    day: {
      type: String,
      enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
      required: true,
    },
    startTime: { type: String, required: true }, // "09:00"
    endTime: { type: String, required: true }, // "17:00"
  },
  { _id: false }
);

const doctorSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Doctor name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    },
    phone: {
      type: String,
      trim: true,
      default: '',
    },
    specialization: {
      type: String,
      required: [true, 'Specialization is required'],
      trim: true,
    },
    department: {
      type: String,
      required: [true, 'Department is required'],
      trim: true,
    },
    qualification: {
      type: String,
      default: '',
    },
    experienceYears: {
      type: Number,
      default: 0,
      min: 0,
    },
    consultationFee: {
      type: Number,
      required: [true, 'Consultation fee is required'],
      min: 0,
    },
    bio: {
      type: String,
      default: '',
      maxlength: 1000,
    },
    photo: {
      type: String,
      default: '',
    },
    availability: {
      type: [availabilitySlotSchema],
      default: [],
    },
    slotDurationMinutes: {
      type: Number,
      default: 30,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
  },
  { timestamps: true }
);

doctorSchema.index({ department: 1 });
doctorSchema.index({ specialization: 1 });
doctorSchema.index({ name: 'text', specialization: 'text', department: 'text' });

module.exports = mongoose.model('Doctor', doctorSchema);
