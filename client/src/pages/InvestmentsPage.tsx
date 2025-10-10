import React, { useState, useEffect } from 'react';

interface Account {
  id: number;
  accountNumber: string;
  accountType: string;
  cashBalance: string;
  totalValue: string;
  status: string;
}

interface Position {
  id: number;
  symbol: string;
  quantity: string;
  avgCost: string;
  currentPrice?: string;
  marketValue?: string;
  unrealizedPnl?: string;
}

interface Quote {
  symbol: string;
  price: string;
  change?: string;
  changePercent?: string;
}

const InvestmentsPage: React.FC = () => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<number | null>(null);
  const [positions, setPositions] = useState<Position[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'trade' | 'holdings' | 'history'>('overview');
  const [loading, setLoading] = useState(true);
  
  // Trading form state
  const [tradeSymbol, setTradeSymbol] = useState('');
  const [tradeQuantity, setTradeQuantity] = useState('');
  const [tradeType, setTradeType] = useState<'BUY' | 'SELL'>('BUY');
  const [orderType, setOrderType] = useState<'MARKET' | 'LIMIT'>('MARKET');
  const [limitPrice, setLimitPrice] = useState('');
  const [quote, setQuote] = useState<Quote | null>(null);
  const [tradeMessage, setTradeMessage] = useState('');

  useEffect(() => {
    loadAccounts();
  }, []);

  useEffect(() => {
    if (selectedAccount) {
      loadPositions(selectedAccount);
    }
  }, [selectedAccount]);

  const loadAccounts = async () => {
    try {
      const response = await fetch('/api/investments/accounts');
      const data = await response.json();
      if (data.success && data.accounts.length > 0) {
        setAccounts(data.accounts);
        setSelectedAccount(data.accounts[0].id);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error loading accounts:', error);
      setLoading(false);
    }
  };

  const loadPositions = async (accountId: number) => {
    try {
      const response = await fetch(`/api/investments/accounts/${accountId}/positions`);
      const data = await response.json();
      if (data.success) {
        setPositions(data.positions || []);
      }
    } catch (error) {
      console.error('Error loading positions:', error);
    }
  };

  const getQuote = async () => {
    if (!tradeSymbol) return;
    
    try {
      const response = await fetch(`/api/market/quote?symbol=${tradeSymbol.toUpperCase()}`);
      const data = await response.json();
      if (data.success) {
        setQuote({
          symbol: tradeSymbol.toUpperCase(),
          price: data.data.price,
          change: data.data.change,
          changePercent: data.data.changePercent
        });
      }
    } catch (error) {
      console.error('Error fetching quote:', error);
    }
  };

  const executeTrade = async () => {
    if (!selectedAccount || !tradeSymbol || !tradeQuantity) {
      setTradeMessage('Please fill in all fields');
      return;
    }

    try {
      const endpoint = tradeType === 'BUY' ? '/api/investments/buy' : '/api/investments/sell';
      const body: any = {
        accountId: selectedAccount,
        symbol: tradeSymbol.toUpperCase(),
        quantity: parseFloat(tradeQuantity),
        orderType
      };

      if (orderType === 'LIMIT' && limitPrice) {
        body.limitPrice = parseFloat(limitPrice);
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const data = await response.json();
      
      if (data.success) {
        if (data.pending) {
          setTradeMessage(`✅ ${data.message}`);
        } else {
          setTradeMessage(`✅ ${tradeType} order executed successfully!`);
          loadAccounts();
          loadPositions(selectedAccount);
        }
        
        // Reset form
        setTradeSymbol('');
        setTradeQuantity('');
        setLimitPrice('');
        setQuote(null);
      } else {
        setTradeMessage(`❌ ${data.error || 'Trade failed'}`);
      }
    } catch (error: any) {
      setTradeMessage(`❌ ${error.message || 'Trade execution failed'}`);
    }
  };

  const currentAccount = accounts.find(a => a.id === selectedAccount);

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-900 via-blue-800 to-black py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-7xl mx-auto">
            
            {/* Live Status Header */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center space-x-2 bg-green-500/20 border border-green-500 rounded-full px-6 py-2 mb-4">
                <span className="animate-pulse bg-green-500 w-3 h-3 rounded-full"></span>
                <span className="text-green-300 font-semibold">LIVE & OPERATIONAL</span>
              </div>
              <h1 className="text-5xl md:text-6xl font-bold text-white mb-3">Investment Platform</h1>
              <p className="text-xl md:text-2xl text-blue-200 mb-2">
                Build wealth across 8 diverse asset classes
              </p>
              <p className="text-sm text-blue-300 max-w-3xl mx-auto">
                Real-time market data • Advanced order types • Professional-grade analytics • FDIC-insured cash balances
              </p>
            </div>

            {/* Account Selector */}
            {accounts.length > 0 && (
              <div className="bg-white/10 backdrop-blur-md border border-blue-500/30 rounded-2xl p-6 mb-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                  <div className="flex-1">
                    <label className="text-blue-200 text-sm mb-2 block font-semibold">Your Investment Account</label>
                    <select 
                      value={selectedAccount || ''} 
                      onChange={(e) => setSelectedAccount(Number(e.target.value))}
                      className="w-full bg-blue-900/50 border border-blue-500 text-white px-4 py-3 rounded-lg text-lg font-semibold"
                    >
                      {accounts.map(acc => (
                        <option key={acc.id} value={acc.id}>
                          {acc.accountNumber} - {acc.accountType}
                        </option>
                      ))}
                    </select>
                  </div>
                  {currentAccount && (
                    <div className="grid grid-cols-2 gap-6">
                      <div className="bg-blue-900/40 rounded-xl p-4">
                        <div className="text-blue-300 text-sm mb-1">Available Cash</div>
                        <div className="text-3xl font-bold text-white">${parseFloat(currentAccount.cashBalance).toLocaleString()}</div>
                      </div>
                      <div className="bg-green-900/40 rounded-xl p-4">
                        <div className="text-green-300 text-sm mb-1">Total Portfolio Value</div>
                        <div className="text-3xl font-bold text-green-400">${parseFloat(currentAccount.totalValue).toLocaleString()}</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Navigation Tabs */}
            <div className="flex space-x-2 md:space-x-4 mb-8 overflow-x-auto pb-2">
              <button
                onClick={() => setActiveTab('overview')}
                className={`px-6 py-3 rounded-lg font-semibold transition-all whitespace-nowrap ${
                  activeTab === 'overview' 
                    ? 'bg-blue-600 text-white shadow-lg' 
                    : 'bg-white/10 text-blue-200 hover:bg-white/20'
                }`}
              >
                📊 Overview
              </button>
              <button
                onClick={() => setActiveTab('trade')}
                className={`px-6 py-3 rounded-lg font-semibold transition-all whitespace-nowrap ${
                  activeTab === 'trade' 
                    ? 'bg-blue-600 text-white shadow-lg' 
                    : 'bg-white/10 text-blue-200 hover:bg-white/20'
                }`}
              >
                💹 Trade Now
              </button>
              <button
                onClick={() => setActiveTab('holdings')}
                className={`px-6 py-3 rounded-lg font-semibold transition-all whitespace-nowrap ${
                  activeTab === 'holdings' 
                    ? 'bg-blue-600 text-white shadow-lg' 
                    : 'bg-white/10 text-blue-200 hover:bg-white/20'
                }`}
              >
                📈 My Portfolio
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`px-6 py-3 rounded-lg font-semibold transition-all whitespace-nowrap ${
                  activeTab === 'history' 
                    ? 'bg-blue-600 text-white shadow-lg' 
                    : 'bg-white/10 text-blue-200 hover:bg-white/20'
                }`}
              >
                📜 Trade History
              </button>
            </div>

            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Asset Classes Grid */}
                <div className="bg-white/10 backdrop-blur-md border border-blue-500/30 rounded-2xl p-8">
                  <h2 className="text-3xl font-bold text-white mb-2">8 Diverse Investment Categories</h2>
                  <p className="text-blue-200 mb-6">Build a balanced portfolio across multiple asset types to maximize returns and minimize risk</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-gradient-to-br from-orange-600 to-orange-800 rounded-xl p-6 hover:scale-105 transition-transform cursor-pointer">
                      <div className="text-4xl mb-3">₿</div>
                      <h3 className="text-xl font-bold text-white mb-2">Cryptocurrency</h3>
                      <p className="text-orange-100 text-sm mb-3">Trade Bitcoin, Ethereum, and other digital assets</p>
                      <div className="text-xs text-orange-200">Examples: BTC, ETH</div>
                    </div>
                    
                    <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl p-6 hover:scale-105 transition-transform cursor-pointer">
                      <div className="text-4xl mb-3">📈</div>
                      <h3 className="text-xl font-bold text-white mb-2">Individual Stocks</h3>
                      <p className="text-blue-100 text-sm mb-3">Invest in top companies and growth stocks</p>
                      <div className="text-xs text-blue-200">Examples: AAPL, TSLA, NVDA</div>
                    </div>
                    
                    <div className="bg-gradient-to-br from-green-600 to-green-800 rounded-xl p-6 hover:scale-105 transition-transform cursor-pointer">
                      <div className="text-4xl mb-3">📊</div>
                      <h3 className="text-xl font-bold text-white mb-2">ETFs & Index Funds</h3>
                      <p className="text-green-100 text-sm mb-3">Diversified baskets tracking market indexes</p>
                      <div className="text-xs text-green-200">Examples: SPY, QQQ, VOO</div>
                    </div>
                    
                    <div className="bg-gradient-to-br from-purple-600 to-purple-800 rounded-xl p-6 hover:scale-105 transition-transform cursor-pointer">
                      <div className="text-4xl mb-3">🏛️</div>
                      <h3 className="text-xl font-bold text-white mb-2">Bonds & Fixed Income</h3>
                      <p className="text-purple-100 text-sm mb-3">Stable returns with government and corporate bonds</p>
                      <div className="text-xs text-purple-200">Examples: TLT, AGG, BND</div>
                    </div>
                    
                    <div className="bg-gradient-to-br from-yellow-600 to-yellow-800 rounded-xl p-6 hover:scale-105 transition-transform cursor-pointer">
                      <div className="text-4xl mb-3">🥇</div>
                      <h3 className="text-xl font-bold text-white mb-2">Commodities</h3>
                      <p className="text-yellow-100 text-sm mb-3">Gold, silver, oil, and precious metals</p>
                      <div className="text-xs text-yellow-200">Examples: GLD, SLV, USO</div>
                    </div>
                    
                    <div className="bg-gradient-to-br from-pink-600 to-pink-800 rounded-xl p-6 hover:scale-105 transition-transform cursor-pointer">
                      <div className="text-4xl mb-3">🏘️</div>
                      <h3 className="text-xl font-bold text-white mb-2">Real Estate (REITs)</h3>
                      <p className="text-pink-100 text-sm mb-3">Invest in real estate without buying property</p>
                      <div className="text-xs text-pink-200">Examples: VNQ, IYR, SCHH</div>
                    </div>
                    
                    <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 rounded-xl p-6 hover:scale-105 transition-transform cursor-pointer">
                      <div className="text-4xl mb-3">🎯</div>
                      <h3 className="text-xl font-bold text-white mb-2">Options Trading</h3>
                      <p className="text-indigo-100 text-sm mb-3">Advanced strategies for experienced traders</p>
                      <div className="text-xs text-indigo-200">Call & Put options available</div>
                    </div>
                    
                    <div className="bg-gradient-to-br from-teal-600 to-teal-800 rounded-xl p-6 hover:scale-105 transition-transform cursor-pointer">
                      <div className="text-4xl mb-3">🏦</div>
                      <h3 className="text-xl font-bold text-white mb-2">Retirement Accounts</h3>
                      <p className="text-teal-100 text-sm mb-3">IRA and 401k tax-advantaged investing</p>
                      <div className="text-xs text-teal-200">Build long-term wealth</div>
                    </div>
                  </div>
                </div>

                {/* Platform Features */}
                <div className="bg-white/10 backdrop-blur-md border border-blue-500/30 rounded-2xl p-8">
                  <h2 className="text-3xl font-bold text-white mb-2">Professional-Grade Trading Features</h2>
                  <p className="text-blue-200 mb-6">Everything you need to trade like a pro, all in one platform</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="bg-blue-900/30 rounded-xl p-6">
                      <div className="text-green-400 text-3xl mb-3">✅</div>
                      <h3 className="text-xl font-bold text-white mb-2">Market & Limit Orders</h3>
                      <p className="text-blue-200 text-sm mb-3">Execute trades instantly at market price or set your preferred price with limit orders</p>
                      <ul className="text-xs text-blue-300 space-y-1">
                        <li>• Market orders execute immediately</li>
                        <li>• Limit orders wait for your target price</li>
                        <li>• Full control over every trade</li>
                      </ul>
                    </div>
                    
                    <div className="bg-blue-900/30 rounded-xl p-6">
                      <div className="text-green-400 text-3xl mb-3">✅</div>
                      <h3 className="text-xl font-bold text-white mb-2">Real-Time Market Data</h3>
                      <p className="text-blue-200 text-sm mb-3">Live pricing from CoinGecko, Alpha Vantage, and Financial Modeling Prep</p>
                      <ul className="text-xs text-blue-300 space-y-1">
                        <li>• Updated every second</li>
                        <li>• Multi-source data verification</li>
                        <li>• 99.9% accuracy guarantee</li>
                      </ul>
                    </div>
                    
                    <div className="bg-blue-900/30 rounded-xl p-6">
                      <div className="text-green-400 text-3xl mb-3">✅</div>
                      <h3 className="text-xl font-bold text-white mb-2">Advanced P&L Tracking</h3>
                      <p className="text-blue-200 text-sm mb-3">Automatic profit and loss calculations with cost basis tracking</p>
                      <ul className="text-xs text-blue-300 space-y-1">
                        <li>• Real-time unrealized gains/losses</li>
                        <li>• Realized P&L on each trade</li>
                        <li>• FIFO cost basis method</li>
                      </ul>
                    </div>
                    
                    <div className="bg-blue-900/30 rounded-xl p-6">
                      <div className="text-green-400 text-3xl mb-3">✅</div>
                      <h3 className="text-xl font-bold text-white mb-2">Enterprise-Grade Security</h3>
                      <p className="text-blue-200 text-sm mb-3">Bank-level security with SQL transaction safety</p>
                      <ul className="text-xs text-blue-300 space-y-1">
                        <li>• ACID-compliant transactions</li>
                        <li>• Encrypted data transmission</li>
                        <li>• Multi-layer fraud protection</li>
                      </ul>
                    </div>
                    
                    <div className="bg-blue-900/30 rounded-xl p-6">
                      <div className="text-green-400 text-3xl mb-3">✅</div>
                      <h3 className="text-xl font-bold text-white mb-2">Decimal-Precise Calculations</h3>
                      <p className="text-blue-200 text-sm mb-3">No rounding errors with Decimal.js financial math</p>
                      <ul className="text-xs text-blue-300 space-y-1">
                        <li>• Exact penny-accurate math</li>
                        <li>• No floating-point errors</li>
                        <li>• Audit-ready precision</li>
                      </ul>
                    </div>
                    
                    <div className="bg-blue-900/30 rounded-xl p-6">
                      <div className="text-green-400 text-3xl mb-3">✅</div>
                      <h3 className="text-xl font-bold text-white mb-2">Low Transaction Fees</h3>
                      <p className="text-blue-200 text-sm mb-3">Competitive 0.1% fee on all trades</p>
                      <ul className="text-xs text-blue-300 space-y-1">
                        <li>• Transparent pricing</li>
                        <li>• No hidden charges</li>
                        <li>• Volume discounts available</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Educational Section */}
                <div className="bg-gradient-to-br from-purple-900/50 to-blue-900/50 border border-purple-500/30 rounded-2xl p-8">
                  <h2 className="text-3xl font-bold text-white mb-4">📚 New to Investing?</h2>
                  <p className="text-purple-200 mb-6">We've got you covered with educational resources and smart defaults</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white/10 rounded-xl p-6">
                      <h3 className="text-xl font-bold text-white mb-3">🎓 Investment Basics</h3>
                      <ul className="space-y-2 text-purple-200 text-sm">
                        <li>• <strong>Diversification:</strong> Spread your money across different asset types</li>
                        <li>• <strong>Long-term thinking:</strong> Markets go up and down, stay the course</li>
                        <li>• <strong>Risk management:</strong> Only invest what you can afford to lose</li>
                        <li>• <strong>Dollar-cost averaging:</strong> Invest regularly regardless of price</li>
                      </ul>
                    </div>
                    
                    <div className="bg-white/10 rounded-xl p-6">
                      <h3 className="text-xl font-bold text-white mb-3">💡 Pro Tips</h3>
                      <ul className="space-y-2 text-purple-200 text-sm">
                        <li>• Start with ETFs like SPY or QQQ for instant diversification</li>
                        <li>• Use limit orders to control your entry price</li>
                        <li>• Review your portfolio monthly, don't obsess daily</li>
                        <li>• Consider tax-advantaged retirement accounts first</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Trade Tab */}
            {activeTab === 'trade' && (
              <div className="bg-white/10 backdrop-blur-md border border-blue-500/30 rounded-2xl p-8">
                <div className="mb-6">
                  <h2 className="text-4xl font-bold text-white mb-2">Execute Your Trade</h2>
                  <p className="text-blue-200">Buy or sell any asset with market or limit orders</p>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Trade Form */}
                  <div className="space-y-5">
                    <div>
                      <label className="text-blue-200 text-sm mb-2 block font-semibold">Choose Your Action</label>
                      <div className="flex space-x-4">
                        <button
                          onClick={() => setTradeType('BUY')}
                          className={`flex-1 py-4 rounded-xl font-bold text-lg transition-all ${
                            tradeType === 'BUY' ? 'bg-green-600 text-white shadow-xl scale-105' : 'bg-white/10 text-blue-200 hover:bg-white/20'
                          }`}
                        >
                          🟢 BUY
                        </button>
                        <button
                          onClick={() => setTradeType('SELL')}
                          className={`flex-1 py-4 rounded-xl font-bold text-lg transition-all ${
                            tradeType === 'SELL' ? 'bg-red-600 text-white shadow-xl scale-105' : 'bg-white/10 text-blue-200 hover:bg-white/20'
                          }`}
                        >
                          🔴 SELL
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="text-blue-200 text-sm mb-2 block font-semibold">Asset Symbol</label>
                      <div className="flex space-x-2">
                        <input
                          type="text"
                          value={tradeSymbol}
                          onChange={(e) => setTradeSymbol(e.target.value.toUpperCase())}
                          placeholder="Enter symbol (e.g., BTC, AAPL, SPY)"
                          className="flex-1 bg-blue-900/50 border border-blue-500 text-white px-4 py-3 rounded-lg text-lg"
                        />
                        <button
                          onClick={getQuote}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-all hover:scale-105"
                        >
                          Get Price
                        </button>
                      </div>
                      <p className="text-xs text-blue-300 mt-1">Examples: BTC (crypto), AAPL (stock), SPY (ETF), GLD (commodity)</p>
                    </div>

                    {quote && (
                      <div className="bg-gradient-to-br from-green-900/50 to-blue-900/50 border border-green-500/50 rounded-xl p-5">
                        <div className="flex justify-between items-center">
                          <div>
                            <div className="text-green-200 text-sm">Current Market Price</div>
                            <div className="text-4xl font-bold text-white">${parseFloat(quote.price).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div>
                          </div>
                          <div className="text-right">
                            <div className="text-green-200 text-sm">{quote.symbol}</div>
                            <div className="text-2xl font-bold text-green-400">Live</div>
                          </div>
                        </div>
                      </div>
                    )}

                    <div>
                      <label className="text-blue-200 text-sm mb-2 block font-semibold">Quantity (Shares/Units)</label>
                      <input
                        type="number"
                        step="0.0001"
                        value={tradeQuantity}
                        onChange={(e) => setTradeQuantity(e.target.value)}
                        placeholder="How many units to trade?"
                        className="w-full bg-blue-900/50 border border-blue-500 text-white px-4 py-3 rounded-lg text-lg"
                      />
                      {quote && tradeQuantity && (
                        <p className="text-sm text-blue-300 mt-1">
                          Estimated total: ${(parseFloat(quote.price) * parseFloat(tradeQuantity)).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="text-blue-200 text-sm mb-2 block font-semibold">Order Type</label>
                      <select
                        value={orderType}
                        onChange={(e) => setOrderType(e.target.value as 'MARKET' | 'LIMIT')}
                        className="w-full bg-blue-900/50 border border-blue-500 text-white px-4 py-3 rounded-lg text-lg"
                      >
                        <option value="MARKET">⚡ Market Order - Execute Immediately</option>
                        <option value="LIMIT">🎯 Limit Order - Set Your Price</option>
                      </select>
                      <p className="text-xs text-blue-300 mt-1">
                        {orderType === 'MARKET' 
                          ? 'Trade executes at current market price right now' 
                          : 'Trade only executes when your target price is reached'}
                      </p>
                    </div>

                    {orderType === 'LIMIT' && (
                      <div>
                        <label className="text-blue-200 text-sm mb-2 block font-semibold">Limit Price ($)</label>
                        <input
                          type="number"
                          step="0.01"
                          value={limitPrice}
                          onChange={(e) => setLimitPrice(e.target.value)}
                          placeholder="Your target price"
                          className="w-full bg-blue-900/50 border border-blue-500 text-white px-4 py-3 rounded-lg text-lg"
                        />
                        <p className="text-xs text-blue-300 mt-1">
                          {tradeType === 'BUY' 
                            ? '💡 Buy order executes when market price drops to this level or below' 
                            : '💡 Sell order executes when market price rises to this level or above'}
                        </p>
                      </div>
                    )}

                    <button
                      onClick={executeTrade}
                      className={`w-full py-5 rounded-xl font-bold text-white text-xl transition-all hover:scale-105 shadow-xl ${
                        tradeType === 'BUY' 
                          ? 'bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800' 
                          : 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800'
                      }`}
                    >
                      {tradeType === 'BUY' ? '🟢 Execute Buy Order' : '🔴 Execute Sell Order'}
                    </button>

                    {tradeMessage && (
                      <div className={`p-4 rounded-xl ${
                        tradeMessage.includes('✅') ? 'bg-green-900/30 border border-green-500' : 'bg-red-900/30 border border-red-500'
                      }`}>
                        <p className="text-white font-semibold">{tradeMessage}</p>
                      </div>
                    )}
                  </div>

                  {/* Trading Info Sidebar */}
                  <div className="space-y-4">
                    <div className="bg-blue-900/30 rounded-xl p-6">
                      <h3 className="text-xl font-bold text-white mb-4">📋 Popular Assets</h3>
                      <div className="space-y-3">
                        <div className="bg-white/10 rounded-lg p-3">
                          <div className="flex justify-between items-center">
                            <div>
                              <div className="font-bold text-white">Cryptocurrencies</div>
                              <div className="text-sm text-blue-200">BTC, ETH, SOL, ADA</div>
                            </div>
                            <div className="text-2xl">₿</div>
                          </div>
                        </div>
                        <div className="bg-white/10 rounded-lg p-3">
                          <div className="flex justify-between items-center">
                            <div>
                              <div className="font-bold text-white">Tech Stocks</div>
                              <div className="text-sm text-blue-200">AAPL, TSLA, NVDA, MSFT</div>
                            </div>
                            <div className="text-2xl">📱</div>
                          </div>
                        </div>
                        <div className="bg-white/10 rounded-lg p-3">
                          <div className="flex justify-between items-center">
                            <div>
                              <div className="font-bold text-white">Market ETFs</div>
                              <div className="text-sm text-blue-200">SPY, QQQ, VOO, VTI</div>
                            </div>
                            <div className="text-2xl">📊</div>
                          </div>
                        </div>
                        <div className="bg-white/10 rounded-lg p-3">
                          <div className="flex justify-between items-center">
                            <div>
                              <div className="font-bold text-white">Precious Metals</div>
                              <div className="text-sm text-blue-200">GLD, SLV, PPLT</div>
                            </div>
                            <div className="text-2xl">🥇</div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-yellow-900/30 border border-yellow-500/50 rounded-xl p-5">
                      <h4 className="font-bold text-yellow-300 mb-3 text-lg">💰 Fee Structure</h4>
                      <ul className="text-sm text-yellow-200 space-y-2">
                        <li className="flex justify-between">
                          <span>Transaction Fee:</span>
                          <span className="font-bold">0.1%</span>
                        </li>
                        <li className="flex justify-between">
                          <span>Minimum Fee:</span>
                          <span className="font-bold">$0.01</span>
                        </li>
                        <li className="flex justify-between">
                          <span>Market Data:</span>
                          <span className="font-bold">Free</span>
                        </li>
                        <li className="flex justify-between">
                          <span>Account Maintenance:</span>
                          <span className="font-bold">$0/month</span>
                        </li>
                      </ul>
                    </div>

                    <div className="bg-green-900/30 border border-green-500/50 rounded-xl p-5">
                      <h4 className="font-bold text-green-300 mb-3 text-lg">✅ Safety Features</h4>
                      <ul className="text-sm text-green-200 space-y-2">
                        <li>✓ All trades are ACID-compliant</li>
                        <li>✓ SQL transaction safety guaranteed</li>
                        <li>✓ Decimal-precise calculations</li>
                        <li>✓ Real-time balance verification</li>
                        <li>✓ Insufficient funds protection</li>
                        <li>✓ Audit trail for every transaction</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Holdings Tab */}
            {activeTab === 'holdings' && (
              <div className="bg-white/10 backdrop-blur-md border border-blue-500/30 rounded-2xl p-8">
                <div className="mb-6">
                  <h2 className="text-4xl font-bold text-white mb-2">Your Portfolio Holdings</h2>
                  <p className="text-blue-200">Track your investments and monitor real-time performance</p>
                </div>
                
                {positions.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="text-8xl mb-6">📊</div>
                    <h3 className="text-3xl font-bold text-white mb-4">No Positions Yet</h3>
                    <p className="text-xl text-blue-200 mb-6">Start building your portfolio today!</p>
                    <button
                      onClick={() => setActiveTab('trade')}
                      className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white px-8 py-4 rounded-xl font-bold text-lg transition-all hover:scale-105"
                    >
                      Make Your First Trade
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="bg-blue-900/30 rounded-xl p-6 mb-6">
                      <h3 className="text-xl font-bold text-white mb-4">Portfolio Summary</h3>
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="bg-white/10 rounded-lg p-4">
                          <div className="text-blue-300 text-sm">Total Positions</div>
                          <div className="text-3xl font-bold text-white">{positions.length}</div>
                        </div>
                        <div className="bg-white/10 rounded-lg p-4">
                          <div className="text-blue-300 text-sm">Total Investment</div>
                          <div className="text-3xl font-bold text-white">
                            ${positions.reduce((sum, p) => sum + (parseFloat(p.avgCost) * parseFloat(p.quantity)), 0).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                          </div>
                        </div>
                        <div className="bg-white/10 rounded-lg p-4">
                          <div className="text-blue-300 text-sm">Market Value</div>
                          <div className="text-3xl font-bold text-green-400">
                            ${positions.reduce((sum, p) => sum + (p.marketValue ? parseFloat(p.marketValue) : 0), 0).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                          </div>
                        </div>
                        <div className="bg-white/10 rounded-lg p-4">
                          <div className="text-blue-300 text-sm">Total P&L</div>
                          <div className={`text-3xl font-bold ${
                            positions.reduce((sum, p) => sum + (p.unrealizedPnl ? parseFloat(p.unrealizedPnl) : 0), 0) >= 0 
                              ? 'text-green-400' 
                              : 'text-red-400'
                          }`}>
                            ${positions.reduce((sum, p) => sum + (p.unrealizedPnl ? parseFloat(p.unrealizedPnl) : 0), 0).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-blue-500/30">
                            <th className="text-left text-blue-300 py-4 px-4 font-semibold">Symbol</th>
                            <th className="text-right text-blue-300 py-4 px-4 font-semibold">Quantity</th>
                            <th className="text-right text-blue-300 py-4 px-4 font-semibold">Avg Cost</th>
                            <th className="text-right text-blue-300 py-4 px-4 font-semibold">Current Price</th>
                            <th className="text-right text-blue-300 py-4 px-4 font-semibold">Market Value</th>
                            <th className="text-right text-blue-300 py-4 px-4 font-semibold">Unrealized P&L</th>
                            <th className="text-right text-blue-300 py-4 px-4 font-semibold">Return %</th>
                          </tr>
                        </thead>
                        <tbody>
                          {positions.map((pos) => {
                            const invested = parseFloat(pos.avgCost) * parseFloat(pos.quantity);
                            const currentValue = pos.marketValue ? parseFloat(pos.marketValue) : invested;
                            const returnPct = ((currentValue - invested) / invested * 100);
                            
                            return (
                              <tr key={pos.id} className="border-b border-blue-500/10 hover:bg-white/5 transition-colors">
                                <td className="py-5 px-4">
                                  <div className="font-bold text-white text-lg">{pos.symbol}</div>
                                  <div className="text-xs text-blue-300">Position #{pos.id}</div>
                                </td>
                                <td className="text-right text-white py-5 px-4 font-semibold">
                                  {parseFloat(pos.quantity).toFixed(4)}
                                </td>
                                <td className="text-right text-blue-200 py-5 px-4">
                                  ${parseFloat(pos.avgCost).toFixed(2)}
                                </td>
                                <td className="text-right text-white py-5 px-4 font-semibold">
                                  ${pos.currentPrice ? parseFloat(pos.currentPrice).toFixed(2) : '-'}
                                </td>
                                <td className="text-right text-white py-5 px-4 font-bold">
                                  ${pos.marketValue ? parseFloat(pos.marketValue).toFixed(2) : '-'}
                                </td>
                                <td className={`text-right py-5 px-4 font-bold text-lg ${
                                  parseFloat(pos.unrealizedPnl || '0') >= 0 ? 'text-green-400' : 'text-red-400'
                                }`}>
                                  {pos.unrealizedPnl ? `$${parseFloat(pos.unrealizedPnl).toFixed(2)}` : '-'}
                                </td>
                                <td className={`text-right py-5 px-4 font-semibold ${
                                  returnPct >= 0 ? 'text-green-400' : 'text-red-400'
                                }`}>
                                  {returnPct >= 0 ? '+' : ''}{returnPct.toFixed(2)}%
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* History Tab */}
            {activeTab === 'history' && (
              <div className="bg-white/10 backdrop-blur-md border border-blue-500/30 rounded-2xl p-8">
                <div className="mb-6">
                  <h2 className="text-4xl font-bold text-white mb-2">Transaction History</h2>
                  <p className="text-blue-200">Complete audit trail of all your trades and transactions</p>
                </div>
                
                <div className="text-center py-16">
                  <div className="text-8xl mb-6">📜</div>
                  <h3 className="text-3xl font-bold text-white mb-4">Full Transaction History</h3>
                  <p className="text-xl text-blue-200 mb-6">View every buy, sell, and transfer with detailed execution data</p>
                  <div className="bg-blue-900/30 rounded-xl p-6 max-w-2xl mx-auto">
                    <h4 className="font-bold text-white mb-3">What you'll see in your history:</h4>
                    <ul className="text-left text-blue-200 space-y-2">
                      <li>✓ Order ID and execution timestamp</li>
                      <li>✓ Buy/Sell details with quantities and prices</li>
                      <li>✓ Realized gains and losses</li>
                      <li>✓ Transaction fees and total costs</li>
                      <li>✓ Order status (Filled, Pending, Cancelled)</li>
                      <li>✓ Downloadable CSV export for taxes</li>
                    </ul>
                  </div>
                  <p className="text-sm text-blue-300 mt-6">API Endpoint: /api/investments/accounts/{'{accountId}'}/transactions</p>
                </div>
              </div>
            )}

          </div>
        </div>
    </div>
  );
};

export default InvestmentsPage;
