const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticate } = require('../middlewares/auth');
const validateRequestBody = require('../middlewares/validateRequestBody');
const rateLimiter = require('../middlewares/rateLimiter');
const checkUserStatus = require('../middlewares/checkUserStatus');
const validatePagination = require('../middlewares/validatePagination');

// Public routes

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: User management and authentication
 */

/**
 * @swagger
 * /api/users/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 example: user@example.com
 *               password:
 *                 type: string
 *                 example: StrongPassword123!
 *               phone:
 *                 type: string
 *                 example: +2348000000000
 *     responses:
 *       201:
 *         description: User registered successfully
 *       400:
 *         description: Validation error
 */
router.post(
  '/register',
  validateRequestBody(['email', 'password', 'phone']),
  userController.register
); // Register a new user

/**
 * @swagger
 * /api/users/verify-otp:
 *   post:
 *     summary: Verify OTP
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               otp:
 *                 type: string
 *                 example: 123456
 *     responses:
 *       200:
 *         description: OTP verified successfully
 *       400:
 *         description: Invalid OTP
 */
router.post(
  '/verify-otp',
  rateLimiter({ windowMs: 5 * 60 * 1000, max: 5 }), // Limit to 5 requests per 5 minutes
  validateRequestBody(['otp']),
  userController.verifyOTP
); // Verify OTP


/**
 * @swagger
 * /api/users/login:
 *   post:
 *     summary: Login a user
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 example: user@example.com
 *               password:
 *                 type: string
 *                 example: StrongPassword123!
 *     responses:
 *       200:
 *         description: Login successful
 *       401:
 *         description: Invalid credentials
 */
router.post(
  '/login',
  rateLimiter({ windowMs: 15 * 60 * 1000, max: 10 }), // Limit to 10 requests per 15 minutes
  validateRequestBody(['email', 'password']),
  userController.login
); // Login a user

// Authenticated routes

/**
 * @swagger
 * /api/users/complete-kyc:
 *   post:
 *     summary: Complete KYC for a user
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               bvn:
 *                 type: string
 *                 example: 12345678901
 *               accountNumber:
 *                 type: string
 *                 example: 0123456789
 *               bankCode:
 *                 type: string
 *                 example: 044
 *     responses:
 *       200:
 *         description: KYC completed successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
router.post('/complete-kyc', authenticate, userController.completeKYC); // Complete KYC


/**
 * @swagger
 * /api/users/withdrawal-status:
 *   get:
 *     summary: Check the status of a user's withdrawal
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Withdrawal status fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "pending"
 *                 amount:
 *                   type: number
 *                   example: 5000
 *                 date:
 *                   type: string
 *                   format: date-time
 *                   example: "2025-04-10T10:00:00Z"
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Withdrawal not found
 */
router.get('/withdrawal-status', authenticate, userController.checkWithdrawalStatus); // Check withdrawal status

/**
 * @swagger
 * /api/users/profile:
 *   get:
 *     summary: Fetch user profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile fetched successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/profile', authenticate, checkUserStatus, userController.getProfile); // Fetch user profile


/**
 * @swagger
 * /api/users/profile:
 *   put:
 *     summary: Update user profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: John Doe
 *               phone:
 *                 type: string
 *                 example: +2348000000000
 *     responses:
 *       200:
 *         description: User profile updated successfully
 *       400:
 *         description: Validation error
 */
router.put('/profile', authenticate, checkUserStatus, userController.updateProfile); // Update user profile


/**
 * @swagger
 * /api/users/change-password:
 *   post:
 *     summary: Change user password
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               currentPassword:
 *                 type: string
 *                 example: OldPassword123!
 *               newPassword:
 *                 type: string
 *                 example: NewPassword123!
 *     responses:
 *       200:
 *         description: Password changed successfully
 *       400:
 *         description: Validation error
 */
router.post(
  '/change-password',
  authenticate,
  rateLimiter({ windowMs: 1 * 60 * 1000, max: 5 }), // Limit to 5 requests per minute
  validateRequestBody(['currentPassword', 'newPassword']),
  userController.changePassword
); // Change user password


/**
 * @swagger
 * /api/users/set-transaction-pin:
 *   post:
 *     summary: Set transaction PIN
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               pin:
 *                 type: string
 *                 example: 1234
 *     responses:
 *       200:
 *         description: Transaction PIN set successfully
 *       400:
 *         description: Validation error
 */
router.post(
  '/set-transaction-pin',
  authenticate,
  rateLimiter({ windowMs: 15 * 60 * 1000, max: 5 }), // Limit to 5 requests per 15 minutes
  validateRequestBody(['pin']),
  userController.setTransactionPin
); // Set transaction PIN


/**
 * @swagger
 * /api/users/verify-transaction-pin:
 *   post:
 *     summary: Verify transaction PIN
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               transactionPin:
 *                 type: string
 *                 example: 1234
 *     responses:
 *       200:
 *         description: Transaction PIN verified successfully
 *       400:
 *         description: Invalid PIN
 */
router.post(
  '/verify-transaction-pin',
  authenticate,
  rateLimiter({ windowMs: 1 * 60 * 1000, max: 5 }), // Limit to 5 requests per minute
  validateRequestBody(['transactionPin']),
  userController.verifyTransactionPin
); // Verify transaction PIN


/**
 * @swagger
 * /api/users/notifications:
 *   get:
 *     summary: Fetch user notifications
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           example: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *           example: 10
 *         description: Number of notifications per page
 *     responses:
 *       200:
 *         description: Notifications fetched successfully
 *       401:
 *         description: Unauthorized
 */
router.get(
  '/notifications',
  authenticate,
  validatePagination,
  userController.getNotifications
); // Fetch user notifications


/**
 * @swagger
 * /api/users/logout:
 *   post:
 *     summary: Logout user
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User logged out successfully
 */
router.post('/logout', authenticate, userController.logout); // Logout user

module.exports = router;