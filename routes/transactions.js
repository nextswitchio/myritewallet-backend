const router = require('express').Router();
const vfdController = require('../controllers/vfdController');
const { authenticate, isAdmin } = require('../middlewares/auth');

// Admin endpoints
router.post('/bulk', authenticate, isAdmin, vfdController.processBulkPayments);
router.post('/:reference/reverse', authenticate, isAdmin, vfdController.reverseTransaction);
router.get('/fraud-cases', authenticate, isAdmin, vfdController.getFraudCases);

// Webhook
router.post('/webhooks/vfd', vfdController.handleWebhook);

module.exports = router;