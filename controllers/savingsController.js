const { SavingsGoal, FlexibleSavings, Transaction, sequelize } = require('../models');
const vfdService = require('../services/vfdService');

module.exports = {
  // Create a Targeted/Goal Savings
  createGoal: async (req, res) => {
    const t = await sequelize.transaction();
    try {
      const { targetAmount, targetDate, name, frequency, autoDebit } = req.body;

      // Validate target date (must be in the future)
      if (new Date(targetDate) <= new Date()) {
        await t.rollback();
        return res.status(400).json({ error: 'Target date must be in the future' });
      }

      // Validate target amount
      if (targetAmount <= 0) {
        await t.rollback();
        return res.status(400).json({ error: 'Target amount must be positive' });
      }

      const goal = await SavingsGoal.create({
        userId: req.user.id,
        name,
        targetAmount,
        currentAmount: 0,
        targetDate,
        frequency,
        autoDebit: autoDebit || false,
        isCompleted: false
      }, { transaction: t });

      // Award points for creating a goal
      await req.user.increment('points', { by: 10, transaction: t });

      // Notify user
      await Notification.create({
        userId: req.user.id,
        type: 'goal_creation',
        message: `Your savings goal "${name}" has been created successfully.`,
        status: 'unread'
      }, { transaction: t });

      await t.commit();

      res.status(201).json({
        success: true,
        goal,
        pointsEarned: 10
      });
    } catch (err) {
      await t.rollback();
      res.status(400).json({ error: err.message });
    }
  },

  // Contribute to a Targeted/Goal Savings
  contributeToGoal: async (req, res) => {
    const t = await sequelize.transaction();
    try {
      const { goalId, amount, pin } = req.body;

      // Verify transaction PIN
      if (!req.user.verifyPin(pin)) {
        await t.rollback();
        return res.status(403).json({ error: 'Invalid transaction PIN' });
      }

      // Validate amount
      if (amount <= 0) {
        await t.rollback();
        return res.status(400).json({ error: 'Amount must be positive' });
      }

      // Deduct from wallet
      if (req.user.wallet.balance < amount) {
        await t.rollback();
        return res.status(400).json({ error: 'Insufficient wallet balance' });
      }
      await req.user.wallet.decrement('balance', { by: amount, transaction: t });

      // Add to goal
      const goal = await SavingsGoal.findByPk(goalId, { transaction: t });
      if (!goal) {
        await t.rollback();
        return res.status(404).json({ error: 'Savings goal not found' });
      }
      if (goal.isCompleted) {
        await t.rollback();
        return res.status(400).json({ error: 'Goal already completed' });
      }

      await goal.increment('currentAmount', { by: amount, transaction: t });

      // Check if goal is completed
      const isCompleted = goal.currentAmount >= goal.targetAmount;
      if (isCompleted) {
        await goal.update({ isCompleted: true }, { transaction: t });
      }

      // Record transaction
      await Transaction.create({
        userId: req.user.id,
        savingsGoalId: goalId,
        amount,
        type: 'goal_contribution',
        status: 'success',
        reference: `GC-${Date.now()}`,
        metadata: { goalName: goal.name }
      }, { transaction: t });

      // Award points (1 point per ₦100)
      const pointsEarned = Math.floor(amount / 100);
      if (pointsEarned > 0) {
        await req.user.increment('points', { by: pointsEarned, transaction: t });
      }

      // Notify user
      await Notification.create({
        userId: req.user.id,
        type: 'goal_contribution',
        message: `You have contributed ₦${amount} to your savings goal "${goal.name}".`,
        status: 'unread'
      }, { transaction: t });

      await t.commit();

      res.json({
        success: true,
        goal,
        isCompleted,
        pointsEarned
      });
    } catch (err) {
      await t.rollback();
      res.status(400).json({ error: err.message });
    }
  },

  // Withdraw from Targeted/Goal Savings
  withdrawFromGoal: async (req, res) => {
    const t = await sequelize.transaction();
    try {
      const { goalId, pin } = req.body;

      // Verify transaction PIN
      if (!req.user.verifyPin(pin)) {
        await t.rollback();
        return res.status(403).json({ error: 'Invalid transaction PIN' });
      }

      const goal = await SavingsGoal.findByPk(goalId, { transaction: t });
      if (!goal) {
        await t.rollback();
        return res.status(404).json({ error: 'Savings goal not found' });
      }

      // Validate
      if (goal.userId !== req.user.id) {
        await t.rollback();
        return res.status(403).json({ error: 'Not your savings goal' });
      }
      if (goal.currentAmount <= 0) {
        await t.rollback();
        return res.status(400).json({ error: 'No funds to withdraw' });
      }

      // Calculate penalty for early withdrawal (5%)
      const penaltyAmount = goal.currentAmount * 0.05;
      const withdrawalAmount = goal.currentAmount - penaltyAmount;

      // Credit user's wallet
      await vfdService.creditUser(
        req.user.id,
        withdrawalAmount,
        `Early withdrawal from "${goal.name}"`,
        t
      );

      // Record penalty transaction
      await Transaction.create({
        userId: req.user.id,
        amount: penaltyAmount,
        type: 'early_withdrawal_penalty',
        status: 'success',
        reference: `EWP-${Date.now()}`,
        metadata: { goalName: goal.name }
      }, { transaction: t });

      // Reset goal
      await goal.update({
        currentAmount: 0,
        isCompleted: false
      }, { transaction: t });

      // Record withdrawal transaction
      await Transaction.create({
        userId: req.user.id,
        savingsGoalId: goalId,
        amount: withdrawalAmount,
        type: 'goal_withdrawal',
        status: 'success',
        reference: `GW-${Date.now()}`,
        metadata: { goalName: goal.name, penaltyAmount }
      }, { transaction: t });

      // Deduct points (10% of penalty amount)
      const pointsDeducted = Math.floor(penaltyAmount / 10);
      if (pointsDeducted > 0) {
        await req.user.decrement('points', { by: pointsDeducted, transaction: t });
      }

      // Notify user
      await Notification.create({
        userId: req.user.id,
        type: 'goal_withdrawal',
        message: `You have withdrawn ₦${withdrawalAmount} from your savings goal "${goal.name}". Penalty applied: ₦${penaltyAmount}.`,
        status: 'unread'
      }, { transaction: t });

      await t.commit();

      res.json({
        success: true,
        amountWithdrawn: withdrawalAmount,
        penaltyAmount,
        pointsDeducted
      });
    } catch (err) {
      await t.rollback();
      res.status(400).json({ error: err.message });
    }
  },

  // Auto-Debit for Goal Savings (Recurring Contributions)
  autoDebitGoal: async () => {
    const t = await sequelize.transaction();
    try {
      const goals = await SavingsGoal.findAll({
        where: { autoDebit: true, isCompleted: false },
        include: [{ model: User, as: 'user', include: ['wallet'] }],
        transaction: t
      });

      for (const goal of goals) {
        const user = goal.user;

        // Check if user has sufficient wallet balance
        if (user.wallet.balance >= goal.frequency) {
          // Deduct from wallet and add to goal
          await user.wallet.decrement('balance', { by: goal.frequency, transaction: t });
          await goal.increment('currentAmount', { by: goal.frequency, transaction: t });

          // Record transaction
          await Transaction.create({
            userId: user.id,
            savingsGoalId: goal.id,
            amount: goal.frequency,
            type: 'goal_auto_debit',
            status: 'success',
            reference: `AD-${Date.now()}`,
            metadata: { goalName: goal.name }
          }, { transaction: t });

          // Notify user
          await Notification.create({
            userId: user.id,
            type: 'goal_auto_debit',
            message: `₦${goal.frequency} has been auto-debited for your savings goal "${goal.name}".`,
            status: 'unread'
          }, { transaction: t });
        }
      }

      await t.commit();
    } catch (err) {
      await t.rollback();
      console.error('Failed to process auto-debit for goals:', err);
    }
  },

  // Flexible Savings with enhanced features
  addToFlexible: async (req, res) => {
    const t = await sequelize.transaction();
    try {
      const { amount, pin } = req.body;
      
      // Verify transaction PIN
      if (!req.user.verifyPin(pin)) {
        await t.rollback();
        return res.status(403).json({ error: 'Invalid transaction PIN' });
      }
      
      // Validate amount
      if (amount <= 0) {
        await t.rollback();
        return res.status(400).json({ error: 'Amount must be positive' });
      }
      
      // Check wallet balance
      if (req.user.wallet.balance < amount) {
        await t.rollback();
        return res.status(400).json({ error: 'Insufficient balance' });
      }
      
      // Deduct from wallet
      await req.user.wallet.decrement('balance', { by: amount, transaction: t });
      
      // Add to flexible savings
      const [savings, created] = await FlexibleSavings.findOrCreate({
        where: { userId: req.user.id },
        defaults: { balance: 0 },
        transaction: t
      });
      
      await savings.increment('balance', { by: amount, transaction: t });
      
      // Record transaction
      await Transaction.create({
        userId: req.user.id,
        amount,
        type: 'flexible_deposit',
        status: 'success',
        reference: `FD-${Date.now()}`
      }, { transaction: t });
      
      // Award points (1 point per ₦100)
      const pointsEarned = Math.floor(amount / 100);
      if (pointsEarned > 0) {
        await req.user.increment('points', { by: pointsEarned, transaction: t });
      }
      
      // Check for consistency bonus
      const lastMonthDeposits = await Transaction.count({
        where: {
          userId: req.user.id,
          type: 'flexible_deposit',
          createdAt: { [Op.gte]: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
        },
        transaction: t
      });
      
      if (lastMonthDeposits >= 4) { // At least 4 deposits in last 30 days
        await req.user.increment('points', { by: 10, transaction: t });
        pointsEarned += 10;
      }
      
      await t.commit();
      
      res.json({
        success: true,
        newBalance: savings.balance,
        pointsEarned
      });
      
    } catch (err) {
      await t.rollback();
      res.status(400).json({ error: err.message });
    }
  },

  withdrawFlexible: async (req, res) => {
    const t = await sequelize.transaction();
    try {
      const { amount, pin } = req.body;
      
      // Verify transaction PIN
      if (!req.user.verifyPin(pin)) {
        await t.rollback();
        return res.status(403).json({ error: 'Invalid transaction PIN' });
      }
      
      // Validate amount
      if (amount <= 0) {
        await t.rollback();
        return res.status(400).json({ error: 'Amount must be positive' });
      }
      
      const savings = await FlexibleSavings.findOne({ 
        where: { userId: req.user.id },
        transaction: t 
      });
      
      if (!savings || savings.balance < amount) {
        await t.rollback();
        return res.status(400).json({ error: 'Insufficient savings balance' });
      }
      
      // Initiate withdrawal (3-day delay)
      await savings.update({
        balance: sequelize.literal(`balance - ${amount}`),
        withdrawalStatus: 'pending',
        lastWithdrawalAt: new Date()
      }, { transaction: t });
      
      // Record transaction
      await Transaction.create({
        userId: req.user.id,
        amount,
        type: 'flexible_withdrawal',
        status: 'processing',
        reference: `FW-${Date.now()}`,
        metadata: { 
          estimatedCompletion: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
        }
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
  },
  
  // Process pending flexible withdrawals (cron job)
  processFlexibleWithdrawals: async () => {
    const t = await sequelize.transaction();
    try {
      // Find withdrawals pending for more than 3 days
      const pendingWithdrawals = await Transaction.findAll({
        where: {
          type: 'flexible_withdrawal',
          status: 'processing',
          createdAt: { [Op.lte]: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) }
        },
        transaction: t
      });
      
      await Promise.all(pendingWithdrawals.map(async (txn) => {
        // Credit user's wallet
        await vfdService.creditUser(
          txn.userId,
          txn.amount,
          'Flexible savings withdrawal',
          t
        );
        
        // Update transaction status
        await txn.update({ status: 'success' }, { transaction: t });
        
        // Enable withdrawals for user
        await User.update(
          { withdrawalStatus: 'active' },
          { where: { id: txn.userId }, transaction: t }
        );
        
        // Notify user
        await Notification.create({
          userId: txn.userId,
          title: 'Withdrawal Completed',
          message: `₦${txn.amount} has been credited to your wallet from flexible savings`,
          type: 'withdrawal'
        }, { transaction: t });
      }));
      
      await t.commit();
      
    } catch (err) {
      await t.rollback();
      console.error('Failed to process flexible withdrawals:', err);
      throw err;
    }
  }
};