const { getContractProvider } = require('./contractProvider');
const { db } = require('../db');
const { nftListings, nftBids, nftSales } = require('../../shared/schema');
const { eq, and, desc, sql } = require('drizzle-orm');

class NFTMarketplaceService {
  constructor() {
    this.contractProvider = getContractProvider();
  }

  async getActiveListings(limit = 50, offset = 0) {
    try {
      const marketplaceContract = this.contractProvider.getContract('EnhancedNFTMarketplace');
      
      const dbListings = await db.select()
        .from(nftListings)
        .where(eq(nftListings.status, 'active'))
        .orderBy(desc(nftListings.createdAt))
        .limit(limit)
        .offset(offset);

      const enrichedListings = await Promise.all(dbListings.map(async (listing) => {
        try {
          const onChainListing = await marketplaceContract.getListing(listing.id);
          return {
            ...listing,
            onChain: {
              seller: onChainListing.seller,
              price: this.contractProvider.formatEther(onChainListing.price),
              active: onChainListing.active
            }
          };
        } catch (err) {
          return listing;
        }
      }));

      return enrichedListings;
    } catch (error) {
      console.error('❌ getActiveListings error:', error);
      throw error;
    }
  }

  async getListingById(listingId) {
    try {
      const [dbListing] = await db.select()
        .from(nftListings)
        .where(eq(nftListings.id, listingId))
        .limit(1);

      if (!dbListing) {
        throw new Error('Listing not found');
      }

      const bids = await db.select()
        .from(nftBids)
        .where(and(
          eq(nftBids.listingId, listingId),
          eq(nftBids.status, 'active')
        ))
        .orderBy(desc(nftBids.amount));

      return {
        ...dbListing,
        bids
      };
    } catch (error) {
      console.error('❌ getListingById error:', error);
      throw error;
    }
  }

  async getUserListings(walletAddress) {
    try {
      const listings = await db.select()
        .from(nftListings)
        .where(eq(nftListings.seller, walletAddress.toLowerCase()))
        .orderBy(desc(nftListings.createdAt));

      return listings;
    } catch (error) {
      console.error('❌ getUserListings error:', error);
      throw error;
    }
  }

  async getUserBids(walletAddress) {
    try {
      const bids = await db.select()
        .from(nftBids)
        .where(eq(nftBids.bidder, walletAddress.toLowerCase()))
        .orderBy(desc(nftBids.createdAt));

      return bids;
    } catch (error) {
      console.error('❌ getUserBids error:', error);
      throw error;
    }
  }

  async getSalesHistory(walletAddress = null, limit = 50) {
    try {
      let query = db.select().from(nftSales);
      
      if (walletAddress) {
        query = query.where(
          sql`${nftSales.buyer} = ${walletAddress.toLowerCase()} OR ${nftSales.seller} = ${walletAddress.toLowerCase()}`
        );
      }

      const sales = await query
        .orderBy(desc(nftSales.createdAt))
        .limit(limit);

      return sales;
    } catch (error) {
      console.error('❌ getSalesHistory error:', error);
      throw error;
    }
  }

  async getMarketplaceStats() {
    try {
      const marketplaceContract = this.contractProvider.getContract('EnhancedNFTMarketplace');
      
      const [totalListings] = await db.select({ count: sql`count(*)` })
        .from(nftListings)
        .where(eq(nftListings.status, 'active'));

      const [totalSales] = await db.select({ 
        count: sql`count(*)`,
        volume: sql`sum(CAST(${nftSales.price} AS DECIMAL))`
      })
        .from(nftSales);

      const activeListingsCount = await marketplaceContract.getActiveListingsCount();
      const activeAuctionsCount = await marketplaceContract.getActiveAuctionsCount();

      return {
        marketplaceAddress: this.contractProvider.getAddress('EnhancedNFTMarketplace'),
        totalActiveListings: Number(activeListingsCount),
        totalActiveAuctions: Number(activeAuctionsCount),
        totalSales: Number(totalSales.count || 0),
        totalVolume: totalSales.volume ? totalSales.volume.toString() : '0',
        platformFeePercentage: '2.5%'
      };
    } catch (error) {
      console.error('❌ getMarketplaceStats error:', error);
      return {
        marketplaceAddress: this.contractProvider.getAddress('EnhancedNFTMarketplace'),
        totalActiveListings: 0,
        totalActiveAuctions: 0,
        totalSales: 0,
        totalVolume: '0',
        platformFeePercentage: '2.5%'
      };
    }
  }
}

module.exports = new NFTMarketplaceService();
