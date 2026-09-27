const crypto = require('crypto');
const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const { sendTokenResponse } = require('../utils/generateToken');
const { sendEmail } = require('../config/email');

/**
 * @desc    Register a new patient account
 * @route   POST /api/auth/register
 * @access  Public
 */
const registerUser = asyncHandler(async (req, res) => {
  const {
    name,
    email,
    password,
    phone,
    gender,
    dateOfBirth,
    bloodGroup,
    address,
    role = 'patient',
    specialization,
    department,
    qualification,
    experienceYears,
    consultationFee,
    bio,
  } = req.body;

  const normalizedEmail = email?.trim().toLowerCase();
  if (!normalizedEmail) {
    res.status(400);
    throw new Error('Email is required');
  }

  const existingUser = await User.findOne({ email: normalizedEmail });
  if (existingUser) {
    res.status(400);
    throw new Error('An account with this email already exists. Please log in instead.');
  }

  const selectedRole = role === 'doctor' ? 'doctor' : 'patient';

  if (selectedRole === 'doctor') {
    if (!specialization || !department || !consultationFee) {
      res.status(400);
      throw new Error('Doctor registration requires specialization, department, and consultation fee.');
    }
  }

  const user = await User.create({
    name,
    email: normalizedEmail,
    password,
    phone,
    gender,
    dateOfBirth,
    bloodGroup,
    address,
    role: selectedRole,
  });

  if (selectedRole === 'doctor') {
    const doctorProfile = await require('../models/Doctor').create({
      user: user._id,
      name,
      email: normalizedEmail,
      phone,
      specialization,
      department,
      qualification: qualification || '',
      experienceYears: Number(experienceYears || 0),
      consultationFee: Number(consultationFee),
      bio: bio || '',
      availability: [],
    });

    user.doctorProfile = doctorProfile._id;
  }

  sendEmail({
    to: user.email,
    subject: selectedRole === 'doctor' ? 'Welcome to MediCare as a Doctor' : 'Welcome to Hospital Management System',
    html:
      selectedRole === 'doctor'
        ? `<p>Hi Dr. ${user.name},</p><p>Your doctor account has been created successfully. You can now log in and manage your appointments and patient records.</p>`
        : `<p>Hi ${user.name},</p><p>Your account has been created successfully. You can now log in and book appointments.</p>`,
  });

  sendTokenResponse(user, 201, res);
});

/**
 * @desc    Login user (admin or patient)
 * @route   POST /api/auth/login
 * @access  Public
 */
const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400);
    throw new Error('Please provide both email and password');
  }

  const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

  if (!user || !(await user.comparePassword(password))) {
    res.status(401);
    throw new Error('Invalid email or password');
  }

  if (!user.isActive) {
    res.status(403);
    throw new Error('Your account has been deactivated. Please contact support.');
  }

  user.lastLogin = Date.now();
  await user.save({ validateBeforeSave: false });

  sendTokenResponse(user, 200, res);
});

/**
 * @desc    Logout user / clear cookie
 * @route   POST /api/auth/logout
 * @access  Private
 */
const logoutUser = asyncHandler(async (req, res) => {
  res.cookie('token', 'none', {
    expires: new Date(Date.now() + 5 * 1000),
    httpOnly: true,
  });
  res.status(200).json({ success: true, message: 'Logged out successfully' });
});

/**
 * @desc    Get currently logged in user's profile
 * @route   GET /api/auth/me
 * @access  Private
 */
const getMe = asyncHandler(async (req, res) => {
  res.status(200).json({ success: true, user: req.user.toSafeObject() });
});

/**
 * @desc    Update current user's password
 * @route   PUT /api/auth/update-password
 * @access  Private
 */
const updatePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  const user = await User.findById(req.user.id).select('+password');

  if (!(await user.comparePassword(currentPassword))) {
    res.status(401);
    throw new Error('Current password is incorrect');
  }

  user.password = newPassword;
  await user.save();

  sendTokenResponse(user, 200, res);
});

/**
 * @desc    Request password reset email
 * @route   POST /api/auth/forgot-password
 * @access  Public
 */
const forgotPassword = asyncHandler(async (req, res) => {
  const user = await User.findOne({ email: req.body.email?.toLowerCase() });

  // Always respond the same way to avoid leaking which emails are registered
  const genericResponse = {
    success: true,
    message: 'If an account with that email exists, a password reset link has been sent.',
  };

  if (!user) {
    return res.status(200).json(genericResponse);
  }

  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;

  const emailResult = await sendEmail({
    to: user.email,
    subject: 'Password Reset Request - Hospital Management System',
    html: `<p>You requested a password reset.</p><p>Click <a href="${resetUrl}">here</a> to reset your password. This link expires in 10 minutes.</p><p>If you did not request this, please ignore this email.</p>`,
  });

  if (!emailResult.sent) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });
  }

  return res.status(200).json(genericResponse);
});

/**
 * @desc    Reset password using token from email
 * @route   PUT /api/auth/reset-password/:token
 * @access  Public
 */
const resetPassword = asyncHandler(async (req, res) => {
  const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });

  if (!user) {
    res.status(400);
    throw new Error('Password reset token is invalid or has expired');
  }

  user.password = req.body.password;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  sendTokenResponse(user, 200, res);
});

module.exports = {
  registerUser,
  loginUser,
  logoutUser,
  getMe,
  updatePassword,
  forgotPassword,
  resetPassword,
};
