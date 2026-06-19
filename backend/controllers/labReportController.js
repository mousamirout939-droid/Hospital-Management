const asyncHandler = require('express-async-handler');
const LabReport = require('../models/LabReport');
const { getPagination, buildPaginationMeta } = require('../utils/helpers');
const { createNotification } = require('../utils/notify');

/**
 * @desc    Create a new lab report
 * @route   POST /api/lab-reports
 * @access  Private/Admin
 */
const createLabReport = asyncHandler(async (req, res) => {
  const report = await LabReport.create({
    ...req.body,
    createdBy: req.user.id,
  });

  if (report.status === 'completed') {
    await createNotification({
      user: report.patient,
      title: 'Lab Report Ready',
      message: `Your lab report for "${report.testName}" is now ready. Check the lab reports section for results.`,
      type: 'lab-report-ready',
      relatedId: report._id,
    });
  }

  res.status(201).json({ success: true, data: report });
});

/**
 * @desc    Get current patient's own lab reports
 * @route   GET /api/lab-reports/my
 * @access  Private/Patient
 */
const getMyLabReports = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const { status } = req.query;

  const filter = { patient: req.user.id };
  if (status) filter.status = status;

  const [reports, totalCount] = await Promise.all([
    LabReport.find(filter)
      .populate('doctor', 'name specialization')
      .sort({ reportDate: -1 })
      .skip(skip)
      .limit(limit),
    LabReport.countDocuments(filter),
  ]);

  res.status(200).json({
    success: true,
    data: reports,
    pagination: buildPaginationMeta(totalCount, page, limit),
  });
});

/**
 * @desc    Get all lab reports for a specific patient (admin view)
 * @route   GET /api/lab-reports/patient/:patientId
 * @access  Private/Admin
 */
const getPatientLabReports = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);

  const filter = { patient: req.params.patientId };

  const [reports, totalCount] = await Promise.all([
    LabReport.find(filter)
      .populate('doctor', 'name specialization')
      .sort({ reportDate: -1 })
      .skip(skip)
      .limit(limit),
    LabReport.countDocuments(filter),
  ]);

  res.status(200).json({
    success: true,
    data: reports,
    pagination: buildPaginationMeta(totalCount, page, limit),
  });
});

/**
 * @desc    Get all lab reports (admin lab overview)
 * @route   GET /api/lab-reports
 * @access  Private/Admin
 */
const getAllLabReports = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const { status } = req.query;

  const filter = {};
  if (status) filter.status = status;

  const [reports, totalCount] = await Promise.all([
    LabReport.find(filter)
      .populate('doctor', 'name specialization')
      .populate('patient', 'name email phone')
      .sort({ reportDate: -1 })
      .skip(skip)
      .limit(limit),
    LabReport.countDocuments(filter),
  ]);

  res.status(200).json({
    success: true,
    data: reports,
    pagination: buildPaginationMeta(totalCount, page, limit),
  });
});

/**
 * @desc    Get single lab report by id
 * @route   GET /api/lab-reports/:id
 * @access  Private (owner patient or admin)
 */
const getLabReportById = asyncHandler(async (req, res) => {
  const report = await LabReport.findById(req.params.id)
    .populate('doctor', 'name specialization department')
    .populate('patient', 'name email phone');

  if (!report) {
    res.status(404);
    throw new Error('Lab report not found');
  }

  const isOwner = report.patient._id.toString() === req.user.id.toString();
  if (req.user.role !== 'admin' && !isOwner) {
    res.status(403);
    throw new Error('You do not have permission to view this report');
  }

  res.status(200).json({ success: true, data: report });
});

/**
 * @desc    Update a lab report (add results, change status)
 * @route   PUT /api/lab-reports/:id
 * @access  Private/Admin
 */
const updateLabReport = asyncHandler(async (req, res) => {
  const previousReport = await LabReport.findById(req.params.id);
  if (!previousReport) {
    res.status(404);
    throw new Error('Lab report not found');
  }

  const wasCompleted = previousReport.status === 'completed';

  const report = await LabReport.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  if (!wasCompleted && report.status === 'completed') {
    await createNotification({
      user: report.patient,
      title: 'Lab Report Ready',
      message: `Your lab report for "${report.testName}" is now ready. Check the lab reports section for results.`,
      type: 'lab-report-ready',
      relatedId: report._id,
    });
  }

  res.status(200).json({ success: true, data: report });
});

/**
 * @desc    Delete a lab report
 * @route   DELETE /api/lab-reports/:id
 * @access  Private/Admin
 */
const deleteLabReport = asyncHandler(async (req, res) => {
  const report = await LabReport.findByIdAndDelete(req.params.id);

  if (!report) {
    res.status(404);
    throw new Error('Lab report not found');
  }

  res.status(200).json({ success: true, message: 'Lab report deleted successfully' });
});

module.exports = {
  createLabReport,
  getMyLabReports,
  getPatientLabReports,
  getAllLabReports,
  getLabReportById,
  updateLabReport,
  deleteLabReport,
};
