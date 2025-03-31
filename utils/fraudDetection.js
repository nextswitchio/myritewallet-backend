const { Transaction, User, AjoMember, FraudCase } = require('../models');

module.exports = {
  detectFraud: async ({ userId, amount, ip, deviceId, action }) => {
    const user = await User.findByPk(userId);
    const recentTransactions = await Transaction.findAll({
      where: {
        userId,
        createdAt: { [Op.gt]: new Date(Date.now() - 24 * 60 * 60 * 1000) }
      }
    });

    // Rule 1: Unusual amount spikes
    const avgContribution = await AjoMember.avg('contributionAmount', {
      where: { userId }
    });
    const amountRisk = amount > avgContribution * 3 ? 30 : 0;

    // Rule 2: New device
    const deviceRisk = user.knownDevices.includes(deviceId) ? 0 : 20;

    // Rule 3: High velocity
    const velocityRisk = recentTransactions.length > 5 ? 15 : 0;

    const riskLevel = amountRisk + deviceRisk + velocityRisk;

    return {
      riskLevel,
      blockTransaction: riskLevel > 70,
      reasonCode: riskLevel > 70 ? 'HIGH_RISK' : null,
      details: { amountRisk, deviceRisk, velocityRisk }
    };
  },

  detectBulkFraud: async ({ payments, initiatorId, totalAmount }) => {
    const initiator = await User.findByPk(initiatorId);
    const recentBulkOps = await FraudCase.count({
      where: {
        type: 'bulk_payment',
        createdAt: { [Op.gt]: new Date(Date.now() - 24 * 60 * 60 * 1000) }
      }
    });

    // Rule 1: Unusual bulk amount
    const avgBulk = await FraudCase.avg('amount', {
      where: { type: 'bulk_payment' }
    });
    const amountRisk = totalAmount > avgBulk * 5 ? 40 : 0;

    // Rule 2: New recipient patterns
    const newRecipients = payments.filter(p => 
      !initiator.knownRecipients.includes(p.userId)
    ).length;
    const recipientRisk = newRecipients > payments.length * 0.3 ? 30 : 0;

    // Rule 3: High velocity
    const velocityRisk = recentBulkOps > 3 ? 20 : 0;

    const riskScore = amountRisk + recipientRisk + velocityRisk;

    return {
      riskScore,
      blockOperation: riskScore > 70,
      reason: riskScore > 70 ? 
        `High risk bulk operation (score: ${riskScore})` : null,
      details: { amountRisk, recipientRisk, velocityRisk }
    };
  },
};


module.exports.autoResolveFraud = async (caseId, transaction) => {
  const fraudCase = await FraudCase.findByPk(caseId, { transaction });
  if (!fraudCase) throw new Error('Fraud case not found');

  // Rule 1: Auto-approve low-risk cases
  if (fraudCase.riskScore < 30) {
    await fraudCase.update({
      status: 'resolved',
      metadata: { 
        ...fraudCase.metadata,
        resolution: 'Auto-approved (low risk)'
      }
    }, { transaction });
    return;
  }

  // Rule 2: Flag high-risk for manual review
  if (fraudCase.riskScore > 70) {
    await alertAdmin({
      title: 'High Risk Fraud Case',
      message: `Case ${caseId} requires immediate review`,
      caseId
    });
    return;
  }

  // Rule 3: Medium risk - additional verification
  await fraudCase.update({
    status: 'pending_verification',
    metadata: {
      ...fraudCase.metadata,
      actions: ['request_kyc_docs', 'verify_source_of_funds']
    }
  }, { transaction });
};