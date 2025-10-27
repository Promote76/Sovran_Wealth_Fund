/**
 * Liquidity & Redemption Desk Service
 * Handles secondary market trading of fractional property shares
 */

const { Pool } = require('pg');
const { v4: uuidv4 } = require('uuid');

class LiquidityService {
  constructor() {
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL,
    });
  }

  /**
   * Create a sell order for property shares
   */
  async createSellOrder({ walletAddress, propertyId, shares, pricePerShare, expiresIn = 30 }) {
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // 1. Verify investor owns the shares
      const ownershipResult = await client.query(
        `SELECT id, shares_owned, lockup_ends_at, tier, total_invested
         FROM investor_shares 
         WHERE property_id = $1 AND wallet_address = $2 AND status = 'active'`,
        [propertyId, walletAddress]
      );
      
      if (!ownershipResult.rows[0]) {
        throw new Error('No shares found for this property');
      }
      
      const ownership = ownershipResult.rows[0];
      
      if (ownership.shares_owned < shares) {
        throw new Error(`Insufficient shares. You own ${ownership.shares_owned}, tried to sell ${shares}`);
      }
      
      // 2. Check lockup period
      const now = new Date();
      const lockupEnds = new Date(ownership.lockup_ends_at);
      const isLocked = lockupEnds > now;
      
      if (isLocked) {
        const daysRemaining = Math.ceil((lockupEnds - now) / (1000 * 60 * 60 * 24));
        throw new Error(`Shares are locked until ${lockupEnds.toLocaleDateString()}. ${daysRemaining} days remaining.`);
      }
      
      // 3. Check for existing holds
      const holdsResult = await client.query(
        `SELECT * FROM compliance_holds 
         WHERE wallet_address = $1 AND property_id = $2 AND status = 'active'`,
        [walletAddress, propertyId]
      );
      
      if (holdsResult.rows.length > 0) {
        throw new Error('Shares have active compliance holds. Cannot create sell order.');
      }
      
      // 4. Calculate cost basis
      const costBasis = (ownership.total_invested / ownership.shares_owned) * shares;
      
      // 5. Create sell order
      const orderId = uuidv4();
      const totalValue = shares * pricePerShare;
      const expiresAt = new Date(Date.now() + expiresIn * 24 * 60 * 60 * 1000);
      
      const orderResult = await client.query(
        `INSERT INTO liquidity_orders (
          order_id, order_type, property_id, investor_id, wallet_address,
          shares_amount, price_per_share, total_value, lockup_status,
          lockup_ends_at, compliance_checked, expires_at, metadata
        ) VALUES ($1, 'sell', $2, 
          (SELECT id FROM users WHERE wallet_address = $3), 
          $3, $4, $5, $6, 'eligible', $7, true, $8, $9)
        RETURNING *`,
        [
          orderId, propertyId, walletAddress, shares, pricePerShare,
          totalValue, lockupEnds, expiresAt,
          JSON.stringify({ costBasis, tier: ownership.tier })
        ]
      );
      
      // 6. Create compliance hold to prevent double-selling
      await client.query(
        `INSERT INTO compliance_holds (
          hold_id, wallet_address, property_id, share_record_id,
          hold_type, hold_reason, shares_held, can_trade_after,
          metadata
        ) VALUES ($1, $2, $3, $4, 'manual_hold', 
          'Shares reserved for sell order ' || $5, $6, $7, $8)`,
        [
          uuidv4(), walletAddress, propertyId, ownership.id,
          orderId, shares, null,
          JSON.stringify({ orderId, reservedAt: new Date() })
        ]
      );
      
      await client.query('COMMIT');
      
      // 7. Try to match with existing buy orders or treasury
      await this.matchOrder(orderId);
      
      return {
        success: true,
        order: orderResult.rows[0],
        message: 'Sell order created successfully. Matching with buyers...'
      };
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Create a buy order (investor wants to purchase from secondary market)
   */
  async createBuyOrder({ walletAddress, propertyId, shares, maxPricePerShare }) {
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // 1. Check ownership limits (25% max)
      const propertyResult = await client.query(
        `SELECT total_shares, max_ownership_percent FROM fractional_properties WHERE id = $1`,
        [propertyId]
      );
      
      if (!propertyResult.rows[0]) {
        throw new Error('Property not found');
      }
      
      const property = propertyResult.rows[0];
      const maxShares = property.total_shares * (property.max_ownership_percent / 100);
      
      // Check current ownership
      const currentResult = await client.query(
        `SELECT COALESCE(SUM(shares_owned), 0) as current_shares 
         FROM investor_shares 
         WHERE property_id = $1 AND wallet_address = $2 AND status = 'active'`,
        [propertyId, walletAddress]
      );
      
      const currentShares = parseFloat(currentResult.rows[0].current_shares);
      
      if (currentShares + shares > maxShares) {
        throw new Error(`Would exceed ${property.max_ownership_percent}% ownership limit`);
      }
      
      // 2. Create buy order
      const orderId = uuidv4();
      const totalValue = shares * maxPricePerShare;
      
      const orderResult = await client.query(
        `INSERT INTO liquidity_orders (
          order_id, order_type, property_id, investor_id, wallet_address,
          shares_amount, price_per_share, total_value, lockup_status,
          compliance_checked, expires_at
        ) VALUES ($1, 'buy', $2,
          (SELECT id FROM users WHERE wallet_address = $3),
          $3, $4, $5, $6, 'eligible', true,
          NOW() + INTERVAL '30 days')
        RETURNING *`,
        [orderId, propertyId, walletAddress, shares, maxPricePerShare, totalValue]
      );
      
      await client.query('COMMIT');
      
      // 3. Try to match with existing sell orders
      await this.matchOrder(orderId);
      
      return {
        success: true,
        order: orderResult.rows[0],
        message: 'Buy order created. Matching with sellers...'
      };
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Match orders using price-time priority algorithm
   */
  async matchOrder(orderId) {
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Get the order
      const orderResult = await client.query(
        `SELECT * FROM liquidity_orders WHERE order_id = $1`,
        [orderId]
      );
      
      if (!orderResult.rows[0]) {
        throw new Error('Order not found');
      }
      
      const order = orderResult.rows[0];
      
      if (order.order_type === 'sell') {
        // Try to match sell order with buy orders or treasury
        await this.matchSellOrder(client, order);
      } else {
        // Try to match buy order with sell orders
        await this.matchBuyOrder(client, order);
      }
      
      await client.query('COMMIT');
      
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error matching order:', error);
      // Don't throw - matching failures shouldn't block order creation
    } finally {
      client.release();
    }
  }

  /**
   * Match sell order with buyers (price-time priority)
   */
  async matchSellOrder(client, sellOrder) {
    // 1. Find matching buy orders (price >= sell price, ordered by price DESC, time ASC)
    const buyOrdersResult = await client.query(
      `SELECT * FROM liquidity_orders
       WHERE order_type = 'buy' 
         AND property_id = $1
         AND status IN ('open', 'partial')
         AND price_per_share >= $2
         AND compliance_checked = true
       ORDER BY price_per_share DESC, created_at ASC
       LIMIT 10`,
      [sellOrder.property_id, sellOrder.price_per_share]
    );
    
    let remainingShares = sellOrder.shares_amount - sellOrder.shares_filled;
    
    for (const buyOrder of buyOrdersResult.rows) {
      if (remainingShares <= 0) break;
      
      const buyerRemaining = buyOrder.shares_amount - buyOrder.shares_filled;
      const matchShares = Math.min(remainingShares, buyerRemaining);
      
      // Create match
      await this.createMatch(client, {
        sellOrderId: sellOrder.id,
        buyOrderId: buyOrder.id,
        propertyId: sellOrder.property_id,
        sellerWallet: sellOrder.wallet_address,
        buyerWallet: buyOrder.wallet_address,
        shares: matchShares,
        pricePerShare: buyOrder.price_per_share, // Buyer's price (better for seller)
        matchSource: 'investor'
      });
      
      remainingShares -= matchShares;
    }
    
    // 2. If still has remaining shares, check if treasury wants to buy
    if (remainingShares > 0) {
      const treasuryConfig = await this.getTreasuryConfig(client);
      
      if (treasuryConfig.available_cash >= remainingShares * sellOrder.price_per_share) {
        // Treasury can buy the remaining shares
        await this.createMatch(client, {
          sellOrderId: sellOrder.id,
          buyOrderId: null,
          propertyId: sellOrder.property_id,
          sellerWallet: sellOrder.wallet_address,
          buyerWallet: 'treasury',
          shares: remainingShares,
          pricePerShare: sellOrder.price_per_share,
          matchSource: 'treasury'
        });
      }
    }
  }

  /**
   * Match buy order with sellers (price-time priority)
   */
  async matchBuyOrder(client, buyOrder) {
    // Find matching sell orders (price <= buy price, ordered by price ASC, time ASC)
    const sellOrdersResult = await client.query(
      `SELECT * FROM liquidity_orders
       WHERE order_type = 'sell'
         AND property_id = $1
         AND status IN ('open', 'partial')
         AND price_per_share <= $2
         AND compliance_checked = true
       ORDER BY price_per_share ASC, created_at ASC
       LIMIT 10`,
      [buyOrder.property_id, buyOrder.price_per_share]
    );
    
    let remainingShares = buyOrder.shares_amount - buyOrder.shares_filled;
    
    for (const sellOrder of sellOrdersResult.rows) {
      if (remainingShares <= 0) break;
      
      const sellerRemaining = sellOrder.shares_amount - sellOrder.shares_filled;
      const matchShares = Math.min(remainingShares, sellerRemaining);
      
      // Create match
      await this.createMatch(client, {
        sellOrderId: sellOrder.id,
        buyOrderId: buyOrder.id,
        propertyId: buyOrder.property_id,
        sellerWallet: sellOrder.wallet_address,
        buyerWallet: buyOrder.wallet_address,
        shares: matchShares,
        pricePerShare: sellOrder.price_per_share, // Seller's price (better for buyer)
        matchSource: 'investor'
      });
      
      remainingShares -= matchShares;
    }
  }

  /**
   * Create a match between buy and sell orders
   */
  async createMatch(client, { sellOrderId, buyOrderId, propertyId, sellerWallet, buyerWallet, shares, pricePerShare, matchSource }) {
    const matchId = uuidv4();
    const totalAmount = shares * pricePerShare;
    
    // Calculate platform fee (2% of transaction)
    const platformFee = totalAmount * 0.02;
    const sellerReceives = totalAmount - platformFee;
    const buyerPays = totalAmount + platformFee; // Buyer pays the fee
    
    // Get tiers
    const tierResult = await client.query(
      `SELECT tier FROM investor_shares WHERE property_id = $1 AND wallet_address = $2 LIMIT 1`,
      [propertyId, sellerWallet]
    );
    const sellerTier = tierResult.rows[0]?.tier || 'retail';
    
    // Create match record
    const matchResult = await client.query(
      `INSERT INTO order_matches (
        match_id, sell_order_id, buy_order_id, property_id,
        seller_wallet, buyer_wallet, shares_matched, price_per_share,
        total_amount, platform_fee, seller_receives, buyer_pays,
        match_source, status, seller_tier, settlement_method
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, 'pending', $14, 'stripe')
      RETURNING *`,
      [
        matchId, sellOrderId, buyOrderId, propertyId, sellerWallet, buyerWallet,
        shares, pricePerShare, totalAmount, platformFee, sellerReceives, buyerPays,
        matchSource, sellerTier
      ]
    );
    
    // Update sell order filled amount
    await client.query(
      `UPDATE liquidity_orders 
       SET shares_filled = shares_filled + $1,
           status = CASE 
             WHEN shares_filled + $1 >= shares_amount THEN 'filled'
             ELSE 'partial'
           END,
           updated_at = NOW()
       WHERE id = $2`,
      [shares, sellOrderId]
    );
    
    // Update buy order if exists
    if (buyOrderId) {
      await client.query(
        `UPDATE liquidity_orders
         SET shares_filled = shares_filled + $1,
             status = CASE
               WHEN shares_filled + $1 >= shares_amount THEN 'filled'
               ELSE 'partial'
             END,
             updated_at = NOW()
         WHERE id = $2`,
        [shares, buyOrderId]
      );
    }
    
    // Record fee
    await client.query(
      `INSERT INTO fee_ledger (
        fee_id, fee_type, match_id, property_id, payer_wallet,
        fee_amount, fee_percentage, basis_amount, status
      ) VALUES ($1, 'platform_fee', $2, $3, $4, $5, 2.0, $6, 'collected')`,
      [uuidv4(), matchResult.rows[0].id, propertyId, buyerWallet, platformFee, totalAmount]
    );
    
    // If treasury match, update treasury ledger
    if (matchSource === 'treasury') {
      const treasuryConfig = await this.getTreasuryConfig(client);
      
      await client.query(
        `INSERT INTO treasury_ledger (
          transaction_id, property_id, transaction_type, shares_amount,
          price_per_share, cash_amount, cash_balance_before, cash_balance_after,
          shares_balance_change, match_id
        ) VALUES ($1, $2, 'buy_shares', $3, $4, $5, $6, $7, $8, $9)`,
        [
          uuidv4(), propertyId, shares, pricePerShare, -totalAmount,
          treasuryConfig.total_cash_balance,
          treasuryConfig.total_cash_balance - totalAmount,
          shares, matchResult.rows[0].id
        ]
      );
      
      // Update treasury config
      await client.query(
        `UPDATE liquidity_pool_config 
         SET total_cash_balance = total_cash_balance - $1
         WHERE config_name = 'default'`,
        [totalAmount]
      );
    }
    
    return matchResult.rows[0];
  }

  /**
   * Get treasury configuration
   */
  async getTreasuryConfig(client) {
    const result = await client.query(
      `SELECT * FROM liquidity_pool_config WHERE config_name = 'default' LIMIT 1`
    );
    return result.rows[0];
  }

  /**
   * Get order book for a property
   */
  async getOrderBook(propertyId) {
    const client = await this.pool.connect();
    
    try {
      const sellOrders = await client.query(
        `SELECT 
          order_id, wallet_address, shares_amount, shares_filled,
          shares_remaining, price_per_share, total_value, status,
          created_at, expires_at
         FROM liquidity_orders
         WHERE property_id = $1 
           AND order_type = 'sell'
           AND status IN ('open', 'partial')
           AND compliance_checked = true
         ORDER BY price_per_share ASC, created_at ASC
         LIMIT 20`,
        [propertyId]
      );
      
      const buyOrders = await client.query(
        `SELECT 
          order_id, wallet_address, shares_amount, shares_filled,
          shares_remaining, price_per_share, total_value, status,
          created_at, expires_at
         FROM liquidity_orders
         WHERE property_id = $1
           AND order_type = 'buy'
           AND status IN ('open', 'partial')
           AND compliance_checked = true
         ORDER BY price_per_share DESC, created_at ASC
         LIMIT 20`,
        [propertyId]
      );
      
      return {
        sellOrders: sellOrders.rows,
        buyOrders: buyOrders.rows,
        spread: this.calculateSpread(sellOrders.rows, buyOrders.rows)
      };
      
    } finally {
      client.release();
    }
  }

  /**
   * Calculate bid-ask spread
   */
  calculateSpread(sellOrders, buyOrders) {
    if (sellOrders.length === 0 || buyOrders.length === 0) {
      return { spread: null, spreadPercent: null };
    }
    
    const bestAsk = parseFloat(sellOrders[0].price_per_share);
    const bestBid = parseFloat(buyOrders[0].price_per_share);
    const spread = bestAsk - bestBid;
    const spreadPercent = (spread / bestAsk) * 100;
    
    return {
      bestBid,
      bestAsk,
      spread,
      spreadPercent: spreadPercent.toFixed(2)
    };
  }

  /**
   * Get investor's orders
   */
  async getInvestorOrders(walletAddress) {
    const client = await this.pool.connect();
    
    try {
      const result = await client.query(
        `SELECT 
          lo.*,
          fp.deal_id,
          d.parsed->>'address' as property_address
         FROM liquidity_orders lo
         LEFT JOIN fractional_properties fp ON lo.property_id = fp.id
         LEFT JOIN deals d ON fp.deal_id = d.id
         WHERE lo.wallet_address = $1
         ORDER BY lo.created_at DESC
         LIMIT 50`,
        [walletAddress]
      );
      
      return result.rows;
      
    } finally {
      client.release();
    }
  }

  /**
   * Cancel an order
   */
  async cancelOrder(orderId, walletAddress) {
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Verify ownership
      const orderResult = await client.query(
        `SELECT * FROM liquidity_orders WHERE order_id = $1 AND wallet_address = $2`,
        [orderId, walletAddress]
      );
      
      if (!orderResult.rows[0]) {
        throw new Error('Order not found or unauthorized');
      }
      
      const order = orderResult.rows[0];
      
      if (order.status === 'filled' || order.status === 'cancelled') {
        throw new Error('Cannot cancel order with status: ' + order.status);
      }
      
      // Update order status
      await client.query(
        `UPDATE liquidity_orders 
         SET status = 'cancelled', cancelled_at = NOW()
         WHERE order_id = $1`,
        [orderId]
      );
      
      // Release compliance hold
      await client.query(
        `UPDATE compliance_holds
         SET status = 'released', released_at = NOW()
         WHERE metadata->>'orderId' = $1 AND status = 'active'`,
        [orderId]
      );
      
      await client.query('COMMIT');
      
      return { success: true, message: 'Order cancelled successfully' };
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Get liquidity metrics for admin dashboard
   */
  async getLiquidityMetrics() {
    const client = await this.pool.connect();
    
    try {
      const metrics = await client.query(`
        SELECT 
          (SELECT COUNT(*) FROM liquidity_orders WHERE status IN ('open', 'partial')) as active_orders,
          (SELECT COUNT(*) FROM order_matches WHERE status = 'completed') as completed_matches,
          (SELECT COALESCE(SUM(total_amount), 0) FROM order_matches WHERE status = 'completed') as total_volume,
          (SELECT COALESCE(SUM(fee_amount), 0) FROM fee_ledger WHERE status = 'collected') as total_fees,
          (SELECT total_cash_balance FROM liquidity_pool_config WHERE config_name = 'default') as treasury_balance,
          (SELECT available_cash FROM liquidity_pool_config WHERE config_name = 'default') as treasury_available
      `);
      
      return metrics.rows[0];
      
    } finally {
      client.release();
    }
  }
}

module.exports = new LiquidityService();
