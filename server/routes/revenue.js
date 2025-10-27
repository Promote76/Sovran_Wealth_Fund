/**
 * Feature #4: Automated Revenue & Distribution Engine - API Routes
 * REST endpoints for revenue distributions, payouts, and Stripe Connect
 */

const express = require('express');
const router = express.Router();
const revenueEngineService = require('../services/revenueEngineService');

router.post('/distribute', async (req, res) => {
  try {
    const { propertyId, totalRevenue, distributionMonth } = req.body;

    if (!propertyId || !totalRevenue || !distributionMonth) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: propertyId, totalRevenue, distributionMonth'
      });
    }

    const result = await revenueEngineService.processRentalDistribution(
      propertyId,
      parseFloat(totalRevenue),
      distributionMonth
    );

    res.json(result);
  } catch (error) {
    console.error('Distribution error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to process distribution'
    });
  }
});

router.post('/execute-payout', async (req, res) => {
  try {
    const { batchId } = req.body;

    if (!batchId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: batchId'
      });
    }

    const result = await revenueEngineService.executeStripePayout(batchId);

    res.json(result);
  } catch (error) {
    console.error('Payout execution error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to execute payout'
    });
  }
});

router.post('/stripe/setup', async (req, res) => {
  try {
    const { investorId, email, firstName, lastName } = req.body;

    if (!email || !firstName || !lastName) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: email, firstName, lastName'
      });
    }

    const result = await revenueEngineService.setupStripeConnect(
      investorId,
      email,
      firstName,
      lastName
    );

    res.json(result);
  } catch (error) {
    console.error('Stripe setup error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to set up Stripe Connect'
    });
  }
});

router.post('/stripe/onboarding', async (req, res) => {
  try {
    const { investorId, returnUrl, refreshUrl } = req.body;

    if (!returnUrl || !refreshUrl) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: returnUrl, refreshUrl'
      });
    }

    const result = await revenueEngineService.getStripeOnboardingLink(
      investorId,
      returnUrl,
      refreshUrl
    );

    res.json(result);
  } catch (error) {
    console.error('Stripe onboarding error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get onboarding link'
    });
  }
});

router.post('/stripe/update-status', async (req, res) => {
  try {
    const { investorId } = req.body;

    const result = await revenueEngineService.updateStripeAccountStatus(investorId);

    res.json(result);
  } catch (error) {
    console.error('Stripe status update error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to update account status'
    });
  }
});

router.get('/stripe/status', async (req, res) => {
  try {
    const { investorId } = req.query;

    const result = await revenueEngineService.getStripeAccountStatus(investorId);

    if (!result.hasAccount) {
      return res.status(404).json({
        hasAccount: false,
        message: 'No Stripe account found for this investor'
      });
    }

    res.json(result);
  } catch (error) {
    console.error('Stripe status check error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to check account status'
    });
  }
});

router.get('/payouts', async (req, res) => {
  try {
    const { investorId, limit = 50 } = req.query;

    const payouts = await revenueEngineService.getInvestorPayouts(
      investorId ? parseInt(investorId) : null,
      parseInt(limit)
    );

    res.json({
      success: true,
      payouts
    });
  } catch (error) {
    console.error('Get payouts error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to retrieve payouts'
    });
  }
});

router.get('/batches', async (req, res) => {
  try {
    const { propertyId, limit = 10 } = req.query;

    const batches = await revenueEngineService.getAllPayoutBatches(
      propertyId ? parseInt(propertyId) : null,
      parseInt(limit)
    );

    res.json(batches);
  } catch (error) {
    console.error('Get batches error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to retrieve payout batches'
    });
  }
});

router.get('/analytics/:propertyId', async (req, res) => {
  try {
    const { propertyId } = req.params;

    if (!propertyId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameter: propertyId'
      });
    }

    const analytics = await revenueEngineService.getRevenueAnalytics(parseInt(propertyId));

    res.json(analytics);
  } catch (error) {
    console.error('Get analytics error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to retrieve revenue analytics'
    });
  }
});

module.exports = router;
