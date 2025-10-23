const { ethers } = require('ethers');
const { getContractProvider } = require('./contractProvider');

const LIQUIDITY_VAULT_ADDRESS = '0xd070776c3603138a1d4b93a2f668d604a4a99e34';

// Actual deployed contract ABI - simple deposit/withdraw vault
const LIQUIDITY_VAULT_ABI = [
  "function lpToken() view returns (address)",
  "function totalStaked() view returns (uint256)",
  "function staked(address) view returns (uint256)",
  "function balanceOf(address user) view returns (uint256)",
  "function deposit(uint256 amount)",
  "function withdraw(uint256 amount)",
  "function owner() view returns (address)",
  "event Transfer(address indexed from, address indexed to, uint256 value)"
];

class LiquidityVaultService {
  constructor() {
    this.contractProvider = getContractProvider();
    this.contract = null;
    this.initialized = false;
  }

  async initialize() {
    if (this.initialized) return;
    
    try {
      const provider = this.contractProvider.getProvider();
      this.contract = new ethers.Contract(LIQUIDITY_VAULT_ADDRESS, LIQUIDITY_VAULT_ABI, provider);
      this.initialized = true;
      console.log('✅ LiquidityVaultService initialized');
    } catch (error) {
      console.error('❌ LiquidityVaultService initialization error:', error);
      throw error;
    }
  }

  async getVaultStats() {
    await this.initialize();
    
    try {
      const [lpToken, totalStaked] = await Promise.all([
        this.contract.lpToken().catch(() => '0x0'),
        this.contract.totalStaked().catch(() => 0n)
      ]);

      return {
        lpTokenAddress: lpToken,
        totalStaked: ethers.formatEther(totalStaked),
        rewardRate: '0', // Not supported by this contract
        rewardRatePerDay: '0', // Not supported by this contract
        minimumStake: '0', // No minimum enforced by this contract
        lockPeriodSeconds: 0, // No lock period in this contract
        lockPeriodDays: '0', // No lock period in this contract
        apy: '0', // Not supported by this contract
        contractAddress: LIQUIDITY_VAULT_ADDRESS
      };
    } catch (error) {
      console.error('❌ Get vault stats error:', error);
      throw error;
    }
  }

  async getUserStake(userAddress) {
    await this.initialize();
    
    try {
      // Use staked(address) which returns the user's staked amount
      const stakedAmount = await this.contract.staked(userAddress).catch(() => 0n);

      return {
        amount: ethers.formatEther(stakedAmount),
        startTime: 0, // Not tracked by this simple contract
        lastRewardTime: 0, // Not tracked by this simple contract
        stakeDurationDays: '0', // Not tracked by this simple contract
        pendingRewards: '0', // No rewards in this simple contract
        isStaking: Number(stakedAmount) > 0
      };
    } catch (error) {
      console.error('❌ Get user stake error:', error);
      return {
        amount: '0',
        startTime: 0,
        lastRewardTime: 0,
        stakeDurationDays: '0',
        pendingRewards: '0',
        isStaking: false
      };
    }
  }

  async getStakingHistory() {
    await this.initialize();
    
    try {
      // This simple contract doesn't emit Staked/Unstaked events
      // It only emits Transfer events, which we could parse but are generic
      // For now, return empty array until a full-featured vault is deployed
      console.log('⚠️ Staking history not available - simple vault contract has no staking events');
      return [];
    } catch (error) {
      console.error('❌ Get staking history error:', error);
      return [];
    }
  }

  async calculateAPY() {
    await this.initialize();
    
    try {
      // This simple contract doesn't have reward rates or APY
      // Return 0 until a full-featured staking vault is deployed
      return '0';
    } catch (error) {
      console.error('❌ Calculate APY error:', error);
      return '0';
    }
  }
}



module.exports = new LiquidityVaultService();
