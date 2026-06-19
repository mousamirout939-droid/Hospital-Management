const asyncHandler = require('express-async-handler');
const Notification = require('../models/Notification');
const { getPagination, buildPaginationMeta } = require('../utils/helpers');

/**
 * @desc    Get current user's notifications
 * @route   GET /api/notifications
 * @access  Private
 */
const getMyNotifications = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const { unreadOnly } = req.query;

  const filter = { user: req.user.id };
  if (unreadOnly === 'true') filter.isRead = false;

  const [notifications, totalCount, unreadCount] = await Promise.all([
    Notification.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Notification.countDocuments(filter),
    Notification.countDocuments({ user: req.user.id, isRead: false }),
  ]);

  res.status(200).json({
    success: true,
    data: notifications,
    unreadCount,
    pagination: buildPaginationMeta(totalCount, page, limit),
  });
});

/**
 * @desc    Mark a single notification as read
 * @route   PUT /api/notifications/:id/read
 * @access  Private
 */
const markAsRead = asyncHandler(async (req, res) => {
  const notification = await Notification.findOneAndUpdate(
    { _id: req.params.id, user: req.user.id },
    { isRead: true },
    { new: true }
  );

  if (!notification) {
    res.status(404);
    throw new Error('Notification not found');
  }

  res.status(200).json({ success: true, data: notification });
});

/**
 * @desc    Mark all of current user's notifications as read
 * @route   PUT /api/notifications/read-all
 * @access  Private
 */
const markAllAsRead = asyncHandler(async (req, res) => {
  await Notification.updateMany({ user: req.user.id, isRead: false }, { isRead: true });
  res.status(200).json({ success: true, message: 'All notifications marked as read' });
});

/**
 * @desc    Delete a notification
 * @route   DELETE /api/notifications/:id
 * @access  Private
 */
const deleteNotification = asyncHandler(async (req, res) => {
  const notification = await Notification.findOneAndDelete({
    _id: req.params.id,
    user: req.user.id,
  });

  if (!notification) {
    res.status(404);
    throw new Error('Notification not found');
  }

  res.status(200).json({ success: true, message: 'Notification deleted' });
});

module.exports = { getMyNotifications, markAsRead, markAllAsRead, deleteNotification };
