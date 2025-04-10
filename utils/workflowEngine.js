const { ApprovalFlow, Notification, User } = require('../models');

module.exports = {
  /**
   * Initiate an approval workflow.
   * @param {object} flow - The approval flow object.
   * @throws {Error} - If the flow object is invalid or approvers cannot be notified.
   */
  initiateApproval: async (flow) => {
    try {
      // Validate flow object
      if (!flow || !flow.type || !flow.id) {
        throw new Error('Invalid flow object. Type and ID are required.');
      }

      // Fetch approvers for the given flow type
      const approvers = await getApproversForType(flow.type);
      if (!approvers || approvers.length === 0) {
        throw new Error(`No approvers found for type ${flow.type}`);
      }

      // Notify approvers
      await Promise.all(approvers.map(async (approver) => {
        await Notification.create({
          userId: approver.id,
          title: `Approval Required: ${flow.type}`,
          message: `Case ${flow.id} requires your review`,
          metadata: { flowId: flow.id }
        });
        console.log(`Notified approver ${approver.email} for flow ${flow.id}`);
      }));
    } catch (err) {
      console.error('Error initiating approval workflow:', err);
      throw new Error('Failed to initiate approval workflow.');
    }
  },

  /**
   * Escalate a fraud case to higher-level approvers or administrators.
   * @param {number} caseId - The ID of the fraud case to escalate.
   * @throws {Error} - If the escalation fails.
   */
  escalateFraudCase: async (caseId) => {
    try {
      if (!caseId) {
        throw new Error('Invalid case ID.');
      }

      // Fetch higher-level approvers or administrators
      const approvers = await User.findAll({
        where: { role: 'admin' },
        attributes: ['id', 'email']
      });

      if (!approvers || approvers.length === 0) {
        throw new Error('No administrators found for escalation.');
      }

      // Notify administrators
      await Promise.all(approvers.map(async (approver) => {
        await Notification.create({
          userId: approver.id,
          title: 'Fraud Case Escalation',
          message: `Fraud case ${caseId} requires immediate attention.`,
          metadata: { caseId }
        });
        console.log(`Escalated fraud case ${caseId} to admin ${approver.email}`);
      }));
    } catch (err) {
      console.error('Error escalating fraud case:', err);
      throw new Error('Failed to escalate fraud case.');
    }
  }
};

/**
 * Fetch approvers based on the workflow type.
 * @param {string} type - The type of workflow (e.g., 'fraud', 'transaction').
 * @returns {Promise<object[]>} - A list of approvers.
 * @throws {Error} - If the approvers cannot be fetched.
 */
async function getApproversForType(type) {
  try {
    if (type === 'fraud') {
      return User.findAll({
        where: { role: 'fraud_approver' },
        attributes: ['id', 'email']
      });
    } else if (type === 'transaction') {
      return User.findAll({
        where: { role: 'transaction_approver' },
        attributes: ['id', 'email']
      });
    } else {
      return User.findAll({
        where: { role: 'approver' },
        attributes: ['id', 'email']
      });
    }
  } catch (err) {
    console.error(`Error fetching approvers for type ${type}:`, err);
    throw new Error('Failed to fetch approvers.');
  }
}