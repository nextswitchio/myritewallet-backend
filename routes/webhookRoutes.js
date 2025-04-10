const express = require('express');
const router = express.Router();
const { Transaction, Wallet } = require('../models');
const crypto = require('crypto');
const rateLimiter = require('../middlewares/rateLimiter');
const { body } = require('express-validator');

// Verify VFD signature middleware
const verifySignature = (req, res, next) => {
  try {
    const signature = crypto
      .createHmac('sha256', process.env.VFD_WEBHOOK_SECRET)
      .update(JSON.stringify(req.body))
      .digest('hex');

    if (signature !== req.headers['x-vfd-signature']) {
      return res.status(401).json({ error: 'Invalid signature' });
    }
    next();
  } catch (err) {
    console.error('Signature verification error:', err);
    res.status(400).json({ error: 'Signature verification failed' });
  }
};

// Handle VFD payment callbacks
router.post(
  '/vfd/payment-callback',
  rateLimiter({ windowMs: 1 * 60 * 1000, max: 20 }), // Limit to 20 requests per minute
  verifySignature,
  body('event').notEmpty().withMessage('Event is required'),
  body('data').notEmpty().withMessage('Data is required'),
  async (req, res) => {
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

        case 'wallet.funded':
          await Wallet.increment('balance', {
            by: data.amount,
            where: { userId: data.customerId }
          });
          await Transaction.create({
            userId: data.customerId,
            amount: data.amount,
            type: 'credit',
            status: 'success',
            reference: data.reference,
            metadata: data
          });
          break;

        default:
          console.warn(`Unhandled event type: ${event}`);
          return res.status(400).json({ error: `Unhandled event type: ${event}` });
      }

      res.json({ success: true });
    } catch (err) {
      console.error('Webhook error:', err);
      res.status(400).json({ error: err.message });
    }
  }
);

// Handle generic webhooks
router.post('/generic', async (req, res) => {
  try {
    console.log('Generic webhook received:', req.body);
    res.json({ success: true });
  } catch (err) {
    console.error('Generic webhook error:', err);
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;