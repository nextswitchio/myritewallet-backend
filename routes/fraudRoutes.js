const express = require('express');
const router = express.Router();
const fraudController = require('../controllers/fraudController');
const { authenticate, isAdmin } = require('../middlewares/auth');
const validatePagination = require('../middlewares/validatePagination');
const rateLimiter = require('../middlewares/rateLimiter');
const { param } = require('express-validator');

// User Routes
router.post(
  '/report',
  authenticate,
  rateLimiter({ windowMs: 1 * 60 * 1000, max: 5 }), // Limit to 5 requests per minute
  fraudController.reportFraudCase
); // Report a fraud case
router.get(
  '/',
  authenticate,
  validatePagination,
  fraudController.getUserFraudCases
); // Fetch all fraud cases reported by the authenticated user
router.get(
  '/:id',
  authenticate,
  param('id').isInt().withMessage('ID must be an integer'),
  fraudController.getFraudCaseById
); // Fetch details of a specific fraud case

// Admin Routes
router.get(
  '/admin',
  authenticate,
  isAdmin,
  validatePagination,
  fraudController.getAllFraudCases
); // Fetch all fraud cases (admin only)
router.get(
  '/admin/:id',
  authenticate,
  isAdmin,
  param('id').isInt().withMessage('ID must be an integer'),
  fraudController.getFraudCaseByIdAdmin
); // Fetch details of a specific fraud case (admin only)
router.post(
  '/admin/:id/resolve',
  authenticate,
  isAdmin,
  rateLimiter({ windowMs: 1 * 60 * 1000, max: 10 }), // Limit to 10 requests per minute
  param('id').isInt().withMessage('ID must be an integer'),
  fraudController.resolveFraudCase
); // Resolve a specific fraud case (admin only)

module.exports = router;