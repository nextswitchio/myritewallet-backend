const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

router.post('/register', userController.register);
router.post('/verify-otp', userController.verifyOTP);
router.post('/complete-kyc', userController.completeKYC);
router.get('/withdrawal-status', userController.checkWithdrawalStatus);

module.exports = router;