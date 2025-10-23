const { getContractProvider } = require('./contractProvider');
const { db } = require('../db');
const { keygrowRenters, keygrowAllocations, keygrowProperties } = require('../../shared/schema');
const { eq, desc } = require('drizzle-orm');

class KeyGrowService {
  constructor() {
    this.contractProvider = getContractProvider();
  }

  async getRenterInfo(walletAddress) {
    try {
      const fundContract = this.contractProvider.getContract('RealEstateAcquisitionFund');
      
      const renterInfo = await fundContract.getRenterInfo(walletAddress);
      const tier = await fundContract.getUserTier(walletAddress);

      const dbRenter = await db.select()
        .from(keygrowRenters)
        .where(eq(keygrowRenters.walletAddress, walletAddress.toLowerCase()))
        .limit(1);

      return {
        walletAddress,
        tier: this.tierToString(tier),
        tierNumber: Number(tier),
        isRegistered: renterInfo.isActive || false,
        totalClaimed: renterInfo.totalClaimed ? this.contractProvider.formatEther(renterInfo.totalClaimed) : '0',
        lastClaimPeriod: Number(renterInfo.lastClaimPeriod || 0),
        active: dbRenter[0]?.active || false,
        registeredAt: dbRenter[0]?.registeredAt || null
      };
    } catch (error) {
      console.error('❌ getRenterInfo error:', error);
      return {
        walletAddress,
        tier: 'None',
        tierNumber: 0,
        isRegistered: false,
        totalClaimed: '0',
        lastClaimPeriod: 0,
        active: false,
        registeredAt: null
      };
    }
  }

  async getPendingAllocations(walletAddress) {
    try {
      const fundContract = this.contractProvider.getContract('RealEstateAcquisitionFund');
      const currentPeriod = await fundContract.currentDistributionPeriod();
      const renterInfo = await this.getRenterInfo(walletAddress);

      const pendingPeriods = [];
      for (let period = renterInfo.lastClaimPeriod + 1; period <= Number(currentPeriod); period++) {
        try {
          const allocation = await fundContract.calculateAllocation(walletAddress, period);
          if (allocation > 0n) {
            pendingPeriods.push({
              period,
              amount: this.contractProvider.formatEther(allocation),
              claimable: true
            });
          }
        } catch (err) {
          console.warn(`⚠️ Could not calculate allocation for period ${period}:`, err.message);
        }
      }

      return {
        currentPeriod: Number(currentPeriod),
        pendingCount: pendingPeriods.length,
        allocations: pendingPeriods,
        totalPending: pendingPeriods.reduce((sum, p) => sum + parseFloat(p.amount), 0).toFixed(8)
      };
    } catch (error) {
      console.error('❌ getPendingAllocations error:', error);
      return {
        currentPeriod: 0,
        pendingCount: 0,
        allocations: [],
        totalPending: '0'
      };
    }
  }

  async getFundStats() {
    try {
      const fundContract = this.contractProvider.getContract('RealEstateAcquisitionFund');
      const currentPeriod = await fundContract.currentDistributionPeriod();
      
      const provider = this.contractProvider.getProvider();
      const fundAddress = this.contractProvider.getAddress('RealEstateAcquisitionFund');
      const balance = await provider.getBalance(fundAddress);

      const dbStats = await db.select()
        .from(keygrowRenters)
        .where(eq(keygrowRenters.active, true));

      return {
        fundBalance: this.contractProvider.formatEther(balance),
        currentPeriod: Number(currentPeriod),
        activeRenters: dbStats.length,
        fundAddress
      };
    } catch (error) {
      console.error('❌ getFundStats error:', error);
      return {
        fundBalance: '0',
        currentPeriod: 0,
        activeRenters: 0,
        fundAddress: this.contractProvider.getAddress('RealEstateAcquisitionFund')
      };
    }
  }

  async getProperties(walletAddress) {
    try {
      const properties = await db.select()
        .from(keygrowProperties)
        .where(eq(keygrowProperties.renterId, 
          (await db.select().from(keygrowRenters).where(eq(keygrowRenters.walletAddress, walletAddress.toLowerCase())).limit(1))[0]?.id
        ))
        .orderBy(desc(keygrowProperties.createdAt));

      return properties;
    } catch (error) {
      console.error('❌ getProperties error:', error);
      throw error;
    }
  }

  tierToString(tierNumber) {
    const tiers = ['None', 'Bronze', 'Silver', 'Gold', 'Platinum'];
    return tiers[Number(tierNumber)] || 'Unknown';
  }

  async registerRenter(walletAddress, tier = 0) {
    try {
      const existing = await db.select()
        .from(keygrowRenters)
        .where(eq(keygrowRenters.walletAddress, walletAddress.toLowerCase()))
        .limit(1);

      if (existing.length > 0) {
        return existing[0];
      }

      const [newRenter] = await db.insert(keygrowRenters)
        .values({
          walletAddress: walletAddress.toLowerCase(),
          tier: this.tierToString(tier),
          active: true,
          totalAllocated: '0',
          totalClaimed: '0',
          lastClaimPeriod: 0
        })
        .returning();

      return newRenter;
    } catch (error) {
      console.error('❌ registerRenter error:', error);
      throw error;
    }
  }

  async buildRegisterRenterTx(walletAddress, tier) {
    try {
      return this.contractProvider.buildTransactionData(
        'RealEstateAcquisitionFund',
        'registerAsRenter',
        []
      );
    } catch (error) {
      console.error('❌ buildRegisterRenterTx error:', error);
      throw error;
    }
  }

  async buildClaimAllocationTx(walletAddress) {
    try {
      const fundContract = this.contractProvider.getContract('RealEstateAcquisitionFund');
      const currentPeriod = await fundContract.currentDistributionPeriod();
      
      return this.contractProvider.buildTransactionData(
        'RealEstateAcquisitionFund',
        'claimAllocation',
        [Number(currentPeriod)]
      );
    } catch (error) {
      console.error('❌ buildClaimAllocationTx error:', error);
      throw error;
    }
  }

  async recordClaim(walletAddress, period, amount, txHash) {
    try {
      const { sql } = require('drizzle-orm');
      const [allocation] = await db.insert(keygrowAllocations)
        .values({
          walletAddress: walletAddress.toLowerCase(),
          period: period.toString(),
          amount: amount.toString(),
          claimed: true,
          txHash
        })
        .returning();

      await db.update(keygrowRenters)
        .set({
          totalClaimed: sql`CAST(${keygrowRenters.totalClaimed} AS DECIMAL) + ${amount}`,
          updatedAt: new Date()
        })
        .where(eq(keygrowRenters.walletAddress, walletAddress.toLowerCase()));

      return allocation;
    } catch (error) {
      console.error('❌ recordClaim error:', error);
      throw error;
    }
  }

  async buildUpdateTierTx(walletAddress, newTier) {
    try {
      return this.contractProvider.buildTransactionData(
        'RealEstateAcquisitionFund',
        'updateRenterTier',
        [walletAddress, newTier]
      );
    } catch (error) {
      console.error('❌ buildUpdateTierTx error:', error);
      throw error;
    }
  }
}

module.exports = new KeyGrowService();
