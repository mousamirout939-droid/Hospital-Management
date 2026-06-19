const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const Doctor = require('../models/Doctor');
const Appointment = require('../models/Appointment');
const Invoice = require('../models/Invoice');
const LabReport = require('../models/LabReport');
const Prescription = require('../models/Prescription');

/**
 * @desc    Get admin dashboard summary (counts, revenue, recent activity)
 * @route   GET /api/dashboard/admin
 * @access  Private/Admin
 */
const getAdminDashboard = asyncHandler(async (req, res) => {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const endOfToday = new Date();
  endOfToday.setHours(23, 59, 59, 999);

  const [
    totalPatients,
    totalDoctors,
    totalAppointments,
    todaysAppointments,
    pendingAppointments,
    totalRevenueAgg,
    pendingLabReports,
    activePrescriptions,
    recentAppointments,
  ] = await Promise.all([
    User.countDocuments({ role: 'patient' }),
    Doctor.countDocuments({ isActive: true }),
    Appointment.countDocuments(),
    Appointment.countDocuments({ appointmentDate: { $gte: startOfToday, $lte: endOfToday } }),
    Appointment.countDocuments({ status: 'pending' }),
    Invoice.aggregate([
      { $match: { paymentStatus: 'paid' } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } },
    ]),
    LabReport.countDocuments({ status: { $ne: 'completed' } }),
    Prescription.countDocuments({ status: 'active' }),
    Appointment.find()
      .populate('doctor', 'name specialization')
      .populate('patient', 'name')
      .sort({ createdAt: -1 })
      .limit(5),
  ]);

  const appointmentsByStatus = await Appointment.aggregate([
    { $group: { _id: '$status', count: { $sum: 1 } } },
  ]);

  res.status(200).json({
    success: true,
    data: {
      totalPatients,
      totalDoctors,
      totalAppointments,
      todaysAppointments,
      pendingAppointments,
      totalRevenue: totalRevenueAgg[0]?.total || 0,
      pendingLabReports,
      activePrescriptions,
      recentAppointments,
      appointmentsByStatus,
    },
  });
});

/**
 * @desc    Get patient dashboard summary (their own stats)
 * @route   GET /api/dashboard/patient
 * @access  Private/Patient
 */
const getPatientDashboard = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const [
    upcomingAppointments,
    totalAppointments,
    activePrescriptions,
    pendingLabReports,
    unpaidInvoices,
    nextAppointment,
  ] = await Promise.all([
    Appointment.countDocuments({
      patient: userId,
      status: { $in: ['pending', 'confirmed'] },
      appointmentDate: { $gte: new Date() },
    }),
    Appointment.countDocuments({ patient: userId }),
    Prescription.countDocuments({ patient: userId, status: 'active' }),
    LabReport.countDocuments({ patient: userId, status: { $ne: 'completed' } }),
    Invoice.countDocuments({ patient: userId, paymentStatus: { $in: ['unpaid', 'partially-paid'] } }),
    Appointment.findOne({
      patient: userId,
      status: { $in: ['pending', 'confirmed'] },
      appointmentDate: { $gte: new Date() },
    })
      .populate('doctor', 'name specialization photo')
      .sort({ appointmentDate: 1 }),
  ]);

  res.status(200).json({
    success: true,
    data: {
      upcomingAppointments,
      totalAppointments,
      activePrescriptions,
      pendingLabReports,
      unpaidInvoices,
      nextAppointment,
    },
  });
});

module.exports = { getAdminDashboard, getPatientDashboard };
