module.exports = {
  /**
   * Validate if a string is a valid email address.
   * @param {string} email - The email address to validate.
   * @returns {boolean} - True if the email is valid, false otherwise.
   */
  isValidEmail: (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  /**
   * Validate if a string is a valid phone number.
   * @param {string} phone - The phone number to validate.
   * @returns {boolean} - True if the phone number is valid, false otherwise.
   */
  isValidPhoneNumber: (phone) => {
    const phoneRegex = /^\+?[1-9]\d{1,14}$/; // E.164 format
    return phoneRegex.test(phone);
  },

  /**
   * Validate if a string is a strong password.
   * @param {string} password - The password to validate.
   * @returns {boolean} - True if the password is strong, false otherwise.
   */
  isStrongPassword: (password) => {
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return passwordRegex.test(password);
  },

  /**
   * Validate if a value is a positive integer.
   * @param {number} value - The value to validate.
   * @returns {boolean} - True if the value is a positive integer, false otherwise.
   */
  isPositiveInteger: (value) => {
    return Number.isInteger(value) && value > 0;
  },

  /**
   * Validate if a string is a valid URL.
   * @param {string} url - The URL to validate.
   * @returns {boolean} - True if the URL is valid, false otherwise.
   */
  isValidURL: (url) => {
    try {
      new URL(url);
      return true;
    } catch (err) {
      return false;
    }
  },

  /**
   * Validate if a value is a valid latitude and longitude.
   * @param {number} latitude - The latitude to validate.
   * @param {number} longitude - The longitude to validate.
   * @returns {boolean} - True if both latitude and longitude are valid, false otherwise.
   */
  isValidCoordinates: (latitude, longitude) => {
    const isValidLatitude = typeof latitude === 'number' && latitude >= -90 && latitude <= 90;
    const isValidLongitude = typeof longitude === 'number' && longitude >= -180 && longitude <= 180;
    return isValidLatitude && isValidLongitude;
  }
};