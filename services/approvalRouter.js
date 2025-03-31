const { ApprovalFlow, User } = require('../models');
const smsService = require('./smsService');
const emailService = require('./emailService');
const { sendPushNotification } = require('./notificationService');

module.exports = {
  routeApprovalRequest: async (caseId, approver) => {
    // Determine preferred channels (configurable per approver)
    const channels = await this._getApproverChannels(approver.id);
    
    // Parallel dispatch
    await Promise.all([
      channels.sms && smsService.sendApprovalRequest(caseId, approver.phone),
      channels.app && sendPushNotification(approver.id, {
        title: 'Approval Required',
        body: `Case ${caseId} awaits your action`,
        actions: ['approve', 'reject']
      }),
      channels.email && emailService.sendApprovalEmail(approver.email, caseId)
    ]);
  },

  _getApproverChannels: async (userId) => {
    const user = await User.findByPk(userId, {
      attributes: ['notification_prefs']
    });
    
    // Defaults with preference override
    return {
      sms: user.notification_prefs?.sms ?? true,
      app: user.notification_prefs?.app ?? true,
      email: user.notification_prefs?.email ?? false
    };
  }
};