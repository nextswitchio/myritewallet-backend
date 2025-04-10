const { Transaction, User, AjoMember, FraudCase } = require('../models');
const { Op } = require('sequelize');

// Configurable risk thresholds
const RISK_THRESHOLDS = {
  highRiskScore: 70,
  lowRiskScore: 30,
  amountMultiplier: 3,
  bulkAmountMultiplier: 5,
  recipientThreshold: 0.3,
  velocityLimit: 5,
  bulkVelocityLimit: 3
};

module.exports = {
  detectFraud: async ({ userId, amount, ip, deviceId, action }) => {
    try {
      const [user, recentTransactions, avgContribution] = await Promise.all([
        User.findByPk(userId),
        Transaction.findAll({
          where: {
            userId,
            createdAt: { [Op.gt]: new Date(Date.now() - 24 * 60 * 60 * 1000) }
          }
        }),
        AjoMember.avg('contributionAmount', { where: { userId } })
      ]);

      if (!user) throw new Error(`User with ID ${userId} not found`);

      // Rule 1: Unusual amount spikes
      const amountRisk = amount > avgContribution * RISK_THRESHOLDS.amountMultiplier ? 30 : 0;

      // Rule 2: New device
      const deviceRisk = user.knownDevices.includes(deviceId) ? 0 : 20;

      // Rule 3: High velocity
      const velocityRisk = recentTransactions.length > RISK_THRESHOLDS.velocityLimit ? 15 : 0;

      const riskLevel = amountRisk + deviceRisk + velocityRisk;

      return {
        riskLevel,
        blockTransaction: riskLevel > RISK_THRESHOLDS.highRiskScore,
        reasonCode: riskLevel > RISK_THRESHOLDS.highRiskScore ? 'HIGH_RISK' : null,
        details: { amountRisk, deviceRisk, velocityRisk }
      };
    } catch (err) {
      console.error('Error in detectFraud:', err);
      throw new Error('Failed to detect fraud');
    }
  },

  detectBulkFraud: async ({ payments, initiatorId, totalAmount }) => {
    try {
      const [initiator, recentBulkOps, avgBulk] = await Promise.all([
        User.findByPk(initiatorId),
        FraudCase.count({
          where: {
            type: 'bulk_payment',
            createdAt: { [Op.gt]: new Date(Date.now() - 24 * 60 * 60 * 1000) }
          }
        }),
        FraudCase.avg('amount', { where: { type: 'bulk_payment' } })
      ]);

      if (!initiator) throw new Error(`User with ID ${initiatorId} not found`);

      // Rule 1: Unusual bulk amount
      const amountRisk = totalAmount > avgBulk * RISK_THRESHOLDS.bulkAmountMultiplier ? 40 : 0;

      // Rule 2: New recipient patterns
      const newRecipients = payments.filter(
        (p) => !initiator.knownRecipients.includes(p.userId)
      ).length;
      const recipientRisk = newRecipients > payments.length * RISK_THRESHOLDS.recipientThreshold ? 30 : 0;

      // Rule 3: High velocity
      const velocityRisk = recentBulkOps > RISK_THRESHOLDS.bulkVelocityLimit ? 20 : 0;

      const riskScore = amountRisk + recipientRisk + velocityRisk;

      return {
        riskScore,
        blockOperation: riskScore > RISK_THRESHOLDS.highRiskScore,
        reason: riskScore > RISK_THRESHOLDS.highRiskScore
          ? `High risk bulk operation (score: ${riskScore})`
          : null,
        details: { amountRisk, recipientRisk, velocityRisk }
      };
    } catch (err) {
      console.error('Error in detectBulkFraud:', err);
      throw new Error('Failed to detect bulk fraud');
    }
  },

  autoResolveFraud: async (caseId, transaction) => {
    try {
      const fraudCase = await FraudCase.findByPk(caseId, { transaction });
      if (!fraudCase) throw new Error('Fraud case not found');

      // Rule 1: Auto-approve low-risk cases
      if (fraudCase.riskScore < RISK_THRESHOLDS.lowRiskScore) {
        await fraudCase.update(
          {
            status: 'resolved',
            metadata: {
              ...fraudCase.metadata,
              resolution: 'Auto-approved (low risk)'
            }
          },
          { transaction }
        );
        return;
      }

      // Rule 2: Flag high-risk for manual review
      if (fraudCase.riskScore > RISK_THRESHOLDS.highRiskScore) {
        await alertAdmin({
          title: 'High Risk Fraud Case',
          message: `Case ${caseId} requires immediate review`,
          caseId
        });
        return;
      }

      // Rule 3: Medium risk - additional verification
      await fraudCase.update(
        {
          status: 'pending_verification',
          metadata: {
            ...fraudCase.metadata,
            actions: ['request_kyc_docs', 'verify_source_of_funds']
          }
        },
        { transaction }
      );
    } catch (err) {
      console.error('Error in autoResolveFraud:', err);
      throw new Error('Failed to auto-resolve fraud case');
    }
  }
};