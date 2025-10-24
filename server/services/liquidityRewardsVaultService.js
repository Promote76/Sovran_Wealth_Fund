const { ethers } = require('ethers');
const { getContractProvider } = require('./contractProvider');

// This will be updated after deployment
const LIQUIDITY_REWARDS_VAULT_ADDRESS = process.env.LIQUIDITY_REWARDS_VAULT_ADDRESS || '0x0000000000000000000000000000000000000000';

// Full-featured vault ABI with rewards
const LIQUIDITY_REWARDS_VAULT_ABI = [
  "function lpToken() view returns (address)",
  "function rewardToken() view returns (address)",
  "function totalStaked() view returns (uint256)",
  "function rewardRate() view returns (uint256)",
  "function lockPeriod() view returns (uint256)",
  "function minimumStake() view returns (uint256)",
  "function staked(address) view returns (uint256)",
  "function stakes(address) view returns (uint256 amount, uint256 startTime, uint256 lastClaimTime, uint256 rewardPerTokenPaid, uint256 rewards)",
  "function pendingRewards(address) view returns (uint256)",
  "function calculateAPY() view returns (uint256)",
  "function getUserStake(address) view returns (uint256 amount, uint256 startTime, uint256 lastClaimTime, uint256 pendingReward, bool canWithdraw)",
  "function stake(uint256 amount)",
  "function deposit(uint256 amount)",
  "function withdraw(uint256 amount)",
  "function claimRewards()",
  "function exit(uint256 amount)",
  "function balanceOf(address user) view returns (uint256)",
  "event Staked(address indexed user, uint256 amount)",
  "event Withdrawn(address indexed user, uint256 amount)",
  "event RewardsClaimed(address indexed user, uint256 amount)"
];

class LiquidityRewardsVaultService {
  constructor() {
    this.contractProvider = getContractProvider();
    this.contract = null;
    this.initialized = false;
  }

  async initialize() {
    if (this.initialized) return;
    
    try {
      const provider = this.contractProvider.getProvider();
      this.contract = new ethers.Contract(LIQUIDITY_REWARDS_VAULT_ADDRESS, LIQUIDITY_REWARDS_VAULT_ABI, provider);
      this.initialized = true;
      console.log('✅ LiquidityRewardsVaultService initialized');
    } catch (error) {
      console.error('❌ LiquidityRewardsVaultService initialization error:', error);
      throw error;
    }
  }

  async getVaultStats() {
    await this.initialize();
    
    try {
      const [lpToken, rewardToken, totalStaked, rewardRate, minimumStake, lockPeriod, apy] = await Promise.all([
        this.contract.lpToken().catch(() => '0x0'),
        this.contract.rewardToken().catch(() => '0x0'),
        this.contract.totalStaked().catch(() => 0n),
        this.contract.rewardRate().catch(() => 0n),
        this.contract.minimumStake().catch(() => 0n),
        this.contract.lockPeriod().catch(() => 0n),
        this.contract.calculateAPY().catch(() => 0n)
      ]);

      return {
        lpTokenAddress: lpToken,
        rewardTokenAddress: rewardToken,
        totalStaked: ethers.formatEther(totalStaked),
        rewardRate: ethers.formatEther(rewardRate),
        rewardRatePerDay: (Number(ethers.formatEther(rewardRate)) * 86400).toFixed(6),
        minimumStake: ethers.formatEther(minimumStake),
        lockPeriodSeconds: Number(lockPeriod),
        lockPeriodDays: (Number(lockPeriod) / 86400).toFixed(1),
        apy: (Number(apy) / 100).toFixed(2),
        contractAddress: LIQUIDITY_REWARDS_VAULT_ADDRESS
      };
    } catch (error) {
      console.error('❌ Get vault stats error:', error);
      throw error;
    }
  }

  async getUserStake(userAddress) {
    await this.initialize();
    
    try {
      const [amount, startTime, lastClaimTime, pendingReward, canWithdraw] = await this.contract.getUserStake(userAddress);

      const now = Math.floor(Date.now() / 1000);
      const stakeDuration = Number(startTime) > 0 ? now - Number(startTime) : 0;

      return {
        amount: ethers.formatEther(amount),
        startTime: Number(startTime),
        lastRewardTime: Number(lastClaimTime),
        stakeDurationDays: (stakeDuration / 86400).toFixed(1),
        pendingRewards: ethers.formatEther(pendingReward),
        isStaking: Number(amount) > 0,
        canWithdraw: canWithdraw
      };
    } catch (error) {
      console.error('❌ Get user stake error:', error);
      return {
        amount: '0',
        startTime: 0,
        lastRewardTime: 0,
        stakeDurationDays: '0',
        pendingRewards: '0',
        isStaking: false,
        canWithdraw: true
      };
    }
  }

  async getStakingHistory() {
    await this.initialize();
    
    try {
      const provider = this.contractProvider.getProvider();
      const currentBlock = await provider.getBlockNumber();
      const blocksPerDay = 28800;
      const fromBlock = Math.max(0, currentBlock - (blocksPerDay * 30));

      const [stakedEvents, withdrawnEvents, claimedEvents] = await Promise.all([
        this.contract.queryFilter(this.contract.filters.Staked(), fromBlock, currentBlock),
        this.contract.queryFilter(this.contract.filters.Withdrawn(), fromBlock, currentBlock),
        this.contract.queryFilter(this.contract.filters.RewardsClaimed(), fromBlock, currentBlock)
      ]);

      const events = [];

      for (const event of stakedEvents) {
        const block = await event.getBlock();
        events.push({
          type: 'stake',
          user: event.args.user,
          amount: ethers.formatEther(event.args.amount),
          timestamp: block.timestamp,
          blockNumber: event.blockNumber,
          txHash: event.transactionHash
        });
      }

      for (const event of withdrawnEvents) {
        const block = await event.getBlock();
        events.push({
          type: 'unstake',
          user: event.args.user,
          amount: ethers.formatEther(event.args.amount),
          timestamp: block.timestamp,
          blockNumber: event.blockNumber,
          txHash: event.transactionHash
        });
      }

      for (const event of claimedEvents) {
        const block = await event.getBlock();
        events.push({
          type: 'claim',
          user: event.args.user,
          amount: ethers.formatEther(event.args.amount),
          timestamp: block.timestamp,
          blockNumber: event.blockNumber,
          txHash: event.transactionHash
        });
      }

      return events.sort((a, b) => b.timestamp - a.timestamp);
    } catch (error) {
      console.error('❌ Get staking history error:', error);
      return [];
    }
  }

  async calculateAPY() {
    await this.initialize();
    
    try {
      const apy = await this.contract.calculateAPY();
      return (Number(apy) / 100).toFixed(2);
    } catch (error) {
      console.error('❌ Calculate APY error:', error);
      return '0';
    }
  }
}

module.exports = new LiquidityRewardsVaultService();
