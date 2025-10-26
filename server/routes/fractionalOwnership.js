/**
 * Fractional Real Estate Ownership API Routes
 */

const express = require('express');
const router = express.Router();
const fractionalService = require('../services/fractionalOwnershipService');
const { requireAdmin } = require('../middleware/secureAuth');

// Middleware to authenticate wallet (reuse existing)
const authenticateWallet = (req, res, next) => {
  const walletAddress = req.headers['x-wallet-address'] || req.body.walletAddress || req.query.walletAddress;
  
  if (!walletAddress) {
    return res.status(401).json({ success: false, error: 'Wallet address required' });
  }
  
  req.walletAddress = walletAddress.toLowerCase();
  next();
};

// ========================================
// PUBLIC ENDPOINTS
// ========================================

/**
 * GET /api/fractional/properties
 * Get all fractional properties (public marketplace)
 */
router.get('/properties', async (req, res) => {
  try {
    const filters = {
      minInvestment: req.query.minInvestment ? parseFloat(req.query.minInvestment) : null,
      minYield: req.query.minYield ? parseFloat(req.query.minYield) : null,
      available: req.query.available === 'true',
      limit: req.query.limit ? parseInt(req.query.limit) : null
    };
    
    const properties = await fractionalService.getFractionalProperties(filters);
    
    res.json({
      success: true,
      count: properties.length,
      properties
    });
  } catch (error) {
    console.error('Error getting fractional properties:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/fractional/properties/:id
 * Get a single fractional property by ID
 */
router.get('/properties/:id', async (req, res) => {
  try {
    const propertyId = parseInt(req.params.id);
    const property = await fractionalService.getFractionalProperty(propertyId);
    
    res.json({
      success: true,
      property
    });
  } catch (error) {
    console.error('Error getting fractional property:', error);
    res.status(error.message.includes('not found') ? 404 : 500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/fractional/calculate-tier
 * Calculate investment tier for an amount
 */
router.post('/calculate-tier', async (req, res) => {
  try {
    const { investmentAmount, sharePrice } = req.body;
    
    if (!investmentAmount || !sharePrice) {
      return res.status(400).json({
        success: false,
        error: 'investmentAmount and sharePrice are required'
      });
    }
    
    const tierCalculation = await fractionalService.calculateInvestmentTier(
      investmentAmount,
      sharePrice
    );
    
    res.json({
      success: true,
      calculation: tierCalculation
    });
  } catch (error) {
    console.error('Error calculating tier:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ========================================
// INVESTOR ENDPOINTS (Require Wallet)
// ========================================

/**
 * POST /api/fractional/purchase
 * Purchase shares in a fractional property
 */
router.post('/purchase', authenticateWallet, async (req, res) => {
  try {
    const {
      propertyId,
      investorId,
      investmentAmount,
      paymentMethod,
      stripePaymentId,
      txHash
    } = req.body;
    
    if (!propertyId || !investmentAmount || !paymentMethod) {
      return res.status(400).json({
        success: false,
        error: 'propertyId, investmentAmount, and paymentMethod are required'
      });
    }
    
    const result = await fractionalService.purchaseShares({
      propertyId: parseInt(propertyId),
      investorId: investorId ? parseInt(investorId) : null,
      walletAddress: req.walletAddress,
      investmentAmount: parseFloat(investmentAmount),
      paymentMethod,
      stripePaymentId,
      txHash
    });
    
    res.json({
      success: true,
      message: 'Shares purchased successfully',
      data: result
    });
  } catch (error) {
    console.error('Error purchasing shares:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Determine investor tier based on total investment
 * @param {number} totalInvested - Total amount invested
 * @returns {string} Tier name (retail, accredited, premium, institutional)
 */
function determineInvestorTier(totalInvested) {
  if (totalInvested >= 500000) return 'institutional';
  if (totalInvested >= 100000) return 'premium';
  if (totalInvested >= 10000) return 'accredited';
  return 'retail';
}

/**
 * GET /api/fractional/portfolio
 * Get investor's portfolio
 */
router.get('/portfolio', authenticateWallet, async (req, res) => {
  try {
    const portfolio = await fractionalService.getInvestorPortfolio(req.walletAddress);
    
    // Calculate totals
    const totals = portfolio.reduce((acc, share) => {
      return {
        totalInvested: acc.totalInvested + parseFloat(share.totalInvested || 0),
        totalRevenueEarned: acc.totalRevenueEarned + parseFloat(share.totalRevenueEarned || 0),
        monthlyRevenueEstimate: acc.monthlyRevenueEstimate + parseFloat(share.monthlyRevenueEstimate || 0),
        propertiesCount: acc.propertiesCount + 1
      };
    }, {
      totalInvested: 0,
      totalRevenueEarned: 0,
      monthlyRevenueEstimate: 0,
      propertiesCount: 0
    });
    
    // Add current tier based on total investment
    totals.currentTier = determineInvestorTier(totals.totalInvested);
    
    res.json({
      success: true,
      portfolio,
      totals
    });
  } catch (error) {
    console.error('Error getting investor portfolio:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/fractional/transactions
 * Get investor's transaction history
 */
router.get('/transactions', authenticateWallet, async (req, res) => {
  try {
    const transactions = await fractionalService.getInvestorTransactions(req.walletAddress);
    
    res.json({
      success: true,
      count: transactions.length,
      transactions
    });
  } catch (error) {
    console.error('Error getting investor transactions:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ========================================
// ADMIN ENDPOINTS
// ========================================

/**
 * POST /api/fractional/create-offering
 * Create a fractional offering from a deal (Admin only)
 */
router.post('/create-offering', requireAdmin, async (req, res) => {
  try {
    const { dealId, options } = req.body;
    
    if (!dealId) {
      return res.status(400).json({
        success: false,
        error: 'dealId is required'
      });
    }
    
    const fractionalProperty = await fractionalService.createFractionalOffering(
      dealId,
      options || {}
    );
    
    res.json({
      success: true,
      message: 'Fractional offering created successfully',
      property: fractionalProperty
    });
  } catch (error) {
    console.error('Error creating fractional offering:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
