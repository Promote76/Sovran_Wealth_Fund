const express = require('express');
const router = express.Router();
const liquidityVaultService = require('../services/liquidityVaultService');

router.get('/stats', async (req, res) => {
  try {
    const stats = await liquidityVaultService.getVaultStats();
    const apy = await liquidityVaultService.calculateAPY();
    
    res.json({
      success: true,
      data: {
        ...stats,
        apy
      }
    });
  } catch (error) {
    console.error('❌ Vault stats error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/user-stake/:address', async (req, res) => {
  try {
    const { address } = req.params;
    
    if (!address || !/^0x[a-fA-F0-9]{40}$/.test(address)) {
      return res.status(400).json({ success: false, error: 'Invalid address' });
    }

    const stake = await liquidityVaultService.getUserStake(address);
    
    res.json({
      success: true,
      data: stake
    });
  } catch (error) {
    console.error('❌ User stake error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/history', async (req, res) => {
  try {
    const history = await liquidityVaultService.getStakingHistory();
    
    res.json({
      success: true,
      data: history
    });
  } catch (error) {
    console.error('❌ Staking history error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
