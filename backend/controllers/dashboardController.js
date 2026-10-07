const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const Doctor = require('../models/Doctor');
const Appointment = require('../models/Appointment');
const Invoice = require('../models/Invoice');
const LabReport = require('../models/LabReport');
const Prescription = require('../models/Prescription');

const getDayBounds = (date = new Date()) => {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { start, end };
};

const monthKey = (date) => `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
const dayKey = (date) => date.toISOString().slice(0, 10);

const getMonthlyBuckets = (count) => {
  const buckets = [];
  const now = new Date();
  for (let offset = count - 1; offset >= 0; offset -= 1) {
    const date = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - offset, 1));
    buckets.push({ key: monthKey(date), label: date.toLocaleDateString('en-US', { month: 'short', timeZone: 'UTC' }) });
  }
  return buckets;
};

const getRecentDays = (count) => {
  const today = new Date();
  const utcToday = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
  return Array.from({ length: count }, (_, index) => {
    const date = new Date(utcToday);
    date.setUTCDate(utcToday.getUTCDate() - (count - index - 1));
    return { key: dayKey(date), label: date.toLocaleDateString('en-US', { weekday: 'short', timeZone: 'UTC' }) };
  });
};

const getAdminDashboard = asyncHandler(async (req, res) => {
  const { start: todayStart, end: tomorrowStart } = getDayBounds();
  const months = getMonthlyBuckets(6);
  const firstMonth = new Date(`${months[0].key}-01T00:00:00.000Z`);
  const days = getRecentDays(7);
  const firstDay = new Date(`${days[0].key}T00:00:00.000Z`);
  const chartEnd = new Date(`${days[days.length - 1].key}T00:00:00.000Z`);
  chartEnd.setUTCDate(chartEnd.getUTCDate() + 1);

  const [
    totalPatients,
    totalDoctors,
    totalAppointments,
    todaysAppointments,
    pendingAppointments,
    todaysRevenueAgg,
    todaysLegacyRevenueAgg,
    paymentHistoryRevenueAgg,
    legacyTotalRevenueAgg,
    pendingLabReports,
    activePrescriptions,
    recentAppointments,
    patientGrowthAgg,
    revenueTrendAgg,
    legacyRevenueTrendAgg,
    departmentAgg,
    appointmentTrendAgg,
  ] = await Promise.all([
    User.countDocuments({ role: 'patient' }),
    Doctor.countDocuments({ isActive: true }),
    Appointment.countDocuments(),
    Appointment.countDocuments({ appointmentDate: { $gte: todayStart, $lt: tomorrowStart } }),
    Appointment.countDocuments({ status: 'pending' }),
    Invoice.aggregate([
      { $unwind: '$paymentHistory' },
      { $match: { 'paymentHistory.recordedAt': { $gte: todayStart, $lt: tomorrowStart } } },
      { $group: { _id: null, total: { $sum: '$paymentHistory.amount' } } },
    ]),
    Invoice.aggregate([
      {
        $match: {
          $or: [{ paymentHistory: { $exists: false } }, { paymentHistory: { $size: 0 } }],
          paymentStatus: 'paid',
          paidAt: { $gte: todayStart, $lt: tomorrowStart },
        },
      },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } },
    ]),
    Invoice.aggregate([
      { $unwind: '$paymentHistory' },
      { $group: { _id: null, total: { $sum: '$paymentHistory.amount' } } },
    ]),
    Invoice.aggregate([
      {
        $match: {
          $or: [{ paymentHistory: { $exists: false } }, { paymentHistory: { $size: 0 } }],
          paymentStatus: 'paid',
        },
      },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } },
    ]),
    LabReport.countDocuments({ status: { $ne: 'completed' } }),
    Prescription.countDocuments({ status: 'active' }),
    Appointment.find()
      .populate('doctor', 'name specialization')
      .populate('patient', 'name')
      .sort({ createdAt: -1 })
      .limit(5),
    User.aggregate([
      { $match: { role: 'patient', createdAt: { $gte: firstMonth } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } }, count: { $sum: 1 } } },
    ]),
    Invoice.aggregate([
      { $unwind: '$paymentHistory' },
      { $match: { 'paymentHistory.recordedAt': { $gte: firstMonth } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m', date: '$paymentHistory.recordedAt' } }, total: { $sum: '$paymentHistory.amount' } } },
    ]),
    Invoice.aggregate([
      {
        $match: {
          $or: [{ paymentHistory: { $exists: false } }, { paymentHistory: { $size: 0 } }],
          paymentStatus: 'paid',
          paidAt: { $gte: firstMonth },
        },
      },
      { $group: { _id: { $dateToString: { format: '%Y-%m', date: '$paidAt' } }, total: { $sum: '$totalAmount' } } },
    ]),
    Appointment.aggregate([
      { $match: { appointmentDate: { $gte: firstMonth, $lt: new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth() + 1, 1)) } } },
      { $lookup: { from: Doctor.collection.name, localField: 'doctor', foreignField: '_id', as: 'doctorInfo' } },
      { $unwind: { path: '$doctorInfo', preserveNullAndEmptyArrays: true } },
      { $group: { _id: { $ifNull: ['$doctorInfo.department', 'Unassigned'] }, appointments: { $sum: 1 } } },
      { $sort: { appointments: -1 } },
      { $limit: 6 },
    ]),
    Appointment.aggregate([
      { $match: { appointmentDate: { $gte: firstDay, $lt: chartEnd } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$appointmentDate' } }, count: { $sum: 1 } } },
    ]),
  ]);

  const patientGrowth = new Map(patientGrowthAgg.map((item) => [item._id, item.count]));
  const revenueTrend = new Map();
  for (const item of [...legacyRevenueTrendAgg, ...revenueTrendAgg]) {
    revenueTrend.set(item._id, (revenueTrend.get(item._id) || 0) + item.total);
  }
  const appointmentTrend = new Map(appointmentTrendAgg.map((item) => [item._id, item.count]));
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
      totalRevenue: (paymentHistoryRevenueAgg[0]?.total || 0) + (legacyTotalRevenueAgg[0]?.total || 0),
      todaysRevenue: (todaysRevenueAgg[0]?.total || 0) + (todaysLegacyRevenueAgg[0]?.total || 0),
      bedOccupancy: null,
      bedOccupancyUnavailableReason: 'Bed capacity and occupancy are not yet tracked in the system.',
      pendingLabReports,
      activePrescriptions,
      recentAppointments,
      appointmentsByStatus,
      charts: {
        patientGrowth: months.map((month) => ({ ...month, value: patientGrowth.get(month.key) || 0 })),
        revenue: months.map((month) => ({ ...month, value: revenueTrend.get(month.key) || 0 })),
        departmentPerformance: departmentAgg.map((item) => ({ label: item._id, value: item.appointments })),
        appointmentTrends: days.map((day) => ({ ...day, value: appointmentTrend.get(day.key) || 0 })),
        bedOccupancy: [],
      },
    },
  });
});

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

const getDoctorDashboard = asyncHandler(async (req, res) => {
  const doctorProfile = await Doctor.findOne({ user: req.user.id }).select('_id name');
  if (!doctorProfile) {
    res.status(404);
    throw new Error('Your doctor profile is not linked to your account.');
  }

  const { start, end } = getDayBounds();
  const filter = { doctor: doctorProfile._id, appointmentDate: { $gte: start, $lt: end } };
  const [todaysAppointments, waitingPatients, completedAppointments, upcomingAppointments] = await Promise.all([
    Appointment.countDocuments(filter),
    Appointment.countDocuments({ ...filter, status: { $in: ['pending', 'confirmed'] } }),
    Appointment.countDocuments({ ...filter, status: 'completed' }),
    Appointment.find({ ...filter, status: { $in: ['pending', 'confirmed'] } })
      .populate('patient', 'name phone')
      .sort({ timeSlot: 1 })
      .limit(8),
  ]);

  res.status(200).json({
    success: true,
    data: { todaysAppointments, waitingPatients, completedAppointments, upcomingAppointments },
  });
});

const getReceptionDashboard = asyncHandler(async (req, res) => {
  const { start, end } = getDayBounds();
  const [totalPatients, todaysAppointments, waitingPatients, unpaidInvoices, queue] = await Promise.all([
    User.countDocuments({ role: 'patient' }),
    Appointment.countDocuments({ appointmentDate: { $gte: start, $lt: end } }),
    Appointment.countDocuments({
      appointmentDate: { $gte: start, $lt: end },
      status: { $in: ['pending', 'confirmed'] },
    }),
    Invoice.countDocuments({ paymentStatus: { $in: ['unpaid', 'partially-paid'] } }),
    Appointment.find({
      appointmentDate: { $gte: start, $lt: end },
      status: { $in: ['pending', 'confirmed'] },
    })
      .populate('patient', 'name phone')
      .populate('doctor', 'name department')
      .sort({ tokenNumber: 1, timeSlot: 1 })
      .limit(10),
  ]);

  res.status(200).json({
    success: true,
    data: { totalPatients, todaysAppointments, waitingPatients, unpaidInvoices, queue },
  });
});

const getPharmacistDashboard = asyncHandler(async (req, res) => {
  const { start, end } = getDayBounds();
  const [activePrescriptions, dispensedToday, queue] = await Promise.all([
    Prescription.countDocuments({ status: 'active' }),
    Prescription.countDocuments({ status: 'fulfilled', updatedAt: { $gte: start, $lt: end } }),
    Prescription.find({ status: 'active' })
      .populate('patient', 'name phone')
      .populate('doctor', 'name')
      .sort({ issuedDate: 1 })
      .limit(10),
  ]);

  res.status(200).json({
    success: true,
    data: {
      activePrescriptions,
      dispensedToday,
      queue,
      inventoryConfigured: false,
      inventoryMessage: 'Medicine stock and expiry tracking are not yet configured.',
    },
  });
});

const getLabTechnicianDashboard = asyncHandler(async (req, res) => {
  const [pendingTests, inProgressTests, completedTests, queue] = await Promise.all([
    LabReport.countDocuments({ status: 'pending' }),
    LabReport.countDocuments({ status: 'in-progress' }),
    LabReport.countDocuments({ status: 'completed' }),
    LabReport.find({ status: { $in: ['pending', 'in-progress'] } })
      .populate('patient', 'name')
      .populate('doctor', 'name')
      .sort({ reportDate: 1 })
      .limit(10),
  ]);

  res.status(200).json({
    success: true,
    data: { pendingTests, inProgressTests, completedTests, queue },
  });
});

module.exports = {
  getAdminDashboard,
  getPatientDashboard,
  getDoctorDashboard,
  getReceptionDashboard,
  getPharmacistDashboard,
  getLabTechnicianDashboard,
};
