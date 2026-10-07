const asyncHandler = require('express-async-handler');
const Prescription = require('../models/Prescription');
const Doctor = require('../models/Doctor');
const { getPagination, buildPaginationMeta } = require('../utils/helpers');
const { createNotification } = require('../utils/notify');

/**
 * @desc    Create a new prescription
 * @route   POST /api/prescriptions
 * @access  Private/Admin
 */
const createPrescription = asyncHandler(async (req, res) => {
  const payload = { ...req.body };
  if (req.user.role === 'doctor') {
    const doctorProfile = await Doctor.findOne({ user: req.user.id });
    if (!doctorProfile) {
      res.status(403);
      throw new Error('Your doctor profile is not linked to your account.');
    }
    payload.doctor = doctorProfile._id;
  }

  const prescription = await Prescription.create({
    ...payload,
    createdBy: req.user.id,
  });

  await createNotification({
    user: prescription.patient,
    title: 'New Prescription Issued',
    message: 'A new prescription has been issued for you. Check your pharmacy section for details.',
    type: 'prescription-issued',
    relatedId: prescription._id,
  });

  const populated = await Prescription.findById(prescription._id)
    .populate('doctor', 'name specialization')
    .populate('patient', 'name email');

  res.status(201).json({ success: true, data: populated });
});

/**
 * @desc    Get current patient's own prescriptions
 * @route   GET /api/prescriptions/my
 * @access  Private/Patient
 */
const getMyPrescriptions = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const { status } = req.query;

  let filter = { patient: req.user.id };
  if (req.user.role === 'doctor') {
    const doctorProfile = await Doctor.findOne({ user: req.user.id });
    if (!doctorProfile) {
      return res.status(200).json({ success: true, data: [], pagination: buildPaginationMeta(0, page, limit) });
    }
    filter = { doctor: doctorProfile._id };
  }
  if (status) filter.status = status;

  const [prescriptions, totalCount] = await Promise.all([
    Prescription.find(filter)
      .populate('doctor', 'name specialization department')
      .populate('patient', 'name email')
      .sort({ issuedDate: -1 })
      .skip(skip)
      .limit(limit),
    Prescription.countDocuments(filter),
  ]);

  res.status(200).json({
    success: true,
    data: prescriptions,
    pagination: buildPaginationMeta(totalCount, page, limit),
  });
});

/**
 * @desc    Get all prescriptions for a specific patient (admin view)
 * @route   GET /api/prescriptions/patient/:patientId
 * @access  Private/Admin
 */
const getPatientPrescriptions = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);

  const filter = { patient: req.params.patientId };
  if (req.user.role === 'doctor') {
    const doctorProfile = await Doctor.findOne({ user: req.user.id });
    if (!doctorProfile) {
      return res.status(200).json({ success: true, data: [], pagination: buildPaginationMeta(0, page, limit) });
    }
    filter.doctor = doctorProfile._id;
  }

  const [prescriptions, totalCount] = await Promise.all([
    Prescription.find(filter)
      .populate('doctor', 'name specialization department')
      .populate('patient', 'name email')
      .sort({ issuedDate: -1 })
      .skip(skip)
      .limit(limit),
    Prescription.countDocuments(filter),
  ]);

  res.status(200).json({
    success: true,
    data: prescriptions,
    pagination: buildPaginationMeta(totalCount, page, limit),
  });
});

/**
 * @desc    Get all prescriptions (admin pharmacy overview)
 * @route   GET /api/prescriptions
 * @access  Private/Admin
 */
const getAllPrescriptions = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const { status } = req.query;

  const filter = {};
  if (status) filter.status = status;

  if (req.user.role === 'doctor') {
    const doctorProfile = await Doctor.findOne({ user: req.user.id });
    if (!doctorProfile) {
      return res.status(200).json({ success: true, data: [], pagination: buildPaginationMeta(0, page, limit) });
    }
    filter.doctor = doctorProfile._id;
  }

  const [prescriptions, totalCount] = await Promise.all([
    Prescription.find(filter)
      .populate('doctor', 'name specialization')
      .populate('patient', 'name email phone')
      .sort({ issuedDate: -1 })
      .skip(skip)
      .limit(limit),
    Prescription.countDocuments(filter),
  ]);

  res.status(200).json({
    success: true,
    data: prescriptions,
    pagination: buildPaginationMeta(totalCount, page, limit),
  });
});

/**
 * @desc    Get single prescription by id
 * @route   GET /api/prescriptions/:id
 * @access  Private (owner patient or admin)
 */
const getPrescriptionById = asyncHandler(async (req, res) => {
  const prescription = await Prescription.findById(req.params.id)
    .populate('doctor', 'name specialization department')
    .populate('patient', 'name email phone');

  if (!prescription) {
    res.status(404);
    throw new Error('Prescription not found');
  }

  const isOwner = prescription.patient._id.toString() === req.user.id.toString();
  const isDoctorOwner = req.user.role === 'doctor' && prescription.doctor && prescription.doctor._id.toString() === (await Doctor.findOne({ user: req.user.id }))?._id?.toString();
  if (req.user.role !== 'admin' && !isOwner && !isDoctorOwner) {
    res.status(403);
    throw new Error('You do not have permission to view this prescription');
  }

  res.status(200).json({ success: true, data: prescription });
});

/**
 * @desc    Update prescription status (e.g., mark fulfilled)
 * @route   PUT /api/prescriptions/:id/status
 * @access  Private/Admin
 */
const updatePrescriptionStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;

  if (req.user.role === 'pharmacist' && status !== 'fulfilled') {
    res.status(403);
    throw new Error('Pharmacists can only mark prescriptions as fulfilled.');
  }

  const prescription = await Prescription.findById(req.params.id);

  if (!prescription) {
    res.status(404);
    throw new Error('Prescription not found');
  }

  if (req.user.role === 'doctor') {
    const doctorProfile = await Doctor.findOne({ user: req.user.id });
    if (!doctorProfile || prescription.doctor.toString() !== doctorProfile._id.toString()) {
      res.status(403);
      throw new Error('You can only update prescriptions you issued.');
    }
  }
  if (req.user.role === 'pharmacist' && prescription.status !== 'active') {
    res.status(409);
    throw new Error('Only active prescriptions can be dispensed.');
  }

  const updated = await Prescription.findByIdAndUpdate(
    req.params.id,
    { status },
    { new: true, runValidators: true }
  );

  res.status(200).json({ success: true, data: updated });
});

module.exports = {
  createPrescription,
  getMyPrescriptions,
  getPatientPrescriptions,
  getAllPrescriptions,
  getPrescriptionById,
  updatePrescriptionStatus,
};
