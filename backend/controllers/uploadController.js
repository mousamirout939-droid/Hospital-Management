const asyncHandler = require('express-async-handler');

/**
 * @desc    Upload a single file (avatar, attachment, lab report PDF, etc.)
 * @route   POST /api/uploads
 * @access  Private
 */
const uploadFile = asyncHandler(async (req, res) => {
  if (!req.file) {
    res.status(400);
    throw new Error('No file was uploaded');
  }

  const fileUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;

  res.status(201).json({
    success: true,
    data: {
      fileName: req.file.originalname,
      storedName: req.file.filename,
      fileUrl,
      mimeType: req.file.mimetype,
      size: req.file.size,
    },
  });
});

module.exports = { uploadFile };
