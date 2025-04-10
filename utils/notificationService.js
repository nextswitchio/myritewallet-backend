const { Notification, User } = require('../models');
const { sendPushNotification } = require('./pushService');
const { sendSMS } = require('./smsService');
const { isUserOnline } = require('./userStatusService'); // Hypothetical helper for checking user online status

module.exports = {
  /**
   * Create a notification for a user.
   * @param {number} userId - The ID of the user to notify.
   * @param {string} title - The title of the notification.
   * @param {string} message - The message body of the notification.
   * @param {string} [type='system'] - The type of notification (e.g., 'system', 'penalty', 'payout').
   * @param {object} [metadata={}] - Additional metadata for the notification.
   * @returns {object} - The created notification.
   */
  createNotification: async (userId, title, message, type = 'system', metadata = {}) => {
    try {
      // Create the notification in the database
      const notification = await Notification.create({
        userId,
        title,
        message,
        type,
        metadata
      });

      // Send SMS for specific notification types
      if (type === 'penalty' || type === 'payout') {
        try {
          const user = await User.findByPk(userId);
          if (user) {
            await sendSMS(user.phone, `${title}: ${message}`);
          }
        } catch (err) {
          console.error('Failed to send SMS notification:', err);
        }
      }

      // Send real-time push notification if the user is online
      if (await isUserOnline(userId)) {
        try {
          await sendPushNotification(userId, { title, body: message });
        } catch (err) {
          console.error('Failed to send push notification:', err);
        }
      }

      return notification;
    } catch (err) {
      console.error('Error creating notification:', err);
      throw new Error('Failed to create notification');
    }
  },

  /**
   * Mark a notification as read.
   * @param {number} notificationId - The ID of the notification to mark as read.
   * @returns {object} - The updated notification.
   * @throws {Error} - If the notification does not exist.
   */
  markAsRead: async (notificationId) => {
    try {
      const notification = await Notification.findByPk(notificationId);
      if (!notification) {
        throw new Error(`Notification with ID ${notificationId} not found`);
      }
      return notification.update({ isRead: true });
    } catch (err) {
      console.error('Error marking notification as read:', err);
      throw new Error('Failed to mark notification as read');
    }
  }
};

