const express = require('express');
const router = express.Router();
const revenueRouterService = require('../services/revenueRouterService');

router.get('/stats', async (req, res) => {
  try {
    const stats = await revenueRouterService.getRouterStats();
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('❌ Revenue router stats error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/distributions', async (req, res) => {
  try {
    const { limit = 50, offset = 0 } = req.query;
    const distributions = await revenueRouterService.getDistributionHistory(
      parseInt(limit),
      parseInt(offset)
    );
    
    res.json({
      success: true,
      data: distributions,
      count: distributions.length
    });
  } catch (error) {
    console.error('❌ Distributions error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/sources', async (req, res) => {
  try {
    const sources = await revenueRouterService.getRevenueSources();
    
    res.json({
      success: true,
      data: sources
    });
  } catch (error) {
    console.error('❌ Revenue sources error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/source/:source', async (req, res) => {
  try {
    const { source } = req.params;
    const data = await revenueRouterService.getDistributionsBySource(source);
    
    res.json({
      success: true,
      data
    });
  } catch (error) {
    console.error('❌ Source distributions error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/record', async (req, res) => {
  try {
    const { source, amount, txHash } = req.body;
    
    if (!source || !amount) {
      return res.status(400).json({ 
        success: false, 
        error: 'Source and amount required' 
      });
    }

    const distribution = await revenueRouterService.recordDistribution(
      source,
      amount,
      txHash
    );
    
    res.json({
      success: true,
      data: distribution
    });
  } catch (error) {
    console.error('❌ Record distribution error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
