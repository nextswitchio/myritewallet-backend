const express = require('express');
const router = express.Router();
const walletController = require('../controllers/walletController');
const { authenticate, checkWithdrawalEligibility, isAdmin } = require('../middlewares/auth');
const verifyTransactionPin = require('../middlewares/verifyTransactionPin');
const validateRequestBody = require('../middlewares/validateRequestBody');
const rateLimiter = require('../middlewares/rateLimiter');
const checkUserStatus = require('../middlewares/checkUserStatus');
const validatePagination = require('../middlewares/validatePagination');
const { param } = require('express-validator');

// User Wallet Routes
router.post(
  '/fund',
  authenticate,
  validateRequestBody(['amount', 'paymentMethod']),
  walletController.fundWallet
); // Fund the wallet
router.post(
  '/withdraw',
  authenticate,
  checkUserStatus,
  requireKYC,
  validateRequestBody(['amount', 'transactionPin']),
  verifyTransactionPin,
  checkWithdrawalEligibility,
  rateLimiter({ windowMs: 1 * 60 * 1000, max: 5 }), // Limit to 5 requests per minute
  walletController.withdraw
); // Withdraw from the wallet
router.get('/balance', authenticate, walletController.getBalance); // Get wallet balance
router.get(
  '/transactions',
  authenticate,
  validatePagination,
  walletController.getTransactions
); // Get wallet transactions

// Admin Wallet Routes
router.get(
  '/admin/all',
  authenticate,
  isAdmin,
  validatePagination,
  walletController.getAllWallets
); // Fetch all wallets (admin only)
router.get(
  '/admin/:userId',
  authenticate,
  isAdmin,
  param('userId').isInt().withMessage('User ID must be an integer'),
  walletController.getWalletByUserId
); // Fetch wallet details of a specific user (admin only)
router.post(
  '/admin/fund/:userId',
  authenticate,
  isAdmin,
  param('userId').isInt().withMessage('User ID must be an integer'),
  validateRequestBody(['amount']),
  walletController.adminFundWallet
); // Admin funds a user's wallet
router.post(
  '/admin/withdraw/:userId',
  authenticate,
  isAdmin,
  param('userId').isInt().withMessage('User ID must be an integer'),
  rateLimiter({ windowMs: 1 * 60 * 1000, max: 10 }), // Limit to 10 requests per minute
  walletController.adminWithdrawFromWallet
); // Admin withdraws from a user's wallet

// Webhook Routes
router.post(
  '/webhook/fund',
  rateLimiter({ windowMs: 1 * 60 * 1000, max: 20 }), // Limit to 20 requests per minute
  walletController.handleFundWebhook
); // Handle wallet funding webhook
router.post(
  '/webhook/withdraw',
  rateLimiter({ windowMs: 1 * 60 * 1000, max: 20 }), // Limit to 20 requests per minute
  walletController.handleWithdrawWebhook
); // Handle wallet withdrawal webhook

module.exports = router;