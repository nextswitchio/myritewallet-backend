const axios = require('axios');

module.exports = {
  /**
   * Calculate the distance between two coordinates using the Haversine formula.
   * @param {number} lat1 - Latitude of the first point.
   * @param {number} lon1 - Longitude of the first point.
   * @param {number} lat2 - Latitude of the second point.
   * @param {number} lon2 - Longitude of the second point.
   * @returns {number} - The distance in kilometers.
   */
  calculateDistance: (lat1, lon1, lat2, lon2) => {
    const toRadians = (degrees) => degrees * (Math.PI / 180);
    const R = 6371; // Earth's radius in kilometers
    const dLat = toRadians(lat2 - lat1);
    const dLon = toRadians(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in kilometers
  },

  /**
   * Get the city name from latitude and longitude using a geocoding API.
   * @param {number} latitude - The latitude of the location.
   * @param {number} longitude - The longitude of the location.
   * @returns {Promise<string>} - The name of the city.
   * @throws {Error} - If the API request fails.
   */
  getCityFromCoords: async (latitude, longitude) => {
    try {
      const response = await axios.get('https://api.opencagedata.com/geocode/v1/json', {
        params: {
          q: `${latitude},${longitude}`,
          key: process.env.GEOCODING_API_KEY
        }
      });
      return response.data.results[0]?.components?.city || 'Unknown';
    } catch (err) {
      console.error('Failed to fetch city from coordinates:', err);
      throw new Error('Unable to fetch city name from coordinates.');
    }
  },

  /**
   * Check if two coordinates are within a specified radius.
   * @param {number} lat1 - Latitude of the first point.
   * @param {number} lon1 - Longitude of the first point.
   * @param {number} lat2 - Latitude of the second point.
   * @param {number} lon2 - Longitude of the second point.
   * @param {number} radius - The radius in kilometers.
   * @returns {boolean} - True if the points are within the radius, false otherwise.
   */
  isWithinRadius: (lat1, lon1, lat2, lon2, radius) => {
    const distance = module.exports.calculateDistance(lat1, lon1, lat2, lon2);
    return distance <= radius;
  }
};