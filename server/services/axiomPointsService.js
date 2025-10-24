const db = require('../database');

/**
 * Axiom Points Service
 * Manages loyalty points system - earning, redeeming, tracking
 */

class AxiomPointsService {
  constructor() {
    this.EARNING_RATES = {
      // Investment activity
      REAL_ESTATE_INVEST: 1,      // 1 point per $1 invested
      STAKING: 1.5,                // 1.5 points per $1 staked
      TRADING: 0.5,                // 0.5 points per $1 traded
      LIQUIDITY_PROVIDE: 1.5,      // 1.5 points per $1 LP
      
      // Engagement activity
      REFERRAL: 500,               // 500 points per referral (when they invest $100+)
      MONTHLY_STREAK: 100,         // 100 points for monthly investment streak
      COURSE_COMPLETE: 250,        // 250 points per educational course
      KEYGROW_ENROLL: 1000,        // 1,000 points for KeyGrow enrollment
      REVIEW_WRITE: 200,           // 200 points for platform review
      SOCIAL_SHARE: 50,            // 50 points for social media share
      
      // Milestones
      FIRST_INVESTMENT: 1000,      // 1,000 bonus points for first investment
      PORTFOLIO_DIVERSIFY: 500,    // 500 points for investing in 3+ types
      WHALE_STATUS: 5000           // 5,000 points for reaching $100K+ TVL
    };
    
    this.REDEMPTION_CATALOG = {
      FEE_CREDIT: { cost: 100, value: 1, description: '$1 fee credit' },
      APR_BOOST_30D: { cost: 500, value: 0.05, description: '+5% APR boost for 30 days' },
      TIER_UPGRADE_30D: { cost: 2000, value: 'tier', description: 'Next tier benefits for 30 days' },
      INSURANCE_UPGRADE: { cost: 1000, value: 5000, description: '+$5K insurance coverage' },
      PREMIUM_ANALYTICS_1M: { cost: 750, value: 29, description: 'Premium Analytics for 1 month' },
      TAX_CONSULT_30MIN: { cost: 1500, value: 150, description: '30-min tax consultation' },
      LEGAL_REVIEW: { cost: 2500, value: 250, description: 'Legal document review' },
      GOVERNANCE_PROPOSAL: { cost: 5000, value: 500, description: 'Waive governance proposal fee' },
      NFT_MINT_PASS: { cost: 3000, value: null, description: 'Exclusive NFT mint pass' },
      PLATFORM_SWAG: { cost: 500, value: null, description: 'Axiom Prime swag pack' }
    };
  }

  /**
   * Award points to user
   * @param {string} userAddress - User's wallet address
   * @param {string} activityType - Type of activity (from EARNING_RATES)
   * @param {number} amount - Amount in USD (if applicable)
   * @param {object} metadata - Additional context
   */
  async awardPoints(userAddress, activityType, amount = 1, metadata = {}) {
    try {
      const rate = this.EARNING_RATES[activityType];
      if (!rate) {
        throw new Error(`Unknown activity type: ${activityType}`);
      }

      const points = Math.floor(rate * amount);
      
      // Record the transaction
      const query = `
        INSERT INTO axiom_points_transactions 
        (user_address, activity_type, points_earned, amount_usd, metadata, created_at)
        VALUES ($1, $2, $3, $4, $5, NOW())
        RETURNING *
      `;
      
      const result = await db.query(query, [
        userAddress.toLowerCase(),
        activityType,
        points,
        amount,
        JSON.stringify(metadata)
      ]);

      // Update user's total points balance
      await this.updateUserBalance(userAddress, points);

      console.log(`✅ Awarded ${points} points to ${userAddress} for ${activityType}`);
      
      return {
        success: true,
        points,
        activityType,
        transaction: result.rows[0]
      };
    } catch (error) {
      console.error('❌ Award points error:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Update user's total points balance
   */
  async updateUserBalance(userAddress, pointsChange) {
    const query = `
      INSERT INTO axiom_points_balances (user_address, total_points, available_points, updated_at)
      VALUES ($1, $2, $2, NOW())
      ON CONFLICT (user_address) 
      DO UPDATE SET 
        total_points = axiom_points_balances.total_points + $2,
        available_points = axiom_points_balances.available_points + $2,
        updated_at = NOW()
      RETURNING *
    `;
    
    const result = await db.query(query, [userAddress.toLowerCase(), pointsChange]);
    return result.rows[0];
  }

  /**
   * Get user's points balance
   */
  async getBalance(userAddress) {
    const query = `
      SELECT * FROM axiom_points_balances 
      WHERE user_address = $1
    `;
    
    const result = await db.query(query, [userAddress.toLowerCase()]);
    
    if (result.rows.length === 0) {
      return {
        user_address: userAddress.toLowerCase(),
        total_points: 0,
        available_points: 0,
        lifetime_earned: 0,
        lifetime_redeemed: 0
      };
    }
    
    return result.rows[0];
  }

  /**
   * Get user's points transaction history
   */
  async getHistory(userAddress, limit = 50) {
    const query = `
      SELECT * FROM axiom_points_transactions 
      WHERE user_address = $1 
      ORDER BY created_at DESC 
      LIMIT $2
    `;
    
    const result = await db.query(query, [userAddress.toLowerCase(), limit]);
    return result.rows;
  }

  /**
   * Redeem points for rewards
   */
  async redeemPoints(userAddress, rewardType, quantity = 1) {
    try {
      const reward = this.REDEMPTION_CATALOG[rewardType];
      if (!reward) {
        throw new Error(`Unknown reward type: ${rewardType}`);
      }

      const totalCost = reward.cost * quantity;
      
      // Check if user has enough points
      const balance = await this.getBalance(userAddress);
      if (balance.available_points < totalCost) {
        return {
          success: false,
          error: 'Insufficient points',
          required: totalCost,
          available: balance.available_points
        };
      }

      // Deduct points
      const deductQuery = `
        UPDATE axiom_points_balances 
        SET available_points = available_points - $2,
            updated_at = NOW()
        WHERE user_address = $1
        RETURNING *
      `;
      
      await db.query(deductQuery, [userAddress.toLowerCase(), totalCost]);

      // Record redemption
      const redeemQuery = `
        INSERT INTO axiom_points_redemptions 
        (user_address, reward_type, points_spent, quantity, metadata, created_at, expires_at)
        VALUES ($1, $2, $3, $4, $5, NOW(), NOW() + INTERVAL '30 days')
        RETURNING *
      `;
      
      const redemption = await db.query(redeemQuery, [
        userAddress.toLowerCase(),
        rewardType,
        totalCost,
        quantity,
        JSON.stringify(reward)
      ]);

      console.log(`✅ ${userAddress} redeemed ${totalCost} points for ${rewardType}`);

      return {
        success: true,
        pointsSpent: totalCost,
        reward: reward,
        redemption: redemption.rows[0],
        newBalance: balance.available_points - totalCost
      };
    } catch (error) {
      console.error('❌ Redeem points error:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get user's active rewards/benefits
   */
  async getActiveRewards(userAddress) {
    const query = `
      SELECT * FROM axiom_points_redemptions 
      WHERE user_address = $1 
        AND expires_at > NOW()
        AND used = false
      ORDER BY created_at DESC
    `;
    
    const result = await db.query(query, [userAddress.toLowerCase()]);
    return result.rows;
  }

  /**
   * Check if user has active reward of specific type
   */
  async hasActiveReward(userAddress, rewardType) {
    const query = `
      SELECT * FROM axiom_points_redemptions 
      WHERE user_address = $1 
        AND reward_type = $2
        AND expires_at > NOW()
        AND used = false
      LIMIT 1
    `;
    
    const result = await db.query(query, [userAddress.toLowerCase(), rewardType]);
    return result.rows.length > 0 ? result.rows[0] : null;
  }

  /**
   * Get leaderboard (top points earners)
   */
  async getLeaderboard(limit = 100) {
    const query = `
      SELECT user_address, total_points, available_points
      FROM axiom_points_balances 
      ORDER BY total_points DESC 
      LIMIT $1
    `;
    
    const result = await db.query(query, [limit]);
    return result.rows;
  }

  /**
   * Check and award streak bonus
   */
  async checkMonthlyStreak(userAddress) {
    // Check if user invested this month and last month
    const query = `
      SELECT COUNT(DISTINCT DATE_TRUNC('month', created_at)) as months_active
      FROM axiom_points_transactions
      WHERE user_address = $1
        AND activity_type IN ('REAL_ESTATE_INVEST', 'STAKING', 'TRADING', 'LIQUIDITY_PROVIDE')
        AND created_at >= NOW() - INTERVAL '2 months'
    `;
    
    const result = await db.query(query, [userAddress.toLowerCase()]);
    
    if (result.rows[0].months_active >= 2) {
      // User has monthly streak, award bonus
      await this.awardPoints(userAddress, 'MONTHLY_STREAK', 1, {
        note: 'Monthly investment streak bonus'
      });
      
      return { hasStreak: true, bonus: this.EARNING_RATES.MONTHLY_STREAK };
    }
    
    return { hasStreak: false };
  }

  /**
   * Calculate points multiplier based on active bonuses
   */
  async getEffectiveMultiplier(userAddress) {
    let multiplier = 1.0;
    
    // Check for APR boost (also applies to points earning)
    const aprBoost = await this.hasActiveReward(userAddress, 'APR_BOOST_30D');
    if (aprBoost) {
      multiplier += 0.1; // 10% bonus on points too
    }
    
    // Check for tier upgrade (Platinum tier gets 20% more points)
    const tierUpgrade = await this.hasActiveReward(userAddress, 'TIER_UPGRADE_30D');
    if (tierUpgrade) {
      multiplier += 0.2;
    }
    
    return multiplier;
  }
}

module.exports = AxiomPointsService;
