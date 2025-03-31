const { ApprovalFlow, Notification } = require('../models');

module.exports = {
  initiateApproval: async (flow) => {
    // Notify approvers based on flow type
    const approvers = await getApproversForType(flow.type);
    
    await Promise.all(approvers.map(async (approver) => {
      await Notification.create({
        userId: approver.id,
        title: `Approval Required: ${flow.type}`,
        message: `Case ${flow.id} requires your review`,
        metadata: { flowId: flow.id }
      });
    }));
  },

  escalateFraudCase: async (caseId) => {
    // Implementation for fraud escalation
  }
};

async function getApproversForType(type) {
  // Implement approver selection logic
  return User.findAll({
    where: { role: 'approver' },
    attributes: ['id', 'email']
  });
}