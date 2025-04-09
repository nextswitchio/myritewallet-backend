const { Wallet, Transaction, User, Notification } = require('../models');
const vfdService = require('../services/vfdService');
const bcrypt = require('bcrypt');
const sequelize = require('sequelize');
const { sendEmail, sendPushNotification } = require('../utils/notificationService');

module.exports = {
  // Fund wallet via card payment
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
        status: 'success',
        reference: `DEP-${Date.now()}`
      });

      // Send notification
      await Notification.create({
        userId: req.user.id,
        type: 'deposit',
        message: `Your wallet has been funded with ₦${amount}.`,
        status: 'unread'
      });
      sendPushNotification(req.user.id, `Your wallet has been funded with ₦${amount}.`);
      sendEmail(req.user.email, 'Wallet Funded', `Your wallet has been successfully funded with ₦${amount}.`);

      res.json({ 
        success: true,
        newBalance: await getWalletBalance(req.user.id)
      });

    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  },

  // Fund wallet via bank transfer
  fundWalletWithBankTransfer: async (req, res) => {
    try {
      const { amount, reference } = req.body;

      // Verify bank transfer via VFD
      const success = await vfdService.verifyBankTransfer(reference, amount);
      if (!success) throw new Error('Bank transfer verification failed');

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
        status: 'success',
        reference
      });

      // Send notification
      await Notification.create({
        userId: req.user.id,
        type: 'deposit',
        message: `Your wallet has been funded with ₦${amount} via bank transfer.`,
        status: 'unread'
      });
      sendPushNotification(req.user.id, `Your wallet has been funded with ₦${amount} via bank transfer.`);
      sendEmail(req.user.email, 'Wallet Funded', `Your wallet has been successfully funded with ₦${amount} via bank transfer.`);

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
      const { amount, pin } = req.body;

      // Verify transaction PIN
      const isPinValid = await verifyTransactionPin(req.user.id, pin);
      if (!isPinValid) {
        return res.status(403).json({ error: 'Invalid transaction PIN' });
      }

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
        status: 'success',
        reference: `WDR-${Date.now()}`
      });

      // Send notification
      await Notification.create({
        userId: req.user.id,
        type: 'withdrawal',
        message: `You have successfully withdrawn ₦${amount} from your wallet.`,
        status: 'unread'
      });
      sendPushNotification(req.user.id, `You have successfully withdrawn ₦${amount} from your wallet.`);
      sendEmail(req.user.email, 'Withdrawal Successful', `You have successfully withdrawn ₦${amount} from your wallet.`);

      res.json({ 
        success: true,
        newBalance: await getWalletBalance(req.user.id)
      });

    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  },

  // Set or update transaction PIN
  setTransactionPin: async (req, res) => {
    try {
      const { pin } = req.body;

      // Hash the PIN
      const hashedPin = await bcrypt.hash(pin, 10);

      // Update user's transaction PIN
      await User.update(
        { transactionPin: hashedPin },
        { where: { id: req.user.id } }
      );

      // Send notification
      await Notification.create({
        userId: req.user.id,
        type: 'transaction_pin',
        message: 'Your transaction PIN has been successfully updated.',
        status: 'unread'
      });
      sendPushNotification(req.user.id, 'Your transaction PIN has been successfully updated.');
      sendEmail(req.user.email, 'Transaction PIN Updated', 'Your transaction PIN has been successfully updated.');

      res.json({ success: true, message: 'Transaction PIN set successfully' });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  },

  // Get wallet balance
  getWalletBalance: async (req, res) => {
    try {
      const wallet = await Wallet.findOne({ where: { userId: req.user.id } });
      if (!wallet) {
        return res.status(404).json({ error: 'Wallet not found' });
      }

      res.json({ success: true, balance: wallet.balance });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }
};

// Helper function to verify transaction PIN
async function verifyTransactionPin(userId, pin) {
  const user = await User.findByPk(userId);
  if (!user || !user.transactionPin) return false;

  return bcrypt.compare(pin, user.transactionPin);
}

// Helper function to get wallet balance
async function getWalletBalance(userId) {
  const wallet = await Wallet.findOne({ where: { userId } });
  return wallet ? wallet.balance : 0;
}