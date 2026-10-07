const asyncHandler = require('express-async-handler');
const LabReport = require('../models/LabReport');
const { getPagination, buildPaginationMeta } = require('../utils/helpers');
const { createNotification } = require('../utils/notify');
const pdfParse = require('pdf-parse');
const { analyzeLabReportText } = require('../utils/labReportAnalyzer');

const analyzeUploadedLabReport = asyncHandler(async (req, res) => {
  if (!req.file) {
    res.status(400);
    throw new Error('Choose a PDF lab report to analyze');
  }

  if (req.file.buffer.toString('ascii', 0, 5) !== '%PDF-') {
    res.status(400);
    throw new Error('The uploaded file is not a valid PDF');
  }

  let pdfDocument;
  try {
    pdfDocument = await pdfParse(req.file.buffer);
  } catch (error) {
    res.status(422);
    throw new Error('This PDF could not be read. Upload a valid, text-based lab report.');
  }

  if (!pdfDocument.text.trim()) {
    res.status(422);
    throw new Error('No selectable text was found. Scanned image-only PDFs are not supported yet.');
  }

  const parameters = analyzeLabReportText(pdfDocument.text);
  if (parameters.length === 0) {
    res.status(422);
    throw new Error('No supported CBC results were found. Upload a report containing readable CBC values.');
  }

  const sourceFileName = String(req.file.originalname)
    .replace(/^.*[\\/]/, '')
    .replace(/[\u0000-\u001f\u007f]/g, '')
    .slice(0, 120);
  const isCbcReport = /\bcbc\b|complete blood count/i.test(pdfDocument.text);
  const report = await LabReport.create({
    patient: req.user._id,
    createdBy: req.user._id,
    testName: isCbcReport ? 'Complete Blood Count (CBC)' : 'CBC Lab Report',
    testType: 'Hematology',
    status: 'completed',
    parameters,
    sourceFileName,
    summary: 'Automated summary compares extracted results only with reference ranges printed in this report. This is informational, not a diagnosis. Please consult a qualified healthcare professional for interpretation.',
  });

  res.status(201).json({ success: true, data: report });
});

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
  const updates = req.user.role === 'lab-technician'
    ? {
        ...(req.body.parameters !== undefined && { parameters: req.body.parameters }),
        ...(req.body.summary !== undefined && { summary: req.body.summary }),
        ...(req.body.status !== undefined && { status: req.body.status }),
      }
    : req.body;

  if (req.user.role === 'lab-technician' && Object.keys(updates).length === 0) {
    res.status(400);
    throw new Error('Provide lab results, a summary, or a status to update.');
  }

  const report = await LabReport.findByIdAndUpdate(req.params.id, updates, {
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
  analyzeUploadedLabReport,
  createLabReport,
  getMyLabReports,
  getPatientLabReports,
  getAllLabReports,
  getLabReportById,
  updateLabReport,
  deleteLabReport,
};
