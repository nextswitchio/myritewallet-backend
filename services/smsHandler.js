const { ApprovalFlow, User } = require('../models');
const logger = require('../utils/logger');
const { executeApprovedAction, notifyNextApprovers } = require('./workflowEngine');
const sequelize = require('../models').sequelize;

module.exports = {
  /**
   * Handle an SMS response for approval or rejection.
   * @param {string} phone - The phone number of the approver.
   * @param {string} message - The SMS message content.
   * @param {number} caseId - The ID of the case being approved/rejected.
   * @returns {object} - The result of the operation.
   */
  handleSMSResponse: async (phone, message, caseId) => {
    try {
      // Fetch the user by phone number
      const user = await User.findOne({ where: { phone } });
      if (!user) {
        logger.error(`User not found for phone ${phone}`);
        return { error: 'User not found' };
      }

      // Fetch the approval flow
      const flow = await ApprovalFlow.findOne({
        where: { caseId },
        include: ['currentApprovers']
      });

      if (!flow) {
        logger.error(`Approval flow not found for case ID ${caseId}`);
        return { error: 'Approval flow not found' };
      }

      // Validate approver
      const isApprover = flow.currentApprovers.some(a => a.id === user.id);
      if (!isApprover) {
        logger.error(`User ${user.id} is not an approver for case ID ${caseId}`);
        return { error: 'Not an approver for this case' };
      }

      // Process response
      const response = message.trim().toUpperCase();
      if (response.startsWith('YES')) {
        await this._approveCase(flow, user);
        logger.info(`User ${user.id} approved case ${caseId}`);
      } else if (response.startsWith('NO')) {
        await this._rejectCase(flow, user);
        logger.info(`User ${user.id} rejected case ${caseId}`);
      } else {
        logger.error(`Invalid response format: ${message}`);
        return { error: 'Invalid response format' };
      }

      return { success: true };
    } catch (err) {
      logger.error(`Error handling SMS response for case ID ${caseId}: ${err.message}`);
      return { error: 'Internal server error' };
    }
  },

  /**
   * Approve a case.
   * @param {object} flow - The approval flow object.
   * @param {object} user - The approver user object.
   * @private
   */
  async _approveCase(flow, user) {
    const t = await sequelize.transaction();
    try {
      // Check if this is the final approval
      if (flow.currentLevel >= flow.requiredLevels) {
        await flow.update(
          {
            status: 'approved',
            approvedBy: user.id,
            completedAt: new Date()
          },
          { transaction: t }
        );
        await executeApprovedAction(flow.caseId, t);
      } else {
        // Move to the next level
        const nextLevel = flow.currentLevel + 1;
        await flow.update({ currentLevel: nextLevel }, { transaction: t });
        await notifyNextApprovers(flow.caseId, nextLevel, t);
      }
      await t.commit();
    } catch (err) {
      await t.rollback();
      logger.error(`Error approving case ID ${flow.caseId}: ${err.message}`);
      throw err;
    }
  },

  /**
   * Reject a case.
   * @param {object} flow - The approval flow object.
   * @param {object} user - The approver user object.
   * @private
   */
  async _rejectCase(flow, user) {
    const t = await sequelize.transaction();
    try {
      await flow.update(
        {
          status: 'rejected',
          rejectedBy: user.id,
          completedAt: new Date()
        },
        { transaction: t }
      );
      // Notify relevant parties about the rejection
      await notifyNextApprovers(flow.caseId, null, t); // Notify rejection
      await t.commit();
    } catch (err) {
      await t.rollback();
      logger.error(`Error rejecting case ID ${flow.caseId}: ${err.message}`);
      throw err;
    }
  }
};