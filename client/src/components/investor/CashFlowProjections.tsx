/**
 * Feature #3: Investor Intelligence Suite - Cash Flow Projections
 * 12-month cash flow projections with visualization
 */

import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface Projection {
  id: number;
  month: string;
  projectedRevenue: number;
  projectedExpenses: number;
  netCashFlow: number;
  confidenceLevel: string;
  assumptions: string;
}

interface ProjectionFilters {
  propertyId?: number;
  limit?: number;
}

const CashFlowProjections: React.FC<{ investorId?: number; propertyId?: number }> = ({ 
  investorId, 
  propertyId 
}) => {
  const [projections, setProjections] = useState<Projection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedProperty, setSelectedProperty] = useState<number | undefined>(propertyId);

  useEffect(() => {
    loadProjections();
  }, [investorId, selectedProperty]);

  const loadProjections = async () => {
    setLoading(true);
    setError(null);

    try {
      const params: any = { limit: 12 };
      if (investorId) params.investorId = investorId;
      if (selectedProperty) params.propertyId = selectedProperty;

      const response = await axios.get('/api/intelligence/projections', { params });
      setProjections(response.data.projections || []);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load cash flow projections');
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

  const formatMonth = (monthStr: string) => {
    const date = new Date(monthStr);
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  };

  const getConfidenceColor = (level: string) => {
    switch (level?.toLowerCase()) {
      case 'high': return 'text-green-600 bg-green-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'low': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const calculateTotals = () => {
    const totalRevenue = projections.reduce((sum, p) => sum + p.projectedRevenue, 0);
    const totalExpenses = projections.reduce((sum, p) => sum + p.projectedExpenses, 0);
    const totalNetCashFlow = projections.reduce((sum, p) => sum + p.netCashFlow, 0);
    
    return { totalRevenue, totalExpenses, totalNetCashFlow };
  };

  const getMaxValue = () => {
    const values = projections.flatMap(p => [p.projectedRevenue, p.projectedExpenses, p.netCashFlow]);
    return Math.max(...values, 0);
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

  const totals = calculateTotals();
  const maxValue = getMaxValue();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">12-Month Cash Flow Projections</h2>
        <button
          onClick={loadProjections}
          className="px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700"
        >
          Refresh
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm font-medium text-gray-500">Projected Revenue</div>
          <div className="mt-2 text-3xl font-bold text-green-600">
            {formatCurrency(totals.totalRevenue)}
          </div>
          <div className="text-sm text-gray-500 mt-1">Next 12 months</div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm font-medium text-gray-500">Projected Expenses</div>
          <div className="mt-2 text-3xl font-bold text-red-600">
            {formatCurrency(totals.totalExpenses)}
          </div>
          <div className="text-sm text-gray-500 mt-1">Next 12 months</div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm font-medium text-gray-500">Net Cash Flow</div>
          <div className={`mt-2 text-3xl font-bold ${totals.totalNetCashFlow >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
            {formatCurrency(totals.totalNetCashFlow)}
          </div>
          <div className="text-sm text-gray-500 mt-1">Next 12 months</div>
        </div>
      </div>

      {/* Visual Chart */}
      {projections.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Monthly Breakdown</h3>
          <div className="space-y-4">
            {projections.map((projection) => (
              <div key={projection.id} className="border-b border-gray-200 pb-4 last:border-b-0">
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center space-x-3">
                    <span className="font-medium text-gray-900">{formatMonth(projection.month)}</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getConfidenceColor(projection.confidenceLevel)}`}>
                      {projection.confidenceLevel} confidence
                    </span>
                  </div>
                  <span className={`font-semibold ${projection.netCashFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(projection.netCashFlow)}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-4 mb-2">
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Revenue</div>
                    <div className="text-sm font-medium text-green-600">
                      {formatCurrency(projection.projectedRevenue)}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Expenses</div>
                    <div className="text-sm font-medium text-red-600">
                      {formatCurrency(projection.projectedExpenses)}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Net Cash Flow</div>
                    <div className={`text-sm font-medium ${projection.netCashFlow >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                      {formatCurrency(projection.netCashFlow)}
                    </div>
                  </div>
                </div>

                {/* Visual bars */}
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-gray-400 w-16">Revenue</span>
                    <div className="flex-1 bg-gray-100 rounded-full h-2">
                      <div
                        className="bg-green-500 h-2 rounded-full"
                        style={{ width: `${(projection.projectedRevenue / maxValue) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-gray-400 w-16">Expenses</span>
                    <div className="flex-1 bg-gray-100 rounded-full h-2">
                      <div
                        className="bg-red-500 h-2 rounded-full"
                        style={{ width: `${(projection.projectedExpenses / maxValue) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </div>

                {projection.assumptions && (
                  <div className="mt-2 text-xs text-gray-500 italic">
                    Assumptions: {projection.assumptions}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {projections.length === 0 && (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <div className="text-gray-500">
            <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <p className="text-lg font-medium">No projections available</p>
            <p className="text-sm mt-1">Cash flow projections will appear here once you have portfolio data</p>
          </div>
        </div>
      )}

      {/* Methodology Note */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="text-sm font-semibold text-blue-900 mb-2">About These Projections</h4>
        <p className="text-xs text-blue-800">
          Cash flow projections are based on historical property performance, seasonal trends, and market conditions. 
          Confidence levels indicate the reliability of each projection based on data quality and market stability.
          These are estimates and actual results may vary.
        </p>
      </div>
    </div>
  );
};

export default CashFlowProjections;
