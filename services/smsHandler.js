const { ApprovalFlow, User } = require('../models');

module.exports = {
  handleSMSResponse: async (phone, message, caseId) => {
    const user = await User.findOne({ where: { phone } });
    if (!user) return { error: 'User not found' };

    const flow = await ApprovalFlow.findOne({ 
      where: { caseId },
      include: ['currentApprovers']
    });

    // Validate approver
    const isApprover = flow.currentApprovers.some(a => a.id === user.id);
    if (!isApprover) return { error: 'Not an approver for this case' };

    // Process response
    const response = message.trim().toUpperCase();
    if (response.startsWith('YES')) {
      await this._approveCase(flow, user);
    } else if (response.startsWith('NO')) {
      await this._rejectCase(flow, user);
    }

    return { success: true };
  },

  async _approveCase(flow, user) {
    // Check if this is the final approval
    if (flow.currentLevel >= flow.requiredLevels) {
      await flow.update({ 
        status: 'approved',
        approvedBy: user.id,
        completedAt: new Date()
      });
      await executeApprovedAction(flow.caseId);
    } else {
      // Move to next level
      const nextLevel = flow.currentLevel + 1;
      await flow.update({ currentLevel: nextLevel });
      await notifyNextApprovers(flow.caseId, nextLevel);
    }
  }
};