const express = require('express');
const router = express.Router();
const { authenticate, isAdmin } = require('../middlewares/auth');
const adminController = require('../controllers/adminController');

router.get('/cron-logs', authenticate, isAdmin, adminController.getCronLogs);
router.get('/ajo-status', authenticate, isAdmin, adminController.getAjoStatus);

module.exports = router;