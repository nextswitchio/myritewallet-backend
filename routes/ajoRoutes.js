const express = require('express');
const router = express.Router();
const ajoController = require('../controllers/ajoController');
const { authenticate, requireKYC, isAdmin } = require('../middlewares/auth');
const validateRequestBody = require('../middlewares/validateRequestBody');
const checkUserStatus = require('../middlewares/checkUserStatus');
const validatePagination = require('../middlewares/validatePagination');

// Public routes

/**
 * @swagger
 * tags:
 *   name: Ajo
 *   description: Ajo group management
 */

/**
 * @swagger
 * /api/ajo/active:
 *   get:
 *     summary: Fetch active Ajo groups
 *     tags: [Ajo]
 *     responses:
 *       200:
 *         description: Active Ajo groups fetched successfully
 */
router.get('/active', ajoController.getActiveGroups); // Fetch active Ajo groups

/**
 * @swagger
 * /api/ajo/recommended:
 *   get:
 *     summary: Fetch recommended Ajo groups
 *     tags: [Ajo]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Recommended Ajo groups fetched successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/recommended', authenticate, ajoController.getRecommendedGroups); // Fetch recommended Ajo groups

// Authenticated routes

/**
 * @swagger
 * /api/ajo:
 *   post:
 *     summary: Create a new Ajo group
 *     tags: [Ajo]
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
 *                 example: "Monthly Savings Group"
 *               contributionAmount:
 *                 type: number
 *                 example: 5000
 *               frequency:
 *                 type: string
 *                 example: "monthly"
 *     responses:
 *       201:
 *         description: Ajo group created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
router.post('/', authenticate, requireKYC, ajoController.createGroup); // Create a new Ajo group


/**
 * @swagger
 * /api/ajo/{ajoId}/join:
 *   post:
 *     summary: Join an Ajo group
 *     tags: [Ajo]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: ajoId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the Ajo group to join
 *     responses:
 *       200:
 *         description: Joined Ajo group successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Ajo group not found
 */
router.post('/:ajoId/join', authenticate, requireKYC, ajoController.joinGroup); // Join an Ajo group

/**
 * @swagger
 * /api/ajo/{ajoId}/contribute:
 *   post:
 *     summary: Contribute to an Ajo group
 *     tags: [Ajo]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: ajoId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the Ajo group
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
 *         description: Ajo group not found
 */
router.post(
  '/:ajoId/contribute',
  authenticate,
  checkUserStatus,
  validateRequestBody(['amount']),
  ajoController.contribute
); // Contribute to an Ajo group


/**
 * @swagger
 * /api/ajo/{ajoId}/request-payout:
 *   post:
 *     summary: Request a payout from an Ajo group
 *     tags: [Ajo]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: ajoId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the Ajo group
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
 *         description: Payout requested successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Ajo group not found
 */
router.post(
  '/:ajoId/request-payout',
  authenticate,
  checkUserStatus,
  requireKYC,
  validateRequestBody(['amount']),
  ajoController.requestPayout
); // Request a payout from an Ajo group


/**
 * @swagger
 * /api/ajo/{ajoId}/leave:
 *   post:
 *     summary: Leave an Ajo group
 *     tags: [Ajo]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: ajoId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the Ajo group
 *     responses:
 *       200:
 *         description: Left Ajo group successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Ajo group not found
 */
router.post('/:ajoId/leave', authenticate, checkUserStatus, ajoController.leaveGroup); // Leave an Ajo group

/**
 * @swagger
 * /api/ajo/{ajoId}/members:
 *   get:
 *     summary: Fetch members of an Ajo group
 *     tags: [Ajo]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: ajoId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the Ajo group
 *     responses:
 *       200:
 *         description: Members fetched successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Ajo group not found
 */
router.get('/:ajoId/members', authenticate, ajoController.getGroupMembers); // Fetch members of an Ajo group

/**
 * @swagger
 * /api/ajo/{ajoId}/details:
 *   get:
 *     summary: Fetch details of an Ajo group
 *     tags: [Ajo]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: ajoId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the Ajo group
 *     responses:
 *       200:
 *         description: Group details fetched successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Ajo group not found
 */
router.get('/:ajoId/details', authenticate, ajoController.getGroupDetails); // Fetch details of an Ajo group

// Admin routes

/**
 * @swagger
 * /api/ajo/admin/payouts:
 *   get:
 *     summary: Process payouts for Ajo groups (admin only)
 *     tags: [Ajo]
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
 *         description: Number of payouts per page
 *     responses:
 *       200:
 *         description: Payouts processed successfully
 *       401:
 *         description: Unauthorized
 */
router.get(
  '/admin/payouts',
  authenticate,
  isAdmin,
  validatePagination,
  ajoController.processPayouts
); // Process payouts for Ajo groups (admin only)


/**
 * @swagger
 * /api/ajo/admin/groups:
 *   get:
 *     summary: Fetch all Ajo groups (admin only)
 *     tags: [Ajo]
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
 *         description: Number of groups per page
 *     responses:
 *       200:
 *         description: Groups fetched successfully
 *       401:
 *         description: Unauthorized
 */
router.get(
  '/admin/groups',
  authenticate,
  isAdmin,
  validatePagination,
  ajoController.getAllGroups
); // Fetch all Ajo groups (admin only)



/**
 * @swagger
 * /api/ajo/admin/groups/{ajoId}/resolve-dispute:
 *   post:
 *     summary: Resolve disputes in an Ajo group (admin only)
 *     tags: [Ajo]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: ajoId
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
  '/admin/groups/:ajoId/resolve-dispute',
  authenticate,
  isAdmin,
  ajoController.resolveDispute
); // Resolve disputes in an Ajo group (admin only)

module.exports = router;