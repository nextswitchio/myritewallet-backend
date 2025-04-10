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
      console.error('Authentication error:', err);
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          error: 'Token has expired. Please log in again.',
          code: 'TOKEN_EXPIRED'
        });
      }
      if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({
          success: false,
          error: 'Invalid token. Please log in again.',
          code: 'INVALID_TOKEN'
        });
      }
      if (err.name === 'NotBeforeError') {
        return res.status(401).json({
          success: false,
          error: 'Token is not yet active. Please check your system clock.',
          code: 'TOKEN_NOT_ACTIVE'
        });
      }
      res.status(401).json({
        success: false,
        error: err.message,
        code: 'AUTHENTICATION_FAILED'
      });
    }
  },

  checkWithdrawalEligibility: async (req, res, next) => {
    try {
      const canWithdraw = await req.user.checkWithdrawalEligibility();
      if (!canWithdraw) {
        return res.status(403).json({
          success: false,
          error: 'Withdrawals temporarily disabled. Please wait 3 days after bank withdrawal.',
          code: 'WITHDRAWAL_COOLDOWN'
        });
      }
      next();
    } catch (err) {
      console.error(`Withdrawal eligibility error for user ${req.user?.id || 'unknown'}:`, err);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        code: 'WITHDRAWAL_CHECK_FAILED'
      });
    }
  },

  requireKYC: (req, res, next) => {
    if (!req.user.isKYCVerified) {
      return res.status(403).json({
        success: false,
        error: 'KYC verification required',
        code: 'KYC_REQUIRED'
      });
    }
    next();
  },

  isAdmin: (req, res, next) => {
    if (!req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        error: 'Admin access required',
        code: 'ADMIN_ACCESS_REQUIRED'
      });
    }
    next();
  }
};