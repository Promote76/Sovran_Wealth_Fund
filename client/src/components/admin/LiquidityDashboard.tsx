/**
 * Feature #1: Liquidity & Redemption Desk - Admin Dashboard
 * Treasury management and liquidity pool monitoring
 */

import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface LiquidityMetrics {
  activeOrders: number;
  completedMatches: number;
  totalVolume: number;
  totalFees: number;
  treasuryBalance: number;
  treasuryAvailable: number;
}

interface TreasuryConfig {
  totalCashBalance: number;
  reservedCash: number;
  availableCash: number;
  minCashThreshold: number;
  maxPositionSize: number;
  defaultSpreadPercent: number;
  maxOwnershipPerProperty: number;
  autoRebalanceEnabled: boolean;
  isActive: boolean;
}

interface Match {
  matchId: string;
  propertyAddress: string;
  sellerWallet: string;
  buyerWallet: string;
  sharesMatched: number;
  pricePerShare: number;
  totalAmount: number;
  platformFee: number;
  matchSource: string;
  status: string;
  createdAt: string;
  settledAt: string | null;
}

const LiquidityDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<LiquidityMetrics | null>(null);
  const [config, setConfig] = useState<TreasuryConfig | null>(null);
  const [recentMatches, setRecentMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDashboardData();
    const interval = setInterval(loadDashboardData, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadDashboardData = async () => {
    try {
      const [metricsRes, configRes, matchesRes] = await Promise.all([
        axios.get('/api/liquidity/metrics'),
        axios.get('/api/liquidity/treasury/config'),
        axios.get('/api/liquidity/matches?limit=20')
      ]);

      setMetrics(metricsRes.data.metrics);
      setConfig(configRes.data.config);
      setRecentMatches(matchesRes.data.matches || []);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatWallet = (wallet: string) => {
    if (wallet === 'treasury') return '🏦 Treasury';
    return `${wallet.slice(0, 6)}...${wallet.slice(-4)}`;
  };

  const getMatchSourceBadge = (source: string) => {
    switch (source) {
      case 'treasury': return <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-semibold">Treasury</span>;
      case 'investor': return <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-semibold">Investor</span>;
      case 'queue': return <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold">Queue</span>;
      default: return <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-semibold">{source}</span>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'settling': return 'bg-blue-100 text-blue-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
        {error}
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Liquidity & Redemption Desk Dashboard
        </h1>
        <p className="text-gray-600">
          Monitor treasury operations and secondary market activity
        </p>
      </div>

      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
            <div className="text-sm font-medium text-blue-600 mb-1">Active Orders</div>
            <div className="text-2xl font-bold text-blue-900">
              {metrics.activeOrders}
            </div>
          </div>
          <div className="bg-green-50 rounded-lg p-6 border border-green-200">
            <div className="text-sm font-medium text-green-600 mb-1">Completed Matches</div>
            <div className="text-2xl font-bold text-green-900">
              {metrics.completedMatches}
            </div>
          </div>
          <div className="bg-purple-50 rounded-lg p-6 border border-purple-200">
            <div className="text-sm font-medium text-purple-600 mb-1">Total Volume</div>
            <div className="text-2xl font-bold text-purple-900">
              {formatCurrency(parseFloat(metrics.totalVolume.toString()))}
            </div>
          </div>
          <div className="bg-orange-50 rounded-lg p-6 border border-orange-200">
            <div className="text-sm font-medium text-orange-600 mb-1">Total Fees</div>
            <div className="text-2xl font-bold text-orange-900">
              {formatCurrency(parseFloat(metrics.totalFees.toString()))}
            </div>
          </div>
          <div className="bg-indigo-50 rounded-lg p-6 border border-indigo-200">
            <div className="text-sm font-medium text-indigo-600 mb-1">Treasury Balance</div>
            <div className="text-2xl font-bold text-indigo-900">
              {formatCurrency(parseFloat(metrics.treasuryBalance.toString()))}
            </div>
          </div>
          <div className="bg-teal-50 rounded-lg p-6 border border-teal-200">
            <div className="text-sm font-medium text-teal-600 mb-1">Available Cash</div>
            <div className="text-2xl font-bold text-teal-900">
              {formatCurrency(parseFloat(metrics.treasuryAvailable.toString()))}
            </div>
          </div>
        </div>
      )}

      {config && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Treasury Configuration
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="border rounded-lg p-4">
              <div className="text-sm text-gray-500 mb-1">Total Cash Balance</div>
              <div className="text-lg font-bold text-gray-900">
                {formatCurrency(parseFloat(config.totalCashBalance.toString()))}
              </div>
            </div>

            <div className="border rounded-lg p-4">
              <div className="text-sm text-gray-500 mb-1">Reserved Cash</div>
              <div className="text-lg font-bold text-gray-900">
                {formatCurrency(parseFloat(config.reservedCash.toString()))}
              </div>
            </div>

            <div className="border rounded-lg p-4">
              <div className="text-sm text-gray-500 mb-1">Available Cash</div>
              <div className="text-lg font-bold text-gray-900">
                {formatCurrency(parseFloat(config.availableCash.toString()))}
              </div>
            </div>

            <div className="border rounded-lg p-4">
              <div className="text-sm text-gray-500 mb-1">Min Cash Threshold</div>
              <div className="text-lg font-bold text-gray-900">
                {formatCurrency(parseFloat(config.minCashThreshold.toString()))}
              </div>
            </div>

            <div className="border rounded-lg p-4">
              <div className="text-sm text-gray-500 mb-1">Max Position Size</div>
              <div className="text-lg font-bold text-gray-900">
                {formatCurrency(parseFloat(config.maxPositionSize.toString()))}
              </div>
            </div>

            <div className="border rounded-lg p-4">
              <div className="text-sm text-gray-500 mb-1">Default Spread</div>
              <div className="text-lg font-bold text-gray-900">
                {parseFloat(config.defaultSpreadPercent.toString())}%
              </div>
            </div>

            <div className="border rounded-lg p-4">
              <div className="text-sm text-gray-500 mb-1">Max Ownership/Property</div>
              <div className="text-lg font-bold text-gray-900">
                {parseFloat(config.maxOwnershipPerProperty.toString())}%
              </div>
            </div>

            <div className="border rounded-lg p-4">
              <div className="text-sm text-gray-500 mb-1">Auto-Rebalance</div>
              <div className="text-lg font-bold text-gray-900">
                {config.autoRebalanceEnabled ? '✅ Enabled' : '❌ Disabled'}
              </div>
            </div>

            <div className="border rounded-lg p-4">
              <div className="text-sm text-gray-500 mb-1">Pool Status</div>
              <div className="text-lg font-bold text-gray-900">
                {config.isActive ? '🟢 Active' : '🔴 Inactive'}
              </div>
            </div>
          </div>

          {parseFloat(config.availableCash.toString()) < parseFloat(config.minCashThreshold.toString()) && (
            <div className="mt-4 bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-lg">
              <strong>⚠️ Low Liquidity Alert:</strong> Available cash is below minimum threshold. Consider adding funds to the treasury.
            </div>
          )}
        </div>
      )}

      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Recent Matches
        </h2>

        {recentMatches.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No matches yet</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Property</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Seller</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Buyer</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Shares</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fee</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Source</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {recentMatches.map((match) => (
                  <tr key={match.matchId} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {formatDate(match.createdAt)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {match.propertyAddress || 'N/A'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 font-mono">
                      {formatWallet(match.sellerWallet)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 font-mono">
                      {formatWallet(match.buyerWallet)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {match.sharesMatched.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {formatCurrency(parseFloat(match.pricePerShare.toString()))}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 font-semibold">
                      {formatCurrency(parseFloat(match.totalAmount.toString()))}
                    </td>
                    <td className="px-4 py-3 text-sm text-green-600">
                      {formatCurrency(parseFloat(match.platformFee.toString()))}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {getMatchSourceBadge(match.matchSource)}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusBadge(match.status)}`}>
                        {match.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <button
        onClick={loadDashboardData}
        className="fixed bottom-6 right-6 bg-blue-600 text-white px-4 py-2 rounded-full shadow-lg hover:bg-blue-700 transition-colors"
      >
        🔄 Refresh
      </button>
    </div>
  );
};

export default LiquidityDashboard;
