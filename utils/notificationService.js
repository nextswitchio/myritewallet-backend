const { Notification } = require('../models');
const { sendPushNotification } = require('./pushService');
const { sendSMS } = require('./smsService');

module.exports = {
  createNotification: async (userId, title, message, type = 'system', metadata = {}) => {
    const notification = await Notification.create({
      userId,
      title,
      message,
      type,
      metadata
    });

    if (type === 'penalty' || type === 'payout') {
      const user = await User.findByPk(userId);
      await sendSMS(user.phone, `${title}: ${message}`);
    }

    // Send real-time push if user is online
    await sendPushNotification(userId, { title, body: message });

    return notification;
  },

  markAsRead: async (notificationId) => {
    return Notification.update(
      { isRead: true },
      { where: { id: notificationId } }
    );
  }
};

