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

router.post('/tx/create-listing', async (req, res) => {
  try {
    const { nftContract, tokenId, price } = req.body;
    
    if (!nftContract || !tokenId || !price) {
      return res.status(400).json({ success: false, error: 'NFT contract, token ID, and price required' });
    }

    const txData = await nftMarketplaceService.buildCreateListingTx(nftContract, tokenId, price);
    
    res.json({
      success: true,
      data: txData,
      message: 'Transaction ready for signing'
    });
  } catch (error) {
    console.error('❌ Build create listing tx error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/tx/buy-now', async (req, res) => {
  try {
    const { listingId, price } = req.body;
    
    if (!listingId || !price) {
      return res.status(400).json({ success: false, error: 'Listing ID and price required' });
    }

    const txData = await nftMarketplaceService.buildBuyNowTx(listingId, price);
    
    res.json({
      success: true,
      data: txData,
      message: 'Transaction ready for signing'
    });
  } catch (error) {
    console.error('❌ Build buy now tx error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/tx/place-bid', async (req, res) => {
  try {
    const { listingId, bidAmount } = req.body;
    
    if (!listingId || !bidAmount) {
      return res.status(400).json({ success: false, error: 'Listing ID and bid amount required' });
    }

    const txData = await nftMarketplaceService.buildPlaceBidTx(listingId, bidAmount);
    
    res.json({
      success: true,
      data: txData,
      message: 'Transaction ready for signing'
    });
  } catch (error) {
    console.error('❌ Build place bid tx error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/tx/cancel-listing', async (req, res) => {
  try {
    const { listingId } = req.body;
    
    if (!listingId) {
      return res.status(400).json({ success: false, error: 'Listing ID required' });
    }

    const txData = await nftMarketplaceService.buildCancelListingTx(listingId);
    
    res.json({
      success: true,
      data: txData,
      message: 'Transaction ready for signing'
    });
  } catch (error) {
    console.error('❌ Build cancel listing tx error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/confirm-listing', async (req, res) => {
  try {
    const { seller, nftContract, tokenId, price, txHash } = req.body;
    
    if (!seller || !nftContract || !tokenId || !price || !txHash) {
      return res.status(400).json({ success: false, error: 'All fields required' });
    }

    const listing = await nftMarketplaceService.recordListing(seller, nftContract, tokenId, price, txHash);
    
    res.json({
      success: true,
      data: listing,
      message: 'Listing recorded successfully'
    });
  } catch (error) {
    console.error('❌ Confirm listing error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/confirm-sale', async (req, res) => {
  try {
    const { listingId, buyer, seller, nftContract, tokenId, price, txHash } = req.body;
    
    if (!listingId || !buyer || !seller || !nftContract || !tokenId || !price || !txHash) {
      return res.status(400).json({ success: false, error: 'All fields required' });
    }

    const sale = await nftMarketplaceService.recordSale(listingId, buyer, seller, nftContract, tokenId, price, txHash);
    
    res.json({
      success: true,
      data: sale,
      message: 'Sale recorded successfully'
    });
  } catch (error) {
    console.error('❌ Confirm sale error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/confirm-bid', async (req, res) => {
  try {
    const { listingId, bidder, amount, txHash } = req.body;
    
    if (!listingId || !bidder || !amount || !txHash) {
      return res.status(400).json({ success: false, error: 'All fields required' });
    }

    const bid = await nftMarketplaceService.recordBid(listingId, bidder, amount, txHash);
    
    res.json({
      success: true,
      data: bid,
      message: 'Bid recorded successfully'
    });
  } catch (error) {
    console.error('❌ Confirm bid error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/confirm-cancellation', async (req, res) => {
  try {
    const { listingId, txHash } = req.body;
    
    if (!listingId || !txHash) {
      return res.status(400).json({ success: false, error: 'Listing ID and txHash required' });
    }

    const result = await nftMarketplaceService.recordCancellation(listingId, txHash);
    
    res.json({
      success: true,
      data: result,
      message: 'Cancellation recorded successfully'
    });
  } catch (error) {
    console.error('❌ Confirm cancellation error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
