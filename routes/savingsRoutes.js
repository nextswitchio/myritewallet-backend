const express = require('express');
const router = express.Router();
const savingsController = require('../controllers/savingsController');
const { authenticate, requireKYC } = require('../middlewares/auth');
const { param, body } = require('express-validator');
const rateLimiter = require('../middlewares/rateLimiter');

// Savings Goals Routes

/**
 * @swagger
 * tags:
 *   name: Savings
 *   description: Savings management
 */

/**
 * @swagger
 * /api/savings/goals:
 *   get:
 *     summary: Fetch all savings goals for the authenticated user
 *     tags: [Savings]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Savings goals fetched successfully
 *       401:
 *         description: Unauthorized
 */
router.get(
  '/goals',
  authenticate,
  savingsController.getAllSavingsGoals
); // Fetch all savings goals for the authenticated user

/**
 * @swagger
 * /api/savings/goals/{id}:
 *   get:
 *     summary: Fetch details of a specific savings goal
 *     tags: [Savings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the savings goal
 *     responses:
 *       200:
 *         description: Savings goal details fetched successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Savings goal not found
 */
router.get(
  '/goals/:id',
  authenticate,
  param('id').isInt().withMessage('Goal ID must be an integer'),
  savingsController.getSavingsGoalById
); // Fetch details of a specific savings goal


/**
 * @swagger
 * /api/savings/goals:
 *   post:
 *     summary: Create a new savings goal
 *     tags: [Savings]
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
 *                 example: "Vacation Fund"
 *               targetAmount:
 *                 type: number
 *                 example: 100000
 *     responses:
 *       201:
 *         description: Savings goal created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
router.post(
  '/goals',
  authenticate,
  requireKYC,
  body('name').notEmpty().withMessage('Name is required'),
  body('targetAmount').isFloat({ gt: 0 }).withMessage('Target amount must be a positive number'),
  savingsController.createSavingsGoal
); // Create a new savings goal


/**
 * @swagger
 * /api/savings/goals/{id}:
 *   put:
 *     summary: Update a specific savings goal
 *     tags: [Savings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the savings goal
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Updated Vacation Fund"
 *               targetAmount:
 *                 type: number
 *                 example: 150000
 *     responses:
 *       200:
 *         description: Savings goal updated successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Savings goal not found
 */
router.put(
  '/goals/:id',
  authenticate,
  param('id').isInt().withMessage('Goal ID must be an integer'),
  body('name').optional().notEmpty().withMessage('Name cannot be empty'),
  body('targetAmount').optional().isFloat({ gt: 0 }).withMessage('Target amount must be a positive number'),
  savingsController.updateSavingsGoal
); // Update a specific savings goal


/**
 * @swagger
 * /api/savings/goals/{id}:
 *   delete:
 *     summary: Delete a specific savings goal
 *     tags: [Savings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the savings goal
 *     responses:
 *       200:
 *         description: Savings goal deleted successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Savings goal not found
 */
router.delete(
  '/goals/:id',
  authenticate,
  param('id').isInt().withMessage('Goal ID must be an integer'),
  savingsController.deleteSavingsGoal
); // Delete a specific savings goal


/**
 * @swagger
 * /api/savings/goals/{id}/contribute:
 *   post:
 *     summary: Contribute to a savings goal
 *     tags: [Savings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the savings goal
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               amount:
 *                 type: number
 *                 example: 5000
 *     responses:
 *       200:
 *         description: Contribution made successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Savings goal not found
 */
router.post(
  '/goals/:id/contribute',
  authenticate,
  rateLimiter({ windowMs: 1 * 60 * 1000, max: 5 }), // Limit to 5 requests per minute
  param('id').isInt().withMessage('Goal ID must be an integer'),
  body('amount').isFloat({ gt: 0 }).withMessage('Amount must be a positive number'),
  savingsController.contributeToSavingsGoal
); // Contribute to a savings goal

// Flexible Savings Routes

/**
 * @swagger
 * /api/savings/flexible:
 *   get:
 *     summary: Fetch flexible savings details
 *     tags: [Savings]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Flexible savings details fetched successfully
 *       401:
 *         description: Unauthorized
 */
router.get(
  '/flexible',
  authenticate,
  savingsController.getFlexibleSavings
); // Fetch flexible savings details


/**
 * @swagger
 * /api/savings/flexible/withdraw:
 *   post:
 *     summary: Withdraw from flexible savings
 *     tags: [Savings]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               amount:
 *                 type: number
 *                 example: 10000
 *     responses:
 *       200:
 *         description: Withdrawal successful
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
router.post(
  '/flexible/withdraw',
  authenticate,
  requireKYC,
  rateLimiter({ windowMs: 1 * 60 * 1000, max: 5 }), // Limit to 5 requests per minute
  body('amount').isFloat({ gt: 0 }).withMessage('Amount must be a positive number'),
  savingsController.withdrawFromFlexibleSavings
); // Withdraw from flexible savings


/**
 * @swagger
 * /api/savings/flexible/deposit:
 *   post:
 *     summary: Deposit into flexible savings
 *     tags: [Savings]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               amount:
 *                 type: number
 *                 example: 10000
 *     responses:
 *       200:
 *         description: Deposit successful
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
router.post(
  '/flexible/deposit',
  authenticate,
  requireKYC,
  rateLimiter({ windowMs: 1 * 60 * 1000, max: 5 }), // Limit to 5 requests per minute
  body('amount').isFloat({ gt: 0 }).withMessage('Amount must be a positive number'),
  savingsController.depositToFlexibleSavings
); // Deposit into flexible savings

module.exports = router;