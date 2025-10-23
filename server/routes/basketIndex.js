const express = require('express');
const router = express.Router();
const basketIndexService = require('../services/basketIndexService');

router.get('/info', async (req, res) => {
  try {
    const info = await basketIndexService.getBasketInfo();
    
    res.json({
      success: true,
      data: info
    });
  } catch (error) {
    console.error('❌ BasketIndex info error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/balance/:walletAddress', async (req, res) => {
  try {
    const { walletAddress } = req.params;
    const balance = await basketIndexService.getUserBalance(walletAddress);
    
    res.json({
      success: true,
      data: balance
    });
  } catch (error) {
    console.error('❌ Get balance error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/estimate', async (req, res) => {
  try {
    const { amount } = req.body;
    
    if (!amount || amount <= 0) {
      return res.status(400).json({ success: false, error: 'Valid amount required' });
    }

    const required = await basketIndexService.estimateRequiredAssets(amount);
    
    res.json({
      success: true,
      data: required
    });
  } catch (error) {
    console.error('❌ Estimate assets error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/tx/mint', async (req, res) => {
  try {
    const { amount } = req.body;
    
    if (!amount || amount <= 0) {
      return res.status(400).json({ success: false, error: 'Valid amount required' });
    }

    const txData = await basketIndexService.buildMintTx(amount);
    
    res.json({
      success: true,
      data: txData,
      message: 'Transaction ready for signing'
    });
  } catch (error) {
    console.error('❌ Build mint tx error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/tx/burn', async (req, res) => {
  try {
    const { amount } = req.body;
    
    if (!amount || amount <= 0) {
      return res.status(400).json({ success: false, error: 'Valid amount required' });
    }

    const txData = await basketIndexService.buildBurnTx(amount);
    
    res.json({
      success: true,
      data: txData,
      message: 'Transaction ready for signing'
    });
  } catch (error) {
    console.error('❌ Build burn tx error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
