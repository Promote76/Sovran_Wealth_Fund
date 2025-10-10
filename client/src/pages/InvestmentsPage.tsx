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
              <h1 className="text-5xl font-bold text-white mb-2">Investment Platform</h1>
              <p className="text-xl text-blue-200">
                Trade 8 asset classes • Real-time market data • Advanced order types
              </p>
            </div>

            {/* Account Selector */}
            {accounts.length > 0 && (
              <div className="bg-white/10 backdrop-blur-md border border-blue-500/30 rounded-2xl p-6 mb-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                  <div>
                    <label className="text-blue-200 text-sm mb-2 block">Active Account</label>
                    <select 
                      value={selectedAccount || ''} 
                      onChange={(e) => setSelectedAccount(Number(e.target.value))}
                      className="bg-blue-900/50 border border-blue-500 text-white px-4 py-2 rounded-lg"
                    >
                      {accounts.map(acc => (
                        <option key={acc.id} value={acc.id}>
                          {acc.accountNumber} - {acc.accountType}
                        </option>
                      ))}
                    </select>
                  </div>
                  {currentAccount && (
                    <div className="mt-4 md:mt-0 grid grid-cols-2 gap-6">
                      <div>
                        <div className="text-blue-300 text-sm">Cash Balance</div>
                        <div className="text-2xl font-bold text-white">${parseFloat(currentAccount.cashBalance).toLocaleString()}</div>
                      </div>
                      <div>
                        <div className="text-blue-300 text-sm">Total Value</div>
                        <div className="text-2xl font-bold text-green-400">${parseFloat(currentAccount.totalValue).toLocaleString()}</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Navigation Tabs */}
            <div className="flex space-x-4 mb-6 overflow-x-auto">
              <button
                onClick={() => setActiveTab('overview')}
                className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                  activeTab === 'overview' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-white/10 text-blue-200 hover:bg-white/20'
                }`}
              >
                📊 Overview
              </button>
              <button
                onClick={() => setActiveTab('trade')}
                className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                  activeTab === 'trade' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-white/10 text-blue-200 hover:bg-white/20'
                }`}
              >
                💹 Trade
              </button>
              <button
                onClick={() => setActiveTab('holdings')}
                className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                  activeTab === 'holdings' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-white/10 text-blue-200 hover:bg-white/20'
                }`}
              >
                📈 Holdings
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                  activeTab === 'history' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-white/10 text-blue-200 hover:bg-white/20'
                }`}
              >
                📜 History
              </button>
            </div>

            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl p-6">
                    <div className="text-3xl mb-2">₿</div>
                    <h3 className="text-white font-bold mb-1">Crypto</h3>
                    <p className="text-blue-200 text-sm">BTC, ETH & more</p>
                  </div>
                  <div className="bg-gradient-to-br from-purple-600 to-purple-800 rounded-xl p-6">
                    <div className="text-3xl mb-2">📈</div>
                    <h3 className="text-white font-bold mb-1">Stocks</h3>
                    <p className="text-purple-200 text-sm">AAPL, TSLA, NVDA</p>
                  </div>
                  <div className="bg-gradient-to-br from-green-600 to-green-800 rounded-xl p-6">
                    <div className="text-3xl mb-2">📊</div>
                    <h3 className="text-white font-bold mb-1">ETFs</h3>
                    <p className="text-green-200 text-sm">SPY, QQQ, VOO</p>
                  </div>
                  <div className="bg-gradient-to-br from-yellow-600 to-yellow-800 rounded-xl p-6">
                    <div className="text-3xl mb-2">🥇</div>
                    <h3 className="text-white font-bold mb-1">Commodities</h3>
                    <p className="text-yellow-200 text-sm">Gold, Silver, Oil</p>
                  </div>
                </div>

                <div className="bg-white/10 backdrop-blur-md border border-blue-500/30 rounded-2xl p-6">
                  <h2 className="text-2xl font-bold text-white mb-4">Platform Features</h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-blue-900/30 rounded-lg p-4">
                      <div className="text-green-400 text-2xl mb-2">✅</div>
                      <h3 className="font-bold text-white mb-1">Market & Limit Orders</h3>
                      <p className="text-sm text-blue-200">Execute trades at market price or set limit orders</p>
                    </div>
                    <div className="bg-blue-900/30 rounded-lg p-4">
                      <div className="text-green-400 text-2xl mb-2">✅</div>
                      <h3 className="font-bold text-white mb-1">Real-time Pricing</h3>
                      <p className="text-sm text-blue-200">Live market data from multiple providers</p>
                    </div>
                    <div className="bg-blue-900/30 rounded-lg p-4">
                      <div className="text-green-400 text-2xl mb-2">✅</div>
                      <h3 className="font-bold text-white mb-1">P&L Tracking</h3>
                      <p className="text-sm text-blue-200">Automatic cost basis and gains calculation</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Trade Tab */}
            {activeTab === 'trade' && (
              <div className="bg-white/10 backdrop-blur-md border border-blue-500/30 rounded-2xl p-8">
                <h2 className="text-3xl font-bold text-white mb-6">Execute Trade</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Trade Form */}
                  <div className="space-y-4">
                    <div>
                      <label className="text-blue-200 text-sm mb-2 block">Trade Type</label>
                      <div className="flex space-x-4">
                        <button
                          onClick={() => setTradeType('BUY')}
                          className={`flex-1 py-3 rounded-lg font-bold transition-all ${
                            tradeType === 'BUY' ? 'bg-green-600 text-white' : 'bg-white/10 text-blue-200'
                          }`}
                        >
                          BUY
                        </button>
                        <button
                          onClick={() => setTradeType('SELL')}
                          className={`flex-1 py-3 rounded-lg font-bold transition-all ${
                            tradeType === 'SELL' ? 'bg-red-600 text-white' : 'bg-white/10 text-blue-200'
                          }`}
                        >
                          SELL
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="text-blue-200 text-sm mb-2 block">Symbol</label>
                      <div className="flex space-x-2">
                        <input
                          type="text"
                          value={tradeSymbol}
                          onChange={(e) => setTradeSymbol(e.target.value.toUpperCase())}
                          placeholder="BTC, AAPL, SPY..."
                          className="flex-1 bg-blue-900/50 border border-blue-500 text-white px-4 py-3 rounded-lg"
                        />
                        <button
                          onClick={getQuote}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold"
                        >
                          Get Quote
                        </button>
                      </div>
                    </div>

                    {quote && (
                      <div className="bg-blue-900/50 border border-blue-500 rounded-lg p-4">
                        <div className="text-blue-200 text-sm">Current Price</div>
                        <div className="text-3xl font-bold text-white">${parseFloat(quote.price).toLocaleString()}</div>
                      </div>
                    )}

                    <div>
                      <label className="text-blue-200 text-sm mb-2 block">Quantity</label>
                      <input
                        type="number"
                        value={tradeQuantity}
                        onChange={(e) => setTradeQuantity(e.target.value)}
                        placeholder="1"
                        className="w-full bg-blue-900/50 border border-blue-500 text-white px-4 py-3 rounded-lg"
                      />
                    </div>

                    <div>
                      <label className="text-blue-200 text-sm mb-2 block">Order Type</label>
                      <select
                        value={orderType}
                        onChange={(e) => setOrderType(e.target.value as 'MARKET' | 'LIMIT')}
                        className="w-full bg-blue-900/50 border border-blue-500 text-white px-4 py-3 rounded-lg"
                      >
                        <option value="MARKET">Market Order (Execute Now)</option>
                        <option value="LIMIT">Limit Order (Set Price)</option>
                      </select>
                    </div>

                    {orderType === 'LIMIT' && (
                      <div>
                        <label className="text-blue-200 text-sm mb-2 block">Limit Price</label>
                        <input
                          type="number"
                          step="0.01"
                          value={limitPrice}
                          onChange={(e) => setLimitPrice(e.target.value)}
                          placeholder="0.00"
                          className="w-full bg-blue-900/50 border border-blue-500 text-white px-4 py-3 rounded-lg"
                        />
                      </div>
                    )}

                    <button
                      onClick={executeTrade}
                      className={`w-full py-4 rounded-lg font-bold text-white text-lg transition-all ${
                        tradeType === 'BUY' 
                          ? 'bg-green-600 hover:bg-green-700' 
                          : 'bg-red-600 hover:bg-red-700'
                      }`}
                    >
                      {tradeType === 'BUY' ? 'Buy Now' : 'Sell Now'}
                    </button>

                    {tradeMessage && (
                      <div className={`p-4 rounded-lg ${
                        tradeMessage.includes('✅') ? 'bg-green-900/30 border border-green-500' : 'bg-red-900/30 border border-red-500'
                      }`}>
                        <p className="text-white">{tradeMessage}</p>
                      </div>
                    )}
                  </div>

                  {/* Asset Info */}
                  <div className="space-y-4">
                    <div className="bg-blue-900/30 rounded-lg p-6">
                      <h3 className="text-xl font-bold text-white mb-4">Supported Assets</h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between text-blue-200">
                          <span>Cryptocurrencies</span>
                          <span className="text-white">BTC, ETH</span>
                        </div>
                        <div className="flex justify-between text-blue-200">
                          <span>Stocks</span>
                          <span className="text-white">AAPL, TSLA, NVDA</span>
                        </div>
                        <div className="flex justify-between text-blue-200">
                          <span>ETFs</span>
                          <span className="text-white">SPY, QQQ, VOO</span>
                        </div>
                        <div className="flex justify-between text-blue-200">
                          <span>Commodities</span>
                          <span className="text-white">GLD, SLV, USO</span>
                        </div>
                        <div className="flex justify-between text-blue-200">
                          <span>REITs</span>
                          <span className="text-white">VNQ, IYR</span>
                        </div>
                        <div className="flex justify-between text-blue-200">
                          <span>Bonds</span>
                          <span className="text-white">TLT, AGG</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-yellow-900/30 border border-yellow-500/50 rounded-lg p-4">
                      <h4 className="font-bold text-yellow-300 mb-2">📝 Trading Info</h4>
                      <ul className="text-sm text-yellow-200 space-y-1">
                        <li>• Transaction fee: 0.1%</li>
                        <li>• Market orders execute instantly</li>
                        <li>• Limit orders execute when price triggers</li>
                        <li>• All trades are ACID-compliant</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Holdings Tab */}
            {activeTab === 'holdings' && (
              <div className="bg-white/10 backdrop-blur-md border border-blue-500/30 rounded-2xl p-8">
                <h2 className="text-3xl font-bold text-white mb-6">Portfolio Holdings</h2>
                
                {positions.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">📊</div>
                    <p className="text-xl text-blue-200">No positions yet. Start trading to build your portfolio!</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-blue-500/30">
                          <th className="text-left text-blue-300 py-3 px-4">Symbol</th>
                          <th className="text-right text-blue-300 py-3 px-4">Quantity</th>
                          <th className="text-right text-blue-300 py-3 px-4">Avg Cost</th>
                          <th className="text-right text-blue-300 py-3 px-4">Current Price</th>
                          <th className="text-right text-blue-300 py-3 px-4">Market Value</th>
                          <th className="text-right text-blue-300 py-3 px-4">P&L</th>
                        </tr>
                      </thead>
                      <tbody>
                        {positions.map((pos) => (
                          <tr key={pos.id} className="border-b border-blue-500/10">
                            <td className="py-4 px-4">
                              <div className="font-bold text-white">{pos.symbol}</div>
                            </td>
                            <td className="text-right text-white py-4 px-4">{parseFloat(pos.quantity).toFixed(4)}</td>
                            <td className="text-right text-blue-200 py-4 px-4">${parseFloat(pos.avgCost).toFixed(2)}</td>
                            <td className="text-right text-white py-4 px-4">${pos.currentPrice || '-'}</td>
                            <td className="text-right text-white py-4 px-4">${pos.marketValue || '-'}</td>
                            <td className={`text-right py-4 px-4 font-semibold ${
                              parseFloat(pos.unrealizedPnl || '0') >= 0 ? 'text-green-400' : 'text-red-400'
                            }`}>
                              {pos.unrealizedPnl ? `$${parseFloat(pos.unrealizedPnl).toFixed(2)}` : '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* History Tab */}
            {activeTab === 'history' && (
              <div className="bg-white/10 backdrop-blur-md border border-blue-500/30 rounded-2xl p-8">
                <h2 className="text-3xl font-bold text-white mb-6">Transaction History</h2>
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">📜</div>
                  <p className="text-xl text-blue-200">View your complete transaction history here</p>
                  <p className="text-sm text-blue-300 mt-2">API endpoint: /api/investments/accounts/{'{accountId}'}/transactions</p>
                </div>
              </div>
            )}

          </div>
        </div>
    </div>
  );
};

export default InvestmentsPage;
