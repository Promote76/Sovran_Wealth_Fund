import React, { useState, useEffect } from 'react';

interface RiskMetric {
  name: string;
  value: string;
  level: 'Low' | 'Moderate' | 'High' | 'Critical';
  trend: 'up' | 'down' | 'stable';
  description: string;
}

const RiskDashboardPage: React.FC = () => {
  const [riskMetrics, setRiskMetrics] = useState<RiskMetric[]>([]);
  const [overallRiskScore, setOverallRiskScore] = useState(0);
  const [selectedTimeframe, setSelectedTimeframe] = useState('7d');

  useEffect(() => {
    // Mock risk data
    const mockMetrics: RiskMetric[] = [
      {
        name: 'Market Volatility Risk',
        value: '23%',
        level: 'Moderate',
        trend: 'down',
        description: 'Volatility of underlying assets in the portfolio'
      },
      {
        name: 'Liquidity Risk',
        value: '12%',
        level: 'Low',
        trend: 'stable',
        description: 'Risk of not being able to sell assets quickly'
      },
      {
        name: 'Smart Contract Risk',
        value: '8%',
        level: 'Low',
        trend: 'down',
        description: 'Risk from smart contract vulnerabilities'
      },
      {
        name: 'Concentration Risk',
        value: '35%',
        level: 'High',
        trend: 'up',
        description: 'Risk from over-concentration in specific assets'
      },
      {
        name: 'Regulatory Risk',
        value: '18%',
        level: 'Moderate',
        trend: 'stable',
        description: 'Risk from changing regulatory environment'
      },
      {
        name: 'Counterparty Risk',
        value: '15%',
        level: 'Low',
        trend: 'down',
        description: 'Risk from third-party service providers'
      }
    ];
    
    setRiskMetrics(mockMetrics);
    setOverallRiskScore(72); // Out of 100
  }, []);

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'Low': return 'text-green-400 bg-green-500';
      case 'Moderate': return 'text-yellow-400 bg-yellow-500';
      case 'High': return 'text-orange-400 bg-orange-500';
      case 'Critical': return 'text-red-400 bg-red-500';
      default: return 'text-gray-400 bg-gray-500';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return '↗️';
      case 'down': return '↘️';
      case 'stable': return '➡️';
      default: return '➡️';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-yellow-400';
    if (score >= 40) return 'text-orange-400';
    return 'text-red-400';
  };

  return (
    <div className="bg-gradient-to-br from-white via-blue-50 to-white min-h-screen">

      {/* Hero Section */}
      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-6 text-blue-800">
            Risk <span className="text-blue-600">Analytics</span>
          </h1>
          <p className="text-xl text-gray-700 max-w-3xl mx-auto">
            Advanced risk monitoring and predictive analytics for the Sovran Wealth Fund platform. 
            Real-time assessment of market, operational, and systemic risks.
          </p>
        </div>

        {/* Overall Risk Score */}
        <div className="flex justify-center mb-12">
          <div className="bg-gradient-to-br from-white to-blue-50 border-2 border-blue-300 rounded-xl p-8 text-center shadow-lg">
            <h2 className="text-2xl font-bold mb-4 text-blue-800">Overall Risk Score</h2>
            <div className="text-6xl font-bold mb-4 text-blue-600">
              {overallRiskScore}
            </div>
            <div className="text-gray-700">out of 100</div>
            <div className="text-sm text-gray-600 mt-2">
              Score updated every 15 minutes
            </div>
          </div>
        </div>

        {/* Risk Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          <div className="bg-gradient-to-br from-white to-blue-50 border-2 border-blue-300 rounded-xl p-6 text-center shadow-lg">
            <div className="text-2xl font-bold text-blue-600 mb-2">4</div>
            <div className="text-gray-700">Low Risk Items</div>
          </div>
          <div className="bg-gradient-to-br from-white to-blue-50 border-2 border-blue-300 rounded-xl p-6 text-center shadow-lg">
            <div className="text-2xl font-bold text-blue-600 mb-2">2</div>
            <div className="text-gray-700">Moderate Risk Items</div>
          </div>
          <div className="bg-gradient-to-br from-white to-blue-50 border-2 border-blue-300 rounded-xl p-6 text-center shadow-lg">
            <div className="text-2xl font-bold text-blue-600 mb-2">1</div>
            <div className="text-gray-700">High Risk Items</div>
          </div>
          <div className="bg-gradient-to-br from-white to-blue-50 border-2 border-blue-300 rounded-xl p-6 text-center shadow-lg">
            <div className="text-2xl font-bold text-blue-600 mb-2">0</div>
            <div className="text-gray-700">Critical Risk Items</div>
          </div>
        </div>

        {/* Risk Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {riskMetrics.map((metric, index) => (
            <div
              key={index}
              className="bg-gradient-to-br from-white to-blue-50 border-2 border-blue-300 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-200"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-blue-800">{metric.name}</h3>
                <span className="text-xl">{getTrendIcon(metric.trend)}</span>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold text-blue-700">{metric.value}</span>
                  <span className={`px-2 py-1 rounded text-xs font-medium text-white ${getRiskColor(metric.level).split(' ')[1]}`}>
                    {metric.level}
                  </span>
                </div>
                
                <p className="text-sm text-gray-600">{metric.description}</p>
                
                {/* Risk Level Indicator */}
                <div className="w-full bg-blue-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full bg-gradient-to-r from-blue-400 to-blue-600`}
                    style={{ 
                      width: `${
                        metric.level === 'Low' ? 25 :
                        metric.level === 'Moderate' ? 50 :
                        metric.level === 'High' ? 75 : 100
                      }%` 
                    }}
                  ></div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Risk Analysis Chart */}
        <div className="bg-gradient-to-br from-white to-blue-50 border-2 border-blue-300 rounded-xl p-8 mb-12 shadow-lg">
          <h2 className="text-2xl font-bold mb-6 text-blue-800">Risk Trend Analysis</h2>
          <div className="h-64 bg-blue-100 border-2 border-blue-200 rounded-lg flex items-center justify-center">
            <div className="text-gray-600 text-center">
              <div className="text-4xl mb-4">📊</div>
              <div>Interactive risk trend chart coming soon</div>
              <div className="text-sm mt-2">Historical risk analysis over {selectedTimeframe}</div>
            </div>
          </div>
        </div>

        {/* Risk Mitigation Recommendations */}
        <div className="bg-gradient-to-br from-white to-blue-50 border-2 border-blue-300 rounded-xl p-8 mb-12 shadow-lg">
          <h2 className="text-2xl font-bold mb-6 text-blue-800">Risk Mitigation Recommendations</h2>
          <div className="space-y-4">
            <div className="flex items-start space-x-4 p-4 bg-blue-100 border-2 border-blue-200 rounded-lg">
              <span className="text-2xl">⚠️</span>
              <div>
                <h3 className="font-bold text-blue-700">High Concentration Risk Detected</h3>
                <p className="text-gray-700">Consider diversifying holdings across more asset classes to reduce concentration risk.</p>
                <button className="mt-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg shadow-lg transition-all duration-200 text-sm">
                  View Diversification Options
                </button>
              </div>
            </div>
            
            <div className="flex items-start space-x-4 p-4 bg-blue-100 border-2 border-blue-200 rounded-lg">
              <span className="text-2xl">💡</span>
              <div>
                <h3 className="font-bold text-blue-700">Market Volatility Hedge</h3>
                <p className="text-gray-700">Consider increasing stable asset allocation during high volatility periods.</p>
                <button className="mt-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg shadow-lg transition-all duration-200 text-sm">
                  Adjust Portfolio
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Risk Management Tools */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-100 border-2 border-blue-300 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🎯</span>
            </div>
            <h3 className="text-lg font-semibold mb-2 text-blue-800">Predictive Analytics</h3>
            <p className="text-gray-600">AI-powered risk prediction and scenario modeling</p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-100 border-2 border-blue-300 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">📊</span>
            </div>
            <h3 className="text-lg font-semibold mb-2 text-blue-800">Real-time Monitoring</h3>
            <p className="text-gray-600">Continuous risk assessment and alerts</p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-100 border-2 border-blue-300 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🛡️</span>
            </div>
            <h3 className="text-lg font-semibold mb-2 text-blue-800">Automated Hedging</h3>
            <p className="text-gray-600">Dynamic risk mitigation strategies</p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-100 border-2 border-blue-300 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">📋</span>
            </div>
            <h3 className="text-lg font-semibold mb-2 text-blue-800">Compliance Tracking</h3>
            <p className="text-gray-600">Regulatory compliance monitoring and reporting</p>
          </div>
        </div>
      </div>
      </div>
  );
};

export default RiskDashboardPage;