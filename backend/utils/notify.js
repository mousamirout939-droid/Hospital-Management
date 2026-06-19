const Notification = require('../models/Notification');

/**
 * Creates an in-app notification for a user. Fails silently (logs only)
 * so notification issues never break the primary request flow.
 */
const createNotification = async ({ user, title, message, type = 'general', relatedId = null }) => {
  try {
    await Notification.create({ user, title, message, type, relatedId });
  } catch (error) {
    console.error('Failed to create notification:', error.message);
  }
};

module.exports = { createNotification };
