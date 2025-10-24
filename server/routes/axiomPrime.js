const express = require('express');
const router = express.Router();
const TierService = require('../services/tierService');
const AxiomPointsService = require('../services/axiomPointsService');
const ReferralService = require('../services/referralService');

const tierService = new TierService();
const pointsService = new AxiomPointsService();
const referralService = new ReferralService();

/**
 * GET /api/axiom-prime/tier/:address
 * Get user's tier information
 */
router.get('/tier/:address', async (req, res) => {
  try {
    const { address } = req.params;
    const tierInfo = await tierService.getUserTierInfo(address);
    
    res.json({
      success: true,
      ...tierInfo
    });
  } catch (error) {
    console.error('Tier lookup error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/axiom-prime/points/:address
 * Get user's points balance and history
 */
router.get('/points/:address', async (req, res) => {
  try {
    const { address } = req.params;
    const balance = await pointsService.getBalance(address);
    const history = await pointsService.getHistory(address, 50);
    const activeRewards = await pointsService.getActiveRewards(address);
    
    res.json({
      success: true,
      balance,
      history,
      activeRewards,
      catalog: pointsService.REDEMPTION_CATALOG
    });
  } catch (error) {
    console.error('Points lookup error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/axiom-prime/points/redeem
 * Redeem points for rewards
 */
router.post('/points/redeem', async (req, res) => {
  try {
    const { address, rewardType, quantity } = req.body;
    
    const result = await pointsService.redeemPoints(address, rewardType, quantity || 1);
    
    res.json(result);
  } catch (error) {
    console.error('Points redemption error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/axiom-prime/referral/:address
 * Get user's referral stats and network
 */
router.get('/referral/:address', async (req, res) => {
  try {
    const { address } = req.params;
    const stats = await referralService.getStats(address);
    const network = await referralService.getReferralNetwork(address);
    const earnings = await referralService.getEarnings(address);
    
    res.json({
      success: true,
      stats,
      network,
      earnings
    });
  } catch (error) {
    console.error('Referral lookup error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/axiom-prime/referral/create
 * Create referral code for user
 */
router.post('/referral/create', async (req, res) => {
  try {
    const { address, referredBy } = req.body;
    
    const result = await referralService.createReferralCode(address, referredBy);
    
    res.json(result);
  } catch (error) {
    console.error('Referral creation error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/axiom-prime/leaderboard
 * Get points leaderboard
 */
router.get('/leaderboard', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 100;
    const leaderboard = await pointsService.getLeaderboard(limit);
    
    res.json({
      success: true,
      leaderboard
    });
  } catch (error) {
    console.error('Leaderboard error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/axiom-prime/dashboard/:address
 * Get complete dashboard data for user
 */
router.get('/dashboard/:address', async (req, res) => {
  try {
    const { address } = req.params;
    
    // Fetch all user data in parallel
    const [tierInfo, pointsData, referralData] = await Promise.all([
      tierService.getUserTierInfo(address),
      (async () => {
        const balance = await pointsService.getBalance(address);
        const activeRewards = await pointsService.getActiveRewards(address);
        return { balance, activeRewards };
      })(),
      referralService.getStats(address)
    ]);
    
    res.json({
      success: true,
      tier: tierInfo,
      points: pointsData,
      referral: referralData
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
