const express = require('express');
const router = express.Router();
const cronController = require('../controllers/cronController');
const { authenticate, isAdmin } = require('../middlewares/auth');
const { param } = require('express-validator');
const validatePagination = require('../middlewares/validatePagination');
const rateLimiter = require('../middlewares/rateLimiter');

// Cron Logs Routes
router.get(
  '/logs',
  authenticate,
  isAdmin,
  validatePagination,
  cronController.getCronLogs
); // Fetch all cron logs (admin only)
router.get(
  '/logs/:id',
  authenticate,
  isAdmin,
  param('id').isInt().withMessage('ID must be an integer'),
  cronController.getCronLogById
); // Fetch details of a specific cron log (admin only)

// Trigger Cron Jobs
router.post(
  '/trigger/:jobName',
  authenticate,
  isAdmin,
  rateLimiter({ windowMs: 1 * 60 * 1000, max: 5 }), // Limit to 5 requests per minute
  param('jobName').isString().withMessage('Job name must be a string'),
  cronController.triggerCronJob
); // Trigger a specific cron job (admin only)

module.exports = router;