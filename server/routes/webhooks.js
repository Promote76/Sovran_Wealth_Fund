const express = require('express');
const { dealService } = require('../iela/services/dealService');
const featureFlags = require('../config/featureFlags');

const router = express.Router();

router.post('/investorlift/email', async (req, res) => {
  if (!featureFlags.IELA_ENABLED) {
    return res.status(404).json({
      success: false,
      error: 'IELA Pipeline is not enabled'
    });
  }

  try {
    const emailData = parseInvestorLiftEmail(req.body);

    if (!emailData) {
      return res.status(400).json({
        success: false,
        error: 'Invalid email format'
      });
    }

    const deal = await dealService.ingestDeal({
      source: 'email',
      rawText: emailData.text,
      url: emailData.url
    }, null);

    console.log(`✅ IELA Webhook: Email deal ingested ${deal.id}`);

    res.json({
      success: true,
      data: { dealId: deal.id }
    });
  } catch (error) {
    console.error('❌ IELA email webhook error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

router.post('/twilio/sms', async (req, res) => {
  if (!featureFlags.IELA_ENABLED) {
    return res.status(404).json({
      success: false,
      error: 'IELA Pipeline is not enabled'
    });
  }

  try {
    const twilioData = parseTwilioSMS(req.body);

    if (!twilioData) {
      return res.status(400).json({
        success: false,
        error: 'Invalid SMS format'
      });
    }

    const deal = await dealService.ingestDeal({
      source: 'sms',
      rawText: twilioData.body,
      url: null
    }, null);

    console.log(`✅ IELA Webhook: SMS deal ingested ${deal.id}`);

    const twimlResponse = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>Deal received! ID: ${deal.id.substring(0, 8)}. We'll analyze and get back to you.</Message>
</Response>`;

    res.type('text/xml');
    res.send(twimlResponse);
  } catch (error) {
    console.error('❌ IELA SMS webhook error:', error);

    const errorTwiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>Sorry, we couldn't process your deal. Please try again later.</Message>
</Response>`;

    res.type('text/xml');
    res.send(errorTwiml);
  }
});

router.post('/generic/deal', async (req, res) => {
  if (!featureFlags.IELA_ENABLED) {
    return res.status(404).json({
      success: false,
      error: 'IELA Pipeline is not enabled'
    });
  }

  try {
    const { text, url, source = 'webhook' } = req.body;

    if (!text) {
      return res.status(400).json({
        success: false,
        error: 'text field is required'
      });
    }

    const deal = await dealService.ingestDeal({
      source,
      rawText: text,
      url: url || null
    }, null);

    console.log(`✅ IELA Webhook: Generic deal ingested ${deal.id}`);

    res.json({
      success: true,
      data: { dealId: deal.id }
    });
  } catch (error) {
    console.error('❌ IELA generic webhook error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

function parseInvestorLiftEmail(emailBody) {
  try {
    const subject = emailBody.subject || '';
    const text = emailBody.text || emailBody.body || '';
    const html = emailBody.html || '';

    if (!text && !html) {
      return null;
    }

    const content = text || html.replace(/<[^>]*>/g, '');

    const urlMatch = content.match(/https?:\/\/[^\s]+/);
    const url = urlMatch ? urlMatch[0] : null;

    return {
      text: content,
      url,
      subject
    };
  } catch (error) {
    console.error('Error parsing InvestorLift email:', error);
    return null;
  }
}

function parseTwilioSMS(twilioBody) {
  try {
    const body = twilioBody.Body;
    const from = twilioBody.From;
    const to = twilioBody.To;

    if (!body) {
      return null;
    }

    return {
      body,
      from,
      to,
      messageId: twilioBody.MessageSid
    };
  } catch (error) {
    console.error('Error parsing Twilio SMS:', error);
    return null;
  }
}

module.exports = router;
