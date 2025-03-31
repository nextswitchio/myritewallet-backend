const { UserLocation } = require('../models');

module.exports = {
  trackLocation: async (req, res, next) => {
    try {
      const { latitude, longitude } = req.body;
      
      if (latitude && longitude) {
        await UserLocation.create({
          userId: req.user.id,
          latitude,
          longitude,
          city: await getCityFromCoords(latitude, longitude) // Implement this
        });

        // Update last known location
        await User.update(
          { lastLoginLocation: sequelize.fn('ST_MakePoint', longitude, latitude) },
          { where: { id: req.user.id } }
        );
      }
      next();
    } catch (err) {
      console.error('Location tracking failed:', err);
      next(); // Don't block request
    }
  },

  validateLocation: (req, res, next) => {
    // Implement anomaly detection
    next();
  }
};