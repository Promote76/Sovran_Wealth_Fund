const express = require('express');
const router = express.Router();
const realEstateInvestorService = require('../services/realEstateInvestorService');

// Get all properties
router.get('/properties', async (req, res) => {
  try {
    const properties = await realEstateInvestorService.getAllProperties();
    
    res.json({
      success: true,
      data: properties
    });
  } catch (error) {
    console.error('❌ Properties error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get investor portfolio
router.get('/portfolio/:walletAddress', async (req, res) => {
  try {
    const { walletAddress } = req.params;
    const portfolio = await realEstateInvestorService.getInvestorPortfolio(walletAddress);
    
    res.json({
      success: true,
      data: portfolio
    });
  } catch (error) {
    console.error('❌ Portfolio error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Build invest transaction
router.post('/tx/invest', async (req, res) => {
  try {
    const { walletAddress, propertyId, amount } = req.body;
    
    if (!walletAddress || !propertyId || !amount) {
      return res.status(400).json({ 
        success: false, 
        error: 'Wallet address, property ID, and amount required' 
      });
    }

    const txData = await realEstateInvestorService.buildInvestTx(
      walletAddress,
      propertyId,
      amount
    );
    
    res.json({
      success: true,
      data: txData,
      message: 'Transaction ready for signing'
    });
  } catch (error) {
    console.error('❌ Build invest tx error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Build claim rental transaction
router.post('/tx/claim-rental', async (req, res) => {
  try {
    const { walletAddress, propertyId } = req.body;
    
    if (!walletAddress) {
      return res.status(400).json({ 
        success: false, 
        error: 'Wallet address required' 
      });
    }

    const txData = await realEstateInvestorService.buildClaimRentalTx(
      walletAddress,
      propertyId || 'all'
    );
    
    res.json({
      success: true,
      data: txData,
      message: 'Transaction ready for signing'
    });
  } catch (error) {
    console.error('❌ Build claim rental tx error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get platform statistics
router.get('/stats', async (req, res) => {
  try {
    const stats = await realEstateInvestorService.getPlatformStats();
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('❌ Stats error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
