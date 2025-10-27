/**
 * Feature #4: Automated Revenue & Distribution Engine Service
 * Production-grade revenue distributions with Stripe Connect integration
 */

const { Pool } = require('pg');
const { v4: uuidv4 } = require('uuid');
const stripeAdapter = require('../integrations/stripeConnectAdapter');

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
   * Calculate distribution amounts with tier bonuses
   */
  calculateDistributions(totalRevenue, reserveFundPercent, baseAllocationPercent, tierBonusPercent, investors) {
    if (!investors || investors.length === 0) {
      throw new Error('No investors found for distribution');
    }

    const reserveFund = totalRevenue * (reserveFundPercent / 100);
    const distributable = totalRevenue - reserveFund;
    const basePool = distributable * (baseAllocationPercent / 100);
    const tierBonusPool = distributable * (tierBonusPercent / 100);
    
    const totalShares = investors.reduce((sum, inv) => sum + parseFloat(inv.shares_owned), 0);
    
    if (totalShares === 0) {
      throw new Error('Total shares cannot be zero');
    }
    
    const payouts = investors.map(investor => {
      const ownership = parseFloat(investor.shares_owned) / totalShares;
      const baseAmount = basePool * ownership;
      
      const revenueBonus = parseFloat(investor.revenue_share_bonus || 0);
      const tierBonusAmount = (tierBonusPool * ownership * revenueBonus) / 100;
      
      return {
        investorId: investor.investor_id,
        walletAddress: investor.wallet_address,
        sharesOwned: investor.shares_owned,
        ownershipPercent: (ownership * 100).toFixed(2),
        tier: investor.tier,
        baseAmount: parseFloat(baseAmount.toFixed(2)),
        tierBonus: parseFloat(tierBonusAmount.toFixed(2)),
        totalAmount: parseFloat((baseAmount + tierBonusAmount).toFixed(2))
      };
    });

    return {
      reserveFund: parseFloat(reserveFund.toFixed(2)),
      distributable: parseFloat(distributable.toFixed(2)),
      basePool: parseFloat(basePool.toFixed(2)),
      tierBonusPool: parseFloat(tierBonusPool.toFixed(2)),
      payouts
    };
  }

  /**
   * Process monthly rental distribution
   */
  async processRentalDistribution(propertyId, totalRevenue, distributionMonth) {
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Validate inputs
      if (!propertyId || !totalRevenue || totalRevenue <= 0) {
        throw new Error('Invalid property ID or revenue amount');
      }

      // Get property details
      const propertyResult = await client.query(
        `SELECT * FROM fractional_properties WHERE id = $1`,
        [propertyId]
      );

      if (!propertyResult.rows[0]) {
        throw new Error('Property not found');
      }
      
      // Get distribution policy
      const policyResult = await client.query(
        `SELECT * FROM distribution_policies WHERE property_id = $1 AND is_active = true LIMIT 1`,
        [propertyId]
      );
      
      if (!policyResult.rows[0]) {
        throw new Error('No active distribution policy found');
      }
      
      const policy = policyResult.rows[0];
      
      // Get all investors for this property
      const investorsResult = await client.query(
        `SELECT ist.*, it.revenue_share_bonus
         FROM investor_shares ist
         LEFT JOIN investor_tiers it ON ist.tier = it.tier_name
         WHERE ist.property_id = $1 AND ist.status = 'active'`,
        [propertyId]
      );
      
      if (investorsResult.rows.length === 0) {
        throw new Error('No active investors found for this property');
      }

      // Calculate distributions
      const distribution = this.calculateDistributions(
        totalRevenue,
        parseFloat(policy.reserve_fund_percent),
        parseFloat(policy.base_allocation_percent),
        parseFloat(policy.tier_bonus_percent),
        investorsResult.rows
      );
      
      // Create payout batch
      const batchId = uuidv4();
      const batchResult = await client.query(
        `INSERT INTO payout_batches (
          batch_id, batch_name, distribution_policy_id, property_id,
          batch_type, total_amount, total_recipients, status
        ) VALUES ($1, $2, $3, $4, 'rental_distribution', $5, $6, 'pending')
        RETURNING id`,
        [
          batchId,
          distributionMonth || `Distribution ${new Date().toISOString().split('T')[0]}`,
          policy.id,
          propertyId,
          distribution.distributable,
          distribution.payouts.length
        ]
      );

      const batchDbId = batchResult.rows[0].id;
      
      // Create individual payout records
      for (const payout of distribution.payouts) {
        const payoutId = uuidv4();
        await client.query(
          `INSERT INTO payout_transactions (
            payout_id, batch_id, investor_id, wallet_address,
            amount, tier, base_amount, tier_bonus, currency, status
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'USD', 'pending')`,
          [
            payoutId, batchDbId, payout.investorId, payout.walletAddress,
            payout.totalAmount, payout.tier, payout.baseAmount, payout.tierBonus
          ]
        );
      }

      // Record in unified transaction ledger
      const ledgerId = uuidv4();
      await client.query(
        `INSERT INTO unified_transaction_ledger (
          transaction_id, transaction_type, source, property_id,
          amount, currency, status, metadata
        ) VALUES ($1, 'rental_income', 'property_revenue', $2, $3, 'USD', 'completed', $4)`,
        [ledgerId, propertyId, totalRevenue, JSON.stringify({
          batchId,
          distributionMonth,
          reserveFund: distribution.reserveFund,
          distributed: distribution.distributable
        })]
      );
      
      await client.query('COMMIT');
      
      return {
        success: true,
        batchId,
        totalRevenue,
        reserveFund: distribution.reserveFund,
        totalDistributed: distribution.distributable,
        recipientsCount: distribution.payouts.length,
        payouts: distribution.payouts
      };
      
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Distribution processing error:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Execute payouts via Stripe Connect
   */
  async executeStripePayout(batchId) {
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');

      // Get batch details
      const batchResult = await client.query(
        `SELECT * FROM payout_batches WHERE batch_id = $1`,
        [batchId]
      );

      if (!batchResult.rows[0]) {
        throw new Error('Payout batch not found');
      }

      const batch = batchResult.rows[0];

      if (batch.status !== 'pending') {
        throw new Error(`Batch already ${batch.status}`);
      }

      // Update batch status to processing
      await client.query(
        `UPDATE payout_batches SET status = 'processing', initiated_at = NOW() WHERE batch_id = $1`,
        [batchId]
      );

      // Get all pending payout transactions
      const payoutsResult = await client.query(
        `SELECT pt.*, sca.stripe_account_id
         FROM payout_transactions pt
         LEFT JOIN stripe_connect_accounts sca ON pt.investor_id = sca.investor_id
         WHERE pt.batch_id = $1 AND pt.status = 'pending'`,
        [batch.id]
      );

      const payouts = payoutsResult.rows;
      let successCount = 0;
      let failCount = 0;

      // Process each payout
      for (const payout of payouts) {
        if (!payout.stripe_account_id) {
          // No Stripe account - mark as failed
          await client.query(
            `UPDATE payout_transactions 
             SET status = 'failed', 
                 failure_reason = 'No Stripe Connect account linked',
                 failed_at = NOW()
             WHERE id = $1`,
            [payout.id]
          );
          failCount++;
          continue;
        }

        // Check if account can receive payouts
        const canReceive = await stripeAdapter.canReceivePayouts(payout.stripe_account_id);
        
        if (!canReceive) {
          await client.query(
            `UPDATE payout_transactions 
             SET status = 'failed', 
                 failure_reason = 'Stripe account not ready for payouts',
                 failed_at = NOW()
             WHERE id = $1`,
            [payout.id]
          );
          failCount++;
          continue;
        }

        // Execute Stripe transfer
        const transferResult = await stripeAdapter.createPayout(
          payout.stripe_account_id,
          parseFloat(payout.amount),
          'usd',
          {
            payoutId: payout.payout_id,
            batchId,
            tier: payout.tier
          }
        );

        if (transferResult.success) {
          await client.query(
            `UPDATE payout_transactions 
             SET status = 'completed',
                 stripe_transfer_id = $1,
                 completed_at = NOW()
             WHERE id = $2`,
            [transferResult.transferId, payout.id]
          );
          successCount++;
        } else {
          await client.query(
            `UPDATE payout_transactions 
             SET status = 'failed',
                 failure_reason = $1,
                 retry_count = retry_count + 1,
                 failed_at = NOW()
             WHERE id = $2`,
            [transferResult.error, payout.id]
          );
          failCount++;
        }
      }

      // Update batch status
      const finalStatus = failCount === 0 ? 'completed' : 
                          successCount === 0 ? 'failed' : 'partially_completed';

      await client.query(
        `UPDATE payout_batches 
         SET status = $1,
             completed_recipients = $2,
             failed_recipients = $3,
             completed_at = NOW()
         WHERE id = $4`,
        [finalStatus, successCount, failCount, batch.id]
      );

      await client.query('COMMIT');

      return {
        success: true,
        batchId,
        status: finalStatus,
        totalPayouts: payouts.length,
        successful: successCount,
        failed: failCount
      };

    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Stripe payout execution error:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Setup Stripe Connect for investor
   */
  async setupStripeConnect(investorId, email, firstName, lastName) {
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');

      // Check if account already exists
      const existingResult = await client.query(
        `SELECT * FROM stripe_connect_accounts WHERE investor_id = $1`,
        [investorId]
      );

      if (existingResult.rows[0]) {
        return {
          success: false,
          error: 'Stripe Connect account already exists for this investor'
        };
      }

      // Create Stripe Connect account
      const stripeResult = await stripeAdapter.createConnectAccount(
        email,
        firstName,
        lastName
      );

      if (!stripeResult.success) {
        throw new Error(`Stripe account creation failed: ${stripeResult.error}`);
      }

      // Store in database
      const accountId = uuidv4();
      const result = await client.query(
        `INSERT INTO stripe_connect_accounts (
          account_id, investor_id, stripe_account_id, status,
          charges_enabled, payouts_enabled, onboarding_completed
        ) VALUES ($1, $2, $3, 'pending', false, false, false)
        RETURNING *`,
        [accountId, investorId, stripeResult.stripeAccountId]
      );

      await client.query('COMMIT');

      return {
        success: true,
        account: result.rows[0],
        stripeAccountId: stripeResult.stripeAccountId
      };
      
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Stripe Connect setup error:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Create onboarding link for Stripe Connect
   */
  async createOnboardingLink(investorId, refreshUrl, returnUrl) {
    const client = await this.pool.connect();
    
    try {
      const accountResult = await client.query(
        `SELECT * FROM stripe_connect_accounts WHERE investor_id = $1`,
        [investorId]
      );

      if (!accountResult.rows[0]) {
        throw new Error('No Stripe Connect account found for this investor');
      }

      const account = accountResult.rows[0];

      const linkResult = await stripeAdapter.createAccountLink(
        account.stripe_account_id,
        refreshUrl,
        returnUrl
      );

      if (!linkResult.success) {
        throw new Error(`Failed to create onboarding link: ${linkResult.error}`);
      }

      // Update onboarding URL in database
      await client.query(
        `UPDATE stripe_connect_accounts 
         SET onboarding_url = $1, updated_at = NOW()
         WHERE investor_id = $2`,
        [linkResult.url, investorId]
      );

      return {
        success: true,
        url: linkResult.url,
        expiresAt: linkResult.expiresAt
      };

    } finally {
      client.release();
    }
  }

  /**
   * Update Stripe Connect account status
   */
  async updateStripeAccountStatus(investorId) {
    const client = await this.pool.connect();
    
    try {
      const accountResult = await client.query(
        `SELECT * FROM stripe_connect_accounts WHERE investor_id = $1`,
        [investorId]
      );

      if (!accountResult.rows[0]) {
        throw new Error('No Stripe Connect account found');
      }

      const account = accountResult.rows[0];

      const statusResult = await stripeAdapter.getAccountStatus(account.stripe_account_id);

      if (!statusResult.success) {
        throw new Error(`Failed to get account status: ${statusResult.error}`);
      }

      const stripeAccount = statusResult.account;

      // Update database
      await client.query(
        `UPDATE stripe_connect_accounts 
         SET charges_enabled = $1,
             payouts_enabled = $2,
             onboarding_completed = $3,
             status = $4,
             requirements = $5,
             last_verified_at = NOW(),
             updated_at = NOW()
         WHERE investor_id = $6`,
        [
          stripeAccount.chargesEnabled,
          stripeAccount.payoutsEnabled,
          stripeAccount.detailsSubmitted,
          stripeAccount.payoutsEnabled ? 'active' : 'pending',
          JSON.stringify(stripeAccount.requirements),
          investorId
        ]
      );

      return {
        success: true,
        account: stripeAccount
      };

    } finally {
      client.release();
    }
  }

  /**
   * Get revenue analytics for a property
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

  /**
   * Get payout history for investor
   */
  async getInvestorPayouts(investorId, limit = 20) {
    const client = await this.pool.connect();
    
    try {
      const result = await client.query(
        `SELECT pt.*, pb.batch_name, pb.property_id, fp.deal_id
         FROM payout_transactions pt
         LEFT JOIN payout_batches pb ON pt.batch_id = pb.id
         LEFT JOIN fractional_properties fp ON pb.property_id = fp.id
         WHERE pt.investor_id = $1
         ORDER BY pt.created_at DESC
         LIMIT $2`,
        [investorId, limit]
      );
      
      return result.rows;
      
    } finally {
      client.release();
    }
  }

  /**
   * Get all payout batches
   */
  async getAllPayoutBatches(status = null, limit = 50) {
    const client = await this.pool.connect();
    
    try {
      let query = `
        SELECT pb.*, fp.deal_id, COUNT(pt.id) as transaction_count
        FROM payout_batches pb
        LEFT JOIN fractional_properties fp ON pb.property_id = fp.id
        LEFT JOIN payout_transactions pt ON pt.batch_id = pb.id
      `;

      const params = [];
      if (status) {
        query += ` WHERE pb.status = $1`;
        params.push(status);
      }

      query += ` GROUP BY pb.id, fp.deal_id ORDER BY pb.initiated_at DESC LIMIT ${status ? '$2' : '$1'}`;
      params.push(limit);

      const result = await client.query(query, params);
      
      return result.rows;
      
    } finally {
      client.release();
    }
  }
}

module.exports = new RevenueEngineService();
