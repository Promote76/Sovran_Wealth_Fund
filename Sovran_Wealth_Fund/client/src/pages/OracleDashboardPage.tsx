import React, { useState, useEffect } from 'react';

interface PriceFeed {
  symbol: string;
  price: string;
  change24h: string;
  isPositive: boolean;
  lastUpdated: string;
}

const OracleDashboardPage: React.FC = () => {
  const [priceFeeds, setPriceFeeds] = useState<PriceFeed[]>([]);
  const [selectedFeed, setSelectedFeed] = useState<string>('SWF/USD');

  useEffect(() => {
    // Mock price feed data
    const mockFeeds: PriceFeed[] = [
      { symbol: 'SWF/USD', price: '$1.245', change24h: '+5.23%', isPositive: true, lastUpdated: '2 mins ago' },
      { symbol: 'BTC/USD', price: '$67,234.50', change24h: '+2.45%', isPositive: true, lastUpdated: '1 min ago' },
      { symbol: 'ETH/USD', price: '$3,789.23', change24h: '-1.12%', isPositive: false, lastUpdated: '1 min ago' },
      { symbol: 'BNB/USD', price: '$425.67', change24h: '+3.78%', isPositive: true, lastUpdated: '2 mins ago' },
      { symbol: 'GOLD/USD', price: '$2,187.45', change24h: '+0.89%', isPositive: true, lastUpdated: '5 mins ago' },
      { symbol: 'EUR/USD', price: '$1.0834', change24h: '-0.23%', isPositive: false, lastUpdated: '3 mins ago' }
    ];
    
    setPriceFeeds(mockFeeds);
    
    // Simulate real-time updates
    const interval = setInterval(() => {
      setPriceFeeds(feeds => feeds.map(feed => ({
        ...feed,
        lastUpdated: Math.random() > 0.7 ? 'Just now' : feed.lastUpdated
      })));
    }, 5000);
    
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-gradient-to-br from-white via-blue-50 to-white min-h-screen">
        {/* Hero Section */}
      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-6 text-blue-800">
            Oracle <span className="text-blue-600">Dashboard</span>
          </h1>
          <p className="text-xl text-gray-700 max-w-3xl mx-auto">
            Real-time price feeds and market data powered by decentralized oracle networks. 
            Secure, accurate, and tamper-proof data for DeFi applications.
          </p>
        </div>

        {/* Oracle Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          <div className="bg-gradient-to-br from-white to-blue-50 border-2 border-blue-300 rounded-xl p-6 text-center shadow-lg">
            <div className="text-2xl font-bold text-blue-600 mb-2">24</div>
            <div className="text-gray-700">Active Feeds</div>
          </div>
          <div className="bg-gradient-to-br from-white to-blue-50 border-2 border-blue-300 rounded-xl p-6 text-center shadow-lg">
            <div className="text-2xl font-bold text-blue-600 mb-2">99.9%</div>
            <div className="text-gray-700">Uptime</div>
          </div>
          <div className="bg-gradient-to-br from-white to-blue-50 border-2 border-blue-300 rounded-xl p-6 text-center shadow-lg">
            <div className="text-2xl font-bold text-blue-600 mb-2">&lt; 1s</div>
            <div className="text-gray-700">Update Latency</div>
          </div>
          <div className="bg-gradient-to-br from-white to-blue-50 border-2 border-blue-300 rounded-xl p-6 text-center shadow-lg">
            <div className="text-2xl font-bold text-blue-600 mb-2">15</div>
            <div className="text-gray-700">Data Sources</div>
          </div>
        </div>

        {/* Price Feeds Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {priceFeeds.map((feed) => (
            <div
              key={feed.symbol}
              className={`bg-gradient-to-br from-white to-blue-50 border-2 rounded-xl p-6 cursor-pointer transition-all shadow-lg hover:shadow-xl ${
                selectedFeed === feed.symbol 
                  ? 'border-blue-500 ring-2 ring-blue-200' 
                  : 'border-blue-300 hover:border-blue-400'
              }`}
              onClick={() => setSelectedFeed(feed.symbol)}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-blue-800">{feed.symbol}</h3>
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              </div>
              
              <div className="space-y-2">
                <div className="text-2xl font-bold text-blue-700">{feed.price}</div>
                <div className="flex items-center justify-between">
                  <span className={`text-sm font-medium ${
                    feed.isPositive ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {feed.change24h}
                  </span>
                  <span className="text-xs text-gray-600">{feed.lastUpdated}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Selected Feed Details */}
        <div className="bg-gradient-to-br from-white to-blue-50 border-2 border-blue-300 rounded-xl p-8 mb-12 shadow-lg">
          <h2 className="text-2xl font-bold mb-6 text-blue-800">{selectedFeed} Price Feed Details</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Price Chart Placeholder */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-blue-700">Price History (24h)</h3>
              <div className="h-64 bg-blue-100 border-2 border-blue-200 rounded-lg flex items-center justify-center">
                <div className="text-gray-600">📈 Interactive price chart coming soon</div>
              </div>
            </div>
            
            {/* Feed Information */}
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4 text-blue-700">Feed Information</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Data Sources:</span>
                    <span className="font-semibold text-blue-700">5 providers</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Update Frequency:</span>
                    <span className="font-semibold text-blue-700">Every 30 seconds</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Deviation Threshold:</span>
                    <span className="font-semibold text-blue-700">0.5%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Network:</span>
                    <span className="font-semibold text-blue-700">Binance Smart Chain</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Contract Address:</span>
                    <span className="font-semibold text-blue-700 text-xs">0x123...ABC</span>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold mb-4 text-blue-700">Oracle Health</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Status:</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-green-600 font-semibold">Healthy</span>
                    </div>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Response Time:</span>
                    <span className="font-semibold text-blue-700">0.8s</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Consensus:</span>
                    <span className="font-semibold text-blue-700">100%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Oracle Features */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-100 border-2 border-blue-300 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">⚡</span>
            </div>
            <h3 className="text-lg font-semibold mb-2 text-blue-800">Real-Time Data</h3>
            <p className="text-gray-600">Sub-second latency for critical price feeds</p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-100 border-2 border-blue-300 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🛡️</span>
            </div>
            <h3 className="text-lg font-semibold mb-2 text-blue-800">Tamper-Proof</h3>
            <p className="text-gray-600">Cryptographically secured data integrity</p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-100 border-2 border-blue-300 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🔗</span>
            </div>
            <h3 className="text-lg font-semibold mb-2 text-blue-800">Decentralized</h3>
            <p className="text-gray-600">Multiple independent data sources</p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-100 border-2 border-blue-300 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">📊</span>
            </div>
            <h3 className="text-lg font-semibold mb-2 text-blue-800">High Accuracy</h3>
            <p className="text-gray-600">Aggregated from trusted market data providers</p>
          </div>
        </div>
      </div>
      </div>
  );
};

export default OracleDashboardPage;