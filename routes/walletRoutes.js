const express = require('express');
const router = express.Router();
const walletController = require('../controllers/walletController');
const { authenticate, checkWithdrawalEligibility } = require('../middlewares/auth');

router.post('/fund', authenticate, walletController.fundWallet);
router.post('/withdraw', authenticate, checkWithdrawalEligibility, walletController.withdraw);
router.get('/balance', authenticate, walletController.getBalance);
router.get('/transactions', authenticate, walletController.getTransactions);

module.exports = router;