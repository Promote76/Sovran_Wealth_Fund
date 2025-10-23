/**
 * useContractTransactions Hook
 * Provides easy access to contract transaction methods with integrated wallet
 */

import { useState, useCallback, useMemo, useRef } from 'react';
import { useWallet } from '../contexts/WalletContext';
import { TransactionManager } from '../services/transactionManager';
import { 
  keygrowService,
  nftMarketplaceService,
  advancedStakingService,
  type RegisterRenterParams,
  type StakeNFTParams,
  type CreateListingParams,
} from '../services/contracts';

export interface TransactionStatus {
  loading: boolean;
  success: boolean;
  txHash?: string;
  error?: string;
}

export function useContractTransactions() {
  const { account, isConnected, isLoggedIn } = useWallet();
  const [txStatus, setTxStatus] = useState<TransactionStatus>({
    loading: false,
    success: false,
  });

  // Create transaction manager instance - recompute when wallet connection changes
  const txManager = useMemo(() => {
    // Only create txManager when wallet is actually connected
    if (!isConnected || !account) {
      return null;
    }

    // Check for various wallet providers
    let provider = null;
    if ((window as any).binancew3w?.ethereum) {
      provider = (window as any).binancew3w.ethereum;
    } else if ((window as any).BinanceChain) {
      provider = (window as any).BinanceChain;
    } else if ((window as any).ethereum) {
      provider = (window as any).ethereum;
    }

    if (!provider) return null;
    return new TransactionManager(provider);
  }, [isConnected, account]); // Recompute when wallet connection changes

  // Reset transaction status
  const resetStatus = useCallback(() => {
    setTxStatus({
      loading: false,
      success: false,
    });
  }, []);

  // --- KeyGrow Methods ---

  const registerAsRenter = useCallback(
    async (tier: number) => {
      if (!isConnected || !account || !txManager) {
        setTxStatus({
          loading: false,
          success: false,
          error: 'Please connect your wallet first',
        });
        return;
      }

      setTxStatus({ loading: true, success: false });

      try {
        const params: RegisterRenterParams = {
          walletAddress: account,
          tier,
        };

        const result = await keygrowService.registerAsRenter(params, txManager);

        setTxStatus({
          loading: false,
          success: result.success,
          txHash: result.txHash,
          error: result.error,
        });
      } catch (error: any) {
        setTxStatus({
          loading: false,
          success: false,
          error: error.message,
        });
      }
    },
    [isConnected, account, txManager]
  );

  const claimKeygrowAllocation = useCallback(async () => {
    if (!isConnected || !account || !txManager) {
      setTxStatus({
        loading: false,
        success: false,
        error: 'Please connect your wallet first',
      });
      return;
    }

    setTxStatus({ loading: true, success: false });

    try {
      const result = await keygrowService.claimAllocation(
        { walletAddress: account },
        txManager
      );

      setTxStatus({
        loading: false,
        success: result.success,
        txHash: result.txHash,
        error: result.error,
      });
    } catch (error: any) {
      setTxStatus({
        loading: false,
        success: false,
        error: error.message,
      });
    }
  }, [isConnected, account, txManager]);

  // --- Advanced Staking Methods ---

  const stakeNFT = useCallback(
    async (nftContract: string, nftTokenId: string, tier: number) => {
      if (!isConnected || !account || !txManager) {
        setTxStatus({
          loading: false,
          success: false,
          error: 'Please connect your wallet first',
        });
        return;
      }

      setTxStatus({ loading: true, success: false });

      try {
        const params: StakeNFTParams = {
          nftContract,
          nftTokenId,
          tier,
        };

        const result = await advancedStakingService.stakeNFT(params, account, txManager);

        setTxStatus({
          loading: false,
          success: result.success,
          txHash: result.txHash,
          error: result.error,
        });
      } catch (error: any) {
        setTxStatus({
          loading: false,
          success: false,
          error: error.message,
        });
      }
    },
    [isConnected, account, txManager]
  );

  const unstakeNFT = useCallback(
    async (stakeId: string) => {
      if (!isConnected || !account || !txManager) {
        setTxStatus({
          loading: false,
          success: false,
          error: 'Please connect your wallet first',
        });
        return;
      }

      setTxStatus({ loading: true, success: false });

      try {
        const result = await advancedStakingService.unstakeNFT(
          { stakeId },
          account,
          txManager
        );

        setTxStatus({
          loading: false,
          success: result.success,
          txHash: result.txHash,
          error: result.error,
        });
      } catch (error: any) {
        setTxStatus({
          loading: false,
          success: false,
          error: error.message,
        });
      }
    },
    [isConnected, account, txManager]
  );

  const claimStakingRewards = useCallback(async () => {
    if (!isConnected || !account || !txManager) {
      setTxStatus({
        loading: false,
        success: false,
        error: 'Please connect your wallet first',
      });
      return;
    }

    setTxStatus({ loading: true, success: false });

    try {
      const result = await advancedStakingService.claimRewards(
        { walletAddress: account },
        txManager
      );

      setTxStatus({
        loading: false,
        success: result.success,
        txHash: result.txHash,
        error: result.error,
      });
    } catch (error: any) {
      setTxStatus({
        loading: false,
        success: false,
        error: error.message,
      });
    }
  }, [isConnected, account, txManager]);

  // --- NFT Marketplace Methods ---

  const createNFTListing = useCallback(
    async (nftContract: string, tokenId: string, price: string) => {
      if (!isConnected || !account || !txManager) {
        setTxStatus({
          loading: false,
          success: false,
          error: 'Please connect your wallet first',
        });
        return;
      }

      setTxStatus({ loading: true, success: false });

      try {
        const params: CreateListingParams = {
          nftContract,
          tokenId,
          price,
        };

        const result = await nftMarketplaceService.createListing(params, account, txManager);

        setTxStatus({
          loading: false,
          success: result.success,
          txHash: result.txHash,
          error: result.error,
        });
      } catch (error: any) {
        setTxStatus({
          loading: false,
          success: false,
          error: error.message,
        });
      }
    },
    [isConnected, account, txManager]
  );

  const buyNFT = useCallback(
    async (listingId: string) => {
      if (!isConnected || !account || !txManager) {
        setTxStatus({
          loading: false,
          success: false,
          error: 'Please connect your wallet first',
        });
        return;
      }

      setTxStatus({ loading: true, success: false });

      try {
        const result = await nftMarketplaceService.buyItem(
          { listingId },
          account,
          txManager
        );

        setTxStatus({
          loading: false,
          success: result.success,
          txHash: result.txHash,
          error: result.error,
        });
      } catch (error: any) {
        setTxStatus({
          loading: false,
          success: false,
          error: error.message,
        });
      }
    },
    [isConnected, account, txManager]
  );

  const placeBidOnNFT = useCallback(
    async (listingId: string, bidAmount: string) => {
      if (!isConnected || !account || !txManager) {
        setTxStatus({
          loading: false,
          success: false,
          error: 'Please connect your wallet first',
        });
        return;
      }

      setTxStatus({ loading: true, success: false });

      try {
        const result = await nftMarketplaceService.placeBid(
          { listingId, bidAmount },
          account,
          txManager
        );

        setTxStatus({
          loading: false,
          success: result.success,
          txHash: result.txHash,
          error: result.error,
        });
      } catch (error: any) {
        setTxStatus({
          loading: false,
          success: false,
          error: error.message,
        });
      }
    },
    [isConnected, account, txManager]
  );

  const cancelNFTListing = useCallback(
    async (listingId: string) => {
      if (!isConnected || !account || !txManager) {
        setTxStatus({
          loading: false,
          success: false,
          error: 'Please connect your wallet first',
        });
        return;
      }

      setTxStatus({ loading: true, success: false });

      try {
        const result = await nftMarketplaceService.cancelListing(
          { listingId },
          account,
          txManager
        );

        setTxStatus({
          loading: false,
          success: result.success,
          txHash: result.txHash,
          error: result.error,
        });
      } catch (error: any) {
        setTxStatus({
          loading: false,
          success: false,
          error: error.message,
        });
      }
    },
    [isConnected, account, txManager]
  );

  return {
    // State
    isReady: !!txManager && isConnected,
    txStatus,
    resetStatus,

    // KeyGrow
    registerAsRenter,
    claimKeygrowAllocation,

    // Advanced Staking
    stakeNFT,
    unstakeNFT,
    claimStakingRewards,

    // NFT Marketplace
    createNFTListing,
    buyNFT,
    placeBidOnNFT,
    cancelNFTListing,
  };
}
