const { CronLog, AjoGroup, User, Transaction, Dispute, Referral, KYCRequest } = require('../models');
const { Op } = require('sequelize');
const vfdService = require('../services/vfdService');

module.exports = {
  // Get admin dashboard stats
  getDashboardStats: async (req, res) => {
    try {
      const [users, groups, transactions, disputes, referrals, kycRequests] = await Promise.all([
        User.count(),
        AjoGroup.count(),
        Transaction.sum('amount'),
        Dispute.count({ where: { status: 'open' } }),
        Referral.count({ where: { isCompleted: true } }),
        KYCRequest.count({ where: { status: 'pending' } })
      ]);
      
      res.json({
        totalUsers: users,
        activeUsers: await User.count({ where: { isActive: true } }),
        activeGroups: await AjoGroup.count({ where: { status: 'active' } }),
        totalVolume: transactions || 0,
        openDisputes: disputes,
        completedReferrals: referrals,
        pendingKYCs: kycRequests
      });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  },

  // Get cron job logs
  getCronLogs: async (req, res) => {
    try {
      const { limit = 100, offset = 0 } = req.query;
      const logs = await CronLog.findAll({
        order: [['createdAt', 'DESC']],
        limit: parseInt(limit),
        offset: parseInt(offset)
      });
      res.json(logs);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  },

  // Force payout (admin override)
  forcePayout: async (req, res) => {
    try {
      const { ajoId } = req.params;
      await require('../controllers/ajoController').processPayout(ajoId);
      res.json({ success: true });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  },

  // Suspend user
  suspendUser: async (req, res) => {
    try {
      const { userId } = req.params;
      const { reason } = req.body;
      
      await User.update({ 
        isActive: false,
        suspensionReason: reason,
        suspendedAt: new Date(),
        suspendedBy: req.user.id 
      }, { where: { id: userId } });
      
      // Cancel all pending transactions
      await Transaction.update(
        { status: 'cancelled' },
        { where: { userId, status: 'pending' } }
      );
      
      // Notify user
      await Notification.create({
        userId,
        title: 'Account Suspended',
        message: `Your account has been suspended. Reason: ${reason}`,
        type: 'account'
      });
      
      res.json({ success: true });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  },

  // Unsuspend user
  unsuspendUser: async (req, res) => {
    try {
      const { userId } = req.params;
      
      await User.update({ 
        isActive: true,
        suspensionReason: null,
        suspendedAt: null,
        suspendedBy: null 
      }, { where: { id: userId } });
      
      // Notify user
      await Notification.create({
        userId,
        title: 'Account Reactivated',
        message: 'Your account has been reactivated',
        type: 'account'
      });
      
      res.json({ success: true });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  },

  // Resolve dispute
  resolveDispute: async (req, res) => {
    const t = await sequelize.transaction();
    try {
      const { disputeId } = req.params;
      const { resolution, penaltyAdjustment } = req.body;
      
      const dispute = await Dispute.findByPk(disputeId, { transaction: t });
      if (!dispute) throw new Error('Dispute not found');
      
      // Update dispute
      await dispute.update({
        status: 'resolved',
        resolution,
        resolvedBy: req.user.id,
        resolvedAt: new Date()
      }, { transaction: t });
      
      // Apply penalty adjustment if any
      if (penaltyAdjustment) {
        await Transaction.create({
          userId: dispute.userId,
          amount: penaltyAdjustment,
          type: 'penalty_adjustment',
          status: 'success',
          reference: `PADJ-${Date.now()}`,
          metadata: { disputeId }
        }, { transaction: t });
      }
      
      // Notify user
      await Notification.create({
        userId: dispute.userId,
        title: 'Dispute Resolved',
        message: `Your dispute has been resolved: ${resolution}`,
        type: 'dispute'
      }, { transaction: t });
      
      await t.commit();
      res.json({ success: true });
    } catch (err) {
      await t.rollback();
      res.status(400).json({ error: err.message });
    }
  },

  // Approve KYC
  approveKYC: async (req, res) => {
    const t = await sequelize.transaction();
    try {
      const { requestId } = req.params;
      const { level } = req.body;
      
      const kycRequest = await KYCRequest.findByPk(requestId, { 
        include: [User],
        transaction: t 
      });
      
      if (!kycRequest) throw new Error('KYC request not found');
      
      // Update KYC status
      await kycRequest.update({
        status: 'approved',
        reviewedBy: req.user.id,
        reviewedAt: new Date()
      }, { transaction: t });
      
      // Update user KYC level and award points
      const pointsToAdd = level === 1 ? 100 : 150;
      await User.update({
        isKYCVerified: true,
        kycLevel: level,
        points: sequelize.literal(`points + ${pointsToAdd}`)
      }, { 
        where: { id: kycRequest.userId },
        transaction: t 
      });
      
      // Notify user
      await Notification.create({
        userId: kycRequest.userId,
        title: 'KYC Approved',
        message: `Your KYC verification (Level ${level}) has been approved`,
        type: 'kyc'
      }, { transaction: t });
      
      await t.commit();
      res.json({ success: true });
    } catch (err) {
      await t.rollback();
      res.status(400).json({ error: err.message });
    }
  },

  // Reject KYC
  rejectKYC: async (req, res) => {
    const t = await sequelize.transaction();
    try {
      const { requestId } = req.params;
      const { reason } = req.body;
      
      const kycRequest = await KYCRequest.findByPk(requestId, { 
        include: [User],
        transaction: t 
      });
      
      if (!kycRequest) throw new Error('KYC request not found');
      
      // Update KYC status
      await kycRequest.update({
        status: 'rejected',
        rejectionReason: reason,
        reviewedBy: req.user.id,
        reviewedAt: new Date()
      }, { transaction: t });
      
      // Notify user
      await Notification.create({
        userId: kycRequest.userId,
        title: 'KYC Rejected',
        message: `Your KYC verification was rejected. Reason: ${reason}`,
        type: 'kyc'
      }, { transaction: t });
      
      await t.commit();
      res.json({ success: true });
    } catch (err) {
      await t.rollback();
      res.status(400).json({ error: err.message });
    }
  },

  // Get all users with filters
  getUsers: async (req, res) => {
    try {
      const { limit = 50, offset = 0, status, search } = req.query;
      
      const where = {};
      if (status) where.isActive = status === 'active';
      if (search) {
        where[Op.or] = [
          { firstName: { [Op.iLike]: `%${search}%` } },
          { lastName: { [Op.iLike]: `%${search}%` } },
          { email: { [Op.iLike]: `%${search}%` } },
          { phone: { [Op.iLike]: `%${search}%` } }
        ];
      }
      
      const users = await User.findAll({
        where,
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [['createdAt', 'DESC']],
        attributes: { exclude: ['password', 'otp'] }
      });
      
      res.json(users);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  },

  // Get user details
  getUser: async (req, res) => {
    try {
      const { userId } = req.params;
      
      const user = await User.findByPk(userId, {
        include: [
          { model: Wallet, as: 'wallet' },
          { model: AjoGroup, as: 'createdGroups' },
          { model: AjoMember, as: 'ajoMemberships' },
          { model: SavingsGoal, as: 'savingsGoals' },
          { model: FlexibleSavings, as: 'flexibleSavings' },
          { model: Transaction, as: 'transactions' }
        ],
        attributes: { exclude: ['password', 'otp'] }
      });
      
      if (!user) throw new Error('User not found');
      
      res.json(user);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  },

  // Adjust group settings
  adjustGroupSettings: async (req, res) => {
    try {
      const { ajoId } = req.params;
      const updates = req.body;
      
      await AjoGroup.update(updates, { where: { id: ajoId } });
      res.json({ success: true });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  },

  // Get all disputes
  getDisputes: async (req, res) => {
    try {
      const { status, limit = 50, offset = 0 } = req.query;
      
      const where = {};
      if (status) where.status = status;
      
      const disputes = await Dispute.findAll({
        where,
        include: [
          { model: User, as: 'user', attributes: ['id', 'firstName', 'lastName'] },
          { model: AjoGroup, as: 'ajo', attributes: ['id', 'title'] }
        ],
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [['createdAt', 'DESC']]
      });
      
      res.json(disputes);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  },

  // Get all transactions
  getTransactions: async (req, res) => {
    try {
      const { type, status, limit = 100, offset = 0 } = req.query;
      
      const where = {};
      if (type) where.type = type;
      if (status) where.status = status;
      
      const transactions = await Transaction.findAll({
        where,
        include: [
          { model: User, as: 'user', attributes: ['id', 'firstName', 'lastName'] },
          { model: AjoGroup, as: 'ajo', attributes: ['id', 'title'] }
        ],
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [['createdAt', 'DESC']]
      });
      
      res.json(transactions);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }
};