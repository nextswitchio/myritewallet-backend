const express = require('express');
const router = express.Router();
const transactionController = require('../controllers/transactionController');
const vfdController = require('../controllers/vfdController');
const { authenticate, requireKYC, isAdmin } = require('../middlewares/auth');
const validateRequestBody = require('../middlewares/validateRequestBody');
const validateAdminAction = require('../middlewares/validateAdminAction');
const checkUserStatus = require('../middlewares/checkUserStatus');
const rateLimiter = require('../middlewares/rateLimiter');
const verifyTransactionPin = require('../middlewares/verifyTransactionPin');
const validatePagination = require('../middlewares/validatePagination');
const { param } = require('express-validator');

// User-facing routes
router.get(
  '/',
  authenticate,
  validatePagination,
  transactionController.getAllTransactions
); // Fetch all transactions for the authenticated user
router.get(
  '/:id',
  authenticate,
  param('id').isInt().withMessage('Transaction ID must be an integer'),
  transactionController.getTransactionById
); // Fetch details of a specific transaction

// Deposit routes
router.post(
  '/deposit',
  authenticate,
  requireKYC,
  validateRequestBody(['amount', 'paymentMethod']),
  transactionController.initiateDeposit
); // Validate required fields for deposit

// Withdrawal routes
router.post(
  '/withdraw',
  authenticate,
  checkUserStatus,
  requireKYC,
  validateRequestBody(['amount', 'transactionPin']),
  verifyTransactionPin,
  rateLimiter({ windowMs: 1 * 60 * 1000, max: 5 }), // Limit to 5 requests per minute
  transactionController.initiateWithdrawal
); // Validate required fields for withdrawal

// Transfer routes
router.post(
  '/transfer',
  authenticate,
  checkUserStatus,
  requireKYC,
  validateRequestBody(['amount', 'recipientId', 'transactionPin']),
  verifyTransactionPin,
  transactionController.initiateTransfer
); // Validate required fields for transfer

// Admin routes
router.get(
  '/admin/all',
  authenticate,
  isAdmin,
  validatePagination,
  transactionController.getAllTransactionsAdmin
); // Fetch all transactions (admin only)
router.get(
  '/admin/:id',
  authenticate,
  isAdmin,
  param('id').isInt().withMessage('Transaction ID must be an integer'),
  transactionController.getTransactionByIdAdmin
); // Fetch details of a specific transaction (admin only)
router.post(
  '/admin/reverse/:id',
  authenticate,
  isAdmin,
  rateLimiter({ windowMs: 1 * 60 * 1000, max: 10 }), // Limit to 10 requests per minute
  param('id').isInt().withMessage('Transaction ID must be an integer'),
  transactionController.reverseTransaction
); // Reverse a specific transaction (admin only)
router.post(
  '/admin/fund/:userId',
  authenticate,
  isAdmin,
  validateAdminAction('Admin Fund Wallet'),
  transactionController.adminFundWallet
); // Fund a user's wallet (admin only)
router.post(
  '/admin/charge/:userId',
  authenticate,
  isAdmin,
  validateAdminAction('Admin Charge Wallet'),
  transactionController.adminChargeWallet
); // Charge a user's wallet (admin only)
router.post(
  '/admin/withdraw/:userId',
  authenticate,
  isAdmin,
  validateAdminAction('Admin Withdraw Wallet'),
  transactionController.adminWithdrawFromWallet
); // Log and validate admin action for withdrawing from a wallet

// VFD-specific admin routes
router.post(
  '/bulk',
  authenticate,
  isAdmin,
  vfdController.processBulkPayments
); // Process bulk payments (admin only)
router.post(
  '/:reference/reverse',
  authenticate,
  isAdmin,
  param('reference').isString().withMessage('Transaction reference must be a string'),
  vfdController.reverseTransaction
); // Reverse a transaction by reference (admin only)
router.get(
  '/fraud-cases',
  authenticate,
  isAdmin,
  vfdController.getFraudCases
); // Fetch fraud cases (admin only)

// Webhook routes
router.post('/webhooks/payment', transactionController.handlePaymentWebhook); // Handle payment webhook
router.post('/webhooks/transfer', transactionController.handleTransferWebhook); // Handle transfer webhook
router.post('/webhooks/vfd', vfdController.handleWebhook); // Handle VFD-specific webhook

module.exports = router;