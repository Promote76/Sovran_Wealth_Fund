import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { useWallet } from '../contexts/WalletContext';
import AXIOMRevenueRouterABI from '../abis/AXIOMRevenueRouter.json';

interface RouterStats {
  routerAddress: string;
  treasuryAddress: string;
  keygrowAddress: string;
  treasurySharePercentage: number;
  keygrowSharePercentage: number;
  totalBNBDistributed: string;
  stats: {
    totalDistributions: number;
    totalRevenue: string;
    totalToTreasury: string;
    totalToKeygrow: string;
  };
}

interface Distribution {
  id: number;
  source: string;
  totalAmount: string;
  treasuryAmount: string;
  keygrowAmount: string;
  txHash: string | null;
  createdAt: string;
}

interface RevenueSource {
  source: string;
  distributionCount: number;
  totalRevenue: string;
}

const REVENUE_ROUTER_ADDRESS = '0xd070776c3603138a1d4b93a2f668d604a4a99e34';

const REVENUE_SOURCE_NAMES: Record<number, { name: string; icon: string; color: string }> = {
  0: { name: 'Staking Fees', icon: '💰', color: 'bg-blue-500' },
  1: { name: 'NFT Marketplace', icon: '🎨', color: 'bg-purple-500' },
  2: { name: 'Banking Fees', icon: '🏦', color: 'bg-green-500' },
  3: { name: 'Investment Fees', icon: '📈', color: 'bg-yellow-500' },
  4: { name: 'Liquidity Fees', icon: '💧', color: 'bg-cyan-500' },
  5: { name: 'Governance', icon: '🗳️', color: 'bg-indigo-500' },
  6: { name: 'Other', icon: '📦', color: 'bg-gray-500' }
};

export const RevenueRouterPage: React.FC = () => {
  const { account, isConnected } = useWallet();
  const [loading, setLoading] = useState(true);
  const [routerStats, setRouterStats] = useState<RouterStats | null>(null);
  const [distributions, setDistributions] = useState<Distribution[]>([]);
  const [revenueSources, setRevenueSources] = useState<RevenueSource[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'history' | 'sources'>('overview');

  useEffect(() => {
    loadRouterData();
  }, []);

  const loadRouterData = async () => {
    try {
      setLoading(true);
      const [statsRes, historyRes, sourcesRes] = await Promise.all([
        fetch('/api/revenue-router/stats'),
        fetch('/api/revenue-router/distributions?limit=20'),
        fetch('/api/revenue-router/sources')
      ]);

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setRouterStats(statsData.data);
      }

      if (historyRes.ok) {
        const historyData = await historyRes.json();
        setDistributions(historyData.data || []);
      }

      if (sourcesRes.ok) {
        const sourcesData = await sourcesRes.json();
        setRevenueSources(sourcesData.data || []);
      }
    } catch (error) {
      console.error('Error loading router data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatAddress = (address: string) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatAmount = (amount: string) => {
    const num = parseFloat(amount || '0');
    if (num === 0) return '0';
    if (num < 0.01) return num.toFixed(6);
    if (num < 1) return num.toFixed(4);
    return num.toFixed(2);
  };

  const getSourceInfo = (source: string) => {
    const sourceNum = parseInt(source);
    return REVENUE_SOURCE_NAMES[sourceNum] || REVENUE_SOURCE_NAMES[6];
  };

  if (loading) {
    return (
      <Layout title="Revenue Router" themeColor="blue">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              <p className="mt-4 text-gray-600">Loading revenue router data...</p>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="AXIOM Revenue Router" themeColor="blue">
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 py-12">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full mb-6 shadow-lg">
              <span className="text-4xl">💰</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              AXIOM Revenue Router
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-6">
              Automated revenue distribution system powering platform growth and community impact
            </p>
            <div className="flex items-center justify-center space-x-4 text-sm text-gray-500">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span>Live on BSC</span>
              </div>
              <span>•</span>
              <a
                href={`https://bscscan.com/address/${REVENUE_ROUTER_ADDRESS}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-700 flex items-center space-x-1"
              >
                <span>{formatAddress(REVENUE_ROUTER_ADDRESS)}</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            </div>
          </div>

          {/* Revenue Split Visualization */}
          {routerStats && (
            <div className="mb-8 bg-white rounded-2xl shadow-xl p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
                Revenue Distribution Model
              </h2>
              <div className="grid md:grid-cols-2 gap-8">
                {/* Treasury */}
                <div className="relative">
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg">
                    {routerStats.treasurySharePercentage}%
                  </div>
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border-2 border-blue-300 h-full">
                    <div className="text-center mb-4">
                      <div className="text-5xl mb-3">🏛️</div>
                      <h3 className="text-xl font-bold text-blue-900 mb-2">Treasury</h3>
                      <p className="text-sm text-blue-700">Platform Operations & Growth</p>
                    </div>
                    <div className="space-y-3">
                      <div className="bg-white rounded-lg p-3">
                        <div className="text-xs text-gray-500 mb-1">Address</div>
                        <a
                          href={`https://bscscan.com/address/${routerStats.treasuryAddress}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm font-mono text-blue-600 hover:text-blue-700 flex items-center space-x-1"
                        >
                          <span>{formatAddress(routerStats.treasuryAddress)}</span>
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                        </a>
                      </div>
                      <div className="bg-white rounded-lg p-3">
                        <div className="text-xs text-gray-500 mb-1">Total Received</div>
                        <div className="text-lg font-bold text-blue-900">
                          {formatAmount(routerStats.stats?.totalToTreasury || '0')} BNB
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* KeyGrow */}
                <div className="relative">
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-green-600 text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg">
                    {routerStats.keygrowSharePercentage}%
                  </div>
                  <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border-2 border-green-300 h-full">
                    <div className="text-center mb-4">
                      <div className="text-5xl mb-3">🏠</div>
                      <h3 className="text-xl font-bold text-green-900 mb-2">KeyGrow Fund</h3>
                      <p className="text-sm text-green-700">Rent-to-Own Program</p>
                    </div>
                    <div className="space-y-3">
                      <div className="bg-white rounded-lg p-3">
                        <div className="text-xs text-gray-500 mb-1">Address</div>
                        <a
                          href={`https://bscscan.com/address/${routerStats.keygrowAddress}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm font-mono text-green-600 hover:text-green-700 flex items-center space-x-1"
                        >
                          <span>{formatAddress(routerStats.keygrowAddress)}</span>
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                        </a>
                      </div>
                      <div className="bg-white rounded-lg p-3">
                        <div className="text-xs text-gray-500 mb-1">Total Received</div>
                        <div className="text-lg font-bold text-green-900">
                          {formatAmount(routerStats.stats?.totalToKeygrow || '0')} BNB
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Flow Visualization */}
              <div className="mt-8 text-center">
                <div className="inline-flex items-center space-x-4 bg-gradient-to-r from-blue-100 via-purple-100 to-green-100 rounded-full px-8 py-4">
                  <span className="text-2xl">💵</span>
                  <span className="text-sm font-semibold text-gray-700">Platform Revenue</span>
                  <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                  <span className="text-2xl">🏛️</span>
                  <span className="text-sm font-semibold text-blue-700">{routerStats.treasurySharePercentage}%</span>
                  <span className="text-gray-400">|</span>
                  <span className="text-2xl">🏠</span>
                  <span className="text-sm font-semibold text-green-700">{routerStats.keygrowSharePercentage}%</span>
                </div>
              </div>
            </div>
          )}

          {/* Stats Overview */}
          {routerStats && (
            <div className="grid md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-gray-600">Total Distributed</h3>
                  <span className="text-2xl">💸</span>
                </div>
                <div className="text-3xl font-bold text-gray-900">
                  {formatAmount(routerStats.totalBNBDistributed)} BNB
                </div>
                <div className="text-sm text-gray-500 mt-2">
                  ${(parseFloat(routerStats.totalBNBDistributed) * 600).toFixed(2)} USD
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-gray-600">Total Distributions</h3>
                  <span className="text-2xl">📊</span>
                </div>
                <div className="text-3xl font-bold text-gray-900">
                  {routerStats.stats?.totalDistributions || 0}
                </div>
                <div className="text-sm text-gray-500 mt-2">
                  Revenue events processed
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-purple-500">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-gray-600">Revenue Sources</h3>
                  <span className="text-2xl">🎯</span>
                </div>
                <div className="text-3xl font-bold text-gray-900">
                  {revenueSources.length}
                </div>
                <div className="text-sm text-gray-500 mt-2">
                  Active revenue streams
                </div>
              </div>
            </div>
          )}

          {/* Tabs */}
          <div className="bg-white rounded-t-xl shadow-lg">
            <div className="border-b border-gray-200">
              <nav className="flex space-x-8 px-6" aria-label="Tabs">
                <button
                  onClick={() => setActiveTab('overview')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === 'overview'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Overview
                </button>
                <button
                  onClick={() => setActiveTab('history')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === 'history'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Distribution History
                </button>
                <button
                  onClick={() => setActiveTab('sources')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === 'sources'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Revenue Sources
                </button>
              </nav>
            </div>

            <div className="p-6">
              {/* Overview Tab */}
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-4">How It Works</h3>
                    <div className="prose prose-blue max-w-none">
                      <p className="text-gray-600">
                        The AXIOM Revenue Router is a smart contract that automatically distributes all platform revenue
                        between the Treasury (for platform operations and growth) and the KeyGrow Real Estate Acquisition
                        Fund (helping renters achieve homeownership).
                      </p>
                      
                      <h4 className="text-lg font-semibold text-gray-900 mt-6 mb-3">Revenue Sources</h4>
                      <ul className="space-y-2">
                        <li className="flex items-start">
                          <span className="text-blue-500 mr-2">💰</span>
                          <span><strong>Staking Fees:</strong> Small fees from PoC staking operations</span>
                        </li>
                        <li className="flex items-start">
                          <span className="text-purple-500 mr-2">🎨</span>
                          <span><strong>NFT Marketplace:</strong> 2.5% commission on all NFT sales</span>
                        </li>
                        <li className="flex items-start">
                          <span className="text-green-500 mr-2">🏦</span>
                          <span><strong>Banking Fees:</strong> Transaction fees from SWF Banking services</span>
                        </li>
                        <li className="flex items-start">
                          <span className="text-yellow-500 mr-2">📈</span>
                          <span><strong>Investment Fees:</strong> 0.1% transaction fees on investment platform</span>
                        </li>
                        <li className="flex items-start">
                          <span className="text-cyan-500 mr-2">💧</span>
                          <span><strong>Liquidity Fees:</strong> Rewards from liquidity provision</span>
                        </li>
                      </ul>

                      <h4 className="text-lg font-semibold text-gray-900 mt-6 mb-3">Distribution Process</h4>
                      <ol className="space-y-2">
                        <li>Revenue is collected from various platform services</li>
                        <li>Smart contract automatically splits revenue according to configured percentages</li>
                        <li>Funds are sent to Treasury and KeyGrow wallets</li>
                        <li>All transactions are recorded on-chain and in the database</li>
                        <li>Community can verify all distributions transparently</li>
                      </ol>
                    </div>
                  </div>
                </div>
              )}

              {/* History Tab */}
              {activeTab === 'history' && (
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-4">Recent Distributions</h3>
                  {distributions.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                      <div className="text-6xl mb-4">📊</div>
                      <p>No distributions yet. Revenue sharing will begin once platform operations start.</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Source</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Amount</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">To Treasury</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">To KeyGrow</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Transaction</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {distributions.map((dist) => {
                            const sourceInfo = getSourceInfo(dist.source);
                            return (
                              <tr key={dist.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                  {new Date(dist.createdAt).toLocaleDateString()}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="flex items-center">
                                    <span className="text-xl mr-2">{sourceInfo.icon}</span>
                                    <span className="text-sm font-medium text-gray-900">{sourceInfo.name}</span>
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                                  {formatAmount(dist.totalAmount)} BNB
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600">
                                  {formatAmount(dist.treasuryAmount)} BNB
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">
                                  {formatAmount(dist.keygrowAmount)} BNB
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                  {dist.txHash ? (
                                    <a
                                      href={`https://bscscan.com/tx/${dist.txHash}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-blue-600 hover:text-blue-700 flex items-center space-x-1"
                                    >
                                      <span>{formatAddress(dist.txHash)}</span>
                                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                      </svg>
                                    </a>
                                  ) : (
                                    <span className="text-gray-400">-</span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* Sources Tab */}
              {activeTab === 'sources' && (
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-4">Revenue by Source</h3>
                  {revenueSources.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                      <div className="text-6xl mb-4">🎯</div>
                      <p>No revenue sources active yet. Data will appear once distributions begin.</p>
                    </div>
                  ) : (
                    <div className="grid md:grid-cols-2 gap-6">
                      {revenueSources.map((source) => {
                        const sourceInfo = getSourceInfo(source.source);
                        return (
                          <div key={source.source} className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                            <div className="flex items-center justify-between mb-4">
                              <div className="flex items-center space-x-3">
                                <div className={`${sourceInfo.color} w-12 h-12 rounded-full flex items-center justify-center text-2xl`}>
                                  {sourceInfo.icon}
                                </div>
                                <div>
                                  <h4 className="text-lg font-semibold text-gray-900">{sourceInfo.name}</h4>
                                  <p className="text-sm text-gray-500">{source.distributionCount} distributions</p>
                                </div>
                              </div>
                            </div>
                            <div className="mt-4 pt-4 border-t border-gray-200">
                              <div className="text-sm text-gray-600 mb-1">Total Revenue</div>
                              <div className="text-2xl font-bold text-gray-900">
                                {formatAmount(source.totalRevenue)} BNB
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Educational Footer */}
          <div className="mt-12 bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-8 border border-blue-200">
            <h3 className="text-2xl font-bold text-gray-900 mb-4 text-center">
              Why Revenue Sharing Matters
            </h3>
            <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              <div>
                <div className="text-4xl mb-3 text-center">🌱</div>
                <h4 className="text-lg font-semibold text-gray-900 mb-2 text-center">Platform Sustainability</h4>
                <p className="text-gray-600 text-sm text-center">
                  80% of revenue goes to the Treasury to fund ongoing development, security audits, marketing,
                  and operational costs ensuring long-term platform success.
                </p>
              </div>
              <div>
                <div className="text-4xl mb-3 text-center">🏡</div>
                <h4 className="text-lg font-semibold text-gray-900 mb-2 text-center">Community Impact</h4>
                <p className="text-gray-600 text-sm text-center">
                  20% flows directly to KeyGrow, helping renters accumulate down payments and achieve homeownership.
                  Your platform usage creates real-world impact for families.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};
