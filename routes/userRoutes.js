const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticate } = require('../middlewares/auth');
const validateRequestBody = require('../middlewares/validateRequestBody');
const rateLimiter = require('../middlewares/rateLimiter');
const checkUserStatus = require('../middlewares/checkUserStatus');
const validatePagination = require('../middlewares/validatePagination');

// Public routes
router.post(
  '/register',
  validateRequestBody(['email', 'password', 'phone']),
  userController.register
); // Register a new user
router.post(
  '/verify-otp',
  rateLimiter({ windowMs: 5 * 60 * 1000, max: 5 }), // Limit to 5 requests per 5 minutes
  validateRequestBody(['otp']),
  userController.verifyOTP
); // Verify OTP
router.post(
  '/login',
  rateLimiter({ windowMs: 15 * 60 * 1000, max: 10 }), // Limit to 10 requests per 15 minutes
  validateRequestBody(['email', 'password']),
  userController.login
); // Login a user

// Authenticated routes
router.post('/complete-kyc', authenticate, userController.completeKYC); // Complete KYC
router.get('/withdrawal-status', authenticate, userController.checkWithdrawalStatus); // Check withdrawal status
router.get('/profile', authenticate, checkUserStatus, userController.getProfile); // Fetch user profile
router.put('/profile', authenticate, checkUserStatus, userController.updateProfile); // Update user profile
router.post(
  '/change-password',
  authenticate,
  rateLimiter({ windowMs: 1 * 60 * 1000, max: 5 }), // Limit to 5 requests per minute
  validateRequestBody(['currentPassword', 'newPassword']),
  userController.changePassword
); // Change user password
router.post(
  '/set-transaction-pin',
  authenticate,
  rateLimiter({ windowMs: 15 * 60 * 1000, max: 5 }), // Limit to 5 requests per 15 minutes
  validateRequestBody(['pin']),
  userController.setTransactionPin
); // Set transaction PIN
router.post(
  '/verify-transaction-pin',
  authenticate,
  rateLimiter({ windowMs: 1 * 60 * 1000, max: 5 }), // Limit to 5 requests per minute
  validateRequestBody(['transactionPin']),
  userController.verifyTransactionPin
); // Verify transaction PIN
router.get(
  '/notifications',
  authenticate,
  validatePagination,
  userController.getNotifications
); // Fetch user notifications
router.post('/logout', authenticate, userController.logout); // Logout user

module.exports = router;