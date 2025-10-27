/**
 * Feature #3: Investor Intelligence Suite - Portfolio Analytics
 * Risk scoring, diversification analysis, and portfolio recommendations
 */

import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface RiskAssessment {
  id: number;
  overallRiskScore: number;
  concentrationRisk: number;
  diversificationScore: number;
  volatilityScore: number;
  riskLevel: string;
  recommendations: string;
  calculatedAt: string;
}

interface PortfolioHistory {
  month: string;
  totalValue: number;
  totalRevenue: number;
  propertyCount: number;
  averageROI: number;
}

interface Cohort {
  id: number;
  cohortName: string;
  investorCount: number;
  averageROI: number;
  averagePortfolioSize: number;
  riskProfile: string;
}

const PortfolioAnalytics: React.FC<{ investorId?: number }> = ({ investorId }) => {
  const [riskAssessment, setRiskAssessment] = useState<RiskAssessment | null>(null);
  const [portfolioHistory, setPortfolioHistory] = useState<PortfolioHistory[]>([]);
  const [cohorts, setCohorts] = useState<Cohort[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'risk' | 'history' | 'cohorts'>('risk');

  useEffect(() => {
    loadAnalytics();
  }, [investorId]);

  const loadAnalytics = async () => {
    setLoading(true);
    setError(null);

    try {
      const params = investorId ? { investorId } : {};

      const [riskResponse, historyResponse, cohortsResponse] = await Promise.all([
        axios.get('/api/intelligence/risk-assessment', { params }),
        axios.get('/api/intelligence/portfolio-history', { params: { ...params, limit: 12 } }),
        axios.get('/api/intelligence/cohorts')
      ]);

      setRiskAssessment(riskResponse.data.risk || null);
      setPortfolioHistory(historyResponse.data.history || []);
      setCohorts(cohortsResponse.data.cohorts || []);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load portfolio analytics');
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      year: 'numeric'
    });
  };

  const getRiskLevelColor = (level: string) => {
    switch (level?.toLowerCase()) {
      case 'low': return 'bg-green-100 text-green-800';
      case 'moderate': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Portfolio Analytics</h2>
        <button
          onClick={loadAnalytics}
          className="px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700"
        >
          Refresh
        </button>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('risk')}
            className={`${
              activeTab === 'risk'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            Risk Assessment
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`${
              activeTab === 'history'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            Portfolio History
          </button>
          <button
            onClick={() => setActiveTab('cohorts')}
            className={`${
              activeTab === 'cohorts'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            Investor Cohorts
          </button>
        </nav>
      </div>

      {/* Risk Assessment Tab */}
      {activeTab === 'risk' && (
        <div className="space-y-6">
          {riskAssessment ? (
            <>
              {/* Overall Risk Score */}
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Overall Risk Assessment</h3>
                  <span className={`px-4 py-2 rounded-full text-sm font-semibold ${getRiskLevelColor(riskAssessment.riskLevel)}`}>
                    {riskAssessment.riskLevel} Risk
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Risk Score Circle */}
                  <div className="flex items-center justify-center">
                    <div className="relative">
                      <svg className="w-40 h-40">
                        <circle
                          className="text-gray-200"
                          strokeWidth="12"
                          stroke="currentColor"
                          fill="transparent"
                          r="62"
                          cx="80"
                          cy="80"
                        />
                        <circle
                          className={getScoreColor(riskAssessment.overallRiskScore)}
                          strokeWidth="12"
                          strokeDasharray={`${(riskAssessment.overallRiskScore / 100) * 389.56} 389.56`}
                          strokeLinecap="round"
                          stroke="currentColor"
                          fill="transparent"
                          r="62"
                          cx="80"
                          cy="80"
                          transform="rotate(-90 80 80)"
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center flex-col">
                        <span className={`text-3xl font-bold ${getScoreColor(riskAssessment.overallRiskScore)}`}>
                          {riskAssessment.overallRiskScore}
                        </span>
                        <span className="text-sm text-gray-500">Risk Score</span>
                      </div>
                    </div>
                  </div>

                  {/* Risk Metrics */}
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-gray-700">Concentration Risk</span>
                        <span className={`font-semibold ${getScoreColor(100 - riskAssessment.concentrationRisk)}`}>
                          {riskAssessment.concentrationRisk}/100
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-red-500 h-2 rounded-full"
                          style={{ width: `${riskAssessment.concentrationRisk}%` }}
                        ></div>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-gray-700">Diversification Score</span>
                        <span className={`font-semibold ${getScoreColor(riskAssessment.diversificationScore)}`}>
                          {riskAssessment.diversificationScore}/100
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-green-500 h-2 rounded-full"
                          style={{ width: `${riskAssessment.diversificationScore}%` }}
                        ></div>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-gray-700">Volatility Score</span>
                        <span className={`font-semibold ${getScoreColor(100 - riskAssessment.volatilityScore)}`}>
                          {riskAssessment.volatilityScore}/100
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-yellow-500 h-2 rounded-full"
                          style={{ width: `${riskAssessment.volatilityScore}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Recommendations */}
                {riskAssessment.recommendations && (
                  <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                    <h4 className="text-sm font-semibold text-blue-900 mb-2">Recommendations</h4>
                    <p className="text-sm text-blue-800">{riskAssessment.recommendations}</p>
                  </div>
                )}

                <div className="mt-4 text-xs text-gray-500">
                  Last calculated: {formatDate(riskAssessment.calculatedAt)}
                </div>
              </div>
            </>
          ) : (
            <div className="bg-white rounded-lg shadow p-12 text-center">
              <p className="text-gray-500">No risk assessment data available</p>
            </div>
          )}
        </div>
      )}

      {/* Portfolio History Tab */}
      {activeTab === 'history' && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">12-Month Performance History</h3>
          {portfolioHistory.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Month
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Portfolio Value
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Revenue
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Properties
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Avg ROI
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {portfolioHistory.map((history, idx) => (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {formatDate(history.month)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(history.totalValue)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-medium">
                        {formatCurrency(history.totalRevenue)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {history.propertyCount}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600 font-medium">
                        {formatPercent(history.averageROI)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">No historical data available</div>
          )}
        </div>
      )}

      {/* Investor Cohorts Tab */}
      {activeTab === 'cohorts' && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Investor Cohort Analysis</h3>
          <p className="text-sm text-gray-600 mb-6">
            Compare your performance with investors in similar cohorts based on investment size, risk profile, and strategy.
          </p>
          {cohorts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {cohorts.map((cohort) => (
                <div key={cohort.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <h4 className="font-semibold text-gray-900 mb-3">{cohort.cohortName}</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Investors:</span>
                      <span className="font-medium text-gray-900">{cohort.investorCount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Avg ROI:</span>
                      <span className="font-medium text-green-600">{formatPercent(cohort.averageROI)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Avg Portfolio:</span>
                      <span className="font-medium text-gray-900">{formatCurrency(cohort.averagePortfolioSize)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Risk Profile:</span>
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${getRiskLevelColor(cohort.riskProfile)}`}>
                        {cohort.riskProfile}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">No cohort data available</div>
          )}
        </div>
      )}
    </div>
  );
};

export default PortfolioAnalytics;
