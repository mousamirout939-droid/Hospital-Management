const asyncHandler = require('express-async-handler');
const Prescription = require('../models/Prescription');
const { getPagination, buildPaginationMeta } = require('../utils/helpers');
const { createNotification } = require('../utils/notify');

/**
 * @desc    Create a new prescription
 * @route   POST /api/prescriptions
 * @access  Private/Admin
 */
const createPrescription = asyncHandler(async (req, res) => {
  const prescription = await Prescription.create({
    ...req.body,
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

  const filter = { patient: req.user.id };
  if (status) filter.status = status;

  const [prescriptions, totalCount] = await Promise.all([
    Prescription.find(filter)
      .populate('doctor', 'name specialization department')
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

  const [prescriptions, totalCount] = await Promise.all([
    Prescription.find(filter)
      .populate('doctor', 'name specialization department')
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
  if (req.user.role !== 'admin' && !isOwner) {
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

  const prescription = await Prescription.findByIdAndUpdate(
    req.params.id,
    { status },
    { new: true, runValidators: true }
  );

  if (!prescription) {
    res.status(404);
    throw new Error('Prescription not found');
  }

  res.status(200).json({ success: true, data: prescription });
});

module.exports = {
  createPrescription,
  getMyPrescriptions,
  getPatientPrescriptions,
  getAllPrescriptions,
  getPrescriptionById,
  updatePrescriptionStatus,
};
