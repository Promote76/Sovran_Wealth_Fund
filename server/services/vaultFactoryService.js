const { ethers } = require('ethers');
const { getContractProvider } = require('./contractProvider');

// VaultFactory deployed on BSC Mainnet - 2025-10-24
const VAULT_FACTORY_ADDRESS = process.env.VAULT_FACTORY_ADDRESS || '0x45214E837caf29974b900Fcd5537Bc04E8809926';

const VAULT_FACTORY_ABI = [
  "function allVaults(uint256) view returns (address)",
  "function lpTokenToVault(address) view returns (address)",
  "function isVault(address) view returns (bool)",
  "function defaultRewardToken() view returns (address)",
  "function getVault(address lpToken) view returns (address)",
  "function getAllVaults() view returns (address[])",
  "function vaultCount() view returns (uint256)",
  "function getVaults(address[] lpTokens) view returns (address[])",
  "function getVaultDetails() view returns (address[] lpTokens, address[] vaults, uint256[] totalStakes)",
  "function createVault(address lpToken, uint256 rewardRate, uint256 lockPeriod, uint256 minimumStake) returns (address)",
  "event VaultCreated(address indexed lpToken, address indexed vault, uint256 rewardRate, uint256 lockPeriod, uint256 minimumStake, uint256 vaultIndex)"
];

const LIQUIDITY_REWARDS_VAULT_ABI = [
  "function lpToken() view returns (address)",
  "function rewardToken() view returns (address)",
  "function totalStaked() view returns (uint256)",
  "function rewardRate() view returns (uint256)",
  "function lockPeriod() view returns (uint256)",
  "function minimumStake() view returns (uint256)",
  "function calculateAPY() view returns (uint256)",
  "function getUserStake(address) view returns (uint256 amount, uint256 startTime, uint256 lastClaimTime, uint256 pendingReward, bool canWithdraw)"
];

class VaultFactoryService {
  constructor() {
    this.contractProvider = getContractProvider();
    this.factory = null;
    this.initialized = false;
  }

  async initialize() {
    if (this.initialized) return;
    
    try {
      const provider = this.contractProvider.getProvider();
      this.factory = new ethers.Contract(VAULT_FACTORY_ADDRESS, VAULT_FACTORY_ABI, provider);
      this.initialized = true;
      console.log('✅ VaultFactoryService initialized');
    } catch (error) {
      console.error('❌ VaultFactoryService initialization error:', error);
      throw error;
    }
  }

  async getAllVaults() {
    await this.initialize();
    
    try {
      const [lpTokens, vaults, totalStakes] = await this.factory.getVaultDetails();
      
      const vaultDetails = [];
      const provider = this.contractProvider.getProvider();
      
      for (let i = 0; i < vaults.length; i++) {
        const vaultContract = new ethers.Contract(vaults[i], LIQUIDITY_REWARDS_VAULT_ABI, provider);
        
        const [rewardRate, lockPeriod, minimumStake, apy] = await Promise.all([
          vaultContract.rewardRate(),
          vaultContract.lockPeriod(),
          vaultContract.minimumStake(),
          vaultContract.calculateAPY()
        ]);
        
        vaultDetails.push({
          lpToken: lpTokens[i],
          vaultAddress: vaults[i],
          totalStaked: ethers.formatEther(totalStakes[i]),
          rewardRate: ethers.formatEther(rewardRate),
          rewardRatePerDay: (Number(ethers.formatEther(rewardRate)) * 86400).toFixed(6),
          lockPeriodDays: (Number(lockPeriod) / 86400).toFixed(1),
          minimumStake: ethers.formatEther(minimumStake),
          apy: (Number(apy) / 100).toFixed(2)
        });
      }
      
      return vaultDetails;
    } catch (error) {
      console.error('❌ Get all vaults error:', error);
      return [];
    }
  }

  async getVaultForLP(lpTokenAddress) {
    await this.initialize();
    
    try {
      const vaultAddress = await this.factory.getVault(lpTokenAddress);
      
      if (vaultAddress === ethers.ZeroAddress) {
        return null;
      }
      
      const provider = this.contractProvider.getProvider();
      const vaultContract = new ethers.Contract(vaultAddress, LIQUIDITY_REWARDS_VAULT_ABI, provider);
      
      const [totalStaked, rewardRate, lockPeriod, minimumStake, apy] = await Promise.all([
        vaultContract.totalStaked(),
        vaultContract.rewardRate(),
        vaultContract.lockPeriod(),
        vaultContract.minimumStake(),
        vaultContract.calculateAPY()
      ]);
      
      return {
        lpToken: lpTokenAddress,
        vaultAddress: vaultAddress,
        totalStaked: ethers.formatEther(totalStaked),
        rewardRate: ethers.formatEther(rewardRate),
        rewardRatePerDay: (Number(ethers.formatEther(rewardRate)) * 86400).toFixed(6),
        lockPeriodDays: (Number(lockPeriod) / 86400).toFixed(1),
        minimumStake: ethers.formatEther(minimumStake),
        apy: (Number(apy) / 100).toFixed(2)
      };
    } catch (error) {
      console.error('❌ Get vault for LP error:', error);
      return null;
    }
  }

  async getUserStakeInVault(vaultAddress, userAddress) {
    await this.initialize();
    
    try {
      const provider = this.contractProvider.getProvider();
      const vaultContract = new ethers.Contract(vaultAddress, LIQUIDITY_REWARDS_VAULT_ABI, provider);
      
      const [amount, startTime, lastClaimTime, pendingReward, canWithdraw] = await vaultContract.getUserStake(userAddress);
      
      const now = Math.floor(Date.now() / 1000);
      const stakeDuration = Number(startTime) > 0 ? now - Number(startTime) : 0;
      
      return {
        vaultAddress,
        amount: ethers.formatEther(amount),
        startTime: Number(startTime),
        lastClaimTime: Number(lastClaimTime),
        stakeDurationDays: (stakeDuration / 86400).toFixed(1),
        pendingRewards: ethers.formatEther(pendingReward),
        isStaking: Number(amount) > 0,
        canWithdraw: canWithdraw
      };
    } catch (error) {
      console.error('❌ Get user stake error:', error);
      return {
        vaultAddress,
        amount: '0',
        startTime: 0,
        lastClaimTime: 0,
        stakeDurationDays: '0',
        pendingRewards: '0',
        isStaking: false,
        canWithdraw: true
      };
    }
  }

  async getFactoryInfo() {
    await this.initialize();
    
    try {
      const [defaultRewardToken, vaultCount] = await Promise.all([
        this.factory.defaultRewardToken(),
        this.factory.vaultCount()
      ]);
      
      return {
        factoryAddress: VAULT_FACTORY_ADDRESS,
        defaultRewardToken,
        vaultCount: Number(vaultCount)
      };
    } catch (error) {
      console.error('❌ Get factory info error:', error);
      throw error;
    }
  }
}

module.exports = new VaultFactoryService();
