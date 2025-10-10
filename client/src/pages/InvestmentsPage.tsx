import React from 'react';
import Layout from '../components/Layout';

const InvestmentsPage: React.FC = () => {
  return (
    <Layout title="SWF Investments" themeColor="blue">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Investment Platform
            </h1>
            <p className="text-xl text-blue-200">
              Trade across 8 investment product categories with real-time market data
            </p>
          </div>

          {/* Investment Categories */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            <div className="bg-white/10 backdrop-blur-sm border border-blue-500/30 rounded-xl p-6">
              <div className="text-3xl mb-3">₿</div>
              <h3 className="text-xl font-bold text-white mb-2">Crypto Trading</h3>
              <p className="text-blue-200 text-sm">Bitcoin, Ethereum & more</p>
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm border border-blue-500/30 rounded-xl p-6">
              <div className="text-3xl mb-3">📈</div>
              <h3 className="text-xl font-bold text-white mb-2">Stocks</h3>
              <p className="text-blue-200 text-sm">Individual equities & blue chips</p>
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm border border-blue-500/30 rounded-xl p-6">
              <div className="text-3xl mb-3">📊</div>
              <h3 className="text-xl font-bold text-white mb-2">ETFs & Index Funds</h3>
              <p className="text-blue-200 text-sm">Diversified portfolio investing</p>
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm border border-blue-500/30 rounded-xl p-6">
              <div className="text-3xl mb-3">🏛️</div>
              <h3 className="text-xl font-bold text-white mb-2">Bonds</h3>
              <p className="text-blue-200 text-sm">Fixed income securities</p>
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm border border-blue-500/30 rounded-xl p-6">
              <div className="text-3xl mb-3">🥇</div>
              <h3 className="text-xl font-bold text-white mb-2">Commodities</h3>
              <p className="text-blue-200 text-sm">Gold, silver, oil & more</p>
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm border border-blue-500/30 rounded-xl p-6">
              <div className="text-3xl mb-3">🏘️</div>
              <h3 className="text-xl font-bold text-white mb-2">REITs</h3>
              <p className="text-blue-200 text-sm">Real estate investment trusts</p>
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm border border-blue-500/30 rounded-xl p-6">
              <div className="text-3xl mb-3">🎯</div>
              <h3 className="text-xl font-bold text-white mb-2">Options</h3>
              <p className="text-blue-200 text-sm">Advanced trading strategies</p>
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm border border-blue-500/30 rounded-xl p-6">
              <div className="text-3xl mb-3">🏦</div>
              <h3 className="text-xl font-bold text-white mb-2">Retirement</h3>
              <p className="text-blue-200 text-sm">IRA & 401k accounts</p>
            </div>
          </div>

          {/* Coming Soon Banner */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-800 border border-blue-400 rounded-2xl p-8 text-center">
            <div className="text-5xl mb-4">🚀</div>
            <h2 className="text-3xl font-bold text-white mb-4">
              Full Investment Platform Coming Soon
            </h2>
            <p className="text-xl text-blue-100 mb-6">
              We're building a comprehensive investment platform with real-time trading, portfolio management, and advanced analytics.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left max-w-4xl mx-auto">
              <div className="bg-white/10 rounded-lg p-4">
                <div className="text-2xl mb-2">✅</div>
                <h3 className="font-bold text-white mb-1">Real-Time Data</h3>
                <p className="text-sm text-blue-200">Live market prices across all asset classes</p>
              </div>
              <div className="bg-white/10 rounded-lg p-4">
                <div className="text-2xl mb-2">✅</div>
                <h3 className="font-bold text-white mb-1">Smart Trading</h3>
                <p className="text-sm text-blue-200">Market & limit orders with execution tracking</p>
              </div>
              <div className="bg-white/10 rounded-lg p-4">
                <div className="text-2xl mb-2">✅</div>
                <h3 className="font-bold text-white mb-1">Portfolio Analytics</h3>
                <p className="text-sm text-blue-200">P&L tracking, cost basis, and performance metrics</p>
              </div>
            </div>
          </div>

          {/* Infrastructure Status */}
          <div className="mt-12 bg-green-900/30 border border-green-500/30 rounded-xl p-6">
            <h3 className="text-xl font-bold text-green-400 mb-4">✅ Infrastructure Ready</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="flex items-start space-x-2">
                <span className="text-green-400">✓</span>
                <span className="text-green-200">Investment Account Management API</span>
              </div>
              <div className="flex items-start space-x-2">
                <span className="text-green-400">✓</span>
                <span className="text-green-200">Market Data Provider (CoinGecko, Alpha Vantage, FMP)</span>
              </div>
              <div className="flex items-start space-x-2">
                <span className="text-green-400">✓</span>
                <span className="text-green-200">Transaction Engine (Buy/Sell Orders)</span>
              </div>
              <div className="flex items-start space-x-2">
                <span className="text-green-400">✓</span>
                <span className="text-green-200">Position Tracking with P&L Calculation</span>
              </div>
              <div className="flex items-start space-x-2">
                <span className="text-green-400">✓</span>
                <span className="text-green-200">Database Schema (15 tables)</span>
              </div>
              <div className="flex items-start space-x-2">
                <span className="text-green-400">✓</span>
                <span className="text-green-200">Order History & Execution Tracking</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default InvestmentsPage;
