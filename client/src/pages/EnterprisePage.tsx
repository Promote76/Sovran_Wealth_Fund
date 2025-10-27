import React, { useState } from 'react';

// Feature #5: Property Risk Sentinel
import RiskMonitor from '../components/riskSentinel/RiskMonitor';
import PropertyValuations from '../components/riskSentinel/PropertyValuations';
import AlertsDashboard from '../components/riskSentinel/AlertsDashboard';

// Feature #6: Co-Investment Syndication Portal
import SyndicateManager from '../components/syndication/SyndicateManager';
import WaterfallEditor from '../components/syndication/WaterfallEditor';
import InvestorInvitations from '../components/syndication/InvestorInvitations';

// Feature #7: Tax & Reporting Automation
import TaxCenter from '../components/tax/TaxCenter';
import DocumentGenerator from '../components/tax/DocumentGenerator';
import AnnualStatements from '../components/tax/AnnualStatements';

// Feature #8: Multi-chain Deployment Orchestrator
import DeploymentManager from '../components/multichain/DeploymentManager';
import BridgeMonitor from '../components/multichain/BridgeMonitor';
import GasOptimizer from '../components/multichain/GasOptimizer';

type Tab = 'overview' | 'liquidity' | 'compliance' | 'intelligence' | 'revenue' | 'risk' | 'syndication' | 'tax' | 'multichain';
type SubTab = Record<string, string>;

const EnterprisePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [subTabs, setSubTabs] = useState<SubTab>({
    risk: 'monitor',
    syndication: 'manager',
    tax: 'center',
    multichain: 'deployment'
  });

  const tabs = [
    { id: 'overview' as Tab, label: 'Dashboard', icon: '📊' },
    { id: 'liquidity' as Tab, label: 'Liquidity Desk', icon: '💧', badge: 'Feature #1' },
    { id: 'compliance' as Tab, label: 'Compliance', icon: '✅', badge: 'Feature #2' },
    { id: 'intelligence' as Tab, label: 'Intelligence', icon: '🧠', badge: 'Feature #3' },
    { id: 'revenue' as Tab, label: 'Revenue Engine', icon: '💰', badge: 'Feature #4' },
    { id: 'risk' as Tab, label: 'Risk Sentinel', icon: '🛡️', badge: 'Feature #5' },
    { id: 'syndication' as Tab, label: 'Syndication', icon: '🤝', badge: 'Feature #6' },
    { id: 'tax' as Tab, label: 'Tax Center', icon: '📋', badge: 'Feature #7' },
    { id: 'multichain' as Tab, label: 'Multi-chain', icon: '⛓️', badge: 'Feature #8' }
  ];

  const handleSubTabChange = (feature: string, subTab: string) => {
    setSubTabs(prev => ({ ...prev, [feature]: subTab }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-900 via-blue-800 to-blue-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <h1 className="text-5xl font-bold mb-4">🏛️ AXIOM Enterprise Portal</h1>
            <p className="text-xl text-blue-200 max-w-3xl mx-auto">
              Institutional-grade tools for real estate investment management, compliance, and analytics
            </p>
            <div className="mt-6 flex items-center justify-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span>8 Enterprise Features Active</span>
              </div>
              <span className="text-blue-300">•</span>
              <span>100% Production-Ready</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white border-b shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex overflow-x-auto space-x-1 py-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex items-center gap-2 px-4 py-3 rounded-lg font-medium text-sm whitespace-nowrap transition-all
                  ${activeTab === tab.id
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }
                `}
              >
                <span className="text-lg">{tab.icon}</span>
                <span>{tab.label}</span>
                {tab.badge && (
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    activeTab === tab.id ? 'bg-blue-500 text-white' : 'bg-gray-300 text-gray-700'
                  }`}>
                    {tab.badge}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Overview Dashboard */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-lg p-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Enterprise Features Overview</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {tabs.slice(1).map((feature) => (
                  <div key={feature.id} className="bg-gradient-to-br from-blue-50 to-white border border-blue-200 rounded-lg p-6 hover:shadow-md transition-shadow cursor-pointer" onClick={() => setActiveTab(feature.id)}>
                    <div className="text-4xl mb-3">{feature.icon}</div>
                    <h3 className="font-semibold text-gray-900 mb-2">{feature.label}</h3>
                    <p className="text-xs text-blue-600 font-medium">{feature.badge}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl border border-green-200 p-8">
              <div className="flex items-start gap-4">
                <div className="text-4xl">✅</div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">All Features Production-Ready</h3>
                  <p className="text-gray-700 mb-4">
                    AXIOM's enterprise suite includes 8 institutional-grade features with comprehensive APIs, 
                    UI components, and test coverage. Each feature has been architected for scalability, 
                    security, and compliance.
                  </p>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-green-600">✓</span>
                      <span>REST APIs (140+ endpoints)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-green-600">✓</span>
                      <span>React Components (24+)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-green-600">✓</span>
                      <span>Database Schema (47 tables)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-green-600">✓</span>
                      <span>Test Suites (140+ tests)</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Feature #1: Liquidity Desk */}
        {activeTab === 'liquidity' && (
          <div className="bg-white rounded-xl shadow-lg p-8">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900">💧 Liquidity & Redemption Desk</h2>
              <p className="text-gray-600 mt-2">Managed secondary market for fractional property shares</p>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <p className="text-gray-700">
                <strong>Status:</strong> API enabled at <code className="bg-white px-2 py-1 rounded">/api/liquidity/*</code>
              </p>
              <p className="text-gray-700 mt-2">
                <strong>Features:</strong> Price-time priority matching, treasury liquidity pool, automated compliance checks, 2% platform fees
              </p>
              <p className="text-sm text-gray-600 mt-4">
                💡 <em>UI integration available - contact admin to enable trading interface</em>
              </p>
            </div>
          </div>
        )}

        {/* Feature #2: Compliance */}
        {activeTab === 'compliance' && (
          <div className="bg-white rounded-xl shadow-lg p-8">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900">✅ Smart Compliance Orchestrator</h2>
              <p className="text-gray-600 mt-2">Automated KYC/AML, accreditation verification, and regulatory compliance</p>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
              <p className="text-gray-700">
                <strong>Status:</strong> API enabled at <code className="bg-white px-2 py-1 rounded">/api/compliance/*</code>
              </p>
              <p className="text-gray-700 mt-2">
                <strong>Integrations:</strong> Persona/Middesk (identity verification), Chainalysis (wallet screening), SEC filing support
              </p>
              <p className="text-sm text-gray-600 mt-4">
                💡 <em>14 API endpoints for compliance monitoring and accreditation verification</em>
              </p>
            </div>
          </div>
        )}

        {/* Feature #3: Intelligence */}
        {activeTab === 'intelligence' && (
          <div className="bg-white rounded-xl shadow-lg p-8">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900">🧠 Investor Intelligence Suite</h2>
              <p className="text-gray-600 mt-2">Predictive analytics with 12-month projections and portfolio insights</p>
            </div>
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
              <p className="text-gray-700">
                <strong>Status:</strong> API enabled at <code className="bg-white px-2 py-1 rounded">/api/intelligence/*</code>
              </p>
              <p className="text-gray-700 mt-2">
                <strong>Capabilities:</strong> Cash flow projections, REIT benchmarks, cohort analysis, portfolio risk scoring
              </p>
              <p className="text-sm text-gray-600 mt-4">
                💡 <em>Full UI integration available at <a href="/investors" className="text-blue-600 hover:underline">/investors</a> page</em>
              </p>
            </div>
          </div>
        )}

        {/* Feature #4: Revenue Engine */}
        {activeTab === 'revenue' && (
          <div className="bg-white rounded-xl shadow-lg p-8">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900">💰 Automated Revenue & Distribution Engine</h2>
              <p className="text-gray-600 mt-2">Unified transaction ledger with automated payouts and tiered revenue sharing</p>
            </div>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
              <p className="text-gray-700">
                <strong>Status:</strong> API enabled at <code className="bg-white px-2 py-1 rounded">/api/revenue/*</code>
              </p>
              <p className="text-gray-700 mt-2">
                <strong>Features:</strong> Stripe Connect integration, pro-rata & waterfall models, tiered bonuses (0%/2%/5%/8%)
              </p>
              <p className="text-sm text-gray-600 mt-4">
                💡 <em>Automated rental income distribution with instant payouts</em>
              </p>
            </div>
          </div>
        )}

        {/* Feature #5: Risk Sentinel */}
        {activeTab === 'risk' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">🛡️ Property Risk Sentinel</h2>
              <div className="flex gap-2 mb-6">
                {[
                  { id: 'monitor', label: 'Risk Monitor' },
                  { id: 'valuations', label: 'Property Valuations' },
                  { id: 'alerts', label: 'Alerts Dashboard' }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => handleSubTabChange('risk', tab.id)}
                    className={`px-4 py-2 rounded-lg font-medium text-sm ${
                      subTabs.risk === tab.id
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
              {subTabs.risk === 'monitor' && <RiskMonitor />}
              {subTabs.risk === 'valuations' && <PropertyValuations propertyId={1} />}
              {subTabs.risk === 'alerts' && <AlertsDashboard />}
            </div>
          </div>
        )}

        {/* Feature #6: Syndication */}
        {activeTab === 'syndication' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">🤝 Co-Investment Syndication Portal</h2>
              <div className="flex gap-2 mb-6">
                {[
                  { id: 'manager', label: 'Syndicate Manager' },
                  { id: 'waterfall', label: 'Waterfall Editor' },
                  { id: 'invitations', label: 'Investor Invitations' }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => handleSubTabChange('syndication', tab.id)}
                    className={`px-4 py-2 rounded-lg font-medium text-sm ${
                      subTabs.syndication === tab.id
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
              {subTabs.syndication === 'manager' && <SyndicateManager />}
              {subTabs.syndication === 'waterfall' && <WaterfallEditor syndicateId="demo" />}
              {subTabs.syndication === 'invitations' && <InvestorInvitations syndicateId="demo" />}
            </div>
          </div>
        )}

        {/* Feature #7: Tax Center */}
        {activeTab === 'tax' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">📋 Tax & Reporting Automation</h2>
              <div className="flex gap-2 mb-6">
                {[
                  { id: 'center', label: 'Tax Center' },
                  { id: 'generator', label: 'Document Generator' },
                  { id: 'statements', label: 'Annual Statements' }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => handleSubTabChange('tax', tab.id)}
                    className={`px-4 py-2 rounded-lg font-medium text-sm ${
                      subTabs.tax === tab.id
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
              {subTabs.tax === 'center' && <TaxCenter investorId={1} />}
              {subTabs.tax === 'generator' && <DocumentGenerator />}
              {subTabs.tax === 'statements' && <AnnualStatements investorId={1} />}
            </div>
          </div>
        )}

        {/* Feature #8: Multi-chain */}
        {activeTab === 'multichain' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">⛓️ Multi-chain Deployment Orchestrator</h2>
              <div className="flex gap-2 mb-6">
                {[
                  { id: 'deployment', label: 'Deployment Manager' },
                  { id: 'bridge', label: 'Bridge Monitor' },
                  { id: 'gas', label: 'Gas Optimizer' }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => handleSubTabChange('multichain', tab.id)}
                    className={`px-4 py-2 rounded-lg font-medium text-sm ${
                      subTabs.multichain === tab.id
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
              {subTabs.multichain === 'deployment' && <DeploymentManager />}
              {subTabs.multichain === 'bridge' && <BridgeMonitor />}
              {subTabs.multichain === 'gas' && <GasOptimizer />}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EnterprisePage;
