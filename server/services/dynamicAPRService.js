const { ethers } = require('ethers');
const { getContractProvider } = require('./contractProvider');

const DYNAMIC_APR_ADDRESS = '0x14dFA6b6785643850e5c09336F7Cd5971458e28d';

const DYNAMIC_APR_ABI = [
  "function currentAPR() view returns (uint256)",
  "function minAPR() view returns (uint256)",
  "function maxAPR() view returns (uint256)",
  "function lowDepositThreshold() view returns (uint256)",
  "function highDepositThreshold() view returns (uint256)",
  "function adjustmentInterval() view returns (uint256)",
  "function lastAdjustmentTime() view returns (uint256)",
  "function getAPRInfo() view returns (uint256 _currentAPR, uint256 _nextAdjustmentTime, uint256 _totalDeposited)",
  "function simulateAPRForDeposit(uint256 depositAmount) view returns (uint256)",
  "function adjustAPR()",
  "function canSetAPR() view returns (bool)",
  "function getStakingContractAPR() view returns (uint256)",
  "event APRAdjusted(uint256 oldAPR, uint256 newAPR)"
];

class DynamicAPRService {
  constructor() {
    this.contractProvider = getContractProvider();
    this.contract = null;
    this.initialized = false;
  }

  async initialize() {
    if (this.initialized) return;
    
    try {
      const provider = this.contractProvider.getProvider();
      this.contract = new ethers.Contract(DYNAMIC_APR_ADDRESS, DYNAMIC_APR_ABI, provider);
      this.initialized = true;
      console.log('✅ DynamicAPRService initialized');
    } catch (error) {
      console.error('❌ DynamicAPRService initialization error:', error);
      throw error;
    }
  }

  async getAPRDashboard() {
    await this.initialize();
    
    try {
      const [aprInfo, minAPR, maxAPR, lowThreshold, highThreshold, interval, canSet, stakingAPR] = await Promise.all([
        this.contract.getAPRInfo(),
        this.contract.minAPR(),
        this.contract.maxAPR(),
        this.contract.lowDepositThreshold(),
        this.contract.highDepositThreshold(),
        this.contract.adjustmentInterval(),
        this.contract.canSetAPR(),
        this.contract.getStakingContractAPR().catch(() => 0n)
      ]);

      const [currentAPR, nextAdjustmentTime, totalDeposited] = aprInfo;
      
      const now = Math.floor(Date.now() / 1000);
      const timeUntilNext = Number(nextAdjustmentTime) > now ? Number(nextAdjustmentTime) - now : 0;

      return {
        currentAPR: (Number(currentAPR) / 100).toFixed(2),
        currentAPRBasisPoints: currentAPR.toString(),
        stakingContractAPR: (Number(stakingAPR) / 100).toFixed(2),
        minAPR: (Number(minAPR) / 100).toFixed(2),
        maxAPR: (Number(maxAPR) / 100).toFixed(2),
        totalDeposited: ethers.formatEther(totalDeposited),
        lowDepositThreshold: ethers.formatEther(lowThreshold),
        highDepositThreshold: ethers.formatEther(highThreshold),
        adjustmentIntervalSeconds: Number(interval),
        adjustmentIntervalHours: (Number(interval) / 3600).toFixed(1),
        nextAdjustmentTime: Number(nextAdjustmentTime),
        timeUntilNextAdjustment: timeUntilNext,
        canAdjust: timeUntilNext === 0,
        hasPermission: canSet,
        contractAddress: DYNAMIC_APR_ADDRESS
      };
    } catch (error) {
      console.error('❌ Get APR dashboard error:', error);
      throw error;
    }
  }

  async simulateAPR(depositAmount) {
    await this.initialize();
    
    try {
      const amountWei = ethers.parseEther(depositAmount.toString());
      const simulatedAPR = await this.contract.simulateAPRForDeposit(amountWei);
      
      return {
        depositAmount: depositAmount.toString(),
        simulatedAPR: (Number(simulatedAPR) / 100).toFixed(2),
        simulatedAPRBasisPoints: simulatedAPR.toString()
      };
    } catch (error) {
      console.error('❌ Simulate APR error:', error);
      throw error;
    }
  }

  async getAPRHistory() {
    await this.initialize();
    
    try {
      const provider = this.contractProvider.getProvider();
      const currentBlock = await provider.getBlockNumber();
      const blocksPerDay = 28800;
      const fromBlock = Math.max(0, currentBlock - (blocksPerDay * 30));

      const filter = this.contract.filters.APRAdjusted();
      const events = await this.contract.queryFilter(filter, fromBlock, currentBlock);

      const history = await Promise.all(
        events.map(async (event) => {
          const block = await event.getBlock();
          return {
            oldAPR: (Number(event.args.oldAPR) / 100).toFixed(2),
            newAPR: (Number(event.args.newAPR) / 100).toFixed(2),
            timestamp: block.timestamp,
            blockNumber: event.blockNumber,
            txHash: event.transactionHash
          };
        })
      );

      return history.sort((a, b) => b.timestamp - a.timestamp);
    } catch (error) {
      console.error('❌ Get APR history error:', error);
      return [];
    }
  }

  async getDepositImpact() {
    await this.initialize();
    
    try {
      const [aprInfo, lowThreshold, highThreshold, minAPR, maxAPR] = await Promise.all([
        this.contract.getAPRInfo(),
        this.contract.lowDepositThreshold(),
        this.contract.highDepositThreshold(),
        this.contract.minAPR(),
        this.contract.maxAPR()
      ]);

      const [, , totalDeposited] = aprInfo;
      const current = Number(ethers.formatEther(totalDeposited));
      const low = Number(ethers.formatEther(lowThreshold));
      const high = Number(ethers.formatEther(highThreshold));

      const testPoints = [
        0,
        low * 0.5,
        low,
        low + (high - low) * 0.25,
        low + (high - low) * 0.5,
        low + (high - low) * 0.75,
        high,
        high * 1.5
      ];

      const impact = await Promise.all(
        testPoints.map(async (amount) => {
          const apr = await this.contract.simulateAPRForDeposit(ethers.parseEther(amount.toString()));
          return {
            depositAmount: amount.toFixed(0),
            apr: (Number(apr) / 100).toFixed(2),
            isCurrent: Math.abs(amount - current) < 100
          };
        })
      );

      return {
        currentDeposit: current.toFixed(2),
        lowThreshold: low.toFixed(2),
        highThreshold: high.toFixed(2),
        minAPR: (Number(minAPR) / 100).toFixed(2),
        maxAPR: (Number(maxAPR) / 100).toFixed(2),
        impactCurve: impact
      };
    } catch (error) {
      console.error('❌ Get deposit impact error:', error);
      throw error;
    }
  }
}

module.exports = new DynamicAPRService();
