const { ethers } = require('ethers');
const contractProvider = require('./contractProvider');

// PancakeSwap Contract Addresses
const ROUTER_ADDRESS = '0x10ED43C718714eb63d5aA57B78B54704E256024E';
const FACTORY_ADDRESS = '0xcA143Ce32Fe78f1f7019d7d551a6402fC5350c73';
const AXM_TOKEN = '0x83E17aEB148d9b4B7Be0BE7c87dD73531A5A5738'; // SWF Token
const WBNB_TOKEN = '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c';
const BUSD_TOKEN = '0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56';

// Known LP Pairs (created via addLiquidityETH)
const LP_PAIRS = {
  SWF_WBNB: '0x3aA970cD91f792427CF28Bc687B4713Ee26e2090'
};

// Minimal ABIs
const FACTORY_ABI = [
  'function getPair(address tokenA, address tokenB) external view returns (address pair)'
];

const PAIR_ABI = [
  'function getReserves() external view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast)',
  'function token0() external view returns (address)',
  'function token1() external view returns (address)',
  'function totalSupply() external view returns (uint)'
];

const ERC20_ABI = [
  'function decimals() external view returns (uint8)',
  'function symbol() external view returns (string)',
  'function name() external view returns (string)'
];

class PancakePoolService {
  constructor() {
    this.provider = null;
    this.factory = null;
    this.cache = {
      pairs: new Map(),
      lastUpdate: 0,
      ttl: 60000 // 1 minute cache
    };
  }

  async initialize() {
    if (!this.provider) {
      // Use BSC mainnet RPC directly
      const BSC_RPC = process.env.BSC_RPC_URL || 'https://bsc-dataseed1.binance.org';
      this.provider = new ethers.JsonRpcProvider(BSC_RPC);
      this.factory = new ethers.Contract(FACTORY_ADDRESS, FACTORY_ABI, this.provider);
      console.log('✅ PancakeSwap service initialized with BSC provider');
    }
  }

  async getPairInfo(tokenA, tokenB) {
    await this.initialize();
    
    // Normalize addresses to checksummed format (required by ethers v6)
    try {
      tokenA = ethers.getAddress(tokenA.toLowerCase());
      tokenB = ethers.getAddress(tokenB.toLowerCase());
    } catch (error) {
      throw new Error(`Invalid token address: ${error.message}`);
    }
    
    const cacheKey = `${tokenA}-${tokenB}`;
    const now = Date.now();
    
    // Return cached data if still valid
    if (this.cache.pairs.has(cacheKey) && now - this.cache.lastUpdate < this.cache.ttl) {
      return this.cache.pairs.get(cacheKey);
    }

    try {
      // Get pair address from factory
      const pairAddress = await this.factory.getPair(tokenA, tokenB);
      
      if (pairAddress === ethers.ZeroAddress) {
        return {
          exists: false,
          message: 'Pair does not exist on PancakeSwap'
        };
      }

      // Get pair contract
      const pairContract = new ethers.Contract(pairAddress, PAIR_ABI, this.provider);
      
      // Get reserves and token order
      const [reserves, token0, token1, totalSupply] = await Promise.all([
        pairContract.getReserves(),
        pairContract.token0(),
        pairContract.token1(),
        pairContract.totalSupply()
      ]);

      // Determine which reserve is which token
      const isToken0 = token0.toLowerCase() === tokenA.toLowerCase();
      const reserveA = isToken0 ? reserves.reserve0 : reserves.reserve1;
      const reserveB = isToken0 ? reserves.reserve1 : reserves.reserve0;

      // Get token decimals for proper formatting
      const tokenAContract = new ethers.Contract(tokenA, ERC20_ABI, this.provider);
      const tokenBContract = new ethers.Contract(tokenB, ERC20_ABI, this.provider);
      
      const [decimalsA, decimalsB, symbolA, symbolB] = await Promise.all([
        tokenAContract.decimals(),
        tokenBContract.decimals(),
        tokenAContract.symbol(),
        tokenBContract.symbol()
      ]);

      const pairInfo = {
        exists: true,
        pairAddress,
        tokenA,
        tokenB,
        symbolA,
        symbolB,
        decimalsA: Number(decimalsA),
        decimalsB: Number(decimalsB),
        reserveA: reserveA.toString(),
        reserveB: reserveB.toString(),
        totalSupply: totalSupply.toString(),
        // Calculate price ratio (how much B per A)
        priceAtoB: Number(reserveB) / Number(reserveA),
        priceBtoA: Number(reserveA) / Number(reserveB),
        timestamp: now
      };

      // Cache the result
      this.cache.pairs.set(cacheKey, pairInfo);
      this.cache.lastUpdate = now;

      return pairInfo;
    } catch (error) {
      console.error('❌ Get pair info error:', error);
      throw error;
    }
  }

  async getAXMBNBPair() {
    return this.getPairInfo(AXM_TOKEN, WBNB_TOKEN);
  }

  async getAXMBUSDPair() {
    return this.getPairInfo(AXM_TOKEN, BUSD_TOKEN);
  }

  async getAllAXMPairs() {
    try {
      const [bnbPair, busdPair] = await Promise.all([
        this.getAXMBNBPair().catch(err => ({ exists: false, error: err.message })),
        this.getAXMBUSDPair().catch(err => ({ exists: false, error: err.message }))
      ]);

      return {
        'AXM/BNB': bnbPair,
        'AXM/BUSD': busdPair
      };
    } catch (error) {
      console.error('❌ Get all AXM pairs error:', error);
      throw error;
    }
  }

  clearCache() {
    this.cache.pairs.clear();
    this.cache.lastUpdate = 0;
  }
}

module.exports = new PancakePoolService();
