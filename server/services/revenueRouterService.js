const { getContractProvider } = require('./contractProvider');
const { db } = require('../db');
const { revenueDistributions } = require('../../shared/schema');
const { desc, sql, eq } = require('drizzle-orm');

class RevenueRouterService {
  constructor() {
    this.contractProvider = getContractProvider();
  }

  async getRouterStats() {
    try {
      const routerContract = this.contractProvider.getContract('AXIOMRevenueRouter');
      
      const [treasuryAddress, keygrowAddress, realEstateAllocation, totalBNBDistributed] = await Promise.all([
        routerContract.treasury(),
        routerContract.realEstateAcquisitionFund(),
        routerContract.realEstateAllocation(),
        routerContract.totalBNBDistributed()
      ]);

      const [dbStats] = await db.select({
        totalDistributions: sql`count(*)`,
        totalRevenue: sql`sum(CAST(${revenueDistributions.totalAmount} AS DECIMAL))`,
        totalTreasury: sql`sum(CAST(${revenueDistributions.treasuryAmount} AS DECIMAL))`,
        totalKeygrow: sql`sum(CAST(${revenueDistributions.keygrowAmount} AS DECIMAL))`
      })
        .from(revenueDistributions);

      const keygrowPercentage = Number(realEstateAllocation) / 100;
      const treasuryPercentage = 10000 - Number(realEstateAllocation);

      return {
        routerAddress: this.contractProvider.getAddress('AXIOMRevenueRouter'),
        treasuryAddress,
        keygrowAddress,
        treasurySharePercentage: treasuryPercentage / 100,
        keygrowSharePercentage: keygrowPercentage,
        totalBNBDistributed: this.contractProvider.formatEther(totalBNBDistributed),
        stats: {
          totalDistributions: Number(dbStats.totalDistributions || 0),
          totalRevenue: dbStats.totalRevenue ? dbStats.totalRevenue.toString() : '0',
          totalToTreasury: dbStats.totalTreasury ? dbStats.totalTreasury.toString() : '0',
          totalToKeygrow: dbStats.totalKeygrow ? dbStats.totalKeygrow.toString() : '0'
        }
      };
    } catch (error) {
      console.error('❌ getRouterStats error:', error);
      return {
        routerAddress: this.contractProvider.getAddress('AXIOMRevenueRouter'),
        treasuryAddress: '',
        keygrowAddress: '',
        treasurySharePercentage: 80,
        keygrowSharePercentage: 20,
        totalBNBDistributed: '0',
        stats: {
          totalDistributions: 0,
          totalRevenue: '0',
          totalToTreasury: '0',
          totalToKeygrow: '0'
        }
      };
    }
  }

  async getDistributionHistory(limit = 50, offset = 0) {
    try {
      const distributions = await db.select()
        .from(revenueDistributions)
        .orderBy(desc(revenueDistributions.createdAt))
        .limit(limit)
        .offset(offset);

      return distributions;
    } catch (error) {
      console.error('❌ getDistributionHistory error:', error);
      throw error;
    }
  }

  async getDistributionsBySource(source) {
    try {
      const distributions = await db.select()
        .from(revenueDistributions)
        .where(eq(revenueDistributions.source, source))
        .orderBy(desc(revenueDistributions.createdAt));

      const [totals] = await db.select({
        count: sql`count(*)`,
        total: sql`sum(CAST(${revenueDistributions.totalAmount} AS DECIMAL))`
      })
        .from(revenueDistributions)
        .where(eq(revenueDistributions.source, source));

      return {
        source,
        distributions,
        summary: {
          count: Number(totals.count || 0),
          totalAmount: totals.total ? totals.total.toString() : '0'
        }
      };
    } catch (error) {
      console.error('❌ getDistributionsBySource error:', error);
      throw error;
    }
  }

  async getRevenueSources() {
    try {
      const sources = await db.select({
        source: revenueDistributions.source,
        count: sql`count(*)`,
        total: sql`sum(CAST(${revenueDistributions.totalAmount} AS DECIMAL))`
      })
        .from(revenueDistributions)
        .groupBy(revenueDistributions.source)
        .orderBy(desc(sql`sum(CAST(${revenueDistributions.totalAmount} AS DECIMAL))`));

      return sources.map(s => ({
        source: s.source,
        distributionCount: Number(s.count),
        totalRevenue: s.total ? s.total.toString() : '0'
      }));
    } catch (error) {
      console.error('❌ getRevenueSources error:', error);
      throw error;
    }
  }

  async recordDistribution(source, totalAmount, txHash) {
    try {
      const routerContract = this.contractProvider.getContract('AXIOMRevenueRouter');
      const realEstateAllocation = await routerContract.realEstateAllocation();
      
      const keygrowPercentage = Number(realEstateAllocation) / 100;
      const treasuryPercentage = (10000 - Number(realEstateAllocation)) / 100;

      const total = parseFloat(totalAmount);
      const treasuryAmount = (total * treasuryPercentage / 100).toFixed(8);
      const keygrowAmount = (total * keygrowPercentage / 100).toFixed(8);

      const [distribution] = await db.insert(revenueDistributions)
        .values({
          source,
          totalAmount: totalAmount.toString(),
          treasuryAmount: treasuryAmount.toString(),
          keygrowAmount: keygrowAmount.toString(),
          txHash
        })
        .returning();

      return distribution;
    } catch (error) {
      console.error('❌ recordDistribution error:', error);
      throw error;
    }
  }
}

module.exports = new RevenueRouterService();
