/**
 * Advanced Staking Contract Service
 * Handles interactions with AdvancedStaking contract
 */

import { TransactionManager, TransactionData } from '../transactionManager';

export interface StakeNFTParams {
  nftContract: string;
  nftTokenId: string;
  tier: number; // 0=Bronze, 1=Silver, 2=Gold, 3=Platinum
}

export interface UnstakeNFTParams {
  stakeId: string;
}

export interface ClaimRewardsParams {
  walletAddress: string;
}

export interface UserStake {
  id: number;
  nftContract: string;
  nftTokenId: string;
  tier: number;
  stakedAt: string;
  rewards: string;
}

export class AdvancedStakingService {
  private apiBase = '/api/advanced-staking';

  /**
   * Get user's active stakes
   */
  async getUserStakes(walletAddress: string): Promise<UserStake[]> {
    try {
      const response = await fetch(`${this.apiBase}/user/${walletAddress}/stakes`);
      const data = await response.json();

      if (data.success && data.data) {
        return data.data;
      }
      return [];
    } catch (error) {
      console.error('Failed to fetch stakes:', error);
      return [];
    }
  }

  /**
   * Get pending rewards for user
   */
  async getPendingRewards(walletAddress: string): Promise<string> {
    try {
      const response = await fetch(`${this.apiBase}/user/${walletAddress}/rewards`);
      const data = await response.json();

      if (data.success && data.data) {
        return data.data.pendingRewards;
      }
      return '0';
    } catch (error) {
      console.error('Failed to fetch rewards:', error);
      return '0';
    }
  }

  /**
   * Get staking statistics
   */
  async getStakingStats(): Promise<any> {
    try {
      const response = await fetch(`${this.apiBase}/stats`);
      const data = await response.json();

      if (data.success && data.data) {
        return data.data;
      }
      return null;
    } catch (error) {
      console.error('Failed to fetch staking stats:', error);
      return null;
    }
  }

  /**
   * Build stake NFT transaction
   */
  async buildStakeTransaction(params: StakeNFTParams): Promise<TransactionData | null> {
    try {
      const response = await fetch(`${this.apiBase}/tx/stake`, {
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
      console.error('Failed to build stake transaction:', error);
      return null;
    }
  }

  /**
   * Stake NFT (full flow)
   */
  async stakeNFT(
    params: StakeNFTParams,
    walletAddress: string,
    txManager: TransactionManager
  ): Promise<{ success: boolean; txHash?: string; error?: string }> {
    try {
      const txData = await this.buildStakeTransaction(params);
      if (!txData) {
        return { success: false, error: 'Failed to build transaction' };
      }

      const result = await txManager.signAndSendTransaction(txData, walletAddress);
      if (!result.success || !result.txHash) {
        return { success: false, error: result.error };
      }

      await txManager.waitForTransaction(result.txHash, 1);
      await this.confirmStake(
        walletAddress,
        params.nftContract,
        params.nftTokenId,
        params.tier,
        result.txHash
      );

      return { success: true, txHash: result.txHash };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Build unstake NFT transaction
   */
  async buildUnstakeTransaction(params: UnstakeNFTParams): Promise<TransactionData | null> {
    try {
      const response = await fetch(`${this.apiBase}/tx/unstake`, {
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
      console.error('Failed to build unstake transaction:', error);
      return null;
    }
  }

  /**
   * Unstake NFT (full flow)
   */
  async unstakeNFT(
    params: UnstakeNFTParams,
    walletAddress: string,
    txManager: TransactionManager
  ): Promise<{ success: boolean; txHash?: string; error?: string }> {
    try {
      const txData = await this.buildUnstakeTransaction(params);
      if (!txData) {
        return { success: false, error: 'Failed to build transaction' };
      }

      const result = await txManager.signAndSendTransaction(txData, walletAddress);
      if (!result.success || !result.txHash) {
        return { success: false, error: result.error };
      }

      await txManager.waitForTransaction(result.txHash, 1);
      await this.confirmUnstake(params.stakeId, result.txHash);

      return { success: true, txHash: result.txHash };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Build claim rewards transaction
   */
  async buildClaimRewardsTransaction(params: ClaimRewardsParams): Promise<TransactionData | null> {
    try {
      const response = await fetch(`${this.apiBase}/tx/claim-rewards`, {
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
      console.error('Failed to build claim transaction:', error);
      return null;
    }
  }

  /**
   * Claim staking rewards (full flow)
   */
  async claimRewards(
    params: ClaimRewardsParams,
    txManager: TransactionManager
  ): Promise<{ success: boolean; txHash?: string; error?: string }> {
    try {
      const txData = await this.buildClaimRewardsTransaction(params);
      if (!txData) {
        return { success: false, error: 'Failed to build transaction' };
      }

      const result = await txManager.signAndSendTransaction(txData, params.walletAddress);
      if (!result.success || !result.txHash) {
        return { success: false, error: result.error };
      }

      await txManager.waitForTransaction(result.txHash, 1);
      await this.confirmClaimRewards(params.walletAddress, result.txHash);

      return { success: true, txHash: result.txHash };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  // Confirmation methods
  private async confirmStake(
    walletAddress: string,
    nftContract: string,
    nftTokenId: string,
    tier: number,
    txHash: string
  ): Promise<void> {
    await fetch(`${this.apiBase}/confirm-stake`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ walletAddress, nftContract, nftTokenId, tier, txHash }),
    });
  }

  private async confirmUnstake(stakeId: string, txHash: string): Promise<void> {
    await fetch(`${this.apiBase}/confirm-unstake`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stakeId, txHash }),
    });
  }

  private async confirmClaimRewards(walletAddress: string, txHash: string): Promise<void> {
    await fetch(`${this.apiBase}/confirm-claim-rewards`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ walletAddress, txHash }),
    });
  }
}

// Singleton instance
export const advancedStakingService = new AdvancedStakingService();
