const express = require('express');
const router = express.Router();
const advancedStakingService = require('../services/advancedStakingService');

router.get('/stats', async (req, res) => {
  try {
    const stats = await advancedStakingService.getStakingStats();
    const apr = await advancedStakingService.getCurrentAPR();
    
    res.json({
      success: true,
      data: {
        ...stats,
        currentAPR: `${apr}%`
      }
    });
  } catch (error) {
    console.error('❌ Staking stats error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/stakes/:walletAddress', async (req, res) => {
  try {
    const { walletAddress } = req.params;
    const stakesData = await advancedStakingService.getUserStakes(walletAddress);
    
    res.json({
      success: true,
      data: stakesData,
      count: stakesData.stakes ? stakesData.stakes.length : 0
    });
  } catch (error) {
    console.error('❌ User stakes error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/rewards/:walletAddress', async (req, res) => {
  try {
    const { walletAddress } = req.params;
    const rewards = await advancedStakingService.getPendingRewards(walletAddress);
    
    res.json({
      success: true,
      data: rewards
    });
  } catch (error) {
    console.error('❌ Pending rewards error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/history/:walletAddress', async (req, res) => {
  try {
    const { walletAddress } = req.params;
    const { limit = 50 } = req.query;
    const history = await advancedStakingService.getRewardsHistory(
      walletAddress,
      parseInt(limit)
    );
    
    res.json({
      success: true,
      data: history
    });
  } catch (error) {
    console.error('❌ Rewards history error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
