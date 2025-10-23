const { ethers } = require('ethers');
const { getContractProvider } = require('./contractProvider');

const BASKET_INDEX_ADDRESS = '0x06b88f3Faa07215F6f5fb0A10A3F058D3f25ecF6';

const BASKET_INDEX_ABI = [
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function totalSupply() view returns (uint256)",
  "function balanceOf(address) view returns (uint256)",
  "function getUnderlyingAssets() view returns (address[])",
  "function getAssetWeights() view returns (uint256[])",
  "function assetWeights(address) view returns (uint256)",
  "function totalWeightBasis() view returns (uint256)",
  "function BASIS_POINTS() view returns (uint256)",
  "function mint(uint256 amount)",
  "function burn(uint256 amount)",
  "event AssetsUpdated(address[] assets, uint256[] weights)",
  "event Rebalanced(uint256 timestamp)"
];

class BasketIndexService {
  constructor() {
    this.contractProvider = getContractProvider();
    this.contract = null;
    this.initialized = false;
  }

  async initialize() {
    if (this.initialized) return;
    
    try {
      const provider = this.contractProvider.getProvider();
      this.contract = new ethers.Contract(BASKET_INDEX_ADDRESS, BASKET_INDEX_ABI, provider);
      this.initialized = true;
      console.log('✅ BasketIndexService initialized');
    } catch (error) {
      console.error('❌ BasketIndexService initialization error:', error);
      throw error;
    }
  }

  async getBasketInfo() {
    await this.initialize();
    
    try {
      const [name, symbol, totalSupply, assets, weights, basisPoints] = await Promise.all([
        this.contract.name(),
        this.contract.symbol(),
        this.contract.totalSupply(),
        this.contract.getUnderlyingAssets(),
        this.contract.getAssetWeights(),
        this.contract.BASIS_POINTS()
      ]);

      const composition = assets.map((asset, index) => ({
        address: asset,
        weight: weights[index].toString(),
        percentage: (Number(weights[index]) / Number(basisPoints) * 100).toFixed(2)
      }));

      return {
        name,
        symbol,
        totalSupply: ethers.formatEther(totalSupply),
        contractAddress: BASKET_INDEX_ADDRESS,
        composition,
        basisPoints: basisPoints.toString()
      };
    } catch (error) {
      console.error('❌ Get basket info error:', error);
      throw error;
    }
  }

  async getUserBalance(walletAddress) {
    await this.initialize();
    
    try {
      const balance = await this.contract.balanceOf(walletAddress);
      return {
        balance: ethers.formatEther(balance),
        walletAddress
      };
    } catch (error) {
      console.error('❌ Get user balance error:', error);
      throw error;
    }
  }

  async buildMintTx(amount) {
    await this.initialize();
    
    try {
      const amountWei = ethers.parseEther(amount.toString());
      
      const txData = await this.contract.mint.populateTransaction(amountWei);
      
      return {
        to: BASKET_INDEX_ADDRESS,
        data: txData.data,
        value: '0',
        amount: amount.toString()
      };
    } catch (error) {
      console.error('❌ Build mint tx error:', error);
      throw error;
    }
  }

  async buildBurnTx(amount) {
    await this.initialize();
    
    try {
      const amountWei = ethers.parseEther(amount.toString());
      
      const txData = await this.contract.burn.populateTransaction(amountWei);
      
      return {
        to: BASKET_INDEX_ADDRESS,
        data: txData.data,
        value: '0',
        amount: amount.toString()
      };
    } catch (error) {
      console.error('❌ Build burn tx error:', error);
      throw error;
    }
  }

  async estimateRequiredAssets(amount) {
    await this.initialize();
    
    try {
      const assets = await this.contract.getUnderlyingAssets();
      const weights = await this.contract.getAssetWeights();
      const basisPoints = await this.contract.BASIS_POINTS();
      
      const amountWei = ethers.parseEther(amount.toString());
      
      const required = assets.map((asset, index) => {
        const assetAmount = (amountWei * weights[index]) / basisPoints;
        return {
          address: asset,
          amount: ethers.formatEther(assetAmount),
          weight: weights[index].toString()
        };
      });

      return required;
    } catch (error) {
      console.error('❌ Estimate required assets error:', error);
      throw error;
    }
  }
}

module.exports = new BasketIndexService();
