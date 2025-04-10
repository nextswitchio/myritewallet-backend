const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { authenticate } = require('../middlewares/auth');
const validatePagination = require('../middlewares/validatePagination');
const rateLimiter = require('../middlewares/rateLimiter');
const { param } = require('express-validator');

// Authenticated routes
router.get(
  '/',
  authenticate,
  validatePagination,
  notificationController.getAllNotifications
); // Fetch all notifications for the authenticated user
router.get(
  '/:id',
  authenticate,
  param('id').isInt().withMessage('ID must be an integer'),
  notificationController.getNotificationById
); // Fetch details of a specific notification
router.post(
  '/:id/mark-as-read',
  authenticate,
  rateLimiter({ windowMs: 1 * 60 * 1000, max: 10 }), // Limit to 10 requests per minute
  param('id').isInt().withMessage('ID must be an integer'),
  notificationController.markAsRead
); // Mark a notification as read
router.delete(
  '/:id',
  authenticate,
  rateLimiter({ windowMs: 1 * 60 * 1000, max: 5 }), // Limit to 5 requests per minute
  param('id').isInt().withMessage('ID must be an integer'),
  notificationController.deleteNotification
); // Delete a specific notification

module.exports = router;