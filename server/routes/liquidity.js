/**
 * Feature #1: Liquidity & Redemption Desk - API Routes
 * REST endpoints for secondary market trading
 */

const express = require('express');
const router = express.Router();
const liquidityService = require('../services/liquidityService');

router.post('/orders/sell', async (req, res) => {
  try {
    const { walletAddress, propertyId, shares, pricePerShare, expiresIn } = req.body;

    if (!walletAddress || !propertyId || !shares || !pricePerShare) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: walletAddress, propertyId, shares, pricePerShare'
      });
    }

    const result = await liquidityService.createSellOrder({
      walletAddress,
      propertyId: parseInt(propertyId),
      shares: parseFloat(shares),
      pricePerShare: parseFloat(pricePerShare),
      expiresIn: expiresIn ? parseInt(expiresIn) : 30
    });

    res.json(result);
  } catch (error) {
    console.error('Create sell order error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to create sell order'
    });
  }
});

router.post('/orders/buy', async (req, res) => {
  try {
    const { walletAddress, propertyId, shares, maxPricePerShare } = req.body;

    if (!walletAddress || !propertyId || !shares || !maxPricePerShare) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: walletAddress, propertyId, shares, maxPricePerShare'
      });
    }

    const result = await liquidityService.createBuyOrder({
      walletAddress,
      propertyId: parseInt(propertyId),
      shares: parseFloat(shares),
      maxPricePerShare: parseFloat(maxPricePerShare)
    });

    res.json(result);
  } catch (error) {
    console.error('Create buy order error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to create buy order'
    });
  }
});

router.get('/orderbook/:propertyId', async (req, res) => {
  try {
    const { propertyId } = req.params;

    if (!propertyId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameter: propertyId'
      });
    }

    const orderBook = await liquidityService.getOrderBook(parseInt(propertyId));

    res.json({
      success: true,
      ...orderBook
    });
  } catch (error) {
    console.error('Get order book error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to retrieve order book'
    });
  }
});

router.get('/orders/:walletAddress', async (req, res) => {
  try {
    const { walletAddress } = req.params;

    if (!walletAddress) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameter: walletAddress'
      });
    }

    const orders = await liquidityService.getInvestorOrders(walletAddress);

    res.json({
      success: true,
      orders
    });
  } catch (error) {
    console.error('Get investor orders error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to retrieve orders'
    });
  }
});

router.post('/orders/:orderId/cancel', async (req, res) => {
  try {
    const { orderId } = req.params;
    const { walletAddress } = req.body;

    if (!orderId || !walletAddress) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: orderId, walletAddress'
      });
    }

    const result = await liquidityService.cancelOrder(orderId, walletAddress);

    res.json(result);
  } catch (error) {
    console.error('Cancel order error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to cancel order'
    });
  }
});

router.get('/metrics', async (req, res) => {
  try {
    const metrics = await liquidityService.getLiquidityMetrics();

    res.json({
      success: true,
      metrics
    });
  } catch (error) {
    console.error('Get liquidity metrics error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to retrieve metrics'
    });
  }
});

router.get('/treasury/config', async (req, res) => {
  try {
    const { Pool } = require('pg');
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    const client = await pool.connect();
    
    try {
      const config = await liquidityService.getTreasuryConfig(client);
      
      res.json({
        success: true,
        config
      });
    } finally {
      client.release();
      await pool.end();
    }
  } catch (error) {
    console.error('Get treasury config error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to retrieve treasury config'
    });
  }
});

router.get('/matches', async (req, res) => {
  try {
    const { propertyId, walletAddress, limit = 50 } = req.query;
    const { Pool } = require('pg');
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    const client = await pool.connect();
    
    try {
      let query = `
        SELECT 
          om.*,
          fp.deal_id,
          d.parsed->>'address' as property_address
        FROM order_matches om
        LEFT JOIN fractional_properties fp ON om.property_id = fp.id
        LEFT JOIN deals d ON fp.deal_id = d.id
        WHERE 1=1
      `;
      
      const params = [];
      
      if (propertyId) {
        params.push(parseInt(propertyId));
        query += ` AND om.property_id = $${params.length}`;
      }
      
      if (walletAddress) {
        params.push(walletAddress);
        query += ` AND (om.seller_wallet = $${params.length} OR om.buyer_wallet = $${params.length})`;
      }
      
      params.push(parseInt(limit));
      query += ` ORDER BY om.created_at DESC LIMIT $${params.length}`;
      
      const result = await client.query(query, params);
      
      res.json({
        success: true,
        matches: result.rows
      });
    } finally {
      client.release();
      await pool.end();
    }
  } catch (error) {
    console.error('Get matches error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to retrieve matches'
    });
  }
});

module.exports = router;
