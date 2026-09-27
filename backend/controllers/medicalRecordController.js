const asyncHandler = require('express-async-handler');
const MedicalRecord = require('../models/MedicalRecord');
const Doctor = require('../models/Doctor');
const { getPagination, buildPaginationMeta } = require('../utils/helpers');

/**
 * @desc    Create a medical record for a patient (admin/doctor-entry only)
 * @route   POST /api/medical-records
 * @access  Private/Admin
 */
const createMedicalRecord = asyncHandler(async (req, res) => {
  const payload = { ...req.body };
  if (req.user.role === 'doctor') {
    const doctorProfile = await Doctor.findOne({ user: req.user.id });
    if (!doctorProfile) {
      res.status(403);
      throw new Error('Your doctor profile is not linked to your account.');
    }
    payload.doctor = doctorProfile._id;
  }

  const record = await MedicalRecord.create({
    ...payload,
    createdBy: req.user.id,
  });

  const populated = await MedicalRecord.findById(record._id)
    .populate('doctor', 'name specialization')
    .populate('patient', 'name email');

  res.status(201).json({ success: true, data: populated });
});

/**
 * @desc    Get current patient's own medical records
 * @route   GET /api/medical-records/my
 * @access  Private/Patient
 */
const getMyMedicalRecords = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);

  let filter = { patient: req.user.id };
  if (req.user.role === 'doctor') {
    const doctorProfile = await Doctor.findOne({ user: req.user.id });
    if (!doctorProfile) {
      return res.status(200).json({ success: true, data: [], pagination: buildPaginationMeta(0, page, limit) });
    }
    filter = { doctor: doctorProfile._id };
  }

  const [records, totalCount] = await Promise.all([
    MedicalRecord.find(filter)
      .populate('doctor', 'name specialization department')
      .populate('patient', 'name email')
      .sort({ visitDate: -1 })
      .skip(skip)
      .limit(limit),
    MedicalRecord.countDocuments(filter),
  ]);

  res.status(200).json({
    success: true,
    data: records,
    pagination: buildPaginationMeta(totalCount, page, limit),
  });
});

/**
 * @desc    Get all medical records for a specific patient (admin view)
 * @route   GET /api/medical-records/patient/:patientId
 * @access  Private/Admin
 */
const getPatientMedicalRecords = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);

  const filter = { patient: req.params.patientId };
  if (req.user.role === 'doctor') {
    const doctorProfile = await Doctor.findOne({ user: req.user.id });
    if (!doctorProfile) {
      return res.status(200).json({ success: true, data: [], pagination: buildPaginationMeta(0, page, limit) });
    }
    filter.doctor = doctorProfile._id;
  }

  const [records, totalCount] = await Promise.all([
    MedicalRecord.find(filter)
      .populate('doctor', 'name specialization department')
      .populate('patient', 'name email')
      .sort({ visitDate: -1 })
      .skip(skip)
      .limit(limit),
    MedicalRecord.countDocuments(filter),
  ]);

  res.status(200).json({
    success: true,
    data: records,
    pagination: buildPaginationMeta(totalCount, page, limit),
  });
});

/**
 * @desc    Get single medical record by id
 * @route   GET /api/medical-records/:id
 * @access  Private (owner patient or admin)
 */
const getMedicalRecordById = asyncHandler(async (req, res) => {
  const record = await MedicalRecord.findById(req.params.id)
    .populate('doctor', 'name specialization department')
    .populate('patient', 'name email phone');

  if (!record) {
    res.status(404);
    throw new Error('Medical record not found');
  }

  const isOwner = record.patient._id.toString() === req.user.id.toString();
  const isDoctorOwner = req.user.role === 'doctor' && record.doctor && record.doctor._id.toString() === (await Doctor.findOne({ user: req.user.id }))?._id?.toString();
  if (req.user.role !== 'admin' && !isOwner && !isDoctorOwner) {
    res.status(403);
    throw new Error('You do not have permission to view this record');
  }

  res.status(200).json({ success: true, data: record });
});

/**
 * @desc    Update a medical record
 * @route   PUT /api/medical-records/:id
 * @access  Private/Admin
 */
const updateMedicalRecord = asyncHandler(async (req, res) => {
  const record = await MedicalRecord.findById(req.params.id);

  if (!record) {
    res.status(404);
    throw new Error('Medical record not found');
  }

  if (req.user.role === 'doctor') {
    const doctorProfile = await Doctor.findOne({ user: req.user.id });
    if (!doctorProfile || record.doctor.toString() !== doctorProfile._id.toString()) {
      res.status(403);
      throw new Error('You can only update your own patient records.');
    }
  }

  const updated = await MedicalRecord.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({ success: true, data: updated });
});

/**
 * @desc    Delete a medical record
 * @route   DELETE /api/medical-records/:id
 * @access  Private/Admin
 */
const deleteMedicalRecord = asyncHandler(async (req, res) => {
  const record = await MedicalRecord.findByIdAndDelete(req.params.id);

  if (!record) {
    res.status(404);
    throw new Error('Medical record not found');
  }

  res.status(200).json({ success: true, message: 'Medical record deleted successfully' });
});

module.exports = {
  createMedicalRecord,
  getMyMedicalRecords,
  getPatientMedicalRecords,
  getMedicalRecordById,
  updateMedicalRecord,
  deleteMedicalRecord,
};
