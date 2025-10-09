import React, { useState, useEffect } from 'react';

interface LiquidityPool {
  id: number;
  name: string;
  token1: string;
  token2: string;
  tvl: string;
  apy: string;
  volume24h: string;
  myLiquidity: string;
  status: 'Active' | 'Paused' | 'Ended';
}

const LiquidityManagementPage: React.FC = () => {
  const [pools, setPools] = useState<LiquidityPool[]>([]);
  const [selectedPool, setSelectedPool] = useState<LiquidityPool | null>(null);
  const [activeTab, setActiveTab] = useState('pools');
  const [totalLiquidity, setTotalLiquidity] = useState('0');

  useEffect(() => {
    // Mock liquidity pool data
    const mockPools: LiquidityPool[] = [
      {
        id: 1,
        name: 'SWF/USDC',
        token1: 'SWF',
        token2: 'USDC',
        tvl: '$2,547,892',
        apy: '15.6%',
        volume24h: '$145,230',
        myLiquidity: '$5,432',
        status: 'Active'
      },
      {
        id: 2,
        name: 'SWF/BNB',
        token1: 'SWF',
        token2: 'BNB',
        tvl: '$1,892,456',
        apy: '22.3%',
        volume24h: '$89,567',
        myLiquidity: '$0',
        status: 'Active'
      },
      {
        id: 3,
        name: 'SWF/ETH',
        token1: 'SWF',
        token2: 'ETH',
        tvl: '$3,456,789',
        apy: '18.9%',
        volume24h: '$234,567',
        myLiquidity: '$2,145',
        status: 'Active'
      },
      {
        id: 4,
        name: 'GOLD/USDC',
        token1: 'GOLD',
        token2: 'USDC',
        tvl: '$892,345',
        apy: '12.4%',
        volume24h: '$45,890',
        myLiquidity: '$1,250',
        status: 'Active'
      }
    ];
    
    setPools(mockPools);
    
    // Calculate total user liquidity
    const total = mockPools.reduce((sum, pool) => {
      return sum + parseFloat(pool.myLiquidity.replace('$', '').replace(',', ''));
    }, 0);
    setTotalLiquidity(total.toLocaleString());
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active': return 'bg-green-500';
      case 'Paused': return 'bg-yellow-500';
      case 'Ended': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="bg-gradient-to-br from-white via-blue-50 to-white min-h-screen">

      {/* Hero Section */}
      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-6 text-blue-800">
            Liquidity <span className="text-blue-600">Management</span>
          </h1>
          <p className="text-xl text-gray-700 max-w-3xl mx-auto">
            Provide liquidity to SWF trading pairs and earn competitive rewards. 
            Manage your positions, track performance, and optimize your yield strategies.
          </p>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          <div className="bg-gradient-to-br from-white to-blue-50 border-2 border-blue-300 rounded-xl p-6 text-center shadow-lg">
            <div className="text-2xl font-bold text-blue-600 mb-2">$8.79M</div>
            <div className="text-gray-700">Total Value Locked</div>
          </div>
          <div className="bg-gradient-to-br from-white to-blue-50 border-2 border-blue-300 rounded-xl p-6 text-center shadow-lg">
            <div className="text-2xl font-bold text-blue-600 mb-2">17.3%</div>
            <div className="text-gray-700">Average APY</div>
          </div>
          <div className="bg-gradient-to-br from-white to-blue-50 border-2 border-blue-300 rounded-xl p-6 text-center shadow-lg">
            <div className="text-2xl font-bold text-blue-600 mb-2">$514K</div>
            <div className="text-gray-700">24h Volume</div>
          </div>
          <div className="bg-gradient-to-br from-white to-blue-50 border-2 border-blue-300 rounded-xl p-6 text-center shadow-lg">
            <div className="text-2xl font-bold text-blue-600 mb-2">1,247</div>
            <div className="text-gray-700">Liquidity Providers</div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex justify-center mb-8">
          <div className="bg-white border-2 border-blue-300 rounded-lg p-1 shadow-lg">
            {['pools', 'my-positions', 'analytics'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-3 rounded-lg capitalize font-medium transition-colors ${
                  activeTab === tab
                    ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg'
                    : 'text-gray-700 hover:text-blue-800 hover:bg-blue-100'
                }`}
              >
                {tab.replace('-', ' ')}
              </button>
            ))}
          </div>
        </div>

        {/* Liquidity Pools Tab */}
        {activeTab === 'pools' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {pools.map((pool) => (
                <div
                  key={pool.id}
                  className="bg-gradient-to-br from-white to-blue-50 border-2 border-blue-300 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <h3 className="text-xl font-bold text-blue-800">{pool.name}</h3>
                      <span className={`px-2 py-1 rounded text-xs font-medium text-white ${getStatusColor(pool.status)}`}>
                        {pool.status}
                      </span>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-blue-600">{pool.apy}</div>
                      <div className="text-xs text-gray-600">APY</div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div>
                      <div className="text-gray-600 text-sm">Total Value Locked</div>
                      <div className="font-semibold text-blue-700">{pool.tvl}</div>
                    </div>
                    <div>
                      <div className="text-gray-600 text-sm">24h Volume</div>
                      <div className="font-semibold text-blue-700">{pool.volume24h}</div>
                    </div>
                    <div>
                      <div className="text-gray-600 text-sm">My Liquidity</div>
                      <div className="font-semibold text-blue-600">{pool.myLiquidity}</div>
                    </div>
                    <div>
                      <div className="text-gray-600 text-sm">Pool Share</div>
                      <div className="font-semibold text-blue-700">0.12%</div>
                    </div>
                  </div>

                  <div className="flex space-x-3">
                    <button 
                      className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg shadow-lg transition-all duration-200"
                      onClick={() => setSelectedPool(pool)}
                    >
                      Add Liquidity
                    </button>
                    {parseFloat(pool.myLiquidity.replace('$', '').replace(',', '')) > 0 && (
                      <button className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-400 to-blue-500 hover:from-blue-500 hover:to-blue-600 text-white rounded-lg shadow-lg transition-all duration-200">
                        Remove Liquidity
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* My Positions Tab */}
        {activeTab === 'my-positions' && (
          <div className="space-y-6">
            <div className="bg-gradient-to-br from-white to-blue-50 border-2 border-blue-300 rounded-xl p-6 shadow-lg">
              <h2 className="text-2xl font-bold mb-6 text-blue-800">My Liquidity Positions</h2>
              
              {pools.filter(pool => parseFloat(pool.myLiquidity.replace('$', '').replace(',', '')) > 0).length > 0 ? (
                <div className="space-y-4">
                  {pools
                    .filter(pool => parseFloat(pool.myLiquidity.replace('$', '').replace(',', '')) > 0)
                    .map((pool) => (
                    <div key={pool.id} className="bg-blue-100 border-2 border-blue-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-bold text-blue-800">{pool.name}</h3>
                        <div className="text-right">
                          <div className="font-bold text-blue-600">{pool.myLiquidity}</div>
                          <div className="text-sm text-gray-600">My Position</div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-4 mb-4">
                        <div>
                          <div className="text-gray-600 text-sm">Earned Fees</div>
                          <div className="font-semibold text-blue-600">$45.67</div>
                        </div>
                        <div>
                          <div className="text-gray-600 text-sm">APY</div>
                          <div className="font-semibold text-blue-700">{pool.apy}</div>
                        </div>
                        <div>
                          <div className="text-gray-600 text-sm">Pool Share</div>
                          <div className="font-semibold text-blue-700">0.12%</div>
                        </div>
                      </div>
                      
                      <div className="flex space-x-3">
                        <button className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg shadow-lg transition-all duration-200">
                          Add More
                        </button>
                        <button className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-lg shadow-lg transition-all duration-200">
                          Claim Rewards
                        </button>
                        <button className="px-4 py-2 bg-gradient-to-r from-blue-400 to-blue-500 hover:from-blue-500 hover:to-blue-600 text-white rounded-lg shadow-lg transition-all duration-200">
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-gray-600 text-lg mb-4">No active liquidity positions</p>
                  <button
                    onClick={() => setActiveTab('pools')}
                    className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg shadow-lg transition-all duration-200"
                  >
                    Browse Pools
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <div className="bg-gradient-to-br from-white to-blue-50 border-2 border-blue-300 rounded-xl p-8 shadow-lg">
            <h2 className="text-2xl font-bold mb-6 text-blue-800">Liquidity Analytics</h2>
            <div className="h-64 bg-blue-100 border-2 border-blue-200 rounded-lg flex items-center justify-center">
              <div className="text-gray-600 text-center">
                <div className="text-4xl mb-4">📊</div>
                <div>Advanced analytics dashboard coming soon</div>
                <div className="text-sm mt-2">Performance tracking, impermanent loss calculator, and more</div>
              </div>
            </div>
          </div>
        )}

        {/* How It Works */}
        <div className="mt-16">
          <h2 className="text-3xl font-bold text-center mb-12 text-blue-800">How Liquidity Provision Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 border-2 border-blue-300 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">1️⃣</span>
              </div>
              <h3 className="text-lg font-semibold mb-2 text-blue-800">Select Pool</h3>
              <p className="text-gray-600">Choose a trading pair to provide liquidity to</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 border-2 border-blue-300 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">2️⃣</span>
              </div>
              <h3 className="text-lg font-semibold mb-2 text-blue-800">Deposit Tokens</h3>
              <p className="text-gray-600">Add equal value of both tokens to the pool</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 border-2 border-blue-300 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">3️⃣</span>
              </div>
              <h3 className="text-lg font-semibold mb-2 text-blue-800">Earn Fees</h3>
              <p className="text-gray-600">Receive a share of trading fees from the pool</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 border-2 border-blue-300 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">4️⃣</span>
              </div>
              <h3 className="text-lg font-semibold mb-2 text-blue-800">Withdraw Anytime</h3>
              <p className="text-gray-600">Remove your liquidity and claim rewards</p>
            </div>
          </div>
        </div>
      </div>

      {/* Add Liquidity Modal */}
      {selectedPool && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-gradient-to-br from-white to-blue-50 border-2 border-blue-300 rounded-xl p-8 max-w-md w-full shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-blue-800">Add Liquidity to {selectedPool.name}</h2>
              <button
                onClick={() => setSelectedPool(null)}
                className="text-gray-600 hover:text-blue-700 text-2xl transition-colors"
              >
                ×
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {selectedPool.token1} Amount
                </label>
                <input
                  type="number"
                  placeholder="0.0"
                  className="w-full px-4 py-3 bg-white border-2 border-blue-300 rounded-lg text-gray-800 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {selectedPool.token2} Amount
                </label>
                <input
                  type="number"
                  placeholder="0.0"
                  className="w-full px-4 py-3 bg-white border-2 border-blue-300 rounded-lg text-gray-800 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                />
              </div>
              
              <div className="bg-blue-100 border-2 border-blue-200 rounded-lg p-4">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-600">Pool Share:</span>
                  <span className="text-blue-700">0.12%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Expected APY:</span>
                  <span className="text-blue-600">{selectedPool.apy}</span>
                </div>
              </div>
              
              <button className="w-full px-6 py-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold rounded-lg shadow-lg transition-all duration-200">
                Add Liquidity
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LiquidityManagementPage;