const axios = require('axios');

/**
 * Price Oracle Service
 * Fetches real-time crypto prices from multiple sources with fallbacks
 */

class PriceOracleService {
  constructor() {
    this.cache = {};
    this.CACHE_TTL = 60000; // 1 minute cache
    
    // Price source priority order (try in sequence until one works)
    this.PRICE_SOURCES = [
      'coingecko',
      'coinmarketcap',
      'binance',
      'fallback'
    ];
  }

  /**
   * Get current BNB price in USD
   */
  async getBNBPrice() {
    const cacheKey = 'BNB_USD';
    
    // Check cache first
    if (this.cache[cacheKey] && Date.now() - this.cache[cacheKey].timestamp < this.CACHE_TTL) {
      return this.cache[cacheKey].price;
    }

    // Try each source in order
    for (const source of this.PRICE_SOURCES) {
      try {
        let price;
        
        switch (source) {
          case 'coingecko':
            price = await this.fetchCoinGeckoPrice('binancecoin');
            break;
          case 'coinmarketcap':
            price = await this.fetchCoinMarketCapPrice('BNB');
            break;
          case 'binance':
            price = await this.fetchBinancePrice('BNBUSDT');
            break;
          case 'fallback':
            price = 600; // Conservative fallback estimate
            console.warn('⚠️ Using fallback BNB price: $600');
            break;
        }
        
        if (price && price > 0) {
          // Cache the price
          this.cache[cacheKey] = {
            price,
            timestamp: Date.now(),
            source
          };
          
          console.log(`✅ BNB price from ${source}: $${price}`);
          return price;
        }
      } catch (error) {
        console.error(`❌ ${source} price fetch failed:`, error.message);
        continue; // Try next source
      }
    }
    
    // All sources failed, return conservative estimate
    console.error('❌ All price sources failed, using fallback');
    return 600;
  }

  /**
   * Fetch from CoinGecko API (free, no API key needed)
   */
  async fetchCoinGeckoPrice(coinId) {
    const response = await axios.get(
      `https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd`,
      { timeout: 5000 }
    );
    
    return response.data[coinId]?.usd;
  }

  /**
   * Fetch from CoinMarketCap API (requires API key)
   */
  async fetchCoinMarketCapPrice(symbol) {
    const apiKey = process.env.COINMARKETCAP_API_KEY;
    if (!apiKey) {
      throw new Error('CoinMarketCap API key not configured');
    }
    
    const response = await axios.get(
      `https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest?symbol=${symbol}`,
      {
        headers: { 'X-CMC_PRO_API_KEY': apiKey },
        timeout: 5000
      }
    );
    
    return response.data.data[symbol]?.quote?.USD?.price;
  }

  /**
   * Fetch from Binance public API (no key needed)
   */
  async fetchBinancePrice(pair) {
    const response = await axios.get(
      `https://api.binance.com/api/v3/ticker/price?symbol=${pair}`,
      { timeout: 5000 }
    );
    
    return parseFloat(response.data.price);
  }

  /**
   * Get multiple token prices at once
   */
  async getTokenPrices(tokens) {
    const prices = {};
    
    for (const token of tokens) {
      switch (token.toUpperCase()) {
        case 'BNB':
        case 'WBNB':
          prices[token] = await this.getBNBPrice();
          break;
        case 'BUSD':
        case 'USDT':
        case 'USDC':
          prices[token] = 1.0; // Stablecoins
          break;
        default:
          prices[token] = await this.getGenericTokenPrice(token);
      }
    }
    
    return prices;
  }

  /**
   * Get price for any token (tries CoinGecko)
   */
  async getGenericTokenPrice(symbol) {
    try {
      const response = await axios.get(
        `https://api.coingecko.com/api/v3/simple/price?ids=${symbol.toLowerCase()}&vs_currencies=usd`,
        { timeout: 5000 }
      );
      
      return response.data[symbol.toLowerCase()]?.usd || 0;
    } catch (error) {
      console.error(`Failed to fetch ${symbol} price:`, error.message);
      return 0;
    }
  }

  /**
   * Clear price cache (useful for testing)
   */
  clearCache() {
    this.cache = {};
  }
}

module.exports = PriceOracleService;
