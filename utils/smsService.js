const axios = require('axios');

module.exports = {
  /**
   * Send an SMS using Africa's Talking API.
   * @param {string} phone - The recipient's phone number.
   * @param {string} message - The message to send.
   * @returns {boolean} - True if the SMS was sent successfully, false otherwise.
   * @throws {Error} - If the phone number or message is invalid.
   */
  sendSMS: async (phone, message) => {
    // Validate input
    if (!phone || typeof phone !== 'string' || phone.length < 10) {
      throw new Error('Invalid phone number.');
    }
    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      throw new Error('Message cannot be empty.');
    }

    // Skip SMS sending in test environment
    if (process.env.NODE_ENV === 'test') {
      console.log(`SMS sending skipped in test environment. Phone: ${phone}, Message: ${message}`);
      return true;
    }

    try {
      const sender = process.env.AT_SENDER || 'myRite'; // Use environment variable for sender name
      const response = await axios.post(
        'https://api.africastalking.com/version1/messaging',
        new URLSearchParams({
          username: process.env.AT_USERNAME,
          to: phone,
          message,
          from: sender
        }),
        {
          headers: {
            'ApiKey': process.env.AT_API_KEY,
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      );

      // Validate response structure
      const recipients = response.data?.SMSMessageData?.Recipients;
      if (!recipients || recipients.length === 0) {
        throw new Error('No recipients in the SMS response.');
      }

      return recipients[0].status === 'Success';
    } catch (err) {
      console.error(`Failed to send SMS to ${phone}:`, err.response?.data || err.message);
      return false;
    }
  }
};