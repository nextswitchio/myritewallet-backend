const twilio = require('twilio');
const { handleSMSResponse } = require('./approvalManager');

class SMSApprovalService {
  constructor() {
    this.client = twilio(process.env.TWILIO_SID, process.env.TWILIO_AUTH_TOKEN);
  }

  async sendRequest(caseId, phone) {
    await this.client.messages.create({
      body: `APPROVAL REQ ${caseId}: Reply\n- YES ${caseId} to approve\n- NO ${caseId} to reject`,
      from: process.env.TWILIO_NUMBER,
      to: phone
    });
  }

  async parseIncoming(message) {
    // Extract case ID and response
    const regex = /(YES|NO)\s+(\w+-\d+)/i;
    const match = message.match(regex);
    
    return match ? {
      caseId: match[2],
      approved: match[1].toUpperCase() === 'YES'
    } : null;
  }
}

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