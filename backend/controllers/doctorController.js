const asyncHandler = require('express-async-handler');
const Doctor = require('../models/Doctor');
const Appointment = require('../models/Appointment');
const { getPagination, buildPaginationMeta } = require('../utils/helpers');

/**
 * @desc    Get all doctors (public list with search/filter/pagination)
 * @route   GET /api/doctors
 * @access  Public
 */
const getDoctors = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const { search, department, specialization } = req.query;

  const filter = { isActive: true };
  if (department) filter.department = department;
  if (specialization) filter.specialization = specialization;
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { specialization: { $regex: search, $options: 'i' } },
      { department: { $regex: search, $options: 'i' } },
    ];
  }

  const [doctors, totalCount] = await Promise.all([
    Doctor.find(filter).sort({ name: 1 }).skip(skip).limit(limit),
    Doctor.countDocuments(filter),
  ]);

  res.status(200).json({
    success: true,
    data: doctors,
    pagination: buildPaginationMeta(totalCount, page, limit),
  });
});

/**
 * @desc    Get all doctors including inactive ones (admin management view)
 * @route   GET /api/doctors/admin/all
 * @access  Private/Admin
 */
const getDoctorsAdmin = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const { search } = req.query;

  const filter = {};
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { specialization: { $regex: search, $options: 'i' } },
      { department: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
    ];
  }

  const [doctors, totalCount] = await Promise.all([
    Doctor.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Doctor.countDocuments(filter),
  ]);

  res.status(200).json({
    success: true,
    data: doctors,
    pagination: buildPaginationMeta(totalCount, page, limit),
  });
});

/**
 * @desc    Get list of distinct departments
 * @route   GET /api/doctors/departments
 * @access  Public
 */
const getDepartments = asyncHandler(async (req, res) => {
  const departments = await Doctor.distinct('department', { isActive: true });
  res.status(200).json({ success: true, data: departments });
});

/**
 * @desc    Get a single doctor by id
 * @route   GET /api/doctors/:id
 * @access  Public
 */
const getDoctorById = asyncHandler(async (req, res) => {
  const doctor = await Doctor.findById(req.params.id);

  if (!doctor) {
    res.status(404);
    throw new Error('Doctor not found');
  }

  res.status(200).json({ success: true, data: doctor });
});

/**
 * @desc    Create a new doctor profile
 * @route   POST /api/doctors
 * @access  Private/Admin
 */
const createDoctor = asyncHandler(async (req, res) => {
  const doctor = await Doctor.create(req.body);
  res.status(201).json({ success: true, data: doctor });
});

/**
 * @desc    Update doctor profile
 * @route   PUT /api/doctors/:id
 * @access  Private/Admin
 */
const updateDoctor = asyncHandler(async (req, res) => {
  const doctor = await Doctor.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  if (!doctor) {
    res.status(404);
    throw new Error('Doctor not found');
  }

  res.status(200).json({ success: true, data: doctor });
});

/**
 * @desc    Delete (deactivate) a doctor
 * @route   DELETE /api/doctors/:id
 * @access  Private/Admin
 */
const deleteDoctor = asyncHandler(async (req, res) => {
  const doctor = await Doctor.findById(req.params.id);

  if (!doctor) {
    res.status(404);
    throw new Error('Doctor not found');
  }

  const hasUpcomingAppointments = await Appointment.exists({
    doctor: doctor._id,
    appointmentDate: { $gte: new Date() },
    status: { $in: ['pending', 'confirmed'] },
  });

  if (hasUpcomingAppointments) {
    // Soft delete to preserve appointment history integrity
    doctor.isActive = false;
    await doctor.save();
    return res.status(200).json({
      success: true,
      message: 'Doctor has upcoming appointments, so the profile was deactivated instead of deleted.',
      data: doctor,
    });
  }

  await doctor.deleteOne();
  res.status(200).json({ success: true, message: 'Doctor deleted successfully' });
});

/**
 * @desc    Get available time slots for a doctor on a given date
 * @route   GET /api/doctors/:id/available-slots?date=YYYY-MM-DD
 * @access  Public
 */
const getAvailableSlots = asyncHandler(async (req, res) => {
  const { date } = req.query;

  if (!date) {
    res.status(400);
    throw new Error('A date query parameter is required (YYYY-MM-DD)');
  }

  const doctor = await Doctor.findById(req.params.id);
  if (!doctor) {
    res.status(404);
    throw new Error('Doctor not found');
  }

  const requestedDate = new Date(date);
  const dayName = requestedDate.toLocaleDateString('en-US', { weekday: 'long' });

  const dayAvailability = doctor.availability.filter((slot) => slot.day === dayName);

  if (dayAvailability.length === 0) {
    return res.status(200).json({ success: true, data: [] });
  }

  // Generate slots based on duration
  const allSlots = [];
  const duration = doctor.slotDurationMinutes || 30;

  dayAvailability.forEach(({ startTime, endTime }) => {
    let [startH, startM] = startTime.split(':').map(Number);
    const [endH, endM] = endTime.split(':').map(Number);

    let current = startH * 60 + startM;
    const end = endH * 60 + endM;

    while (current + duration <= end) {
      const slotStartH = Math.floor(current / 60);
      const slotStartM = current % 60;
      const slotEndMinutes = current + duration;
      const slotEndH = Math.floor(slotEndMinutes / 60);
      const slotEndM = slotEndMinutes % 60;

      const format = (h, m) => `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
      allSlots.push(`${format(slotStartH, slotStartM)} - ${format(slotEndH, slotEndM)}`);
      current += duration;
    }
  });

  // Filter out already booked slots for that date
  const startOfDay = new Date(requestedDate);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(requestedDate);
  endOfDay.setHours(23, 59, 59, 999);

  const bookedAppointments = await Appointment.find({
    doctor: doctor._id,
    appointmentDate: { $gte: startOfDay, $lte: endOfDay },
    status: { $in: ['pending', 'confirmed'] },
  }).select('timeSlot');

  const bookedSlots = new Set(bookedAppointments.map((a) => a.timeSlot));
  const availableSlots = allSlots.filter((slot) => !bookedSlots.has(slot));

  res.status(200).json({ success: true, data: availableSlots });
});

module.exports = {
  getDoctors,
  getDoctorsAdmin,
  getDepartments,
  getDoctorById,
  createDoctor,
  updateDoctor,
  deleteDoctor,
  getAvailableSlots,
};
