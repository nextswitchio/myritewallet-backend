const express = require('express');
const router = express.Router();
const ajoController = require('../controllers/ajoController');
const { authenticate, requireKYC } = require('../middlewares/auth');

// Public routes
router.get('/active', ajoController.getActiveGroups);
router.get('/recommended', authenticate, ajoController.getRecommendedGroups);

// Authenticated routes
router.post('/', authenticate, requireKYC, ajoController.createGroup);
router.post('/:ajoId/join', authenticate, requireKYC, ajoController.joinGroup);
router.post('/:ajoId/contribute', authenticate, ajoController.contribute);

// Admin routes
router.get('/admin/payouts', authenticate, ajoController.processPayouts);

module.exports = router;