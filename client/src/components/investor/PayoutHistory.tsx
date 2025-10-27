/**
 * Feature #4: Revenue Distribution Engine - Investor Payout History
 * Display investor's payout history with detailed breakdown
 */

import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface Payout {
  transactionId: string;
  batchId: string;
  propertyAddress: string;
  distributionMonth: string;
  sharesOwned: number;
  ownershipPercent: string;
  tier: string;
  baseAmount: number;
  tierBonus: number;
  totalAmount: number;
  payoutStatus: string;
  stripeTransferId: string | null;
  createdAt: string;
  paidAt: string | null;
}

interface PayoutSummary {
  totalEarned: number;
  totalPending: number;
  totalPaid: number;
  payoutCount: number;
}

const PayoutHistory: React.FC<{ investorId?: number }> = ({ investorId }) => {
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [summary, setSummary] = useState<PayoutSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPayout, setSelectedPayout] = useState<Payout | null>(null);

  useEffect(() => {
    loadPayoutHistory();
  }, [investorId]);

  const loadPayoutHistory = async () => {
    setLoading(true);
    setError(null);

    try {
      const params = investorId ? { investorId } : {};
      const response = await axios.get('/api/revenue/payouts', { params });
      
      setPayouts(response.data.payouts || []);
      
      const total = response.data.payouts?.reduce((sum: number, p: Payout) => sum + p.totalAmount, 0) || 0;
      const paid = response.data.payouts?.filter((p: Payout) => p.payoutStatus === 'completed')
        .reduce((sum: number, p: Payout) => sum + p.totalAmount, 0) || 0;
      const pending = total - paid;

      setSummary({
        totalEarned: total,
        totalPending: pending,
        totalPaid: paid,
        payoutCount: response.data.payouts?.length || 0
      });

    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load payout history');
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
      day: 'numeric'
    });
  };

  const getTierBadgeColor = (tier: string) => {
    switch (tier?.toLowerCase()) {
      case 'institutional': return 'bg-purple-100 text-purple-800';
      case 'premium': return 'bg-blue-100 text-blue-800';
      case 'accredited': return 'bg-green-100 text-green-800';
      case 'retail': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'processing': return 'bg-blue-100 text-blue-800';
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
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Payout History
        </h2>
        <p className="text-gray-600">
          Track your rental income distributions and tier bonuses
        </p>
      </div>

      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
            <div className="text-sm font-medium text-blue-600 mb-1">Total Earned</div>
            <div className="text-2xl font-bold text-blue-900">
              {formatCurrency(summary.totalEarned)}
            </div>
          </div>
          <div className="bg-green-50 rounded-lg p-6 border border-green-200">
            <div className="text-sm font-medium text-green-600 mb-1">Paid Out</div>
            <div className="text-2xl font-bold text-green-900">
              {formatCurrency(summary.totalPaid)}
            </div>
          </div>
          <div className="bg-yellow-50 rounded-lg p-6 border border-yellow-200">
            <div className="text-sm font-medium text-yellow-600 mb-1">Pending</div>
            <div className="text-2xl font-bold text-yellow-900">
              {formatCurrency(summary.totalPending)}
            </div>
          </div>
          <div className="bg-purple-50 rounded-lg p-6 border border-purple-200">
            <div className="text-sm font-medium text-purple-600 mb-1">Total Payouts</div>
            <div className="text-2xl font-bold text-purple-900">
              {summary.payoutCount}
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Distribution Details
        </h3>

        {payouts.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 text-5xl mb-4">💰</div>
            <p className="text-gray-500 text-lg mb-2">No payouts yet</p>
            <p className="text-gray-400 text-sm">
              Distributions will appear here after the first rental income is processed
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Property</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Month</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ownership</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tier</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Base</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Bonus</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {payouts.map((payout) => (
                  <tr
                    key={payout.transactionId}
                    onClick={() => setSelectedPayout(payout)}
                    className="hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {formatDate(payout.createdAt)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {payout.propertyAddress}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {payout.distributionMonth}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {payout.ownershipPercent}%
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getTierBadgeColor(payout.tier)}`}>
                        {payout.tier}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {formatCurrency(payout.baseAmount)}
                    </td>
                    <td className="px-4 py-3 text-sm text-green-600 font-medium">
                      +{formatCurrency(payout.tierBonus)}
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold text-gray-900">
                      {formatCurrency(payout.totalAmount)}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusBadgeColor(payout.payoutStatus)}`}>
                        {payout.payoutStatus}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selectedPayout && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-xl font-bold text-gray-900">Payout Details</h3>
              <button
                onClick={() => setSelectedPayout(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-gray-500 mb-1">Property</div>
                  <div className="font-medium">{selectedPayout.propertyAddress}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500 mb-1">Distribution Month</div>
                  <div className="font-medium">{selectedPayout.distributionMonth}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500 mb-1">Shares Owned</div>
                  <div className="font-medium">{selectedPayout.sharesOwned.toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500 mb-1">Ownership Percentage</div>
                  <div className="font-medium">{selectedPayout.ownershipPercent}%</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500 mb-1">Investor Tier</div>
                  <div>
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getTierBadgeColor(selectedPayout.tier)}`}>
                      {selectedPayout.tier}
                    </span>
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-500 mb-1">Status</div>
                  <div>
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusBadgeColor(selectedPayout.payoutStatus)}`}>
                      {selectedPayout.payoutStatus}
                    </span>
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <div className="text-sm font-medium text-gray-700 mb-3">Payout Breakdown</div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Base Amount (Pro-rata)</span>
                    <span className="font-medium">{formatCurrency(selectedPayout.baseAmount)}</span>
                  </div>
                  <div className="flex justify-between text-green-600">
                    <span>Tier Bonus</span>
                    <span className="font-medium">+{formatCurrency(selectedPayout.tierBonus)}</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold pt-2 border-t">
                    <span>Total Payout</span>
                    <span>{formatCurrency(selectedPayout.totalAmount)}</span>
                  </div>
                </div>
              </div>

              <div className="border-t pt-4 text-sm text-gray-500">
                <div className="flex justify-between mb-1">
                  <span>Transaction ID</span>
                  <span className="font-mono text-xs">{selectedPayout.transactionId}</span>
                </div>
                <div className="flex justify-between mb-1">
                  <span>Batch ID</span>
                  <span className="font-mono text-xs">{selectedPayout.batchId}</span>
                </div>
                {selectedPayout.stripeTransferId && (
                  <div className="flex justify-between mb-1">
                    <span>Stripe Transfer ID</span>
                    <span className="font-mono text-xs">{selectedPayout.stripeTransferId}</span>
                  </div>
                )}
                <div className="flex justify-between mb-1">
                  <span>Created</span>
                  <span>{formatDate(selectedPayout.createdAt)}</span>
                </div>
                {selectedPayout.paidAt && (
                  <div className="flex justify-between">
                    <span>Paid</span>
                    <span>{formatDate(selectedPayout.paidAt)}</span>
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={() => setSelectedPayout(null)}
              className="mt-6 w-full bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PayoutHistory;
