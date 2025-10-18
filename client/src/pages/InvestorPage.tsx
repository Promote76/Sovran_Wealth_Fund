import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStats } from '../contexts/StatsContext';

const InvestorPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [defiData, setDefiData] = useState<any>(null);
  const [platformMetrics, setPlatformMetrics] = useState<any>(null);
  const { stats, loading: statsLoading, error: statsError } = useStats();

  const investmentOptions = [
    {
      title: "AXM Token Staking",
      apy: "12-18%*",
      risk: "Low",
      lockPeriod: "Flexible",
      minInvestment: "100 AXM",
      description: "Stake AXM tokens to earn consistent rewards while supporting network security and governance.",
      features: ["Compound interest", "Governance voting rights", "Flexible withdrawal", "Auto-reinvestment options"]
    },
    {
      title: "Real Estate Tokenization",
      apy: "8-15%*",
      risk: "Medium",
      lockPeriod: "12-60 months",
      minInvestment: "$1,000",
      description: "Invest in fractional ownership of premium real estate properties through blockchain tokenization.",
      features: ["Property dividends", "Capital appreciation", "Legal ownership rights", "Global property access"]
    },
    {
      title: "Liquidity Provision",
      apy: "15-25%*",
      risk: "Medium-High",
      lockPeriod: "None",
      minInvestment: "$500",
      description: "Provide liquidity to our DEX pools and earn trading fees plus additional rewards.",
      features: ["Trading fee sharing", "Bonus rewards", "Impermanent loss protection", "Auto-compounding"]
    },
    {
      title: "Gold Certificate Backing",
      apy: "6-10%*",
      risk: "Low",
      lockPeriod: "6-36 months",
      minInvestment: "$2,500",
      description: "Invest in Kinesis gold-backed certificates for stable returns with precious metal security.",
      features: ["Physical gold backing", "Inflation hedge", "Stable value", "Global liquidity"]
    },
    {
      title: "DeFi Yield Farming",
      apy: "20-40%*",
      risk: "High",
      lockPeriod: "Variable",
      minInvestment: "$250",
      description: "Participate in advanced DeFi strategies across multiple protocols for maximum yields.",
      features: ["Multi-protocol access", "Auto-optimization", "Risk management", "High APY potential"]
    },
    {
      title: "DAO Governance Investment",
      apy: "5-12%*",
      risk: "Low",
      lockPeriod: "None",
      minInvestment: "1,000 AXM",
      description: "Participate in platform governance while earning rewards for active participation.",
      features: ["Voting rewards", "Proposal bonuses", "Long-term value", "Platform influence"]
    }
  ];

  // Fetch real DeFi market data
  useEffect(() => {
    const fetchDefiData = async () => {
      try {
        const response = await fetch('/api/market/defi-intelligence');
        if (response.ok) {
          const data = await response.json();
          setDefiData(data);
        }
      } catch (error) {
        console.error('Failed to fetch DeFi data:', error);
      }
    };

    const fetchPlatformMetrics = async () => {
      try {
        const response = await fetch('/api/platform-stats');
        if (response.ok) {
          const data = await response.json();
          setPlatformMetrics(data);
        }
      } catch (error) {
        console.error('Failed to fetch platform metrics:', error);
      }
    };

    fetchDefiData();
    fetchPlatformMetrics();
  }, []);

  // Calculate real-time performance metrics from blockchain data
  const calculateTVL = () => {
    if (!defiData?.protocols) return '$0';
    const totalTVL = defiData.protocols.reduce((sum: number, protocol: any) => sum + (protocol.tvl || 0), 0);
    return totalTVL > 1000000000 ? `$${(totalTVL / 1000000000).toFixed(1)}B` : `$${(totalTVL / 1000000).toFixed(1)}M`;
  };

  const calculateAverageAPY = () => {
    if (!defiData?.protocols) return '0%';
    const totalAPY = defiData.protocols.reduce((sum: number, protocol: any) => sum + (protocol.apr || 0), 0);
    return `${(totalAPY / defiData.protocols.length).toFixed(1)}%`;
  };

  const performanceMetrics = [
    { 
      metric: "Total Value Locked (TVL)", 
      value: calculateTVL(), 
      change: defiData?.totalTvlChange24h ? `${defiData.totalTvlChange24h > 0 ? '+' : ''}${defiData.totalTvlChange24h.toFixed(1)}%` : "Loading..." 
    },
    { 
      metric: "Active Investors", 
      value: "0", 
      change: "Pre-Launch" 
    },
    { 
      metric: "Average APY", 
      value: calculateAverageAPY(), 
      change: defiData?.avgAprChange ? `${defiData.avgAprChange > 0 ? '+' : ''}${defiData.avgAprChange.toFixed(1)}%` : "Loading..." 
    },
    { 
      metric: "Platform Ready", 
      value: platformMetrics?.status === 'live' ? "Yes" : "Loading...", 
      change: "Ready for Launch" 
    },
    { 
      metric: "Smart Contracts", 
      value: platformMetrics?.contract ? "Verified" : "Loading...", 
      change: "Audited" 
    },
    { 
      metric: "Investment Pools", 
      value: defiData?.protocols ? defiData.protocols.length.toString() : "Loading...", 
      change: "Available" 
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-blue-50 to-white py-12">
        <div className="container mx-auto px-4 max-w-7xl">
          
          {/* Hero Section */}
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-6xl font-bold text-blue-900 mb-6">
              Investor Portal
            </h1>
            <p className="text-xl md:text-2xl text-blue-700 max-w-4xl mx-auto leading-relaxed mb-8">
              Discover institutional-grade investment opportunities in the decentralized economy. 
              From real estate tokenization to DeFi yield farming - build your wealth with confidence.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
              <button 
                onClick={() => navigate('/dashboard')}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-8 rounded-lg transition-all transform hover:scale-105 shadow-lg"
              >
                Start Investing Today
              </button>
              <button 
                onClick={() => setActiveTab('calculator')}
                className="bg-white border-2 border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white font-bold py-4 px-8 rounded-lg transition-all transform hover:scale-105 shadow-lg"
              >
                Investment Calculator
              </button>
            </div>

            {/* Performance Dashboard */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 max-w-6xl mx-auto">
              {performanceMetrics.map((metric, index) => (
                <div key={index} className="bg-white rounded-lg shadow-md p-4 border-l-4 border-blue-500">
                  <div className="text-2xl font-bold text-blue-900">{metric.value}</div>
                  <div className="text-sm text-gray-600 mb-1">{metric.metric}</div>
                  <div className={`text-xs font-medium ${metric.change.startsWith('+') ? 'text-green-600' : metric.change.startsWith('-') ? 'text-red-600' : 'text-gray-500'}`}>
                    {metric.change}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex flex-wrap justify-center mb-12 bg-white rounded-xl shadow-lg p-2">
            {[
              { id: 'overview', label: 'Investment Overview', icon: '📊' },
              { id: 'opportunities', label: 'Opportunities', icon: '💰' },
              { id: 'analytics', label: 'Performance Analytics', icon: '📈' },
              { id: 'calculator', label: 'ROI Calculator', icon: '🧮' },
              { id: 'risks', label: 'Risk Assessment', icon: '⚖️' },
              { id: 'process', label: 'How to Invest', icon: '🎯' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-4 py-3 rounded-lg transition-all font-medium ${
                  activeTab === tab.id 
                    ? 'bg-blue-600 text-white shadow-md' 
                    : 'text-blue-600 hover:bg-blue-50'
                }`}
              >
                <span>{tab.icon}</span>
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="bg-white rounded-xl shadow-lg p-8 md:p-12">
            
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div>
                <h2 className="text-4xl font-bold text-blue-900 mb-8 text-center">
                  Why Invest with AXIOM?
                </h2>
                
                <div className="grid md:grid-cols-2 gap-12 mb-12">
                  <div>
                    <h3 className="text-2xl font-bold text-blue-900 mb-6">🏆 Competitive Advantages</h3>
                    <ul className="space-y-4">
                      <li className="flex items-start space-x-3">
                        <span className="text-green-600 font-bold">✓</span>
                        <div>
                          <strong>Institutional-Grade Security:</strong> Multi-signature wallets, smart contract audits, and robust security protocols
                        </div>
                      </li>
                      <li className="flex items-start space-x-3">
                        <span className="text-green-600 font-bold">✓</span>
                        <div>
                          <strong>Diversified Portfolio:</strong> Real estate, DeFi, precious metals, and traditional assets
                        </div>
                      </li>
                      <li className="flex items-start space-x-3">
                        <span className="text-green-600 font-bold">✓</span>
                        <div>
                          <strong>Transparent Operations:</strong> All transactions and performance metrics publicly verifiable
                        </div>
                      </li>
                      <li className="flex items-start space-x-3">
                        <span className="text-green-600 font-bold">✓</span>
                        <div>
                          <strong>Community Governance:</strong> Investors have voting rights on platform decisions
                        </div>
                      </li>
                    </ul>
                  </div>
                  
                  <div>
                    <h3 className="text-2xl font-bold text-blue-900 mb-6">🚀 Platform Status</h3>
                    <div className="space-y-4">
                      <div className="bg-blue-50 rounded-lg p-4">
                        <div className="text-3xl font-bold text-blue-900">Ready</div>
                        <div className="text-blue-700">Platform Status</div>
                      </div>
                      <div className="bg-green-50 rounded-lg p-4">
                        <div className="text-3xl font-bold text-green-900">$0</div>
                        <div className="text-green-700">Current TVL (Pre-Launch)</div>
                      </div>
                      <div className="bg-purple-50 rounded-lg p-4">
                        <div className="text-3xl font-bold text-purple-900">0</div>
                        <div className="text-purple-700">Active Investors</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-blue-900 to-purple-900 rounded-xl p-8 text-white text-center">
                  <h3 className="text-2xl font-bold mb-4">Ready to Be Our First Investor?</h3>
                  <p className="text-xl mb-6">Be among the first to join the AXIOM platform at launch</p>
                  <button 
                    onClick={() => navigate('/dashboard')}
                    className="bg-white text-blue-900 font-bold py-3 px-8 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    Get Started Now
                  </button>
                </div>
              </div>
            )}

            {/* Investment Opportunities Tab */}
            {activeTab === 'opportunities' && (
              <div>
                <h2 className="text-4xl font-bold text-blue-900 mb-8 text-center">
                  Investment Opportunities
                </h2>
                
                <div className="grid lg:grid-cols-2 gap-8 mb-12">
                  {investmentOptions.map((option, index) => (
                    <div key={index} className="border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow">
                      <div className="flex justify-between items-start mb-4">
                        <h3 className="text-xl font-bold text-blue-900">{option.title}</h3>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-green-600">{option.apy}</div>
                          <div className="text-sm text-gray-600">APY</div>
                        </div>
                      </div>
                      
                      <p className="text-gray-700 mb-4">{option.description}</p>
                      
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                          <div className="text-sm text-gray-600">Risk Level</div>
                          <div className={`font-medium ${
                            option.risk === 'Low' ? 'text-green-600' : 
                            option.risk === 'Medium' ? 'text-yellow-600' : 
                            option.risk.includes('Medium') ? 'text-orange-600' : 'text-red-600'
                          }`}>
                            {option.risk}
                          </div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-600">Lock Period</div>
                          <div className="font-medium text-blue-900">{option.lockPeriod}</div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-600">Minimum Investment</div>
                          <div className="font-medium text-blue-900">{option.minInvestment}</div>
                        </div>
                      </div>
                      
                      <div className="border-t pt-4">
                        <div className="text-sm text-gray-600 mb-2">Key Features:</div>
                        <div className="flex flex-wrap gap-2">
                          {option.features.map((feature, featureIndex) => (
                            <span key={featureIndex} className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                              {feature}
                            </span>
                          ))}
                        </div>
                      </div>
                      
                      <button 
                        onClick={() => navigate('/dashboard')}
                        className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition-colors"
                      >
                        Invest Now
                      </button>
                    </div>
                  ))}
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 mb-8">
                  <h4 className="font-bold text-yellow-800 mb-2">⚠️ Important Disclaimer</h4>
                  <p className="text-yellow-700 text-sm">
                    *All APY percentages shown are <strong>projected estimates</strong> based on current DeFi market conditions and are <strong>not guaranteed returns</strong>. 
                    Actual returns may vary significantly due to market volatility, protocol changes, and other factors. 
                    Cryptocurrency investments carry high risk and you may lose your entire investment.
                  </p>
                </div>

                <div className="bg-gray-50 rounded-xl p-8">
                  <h3 className="text-2xl font-bold text-blue-900 mb-6 text-center">
                    Additional Earning Opportunities
                  </h3>
                  
                  <div className="grid md:grid-cols-3 gap-6">
                    <div className="text-center">
                      <div className="text-4xl mb-3">🎁</div>
                      <h4 className="font-bold text-blue-900 mb-2">Referral Program</h4>
                      <p className="text-gray-700 text-sm">Earn 2-5% commissions for referring new investors to the platform</p>
                    </div>
                    
                    <div className="text-center">
                      <div className="text-4xl mb-3">🏅</div>
                      <h4 className="font-bold text-blue-900 mb-2">Loyalty Rewards</h4>
                      <p className="text-gray-700 text-sm">Higher tiers unlock better rates, exclusive access, and bonus rewards</p>
                    </div>
                    
                    <div className="text-center">
                      <div className="text-4xl mb-3">💎</div>
                      <h4 className="font-bold text-blue-900 mb-2">Early Access</h4>
                      <p className="text-gray-700 text-sm">Get priority access to new investment opportunities and token sales</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Performance Analytics Tab */}
            {activeTab === 'analytics' && (
              <div>
                <h2 className="text-4xl font-bold text-blue-900 mb-8 text-center">
                  Live Performance Analytics
                </h2>
                
                <div className="grid md:grid-cols-2 gap-8 mb-12">
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6">
                    <h3 className="text-xl font-bold text-blue-900 mb-4">Real-Time Protocol Performance</h3>
                    <div className="space-y-3">
                      {defiData?.protocols ? defiData.protocols.slice(0, 5).map((protocol: any, index: number) => (
                        <div key={index} className="flex justify-between">
                          <span>{protocol.name}:</span>
                          <span className={`font-bold ${protocol.aprChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {protocol.apr.toFixed(1)}% APR ({protocol.aprChange >= 0 ? '+' : ''}{protocol.aprChange.toFixed(1)}%)
                          </span>
                        </div>
                      )) : (
                        <div className="text-gray-500">Loading real-time performance data...</div>
                      )}
                      {defiData?.protocols && (
                        <div className="flex justify-between border-t pt-2">
                          <span className="font-bold">Platform Average:</span>
                          <span className="font-bold text-blue-600">{calculateAverageAPY()}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6">
                    <h3 className="text-xl font-bold text-green-900 mb-4">Live Protocol Distribution</h3>
                    <div className="space-y-3">
                      {defiData?.protocols ? defiData.protocols.slice(0, 4).map((protocol: any, index: number) => {
                        const percentage = ((protocol.tvl / defiData.protocols.reduce((sum: number, p: any) => sum + p.tvl, 0)) * 100);
                        const colors = ['bg-blue-600', 'bg-green-600', 'bg-yellow-600', 'bg-purple-600'];
                        return (
                          <div key={index} className="flex justify-between items-center">
                            <span>{protocol.name}</span>
                            <div className="flex items-center space-x-2">
                              <div className="w-24 bg-gray-200 rounded-full h-2">
                                <div className={`${colors[index % colors.length]} h-2 rounded-full`} style={{width: `${percentage}%`}}></div>
                              </div>
                              <span className="font-bold">{percentage.toFixed(1)}%</span>
                            </div>
                          </div>
                        );
                      }) : (
                        <div className="text-gray-500">Loading protocol distribution...</div>
                      )}
                      {defiData?.totalTvl && (
                        <div className="border-t pt-2">
                          <div className="flex justify-between">
                            <span className="font-bold">Total TVL:</span>
                            <span className="font-bold text-green-600">{calculateTVL()}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid md:grid-cols-3 gap-6">
                  <div className="bg-white border border-gray-200 rounded-xl p-6 text-center">
                    <div className="text-3xl font-bold text-blue-900 mb-2">0</div>
                    <div className="text-gray-600">Current Investors</div>
                    <div className="text-sm text-blue-600 mt-1">Pre-Launch Phase</div>
                  </div>
                  
                  <div className="bg-white border border-gray-200 rounded-xl p-6 text-center">
                    <div className="text-3xl font-bold text-green-900 mb-2">$0</div>
                    <div className="text-gray-600">Platform Volume</div>
                    <div className="text-sm text-blue-600 mt-1">Awaiting First Investors</div>
                  </div>
                  
                  <div className="bg-white border border-gray-200 rounded-xl p-6 text-center">
                    <div className="text-3xl font-bold text-purple-900 mb-2">Ready</div>
                    <div className="text-gray-600">Platform Status</div>
                    <div className="text-sm text-green-600 mt-1">Fully Operational</div>
                  </div>
                </div>
              </div>
            )}

            {/* ROI Calculator Tab */}
            {activeTab === 'calculator' && (
              <div>
                <h2 className="text-4xl font-bold text-blue-900 mb-8 text-center">
                  Investment ROI Calculator
                </h2>
                
                <div className="max-w-4xl mx-auto">
                  <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-8">
                    <div className="grid md:grid-cols-2 gap-8">
                      <div>
                        <h3 className="text-xl font-bold text-blue-900 mb-6">Investment Parameters</h3>
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Investment Amount ($)</label>
                            <input 
                              type="number" 
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="10000"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Investment Strategy</label>
                            <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                              <option>SWF Token Staking (12-18% APY)</option>
                              <option>Real Estate Tokens (8-15% APY)</option>
                              <option>Liquidity Provision (15-25% APY)</option>
                              <option>DeFi Yield Farming (20-40% APY)</option>
                              <option>Mixed Portfolio (12-22% APY)</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Time Period (months)</label>
                            <input 
                              type="number" 
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="12"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Compounding Frequency</label>
                            <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                              <option>Daily</option>
                              <option>Weekly</option>
                              <option>Monthly</option>
                              <option>Quarterly</option>
                            </select>
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <h3 className="text-xl font-bold text-blue-900 mb-6">Projected Returns</h3>
                        <div className="space-y-4">
                          <div className="bg-white rounded-lg p-4 border-l-4 border-green-500">
                            <div className="text-2xl font-bold text-green-900">$11,680</div>
                            <div className="text-green-700">Conservative Estimate (12% APY)</div>
                          </div>
                          <div className="bg-white rounded-lg p-4 border-l-4 border-blue-500">
                            <div className="text-2xl font-bold text-blue-900">$13,200</div>
                            <div className="text-blue-700">Expected Return (15% APY)</div>
                          </div>
                          <div className="bg-white rounded-lg p-4 border-l-4 border-purple-500">
                            <div className="text-2xl font-bold text-purple-900">$15,120</div>
                            <div className="text-purple-700">Optimistic Scenario (18% APY)</div>
                          </div>
                          
                          <div className="border-t pt-4">
                            <div className="text-sm text-gray-600 mb-2">Breakdown after 12 months:</div>
                            <div className="space-y-1 text-sm">
                              <div className="flex justify-between">
                                <span>Initial Investment:</span>
                                <span className="font-medium">$10,000</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Interest Earned:</span>
                                <span className="font-medium text-green-600">$3,200</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Total ROI:</span>
                                <span className="font-bold text-blue-900">32%</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-8 text-center">
                      <button 
                        onClick={() => navigate('/dashboard')}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg transition-colors"
                      >
                        Start This Investment
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Risk Assessment Tab */}
            {activeTab === 'risks' && (
              <div>
                <h2 className="text-4xl font-bold text-blue-900 mb-8 text-center">
                  Risk Assessment & Management
                </h2>
                
                <div className="grid md:grid-cols-2 gap-8 mb-12">
                  <div>
                    <h3 className="text-2xl font-bold text-blue-900 mb-6">Risk Mitigation Strategies</h3>
                    <div className="space-y-4">
                      <div className="border-l-4 border-green-500 bg-green-50 p-4 rounded-r-lg">
                        <h4 className="font-bold text-green-900 mb-2">🛡️ Smart Contract Security</h4>
                        <p className="text-green-800 text-sm">All contracts audited by leading security firms with bug bounty programs and formal verification.</p>
                      </div>
                      
                      <div className="border-l-4 border-blue-500 bg-blue-50 p-4 rounded-r-lg">
                        <h4 className="font-bold text-blue-900 mb-2">📊 Portfolio Diversification</h4>
                        <p className="text-blue-800 text-sm">Investments spread across multiple asset classes and protocols to minimize correlation risk.</p>
                      </div>
                      
                      <div className="border-l-4 border-purple-500 bg-purple-50 p-4 rounded-r-lg">
                        <h4 className="font-bold text-purple-900 mb-2">🔒 Security Measures</h4>
                        <p className="text-purple-800 text-sm">Multi-signature wallets, audited smart contracts, and timelocked governance provide robust security foundations.</p>
                      </div>
                      
                      <div className="border-l-4 border-orange-500 bg-orange-50 p-4 rounded-r-lg">
                        <h4 className="font-bold text-orange-900 mb-2">⚡ Real-time Monitoring</h4>
                        <p className="text-orange-800 text-sm">24/7 monitoring systems with automated risk alerts and emergency pause mechanisms.</p>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-2xl font-bold text-blue-900 mb-6">Risk Categories</h3>
                    <div className="space-y-4">
                      <div className="bg-white border border-gray-200 rounded-lg p-4">
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-medium">Smart Contract Risk</span>
                          <span className="text-green-600 font-bold">LOW</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div className="bg-green-500 h-2 rounded-full" style={{width: '20%'}}></div>
                        </div>
                      </div>
                      
                      <div className="bg-white border border-gray-200 rounded-lg p-4">
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-medium">Liquidity Risk</span>
                          <span className="text-yellow-600 font-bold">MEDIUM</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div className="bg-yellow-500 h-2 rounded-full" style={{width: '40%'}}></div>
                        </div>
                      </div>
                      
                      <div className="bg-white border border-gray-200 rounded-lg p-4">
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-medium">Market Volatility</span>
                          <span className="text-yellow-600 font-bold">MEDIUM</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div className="bg-yellow-500 h-2 rounded-full" style={{width: '50%'}}></div>
                        </div>
                      </div>
                      
                      <div className="bg-white border border-gray-200 rounded-lg p-4">
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-medium">Regulatory Risk</span>
                          <span className="text-green-600 font-bold">LOW</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div className="bg-green-500 h-2 rounded-full" style={{width: '25%'}}></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-xl p-8">
                  <h3 className="text-2xl font-bold text-blue-900 mb-6 text-center">Investment Protection Features</h3>
                  
                  <div className="grid md:grid-cols-3 gap-6">
                    <div className="text-center">
                      <div className="text-4xl mb-3">🔐</div>
                      <h4 className="font-bold text-blue-900 mb-2">Multi-Sig Wallets</h4>
                      <p className="text-gray-700 text-sm">All treasury funds protected by multi-signature wallets requiring multiple approvals</p>
                    </div>
                    
                    <div className="text-center">
                      <div className="text-4xl mb-3">⏰</div>
                      <h4 className="font-bold text-blue-900 mb-2">Time Locks</h4>
                      <p className="text-gray-700 text-sm">Critical updates have mandatory delay periods for community review</p>
                    </div>
                    
                    <div className="text-center">
                      <div className="text-4xl mb-3">🚨</div>
                      <h4 className="font-bold text-blue-900 mb-2">Emergency Pause</h4>
                      <p className="text-gray-700 text-sm">Immediate protocol pause capability in case of detected threats</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* How to Invest Tab */}
            {activeTab === 'process' && (
              <div>
                <h2 className="text-4xl font-bold text-blue-900 mb-8 text-center">
                  How to Start Investing
                </h2>
                
                <div className="max-w-4xl mx-auto">
                  <div className="space-y-8">
                    <div className="flex items-start space-x-6">
                      <div className="flex-shrink-0 w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-xl">1</div>
                      <div>
                        <h3 className="text-xl font-bold text-blue-900 mb-2">Create Your Account</h3>
                        <p className="text-gray-700 mb-4">Sign up for your AXIOM account and complete the KYC verification process. This ensures compliance and protects your investments.</p>
                        <button 
                          onClick={() => navigate('/dashboard')}
                          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded transition-colors"
                        >
                          Start Registration
                        </button>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-6">
                      <div className="flex-shrink-0 w-12 h-12 bg-green-600 text-white rounded-full flex items-center justify-center font-bold text-xl">2</div>
                      <div>
                        <h3 className="text-xl font-bold text-blue-900 mb-2">Connect Your Wallet</h3>
                        <p className="text-gray-700 mb-4">Connect your MetaMask or compatible wallet to interact with our smart contracts. We support BSC mainnet with automatic network switching.</p>
                        <div className="flex items-center space-x-4 text-sm text-gray-600">
                          <span className="flex items-center">
                            <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                            MetaMask Supported
                          </span>
                          <span className="flex items-center">
                            <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                            BSC Network
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-6">
                      <div className="flex-shrink-0 w-12 h-12 bg-purple-600 text-white rounded-full flex items-center justify-center font-bold text-xl">3</div>
                      <div>
                        <h3 className="text-xl font-bold text-blue-900 mb-2">Choose Your Investment Strategy</h3>
                        <p className="text-gray-700 mb-4">Select from our range of investment options based on your risk tolerance, investment goals, and time horizon. Use our calculator to model returns.</p>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                          <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">Conservative</span>
                          <span className="bg-green-100 text-green-800 px-2 py-1 rounded">Balanced</span>
                          <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded">Growth</span>
                          <span className="bg-red-100 text-red-800 px-2 py-1 rounded">Aggressive</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-6">
                      <div className="flex-shrink-0 w-12 h-12 bg-orange-600 text-white rounded-full flex items-center justify-center font-bold text-xl">4</div>
                      <div>
                        <h3 className="text-xl font-bold text-blue-900 mb-2">Fund Your Account</h3>
                        <p className="text-gray-700 mb-4">Deposit funds using cryptocurrency, bank transfer, or credit card. All transactions are secured and processed through our verified payment partners.</p>
                        <div className="flex flex-wrap gap-2 text-sm">
                          <span className="bg-gray-100 text-gray-800 px-3 py-1 rounded-full">BNB</span>
                          <span className="bg-gray-100 text-gray-800 px-3 py-1 rounded-full">USDT</span>
                          <span className="bg-gray-100 text-gray-800 px-3 py-1 rounded-full">USDC</span>
                          <span className="bg-gray-100 text-gray-800 px-3 py-1 rounded-full">Bank Transfer</span>
                          <span className="bg-gray-100 text-gray-800 px-3 py-1 rounded-full">Credit Card</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-6">
                      <div className="flex-shrink-0 w-12 h-12 bg-indigo-600 text-white rounded-full flex items-center justify-center font-bold text-xl">5</div>
                      <div>
                        <h3 className="text-xl font-bold text-blue-900 mb-2">Start Earning</h3>
                        <p className="text-gray-700 mb-4">Begin earning returns immediately. Monitor your portfolio performance, claim rewards, and reinvest profits through our intuitive dashboard.</p>
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                          <div className="flex items-center space-x-2 text-green-800">
                            <span className="text-2xl">🎉</span>
                            <span className="font-medium">Welcome bonus: Additional 1% APY for first 30 days!</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-12 text-center bg-gradient-to-r from-blue-900 to-purple-900 rounded-xl p-8 text-white">
                    <h3 className="text-2xl font-bold mb-4">Ready to Start Your Investment Journey?</h3>
                    <p className="text-xl mb-6">Join thousands of investors building wealth with AXIOM</p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                      <button 
                        onClick={() => navigate('/dashboard')}
                        className="bg-white text-blue-900 font-bold py-3 px-8 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        Get Started Now
                      </button>
                      <button 
                        onClick={() => navigate('/contact-us')}
                        className="border-2 border-white text-white font-bold py-3 px-8 rounded-lg hover:bg-white hover:text-blue-900 transition-all"
                      >
                        Speak with Advisor
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

          </div>

          {/* Contact & Inquiry Section */}
          <div className="mt-16">
            <div className="grid md:grid-cols-2 gap-8">
              
              {/* Inquiry Form */}
              <div className="bg-white rounded-xl shadow-lg p-8">
                <h3 className="text-2xl font-bold text-blue-900 mb-6">Request More Information</h3>
                <form className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                    <input 
                      type="text" 
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter your full name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                    <input 
                      type="email" 
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter your email address"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Investment Amount Range</label>
                    <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <option>Select investment range</option>
                      <option>$1,000 - $10,000</option>
                      <option>$10,000 - $50,000</option>
                      <option>$50,000 - $100,000</option>
                      <option>$100,000 - $500,000</option>
                      <option>$500,000+</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                    <textarea 
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 h-24"
                      placeholder="Tell us about your investment goals and any questions you have..."
                    ></textarea>
                  </div>
                  <button 
                    type="submit"
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-colors"
                  >
                    Send Inquiry
                  </button>
                </form>
              </div>

              {/* Contact Information */}
              <div className="bg-gradient-to-br from-blue-900 to-purple-900 rounded-xl shadow-lg p-8 text-white">
                <h3 className="text-2xl font-bold mb-6">Get In Touch</h3>
                
                <div className="space-y-6">
                  <div>
                    <h4 className="text-lg font-semibold mb-2">📧 Direct Email</h4>
                    <a 
                      href="mailto:info@axiomprotocol.io" 
                      className="text-blue-200 hover:text-white transition-colors text-lg"
                    >
                      info@axiomprotocol.io
                    </a>
                    <p className="text-blue-200 text-sm mt-1">
                      For investment inquiries and partnership opportunities
                    </p>
                  </div>
                  
                  <div>
                    <h4 className="text-lg font-semibold mb-2">⏰ Response Time</h4>
                    <p className="text-blue-200">
                      We typically respond to inquiries within 24 hours during business days.
                    </p>
                  </div>
                  
                  <div>
                    <h4 className="text-lg font-semibold mb-2">💬 What to Include</h4>
                    <ul className="text-blue-200 text-sm space-y-1">
                      <li>• Your investment timeline and goals</li>
                      <li>• Preferred investment amount range</li>
                      <li>• Risk tolerance level</li>
                      <li>• Any specific questions about our platform</li>
                    </ul>
                  </div>
                  
                  <div className="bg-white/10 rounded-lg p-4">
                    <p className="text-sm text-blue-100">
                      <strong>Accredited Investors:</strong> Please mention your accredited status 
                      for access to exclusive investment opportunities.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom CTA Section */}
          <div className="mt-16 text-center">
            <div className="bg-white rounded-xl shadow-lg p-8 md:p-12">
              <h2 className="text-3xl md:text-4xl font-bold text-blue-900 mb-6">
                Ready to Be Our First Investor?
              </h2>
              <p className="text-xl text-gray-700 mb-8 max-w-3xl mx-auto">
                Join the financial revolution and take control of your investment future with 
                institutional-grade DeFi strategies and transparent, secure protocols.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
                <button 
                  onClick={() => navigate('/dashboard')}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-8 rounded-lg transition-all transform hover:scale-105 shadow-lg"
                >
                  Start Investing Now
                </button>
                <a 
                  href="mailto:info@axiomprotocol.io?subject=Investment Inquiry - AXIOM"
                  className="bg-white border-2 border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white font-bold py-4 px-8 rounded-lg transition-all transform hover:scale-105 shadow-lg"
                >
                  Contact Us Directly
                </a>
              </div>

              <div className="flex justify-center items-center space-x-8 text-sm text-gray-600">
                <span className="flex items-center">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                  Platform Ready
                </span>
                <span className="flex items-center">
                  <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                  Smart Contracts Audited
                </span>
                <span className="flex items-center">
                  <span className="w-2 h-2 bg-purple-500 rounded-full mr-2"></span>
                  Pre-Launch Access
                </span>
              </div>
            </div>
          </div>

        </div>
      </div>
  );
};

export default InvestorPage;