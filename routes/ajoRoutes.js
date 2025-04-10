const express = require('express');
const router = express.Router();
const ajoController = require('../controllers/ajoController');
const { authenticate, requireKYC, isAdmin } = require('../middlewares/auth');
const validateRequestBody = require('../middlewares/validateRequestBody');
const checkUserStatus = require('../middlewares/checkUserStatus');
const validatePagination = require('../middlewares/validatePagination');

// Public routes
router.get('/active', ajoController.getActiveGroups); // Fetch active Ajo groups
router.get('/recommended', authenticate, ajoController.getRecommendedGroups); // Fetch recommended Ajo groups

// Authenticated routes
router.post('/', authenticate, requireKYC, ajoController.createGroup); // Create a new Ajo group
router.post('/:ajoId/join', authenticate, requireKYC, ajoController.joinGroup); // Join an Ajo group
router.post(
  '/:ajoId/contribute',
  authenticate,
  checkUserStatus,
  validateRequestBody(['amount']),
  ajoController.contribute
); // Contribute to an Ajo group
router.post(
  '/:ajoId/request-payout',
  authenticate,
  checkUserStatus,
  requireKYC,
  validateRequestBody(['amount']),
  ajoController.requestPayout
); // Request a payout from an Ajo group
router.post('/:ajoId/leave', authenticate, checkUserStatus, ajoController.leaveGroup); // Leave an Ajo group
router.get('/:ajoId/members', authenticate, ajoController.getGroupMembers); // Fetch members of an Ajo group
router.get('/:ajoId/details', authenticate, ajoController.getGroupDetails); // Fetch details of an Ajo group

// Admin routes
router.get(
  '/admin/payouts',
  authenticate,
  isAdmin,
  validatePagination,
  ajoController.processPayouts
); // Process payouts for Ajo groups (admin only)
router.get(
  '/admin/groups',
  authenticate,
  isAdmin,
  validatePagination,
  ajoController.getAllGroups
); // Fetch all Ajo groups (admin only)
router.post(
  '/admin/groups/:ajoId/resolve-dispute',
  authenticate,
  isAdmin,
  ajoController.resolveDispute
); // Resolve disputes in an Ajo group (admin only)

module.exports = router;