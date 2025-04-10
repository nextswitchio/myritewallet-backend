const { User } = require('../models');

module.exports = async (req, res, next) => {
  try {
    const { transactionPin } = req.body;

    if (!transactionPin) {
      return res.status(400).json({ error: 'Transaction PIN is required' });
    }

    // Verify the transaction PIN
    const user = await User.findByPk(req.user.id);
    if (!user || user.transactionPin !== transactionPin) {
      return res.status(403).json({ error: 'Invalid transaction PIN' });
    }

    next();
  } catch (err) {
    console.error('Error verifying transaction PIN:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};