import React, { useState, useEffect } from 'react';

interface Valuation {
  id: number;
  valuation_id: string;
  property_id: number;
  valuation_date: string;
  valuation_type: string;
  estimated_value: string;
  value_change_percent: string | null;
  confidence_score: string;
  data_source: string;
}

interface PropertyValuationsProps {
  propertyId: number;
}

const PropertyValuations: React.FC<PropertyValuationsProps> = ({ propertyId }) => {
  const [valuations, setValuations] = useState<Valuation[]>([]);
  const [latest, setLatest] = useState<Valuation | null>(null);
  const [trend, setTrend] = useState<string>('stable');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchValuations();
  }, [propertyId]);

  const fetchValuations = async () => {
    try {
      setLoading(true);
      
      const [historyRes, latestRes] = await Promise.all([
        fetch(`/api/risk-sentinel/valuations/${propertyId}/history`),
        fetch(`/api/risk-sentinel/valuations/${propertyId}/latest`)
      ]);

      if (!historyRes.ok || !latestRes.ok) throw new Error('Failed to fetch valuations');

      const historyData = await historyRes.json();
      const latestData = await latestRes.json();

      setValuations(historyData.valuations || []);
      setTrend(historyData.trend || 'stable');
      setLatest(latestData.valuation || null);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: string | number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(Number(value));
  };

  const getTrendIcon = () => {
    if (trend === 'increasing') return '📈';
    if (trend === 'decreasing') return '📉';
    return '➡️';
  };

  const getTrendColor = () => {
    if (trend === 'increasing') return 'text-green-600';
    if (trend === 'decreasing') return 'text-red-600';
    return 'text-gray-600';
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
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <p className="text-red-800">Error loading valuations: {error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">
          💵 Property Valuations
        </h2>
        <p className="text-gray-600 mt-1">Automated valuation tracking and trend analysis</p>
      </div>

      {/* Latest Valuation Card */}
      {latest && (
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg shadow-lg p-6">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-blue-100 text-sm font-medium mb-2">Current Valuation</p>
              <p className="text-4xl font-bold">{formatCurrency(latest.estimated_value)}</p>
              {latest.value_change_percent && (
                <p className={`mt-2 text-lg ${Number(latest.value_change_percent) >= 0 ? 'text-green-300' : 'text-red-300'}`}>
                  {Number(latest.value_change_percent) >= 0 ? '▲' : '▼'} {Math.abs(Number(latest.value_change_percent)).toFixed(2)}% from previous
                </p>
              )}
            </div>
            <div className="text-right">
              <p className="text-blue-100 text-sm">Confidence Score</p>
              <p className="text-2xl font-bold">{(Number(latest.confidence_score) * 100).toFixed(0)}%</p>
              <p className="text-blue-200 text-xs mt-1">{latest.valuation_type.replace(/_/g, ' ')}</p>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-blue-500 flex items-center justify-between text-sm">
            <span>📅 {new Date(latest.valuation_date).toLocaleDateString()}</span>
            <span>Source: {latest.data_source}</span>
          </div>
        </div>
      )}

      {/* Trend Indicator */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-600 text-sm font-medium">Market Trend</p>
            <p className={`text-2xl font-bold ${getTrendColor()} flex items-center gap-2 mt-1`}>
              <span>{getTrendIcon()}</span>
              <span className="capitalize">{trend}</span>
            </p>
          </div>
          <div className="text-right">
            <p className="text-gray-600 text-sm">Total Valuations</p>
            <p className="text-3xl font-bold text-gray-900">{valuations.length}</p>
          </div>
        </div>
      </div>

      {/* Valuation History */}
      <div className="bg-white rounded-lg shadow-lg">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Valuation History</h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Valuation</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Change</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Confidence</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Source</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {valuations.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    No valuation history available
                  </td>
                </tr>
              ) : (
                valuations.map(val => (
                  <tr key={val.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(val.valuation_date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {val.valuation_type.replace(/_/g, ' ')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-gray-900">
                      {formatCurrency(val.estimated_value)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                      {val.value_change_percent ? (
                        <span className={Number(val.value_change_percent) >= 0 ? 'text-green-600' : 'text-red-600'}>
                          {Number(val.value_change_percent) >= 0 ? '▲' : '▼'} {Math.abs(Number(val.value_change_percent)).toFixed(2)}%
                        </span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded">
                        {(Number(val.confidence_score) * 100).toFixed(0)}%
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {val.data_source}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default PropertyValuations;
