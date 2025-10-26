/**
 * Bridge Service: RealEstateInvestor Smart Contract ↔ Fractional Ownership Backend
 * Syncs blockchain events with database and provides unified interface
 */

const { Pool } = require('pg');
const Decimal = require('decimal.js');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

class RealEstateContractBridge {
  /**
   * Sync a property from smart contract to fractional database
   * Called when a property is listed on the blockchain
   * @param {Object} propertyData - Property data from smart contract event
   */
  async syncPropertyFromBlockchain(propertyData) {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      const {
        propertyId,
        propertyAddress,
        purchasePrice,
        monthlyRent,
        totalShares,
        pricePerShare,
        targetRaise,
        metadataURI,
        contractAddress,
        txHash
      } = propertyData;
      
      // Calculate property value and share price in USD
      // Assuming pricePerShare is in BNB, need to convert to USD
      const propertyValueUSD = new Decimal(purchasePrice).div(1e18); // Convert from wei
      const sharePriceUSD = new Decimal(pricePerShare).div(1e18).mul(400); // Approximate BNB to USD
      
      // Check if property already exists
      const existing = await client.query(
        'SELECT id FROM fractional_properties WHERE contract_address = $1 AND token_id = $2',
        [contractAddress, propertyId.toString()]
      );
      
      if (existing.rows.length > 0) {
        console.log(`Property ${propertyId} already synced from blockchain`);
        await client.query('COMMIT');
        return existing.rows[0];
      }
      
      // Insert fractional property
      const result = await client.query(`
        INSERT INTO fractional_properties (
          total_shares, share_price, property_value,
          shares_sold, min_investment, max_ownership_percent,
          lockup_months, monthly_rent, monthly_expenses, net_monthly_income,
          reserve_fund_percent, contract_address, token_id,
          status, metadata, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, NOW(), NOW())
        RETURNING *
      `, [
        totalShares,
        sharePriceUSD.toNumber(),
        propertyValueUSD.toNumber(),
        0, // shares_sold starts at 0
        500, // default min investment
        25, // default max ownership %
        6, // default lockup months
        new Decimal(monthlyRent).div(1e18).toNumber(),
        0, // monthly expenses to be set later
        new Decimal(monthlyRent).div(1e18).toNumber(), // initial net income = rent
        10, // reserve fund %
        contractAddress,
        propertyId.toString(),
        'active',
        JSON.stringify({ metadataURI, propertyAddress, syncedFromBlockchain: true, txHash })
      ]);
      
      await client.query('COMMIT');
      
      console.log(`✅ Synced property ${propertyId} from blockchain to database`);
      
      return result.rows[0];
      
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('❌ Error syncing property from blockchain:', error);
      throw error;
    } finally {
      client.release();
    }
  }
  
  /**
   * Sync an investment from smart contract to database
   * Called when an investor purchases shares on blockchain
   * @param {Object} investmentData - Investment data from smart contract event
   */
  async syncInvestmentFromBlockchain(investmentData) {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      const {
        investor,
        propertyId,
        amount,
        shares,
        contractAddress,
        txHash
      } = investmentData;
      
      // Find the fractional property
      const propResult = await client.query(
        'SELECT id, total_shares, share_price FROM fractional_properties WHERE contract_address = $1 AND token_id = $2',
        [contractAddress, propertyId.toString()]
      );
      
      if (propResult.rows.length === 0) {
        throw new Error(`Property ${propertyId} not found in database`);
      }
      
      const property = propResult.rows[0];
      
      // Calculate investment details
      const investmentAmountUSD = new Decimal(amount).div(1e18).mul(400); // Convert BNB to USD approx
      const ownershipPercent = new Decimal(shares).div(property.total_shares).mul(100).toDP(2);
      
      // Determine tier based on investment amount
      let tier = 'retail';
      if (investmentAmountUSD.gte(500000)) tier = 'institutional';
      else if (investmentAmountUSD.gte(100000)) tier = 'premium';
      else if (investmentAmountUSD.gte(10000)) tier = 'accredited';
      
      // Calculate lockup end date
      const lockupEndsAt = new Date();
      lockupEndsAt.setMonth(lockupEndsAt.getMonth() + 6); // Default 6 months
      
      // Check if investor already has shares
      const existingResult = await client.query(
        'SELECT id, shares_owned, total_invested FROM investor_shares WHERE property_id = $1 AND wallet_address = $2 AND status = $3',
        [property.id, investor.toLowerCase(), 'active']
      );
      
      if (existingResult.rows.length > 0) {
        // Update existing shares
        const existing = existingResult.rows[0];
        const newSharesOwned = existing.shares_owned + shares;
        const newTotalInvested = new Decimal(existing.total_invested).plus(investmentAmountUSD).toNumber();
        const newOwnershipPercent = new Decimal(newSharesOwned).div(property.total_shares).mul(100).toDP(2);
        
        await client.query(`
          UPDATE investor_shares
          SET shares_owned = $1,
              ownership_percent = $2,
              total_invested = $3,
              tier = $4,
              updated_at = NOW()
          WHERE id = $5
        `, [newSharesOwned, newOwnershipPercent.toNumber(), newTotalInvested, tier, existing.id]);
        
        console.log(`✅ Updated investor ${investor} shares for property ${propertyId}`);
      } else {
        // Create new share record
        await client.query(`
          INSERT INTO investor_shares (
            property_id, wallet_address, shares_owned, ownership_percent,
            purchase_price, total_invested, tier, lockup_ends_at, status,
            metadata, created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())
        `, [
          property.id,
          investor.toLowerCase(),
          shares,
          ownershipPercent.toNumber(),
          property.share_price,
          investmentAmountUSD.toNumber(),
          tier,
          lockupEndsAt,
          'active',
          JSON.stringify({ syncedFromBlockchain: true, txHash })
        ]);
        
        console.log(`✅ Created new investor ${investor} shares for property ${propertyId}`);
      }
      
      // Record transaction
      await client.query(`
        INSERT INTO share_transactions (
          property_id, from_wallet, to_wallet,
          shares_amount, price_per_share, total_amount,
          transaction_type, payment_method, tier,
          tx_hash, status, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW())
      `, [
        property.id,
        null,
        investor.toLowerCase(),
        shares,
        property.share_price,
        investmentAmountUSD.toNumber(),
        'purchase',
        'crypto',
        tier,
        txHash,
        'completed'
      ]);
      
      // Update property shares_sold
      await client.query(`
        UPDATE fractional_properties
        SET shares_sold = shares_sold + $1,
            updated_at = NOW()
        WHERE id = $2
      `, [shares, property.id]);
      
      await client.query('COMMIT');
      
      console.log(`✅ Synced investment from ${investor} for property ${propertyId}`);
      
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('❌ Error syncing investment from blockchain:', error);
      throw error;
    } finally {
      client.release();
    }
  }
  
  /**
   * Sync rental distribution from smart contract to database
   * Called when rental income is distributed on blockchain
   * @param {Object} distributionData - Distribution data from smart contract event
   */
  async syncRentalDistributionFromBlockchain(distributionData) {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      const {
        propertyId,
        amount,
        contractAddress,
        txHash,
        timestamp
      } = distributionData;
      
      // Find the fractional property
      const propResult = await client.query(
        'SELECT id, net_monthly_income, reserve_fund_percent FROM fractional_properties WHERE contract_address = $1 AND token_id = $2',
        [contractAddress, propertyId.toString()]
      );
      
      if (propResult.rows.length === 0) {
        throw new Error(`Property ${propertyId} not found in database`);
      }
      
      const property = propResult.rows[0];
      
      // Convert amount from BNB to USD
      const totalRevenueUSD = new Decimal(amount).div(1e18).mul(400);
      const reserveFund = totalRevenueUSD.mul(property.reserve_fund_percent).div(100);
      const netDistributable = totalRevenueUSD.minus(reserveFund);
      
      // Calculate distribution splits: 80% base, 20% tier bonus pool
      const baseDistribution = netDistributable.mul(0.8);
      const tierBonusPool = netDistributable.mul(0.2);
      
      // Get distribution month (YYYY-MM format)
      const date = new Date(timestamp * 1000);
      const distributionMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      // Insert distribution record
      await client.query(`
        INSERT INTO property_revenue_distributions (
          property_id, distribution_month,
          total_revenue, total_expenses, reserve_fund,
          net_distributable, base_distribution, tier_bonus_pool,
          status, tx_hash, metadata, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW())
      `, [
        property.id,
        distributionMonth,
        totalRevenueUSD.toNumber(),
        0, // expenses tracked separately
        reserveFund.toNumber(),
        netDistributable.toNumber(),
        baseDistribution.toNumber(),
        tierBonusPool.toNumber(),
        'pending',
        txHash,
        JSON.stringify({ syncedFromBlockchain: true, timestamp })
      ]);
      
      await client.query('COMMIT');
      
      console.log(`✅ Synced rental distribution for property ${propertyId}: $${totalRevenueUSD.toFixed(2)}`);
      
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('❌ Error syncing rental distribution from blockchain:', error);
      throw error;
    } finally {
      client.release();
    }
  }
  
  /**
   * Get unified property data (database + blockchain)
   * @param {number} propertyId - Database property ID
   * @returns {Promise<Object>} Combined property data
   */
  async getUnifiedPropertyData(propertyId) {
    const client = await pool.connect();
    
    try {
      const result = await client.query(`
        SELECT 
          fp.*,
          d.parsed as deal_parsed,
          d.geocode as deal_geocode,
          d.media as deal_media,
          d.finance as deal_finance,
          d.analysis as deal_analysis
        FROM fractional_properties fp
        LEFT JOIN deals d ON fp.deal_id = d.id
        WHERE fp.id = $1
      `, [propertyId]);
      
      if (result.rows.length === 0) {
        throw new Error('Property not found');
      }
      
      const property = result.rows[0];
      
      return {
        ...property,
        blockchain: {
          contractAddress: property.contract_address,
          tokenId: property.token_id,
          onChain: !!property.contract_address
        }
      };
      
    } finally {
      client.release();
    }
  }
}

module.exports = new RealEstateContractBridge();
