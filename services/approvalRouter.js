const { ApprovalFlow, User } = require('../models');
const smsService = require('./smsService');
const emailService = require('./emailService');
const { sendPushNotification } = require('./notificationService');
const logger = require('../utils/logger');

module.exports = {
  /**
   * Route an approval request to an approver via their preferred channels.
   * @param {number} caseId - The ID of the case requiring approval.
   * @param {object} approver - The approver object containing contact details.
   * @throws {Error} - If the approval request cannot be routed.
   */
  routeApprovalRequest: async (caseId, approver) => {
    try {
      // Determine preferred channels (configurable per approver)
      const channels = await this._getApproverChannels(approver.id);

      // Log the routing attempt
      logger.info(`Routing approval request for case ID ${caseId} to approver ID ${approver.id}`);

      // Parallel dispatch
      await Promise.all([
        channels.sms && smsService.sendApprovalRequest(caseId, approver.phone),
        channels.app &&
          sendPushNotification(approver.id, {
            title: 'Approval Required',
            body: `Case ${caseId} awaits your action`,
            actions: ['approve', 'reject']
          }),
        channels.email && emailService.sendApprovalEmail(approver.email, caseId)
      ]);

      logger.info(`Approval request routed successfully for case ID ${caseId} to approver ID ${approver.id}`);
    } catch (err) {
      logger.error(`Error routing approval request for case ID ${caseId} to approver ID ${approver.id}: ${err.message}`);
      throw new Error('Failed to route approval request.');
    }
  },

  /**
   * Get the preferred notification channels for an approver.
   * @param {number} userId - The ID of the approver.
   * @returns {object} - An object containing the preferred channels (sms, app, email).
   * @throws {Error} - If the approver's preferences cannot be retrieved.
   * @private
   */
  _getApproverChannels: async (userId) => {
    try {
      const user = await User.findByPk(userId, {
        attributes: ['notification_prefs']
      });

      if (!user) {
        throw new Error(`User with ID ${userId} not found`);
      }

      // Defaults with preference override
      return {
        sms: user.notification_prefs?.sms ?? true,
        app: user.notification_prefs?.app ?? true,
        email: user.notification_prefs?.email ?? false
      };
    } catch (err) {
      logger.error(`Error fetching notification preferences for user ID ${userId}: ${err.message}`);
      throw new Error('Failed to fetch approver notification preferences.');
    }
  }
};