const express = require('express');
const router = express.Router();
const nftMarketplaceService = require('../services/nftMarketplaceService');

router.get('/stats', async (req, res) => {
  try {
    const stats = await nftMarketplaceService.getMarketplaceStats();
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('❌ Marketplace stats error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/listings', async (req, res) => {
  try {
    const { limit = 50, offset = 0 } = req.query;
    const listings = await nftMarketplaceService.getActiveListings(
      parseInt(limit),
      parseInt(offset)
    );
    
    res.json({
      success: true,
      data: listings,
      count: listings.length
    });
  } catch (error) {
    console.error('❌ Listings error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/listing/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const listing = await nftMarketplaceService.getListingById(parseInt(id));
    
    res.json({
      success: true,
      data: listing
    });
  } catch (error) {
    console.error('❌ Listing detail error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/user/:walletAddress/listings', async (req, res) => {
  try {
    const { walletAddress } = req.params;
    const listings = await nftMarketplaceService.getUserListings(walletAddress);
    
    res.json({
      success: true,
      data: listings
    });
  } catch (error) {
    console.error('❌ User listings error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/user/:walletAddress/bids', async (req, res) => {
  try {
    const { walletAddress } = req.params;
    const bids = await nftMarketplaceService.getUserBids(walletAddress);
    
    res.json({
      success: true,
      data: bids
    });
  } catch (error) {
    console.error('❌ User bids error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/sales', async (req, res) => {
  try {
    const { walletAddress, limit = 50 } = req.query;
    const sales = await nftMarketplaceService.getSalesHistory(
      walletAddress || null,
      parseInt(limit)
    );
    
    res.json({
      success: true,
      data: sales
    });
  } catch (error) {
    console.error('❌ Sales history error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
