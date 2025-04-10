const twilio = require('twilio');
const logger = require('../utils/logger');
const { handleSMSResponse } = require('./approvalManager');

class SMSApprovalService {
  constructor() {
    if (!process.env.TWILIO_SID || !process.env.TWILIO_AUTH_TOKEN || !process.env.TWILIO_NUMBER) {
      throw new Error('Twilio environment variables are not set.');
    }
    this.client = twilio(process.env.TWILIO_SID, process.env.TWILIO_AUTH_TOKEN);
  }

  /**
   * Send an SMS approval request.
   * @param {string} caseId - The ID of the case requiring approval.
   * @param {string} phone - The recipient's phone number.
   * @throws {Error} - If the SMS cannot be sent.
   */
  async sendRequest(caseId, phone) {
    try {
      await this.client.messages.create({
        body: `APPROVAL REQ ${caseId}: Reply\n- YES ${caseId} to approve\n- NO ${caseId} to reject`,
        from: process.env.TWILIO_NUMBER,
        to: phone
      });
      logger.info(`SMS approval request sent for case ID ${caseId} to ${phone}`);
    } catch (err) {
      logger.error(`Failed to send SMS to ${phone}:`, err.message);
      throw new Error('Failed to send SMS approval request.');
    }
  }

  /**
   * Parse an incoming SMS message.
   * @param {string} message - The incoming SMS message.
   * @returns {object|null} - The parsed response or null if invalid.
   */
  async parseIncoming(message) {
    try {
      const regex = /(YES|NO)\s+(\w+-\d+)/i;
      const match = message.match(regex);

      if (!match) {
        logger.error(`Invalid SMS format: ${message}`);
        return null;
      }

      return {
        caseId: match[2],
        approved: match[1].toUpperCase() === 'YES'
      };
    } catch (err) {
      logger.error(`Error parsing SMS message: ${err.message}`);
      throw new Error('Failed to parse incoming SMS message.');
    }
  }
}

module.exports = SMSApprovalService;

// Webhook endpoint
router.post('/sms/webhook', async (req, res) => {
  const smsService = new SMSApprovalService();
  const parsed = await smsService.parseIncoming(req.body.Body);
  
  if (parsed) {
    await handleSMSResponse(parsed.caseId, parsed.approved);
    res.send('<Response><Message>Received your approval response</Message></Response>');
  } else {
    res.status(400).send('<Response><Message>Invalid format</Message></Response>');
  }
});