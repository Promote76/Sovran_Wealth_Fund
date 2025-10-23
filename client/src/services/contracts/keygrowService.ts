/**
 * KeyGrow Contract Service
 * Handles interactions with RealEstateAcquisitionFund contract
 */

import { TransactionManager, TransactionData } from '../transactionManager';

export interface RegisterRenterParams {
  walletAddress: string;
  tier: number; // 0=Bronze, 1=Silver, 2=Gold, 3=Platinum
}

export interface ClaimAllocationParams {
  walletAddress: string;
}

export interface UpdateTierParams {
  walletAddress: string;
  newTier: number;
}

export interface RenterInfo {
  registered: boolean;
  tier: number;
  totalContributed: string;
  lastClaimTime: number;
  multiplier: number;
}

export class KeyGrowService {
  private apiBase = '/api/keygrow';

  /**
   * Get renter information from contract
   */
  async getRenterInfo(walletAddress: string): Promise<RenterInfo | null> {
    try {
      const response = await fetch(`${this.apiBase}/renter/${walletAddress}`);
      const data = await response.json();

      if (data.success && data.data) {
        return data.data;
      }
      return null;
    } catch (error) {
      console.error('Failed to fetch renter info:', error);
      return null;
    }
  }

  /**
   * Get pending allocations for renter
   */
  async getPendingAllocations(walletAddress: string): Promise<string> {
    try {
      const response = await fetch(`${this.apiBase}/renter/${walletAddress}/pending`);
      const data = await response.json();

      if (data.success) {
        return data.data.pendingAllocation;
      }
      return '0';
    } catch (error) {
      console.error('Failed to fetch pending allocations:', error);
      return '0';
    }
  }

  /**
   * Build register as renter transaction
   */
  async buildRegisterTransaction(params: RegisterRenterParams): Promise<TransactionData | null> {
    try {
      const response = await fetch(`${this.apiBase}/tx/register`, {
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
      console.error('Failed to build register transaction:', error);
      return null;
    }
  }

  /**
   * Register as renter (full flow: build, sign, send, confirm)
   */
  async registerAsRenter(
    params: RegisterRenterParams,
    txManager: TransactionManager
  ): Promise<{ success: boolean; txHash?: string; error?: string }> {
    try {
      // Step 1: Build transaction
      console.log('🏗️ Building register transaction...');
      const txData = await this.buildRegisterTransaction(params);
      if (!txData) {
        return { success: false, error: 'Failed to build transaction' };
      }

      // Step 2: Sign and send transaction
      console.log('📝 Signing transaction...');
      const result = await txManager.signAndSendTransaction(txData, params.walletAddress);
      if (!result.success || !result.txHash) {
        return { success: false, error: result.error };
      }

      // Step 3: Wait for confirmation
      console.log('⏳ Waiting for confirmation...');
      await txManager.waitForTransaction(result.txHash, 1);

      // Step 4: Record in database
      console.log('💾 Recording transaction...');
      await this.confirmRegister(params.walletAddress, params.tier, result.txHash);

      return { success: true, txHash: result.txHash };
    } catch (error: any) {
      console.error('Register failed:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Build claim allocation transaction
   */
  async buildClaimTransaction(params: ClaimAllocationParams): Promise<TransactionData | null> {
    try {
      const response = await fetch(`${this.apiBase}/tx/claim`, {
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
   * Claim allocation (full flow)
   */
  async claimAllocation(
    params: ClaimAllocationParams,
    txManager: TransactionManager
  ): Promise<{ success: boolean; txHash?: string; error?: string }> {
    try {
      const txData = await this.buildClaimTransaction(params);
      if (!txData) {
        return { success: false, error: 'Failed to build transaction' };
      }

      const result = await txManager.signAndSendTransaction(txData, params.walletAddress);
      if (!result.success || !result.txHash) {
        return { success: false, error: result.error };
      }

      await txManager.waitForTransaction(result.txHash, 1);
      await this.confirmClaim(params.walletAddress, result.txHash);

      return { success: true, txHash: result.txHash };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Confirm register in database
   */
  private async confirmRegister(walletAddress: string, tier: number, txHash: string): Promise<void> {
    await fetch(`${this.apiBase}/confirm-register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ walletAddress, tier, txHash }),
    });
  }

  /**
   * Confirm claim in database
   */
  private async confirmClaim(walletAddress: string, txHash: string): Promise<void> {
    await fetch(`${this.apiBase}/confirm-claim`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ walletAddress, txHash }),
    });
  }
}

// Singleton instance
export const keygrowService = new KeyGrowService();
