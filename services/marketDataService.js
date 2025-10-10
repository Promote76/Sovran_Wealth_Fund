const axios = require('axios');
const Decimal = require('decimal.js');
const { Pool } = require('@neondatabase/serverless');
const { drizzle } = require('drizzle-orm/neon-serverless');
const ws = require('ws');
const { neonConfig } = require('@neondatabase/serverless');
const { marketQuotes } = require('../shared/schema');
const { eq, sql } = require('drizzle-orm');

// Initialize database connection
neonConfig.webSocketConstructor = ws;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool);

// Cache TTL in minutes
const CACHE_TTL_MINUTES = 5;

// Rate limit tracking
const rateLimits = {
  alphavantage: { calls: 0, resetTime: Date.now() + 60000 }, // 5 calls/minute
  fmp: { calls: 0, resetTime: Date.now() + 60000 }, // Reset per minute
  coingecko: { calls: 0, resetTime: Date.now() + 60000 } // 30 calls/minute
};

/**
 * Check if cached quote is still fresh
 */
function isCacheFresh(lastUpdated) {
  const now = new Date();
  const cacheTime = new Date(lastUpdated);
  const diffMinutes = (now - cacheTime) / (1000 * 60);
  return diffMinutes < CACHE_TTL_MINUTES;
}

/**
 * Check rate limit for provider
 */
function checkRateLimit(provider) {
  const limit = rateLimits[provider];
  const now = Date.now();
  
  if (now > limit.resetTime) {
    limit.calls = 0;
    limit.resetTime = now + 60000;
  }
  
  const maxCalls = {
    alphavantage: 5,
    fmp: 5,
    coingecko: 30
  };
  
  if (limit.calls >= maxCalls[provider]) {
    return false;
  }
  
  limit.calls++;
  return true;
}

/**
 * Fetch crypto quote from CoinGecko
 */
async function fetchCryptoQuote(symbol) {
  if (!checkRateLimit('coingecko')) {
    throw new Error('Rate limit exceeded for CoinGecko');
  }

  // Map common symbols to CoinGecko IDs
  const symbolMap = {
    'BTC': 'bitcoin',
    'ETH': 'ethereum',
    'BNB': 'binancecoin',
    'USDT': 'tether',
    'USDC': 'usd-coin',
    'ADA': 'cardano',
    'SOL': 'solana',
    'XRP': 'ripple',
    'DOT': 'polkadot',
    'DOGE': 'dogecoin',
    'MATIC': 'polygon',
    'AVAX': 'avalanche-2',
    'LINK': 'chainlink',
    'UNI': 'uniswap',
    'ATOM': 'cosmos'
  };

  const coinId = symbolMap[symbol.toUpperCase()] || symbol.toLowerCase();
  
  const response = await axios.get(`https://api.coingecko.com/api/v3/simple/price`, {
    params: {
      ids: coinId,
      vs_currencies: 'usd',
      include_24hr_vol: true,
      include_24hr_change: true,
      include_market_cap: true
    }
  });

  const data = response.data[coinId];
  if (!data) {
    throw new Error(`Crypto ${symbol} not found on CoinGecko`);
  }

  return {
    symbol: symbol.toUpperCase(),
    name: coinId.charAt(0).toUpperCase() + coinId.slice(1),
    type: 'crypto',
    price: new Decimal(data.usd || 0).toFixed(8),
    change: new Decimal(data.usd_24h_change || 0).toFixed(8),
    changePercent: new Decimal(data.usd_24h_change || 0).toFixed(4),
    volume: new Decimal(data.usd_24h_vol || 0).toFixed(2),
    marketCap: new Decimal(data.usd_market_cap || 0).toFixed(2),
    provider: 'coingecko',
    rawData: data,
    lastUpdated: new Date()
  };
}

/**
 * Fetch stock/ETF quote from Alpha Vantage
 */
async function fetchStockQuote(symbol) {
  if (!checkRateLimit('alphavantage')) {
    throw new Error('Rate limit exceeded for Alpha Vantage');
  }

  const apiKey = process.env.ALPHA_VANTAGE_API_KEY;
  if (!apiKey) {
    throw new Error('Alpha Vantage API key not configured');
  }

  const response = await axios.get('https://www.alphavantage.co/query', {
    params: {
      function: 'GLOBAL_QUOTE',
      symbol: symbol,
      apikey: apiKey
    }
  });

  const quote = response.data['Global Quote'];
  if (!quote || !quote['05. price']) {
    throw new Error(`Stock ${symbol} not found on Alpha Vantage`);
  }

  return {
    symbol: symbol.toUpperCase(),
    name: symbol.toUpperCase(),
    type: 'stock',
    price: new Decimal(quote['05. price'] || 0).toFixed(8),
    change: new Decimal(quote['09. change'] || 0).toFixed(8),
    changePercent: new Decimal((quote['10. change percent'] || '0').replace('%', '')).toFixed(4),
    volume: new Decimal(quote['06. volume'] || 0).toFixed(2),
    open: new Decimal(quote['02. open'] || 0).toFixed(8),
    high24h: new Decimal(quote['03. high'] || 0).toFixed(8),
    low24h: new Decimal(quote['04. low'] || 0).toFixed(8),
    previousClose: new Decimal(quote['08. previous close'] || 0).toFixed(8),
    provider: 'alphavantage',
    rawData: quote,
    lastUpdated: new Date()
  };
}

/**
 * Fetch stock/ETF/Bond/REIT/Commodity/Index quote from Financial Modeling Prep
 */
async function fetchFMPQuote(symbol, type = 'auto') {
  if (!checkRateLimit('fmp')) {
    throw new Error('Rate limit exceeded for FMP');
  }

  const apiKey = process.env.FMP_API_KEY;
  if (!apiKey) {
    throw new Error('FMP API key not configured');
  }

  const response = await axios.get(`https://financialmodelingprep.com/api/v3/quote/${symbol}`, {
    params: { apikey: apiKey }
  });

  const data = response.data[0];
  if (!data) {
    throw new Error(`Symbol ${symbol} not found on FMP`);
  }

  // Determine instrument type from FMP data
  let instrumentType = 'stock'; // default
  const name = data.name?.toLowerCase() || '';
  const exchange = data.exchangeShortName?.toUpperCase() || '';
  
  if (exchange.includes('ETF') || name.includes('etf')) {
    instrumentType = 'etf';
  } else if (name.includes('bond') || name.includes('treasury') || symbol.includes('TLT') || symbol.includes('AGG')) {
    instrumentType = 'bond';
  } else if (name.includes('reit') || data.sector === 'Real Estate') {
    instrumentType = 'reit';
  } else if (exchange.includes('COMMODITY') || ['GC', 'SI', 'CL', 'NG', 'GLD', 'SLV', 'USO'].includes(symbol.toUpperCase())) {
    instrumentType = 'commodity';
  } else if (['SPY', 'QQQ', 'DIA', 'IWM', 'SPX', 'NDX', 'DJI'].includes(symbol.toUpperCase())) {
    instrumentType = 'index';
  }
  
  // Override with explicit type if provided
  if (type !== 'auto' && type !== 'stock') {
    instrumentType = type;
  }

  return {
    symbol: symbol.toUpperCase(),
    name: data.name || symbol.toUpperCase(),
    type: instrumentType,
    price: new Decimal(data.price || 0).toFixed(8),
    change: new Decimal(data.change || 0).toFixed(8),
    changePercent: new Decimal(data.changesPercentage || 0).toFixed(4),
    volume: new Decimal(data.volume || 0).toFixed(2),
    marketCap: new Decimal(data.marketCap || 0).toFixed(2),
    open: new Decimal(data.open || 0).toFixed(8),
    high24h: new Decimal(data.dayHigh || 0).toFixed(8),
    low24h: new Decimal(data.dayLow || 0).toFixed(8),
    previousClose: new Decimal(data.previousClose || 0).toFixed(8),
    exchange: data.exchange || data.exchangeShortName,
    provider: 'fmp',
    rawData: data,
    lastUpdated: new Date()
  };
}

/**
 * Fetch commodity quote (Gold, Silver, Oil, etc.)
 */
async function fetchCommodityQuote(symbol) {
  // Use FMP for commodity ETFs (GLD, SLV, USO, etc.)
  return await fetchFMPQuote(symbol, 'commodity');
}

/**
 * Fetch index quote (SPY, QQQ, DIA, etc.)
 */
async function fetchIndexQuote(symbol) {
  // Use FMP for index ETFs
  return await fetchFMPQuote(symbol, 'index');
}

/**
 * Fetch bond quote (TLT, AGG, BND, etc.)
 */
async function fetchBondQuote(symbol) {
  // Use FMP for bond ETFs
  return await fetchFMPQuote(symbol, 'bond');
}

/**
 * Fetch REIT quote
 */
async function fetchREITQuote(symbol) {
  // Use FMP for REIT stocks
  return await fetchFMPQuote(symbol, 'reit');
}

/**
 * Get quote from cache or fetch from provider
 */
async function getQuote(symbol, type = 'auto') {
  try {
    // Try cache first
    const cached = await db.select()
      .from(marketQuotes)
      .where(eq(marketQuotes.symbol, symbol.toUpperCase()))
      .limit(1);

    if (cached.length > 0 && isCacheFresh(cached[0].lastUpdated)) {
      console.log(`✅ Cache hit for ${symbol}`);
      return {
        success: true,
        data: cached[0],
        cached: true
      };
    }

    // Determine provider based on type
    let quote;
    
    if (type === 'crypto' || (type === 'auto' && isCryptoSymbol(symbol))) {
      quote = await fetchCryptoQuote(symbol);
    } else if (type === 'commodity') {
      quote = await fetchCommodityQuote(symbol);
    } else if (type === 'index') {
      quote = await fetchIndexQuote(symbol);
    } else if (type === 'bond') {
      quote = await fetchBondQuote(symbol);
    } else if (type === 'reit') {
      quote = await fetchREITQuote(symbol);
    } else if (type === 'option') {
      // Options require special handling - use FMP with option type
      quote = await fetchFMPQuote(symbol, 'option');
    } else if (type === 'etf') {
      quote = await fetchFMPQuote(symbol, 'etf');
    } else {
      // Default: stock or auto-detect
      // Try FMP first (better rate limits), fallback to Alpha Vantage
      try {
        quote = await fetchFMPQuote(symbol, type);
      } catch (fmpError) {
        console.log(`FMP failed for ${symbol}, trying Alpha Vantage...`);
        quote = await fetchStockQuote(symbol);
      }
    }

    // Update or insert cache
    if (cached.length > 0) {
      await db.update(marketQuotes)
        .set({
          ...quote,
          lastUpdated: new Date()
        })
        .where(eq(marketQuotes.symbol, symbol.toUpperCase()));
    } else {
      await db.insert(marketQuotes)
        .values(quote);
    }

    console.log(`✅ Fetched fresh quote for ${symbol} (${quote.type}) from ${quote.provider}`);
    return {
      success: true,
      data: quote,
      cached: false
    };

  } catch (error) {
    console.error(`❌ Error fetching quote for ${symbol}:`, error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Check if symbol is likely a crypto
 */
function isCryptoSymbol(symbol) {
  const cryptoSymbols = ['BTC', 'ETH', 'BNB', 'USDT', 'USDC', 'ADA', 'SOL', 'XRP', 'DOT', 'DOGE', 'MATIC', 'AVAX', 'LINK', 'UNI', 'ATOM'];
  return cryptoSymbols.includes(symbol.toUpperCase());
}

/**
 * Get multiple quotes
 */
async function getMultipleQuotes(symbols, type = 'auto') {
  const results = await Promise.all(
    symbols.map(symbol => getQuote(symbol, type))
  );

  return {
    success: true,
    data: results.map(r => r.data).filter(Boolean),
    errors: results.filter(r => !r.success).map(r => r.error)
  };
}

/**
 * Search for instruments
 */
async function searchInstruments(query) {
  try {
    const results = await db.select()
      .from(marketQuotes)
      .where(sql`${marketQuotes.symbol} ILIKE ${`%${query}%`} OR ${marketQuotes.name} ILIKE ${`%${query}%`}`)
      .limit(20);

    return {
      success: true,
      data: results
    };
  } catch (error) {
    console.error('❌ Error searching instruments:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Clear stale cache entries
 */
async function clearStaleCache() {
  const staleTime = new Date(Date.now() - CACHE_TTL_MINUTES * 60 * 1000);
  
  try {
    const result = await db.delete(marketQuotes)
      .where(sql`${marketQuotes.lastUpdated} < ${staleTime}`);
    
    console.log(`✅ Cleared stale cache entries older than ${CACHE_TTL_MINUTES} minutes`);
    return { success: true, deleted: result.rowCount };
  } catch (error) {
    console.error('❌ Error clearing stale cache:', error);
    return { success: false, error: error.message };
  }
}

module.exports = {
  getQuote,
  getMultipleQuotes,
  searchInstruments,
  clearStaleCache,
  isCacheFresh
};
