const express = require('express');
const router = express.Router();
const { param } = require('express-validator');
const { authenticate, isAdmin } = require('../middlewares/auth');
const adminController = require('../controllers/adminController');
const validateAdminAction = require('../middlewares/validateAdminAction');
const validatePagination = require('../middlewares/validatePagination');
const rateLimiter = require('../middlewares/rateLimiter');

// Cron Logs
router.get('/cron-logs', authenticate, isAdmin, adminController.getCronLogs); // Fetch all cron logs (admin only)

// Ajo Group Management
router.get('/ajo-status', authenticate, isAdmin, adminController.getAjoStatus); // Fetch Ajo group statuses
router.post(
  '/ajo-groups/:id/resolve-dispute',
  authenticate,
  isAdmin,
  validateAdminAction('Resolve Ajo Group Dispute'),
  adminController.resolveAjoDispute
); // Resolve disputes in Ajo groups (admin only)

// Fraud Cases
router.get(
  '/fraud-cases',
  authenticate,
  isAdmin,
  validatePagination,
  adminController.getFraudCases
); // Fetch all fraud cases (admin only)
router.post(
  '/fraud-cases/:id/resolve',
  authenticate,
  isAdmin,
  validateAdminAction('Resolve Fraud Case'),
  adminController.resolveFraudCase
); // Resolve a specific fraud case (admin only)

// Approval Flows
router.get(
  '/approval-flows',
  authenticate,
  isAdmin,
  validatePagination,
  adminController.getApprovalFlows
); // Fetch all approval flows (admin only)
router.post(
  '/approval-flows/:id/approve',
  authenticate,
  isAdmin,
  validateAdminAction('Approve Approval Flow'),
  adminController.approveFlow
); // Approve a specific approval flow (admin only)
router.post(
  '/approval-flows/:id/reject',
  authenticate,
  isAdmin,
  validateAdminAction('Reject Approval Flow'),
  adminController.rejectFlow
); // Reject a specific approval flow (admin only)

// User Management
router.get(
  '/users',
  authenticate,
  isAdmin,
  validatePagination,
  adminController.getAllUsers
); // Fetch all users (admin only)
router.get('/users/:id', authenticate, isAdmin, adminController.getUserById); // Fetch details of a specific user (admin only)
router.post(
  '/users/:id/deactivate',
  authenticate,
  isAdmin,
  validateAdminAction('Deactivate User'),
  adminController.deactivateUser
); // Deactivate a specific user (admin only)
router.post(
  '/users/:id/activate',
  authenticate,
  isAdmin,
  validateAdminAction('Activate User'),
  adminController.activateUser
); // Activate a specific user (admin only)

// Notifications
router.get(
  '/notifications',
  authenticate,
  isAdmin,
  validatePagination,
  adminController.getAllNotifications
); // Fetch all notifications (admin only)
router.post(
  '/notifications/send',
  authenticate,
  isAdmin,
  validateAdminAction('Send Notifications'),
  adminController.sendNotification
); // Send notifications to users (admin only)

// Admin routes
router.post(
  '/resolve-dispute/:id',
  authenticate,
  isAdmin,
  validateAdminAction('Resolve Dispute'),
  adminController.resolveDispute
); // Resolve disputes (admin only)

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