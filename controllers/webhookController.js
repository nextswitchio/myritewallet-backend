const { Transaction, Wallet } = require('../models');
const crypto = require('crypto');

module.exports = {
  handleVFDPayment: async (req, res) => {
    const signature = crypto
      .createHmac('sha256', process.env.VFD_WEBHOOK_SECRET)
      .update(JSON.stringify(req.body))
      .digest('hex');

    if (signature !== req.headers['x-vfd-signature']) {
      return res.status(401).json({ error: 'Invalid signature' });
    }

    const { event, data } = req.body;

    try {
      switch (event) {
        case 'transfer.completed':
          await Transaction.update(
            { status: 'success' },
            { where: { reference: data.reference } }
          );
          break;

        case 'transfer.failed':
          await handleFailedTransaction(data);
          break;
      }

      res.json({ success: true });
    } catch (err) {
      console.error('Webhook error:', err);
      res.status(400).json({ error: err.message });
    }
  }
};

async function handleFailedTransaction(data) {
  await Transaction.update(
    { status: 'failed', metadata: { reason: data.reason } },
    { where: { reference: data.reference } }
  );

  if (data.type === 'debit') {
    await Wallet.increment('balance', {
      by: data.amount,
      where: { userId: data.customerId }
    });
  }
}