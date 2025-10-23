/**
 * Transaction Manager Service
 * Handles building, signing, and submitting blockchain transactions
 * Integrates with backend contract services and WalletContext
 */

import { ethers } from 'ethers';

export interface TransactionData {
  to: string;
  data: string;
  value?: string;
  chainId: number;
}

export interface TransactionResult {
  success: boolean;
  txHash?: string;
  error?: string;
}

export class TransactionManager {
  private provider: any;

  constructor(provider: any) {
    this.provider = provider;
  }

  /**
   * Build, sign, and send a transaction
   * @param txData - Unsigned transaction data from backend
   * @param walletAddress - User's wallet address
   * @returns Transaction hash if successful
   */
  async signAndSendTransaction(
    txData: TransactionData,
    walletAddress: string
  ): Promise<TransactionResult> {
    try {
      console.log('📝 Signing transaction...', txData);

      // Prepare transaction parameters
      const txParams = {
        from: walletAddress,
        to: txData.to,
        data: txData.data,
        value: txData.value || '0x0',
      };

      // Request transaction signature from wallet
      const txHash = await this.provider.request({
        method: 'eth_sendTransaction',
        params: [txParams],
      });

      console.log('✅ Transaction sent:', txHash);
      return {
        success: true,
        txHash,
      };
    } catch (error: any) {
      console.error('❌ Transaction failed:', error);
      
      // Handle user rejection
      if (error.code === 4001 || error.message?.includes('User rejected')) {
        return {
          success: false,
          error: 'Transaction cancelled by user',
        };
      }

      return {
        success: false,
        error: error.message || 'Transaction failed',
      };
    }
  }

  /**
   * Wait for transaction confirmation
   * @param txHash - Transaction hash
   * @param confirmations - Number of confirmations to wait for (default: 1)
   * @returns Transaction receipt
   */
  async waitForTransaction(
    txHash: string,
    confirmations: number = 1
  ): Promise<any> {
    console.log(`⏳ Waiting for ${confirmations} confirmation(s)...`);
    
    // Create ethers provider from wallet provider
    const ethersProvider = new ethers.providers.Web3Provider(this.provider);
    
    // Wait for transaction
    const receipt = await ethersProvider.waitForTransaction(txHash, confirmations);
    
    console.log('✅ Transaction confirmed:', receipt);
    return receipt;
  }

  /**
   * Estimate gas for a transaction
   * @param txData - Transaction data
   * @param walletAddress - User's wallet address
   * @returns Estimated gas limit
   */
  async estimateGas(
    txData: TransactionData,
    walletAddress: string
  ): Promise<string> {
    try {
      const gasEstimate = await this.provider.request({
        method: 'eth_estimateGas',
        params: [{
          from: walletAddress,
          to: txData.to,
          data: txData.data,
          value: txData.value || '0x0',
        }],
      });

      return gasEstimate;
    } catch (error) {
      console.error('Failed to estimate gas:', error);
      // Return a default gas limit if estimation fails
      return '0x186a0'; // 100,000 gas
    }
  }

  /**
   * Get current gas price
   * @returns Current gas price in wei
   */
  async getGasPrice(): Promise<string> {
    const gasPrice = await this.provider.request({
      method: 'eth_gasPrice',
    });
    return gasPrice;
  }
}

/**
 * Helper function to format transaction value in ETH
 */
export function formatTransactionValue(valueWei: string): string {
  try {
    return ethers.utils.formatEther(valueWei);
  } catch {
    return '0';
  }
}

/**
 * Helper function to parse ETH amount to wei
 */
export function parseEthValue(ethAmount: string): string {
  try {
    return ethers.utils.parseEther(ethAmount).toString();
  } catch {
    return '0';
  }
}
