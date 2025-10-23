/**
 * NFT Marketplace Contract Service
 * Handles interactions with EnhancedNFTMarketplace contract
 */

import { TransactionManager, TransactionData, parseEthValue } from '../transactionManager';

export interface CreateListingParams {
  nftContract: string;
  tokenId: string;
  price: string; // Price in BNB
}

export interface PlaceBidParams {
  listingId: string;
  bidAmount: string; // Bid amount in BNB
}

export interface BuyItemParams {
  listingId: string;
}

export interface CancelListingParams {
  listingId: string;
}

export interface NFTListing {
  id: number;
  nftContract: string;
  tokenId: string;
  seller: string;
  price: string;
  active: boolean;
}

export class NFTMarketplaceService {
  private apiBase = '/api/nft-marketplace';

  /**
   * Get all active listings
   */
  async getActiveListings(): Promise<NFTListing[]> {
    try {
      const response = await fetch(`${this.apiBase}/listings`);
      const data = await response.json();

      if (data.success && data.data) {
        return data.data;
      }
      return [];
    } catch (error) {
      console.error('Failed to fetch listings:', error);
      return [];
    }
  }

  /**
   * Get listing details
   */
  async getListingDetails(listingId: string): Promise<NFTListing | null> {
    try {
      const response = await fetch(`${this.apiBase}/listing/${listingId}`);
      const data = await response.json();

      if (data.success && data.data) {
        return data.data;
      }
      return null;
    } catch (error) {
      console.error('Failed to fetch listing details:', error);
      return null;
    }
  }

  /**
   * Build create listing transaction
   */
  async buildCreateListingTransaction(params: CreateListingParams): Promise<TransactionData | null> {
    try {
      const response = await fetch(`${this.apiBase}/tx/create-listing`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });

      const data = await response.json();

      if (data.success && data.data) {
        return data.data;
      }
      return null;
    } catch (error) {
      console.error('Failed to build listing transaction:', error);
      return null;
    }
  }

  /**
   * Create NFT listing (full flow)
   */
  async createListing(
    params: CreateListingParams,
    walletAddress: string,
    txManager: TransactionManager
  ): Promise<{ success: boolean; txHash?: string; error?: string }> {
    try {
      const txData = await this.buildCreateListingTransaction(params);
      if (!txData) {
        return { success: false, error: 'Failed to build transaction' };
      }

      const result = await txManager.signAndSendTransaction(txData, walletAddress);
      if (!result.success || !result.txHash) {
        return { success: false, error: result.error };
      }

      await txManager.waitForTransaction(result.txHash, 1);
      await this.confirmCreateListing(
        params.nftContract,
        params.tokenId,
        walletAddress,
        params.price,
        result.txHash
      );

      return { success: true, txHash: result.txHash };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Build place bid transaction
   */
  async buildPlaceBidTransaction(params: PlaceBidParams): Promise<TransactionData | null> {
    try {
      const response = await fetch(`${this.apiBase}/tx/place-bid`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });

      const data = await response.json();

      if (data.success && data.data) {
        return data.data;
      }
      return null;
    } catch (error) {
      console.error('Failed to build bid transaction:', error);
      return null;
    }
  }

  /**
   * Place bid on listing (full flow)
   */
  async placeBid(
    params: PlaceBidParams,
    walletAddress: string,
    txManager: TransactionManager
  ): Promise<{ success: boolean; txHash?: string; error?: string }> {
    try {
      const txData = await this.buildPlaceBidTransaction(params);
      if (!txData) {
        return { success: false, error: 'Failed to build transaction' };
      }

      const result = await txManager.signAndSendTransaction(txData, walletAddress);
      if (!result.success || !result.txHash) {
        return { success: false, error: result.error };
      }

      await txManager.waitForTransaction(result.txHash, 1);
      await this.confirmPlaceBid(params.listingId, walletAddress, params.bidAmount, result.txHash);

      return { success: true, txHash: result.txHash };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Build buy item transaction
   */
  async buildBuyItemTransaction(params: BuyItemParams): Promise<TransactionData | null> {
    try {
      const response = await fetch(`${this.apiBase}/tx/buy-item`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });

      const data = await response.json();

      if (data.success && data.data) {
        return data.data;
      }
      return null;
    } catch (error) {
      console.error('Failed to build buy transaction:', error);
      return null;
    }
  }

  /**
   * Buy NFT (full flow)
   */
  async buyItem(
    params: BuyItemParams,
    walletAddress: string,
    txManager: TransactionManager
  ): Promise<{ success: boolean; txHash?: string; error?: string }> {
    try {
      const txData = await this.buildBuyItemTransaction(params);
      if (!txData) {
        return { success: false, error: 'Failed to build transaction' };
      }

      const result = await txManager.signAndSendTransaction(txData, walletAddress);
      if (!result.success || !result.txHash) {
        return { success: false, error: result.error };
      }

      await txManager.waitForTransaction(result.txHash, 1);
      await this.confirmBuyItem(params.listingId, walletAddress, result.txHash);

      return { success: true, txHash: result.txHash };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Build cancel listing transaction
   */
  async buildCancelListingTransaction(params: CancelListingParams): Promise<TransactionData | null> {
    try {
      const response = await fetch(`${this.apiBase}/tx/cancel-listing`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });

      const data = await response.json();

      if (data.success && data.data) {
        return data.data;
      }
      return null;
    } catch (error) {
      console.error('Failed to build cancel transaction:', error);
      return null;
    }
  }

  /**
   * Cancel listing (full flow)
   */
  async cancelListing(
    params: CancelListingParams,
    walletAddress: string,
    txManager: TransactionManager
  ): Promise<{ success: boolean; txHash?: string; error?: string }> {
    try {
      const txData = await this.buildCancelListingTransaction(params);
      if (!txData) {
        return { success: false, error: 'Failed to build transaction' };
      }

      const result = await txManager.signAndSendTransaction(txData, walletAddress);
      if (!result.success || !result.txHash) {
        return { success: false, error: result.error };
      }

      await txManager.waitForTransaction(result.txHash, 1);
      await this.confirmCancelListing(params.listingId, result.txHash);

      return { success: true, txHash: result.txHash };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  // Confirmation methods
  private async confirmCreateListing(
    nftContract: string,
    tokenId: string,
    seller: string,
    price: string,
    txHash: string
  ): Promise<void> {
    await fetch(`${this.apiBase}/confirm-create-listing`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nftContract, tokenId, seller, price, txHash }),
    });
  }

  private async confirmPlaceBid(
    listingId: string,
    bidder: string,
    amount: string,
    txHash: string
  ): Promise<void> {
    await fetch(`${this.apiBase}/confirm-place-bid`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ listingId, bidder, amount, txHash }),
    });
  }

  private async confirmBuyItem(listingId: string, buyer: string, txHash: string): Promise<void> {
    await fetch(`${this.apiBase}/confirm-buy-item`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ listingId, buyer, txHash }),
    });
  }

  private async confirmCancelListing(listingId: string, txHash: string): Promise<void> {
    await fetch(`${this.apiBase}/confirm-cancel-listing`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ listingId, txHash }),
    });
  }
}

// Singleton instance
export const nftMarketplaceService = new NFTMarketplaceService();
