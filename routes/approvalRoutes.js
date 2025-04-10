const express = require('express');
const router = express.Router();
const approvalController = require('../controllers/approvalController');
const vfdController = require('../controllers/vfdController');
const { authenticate, isAdmin, isApprover } = require('../middlewares/auth');
const validatePagination = require('../middlewares/validatePagination');
const { param } = require('express-validator');

// Approval Flows Routes
router.get(
  '/flows',
  authenticate,
  isAdmin,
  validatePagination,
  approvalController.getAllApprovalFlows
); // Fetch all approval flows (admin only)
router.get(
  '/flows/:id',
  authenticate,
  isAdmin,
  param('id').isInt().withMessage('ID must be an integer'),
  approvalController.getApprovalFlowById
); // Fetch details of a specific approval flow (admin only)
router.post(
  '/flows/:id/approve',
  authenticate,
  isAdmin,
  param('id').isInt().withMessage('ID must be an integer'),
  approvalController.approveFlow
); // Approve a specific approval flow (admin only)
router.post(
  '/flows/:id/reject',
  authenticate,
  isAdmin,
  param('id').isInt().withMessage('ID must be an integer'),
  approvalController.rejectFlow
); // Reject a specific approval flow (admin only)

// Approval Levels Routes
router.get(
  '/levels',
  authenticate,
  isAdmin,
  validatePagination,
  approvalController.getAllApprovalLevels
); // Fetch all approval levels (admin only)
router.post(
  '/levels',
  authenticate,
  isAdmin,
  approvalController.createApprovalLevel
); // Create a new approval level (admin only)
router.put(
  '/levels/:id',
  authenticate,
  isAdmin,
  param('id').isInt().withMessage('ID must be an integer'),
  approvalController.updateApprovalLevel
); // Update a specific approval level (admin only)
router.delete(
  '/levels/:id',
  authenticate,
  isAdmin,
  param('id').isInt().withMessage('ID must be an integer'),
  approvalController.deleteApprovalLevel
); // Delete a specific approval level (admin only)

// VFD Case Approvals
router.post(
  '/:caseId/approve',
  authenticate,
  isApprover,
  param('caseId').isInt().withMessage('Case ID must be an integer'),
  vfdController.approveCase
); // Approve a specific VFD case
router.post(
  '/:caseId/reject',
  authenticate,
  isApprover,
  param('caseId').isInt().withMessage('Case ID must be an integer'),
  vfdController.rejectCase
); // Reject a specific VFD case
router.get(
  '/pending',
  authenticate,
  isApprover,
  validatePagination,
  vfdController.getPendingCases
); // Fetch all pending VFD cases for approvers

module.exports = router;