const { Wallet, Transaction } = require('../models');
const vfdService = require('../services/vfdService');

module.exports = {
  // Fund wallet
  fundWallet: async (req, res) => {
    try {
      const { amount, cardDetails } = req.body;

      // Process payment via VFD
      const success = await vfdService.processCardPayment(
        req.user.id,
        amount,
        cardDetails
      );

      if (!success) throw new Error('Payment failed');

      // Update wallet
      await Wallet.increment('balance', { 
        by: amount, 
        where: { userId: req.user.id } 
      });

      // Record transaction
      await Transaction.create({
        userId: req.user.id,
        amount,
        type: 'deposit',
        status: 'success'
      });

      res.json({ 
        success: true,
        newBalance: await getWalletBalance(req.user.id)
      });

    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  },

  // Withdraw funds
  withdraw: async (req, res) => {
    try {
      const { amount } = req.body;
      const wallet = await Wallet.findOne({ where: { userId: req.user.id } });

      if (wallet.balance < amount) {
        return res.status(400).json({ error: 'Insufficient balance' });
      }

      // Process withdrawal via VFD
      const success = await vfdService.processWithdrawal(
        req.user.id,
        amount,
        req.user.bankAccount
      );

      if (!success) throw new Error('Withdrawal failed');

      // Update wallet
      await Wallet.decrement('balance', { 
        by: amount, 
        where: { userId: req.user.id } 
      });

      // Record transaction
      await Transaction.create({
        userId: req.user.id,
        amount,
        type: 'withdrawal',
        status: 'success'
      });

      res.json({ 
        success: true,
        newBalance: await getWalletBalance(req.user.id)
      });

    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }
};

// Helper
async function getWalletBalance(userId) {
  const wallet = await Wallet.findOne({ where: { userId } });
  return wallet.balance;
}