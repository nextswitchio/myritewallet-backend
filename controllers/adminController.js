const { CronLog, AjoGroup, User } = require('../models');

module.exports = {
  // Get cron job logs
  getCronLogs: async (req, res) => {
    try {
      const logs = await CronLog.findAll({
        order: [['createdAt', 'DESC']],
        limit: 100
      });
      res.json(logs);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  },

  // Force payout (admin override)
  forcePayout: async (req, res) => {
    try {
      const { ajoId } = req.params;
      await require('../controllers/ajoController').processPayout(ajoId);
      res.json({ success: true });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  },

  // Suspend user
  suspendUser: async (req, res) => {
    try {
      const { userId } = req.params;
      await User.update({ isActive: false }, { where: { id: userId } });
      res.json({ success: true });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }
};