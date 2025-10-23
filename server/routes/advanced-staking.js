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

router.post('/tx/stake', async (req, res) => {
  try {
    const { nftContract, nftTokenId, tier } = req.body;
    
    if (!nftContract || !nftTokenId || tier === undefined) {
      return res.status(400).json({ success: false, error: 'NFT contract, token ID, and tier required' });
    }

    const txData = await advancedStakingService.buildStakeTx(nftContract, nftTokenId, tier);
    
    res.json({
      success: true,
      data: txData,
      message: 'Transaction ready for signing'
    });
  } catch (error) {
    console.error('❌ Build stake tx error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/tx/unstake', async (req, res) => {
  try {
    const { nftTokenId } = req.body;
    
    if (!nftTokenId) {
      return res.status(400).json({ success: false, error: 'NFT token ID required' });
    }

    const txData = await advancedStakingService.buildUnstakeTx(nftTokenId);
    
    res.json({
      success: true,
      data: txData,
      message: 'Transaction ready for signing'
    });
  } catch (error) {
    console.error('❌ Build unstake tx error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/tx/claim-rewards', async (req, res) => {
  try {
    const { nftTokenId } = req.body;
    
    if (!nftTokenId) {
      return res.status(400).json({ success: false, error: 'NFT token ID required' });
    }

    const txData = await advancedStakingService.buildClaimRewardsTx(nftTokenId);
    
    res.json({
      success: true,
      data: txData,
      message: 'Transaction ready for signing'
    });
  } catch (error) {
    console.error('❌ Build claim rewards tx error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/confirm-stake', async (req, res) => {
  try {
    const { walletAddress, nftContract, nftTokenId, tier, txHash } = req.body;
    
    if (!walletAddress || !nftContract || !nftTokenId || tier === undefined || !txHash) {
      return res.status(400).json({ success: false, error: 'All fields required' });
    }

    const stake = await advancedStakingService.recordStake(walletAddress, nftContract, nftTokenId, tier, txHash);
    
    res.json({
      success: true,
      data: stake,
      message: 'Stake recorded successfully'
    });
  } catch (error) {
    console.error('❌ Confirm stake error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/confirm-unstake', async (req, res) => {
  try {
    const { walletAddress, nftTokenId, txHash } = req.body;
    
    if (!walletAddress || !nftTokenId || !txHash) {
      return res.status(400).json({ success: false, error: 'All fields required' });
    }

    const result = await advancedStakingService.recordUnstake(walletAddress, nftTokenId, txHash);
    
    res.json({
      success: true,
      data: result,
      message: 'Unstake recorded successfully'
    });
  } catch (error) {
    console.error('❌ Confirm unstake error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/confirm-claim', async (req, res) => {
  try {
    const { walletAddress, nftTokenId, amount, txHash } = req.body;
    
    if (!walletAddress || !nftTokenId || !amount || !txHash) {
      return res.status(400).json({ success: false, error: 'All fields required' });
    }

    const reward = await advancedStakingService.recordRewardClaim(walletAddress, nftTokenId, amount, txHash);
    
    res.json({
      success: true,
      data: reward,
      message: 'Reward claim recorded successfully'
    });
  } catch (error) {
    console.error('❌ Confirm claim error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
