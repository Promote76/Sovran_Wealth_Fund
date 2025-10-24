const db = require('../database');

/**
 * Referral Service
 * Manages 3-level referral program with commissions and tracking
 */

class ReferralService {
  constructor() {
    this.COMMISSION_RATES = {
      LEVEL_1: 0.10,  // 10% of referred user's fees (direct referral)
      LEVEL_2: 0.05,  // 5% of level 2 fees (referred by your referral)
      LEVEL_3: 0.025  // 2.5% of level 3 fees (3rd generation)
    };
    
    this.REFERRAL_BONUS_POINTS = 500; // Points awarded when referral invests $100+
    this.MIN_INVESTMENT_FOR_BONUS = 100; // USD
  }

  /**
   * Generate unique referral code for user
   */
  generateReferralCode(userAddress) {
    // Create readable code: AXIOM-[first 6 chars of address]-[random 4 chars]
    const addressPart = userAddress.slice(2, 8).toUpperCase();
    const randomPart = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `AXIOM-${addressPart}-${randomPart}`;
  }

  /**
   * Create referral code for new user
   */
  async createReferralCode(userAddress, referredBy = null) {
    try {
      const code = this.generateReferralCode(userAddress);
      
      // Determine referral level
      let level = 1;
      let ancestorChain = [];
      
      if (referredBy) {
        // Get referrer's info to build ancestor chain
        const referrerInfo = await this.getReferralInfo(referredBy);
        
        if (!referrerInfo) {
          // Referrer doesn't have a code yet - create one for them first
          console.log(`⚠️ Referrer ${referredBy} has no code yet, creating...`);
          await this.createReferralCode(referredBy, null);
          // Now fetch their info
          const newReferrerInfo = await this.getReferralInfo(referredBy);
          level = newReferrerInfo.level + 1;
          ancestorChain = [referredBy, ...newReferrerInfo.ancestor_chain].slice(0, 3);
        } else {
          level = referrerInfo.level + 1;
          ancestorChain = [referredBy, ...referrerInfo.ancestor_chain].slice(0, 3); // Max 3 levels
        }
      }
      
      const query = `
        INSERT INTO referral_codes 
        (user_address, referral_code, referred_by, level, ancestor_chain, created_at)
        VALUES ($1, $2, $3, $4, $5, NOW())
        ON CONFLICT (user_address) DO UPDATE SET
          referred_by = EXCLUDED.referred_by,
          ancestor_chain = EXCLUDED.ancestor_chain
        RETURNING *
      `;
      
      const result = await db.query(query, [
        userAddress.toLowerCase(),
        code,
        referredBy ? referredBy.toLowerCase() : null,
        level,
        ancestorChain.map(a => a.toLowerCase())
      ]);

      console.log(`✅ Created referral code ${code} for ${userAddress}`);
      
      return {
        success: true,
        code,
        referralInfo: result.rows[0]
      };
    } catch (error) {
      console.error('❌ Create referral code error:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get user's referral info
   */
  async getReferralInfo(userAddress) {
    const query = `
      SELECT * FROM referral_codes 
      WHERE user_address = $1
    `;
    
    const result = await db.query(query, [userAddress.toLowerCase()]);
    
    if (result.rows.length === 0) {
      return null;
    }
    
    return result.rows[0];
  }

  /**
   * Look up user by referral code
   */
  async getUserByCode(code) {
    const query = `
      SELECT * FROM referral_codes 
      WHERE referral_code = $1
    `;
    
    const result = await db.query(query, [code.toUpperCase()]);
    return result.rows.length > 0 ? result.rows[0] : null;
  }

  /**
   * Get all users referred by this user (Level 1)
   */
  async getDirectReferrals(userAddress) {
    const query = `
      SELECT * FROM referral_codes 
      WHERE referred_by = $1
      ORDER BY created_at DESC
    `;
    
    const result = await db.query(query, [userAddress.toLowerCase()]);
    return result.rows;
  }

  /**
   * Get full referral network (all 3 levels)
   */
  async getReferralNetwork(userAddress) {
    // Level 1: Direct referrals
    const level1 = await this.getDirectReferrals(userAddress);
    
    // Level 2: Referrals of referrals
    let level2 = [];
    for (const ref of level1) {
      const l2 = await this.getDirectReferrals(ref.user_address);
      level2 = [...level2, ...l2];
    }
    
    // Level 3: Third generation
    let level3 = [];
    for (const ref of level2) {
      const l3 = await this.getDirectReferrals(ref.user_address);
      level3 = [...level3, ...l3];
    }
    
    return {
      level1: { count: level1.length, users: level1 },
      level2: { count: level2.length, users: level2 },
      level3: { count: level3.length, users: level3 },
      totalNetwork: level1.length + level2.length + level3.length
    };
  }

  /**
   * Track referral conversion (when referred user makes first investment)
   */
  async trackConversion(userAddress, investmentAmountUSD) {
    try {
      const referralInfo = await this.getReferralInfo(userAddress);
      if (!referralInfo || !referralInfo.referred_by) {
        return { success: false, message: 'No referrer found' };
      }

      // Award bonus points if investment meets threshold
      if (investmentAmountUSD >= this.MIN_INVESTMENT_FOR_BONUS) {
        const AxiomPointsService = require('./axiomPointsService');
        const pointsService = new AxiomPointsService();
        
        await pointsService.awardPoints(
          referralInfo.referred_by,
          'REFERRAL',
          1,
          {
            referred_user: userAddress,
            investment_amount: investmentAmountUSD
          }
        );
      }

      // Record conversion
      const query = `
        INSERT INTO referral_conversions 
        (referrer_address, referred_address, investment_amount_usd, conversion_date)
        VALUES ($1, $2, $3, NOW())
        RETURNING *
      `;
      
      const result = await db.query(query, [
        referralInfo.referred_by,
        userAddress.toLowerCase(),
        investmentAmountUSD
      ]);

      console.log(`✅ Referral conversion: ${userAddress} invested $${investmentAmountUSD}`);
      
      return {
        success: true,
        conversion: result.rows[0]
      };
    } catch (error) {
      console.error('❌ Track conversion error:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Calculate referral commissions when fee is collected
   */
  async calculateCommissions(userAddress, feeAmountUSD, feeType) {
    try {
      const referralInfo = await this.getReferralInfo(userAddress);
      if (!referralInfo || referralInfo.ancestor_chain.length === 0) {
        return { success: true, commissions: [] };
      }

      const commissions = [];
      
      // Level 1: Direct referrer
      if (referralInfo.ancestor_chain[0]) {
        const commission = feeAmountUSD * this.COMMISSION_RATES.LEVEL_1;
        commissions.push({
          beneficiary: referralInfo.ancestor_chain[0],
          level: 1,
          amount: commission,
          rate: this.COMMISSION_RATES.LEVEL_1
        });
        
        await this.recordCommission(
          referralInfo.ancestor_chain[0],
          userAddress,
          1,
          commission,
          feeType
        );
      }
      
      // Level 2: Second generation
      if (referralInfo.ancestor_chain[1]) {
        const commission = feeAmountUSD * this.COMMISSION_RATES.LEVEL_2;
        commissions.push({
          beneficiary: referralInfo.ancestor_chain[1],
          level: 2,
          amount: commission,
          rate: this.COMMISSION_RATES.LEVEL_2
        });
        
        await this.recordCommission(
          referralInfo.ancestor_chain[1],
          userAddress,
          2,
          commission,
          feeType
        );
      }
      
      // Level 3: Third generation
      if (referralInfo.ancestor_chain[2]) {
        const commission = feeAmountUSD * this.COMMISSION_RATES.LEVEL_3;
        commissions.push({
          beneficiary: referralInfo.ancestor_chain[2],
          level: 3,
          amount: commission,
          rate: this.COMMISSION_RATES.LEVEL_3
        });
        
        await this.recordCommission(
          referralInfo.ancestor_chain[2],
          userAddress,
          3,
          commission,
          feeType
        );
      }

      return { success: true, commissions };
    } catch (error) {
      console.error('❌ Calculate commissions error:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Record commission in database
   */
  async recordCommission(beneficiary, payer, level, amountUSD, feeType) {
    const query = `
      INSERT INTO referral_commissions 
      (beneficiary_address, payer_address, level, amount_usd, fee_type, earned_date)
      VALUES ($1, $2, $3, $4, $5, NOW())
      RETURNING *
    `;
    
    const result = await db.query(query, [
      beneficiary.toLowerCase(),
      payer.toLowerCase(),
      level,
      amountUSD,
      feeType
    ]);
    
    return result.rows[0];
  }

  /**
   * Get user's referral earnings
   */
  async getEarnings(userAddress) {
    const query = `
      SELECT 
        level,
        COUNT(*) as transaction_count,
        SUM(amount_usd) as total_earned,
        fee_type
      FROM referral_commissions 
      WHERE beneficiary_address = $1
      GROUP BY level, fee_type
      ORDER BY level
    `;
    
    const result = await db.query(query, [userAddress.toLowerCase()]);
    
    // Calculate total
    const totalQuery = `
      SELECT SUM(amount_usd) as total
      FROM referral_commissions 
      WHERE beneficiary_address = $1
    `;
    
    const totalResult = await db.query(totalQuery, [userAddress.toLowerCase()]);
    
    return {
      breakdown: result.rows,
      totalEarned: totalResult.rows[0].total || 0
    };
  }

  /**
   * Get user's referral stats (for dashboard)
   */
  async getStats(userAddress) {
    const network = await this.getReferralNetwork(userAddress);
    const earnings = await this.getEarnings(userAddress);
    const conversions = await this.getConversions(userAddress);
    
    return {
      referralCode: (await this.getReferralInfo(userAddress))?.referral_code || 'Not created',
      networkSize: network.totalNetwork,
      level1Count: network.level1.count,
      level2Count: network.level2.count,
      level3Count: network.level3.count,
      totalEarnings: earnings.totalEarned,
      conversionCount: conversions.length,
      conversionRate: network.level1.count > 0 
        ? (conversions.length / network.level1.count) * 100 
        : 0
    };
  }

  /**
   * Get user's conversion history
   */
  async getConversions(userAddress) {
    const query = `
      SELECT * FROM referral_conversions 
      WHERE referrer_address = $1
      ORDER BY conversion_date DESC
    `;
    
    const result = await db.query(query, [userAddress.toLowerCase()]);
    return result.rows;
  }
}

module.exports = ReferralService;
