const { ethers } = require('ethers');
const { getContractProvider } = require('./contractProvider');

const LIQUIDITY_VAULT_ADDRESS = '0xd070776c3603138a1d4b93a2f668d604a4a99e34';

const LIQUIDITY_VAULT_ABI = [
  "function lpToken() view returns (address)",
  "function totalStaked() view returns (uint256)",
  "function stakes(address user) view returns (uint256 amount, uint256 startTime, uint256 lastRewardTime)",
  "function pendingRewards(address user) view returns (uint256)",
  "function rewardRate() view returns (uint256)",
  "function minimumStake() view returns (uint256)",
  "function lockPeriod() view returns (uint256)",
  "function stake(uint256 amount)",
  "function unstake(uint256 amount)",
  "function claimRewards()",
  "event Staked(address indexed user, uint256 amount)",
  "event Unstaked(address indexed user, uint256 amount)",
  "event RewardsClaimed(address indexed user, uint256 amount)"
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
      const [lpToken, totalStaked, rewardRate, minimumStake, lockPeriod] = await Promise.all([
        this.contract.lpToken().catch(() => '0x0'),
        this.contract.totalStaked().catch(() => 0n),
        this.contract.rewardRate().catch(() => 0n),
        this.contract.minimumStake().catch(() => 0n),
        this.contract.lockPeriod().catch(() => 0n)
      ]);

      return {
        lpTokenAddress: lpToken,
        totalStaked: ethers.formatEther(totalStaked),
        rewardRate: ethers.formatEther(rewardRate),
        rewardRatePerDay: (Number(ethers.formatEther(rewardRate)) * 86400).toFixed(6),
        minimumStake: ethers.formatEther(minimumStake),
        lockPeriodSeconds: Number(lockPeriod),
        lockPeriodDays: (Number(lockPeriod) / 86400).toFixed(1),
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
      const [stakeInfo, pendingRewards] = await Promise.all([
        this.contract.stakes(userAddress).catch(() => [0n, 0n, 0n]),
        this.contract.pendingRewards(userAddress).catch(() => 0n)
      ]);

      const [amount, startTime, lastRewardTime] = stakeInfo;
      const now = Math.floor(Date.now() / 1000);
      const stakeDuration = Number(startTime) > 0 ? now - Number(startTime) : 0;

      return {
        amount: ethers.formatEther(amount),
        startTime: Number(startTime),
        lastRewardTime: Number(lastRewardTime),
        stakeDurationDays: (stakeDuration / 86400).toFixed(1),
        pendingRewards: ethers.formatEther(pendingRewards),
        isStaking: Number(amount) > 0
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
      const provider = this.contractProvider.getProvider();
      const currentBlock = await provider.getBlockNumber();
      const blocksPerDay = 28800;
      const fromBlock = Math.max(0, currentBlock - (blocksPerDay * 30));

      const [stakedEvents, unstakedEvents, claimedEvents] = await Promise.all([
        this.contract.queryFilter(this.contract.filters.Staked(), fromBlock, currentBlock),
        this.contract.queryFilter(this.contract.filters.Unstaked(), fromBlock, currentBlock),
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

      for (const event of unstakedEvents) {
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
      const [totalStaked, rewardRate] = await Promise.all([
        this.contract.totalStaked(),
        this.contract.rewardRate()
      ]);

      if (Number(totalStaked) === 0) {
        return '0';
      }

      const dailyRewards = Number(ethers.formatEther(rewardRate)) * 86400;
      const annualRewards = dailyRewards * 365;
      const totalStakedFormatted = Number(ethers.formatEther(totalStaked));
      const apy = (annualRewards / totalStakedFormatted) * 100;

      return apy.toFixed(2);
    } catch (error) {
      console.error('❌ Calculate APY error:', error);
      return '0';
    }
  }
}

module.exports = new LiquidityVaultService();
