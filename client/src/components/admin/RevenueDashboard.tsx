/**
 * Feature #4: Revenue Distribution Engine - Admin Dashboard
 * Comprehensive UI for managing property revenue distributions
 */

import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface PropertyData {
  id: number;
  address: string;
  totalShares: number;
  activeInvestors: number;
}

interface DistributionStats {
  totalRevenue: number;
  totalDistributed: number;
  reserveFund: number;
  recipientsCount: number;
}

interface PayoutBatch {
  batchId: string;
  propertyId: number;
  propertyAddress: string;
  totalRevenue: number;
  totalDistributed: number;
  recipientsCount: number;
  status: string;
  createdAt: string;
}

const RevenueDashboard: React.FC = () => {
  const [properties, setProperties] = useState<PropertyData[]>([]);
  const [selectedProperty, setSelectedProperty] = useState<number | null>(null);
  const [revenueAmount, setRevenueAmount] = useState<string>('');
  const [distributionMonth, setDistributionMonth] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [recentBatches, setRecentBatches] = useState<PayoutBatch[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);

  useEffect(() => {
    loadProperties();
    loadRecentBatches();
  }, []);

  useEffect(() => {
    if (selectedProperty) {
      loadPropertyAnalytics(selectedProperty);
    }
  }, [selectedProperty]);

  const loadProperties = async () => {
    try {
      const response = await axios.get('/api/fractional/properties');
      setProperties(response.data.properties || []);
    } catch (err) {
      console.error('Failed to load properties:', err);
    }
  };

  const loadRecentBatches = async () => {
    try {
      const response = await axios.get('/api/revenue/batches?limit=10');
      setRecentBatches(response.data || []);
    } catch (err) {
      console.error('Failed to load recent batches:', err);
    }
  };

  const loadPropertyAnalytics = async (propertyId: number) => {
    try {
      const response = await axios.get(`/api/revenue/analytics/${propertyId}`);
      setAnalytics(response.data);
    } catch (err) {
      console.error('Failed to load analytics:', err);
    }
  };

  const handleDistribution = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedProperty || !revenueAmount || !distributionMonth) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await axios.post('/api/revenue/distribute', {
        propertyId: selectedProperty,
        totalRevenue: parseFloat(revenueAmount),
        distributionMonth: distributionMonth
      });

      if (response.data.success) {
        setSuccess(
          `Distribution successful! ${response.data.recipientsCount} investors received $${response.data.totalDistributed.toLocaleString()}`
        );
        setRevenueAmount('');
        setDistributionMonth('');
        loadRecentBatches();
        loadPropertyAnalytics(selectedProperty);
      } else {
        setError(response.data.error || 'Distribution failed');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to process distribution');
    } finally {
      setLoading(false);
    }
  };

  const executeStripePayout = async (batchId: string) => {
    if (!confirm('Execute Stripe payout for this batch? This will transfer funds to investors.')) {
      return;
    }

    try {
      const response = await axios.post('/api/revenue/execute-payout', { batchId });
      if (response.data.success) {
        alert(`Payout executed: ${response.data.successfulPayouts} successful, ${response.data.failedPayouts} failed`);
        loadRecentBatches();
      } else {
        alert('Payout execution failed: ' + response.data.error);
      }
    } catch (err: any) {
      alert('Failed to execute payout: ' + (err.response?.data?.error || err.message));
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Revenue Distribution Dashboard
        </h1>
        <p className="text-gray-600">
          Process rental income distributions and manage investor payouts
        </p>
      </div>

      {analytics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
            <div className="text-sm font-medium text-blue-600 mb-1">Total Revenue</div>
            <div className="text-2xl font-bold text-blue-900">
              {formatCurrency(analytics.totalRevenue || 0)}
            </div>
          </div>
          <div className="bg-green-50 rounded-lg p-6 border border-green-200">
            <div className="text-sm font-medium text-green-600 mb-1">Distributed</div>
            <div className="text-2xl font-bold text-green-900">
              {formatCurrency(analytics.totalDistributed || 0)}
            </div>
          </div>
          <div className="bg-purple-50 rounded-lg p-6 border border-purple-200">
            <div className="text-sm font-medium text-purple-600 mb-1">Reserve Fund</div>
            <div className="text-2xl font-bold text-purple-900">
              {formatCurrency(analytics.reserveFund || 0)}
            </div>
          </div>
          <div className="bg-orange-50 rounded-lg p-6 border border-orange-200">
            <div className="text-sm font-medium text-orange-600 mb-1">Total Investors</div>
            <div className="text-2xl font-bold text-orange-900">
              {analytics.totalInvestors || 0}
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Process New Distribution
        </h2>
        
        <form onSubmit={handleDistribution} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Property
            </label>
            <select
              value={selectedProperty || ''}
              onChange={(e) => setSelectedProperty(Number(e.target.value))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              <option value="">Select property...</option>
              {properties.map((property) => (
                <option key={property.id} value={property.id}>
                  {property.address} ({property.activeInvestors} investors)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Total Revenue Amount ($)
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={revenueAmount}
              onChange={(e) => setRevenueAmount(e.target.value)}
              placeholder="5000.00"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Distribution Month
            </label>
            <input
              type="month"
              value={distributionMonth}
              onChange={(e) => setDistributionMonth(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg">
              {success}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Processing...' : 'Process Distribution'}
          </button>
        </form>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Recent Distributions
        </h2>

        {recentBatches.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No distributions yet</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Property</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Revenue</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Distributed</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Recipients</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {recentBatches.map((batch) => (
                  <tr key={batch.batchId} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {formatDate(batch.createdAt)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {batch.propertyAddress}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {formatCurrency(batch.totalRevenue)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {formatCurrency(batch.totalDistributed)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {batch.recipientsCount}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        batch.status === 'completed' ? 'bg-green-100 text-green-800' :
                        batch.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                        batch.status === 'failed' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {batch.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {batch.status === 'pending' && (
                        <button
                          onClick={() => executeStripePayout(batch.batchId)}
                          className="text-blue-600 hover:text-blue-800 font-medium"
                        >
                          Execute Payout
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default RevenueDashboard;
