/**
 * Feature #4: Automated Revenue & Distribution Engine Service
 * Handles automated revenue distributions and Stripe Connect payouts
 */

const { Pool } = require('pg');
const { v4: uuidv4 } = require('uuid');

class RevenueEngineService {
  constructor() {
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL,
    });
  }

  /**
   * Create distribution policy for a property
   */
  async createDistributionPolicy(propertyId, policyConfig) {
    const client = await this.pool.connect();
    
    try {
      const policyId = uuidv4();
      
      const result = await client.query(
        `INSERT INTO distribution_policies (
          policy_id, policy_name, policy_type, property_id,
          base_allocation_percent, tier_bonus_percent,
          reserve_fund_percent, distribution_frequency,
          auto_distribute
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *`,
        [
          policyId,
          policyConfig.name || 'Default Policy',
          policyConfig.type || 'tiered_bonus',
          propertyId,
          policyConfig.baseAllocation || 80,
          policyConfig.tierBonus || 20,
          policyConfig.reserveFund || 10,
          policyConfig.frequency || 'monthly',
          policyConfig.autoDistribute !== false
        ]
      );
      
      return result.rows[0];
      
    } finally {
      client.release();
    }
  }

  /**
   * Process monthly rental distribution
   */
  async processRentalDistribution(propertyId, totalRevenue, distributionMonth) {
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Get distribution policy
      const policyResult = await client.query(
        `SELECT * FROM distribution_policies WHERE property_id = $1 AND is_active = true LIMIT 1`,
        [propertyId]
      );
      
      if (!policyResult.rows[0]) {
        throw new Error('No active distribution policy found');
      }
      
      const policy = policyResult.rows[0];
      
      // Calculate distributions
      const reserveFund = totalRevenue * (parseFloat(policy.reserve_fund_percent) / 100);
      const distributable = totalRevenue - reserveFund;
      const basePool = distributable * (parseFloat(policy.base_allocation_percent) / 100);
      const tierBonusPool = distributable * (parseFloat(policy.tier_bonus_percent) / 100);
      
      // Get all investors for this property
      const investorsResult = await client.query(
        `SELECT ist.*, it.revenue_share_bonus
         FROM investor_shares ist
         LEFT JOIN investor_tiers it ON ist.tier = it.tier_name
         WHERE ist.property_id = $1 AND ist.status = 'active'`,
        [propertyId]
      );
      
      const investors = investorsResult.rows;
      const totalShares = investors.reduce((sum, inv) => sum + parseInt(inv.shares_owned), 0);
      
      // Calculate payouts
      const payouts = investors.map(investor => {
        const ownership = parseInt(investor.shares_owned) / totalShares;
        const baseAmount = basePool * ownership;
        const tierBonus = tierBonusPool * ownership * (parseFloat(investor.revenue_share_bonus) / 100);
        
        return {
          investorId: investor.investor_id,
          walletAddress: investor.wallet_address,
          sharesOwned: investor.shares_owned,
          tier: investor.tier,
          baseAmount,
          tierBonus,
          totalAmount: baseAmount + tierBonus
        };
      });
      
      // Create payout batch
      const batchId = uuidv4();
      await client.query(
        `INSERT INTO payout_batches (
          batch_id, batch_name, property_id, batch_type,
          total_amount, total_recipients
        ) VALUES ($1, $2, $3, 'rental_distribution', $4, $5)`,
        [
          batchId,
          `${distributionMonth} Rental Distribution`,
          propertyId,
          distributable,
          payouts.length
        ]
      );
      
      // Create individual payout records
      for (const payout of payouts) {
        const payoutId = uuidv4();
        await client.query(
          `INSERT INTO payout_transactions (
            payout_id, batch_id, investor_id, wallet_address,
            amount, tier, base_amount, tier_bonus
          ) VALUES ($1, 
            (SELECT id FROM payout_batches WHERE batch_id = $2),
            $3, $4, $5, $6, $7, $8)`,
          [
            payoutId, batchId, payout.investorId, payout.walletAddress,
            payout.totalAmount, payout.tier, payout.baseAmount, payout.tierBonus
          ]
        );
      }
      
      await client.query('COMMIT');
      
      return {
        success: true,
        batchId,
        totalDistributed: distributable,
        recipientsCount: payouts.length,
        payouts
      };
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Setup Stripe Connect for investor
   * TODO: Integrate with Stripe Connect API
   */
  async setupStripeConnect(investorId, walletAddress) {
    const client = await this.pool.connect();
    
    try {
      const accountId = uuidv4();
      
      // TODO: Call Stripe API to create Connect account
      // const stripeAccount = await stripe.accounts.create({ ... });
      
      const result = await client.query(
        `INSERT INTO stripe_connect_accounts (
          account_id, investor_id, wallet_address,
          stripe_account_id, status
        ) VALUES ($1, $2, $3, $4, 'pending')
        RETURNING *`,
        [accountId, investorId, walletAddress, `acct_${uuidv4().substring(0, 16)}`]
      );
      
      return {
        success: true,
        account: result.rows[0],
        message: 'Stripe Connect setup initiated'
      };
      
    } finally {
      client.release();
    }
  }

  /**
   * Get revenue analytics
   */
  async getRevenueAnalytics(propertyId, startDate, endDate) {
    const client = await this.pool.connect();
    
    try {
      const result = await client.query(
        `SELECT * FROM revenue_analytics
         WHERE property_id = $1
         AND period_start >= $2
         AND period_end <= $3
         ORDER BY period_start DESC`,
        [propertyId, startDate, endDate]
      );
      
      return result.rows;
      
    } finally {
      client.release();
    }
  }
}

module.exports = new RevenueEngineService();
