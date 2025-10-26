const express = require('express');
const investorMatching = require('../iela/services/investorMatchingService');
const contractGeneration = require('../iela/services/contractGenerationService');
const { dealService } = require('../iela/services/dealService');
const featureFlags = require('../config/featureFlags');

const router = express.Router();

router.use((req, res, next) => {
  if (!featureFlags.IELA_ENABLED) {
    return res.status(404).json({
      success: false,
      error: 'IELA Pipeline is not enabled'
    });
  }
  next();
});

router.post('/register', async (req, res) => {
  try {
    const { investorId, criteria } = req.body;

    if (!investorId || !criteria) {
      return res.status(400).json({
        success: false,
        error: 'investorId and criteria required'
      });
    }

    const result = investorMatching.registerInvestor(investorId, criteria);

    res.json({
      success: true,
      data: { investorId, registered: result }
    });
  } catch (error) {
    console.error('❌ Investor registration error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

router.delete('/:investorId', async (req, res) => {
  try {
    const { investorId } = req.params;

    const result = investorMatching.unregisterInvestor(investorId);

    res.json({
      success: true,
      data: { investorId, unregistered: result }
    });
  } catch (error) {
    console.error('❌ Investor unregistration error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

router.post('/match/:dealId', async (req, res) => {
  try {
    const { dealId } = req.params;

    const deal = await dealService.getDeal(dealId);
    if (!deal) {
      return res.status(404).json({
        success: false,
        error: 'Deal not found'
      });
    }

    const matches = await investorMatching.matchDeal(deal);

    res.json({
      success: true,
      data: {
        dealId,
        matches: matches.map(m => ({
          investorId: m.investorId,
          matchScore: m.matchScore,
          matchedCriteria: m.matchedCriteria
        }))
      }
    });
  } catch (error) {
    console.error('❌ Investor matching error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

router.post('/assign/:dealId/:investorId', async (req, res) => {
  try {
    const { dealId, investorId } = req.params;

    const result = await investorMatching.assignDealToInvestor(dealId, investorId);

    res.json({
      success: true,
      data: { dealId, investorId, assigned: result }
    });
  } catch (error) {
    console.error('❌ Deal assignment error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

router.get('/list', async (req, res) => {
  try {
    const investors = investorMatching.getAllInvestors();

    res.json({
      success: true,
      data: investors
    });
  } catch (error) {
    console.error('❌ Investor list error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

router.post('/contracts/:dealId/offer-letter', async (req, res) => {
  try {
    const { dealId } = req.params;
    const { buyerInfo } = req.body;

    const deal = await dealService.getDeal(dealId);
    if (!deal) {
      return res.status(404).json({
        success: false,
        error: 'Deal not found'
      });
    }

    const filepath = await contractGeneration.generateOfferLetter(deal, buyerInfo || {});

    res.download(filepath, `offer-letter-${dealId}.pdf`, (err) => {
      const fs = require('fs');
      try {
        if (fs.existsSync(filepath)) {
          fs.unlinkSync(filepath);
          console.log(`✅ Cleaned up PDF: ${filepath}`);
        }
      } catch (cleanupError) {
        console.error('⚠️  Failed to cleanup PDF:', cleanupError.message);
      }
      
      if (err) {
        console.error('❌ Download error:', err);
      }
    });
  } catch (error) {
    console.error('❌ Offer letter generation error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

router.post('/contracts/:dealId/purchase-agreement', async (req, res) => {
  try {
    const { dealId } = req.params;
    const { buyerInfo, sellerInfo } = req.body;

    const deal = await dealService.getDeal(dealId);
    if (!deal) {
      return res.status(404).json({
        success: false,
        error: 'Deal not found'
      });
    }

    const filepath = await contractGeneration.generatePurchaseAgreement(
      deal,
      buyerInfo || {},
      sellerInfo || {}
    );

    res.download(filepath, `purchase-agreement-${dealId}.pdf`, (err) => {
      const fs = require('fs');
      try {
        if (fs.existsSync(filepath)) {
          fs.unlinkSync(filepath);
          console.log(`✅ Cleaned up PDF: ${filepath}`);
        }
      } catch (cleanupError) {
        console.error('⚠️  Failed to cleanup PDF:', cleanupError.message);
      }
      
      if (err) {
        console.error('❌ Download error:', err);
      }
    });
  } catch (error) {
    console.error('❌ Purchase agreement generation error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
