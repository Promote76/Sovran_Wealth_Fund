const { ethers } = require('ethers');
const PriceOracleService = require('./priceOracleService');

/**
 * Axiom Prime Tier Service
 * Calculates user's Total Value Locked (TVL) across all contracts
 * Assigns membership tier based on TVL thresholds
 */

class TierService {
  constructor() {
    this.config = require('../../contracts-config.json');
    this.provider = new ethers.JsonRpcProvider(this.config.rpc);
    this.priceOracle = new PriceOracleService();
    
    // Tier thresholds in USD
    this.TIERS = {
      FREE: { min: 0, max: 4999, name: 'Free', multiplier: 1.0 },
      SILVER: { min: 5000, max: 24999, name: 'Silver', multiplier: 1.2 },
      GOLD: { min: 25000, max: 99999, name: 'Gold', multiplier: 1.4 },
      PLATINUM: { min: 100000, max: Infinity, name: 'Platinum', multiplier: 1.6 }
    };
    
    // Fee discounts by tier
    this.FEE_STRUCTURE = {
      FREE: { trading: 0.0008, realEstate: 0.020, nft: 0.0225, staking: 0.015 },
      SILVER: { trading: 0.0006, realEstate: 0.0175, nft: 0.020, staking: 0.0125 },
      GOLD: { trading: 0.0005, realEstate: 0.016, nft: 0.0175, staking: 0.011 },
      PLATINUM: { trading: 0.0004, realEstate: 0.015, nft: 0.0125, staking: 0.010 }
    };
  }

  /**
   * Calculate user's Total Value Locked (TVL) across all contracts
   * @param {string} userAddress - User's wallet address
   * @returns {Object} - Breakdown of holdings across contracts
   */
  async calculateTVL(userAddress) {
    try {
      const holdings = {
        realEstate: await this.getRealEstateHoldings(userAddress),
        staking: await this.getStakingHoldings(userAddress),
        liquidity: await this.getLiquidityHoldings(userAddress),
        governance: await this.getGovernanceHoldings(userAddress),
        basket: await this.getBasketHoldings(userAddress),
        totalUSD: 0
      };

      // Sum total in USD
      holdings.totalUSD = 
        holdings.realEstate.valueUSD +
        holdings.staking.valueUSD +
        holdings.liquidity.valueUSD +
        holdings.governance.valueUSD +
        holdings.basket.valueUSD;

      return holdings;
    } catch (error) {
      console.error('❌ TVL calculation error:', error.message);
      return {
        realEstate: { valueUSD: 0, count: 0 },
        staking: { valueUSD: 0, count: 0 },
        liquidity: { valueUSD: 0, count: 0 },
        governance: { valueUSD: 0, count: 0 },
        basket: { valueUSD: 0, count: 0 },
        totalUSD: 0,
        error: error.message
      };
    }
  }

  /**
   * Get user's real estate holdings
   */
  async getRealEstateHoldings(userAddress) {
    try {
      const contractAddress = this.config.contracts.RealEstateInvestor;
      const abiArtifact = require('../../client/src/abis/RealEstateInvestor.json');
      const contract = new ethers.Contract(contractAddress, abiArtifact.abi, this.provider);

      // Get investor stats
      const stats = await contract.investorStats(userAddress);
      const totalInvestedBNB = ethers.formatEther(stats.totalInvested);
      
      // Get real-time BNB price from oracle
      const bnbPriceUSD = await this.priceOracle.getBNBPrice();
      const valueUSD = parseFloat(totalInvestedBNB) * bnbPriceUSD;

      return {
        valueUSD,
        investedBNB: parseFloat(totalInvestedBNB),
        propertyCount: Number(stats.propertyCount),
        totalRentalEarned: ethers.formatEther(stats.totalRentalEarned)
      };
    } catch (error) {
      console.error('Real estate holdings error:', error.message);
      return { valueUSD: 0, count: 0 };
    }
  }

  /**
   * Get user's NFT staking holdings
   */
  async getStakingHoldings(userAddress) {
    try {
      const contractAddress = this.config.contracts.AdvancedStaking;
      const abiArtifact = require('../../client/src/abis/AdvancedStaking.json');
      const contract = new ethers.Contract(contractAddress, abiArtifact.abi, this.provider);

      // Get user's staked NFTs
      const stakedNFTs = await contract.getUserStakedNFTs(userAddress);
      
      // Estimate value: 0.1 BNB per NFT average
      const bnbPriceUSD = await this.priceOracle.getBNBPrice();
      const avgNFTValueBNB = 0.1;
      const valueUSD = stakedNFTs.length * avgNFTValueBNB * bnbPriceUSD;

      return {
        valueUSD,
        count: stakedNFTs.length,
        nfts: stakedNFTs
      };
    } catch (error) {
      console.error('Staking holdings error:', error.message);
      return { valueUSD: 0, count: 0 };
    }
  }

  /**
   * Get user's liquidity provider holdings
   */
  async getLiquidityHoldings(userAddress) {
    try {
      // Check multiple vaults
      const vaults = [
        { address: this.config.contracts.LiquidityVault, name: 'Main Vault' },
        // Add more vaults as deployed
      ];

      let totalValueUSD = 0;
      let totalStaked = 0;

      for (const vault of vaults) {
        try {
          const abiArtifact = require('../../client/src/abis/LiquidityVault.json');
          const contract = new ethers.Contract(vault.address, abiArtifact.abi, this.provider);
          
          const balance = await contract.balanceOf(userAddress);
          const stakedBNB = ethers.formatEther(balance);
          
          const bnbPriceUSD = await this.priceOracle.getBNBPrice();
          totalValueUSD += parseFloat(stakedBNB) * bnbPriceUSD;
          totalStaked += parseFloat(stakedBNB);
        } catch (err) {
          console.log(`Vault ${vault.name} check skipped:`, err.message);
        }
      }

      return {
        valueUSD: totalValueUSD,
        stakedBNB: totalStaked
      };
    } catch (error) {
      console.error('Liquidity holdings error:', error.message);
      return { valueUSD: 0 };
    }
  }

  /**
   * Get user's governance token holdings
   */
  async getGovernanceHoldings(userAddress) {
    try {
      const contractAddress = this.config.contracts.GovernanceDividendPool;
      const abiArtifact = require('../../client/src/abis/GovernanceDividendPool.json');
      const contract = new ethers.Contract(contractAddress, abiArtifact.abi, this.provider);

      const balance = await contract.balanceOf(userAddress);
      const stakedTokens = ethers.formatEther(balance);
      
      // Assume 1 token = $1 USD for simplicity (could fetch from DEX)
      const tokenPriceUSD = 1;
      const valueUSD = parseFloat(stakedTokens) * tokenPriceUSD;

      return {
        valueUSD,
        stakedTokens: parseFloat(stakedTokens)
      };
    } catch (error) {
      console.error('Governance holdings error:', error.message);
      return { valueUSD: 0 };
    }
  }

  /**
   * Get user's basket index holdings
   */
  async getBasketHoldings(userAddress) {
    try {
      const contractAddress = this.config.contracts.BasketIndex;
      const abi = [
        'function balanceOf(address account) view returns (uint256)'
      ];
      const contract = new ethers.Contract(contractAddress, abi, this.provider);

      const balance = await contract.balanceOf(userAddress);
      const tokens = ethers.formatEther(balance);
      
      // Assume 1 basket token = $10 USD
      const tokenPriceUSD = 10;
      const valueUSD = parseFloat(tokens) * tokenPriceUSD;

      return {
        valueUSD,
        tokens: parseFloat(tokens)
      };
    } catch (error) {
      console.error('Basket holdings error:', error.message);
      return { valueUSD: 0 };
    }
  }

  /**
   * Determine user's tier based on TVL
   * @param {number} tvlUSD - Total Value Locked in USD
   * @returns {Object} - Tier information
   */
  getTierFromTVL(tvlUSD) {
    if (tvlUSD >= this.TIERS.PLATINUM.min) {
      return { ...this.TIERS.PLATINUM, fees: this.FEE_STRUCTURE.PLATINUM };
    } else if (tvlUSD >= this.TIERS.GOLD.min) {
      return { ...this.TIERS.GOLD, fees: this.FEE_STRUCTURE.GOLD };
    } else if (tvlUSD >= this.TIERS.SILVER.min) {
      return { ...this.TIERS.SILVER, fees: this.FEE_STRUCTURE.SILVER };
    } else {
      return { ...this.TIERS.FREE, fees: this.FEE_STRUCTURE.FREE };
    }
  }

  /**
   * Get complete tier information for a user
   * @param {string} userAddress - User's wallet address
   * @returns {Object} - Complete tier info with TVL breakdown
   */
  async getUserTierInfo(userAddress) {
    const holdings = await this.calculateTVL(userAddress);
    const tier = this.getTierFromTVL(holdings.totalUSD);
    
    // Calculate distance to next tier
    let nextTier = null;
    let progressToNext = 0;
    
    if (tier.name === 'Free') {
      nextTier = this.TIERS.SILVER;
      progressToNext = (holdings.totalUSD / nextTier.min) * 100;
    } else if (tier.name === 'Silver') {
      nextTier = this.TIERS.GOLD;
      progressToNext = ((holdings.totalUSD - tier.min) / (nextTier.min - tier.min)) * 100;
    } else if (tier.name === 'Gold') {
      nextTier = this.TIERS.PLATINUM;
      progressToNext = ((holdings.totalUSD - tier.min) / (nextTier.min - tier.min)) * 100;
    } else {
      nextTier = null; // Already at top tier
      progressToNext = 100;
    }

    return {
      currentTier: tier,
      holdings,
      nextTier,
      progressToNext: Math.min(progressToNext, 100),
      amountToNextTier: nextTier ? nextTier.min - holdings.totalUSD : 0
    };
  }

  /**
   * Calculate fee for a transaction based on user's tier
   * @param {string} userAddress - User's wallet address
   * @param {string} feeType - Type of fee (trading, realEstate, nft, staking)
   * @param {number} amount - Transaction amount in USD
   * @returns {Object} - Fee calculation
   */
  async calculateFee(userAddress, feeType, amount) {
    const tierInfo = await this.getUserTierInfo(userAddress);
    const feeRate = tierInfo.currentTier.fees[feeType];
    const feeAmount = amount * feeRate;
    
    return {
      tier: tierInfo.currentTier.name,
      feeRate,
      feeAmount,
      netAmount: amount - feeAmount,
      multiplier: tierInfo.currentTier.multiplier
    };
  }
}

module.exports = TierService;
