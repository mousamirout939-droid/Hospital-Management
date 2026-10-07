const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const { getPagination, buildPaginationMeta } = require('../utils/helpers');

const createStaffAccount = asyncHandler(async (req, res) => {
  const { name, email, password, role } = req.body;
  const staffRoles = ['receptionist', 'pharmacist', 'lab-technician'];

  if (!name?.trim() || !email?.trim() || !password || !staffRoles.includes(role)) {
    res.status(400);
    throw new Error('Name, email, password, and a valid staff role are required');
  }
  if (password.length < 8) {
    res.status(400);
    throw new Error('Staff passwords must contain at least 8 characters');
  }

  const normalizedEmail = email.trim().toLowerCase();
  if (await User.exists({ email: normalizedEmail })) {
    res.status(409);
    throw new Error('An account with this email already exists');
  }

  const staffUser = await User.create({
    name: name.trim(),
    email: normalizedEmail,
    password,
    role,
  });

  res.status(201).json({ success: true, data: staffUser.toSafeObject() });
});

const searchPatients = asyncHandler(async (req, res) => {
  const search = req.query.search?.trim();
  if (!search || search.length < 2) {
    return res.status(200).json({ success: true, data: [] });
  }

  const escapedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const patients = await User.find({
    role: 'patient',
    $or: [
      { name: { $regex: escapedSearch, $options: 'i' } },
      { email: { $regex: escapedSearch, $options: 'i' } },
      { phone: { $regex: escapedSearch, $options: 'i' } },
    ],
  })
    .select('name email phone')
    .sort({ name: 1 })
    .limit(8);

  res.status(200).json({ success: true, data: patients });
});

const createPatientAccount = asyncHandler(async (req, res) => {
  const { name, email, password, phone } = req.body;
  if (!name?.trim() || !email?.trim() || !password) {
    res.status(400);
    throw new Error('Name, email, and a temporary password are required');
  }
  if (password.length < 8) {
    res.status(400);
    throw new Error('Temporary password must contain at least 8 characters');
  }

  const normalizedEmail = email.trim().toLowerCase();
  if (await User.exists({ email: normalizedEmail })) {
    res.status(409);
    throw new Error('An account with this email already exists');
  }

  const patient = await User.create({
    name: name.trim(),
    email: normalizedEmail,
    password,
    phone: phone || '',
    role: 'patient',
  });

  res.status(201).json({ success: true, data: patient.toSafeObject() });
});

/**
 * @desc    Update current user's own profile
 * @route   PUT /api/users/profile
 * @access  Private
 */
const updateMyProfile = asyncHandler(async (req, res) => {
  const allowedFields = ['name', 'phone', 'gender', 'dateOfBirth', 'bloodGroup', 'address', 'avatar'];
  const updates = {};

  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) updates[field] = req.body[field];
  });

  const user = await User.findByIdAndUpdate(req.user.id, updates, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({ success: true, user: user.toSafeObject() });
});

/**
 * @desc    Get all patients (admin only) with search + pagination
 * @route   GET /api/users/patients
 * @access  Private/Admin
 */
const getAllPatients = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const { search } = req.query;

  const filter = { role: 'patient' };
  if (search) {
    const escapedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    filter.$or = [
      { name: { $regex: escapedSearch, $options: 'i' } },
      { email: { $regex: escapedSearch, $options: 'i' } },
      { phone: { $regex: escapedSearch, $options: 'i' } },
    ];
  }

  const [patients, totalCount] = await Promise.all([
    User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    User.countDocuments(filter),
  ]);

  res.status(200).json({
    success: true,
    data: patients,
    pagination: buildPaginationMeta(totalCount, page, limit),
  });
});

/**
 * @desc    Get single patient by id (admin only)
 * @route   GET /api/users/patients/:id
 * @access  Private/Admin
 */
const getPatientById = asyncHandler(async (req, res) => {
  const patient = await User.findOne({ _id: req.params.id, role: 'patient' });

  if (!patient) {
    res.status(404);
    throw new Error('Patient not found');
  }

  res.status(200).json({ success: true, data: patient });
});

/**
 * @desc    Activate / deactivate a patient account (admin only)
 * @route   PUT /api/users/patients/:id/status
 * @access  Private/Admin
 */
const updatePatientStatus = asyncHandler(async (req, res) => {
  const { isActive } = req.body;

  const patient = await User.findOneAndUpdate(
    { _id: req.params.id, role: 'patient' },
    { isActive },
    { new: true }
  );

  if (!patient) {
    res.status(404);
    throw new Error('Patient not found');
  }

  res.status(200).json({ success: true, data: patient });
});

/**
 * @desc    Get dashboard summary stats (admin only)
 * @route   GET /api/users/admin/stats
 * @access  Private/Admin
 */
const getAdminStats = asyncHandler(async (req, res) => {
  const totalPatients = await User.countDocuments({ role: 'patient' });
  const activePatients = await User.countDocuments({ role: 'patient', isActive: true });

  res.status(200).json({
    success: true,
    data: { totalPatients, activePatients },
  });
});

module.exports = {
  createStaffAccount,
  createPatientAccount,
  searchPatients,
  updateMyProfile,
  getAllPatients,
  getPatientById,
  updatePatientStatus,
  getAdminStats,
};
