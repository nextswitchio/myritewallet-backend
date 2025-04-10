const crypto = require('crypto');

module.exports = {
  /**
   * Generate a One-Time Password (OTP).
   * @param {number} length - The length of the OTP (default: 6).
   * @param {string} [charset='0123456789'] - The character set to use for the OTP (default: numeric).
   * @returns {string} - The generated OTP.
   * @throws {Error} - If the length is invalid or the charset is empty.
   */
  generateOTP: (length = 6, charset = '0123456789') => {
    if (!Number.isInteger(length) || length <= 0) {
      throw new Error('Invalid OTP length. Length must be a positive integer.');
    }
    if (!charset || typeof charset !== 'string' || charset.length === 0) {
      throw new Error('Invalid character set. Charset must be a non-empty string.');
    }

    let otp = '';
    for (let i = 0; i < length; i++) {
      otp += charset[crypto.randomInt(0, charset.length)];
    }
    return otp;
  },

  /**
   * Generate an expiration time for the OTP.
   * @param {number} minutes - The expiration time in minutes (default: 15).
   * @returns {Date} - The expiration time as a Date object.
   * @throws {Error} - If the minutes parameter is invalid.
   */
  generateExpiry: (minutes = 15) => {
    if (!Number.isFinite(minutes) || minutes <= 0) {
      throw new Error('Invalid expiry time. Minutes must be a positive number.');
    }
    return new Date(Date.now() + minutes * 60 * 1000);
  }
};