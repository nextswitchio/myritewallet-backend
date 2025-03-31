const axios = require('axios');

module.exports = {
  sendSMS: async (phone, message) => {
    if (process.env.NODE_ENV === 'test') return true; // Skip in tests
    
    try {
      const response = await axios.post(
        'https://api.africastalking.com/version1/messaging',
        new URLSearchParams({
          username: process.env.AT_USERNAME,
          to: phone,
          message,
          from: 'myRite'
        }),
        {
          headers: {
            'ApiKey': process.env.AT_API_KEY,
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      );
      return response.data.SMSMessageData.Recipients[0].status === 'Success';
    } catch (err) {
      console.error('SMS failed:', err.response?.data || err.message);
      return false;
    }
  }
};