const crypto = require('crypto');

module.exports = {
  generateOTP: (length = 6) => {
    const digits = '0123456789';
    let otp = '';
    for (let i = 0; i < length; i++) {
      otp += digits[crypto.randomInt(0, digits.length)];
    }
    return otp;
  },

  generateExpiry: (minutes = 15) => {
    return new Date(Date.now() + minutes * 60 * 1000);
  }
};