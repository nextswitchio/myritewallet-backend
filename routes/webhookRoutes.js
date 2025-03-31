const express = require('express');
const router = express.Router();
const { Transaction, Wallet } = require('../models');
const crypto = require('crypto');

// Verify VFD signature
const verifySignature = (req, res, next) => {
  const signature = crypto
    .createHmac('sha256', process.env.VFD_WEBHOOK_SECRET)
    .update(JSON.stringify(req.body))
    .digest('hex');
    
  if (signature !== req.headers['x-vfd-signature']) {
    return res.status(401).json({ error: 'Invalid signature' });
  }
  next();
};

// Handle payment callbacks
router.post('/vfd/payment-callback', verifySignature, async (req, res) => {
  try {
    const { event, data } = req.body;

    switch (event) {
      case 'transfer.completed':
        await Transaction.update(
          { status: 'success' },
          { where: { reference: data.reference } }
        );
        break;

      case 'transfer.failed':
        await Transaction.update(
          { status: 'failed', metadata: data.reason },
          { where: { reference: data.reference } }
        );
        // Refund wallet if debit failed
        if (data.type === 'debit') {
          await Wallet.increment('balance', {
            by: data.amount,
            where: { userId: data.customerId }
          });
        }
        break;
    }

    res.json({ success: true });
  } catch (err) {
    console.error('Webhook error:', err);
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;