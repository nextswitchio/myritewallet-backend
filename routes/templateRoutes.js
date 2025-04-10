const express = require('express');
const router = express.Router();
const templateController = require('../controllers/templateController');
const { authenticate, isAdmin } = require('../middlewares/auth');
const { param } = require('express-validator');
const rateLimiter = require('../middlewares/rateLimiter');

// Template Routes
router.get(
  '/',
  authenticate,
  isAdmin,
  templateController.getAllTemplates
); // Fetch all templates (admin only)
router.get(
  '/:id',
  authenticate,
  isAdmin,
  param('id').isInt().withMessage('Template ID must be an integer'),
  templateController.getTemplateById
); // Fetch details of a specific template (admin only)
router.post(
  '/',
  authenticate,
  isAdmin,
  templateController.createTemplate
); // Create a new template (admin only)
router.put(
  '/:id',
  authenticate,
  isAdmin,
  param('id').isInt().withMessage('Template ID must be an integer'),
  templateController.updateTemplate
); // Update a specific template (admin only)
router.delete(
  '/:id',
  authenticate,
  isAdmin,
  param('id').isInt().withMessage('Template ID must be an integer'),
  templateController.deleteTemplate
); // Delete a specific template (admin only)

// Template Execution Routes
router.post(
  '/:id/execute',
  authenticate,
  rateLimiter({ windowMs: 1 * 60 * 1000, max: 10 }), // Limit to 10 requests per minute
  param('id').isInt().withMessage('Template ID must be an integer'),
  templateController.executeTemplate
); // Execute a specific template (authenticated users)

// Template Version Routes
router.get(
  '/:templateId/versions',
  authenticate,
  isAdmin,
  param('templateId').isInt().withMessage('Template ID must be an integer'),
  templateController.getTemplateVersions
); // Fetch all versions of a specific template (admin only)
router.post(
  '/:templateId/versions',
  authenticate,
  isAdmin,
  param('templateId').isInt().withMessage('Template ID must be an integer'),
  templateController.createTemplateVersion
); // Create a new version for a template (admin only)
router.put(
  '/versions/:versionId',
  authenticate,
  isAdmin,
  param('versionId').isInt().withMessage('Version ID must be an integer'),
  templateController.updateTemplateVersion
); // Update a specific template version (admin only)
router.delete(
  '/versions/:versionId',
  authenticate,
  isAdmin,
  param('versionId').isInt().withMessage('Version ID must be an integer'),
  templateController.deleteTemplateVersion
); // Delete a specific template version (admin only)

module.exports = router;