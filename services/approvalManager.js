const { ApprovalFlow, ApprovalResponse } = require('../models');
const workflow = require('./workflowEngine');
const logger = require('../utils/logger');

module.exports = {
  /**
   * Handle an approval or rejection response from an approver.
   * @param {number} caseId - The ID of the case being approved/rejected.
   * @param {number} approverId - The ID of the approver.
   * @param {boolean} approved - Whether the case was approved or rejected.
   * @param {string} channel - The channel through which the response was submitted.
   * @param {string} ipAddress - The IP address of the approver.
   * @throws {Error} - If the case cannot be processed.
   */
  handleResponse: async (caseId, approverId, approved, channel, ipAddress) => {
    const t = await sequelize.transaction();
    try {
      // Fetch the approval flow
      const flow = await ApprovalFlow.findOne({
        where: { caseId },
        include: ['currentLevel'],
        transaction: t
      });

      if (!flow) {
        throw new Error(`Approval flow not found for case ID ${caseId}`);
      }

      // Validate response
      if (flow.status !== 'pending') {
        throw new Error('Case has already been processed');
      }

      // Record the approver's response
      await ApprovalResponse.create(
        {
          flowId: flow.id,
          approverId,
          approved,
          channel,
          ipAddress
        },
        { transaction: t }
      );

      // Process the response
      if (approved) {
        await this._processApproval(flow, t);
      } else {
        await flow.update({ status: 'rejected' }, { transaction: t });
        await this._notifyRejection(flow);
      }

      await t.commit();
      logger.info(`Approval response processed for case ID ${caseId} by approver ID ${approverId}`);
    } catch (err) {
      await t.rollback();
      logger.error(`Error processing approval response for case ID ${caseId}: ${err.message}`);
      throw err;
    }
  },

  /**
   * Process an approval response.
   * @param {object} flow - The approval flow object.
   * @param {object} transaction - The Sequelize transaction object.
   * @private
   */
  async _processApproval(flow, transaction) {
    try {
      // Check if this is the final approval
      if (flow.currentLevel >= flow.requiredLevels) {
        await flow.update({ status: 'approved' }, { transaction });
        await workflow.executeApprovedAction(flow.caseId, transaction);
        logger.info(`Case ID ${flow.caseId} fully approved`);
      } else {
        // Advance to the next approval level
        const nextLevel = flow.currentLevel + 1;
        await flow.update({ currentLevel: nextLevel }, { transaction });
        await workflow.notifyNextLevel(flow.caseId, nextLevel, transaction);
        logger.info(`Case ID ${flow.caseId} advanced to level ${nextLevel}`);
      }
    } catch (err) {
      logger.error(`Error processing approval for case ID ${flow.caseId}: ${err.message}`);
      throw err;
    }
  },

  /**
   * Notify relevant parties about a rejection.
   * @param {object} flow - The approval flow object.
   * @private
   */
  async _notifyRejection(flow) {
    try {
      await workflow.notifyRejection(flow.caseId);
      logger.info(`Rejection notification sent for case ID ${flow.caseId}`);
    } catch (err) {
      logger.error(`Error notifying rejection for case ID ${flow.caseId}: ${err.message}`);
      throw err;
    }
  }
};