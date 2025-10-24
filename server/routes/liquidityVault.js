const express = require('express');
const router = express.Router();
const liquidityVaultService = require('../services/liquidityVaultService');
const vaultFactoryService = require('../services/vaultFactoryService');

// Factory routes - Get all vaults
router.get('/factory/all-vaults', async (req, res) => {
  try {
    const vaults = await vaultFactoryService.getAllVaults();
    res.json({
      success: true,
      data: vaults
    });
  } catch (error) {
    console.error('❌ Get all vaults error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Factory routes - Get vault for specific LP token
router.get('/factory/vault/:lpToken', async (req, res) => {
  try {
    const { lpToken } = req.params;
    
    if (!lpToken || !/^0x[a-fA-F0-9]{40}$/.test(lpToken)) {
      return res.status(400).json({ success: false, error: 'Invalid LP token address' });
    }

    const vault = await vaultFactoryService.getVaultForLP(lpToken);
    res.json({
      success: true,
      data: vault
    });
  } catch (error) {
    console.error('❌ Get vault for LP error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Factory routes - Get user stakes across all vaults
router.get('/factory/user-stakes/:address', async (req, res) => {
  try {
    const { address } = req.params;
    
    if (!address || !/^0x[a-fA-F0-9]{40}$/.test(address)) {
      return res.status(400).json({ success: false, error: 'Invalid address' });
    }

    const vaults = await vaultFactoryService.getAllVaults();
    const stakes = await Promise.all(
      vaults.map(vault => vaultFactoryService.getUserStakeInVault(vault.vaultAddress, address))
    );
    
    const stakesWithVaultInfo = stakes.map((stake, index) => ({
      ...stake,
      lpToken: vaults[index].lpToken,
      apy: vaults[index].apy,
      totalStaked: vaults[index].totalStaked
    }));
    
    res.json({
      success: true,
      data: stakesWithVaultInfo
    });
  } catch (error) {
    console.error('❌ Get user stakes error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Factory routes - Get factory info
router.get('/factory/info', async (req, res) => {
  try {
    const info = await vaultFactoryService.getFactoryInfo();
    res.json({
      success: true,
      data: info
    });
  } catch (error) {
    console.error('❌ Get factory info error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Legacy single vault routes (for backwards compatibility)
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
