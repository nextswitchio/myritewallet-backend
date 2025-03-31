const jwt = require('jsonwebtoken');
const { User } = require('../models');

module.exports = {
  authenticate: async (req, res, next) => {
    try {
      const token = req.header('Authorization')?.replace('Bearer ', '');
      if (!token) throw new Error('Access denied');

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findByPk(decoded.id);
      if (!user) throw new Error('User not found');

      req.user = user;
      req.token = token;
      next();
    } catch (err) {
      res.status(401).json({ 
        success: false,
        error: err.message 
      });
    }
  },

  checkWithdrawalEligibility: async (req, res, next) => {
    try {
      const canWithdraw = await req.user.checkWithdrawalEligibility();
      if (!canWithdraw) {
        return res.status(403).json({
          error: 'Withdrawals temporarily disabled. Please wait 3 days after bank withdrawal.',
          code: 'WITHDRAWAL_COOLDOWN'
        });
      }
      next();
    } catch (err) {
      next(err);
    }
  },

  requireKYC: (req, res, next) => {
    if (!req.user.isKYCVerified) {
      return res.status(403).json({
        success: false,
        error: 'KYC verification required'
      });
    }
    next();
  }
};

exports.isAdmin = (req, res, next) => {
  if (req.headers['x-admin-key'] !== process.env.ADMIN_API_KEY) {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};