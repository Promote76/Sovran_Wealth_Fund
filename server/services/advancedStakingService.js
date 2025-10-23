const { getContractProvider } = require('./contractProvider');
const { db } = require('../db');
const { advancedStakes, stakingRewards } = require('../../shared/schema');
const { eq, and, desc, sql } = require('drizzle-orm');

class AdvancedStakingService {
  constructor() {
    this.contractProvider = getContractProvider();
  }

  async getUserStakes(walletAddress) {
    try {
      const stakingContract = this.contractProvider.getContract('AdvancedStaking');
      const stakingStats = await stakingContract.getUserStakingStats(walletAddress);
      
      const dbStakes = await db.select()
        .from(advancedStakes)
        .where(and(
          eq(advancedStakes.walletAddress, walletAddress.toLowerCase()),
          eq(advancedStakes.status, 'active')
        ))
        .orderBy(desc(advancedStakes.stakeStartedAt));

      return {
        totalStaked: this.contractProvider.formatEther(stakingStats.totalStaked || 0n),
        totalRewardsClaimed: this.contractProvider.formatEther(stakingStats.totalRewardsClaimed || 0n),
        stakes: dbStakes
      };
    } catch (error) {
      console.error('❌ getUserStakes error:', error);
      return {
        totalStaked: '0',
        totalRewardsClaimed: '0',
        stakes: []
      };
    }
  }

  async getStakingStats() {
    try {
      const stakingContract = this.contractProvider.getContract('AdvancedStaking');
      const dailyRewardRate = await stakingContract.dailyRewardRate();

      const [dbStats] = await db.select({
        totalStakes: sql`count(*)`,
        totalRewardsEarned: sql`sum(CAST(${advancedStakes.rewardsEarned} AS DECIMAL))`
      })
        .from(advancedStakes)
        .where(eq(advancedStakes.status, 'active'));

      return {
        stakingAddress: this.contractProvider.getAddress('AdvancedStaking'),
        dailyRewardRate: this.contractProvider.formatEther(dailyRewardRate),
        totalActiveStakes: Number(dbStats.totalStakes || 0),
        totalRewardsDistributed: dbStats.totalRewardsEarned ? dbStats.totalRewardsEarned.toString() : '0'
      };
    } catch (error) {
      console.error('❌ getStakingStats error:', error);
      return {
        stakingAddress: this.contractProvider.getAddress('AdvancedStaking'),
        dailyRewardRate: '0',
        totalActiveStakes: 0,
        totalRewardsDistributed: '0'
      };
    }
  }

  async getPendingRewards(walletAddress) {
    try {
      const stakingContract = this.contractProvider.getContract('AdvancedStaking');
      
      const stakes = await db.select()
        .from(advancedStakes)
        .where(and(
          eq(advancedStakes.walletAddress, walletAddress.toLowerCase()),
          eq(advancedStakes.status, 'active')
        ));

      const rewardsData = await Promise.all(stakes.map(async (stake) => {
        try {
          const pending = await stakingContract.calculateRewards(walletAddress, stake.nftTokenId);
          return {
            stakeId: stake.id,
            nftTokenId: stake.nftTokenId,
            pendingRewards: this.contractProvider.formatEther(pending),
            rawPending: pending
          };
        } catch (err) {
          console.warn(`⚠️ Could not calculate rewards for NFT ${stake.nftTokenId}:`, err.message);
          return {
            stakeId: stake.id,
            nftTokenId: stake.nftTokenId,
            pendingRewards: '0',
            rawPending: 0n
          };
        }
      }));

      const totalPending = rewardsData.reduce((sum, r) => sum + r.rawPending, 0n);

      return {
        stakes: rewardsData,
        totalPendingRewards: this.contractProvider.formatEther(totalPending),
        count: rewardsData.length
      };
    } catch (error) {
      console.error('❌ getPendingRewards error:', error);
      throw error;
    }
  }

  async getRewardsHistory(walletAddress, limit = 50) {
    try {
      const stakeIds = await db.select({ id: advancedStakes.id })
        .from(advancedStakes)
        .where(eq(advancedStakes.walletAddress, walletAddress.toLowerCase()));

      const stakeIdList = stakeIds.map(s => s.id);

      if (stakeIdList.length === 0) {
        return [];
      }

      const rewards = await db.select()
        .from(stakingRewards)
        .where(sql`${stakingRewards.stakeId} = ANY(ARRAY[${sql.join(stakeIdList.map(id => sql`${id}`), sql`, `)}])`)
        .orderBy(desc(stakingRewards.createdAt))
        .limit(limit);

      return rewards;
    } catch (error) {
      console.error('❌ getRewardsHistory error:', error);
      throw error;
    }
  }

  async getCurrentAPR() {
    try {
      const stakingContract = this.contractProvider.getContract('AdvancedStaking');
      const rewardRate = await stakingContract.dailyRewardRate();

      return this.contractProvider.formatEther(rewardRate);
    } catch (error) {
      console.error('❌ getCurrentAPR error:', error);
      return '0';
    }
  }

  async buildStakeTx(nftContract, nftTokenId, tier) {
    try {
      return this.contractProvider.buildTransactionData(
        'AdvancedStaking',
        'stakeNFT',
        [nftTokenId, tier]
      );
    } catch (error) {
      console.error('❌ buildStakeTx error:', error);
      throw error;
    }
  }

  async recordStake(walletAddress, nftContract, nftTokenId, tier, txHash) {
    try {
      const [stake] = await db.insert(advancedStakes)
        .values({
          walletAddress: walletAddress.toLowerCase(),
          nftContract: nftContract.toLowerCase(),
          nftTokenId: nftTokenId.toString(),
          tier: tier.toString(),
          status: 'active',
          rewardsEarned: '0',
          txHash
        })
        .returning();

      return stake;
    } catch (error) {
      console.error('❌ recordStake error:', error);
      throw error;
    }
  }

  async buildUnstakeTx(nftTokenId) {
    try {
      return this.contractProvider.buildTransactionData(
        'AdvancedStaking',
        'unstakeNFT',
        [nftTokenId]
      );
    } catch (error) {
      console.error('❌ buildUnstakeTx error:', error);
      throw error;
    }
  }

  async recordUnstake(walletAddress, nftTokenId, txHash) {
    try {
      await db.update(advancedStakes)
        .set({
          status: 'unstaked',
          stakeEndedAt: new Date(),
          updatedAt: new Date()
        })
        .where(and(
          eq(advancedStakes.walletAddress, walletAddress.toLowerCase()),
          eq(advancedStakes.nftTokenId, nftTokenId.toString()),
          eq(advancedStakes.status, 'active')
        ));

      return { success: true, txHash };
    } catch (error) {
      console.error('❌ recordUnstake error:', error);
      throw error;
    }
  }

  async buildClaimRewardsTx(nftTokenId) {
    try {
      return this.contractProvider.buildTransactionData(
        'AdvancedStaking',
        'claimRewards',
        [nftTokenId]
      );
    } catch (error) {
      console.error('❌ buildClaimRewardsTx error:', error);
      throw error;
    }
  }

  async recordRewardClaim(walletAddress, nftTokenId, amount, txHash) {
    try {
      const stake = await db.select()
        .from(advancedStakes)
        .where(and(
          eq(advancedStakes.walletAddress, walletAddress.toLowerCase()),
          eq(advancedStakes.nftTokenId, nftTokenId.toString()),
          eq(advancedStakes.status, 'active')
        ))
        .limit(1);

      if (stake.length === 0) {
        throw new Error('Stake not found');
      }

      const [reward] = await db.insert(stakingRewards)
        .values({
          stakeId: stake[0].id,
          amount: amount.toString(),
          txHash
        })
        .returning();

      await db.update(advancedStakes)
        .set({
          rewardsEarned: sql`CAST(${advancedStakes.rewardsEarned} AS DECIMAL) + ${amount}`,
          updatedAt: new Date()
        })
        .where(eq(advancedStakes.id, stake[0].id));

      return reward;
    } catch (error) {
      console.error('❌ recordRewardClaim error:', error);
      throw error;
    }
  }
}

module.exports = new AdvancedStakingService();
