const asyncHandler = require('express-async-handler');
const MedicineInventory = require('../models/MedicineInventory');

const getInventory = asyncHandler(async (req, res) => {
  const inventory = await MedicineInventory.find()
    .sort({ expiryDate: 1, medicineName: 1 })
    .lean();

  res.status(200).json({ success: true, data: inventory });
});

const createInventoryItem = asyncHandler(async (req, res) => {
  const item = await MedicineInventory.create({
    ...req.body,
    updatedBy: req.user.id,
  });

  res.status(201).json({ success: true, data: item });
});

const updateInventoryItem = asyncHandler(async (req, res) => {
  const item = await MedicineInventory.findByIdAndUpdate(
    req.params.id,
    { ...req.body, updatedBy: req.user.id },
    { new: true, runValidators: true }
  );

  if (!item) {
    res.status(404);
    throw new Error('Medicine inventory item not found');
  }

  res.status(200).json({ success: true, data: item });
});

module.exports = { getInventory, createInventoryItem, updateInventoryItem };
