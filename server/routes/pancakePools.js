const express = require('express');
const router = express.Router();
const pancakePoolService = require('../services/pancakePoolService');

// Get specific pair info
router.get('/pair/:tokenA/:tokenB', async (req, res) => {
  try {
    const { tokenA, tokenB } = req.params;
    const pairInfo = await pancakePoolService.getPairInfo(tokenA, tokenB);
    
    res.json({
      success: true,
      data: pairInfo
    });
  } catch (error) {
    console.error('❌ Get pair info error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get AXM/BNB pair info
router.get('/axm/bnb', async (req, res) => {
  try {
    const pairInfo = await pancakePoolService.getAXMBNBPair();
    
    res.json({
      success: true,
      data: pairInfo
    });
  } catch (error) {
    console.error('❌ Get AXM/BNB pair error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get AXM/BUSD pair info
router.get('/axm/busd', async (req, res) => {
  try {
    const pairInfo = await pancakePoolService.getAXMBUSDPair();
    
    res.json({
      success: true,
      data: pairInfo
    });
  } catch (error) {
    console.error('❌ Get AXM/BUSD pair error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get all AXM trading pairs
router.get('/axm/all', async (req, res) => {
  try {
    const pairs = await pancakePoolService.getAllAXMPairs();
    
    res.json({
      success: true,
      data: pairs
    });
  } catch (error) {
    console.error('❌ Get all AXM pairs error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Clear cache (admin only - can add auth middleware)
router.post('/cache/clear', (req, res) => {
  try {
    pancakePoolService.clearCache();
    res.json({
      success: true,
      message: 'Pool cache cleared'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
