const express = require('express');
const router = express.Router();
const savingsController = require('../controllers/savingsController');
const { authenticate, requireKYC } = require('../middlewares/auth');
const { param, body } = require('express-validator');
const rateLimiter = require('../middlewares/rateLimiter');

// Savings Goals Routes
router.get(
  '/goals',
  authenticate,
  savingsController.getAllSavingsGoals
); // Fetch all savings goals for the authenticated user
router.get(
  '/goals/:id',
  authenticate,
  param('id').isInt().withMessage('Goal ID must be an integer'),
  savingsController.getSavingsGoalById
); // Fetch details of a specific savings goal
router.post(
  '/goals',
  authenticate,
  requireKYC,
  body('name').notEmpty().withMessage('Name is required'),
  body('targetAmount').isFloat({ gt: 0 }).withMessage('Target amount must be a positive number'),
  savingsController.createSavingsGoal
); // Create a new savings goal
router.put(
  '/goals/:id',
  authenticate,
  param('id').isInt().withMessage('Goal ID must be an integer'),
  body('name').optional().notEmpty().withMessage('Name cannot be empty'),
  body('targetAmount').optional().isFloat({ gt: 0 }).withMessage('Target amount must be a positive number'),
  savingsController.updateSavingsGoal
); // Update a specific savings goal
router.delete(
  '/goals/:id',
  authenticate,
  param('id').isInt().withMessage('Goal ID must be an integer'),
  savingsController.deleteSavingsGoal
); // Delete a specific savings goal
router.post(
  '/goals/:id/contribute',
  authenticate,
  rateLimiter({ windowMs: 1 * 60 * 1000, max: 5 }), // Limit to 5 requests per minute
  param('id').isInt().withMessage('Goal ID must be an integer'),
  body('amount').isFloat({ gt: 0 }).withMessage('Amount must be a positive number'),
  savingsController.contributeToSavingsGoal
); // Contribute to a savings goal

// Flexible Savings Routes
router.get(
  '/flexible',
  authenticate,
  savingsController.getFlexibleSavings
); // Fetch flexible savings details
router.post(
  '/flexible/withdraw',
  authenticate,
  requireKYC,
  rateLimiter({ windowMs: 1 * 60 * 1000, max: 5 }), // Limit to 5 requests per minute
  body('amount').isFloat({ gt: 0 }).withMessage('Amount must be a positive number'),
  savingsController.withdrawFromFlexibleSavings
); // Withdraw from flexible savings
router.post(
  '/flexible/deposit',
  authenticate,
  requireKYC,
  rateLimiter({ windowMs: 1 * 60 * 1000, max: 5 }), // Limit to 5 requests per minute
  body('amount').isFloat({ gt: 0 }).withMessage('Amount must be a positive number'),
  savingsController.depositToFlexibleSavings
); // Deposit into flexible savings

module.exports = router;