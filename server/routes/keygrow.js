const express = require('express');
const router = express.Router();
const keygrowService = require('../services/keygrowService');

router.get('/status', async (req, res) => {
  try {
    const stats = await keygrowService.getFundStats();
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('❌ KeyGrow status error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/register', async (req, res) => {
  try {
    const { walletAddress, tier } = req.body;
    
    if (!walletAddress) {
      return res.status(400).json({ success: false, error: 'Wallet address required' });
    }

    const renter = await keygrowService.registerRenter(walletAddress, tier || 0);
    
    res.json({
      success: true,
      data: renter
    });
  } catch (error) {
    console.error('❌ Registration error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/renter/:walletAddress', async (req, res) => {
  try {
    const { walletAddress } = req.params;
    const renterInfo = await keygrowService.getRenterInfo(walletAddress);
    
    res.json({
      success: true,
      data: renterInfo
    });
  } catch (error) {
    console.error('❌ Renter info error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/allocations/:walletAddress', async (req, res) => {
  try {
    const { walletAddress } = req.params;
    const allocations = await keygrowService.getPendingAllocations(walletAddress);
    
    res.json({
      success: true,
      data: allocations
    });
  } catch (error) {
    console.error('❌ Allocations error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/properties/:walletAddress', async (req, res) => {
  try {
    const { walletAddress } = req.params;
    const properties = await keygrowService.getProperties(walletAddress);
    
    res.json({
      success: true,
      data: properties
    });
  } catch (error) {
    console.error('❌ Properties error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
