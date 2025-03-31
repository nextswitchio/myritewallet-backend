const { ApprovalFlow, FraudCase } = require('../models');
const workflow = require('./workflowEngine');

module.exports = {
  handleResponse: async (caseId, approverId, approved, channel) => {
    const t = await sequelize.transaction();
    try {
      const flow = await ApprovalFlow.findOne({
        where: { caseId },
        include: ['currentLevel'],
        transaction: t
      });

      // Validate response
      if (flow.status !== 'pending') {
        throw new Error('Case already processed');
      }

      // Record response
      await ApprovalResponse.create({
        flowId: flow.id,
        approverId,
        approved,
        channel,
        ipAddress: req.ip
      }, { transaction: t });

      if (approved) {
        await this._processApproval(flow, t);
      } else {
        await flow.update({ status: 'rejected' }, { transaction: t });
        await this._notifyRejection(flow);
      }

      await t.commit();
    } catch (err) {
      await t.rollback();
      throw err;
    }
  },

  async _processApproval(flow, transaction) {
    // Check if final approval
    if (flow.currentLevel >= flow.requiredLevels) {
      await flow.update({ status: 'approved' }, { transaction });
      await workflow.executeApprovedAction(flow.caseId, transaction);
    } else {
      // Advance to next level
      const nextLevel = flow.currentLevel + 1;
      await flow.update({ currentLevel: nextLevel }, { transaction });
      await workflow.notifyNextLevel(flow.caseId, nextLevel, transaction);
    }
  }
};