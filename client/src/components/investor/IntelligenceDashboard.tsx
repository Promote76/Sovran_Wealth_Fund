/**
 * Feature #3: Investor Intelligence Suite - Main Dashboard
 * Comprehensive portfolio analytics with predictions and insights
 */

import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface DashboardData {
  portfolioSummary: {
    totalInvested: number;
    totalValue: number;
    totalRevenue: number;
    propertyCount: number;
    averageROI: number;
  };
  projectedCashFlow: {
    nextMonth: number;
    next3Months: number;
    next12Months: number;
  };
  riskScore: {
    overall: number;
    diversification: number;
    concentration: number;
    level: string;
  };
  topPerformingProperties: Array<{
    propertyId: number;
    propertyName: string;
    roi: number;
    monthlyIncome: number;
  }>;
  benchmarkComparison: {
    platformAverage: number;
    yourPerformance: number;
    percentile: number;
  };
}

const IntelligenceDashboard: React.FC<{ investorId?: number }> = ({ investorId }) => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDashboard();
  }, [investorId]);

  const loadDashboard = async () => {
    setLoading(true);
    setError(null);

    try {
      const params = investorId ? { investorId } : {};
      const response = await axios.get('/api/intelligence/dashboard', { params });
      setData(response.data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatPercent = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  const getRiskLevelColor = (level: string) => {
    switch (level?.toLowerCase()) {
      case 'low': return 'text-green-600 bg-green-50';
      case 'moderate': return 'text-yellow-600 bg-yellow-50';
      case 'high': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
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

  if (!data) {
    return (
      <div className="text-center py-12 text-gray-500">
        No intelligence data available
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Portfolio Intelligence</h2>
        <button
          onClick={loadDashboard}
          className="px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700"
        >
          Refresh Data
        </button>
      </div>

      {/* Portfolio Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm font-medium text-gray-500">Total Invested</div>
          <div className="mt-2 text-3xl font-bold text-gray-900">
            {formatCurrency(data.portfolioSummary.totalInvested)}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm font-medium text-gray-500">Portfolio Value</div>
          <div className="mt-2 text-3xl font-bold text-gray-900">
            {formatCurrency(data.portfolioSummary.totalValue)}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm font-medium text-gray-500">Total Revenue</div>
          <div className="mt-2 text-3xl font-bold text-green-600">
            {formatCurrency(data.portfolioSummary.totalRevenue)}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm font-medium text-gray-500">Average ROI</div>
          <div className="mt-2 text-3xl font-bold text-blue-600">
            {formatPercent(data.portfolioSummary.averageROI)}
          </div>
        </div>
      </div>

      {/* Projected Cash Flow */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Projected Cash Flow</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="border-l-4 border-blue-500 pl-4">
            <div className="text-sm text-gray-500">Next Month</div>
            <div className="text-2xl font-bold text-gray-900">
              {formatCurrency(data.projectedCashFlow.nextMonth)}
            </div>
          </div>
          <div className="border-l-4 border-blue-500 pl-4">
            <div className="text-sm text-gray-500">Next 3 Months</div>
            <div className="text-2xl font-bold text-gray-900">
              {formatCurrency(data.projectedCashFlow.next3Months)}
            </div>
          </div>
          <div className="border-l-4 border-blue-500 pl-4">
            <div className="text-sm text-gray-500">Next 12 Months</div>
            <div className="text-2xl font-bold text-gray-900">
              {formatCurrency(data.projectedCashFlow.next12Months)}
            </div>
          </div>
        </div>
      </div>

      {/* Risk Score & Benchmark Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Risk Score */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Portfolio Risk Assessment</h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-700">Overall Risk Score</span>
                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getRiskLevelColor(data.riskScore.level)}`}>
                  {data.riskScore.level}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-blue-600 h-3 rounded-full"
                  style={{ width: `${data.riskScore.overall}%` }}
                ></div>
              </div>
              <div className="text-right text-sm text-gray-500 mt-1">{data.riskScore.overall}/100</div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-700">Diversification</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-green-500 h-2 rounded-full"
                  style={{ width: `${data.riskScore.diversification}%` }}
                ></div>
              </div>
              <div className="text-right text-sm text-gray-500 mt-1">{data.riskScore.diversification}/100</div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-700">Concentration Risk</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-yellow-500 h-2 rounded-full"
                  style={{ width: `${data.riskScore.concentration}%` }}
                ></div>
              </div>
              <div className="text-right text-sm text-gray-500 mt-1">{data.riskScore.concentration}/100</div>
            </div>
          </div>
        </div>

        {/* Benchmark Comparison */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance vs Platform Average</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
              <span className="text-gray-700">Platform Average ROI</span>
              <span className="text-xl font-bold text-gray-900">
                {formatPercent(data.benchmarkComparison.platformAverage)}
              </span>
            </div>
            <div className="flex justify-between items-center p-4 bg-blue-50 rounded-lg">
              <span className="text-gray-700">Your Performance</span>
              <span className="text-xl font-bold text-blue-600">
                {formatPercent(data.benchmarkComparison.yourPerformance)}
              </span>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-sm text-gray-600">You're in the</div>
              <div className="text-3xl font-bold text-green-600">
                {formatPercent(data.benchmarkComparison.percentile)}
              </div>
              <div className="text-sm text-gray-600">percentile</div>
            </div>
          </div>
        </div>
      </div>

      {/* Top Performing Properties */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Performing Properties</h3>
        {data.topPerformingProperties.length === 0 ? (
          <div className="text-center py-8 text-gray-500">No properties to display</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Property
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ROI
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Monthly Income
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.topPerformingProperties.map((property, idx) => (
                  <tr key={property.propertyId} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-blue-600 font-semibold text-sm">{idx + 1}</span>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{property.propertyName}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-semibold text-green-600">
                        {formatPercent(property.roi)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">
                        {formatCurrency(property.monthlyIncome)}
                      </span>
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

export default IntelligenceDashboard;
