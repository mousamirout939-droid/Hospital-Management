const asyncHandler = require('express-async-handler');
const Invoice = require('../models/Invoice');
const { getPagination, buildPaginationMeta } = require('../utils/helpers');
const { generateInvoiceNumber } = require('../utils/helpers');
const { createNotification } = require('../utils/notify');

/**
 * @desc    Create a new invoice
 * @route   POST /api/invoices
 * @access  Private/Admin
 */
const createInvoice = asyncHandler(async (req, res) => {
  const { items, taxPercent = 0, discount = 0 } = req.body;

  if (!Array.isArray(items) || items.length === 0) {
    res.status(400);
    throw new Error('At least one billing item is required');
  }

  const subtotal = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  const taxAmount = (subtotal * taxPercent) / 100;
  const totalAmount = subtotal + taxAmount - discount;

  const itemsWithTotal = items.map((item) => ({
    ...item,
    total: item.quantity * item.unitPrice,
  }));

  const invoice = await Invoice.create({
    ...req.body,
    items: itemsWithTotal,
    invoiceNumber: generateInvoiceNumber(),
    subtotal,
    taxAmount,
    totalAmount: Math.max(totalAmount, 0),
    createdBy: req.user.id,
  });

  await createNotification({
    user: invoice.patient,
    title: 'New Invoice Generated',
    message: `An invoice of amount ₹${invoice.totalAmount.toFixed(2)} has been generated. Please check the billing section.`,
    type: 'invoice-generated',
    relatedId: invoice._id,
  });

  res.status(201).json({ success: true, data: invoice });
});

/**
 * @desc    Get current patient's own invoices
 * @route   GET /api/invoices/my
 * @access  Private/Patient
 */
const getMyInvoices = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const { paymentStatus } = req.query;

  const filter = { patient: req.user.id };
  if (paymentStatus) filter.paymentStatus = paymentStatus;

  const [invoices, totalCount] = await Promise.all([
    Invoice.find(filter)
      .populate('doctor', 'name specialization')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Invoice.countDocuments(filter),
  ]);

  res.status(200).json({
    success: true,
    data: invoices,
    pagination: buildPaginationMeta(totalCount, page, limit),
  });
});

/**
 * @desc    Get all invoices (admin billing overview)
 * @route   GET /api/invoices
 * @access  Private/Admin
 */
const getAllInvoices = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const { paymentStatus } = req.query;

  const filter = {};
  if (paymentStatus) filter.paymentStatus = paymentStatus;

  const [invoices, totalCount] = await Promise.all([
    Invoice.find(filter)
      .populate('doctor', 'name specialization')
      .populate('patient', 'name email phone')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Invoice.countDocuments(filter),
  ]);

  res.status(200).json({
    success: true,
    data: invoices,
    pagination: buildPaginationMeta(totalCount, page, limit),
  });
});

/**
 * @desc    Get single invoice by id
 * @route   GET /api/invoices/:id
 * @access  Private (owner patient or admin)
 */
const getInvoiceById = asyncHandler(async (req, res) => {
  const invoice = await Invoice.findById(req.params.id)
    .populate('doctor', 'name specialization department')
    .populate('patient', 'name email phone address');

  if (!invoice) {
    res.status(404);
    throw new Error('Invoice not found');
  }

  const isOwner = invoice.patient._id.toString() === req.user.id.toString();
  if (req.user.role !== 'admin' && !isOwner) {
    res.status(403);
    throw new Error('You do not have permission to view this invoice');
  }

  res.status(200).json({ success: true, data: invoice });
});

/**
 * @desc    Record a payment against an invoice
 * @route   PUT /api/invoices/:id/pay
 * @access  Private/Admin
 */
const recordPayment = asyncHandler(async (req, res) => {
  const { amount, paymentMethod } = req.body;

  const invoice = await Invoice.findById(req.params.id);
  if (!invoice) {
    res.status(404);
    throw new Error('Invoice not found');
  }

  invoice.paidAmount += Number(amount);
  invoice.paymentMethod = paymentMethod || invoice.paymentMethod;

  if (invoice.paidAmount >= invoice.totalAmount) {
    invoice.paymentStatus = 'paid';
    invoice.paidAt = new Date();
  } else if (invoice.paidAmount > 0) {
    invoice.paymentStatus = 'partially-paid';
  }

  await invoice.save();

  await createNotification({
    user: invoice.patient,
    title: 'Payment Received',
    message: `A payment of ₹${Number(amount).toFixed(2)} has been recorded against your invoice ${invoice.invoiceNumber}.`,
    type: 'payment-received',
    relatedId: invoice._id,
  });

  res.status(200).json({ success: true, data: invoice });
});

module.exports = {
  createInvoice,
  getMyInvoices,
  getAllInvoices,
  getInvoiceById,
  recordPayment,
};
