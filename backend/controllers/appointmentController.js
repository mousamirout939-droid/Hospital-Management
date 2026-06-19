const asyncHandler = require('express-async-handler');
const Appointment = require('../models/Appointment');
const Doctor = require('../models/Doctor');
const { getPagination, buildPaginationMeta } = require('../utils/helpers');
const { createNotification } = require('../utils/notify');
const { sendEmail } = require('../config/email');

/**
 * @desc    Book a new appointment
 * @route   POST /api/appointments
 * @access  Private/Patient
 */
const bookAppointment = asyncHandler(async (req, res) => {
  const { doctorId, appointmentDate, timeSlot, reasonForVisit } = req.body;

  const doctor = await Doctor.findById(doctorId);
  if (!doctor || !doctor.isActive) {
    res.status(404);
    throw new Error('Doctor not found or is currently unavailable');
  }

  const requestedDate = new Date(appointmentDate);
  if (requestedDate < new Date().setHours(0, 0, 0, 0)) {
    res.status(400);
    throw new Error('Cannot book an appointment in the past');
  }

  // Prevent double-booking the same slot
  const existing = await Appointment.findOne({
    doctor: doctorId,
    appointmentDate: requestedDate,
    timeSlot,
    status: { $in: ['pending', 'confirmed'] },
  });

  if (existing) {
    res.status(400);
    throw new Error('This time slot has just been booked by someone else. Please choose another.');
  }

  const appointment = await Appointment.create({
    patient: req.user.id,
    doctor: doctorId,
    appointmentDate: requestedDate,
    timeSlot,
    reasonForVisit,
    consultationFee: doctor.consultationFee,
  });

  await createNotification({
    user: req.user.id,
    title: 'Appointment Requested',
    message: `Your appointment with Dr. ${doctor.name} on ${requestedDate.toLocaleDateString()} at ${timeSlot} has been requested and is pending confirmation.`,
    type: 'appointment-booked',
    relatedId: appointment._id,
  });

  sendEmail({
    to: req.user.email,
    subject: 'Appointment Requested - Hospital Management System',
    html: `<p>Hi ${req.user.name},</p><p>Your appointment with Dr. ${doctor.name} (${doctor.specialization}) on ${requestedDate.toLocaleDateString()} at ${timeSlot} has been requested. You will be notified once it is confirmed.</p>`,
  });

  const populated = await Appointment.findById(appointment._id)
    .populate('doctor', 'name specialization department consultationFee photo')
    .populate('patient', 'name email phone');

  res.status(201).json({ success: true, data: populated });
});

/**
 * @desc    Get current patient's own appointments
 * @route   GET /api/appointments/my
 * @access  Private/Patient
 */
const getMyAppointments = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const { status } = req.query;

  const filter = { patient: req.user.id };
  if (status) filter.status = status;

  const [appointments, totalCount] = await Promise.all([
    Appointment.find(filter)
      .populate('doctor', 'name specialization department photo consultationFee')
      .sort({ appointmentDate: -1 })
      .skip(skip)
      .limit(limit),
    Appointment.countDocuments(filter),
  ]);

  res.status(200).json({
    success: true,
    data: appointments,
    pagination: buildPaginationMeta(totalCount, page, limit),
  });
});

/**
 * @desc    Get all appointments (admin view, with filters)
 * @route   GET /api/appointments
 * @access  Private/Admin
 */
const getAllAppointments = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const { status, doctorId, date, search } = req.query;

  const filter = {};
  if (status) filter.status = status;
  if (doctorId) filter.doctor = doctorId;
  if (date) {
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);
    filter.appointmentDate = { $gte: start, $lte: end };
  }

  let query = Appointment.find(filter)
    .populate('doctor', 'name specialization department')
    .populate('patient', 'name email phone')
    .sort({ appointmentDate: -1 })
    .skip(skip)
    .limit(limit);

  let [appointments, totalCount] = await Promise.all([query, Appointment.countDocuments(filter)]);

  // Optional text search on populated patient/doctor name (post-filter since it's cross-collection)
  if (search) {
    const regex = new RegExp(search, 'i');
    appointments = appointments.filter(
      (a) => regex.test(a.patient?.name || '') || regex.test(a.doctor?.name || '')
    );
  }

  res.status(200).json({
    success: true,
    data: appointments,
    pagination: buildPaginationMeta(totalCount, page, limit),
  });
});

/**
 * @desc    Get single appointment by id
 * @route   GET /api/appointments/:id
 * @access  Private (owner patient or admin)
 */
const getAppointmentById = asyncHandler(async (req, res) => {
  const appointment = await Appointment.findById(req.params.id)
    .populate('doctor', 'name specialization department photo consultationFee')
    .populate('patient', 'name email phone');

  if (!appointment) {
    res.status(404);
    throw new Error('Appointment not found');
  }

  const isOwner = appointment.patient._id.toString() === req.user.id.toString();
  if (req.user.role !== 'admin' && !isOwner) {
    res.status(403);
    throw new Error('You do not have permission to view this appointment');
  }

  res.status(200).json({ success: true, data: appointment });
});

/**
 * @desc    Update appointment status (confirm, complete, mark no-show) - admin
 * @route   PUT /api/appointments/:id/status
 * @access  Private/Admin
 */
const updateAppointmentStatus = asyncHandler(async (req, res) => {
  const { status, notes } = req.body;

  const validStatuses = ['pending', 'confirmed', 'completed', 'cancelled', 'no-show'];
  if (!validStatuses.includes(status)) {
    res.status(400);
    throw new Error('Invalid status value');
  }

  const appointment = await Appointment.findById(req.params.id).populate('doctor', 'name');
  if (!appointment) {
    res.status(404);
    throw new Error('Appointment not found');
  }

  appointment.status = status;
  if (notes !== undefined) appointment.notes = notes;
  await appointment.save();

  const statusMessages = {
    confirmed: `Your appointment with Dr. ${appointment.doctor.name} has been confirmed.`,
    completed: `Your appointment with Dr. ${appointment.doctor.name} has been marked as completed.`,
    cancelled: `Your appointment with Dr. ${appointment.doctor.name} has been cancelled by the hospital.`,
    'no-show': `You missed your appointment with Dr. ${appointment.doctor.name}.`,
  };

  if (statusMessages[status]) {
    await createNotification({
      user: appointment.patient,
      title: 'Appointment Update',
      message: statusMessages[status],
      type: `appointment-${status === 'no-show' ? 'cancelled' : status}`,
      relatedId: appointment._id,
    });
  }

  res.status(200).json({ success: true, data: appointment });
});

/**
 * @desc    Cancel own appointment (patient)
 * @route   PUT /api/appointments/:id/cancel
 * @access  Private/Patient
 */
const cancelMyAppointment = asyncHandler(async (req, res) => {
  const appointment = await Appointment.findById(req.params.id);

  if (!appointment) {
    res.status(404);
    throw new Error('Appointment not found');
  }

  if (appointment.patient.toString() !== req.user.id.toString()) {
    res.status(403);
    throw new Error('You can only cancel your own appointments');
  }

  if (['completed', 'cancelled'].includes(appointment.status)) {
    res.status(400);
    throw new Error(`Cannot cancel an appointment that is already ${appointment.status}`);
  }

  appointment.status = 'cancelled';
  appointment.cancellationReason = req.body.reason || 'Cancelled by patient';
  appointment.cancelledBy = 'patient';
  await appointment.save();

  res.status(200).json({ success: true, data: appointment });
});

/**
 * @desc    Get upcoming appointments count / today's appointments (admin dashboard)
 * @route   GET /api/appointments/admin/today
 * @access  Private/Admin
 */
const getTodaysAppointments = asyncHandler(async (req, res) => {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date();
  end.setHours(23, 59, 59, 999);

  const appointments = await Appointment.find({
    appointmentDate: { $gte: start, $lte: end },
    status: { $in: ['pending', 'confirmed'] },
  })
    .populate('doctor', 'name specialization')
    .populate('patient', 'name phone')
    .sort({ timeSlot: 1 });

  res.status(200).json({ success: true, data: appointments });
});

module.exports = {
  bookAppointment,
  getMyAppointments,
  getAllAppointments,
  getAppointmentById,
  updateAppointmentStatus,
  cancelMyAppointment,
  getTodaysAppointments,
};
