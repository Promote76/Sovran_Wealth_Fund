/**
 * Fractional Real Estate Ownership Service
 * Handles fractional property offerings, share purchases, and revenue distributions
 */

const { Pool } = require('pg');
const Decimal = require('decimal.js');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

/**
 * Tier Configuration
 * retail: $500 - $10,000 (max 5% ownership, 0% bonus)
 * accredited: $10,000 - $100,000 (max 15% ownership, 2% bonus)
 * premium: $100,000 - $500,000 (max 25% ownership, 5% bonus)
 * institutional: $500,000+ (max 25% ownership, 8% bonus)
 */

class FractionalOwnershipService {
  /**
   * Create a fractional offering from a deal
   * @param {string} dealId - The deal ID to fractionalize
   * @param {Object} options - Offering configuration
   * @returns {Promise<Object>} Created fractional property
   */
  async createFractionalOffering(dealId, options = {}) {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Get the deal
      const dealResult = await client.query(
        'SELECT * FROM deals WHERE id = $1',
        [dealId]
      );
      
      if (dealResult.rows.length === 0) {
        throw new Error('Deal not found');
      }
      
      const deal = dealResult.rows[0];
      
      // Check if already fractionalized
      const existingResult = await client.query(
        'SELECT id FROM fractional_properties WHERE deal_id = $1',
        [dealId]
      );
      
      if (existingResult.rows.length > 0) {
        throw new Error('Deal is already fractionalized');
      }
      
      // Extract property value from deal
      const propertyValue = deal.parsed?.arv || deal.finance?.arv || deal.analysis?.marketValue || 0;
      
      if (!propertyValue || propertyValue <= 0) {
        throw new Error('Property value (ARV) is required');
      }
      
      // Calculate share price and rental income
      const totalShares = options.totalShares || 10000;
      const sharePrice = new Decimal(propertyValue).div(totalShares).toDP(2);
      const monthlyRent = deal.parsed?.monthlyRent || deal.rents?.estimated || 0;
      const monthlyExpenses = options.monthlyExpenses || new Decimal(monthlyRent).mul(0.3).toNumber(); // 30% of rent as default
      const netMonthlyIncome = new Decimal(monthlyRent).minus(monthlyExpenses).toDP(2);
      
      // Insert fractional property
      const result = await client.query(`
        INSERT INTO fractional_properties (
          deal_id, total_shares, share_price, property_value,
          shares_sold, min_investment, max_ownership_percent, lockup_months,
          monthly_rent, monthly_expenses, net_monthly_income,
          reserve_fund_percent, status, funding_deadline, metadata
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
        RETURNING *
      `, [
        dealId,
        totalShares,
        sharePrice.toNumber(),
        propertyValue,
        0, // shares_sold starts at 0
        options.minInvestment || 500,
        options.maxOwnershipPercent || 25,
        options.lockupMonths || 6,
        monthlyRent,
        monthlyExpenses,
        netMonthlyIncome.toNumber(),
        options.reserveFundPercent || 10,
        'active',
        options.fundingDeadline || null,
        JSON.stringify(options.metadata || {})
      ]);
      
      await client.query('COMMIT');
      
      console.log(`✅ Created fractional offering for deal ${dealId}: ${totalShares} shares @ $${sharePrice}`);
      
      return result.rows[0];
      
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('❌ Error creating fractional offering:', error);
      throw error;
    } finally {
      client.release();
    }
  }
  
  /**
   * Get all active fractional properties
   * @param {Object} filters - Filter options
   * @returns {Promise<Array>} List of fractional properties with deal data
   */
  async getFractionalProperties(filters = {}) {
    const client = await pool.connect();
    
    try {
      let query = `
        SELECT 
          fp.*,
          (fp.total_shares - fp.shares_sold) as shares_available,
          d.parsed as deal_parsed,
          d.geocode as deal_geocode,
          d.facts as deal_facts,
          d.media as deal_media,
          d.status as deal_status
        FROM fractional_properties fp
        JOIN deals d ON fp.deal_id = d.id
        WHERE fp.status = 'active'
      `;
      
      const params = [];
      let paramCount = 1;
      
      // Add filters
      if (filters.minInvestment) {
        query += ` AND fp.min_investment <= $${paramCount}`;
        params.push(filters.minInvestment);
        paramCount++;
      }
      
      if (filters.minYield) {
        const minMonthlyYield = new Decimal(filters.minYield).div(100).div(12); // Convert annual % to monthly decimal
        query += ` AND (fp.net_monthly_income / fp.property_value) >= $${paramCount}`;
        params.push(minMonthlyYield.toNumber());
        paramCount++;
      }
      
      if (filters.available === true) {
        query += ` AND fp.shares_sold < fp.total_shares`;
      }
      
      query += ' ORDER BY fp.created_at DESC';
      
      if (filters.limit) {
        query += ` LIMIT $${paramCount}`;
        params.push(filters.limit);
        paramCount++;
      }
      
      const result = await client.query(query, params);
      
      return result.rows.map(row => this.formatFractionalProperty(row));
      
    } finally {
      client.release();
    }
  }
  
  /**
   * Get a single fractional property by ID
   * @param {number} propertyId - Fractional property ID
   * @returns {Promise<Object>} Fractional property with deal data
   */
  async getFractionalProperty(propertyId) {
    const client = await pool.connect();
    
    try {
      const result = await client.query(`
        SELECT 
          fp.*,
          (fp.total_shares - fp.shares_sold) as shares_available,
          d.parsed as deal_parsed,
          d.geocode as deal_geocode,
          d.facts as deal_facts,
          d.finance as deal_finance,
          d.rents as deal_rents,
          d.repairs as deal_repairs,
          d.analysis as deal_analysis,
          d.media as deal_media,
          d.status as deal_status
        FROM fractional_properties fp
        JOIN deals d ON fp.deal_id = d.id
        WHERE fp.id = $1
      `, [propertyId]);
      
      if (result.rows.length === 0) {
        throw new Error('Fractional property not found');
      }
      
      return this.formatFractionalProperty(result.rows[0]);
      
    } finally {
      client.release();
    }
  }
  
  /**
   * Calculate investment tier and details for an amount
   * @param {number} investmentAmount - Investment amount in USD
   * @param {number} sharePrice - Price per share
   * @param {number} totalShares - Total shares for the property (default 10000)
   * @returns {Promise<Object>} Tier details and share calculation
   */
  async calculateInvestmentTier(investmentAmount, sharePrice, totalShares = 10000) {
    const client = await pool.connect();
    
    try {
      const amount = new Decimal(investmentAmount);
      
      // Get all active tiers
      const tiersResult = await client.query(`
        SELECT * FROM investor_tiers
        WHERE is_active = true
        ORDER BY min_investment
      `);
      
      const tiers = tiersResult.rows;
      
      // Find the appropriate tier
      let selectedTier = null;
      for (const tier of tiers) {
        const minInv = new Decimal(tier.min_investment);
        const maxInv = tier.max_investment ? new Decimal(tier.max_investment) : null;
        
        if (amount.gte(minInv) && (maxInv === null || amount.lte(maxInv))) {
          selectedTier = tier;
          break;
        }
      }
      
      if (!selectedTier) {
        throw new Error(`Investment amount $${amount} does not match any tier`);
      }
      
      // Calculate shares
      const sharesAmount = amount.div(sharePrice).toDP(0, Decimal.ROUND_DOWN);
      const actualInvestment = sharesAmount.mul(sharePrice);
      const ownershipPercent = sharesAmount.div(totalShares).mul(100).toDP(2);
      
      return {
        tier: selectedTier.tier_name,
        tierDetails: {
          name: selectedTier.tier_name,
          minInvestment: selectedTier.min_investment,
          maxInvestment: selectedTier.max_investment,
          maxOwnership: selectedTier.max_ownership_percent,
          revenueBonus: selectedTier.revenue_share_bonus,
          benefits: selectedTier.benefits
        },
        requestedAmount: amount.toNumber(),
        actualInvestment: actualInvestment.toNumber(),
        sharesAmount: sharesAmount.toNumber(),
        pricePerShare: sharePrice,
        ownershipPercent: ownershipPercent.toNumber()
      };
      
    } finally {
      client.release();
    }
  }
  
  /**
   * Purchase shares in a fractional property
   * @param {Object} purchaseData - Purchase details
   * @returns {Promise<Object>} Share record and transaction
   */
  async purchaseShares(purchaseData) {
    const {
      propertyId,
      investorId,
      walletAddress,
      investmentAmount,
      paymentMethod,
      stripePaymentId,
      txHash
    } = purchaseData;
    
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Get property details
      const propResult = await client.query(
        'SELECT * FROM fractional_properties WHERE id = $1 FOR UPDATE',
        [propertyId]
      );
      
      if (propResult.rows.length === 0) {
        throw new Error('Fractional property not found');
      }
      
      const property = propResult.rows[0];
      
      // Check if shares are available
      if (property.shares_sold >= property.total_shares) {
        throw new Error('No shares available for this property');
      }
      
      // Check minimum investment for this property
      if (investmentAmount < parseFloat(property.min_investment)) {
        throw new Error(`Investment amount must be at least $${property.min_investment}`);
      }
      
      // Calculate investment details
      const tierCalc = await this.calculateInvestmentTier(
        investmentAmount,
        property.share_price,
        property.total_shares
      );
      
      // Check if enough shares available
      const availableShares = property.total_shares - property.shares_sold;
      if (tierCalc.sharesAmount > availableShares) {
        throw new Error(`Only ${availableShares} shares available, requested ${tierCalc.sharesAmount}`);
      }
      
      // Calculate lockup end date
      const lockupEndsAt = new Date();
      lockupEndsAt.setMonth(lockupEndsAt.getMonth() + property.lockup_months);
      
      // Check if investor already has shares (for cumulative ownership check)
      const existingSharesResult = await client.query(
        `SELECT id, shares_owned, ownership_percent, total_invested, purchase_price
         FROM investor_shares 
         WHERE property_id = $1 AND wallet_address = $2 AND status = 'active'`,
        [propertyId, walletAddress]
      );
      
      let shareRecord;
      
      if (existingSharesResult.rows.length > 0) {
        // Update existing share record
        const existing = existingSharesResult.rows[0];
        const newSharesOwned = existing.shares_owned + tierCalc.sharesAmount;
        const newOwnershipPercent = new Decimal(newSharesOwned).div(property.total_shares).mul(100).toDP(2);
        // Preserve existing total_invested and add new investment
        const existingTotalInvested = parseFloat(existing.total_invested) || 0;
        const newTotalInvested = new Decimal(existingTotalInvested).plus(tierCalc.actualInvestment).toNumber();
        
        const updateResult = await client.query(`
          UPDATE investor_shares
          SET shares_owned = $1,
              ownership_percent = $2,
              total_invested = $3,
              tier = $4,
              updated_at = NOW()
          WHERE id = $5
          RETURNING *
        `, [newSharesOwned, newOwnershipPercent.toNumber(), newTotalInvested, tierCalc.tier, existing.id]);
        
        shareRecord = updateResult.rows[0];
      } else {
        // Create new share record (trigger will validate max ownership)
        const insertResult = await client.query(`
          INSERT INTO investor_shares (
            property_id, investor_id, wallet_address,
            shares_owned, ownership_percent, purchase_price, total_invested,
            tier, lockup_ends_at, status
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
          RETURNING *
        `, [
          propertyId,
          investorId,
          walletAddress,
          tierCalc.sharesAmount,
          tierCalc.ownershipPercent,
          property.share_price,
          tierCalc.actualInvestment,
          tierCalc.tier,
          lockupEndsAt,
          'active'
        ]);
        
        shareRecord = insertResult.rows[0];
      }
      
      // Record the transaction
      const txResult = await client.query(`
        INSERT INTO share_transactions (
          property_id, from_wallet, to_wallet,
          shares_amount, price_per_share, total_amount,
          transaction_type, payment_method, tier,
          tx_hash, stripe_payment_id, status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        RETURNING *
      `, [
        propertyId,
        null, // from_wallet is null for purchases
        walletAddress,
        tierCalc.sharesAmount,
        property.share_price,
        tierCalc.actualInvestment,
        'purchase',
        paymentMethod,
        tierCalc.tier,
        txHash || null,
        stripePaymentId || null,
        'completed'
      ]);
      
      // Update property shares_sold count
      await client.query(`
        UPDATE fractional_properties
        SET shares_sold = shares_sold + $1,
            fully_funded_at = CASE WHEN shares_sold + $1 >= total_shares THEN NOW() ELSE fully_funded_at END,
            updated_at = NOW()
        WHERE id = $2
      `, [tierCalc.sharesAmount, propertyId]);
      
      await client.query('COMMIT');
      
      console.log(`✅ Purchased ${tierCalc.sharesAmount} shares in property ${propertyId} for ${walletAddress}`);
      
      return {
        shareRecord,
        transaction: txResult.rows[0],
        tierDetails: tierCalc.tierDetails
      };
      
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('❌ Error purchasing shares:', error);
      throw error;
    } finally {
      client.release();
    }
  }
  
  /**
   * Get investor's portfolio (all shares owned)
   * @param {string} walletAddress - Investor wallet address
   * @returns {Promise<Array>} List of shares with property details
   */
  async getInvestorPortfolio(walletAddress) {
    const client = await pool.connect();
    
    try {
      const result = await client.query(`
        SELECT 
          ish.*,
          fp.deal_id,
          fp.total_shares,
          fp.share_price,
          fp.property_value,
          fp.shares_sold,
          (fp.total_shares - fp.shares_sold) as shares_available,
          fp.monthly_rent,
          fp.net_monthly_income,
          fp.status as property_status,
          d.parsed as deal_parsed,
          d.geocode as deal_geocode,
          d.media as deal_media,
          it.revenue_share_bonus
        FROM investor_shares ish
        JOIN fractional_properties fp ON ish.property_id = fp.id
        JOIN deals d ON fp.deal_id = d.id
        LEFT JOIN investor_tiers it ON ish.tier = it.tier_name
        WHERE ish.wallet_address = $1 AND ish.status = 'active'
        ORDER BY ish.created_at DESC
      `, [walletAddress]);
      
      return result.rows.map(row => {
        // Calculate monthly revenue estimate
        const monthlyRevenue = new Decimal(row.net_monthly_income || 0)
          .mul(row.ownership_percent || 0)
          .div(100)
          .toDP(2);
        
        // Apply tier bonus
        const tierBonus = new Decimal(monthlyRevenue)
          .mul(row.revenue_share_bonus || 0)
          .div(100)
          .toDP(2);
        
        const totalMonthlyRevenue = monthlyRevenue.plus(tierBonus);
        
        return {
          shareId: row.id,
          propertyId: row.property_id,
          sharesOwned: row.shares_owned,
          ownershipPercent: row.ownership_percent,
          totalInvested: row.total_invested,
          tier: row.tier,
          tierBonus: row.revenue_share_bonus,
          totalRevenueEarned: row.total_revenue_earned,
          monthlyRevenueEstimate: totalMonthlyRevenue.toNumber(),
          lockupEndsAt: row.lockup_ends_at,
          property: {
            address: row.deal_parsed?.address,
            city: row.deal_parsed?.city,
            state: row.deal_parsed?.state,
            beds: row.deal_parsed?.beds,
            baths: row.deal_parsed?.baths,
            squareFeet: row.deal_parsed?.squareFeet,
            propertyType: row.deal_parsed?.propertyType,
            propertyValue: row.property_value,
            monthlyRent: row.monthly_rent,
            netMonthlyIncome: row.net_monthly_income,
            totalShares: row.total_shares,
            sharesSold: row.shares_sold,
            sharesAvailable: row.shares_available,
            sharePrice: row.share_price,
            status: row.property_status,
            media: row.deal_media
          }
        };
      });
      
    } finally {
      client.release();
    }
  }
  
  /**
   * Get investor's transaction history
   * @param {string} walletAddress - Investor wallet address
   * @returns {Promise<Array>} List of transactions
   */
  async getInvestorTransactions(walletAddress) {
    const client = await pool.connect();
    
    try {
      const result = await client.query(`
        SELECT 
          st.*,
          fp.deal_id,
          d.parsed as deal_parsed
        FROM share_transactions st
        JOIN fractional_properties fp ON st.property_id = fp.id
        JOIN deals d ON fp.deal_id = d.id
        WHERE st.to_wallet = $1 OR st.from_wallet = $1
        ORDER BY st.created_at DESC
      `, [walletAddress]);
      
      return result.rows;
      
    } finally {
      client.release();
    }
  }
  
  /**
   * Format fractional property with calculated fields
   * @private
   */
  formatFractionalProperty(row) {
    const sharesAvailable = row.shares_available || (row.total_shares - row.shares_sold);
    const fundingProgress = new Decimal(row.shares_sold).div(row.total_shares).mul(100).toDP(2);
    
    // Calculate annual yield
    const annualRevenue = new Decimal(row.net_monthly_income || 0).mul(12);
    const annualYield = row.property_value > 0 
      ? annualRevenue.div(row.property_value).mul(100).toDP(2)
      : new Decimal(0);
    
    return {
      id: row.id,
      dealId: row.deal_id,
      totalShares: row.total_shares,
      sharePrice: row.share_price,
      propertyValue: row.property_value,
      sharesSold: row.shares_sold,
      sharesAvailable,
      fundingProgress: fundingProgress.toNumber(),
      minInvestment: row.min_investment,
      maxOwnershipPercent: row.max_ownership_percent,
      lockupMonths: row.lockup_months,
      monthlyRent: row.monthly_rent,
      monthlyExpenses: row.monthly_expenses,
      netMonthlyIncome: row.net_monthly_income,
      annualYield: annualYield.toNumber(),
      reserveFundPercent: row.reserve_fund_percent,
      status: row.status,
      fundingDeadline: row.funding_deadline,
      fullyFundedAt: row.fully_funded_at,
      createdAt: row.created_at,
      deal: {
        address: row.deal_parsed?.address,
        city: row.deal_parsed?.city,
        state: row.deal_parsed?.state,
        zipCode: row.deal_parsed?.zipCode,
        beds: row.deal_parsed?.beds,
        baths: row.deal_parsed?.baths,
        squareFeet: row.deal_parsed?.squareFeet,
        propertyType: row.deal_parsed?.propertyType,
        yearBuilt: row.deal_parsed?.yearBuilt,
        condition: row.deal_parsed?.condition,
        media: row.deal_media,
        geocode: row.deal_geocode,
        facts: row.deal_facts,
        finance: row.deal_finance,
        rents: row.deal_rents,
        repairs: row.deal_repairs,
        analysis: row.deal_analysis,
        status: row.deal_status
      }
    };
  }
}

module.exports = new FractionalOwnershipService();
