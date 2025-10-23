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

  async buildCreateListingTx(nftContract, tokenId, price) {
    try {
      const priceWei = this.contractProvider.parseEther(price.toString());
      return this.contractProvider.buildTransactionData(
        'EnhancedNFTMarketplace',
        'listItem',
        [nftContract, tokenId, priceWei]
      );
    } catch (error) {
      console.error('❌ buildCreateListingTx error:', error);
      throw error;
    }
  }

  async recordListing(seller, nftContract, tokenId, price, txHash) {
    try {
      const [listing] = await db.insert(nftListings)
        .values({
          seller: seller.toLowerCase(),
          nftContract: nftContract.toLowerCase(),
          tokenId: tokenId.toString(),
          price: price.toString(),
          status: 'active',
          txHash
        })
        .returning();

      return listing;
    } catch (error) {
      console.error('❌ recordListing error:', error);
      throw error;
    }
  }

  async buildBuyNowTx(listingId, price) {
    try {
      const priceWei = this.contractProvider.parseEther(price.toString());
      const txData = this.contractProvider.buildTransactionData(
        'EnhancedNFTMarketplace',
        'buyNow',
        [listingId]
      );
      
      return {
        ...txData,
        value: priceWei.toString()
      };
    } catch (error) {
      console.error('❌ buildBuyNowTx error:', error);
      throw error;
    }
  }

  async recordSale(listingId, buyer, seller, nftContract, tokenId, price, txHash) {
    try {
      const [sale] = await db.insert(nftSales)
        .values({
          listingId,
          buyer: buyer.toLowerCase(),
          seller: seller.toLowerCase(),
          nftContract: nftContract.toLowerCase(),
          tokenId: tokenId.toString(),
          price: price.toString(),
          txHash
        })
        .returning();

      await db.update(nftListings)
        .set({ status: 'sold', updatedAt: new Date() })
        .where(eq(nftListings.id, listingId));

      return sale;
    } catch (error) {
      console.error('❌ recordSale error:', error);
      throw error;
    }
  }

  async buildPlaceBidTx(listingId, bidAmount) {
    try {
      const bidWei = this.contractProvider.parseEther(bidAmount.toString());
      const txData = this.contractProvider.buildTransactionData(
        'EnhancedNFTMarketplace',
        'placeBid',
        [listingId]
      );
      
      return {
        ...txData,
        value: bidWei.toString()
      };
    } catch (error) {
      console.error('❌ buildPlaceBidTx error:', error);
      throw error;
    }
  }

  async recordBid(listingId, bidder, amount, txHash) {
    try {
      const [bid] = await db.insert(nftBids)
        .values({
          listingId,
          bidder: bidder.toLowerCase(),
          amount: amount.toString(),
          status: 'active',
          txHash
        })
        .returning();

      return bid;
    } catch (error) {
      console.error('❌ recordBid error:', error);
      throw error;
    }
  }

  async buildCancelListingTx(listingId) {
    try {
      return this.contractProvider.buildTransactionData(
        'EnhancedNFTMarketplace',
        'cancelListing',
        [listingId]
      );
    } catch (error) {
      console.error('❌ buildCancelListingTx error:', error);
      throw error;
    }
  }

  async recordCancellation(listingId, txHash) {
    try {
      await db.update(nftListings)
        .set({ status: 'cancelled', updatedAt: new Date() })
        .where(eq(nftListings.id, listingId));

      return { success: true, listingId, txHash };
    } catch (error) {
      console.error('❌ recordCancellation error:', error);
      throw error;
    }
  }
}

module.exports = new NFTMarketplaceService();
