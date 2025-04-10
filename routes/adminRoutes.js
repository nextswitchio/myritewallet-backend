const express = require('express');
const router = express.Router();
const { param } = require('express-validator');
const { authenticate, isAdmin } = require('../middlewares/auth');
const adminController = require('../controllers/adminController');
const validateAdminAction = require('../middlewares/validateAdminAction');
const validatePagination = require('../middlewares/validatePagination');
const rateLimiter = require('../middlewares/rateLimiter');

// Cron Logs

/**
 * @swagger
 * tags:
 *   name: Admin
 *   description: Admin-only operations
 */

/**
 * @swagger
 * /api/admin/cron-logs:
 *   get:
 *     summary: Fetch all cron logs
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Cron logs fetched successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/cron-logs', authenticate, isAdmin, adminController.getCronLogs); // Fetch all cron logs (admin only)

// Ajo Group Management

/**
 * @swagger
 * /api/admin/ajo-status:
 *   get:
 *     summary: Fetch Ajo group statuses
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Ajo group statuses fetched successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/ajo-status', authenticate, isAdmin, adminController.getAjoStatus); // Fetch Ajo group statuses

/**
 * @swagger
 * /api/admin/ajo-groups/{id}/resolve-dispute:
 *   post:
 *     summary: Resolve disputes in Ajo groups
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the Ajo group
 *     responses:
 *       200:
 *         description: Dispute resolved successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Ajo group not found
 */
router.post(
  '/ajo-groups/:id/resolve-dispute',
  authenticate,
  isAdmin,
  validateAdminAction('Resolve Ajo Group Dispute'),
  adminController.resolveAjoDispute
); // Resolve disputes in Ajo groups (admin only)

// Fraud Cases

/**
 * @swagger
 * /api/admin/fraud-cases:
 *   get:
 *     summary: Fetch all fraud cases
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number for pagination
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *         description: Number of fraud cases per page
 *     responses:
 *       200:
 *         description: Fraud cases fetched successfully
 *       401:
 *         description: Unauthorized
 */
router.get(
  '/fraud-cases',
  authenticate,
  isAdmin,
  validatePagination,
  adminController.getFraudCases
); // Fetch all fraud cases (admin only)


/**
 * @swagger
 * /api/admin/fraud-cases/{id}/resolve:
 *   post:
 *     summary: Resolve a specific fraud case
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the fraud case
 *     responses:
 *       200:
 *         description: Fraud case resolved successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Fraud case not found
 */
router.post(
  '/fraud-cases/:id/resolve',
  authenticate,
  isAdmin,
  validateAdminAction('Resolve Fraud Case'),
  adminController.resolveFraudCase
); // Resolve a specific fraud case (admin only)

// Approval Flows


/**
 * @swagger
 * /api/admin/approval-flows:
 *   get:
 *     summary: Fetch all approval flows
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number for pagination
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *         description: Number of approval flows per page
 *     responses:
 *       200:
 *         description: Approval flows fetched successfully
 *       401:
 *         description: Unauthorized
 */
router.get(
  '/approval-flows',
  authenticate,
  isAdmin,
  validatePagination,
  adminController.getApprovalFlows
); // Fetch all approval flows (admin only)


/**
 * @swagger
 * /api/admin/approval-flows/{id}/approve:
 *   post:
 *     summary: Approve a specific approval flow
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the approval flow
 *     responses:
 *       200:
 *         description: Approval flow approved successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Approval flow not found
 */
router.post(
  '/approval-flows/:id/approve',
  authenticate,
  isAdmin,
  validateAdminAction('Approve Approval Flow'),
  adminController.approveFlow
); // Approve a specific approval flow (admin only)


/**
 * @swagger
 * /api/admin/approval-flows/{id}/reject:
 *   post:
 *     summary: Reject a specific approval flow
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the approval flow
 *     responses:
 *       200:
 *         description: Approval flow rejected successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Approval flow not found
 */
router.post(
  '/approval-flows/:id/reject',
  authenticate,
  isAdmin,
  validateAdminAction('Reject Approval Flow'),
  adminController.rejectFlow
); // Reject a specific approval flow (admin only)

// User Management

/**
 * @swagger
 * /api/admin/users:
 *   get:
 *     summary: Fetch all users
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number for pagination
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *         description: Number of users per page
 *     responses:
 *       200:
 *         description: Users fetched successfully
 *       401:
 *         description: Unauthorized
 */
router.get(
  '/users',
  authenticate,
  isAdmin,
  validatePagination,
  adminController.getAllUsers
); // Fetch all users (admin only)


/**
 * @swagger
 * /api/admin/users/{id}:
 *   get:
 *     summary: Fetch details of a specific user
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the user
 *     responses:
 *       200:
 *         description: User details fetched successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 */
router.get('/users/:id', authenticate, isAdmin, adminController.getUserById); // Fetch details of a specific user (admin only)

/**
 * @swagger
 * /api/admin/users/{id}/deactivate:
 *   post:
 *     summary: Deactivate a specific user
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the user to deactivate
 *     responses:
 *       200:
 *         description: User deactivated successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 */
router.post(
  '/users/:id/deactivate',
  authenticate,
  isAdmin,
  validateAdminAction('Deactivate User'),
  adminController.deactivateUser
); // Deactivate a specific user (admin only)

/**
 * @swagger
 * /api/admin/users/{id}/activate:
 *   post:
 *     summary: Activate a specific user
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the user to activate
 *     responses:
 *       200:
 *         description: User activated successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 */
router.post(
  '/users/:id/activate',
  authenticate,
  isAdmin,
  validateAdminAction('Activate User'),
  adminController.activateUser
); // Activate a specific user (admin only)

// Notifications

/**
 * @swagger
 * /api/admin/notifications:
 *   get:
 *     summary: Fetch all notifications
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number for pagination
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
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
  isAdmin,
  validatePagination,
  adminController.getAllNotifications
); // Fetch all notifications (admin only)


/**
 * @swagger
 * /api/admin/notifications/send:
 *   post:
 *     summary: Send notifications to users
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 example: "System Maintenance"
 *               message:
 *                 type: string
 *                 example: "The system will undergo maintenance at midnight."
 *               userIds:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 example: [1, 2, 3]
 *     responses:
 *       200:
 *         description: Notifications sent successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
router.post(
  '/notifications/send',
  authenticate,
  isAdmin,
  validateAdminAction('Send Notifications'),
  adminController.sendNotification
); // Send notifications to users (admin only)

// Admin routes

/**
 * @swagger
 * /api/admin/resolve-dispute/{id}:
 *   post:
 *     summary: Resolve disputes
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the dispute to resolve
 *     responses:
 *       200:
 *         description: Dispute resolved successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Dispute not found
 */
router.post(
  '/resolve-dispute/:id',
  authenticate,
  isAdmin,
  validateAdminAction('Resolve Dispute'),
  adminController.resolveDispute
); // Resolve disputes (admin only)


/**
 * @swagger
 * /api/admin/reverse-transaction/{id}:
 *   post:
 *     summary: Reverse a specific transaction
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the transaction to reverse
 *     responses:
 *       200:
 *         description: Transaction reversed successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Transaction not found
 */
router.post(
  '/reverse-transaction/:id',
  authenticate,
  isAdmin,
  rateLimiter({ windowMs: 1 * 60 * 1000, max: 10 }), // Limit to 10 requests per minute
  param('id').isInt().withMessage('ID must be an integer'),
  validateAdminAction('Reverse Transaction'),
  adminController.reverseTransaction
); // Reverse a specific transaction by ID (admin only)

module.exports = router;