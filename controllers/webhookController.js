const { Transaction, Wallet, Notification } = require('../models');
const crypto = require('crypto');

module.exports = {
  // Handle VFD Payment Webhook
  handleVFDPayment: async (req, res) => {
    try {
      // Verify webhook signature
      const signature = crypto
        .createHmac('sha256', process.env.VFD_WEBHOOK_SECRET)
        .update(JSON.stringify(req.body))
        .digest('hex');

      if (signature !== req.headers['x-vfd-signature']) {
        return res.status(401).json({ error: 'Invalid signature' });
      }

      const { event, data } = req.body;

      // Handle different webhook events
      switch (event) {
        case 'wallet.funded':
          await handleWalletFunding(data);
          break;

        case 'transfer.completed':
          await handleTransferCompleted(data);
          break;

        case 'transfer.failed':
          await handleFailedTransaction(data);
          break;

        case 'transfer.reversed':
          await handleTransferReversal(data);
          break;

        default:
          console.warn(`Unhandled webhook event: ${event}`);
      }

      res.json({ success: true });
    } catch (err) {
      console.error('Webhook error:', err);
      res.status(400).json({ error: err.message });
    }
  }
};

// Handle wallet funding event
async function handleWalletFunding(data) {
  const { customerId, amount, reference } = data;

  // Update wallet balance
  await Wallet.increment('balance', {
    by: amount,
    where: { userId: customerId }
  });

  // Record transaction
  await Transaction.create({
    userId: customerId,
    amount,
    type: 'deposit',
    status: 'success',
    reference
  });

  // Notify user
  await Notification.create({
    userId: customerId,
    type: 'wallet_funding',
    message: `Your wallet has been funded with ₦${amount}.`,
    status: 'unread'
  });
}

// Handle transfer completed event
async function handleTransferCompleted(data) {
  const { reference } = data;

  // Update transaction status
  await Transaction.update(
    { status: 'success' },
    { where: { reference } }
  );
}

// Handle failed transaction event
async function handleFailedTransaction(data) {
  const { reference, reason, type, amount, customerId } = data;

  // Update transaction status
  await Transaction.update(
    { status: 'failed', metadata: { reason } },
    { where: { reference } }
  );

  // Refund wallet for failed debit transactions
  if (type === 'debit') {
    await Wallet.increment('balance', {
      by: amount,
      where: { userId: customerId }
    });

    // Notify user
    await Notification.create({
      userId: customerId,
      type: 'transaction_failed',
      message: `Your transaction with reference ${reference} failed. Reason: ${reason}. The amount has been refunded to your wallet.`,
      status: 'unread'
    });
  }
}

// Handle transfer reversal event
async function handleTransferReversal(data) {
  const { reference, amount, customerId } = data;

  // Refund wallet for reversed transactions
  await Wallet.increment('balance', {
    by: amount,
    where: { userId: customerId }
  });

  // Update transaction status
  await Transaction.update(
    { status: 'reversed' },
    { where: { reference } }
  );

  // Notify user
  await Notification.create({
    userId: customerId,
    type: 'transfer_reversed',
    message: `A transfer with reference ${reference} has been reversed. ₦${amount} has been refunded to your wallet.`,
    status: 'unread'
  });
}