const { SavingsGoal, FlexibleSavings, Transaction } = require('../models');

module.exports = {
  // Goal Savings
  createGoal: async (req, res) => {
    try {
      const goal = await SavingsGoal.create({
        ...req.body,
        userId: req.user.id
      });
      res.status(201).json(goal);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  },

  contributeToGoal: async (req, res) => {
    const t = await sequelize.transaction();
    try {
      const { goalId, amount } = req.body;
      
      // Deduct from wallet
      await req.user.wallet.decrement('balance', { by: amount, transaction: t });
      
      // Add to goal
      const goal = await SavingsGoal.findByPk(goalId, { transaction: t });
      await goal.increment('currentAmount', { by: amount, transaction: t });

      // Check if goal completed
      if (goal.currentAmount >= goal.targetAmount) {
        await goal.update({ isCompleted: true }, { transaction: t });
      }

      await Transaction.create({
        userId: req.user.id,
        savingsGoalId: goalId,
        amount,
        type: 'goal_contribution',
        status: 'success'
      }, { transaction: t });

      await t.commit();
      res.json(goal);
    } catch (err) {
      await t.rollback();
      res.status(400).json({ error: err.message });
    }
  },

  // Flexible Savings
  addToFlexible: async (req, res) => {
    const t = await sequelize.transaction();
    try {
      const { amount } = req.body;
      
      await req.user.wallet.decrement('balance', { by: amount, transaction: t });
      await FlexibleSavings.increment('balance', { 
        by: amount, 
        where: { userId: req.user.id },
        transaction: t 
      });

      await Transaction.create({
        userId: req.user.id,
        amount,
        type: 'flexible_deposit',
        status: 'success'
      }, { transaction: t });

      await t.commit();
      res.json({ success: true });
    } catch (err) {
      await t.rollback();
      res.status(400).json({ error: err.message });
    }
  },

  withdrawFlexible: async (req, res) => {
    const t = await sequelize.transaction();
    try {
      const { amount } = req.body;
      const savings = await FlexibleSavings.findOne({ 
        where: { userId: req.user.id },
        transaction: t 
      });

      if (savings.balance < amount) {
        throw new Error('Insufficient savings balance');
      }

      // Initiate withdrawal (3-day delay)
      await savings.update({
        balance: sequelize.literal(`balance - ${amount}`),
        withdrawalStatus: 'pending',
        lastWithdrawalAt: new Date()
      }, { transaction: t });

      await Transaction.create({
        userId: req.user.id,
        amount,
        type: 'flexible_withdrawal',
        status: 'processing',
        metadata: { estimatedCompletion: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) }
      }, { transaction: t });

      // Disable immediate withdrawals
      await req.user.update({ 
        withdrawalStatus: 'inactive',
        lastWithdrawalAt: new Date()
      }, { transaction: t });

      await t.commit();
      res.json({ 
        success: true,
        availableAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
      });
    } catch (err) {
      await t.rollback();
      res.status(400).json({ error: err.message });
    }
  }
};