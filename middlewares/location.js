const { UserLocation, User } = require('../models');
const sequelize = require('sequelize');
const axios = require('axios');

// Helper function to get city from coordinates
const getCityFromCoords = async (latitude, longitude) => {
  try {
    const response = await axios.get(`https://api.opencagedata.com/geocode/v1/json`, {
      params: {
        q: `${latitude},${longitude}`,
        key: process.env.GEOCODING_API_KEY
      }
    });
    return response.data.results[0]?.components?.city || 'Unknown';
  } catch (err) {
    console.error('Failed to fetch city from coordinates:', err);
    return 'Unknown';
  }
};

// Helper function to calculate distance between two coordinates (Haversine formula)
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const toRadians = (degrees) => degrees * (Math.PI / 180);
  const R = 6371; // Earth's radius in km
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in km
};

module.exports = {
  trackLocation: async (req, res, next) => {
    try {
      const { latitude, longitude } = req.body;

      // Validate latitude and longitude
      if (
        typeof latitude !== 'number' || latitude < -90 || latitude > 90 ||
        typeof longitude !== 'number' || longitude < -180 || longitude > 180
      ) {
        return next(new Error('Invalid latitude or longitude'));
      }

      if (latitude && longitude) {
        const city = await getCityFromCoords(latitude, longitude);

        // Save location to UserLocation model
        await UserLocation.create({
          userId: req.user.id,
          latitude,
          longitude,
          city
        });

        // Update last known location in User model
        await User.update(
          { lastLoginLocation: sequelize.fn('ST_MakePoint', longitude, latitude) },
          { where: { id: req.user.id } }
        );
      }
      next();
    } catch (err) {
      console.error(`Location tracking failed for user ${req.user?.id || 'unknown'}:`, err);
      next(); // Don't block request
    }
  },

  validateLocation: (req, res, next) => {
    try {
      const { latitude, longitude } = req.body;
      const lastLocation = req.user.lastLoginLocation;

      // Example anomaly detection: check if the new location is far from the last known location
      if (lastLocation) {
        const distance = calculateDistance(
          lastLocation.latitude,
          lastLocation.longitude,
          latitude,
          longitude
        );
        if (distance > 1000) { // Example threshold: 1000 km
          console.warn(`Anomalous location detected for user ${req.user.id}`);
        }
      }
      next();
    } catch (err) {
      console.error(`Location validation failed for user ${req.user?.id || 'unknown'}:`, err);
      next(); // Allow the request to proceed
    }
  }
};