import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '../contexts/WalletContext';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Input } from '../components/ui/input';
import CardPaymentForm from '../components/CardPaymentForm';
import { KYCStatusTracker, KYCVerificationPage } from '../components/kyc';
import { KYCVerification, KYCDocument } from '../types/kyc';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { BlockchainService } from '../services/blockchainService';

// Import Wealth Components
import { PortfolioOverview } from '../components/wealth/PortfolioOverview';
import { InvestmentOpportunities } from '../components/wealth/InvestmentOpportunities';
import { ProfessionalAnalytics } from '../components/wealth/ProfessionalAnalytics';
import { GoalSettingModule } from '../components/wealth/GoalSettingModule';
import { AssetManagementHub } from '../components/wealth/AssetManagementHub';
import MarketIntelligence from '../components/wealth/MarketIntelligence';
import { RiskManagementTools } from '../components/wealth/RiskManagementTools';

// Dashboard navigation configuration
const navigationSections = [
  {
    id: 'overview',
    name: 'Portfolio Overview',
    icon: '📊',
    shortName: 'Portfolio',
    description: 'Your complete portfolio performance and analytics',
    component: 'overview'
  },
  {
    id: 'investments',
    name: 'Investment Opportunities',
    icon: '💎',
    shortName: 'Investments',
    description: 'Discover new DeFi and crypto investment strategies',
    component: 'investments'
  },
  {
    id: 'analytics',
    name: 'Professional Analytics',
    icon: '📈',
    shortName: 'Analytics',
    description: 'Advanced portfolio analysis and risk metrics',
    component: 'analytics'
  },
  {
    id: 'goals',
    name: 'Goal Planning',
    icon: '🎯',
    shortName: 'Goals',
    description: 'Set and track your wealth building goals',
    component: 'goals'
  },
  {
    id: 'assets',
    name: 'Asset Management',
    icon: '🏦',
    shortName: 'Assets',
    description: 'Manage and rebalance your portfolio',
    component: 'assets'
  },
  {
    id: 'market',
    name: 'Market Intelligence',
    icon: '🌐',
    shortName: 'Market',
    description: 'Market trends and DeFi protocol analysis',
    component: 'market'
  },
  {
    id: 'risk',
    name: 'Risk Management',
    icon: '🛡️',
    shortName: 'Risk',
    description: 'Risk assessment and portfolio protection',
    component: 'risk'
  },
  {
    id: 'kyc',
    name: 'Verification',
    icon: '🔐',
    shortName: 'KYC',
    description: 'Identity verification and compliance',
    component: 'kyc'
  }
];

function DashboardPage() {
  const [activeSection, setActiveSection] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [notification, setNotification] = useState<{message: string, type: 'success' | 'info' | 'warning'} | null>(null);
  
  // Wealth data state for all components
  const [wealthData, setWealthData] = useState({
    portfolio: {
      totalValue: 0,
      monthlyGrowth: 0,
      totalInvested: 0,
      unrealizedGains: 0,
      monthlyContribution: 0,
      nextContributionDate: null,
      positions: [],
      performance: null,
      isRealData: false,
      error: null
    },
    blockchain: {
      swfBalance: '0',
      stakedAmount: '0',
      rewards: '0',
      connectionStatus: 'disconnected'
    }
  });

  const [contractData, setContractData] = useState({
    swfBalance: '0',
    stakedAmount: '0',
    rewards: '0',
    apr: 15.7,
    lockPeriod: '90 days',
    minimumStake: 1000
  });

  // Payment modal states
  const [showAddFundsModal, setShowAddFundsModal] = useState(false);
  const [showCardPayment, setShowCardPayment] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState(100);

  // Wallet context integration
  const { isConnected, account, connectWallet, userInfo, isLoggedIn, disconnectWallet } = useWallet();

  // Initialize dashboard with demo data or real data based on wallet status
  useEffect(() => {
    console.log('🚀 Wealth Dashboard: Initializing...');
    initializeDashboard();
  }, [isConnected, isLoggedIn]); // Re-initialize when wallet status changes

  // Check if user is coming from onboarding and route to verification
  useEffect(() => {
    const onboardingSource = localStorage.getItem('onboarding-redirect-source');
    const onboardingTimestamp = localStorage.getItem('onboarding-redirect-timestamp');
    
    if (onboardingSource && onboardingTimestamp) {
      const redirectTime = new Date(onboardingTimestamp);
      const now = new Date();
      const timeDifference = now.getTime() - redirectTime.getTime();
      
      // If the redirect was within the last 5 minutes, auto-route to verification
      if (timeDifference < 5 * 60 * 1000) {
        console.log(`🎯 User came from onboarding (path: ${onboardingSource}) - routing to verification`);
        setActiveSection('kyc');
        showNotification(`Welcome! Complete your verification to start your ${onboardingSource} journey.`, 'info');
        
        // Clear the redirect flags after use
        localStorage.removeItem('onboarding-redirect-source');
        localStorage.removeItem('onboarding-redirect-timestamp');
      }
    }
  }, []); // Run once on component mount

  const initializeDashboard = async () => {
    if (isConnected && isLoggedIn && account) {
      console.log('🔗 Wallet connected and authenticated, loading real data...');
      try {
        await loadRealData();
      } catch (error) {
        console.warn('⚠️ Failed to load real data, falling back to demo:', error);
        initializeDemoData();
        showNotification('Using demo data due to data loading error', 'warning');
      }
    } else {
      console.log('📱 Wallet not connected, using demo data');
      initializeDemoData();
    }
  };

  // Load real portfolio and blockchain data using BlockchainService
  const loadRealData = async () => {
    setLoading(true);
    try {
      console.log('🔗 Loading real blockchain data for:', account);
      
      // Initialize blockchain service
      const blockchainService = new BlockchainService();
      
      // Get real wallet balances and portfolio metrics
      const [walletBalances, portfolioMetrics] = await Promise.all([
        blockchainService.getWalletBalances(account),
        blockchainService.getPortfolioMetrics(account)
      ]);

      console.log('💰 Wallet balances:', walletBalances);
      console.log('📊 Portfolio metrics:', portfolioMetrics);

      // Calculate total portfolio value from real balances
      const totalValue = Object.values(walletBalances).reduce((sum, token: any) => {
        return sum + (token.usdValue || 0);
      }, 0);

      // Convert wallet balances to positions format
      const positions = Object.values(walletBalances).map((token: any) => ({
        symbol: token.symbol,
        name: token.name,
        balance: parseFloat(token.balance),
        value: token.usdValue || 0,
        valueUSD: token.usdValue || 0,
        allocation: totalValue > 0 ? ((token.usdValue || 0) / totalValue * 100) : 0,
        contractAddress: token.contractAddress
      }));

      // Set real portfolio data
      setWealthData({
        portfolio: {
          totalValue: totalValue,
          monthlyGrowth: portfolioMetrics.performance?.['30d'] || 0,
          totalInvested: totalValue, // For now, assume current value is invested amount
          unrealizedGains: 0, // Would need historical data to calculate
          monthlyContribution: 0,
          nextContributionDate: null,
          positions: positions,
          performance: portfolioMetrics.performance,
          isRealData: true,
          error: null
        },
        blockchain: {
          swfBalance: walletBalances.SWF?.balance || '0',
          stakedAmount: '0', // Would need staking contract data
          rewards: '0', // Would need staking contract data
          connectionStatus: 'connected'
        }
      });

      setContractData({
        swfBalance: walletBalances.SWF?.balance || '0',
        stakedAmount: '0',
        rewards: '0',
        apr: 15.7,
        lockPeriod: '90 days',
        minimumStake: 1000
      });

      console.log('✅ Real blockchain data loaded successfully');
      showNotification('Live data connected successfully!', 'success');
      
    } catch (error) {
      console.error('❌ Failed to load real blockchain data:', error);
      throw error; // Re-throw for fallback handling
    } finally {
      setLoading(false);
    }
  };

  // Initialize demo data for dashboard
  const initializeDemoData = () => {
    const demoPortfolioData = {
      totalValue: 12847.50,
      monthlyGrowth: 8.7,
      totalInvested: 11500.00,
      unrealizedGains: 1347.50,
      monthlyContribution: 500,
      nextContributionDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      positions: [
        { symbol: 'BTC', name: 'Bitcoin', balance: 0.25, value: 11000.00, valueUSD: 11000.00, allocation: 85.6 },
        { symbol: 'ETH', name: 'Ethereum', balance: 0.8, value: 1600.00, valueUSD: 1600.00, allocation: 12.5 },
        { symbol: 'USDC', name: 'USD Coin', balance: 247.50, value: 247.50, valueUSD: 247.50, allocation: 1.9 }
      ],
      performance: {
        daily: 1.2,
        weekly: 3.4,
        monthly: 8.7,
        quarterly: 15.2,
        yearly: 45.6,
        allTime: 117.3
      },
      isRealData: false,
      dataQuality: 'demo',
      error: null,
      hasPositionData: true,
      hasPerformanceData: true
    };

    const demoBlockchainData = {
      swfBalance: '1000.0',
      stakedAmount: '500.0',
      rewards: '25.7',
      connectionStatus: 'demo',
      isRealData: false,
      error: null
    };

    setWealthData({
      portfolio: demoPortfolioData,
      blockchain: demoBlockchainData
    });

    setContractData({
      swfBalance: '1000.0',
      stakedAmount: '500.0',
      rewards: '25.7',
      apr: 15.7,
      lockPeriod: '90 days',
      minimumStake: 1000
    });
  };



  // Demo data constants (used only in guest view)
  const DEMO_PORTFOLIO_VALUES = {
    totalValue: 12847.50,
    monthlyGrowth: 8.7,
    activeStrategies: 5,
    averageAPY: 45.6
  };

  // Data refresh function for all components
  const handleDataRefresh = async () => {
    setRefreshing(true);
    try {
      if (isConnected && isLoggedIn && account) {
        await loadRealData();
        showNotification('Real data refreshed!');
      } else {
        initializeDemoData();
        showNotification('Demo data refreshed!');
      }
    } catch (error) {
      console.error('❌ Data refresh failed:', error);
      initializeDemoData();
      showNotification('Refresh failed, using demo data', 'warning');
    } finally {
      setRefreshing(false);
    }
  };

  // Notification system
  const showNotification = (message: string, type: 'success' | 'info' | 'warning' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  // Payment handlers - close sidebar when opening modal to prevent overlap
  const handleAddFunds = () => {
    setSidebarOpen(false); // Close sidebar to prevent stacking issues
    setShowAddFundsModal(true);
  };
  
  const handlePaymentSuccess = () => {
    setShowCardPayment(false);
    setShowAddFundsModal(false);
    showNotification(`Successfully added $${paymentAmount} to your portfolio! (Demo mode)`);
    handleDataRefresh();
  };

  const handlePaymentError = (error: string) => {
    showNotification(error, 'warning');
  };

  const handlePaymentCancel = () => {
    setShowCardPayment(false);
  };



  // Main authenticated dashboard
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-80 sm:w-72 bg-white shadow-xl transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="flex flex-col h-full">
          {/* Sidebar Header */}
          <div className="px-4 sm:px-6 py-4 sm:py-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 sm:space-x-3">
                <div className="text-xl sm:text-2xl">🏛️</div>
                <div>
                  <h1 className="text-base sm:text-lg font-bold text-gray-900">Wealth Dashboard</h1>
                  <p className="text-xs text-gray-600">Professional Suite</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="lg:hidden min-h-[44px] min-w-[44px] h-11 w-11 flex items-center justify-center"
                onClick={() => setSidebarOpen(false)}
              >
                <span className="text-lg">✕</span>
              </Button>
            </div>
          </div>

          {/* User Info */}
          <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-100">
            <div className="flex items-center space-x-2 sm:space-x-3">
              <div className="w-10 h-10 sm:w-10 sm:h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-sm sm:text-base">
                {isConnected ? (account?.slice(0, 2).toUpperCase() || 'W') : 'D'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">
                  {isConnected && userInfo ? 
                    (userInfo.firstName ? `${userInfo.firstName} ${userInfo.lastName || ''}`.trim() : 'Wallet User') 
                    : 'Demo User'
                  }
                </p>
                <p className="text-xs text-gray-600 truncate">
                  {isConnected ? 
                    `${account?.slice(0, 4)}...${account?.slice(-3)}` :
                    `Portfolio: $${wealthData.portfolio.totalValue?.toLocaleString() || '0'}`
                  }
                </p>
              </div>
            </div>
            
            {/* Connect/Disconnect Button */}
            <div className="mt-3 pt-3 border-t border-gray-100">
              {isConnected ? (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full min-h-[44px] h-11 text-sm text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 hover:border-red-300"
                  onClick={() => {
                    disconnectWallet();
                    showNotification('Wallet disconnected', 'info');
                  }}
                >
                  🔓 Disconnect Wallet
                </Button>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full min-h-[44px] h-11 text-sm text-blue-600 border-blue-200 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300"
                  onClick={async () => {
                    try {
                      await connectWallet();
                      showNotification('Wallet connected successfully!', 'success');
                    } catch (error) {
                      showNotification('Failed to connect wallet', 'warning');
                    }
                  }}
                >
                  🔗 Connect Wallet
                </Button>
              )}
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 sm:px-4 py-3 sm:py-4 space-y-1 overflow-y-auto">
            {navigationSections.map((section) => (
              <button
                key={section.id}
                onClick={() => {
                  setActiveSection(section.id);
                  setSidebarOpen(false);
                }}
                className={`w-full flex items-center px-3 py-4 text-sm font-medium rounded-lg transition-all duration-200 min-h-[48px] ${
                  activeSection === section.id
                    ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-500'
                    : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900 active:bg-gray-100'
                }`}
              >
                <span className="text-lg mr-3 flex-shrink-0">{section.icon}</span>
                <div className="flex-1 text-left min-w-0">
                  <div className="font-medium truncate">{section.name}</div>
                  <div className="text-xs text-gray-500 mt-0.5 truncate sm:block hidden">{section.description}</div>
                </div>
              </button>
            ))}
          </nav>

          {/* Quick Actions */}
          <div className="p-3 sm:p-4 border-t border-gray-200">
            <div className="space-y-2">
              <Button 
                onClick={handleAddFunds}
                className="w-full min-h-[44px] h-11 text-sm bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                size="sm"
              >
                💰 Add Funds
              </Button>
              <Button 
                onClick={handleDataRefresh}
                variant="outline"
                className="w-full min-h-[44px] h-11 text-sm"
                size="sm"
                disabled={refreshing}
              >
                {refreshing ? (
                  <>
                    <div className="animate-spin w-3 h-3 border border-gray-400 border-t-transparent rounded-full mr-2" />
                    <span className="sm:inline hidden">Refreshing...</span>
                    <span className="sm:hidden">...</span>
                  </>
                ) : (
                  <>🔄 <span className="sm:inline hidden">Refresh Data</span><span className="sm:hidden">Refresh</span></>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="lg:ml-72">
        {/* Top Header */}
        <header className="bg-white shadow-sm border-b border-gray-200 px-3 sm:px-4 lg:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 sm:space-x-4 min-w-0 flex-1">
              <Button
                variant="ghost"
                size="sm"
                className="lg:hidden min-h-[44px] min-w-[44px] h-11 w-11 flex items-center justify-center flex-shrink-0"
                onClick={() => setSidebarOpen(true)}
              >
                <div className="w-5 h-5 flex flex-col justify-between">
                  <div className="w-full h-0.5 bg-gray-600"></div>
                  <div className="w-full h-0.5 bg-gray-600"></div>
                  <div className="w-full h-0.5 bg-gray-600"></div>
                </div>
              </Button>
              <div className="min-w-0 flex-1">
                <h2 className="text-lg sm:text-xl font-bold text-gray-900 truncate">
                  {navigationSections.find(s => s.id === activeSection)?.name || 'Dashboard'}
                </h2>
                <p className="text-xs sm:text-sm text-gray-600 mt-1 truncate hidden sm:block">
                  {navigationSections.find(s => s.id === activeSection)?.description}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2 sm:space-x-4 flex-shrink-0">
              {/* Wallet Status Indicator */}
              {isConnected && wealthData.portfolio.isRealData ? (
                <div className="hidden md:flex items-center px-2 sm:px-3 py-1 bg-green-50 border border-green-200 rounded-full">
                  <span className="text-green-600 text-xs font-medium">🟢 Live Data</span>
                </div>
              ) : (
                <div className="hidden md:flex items-center px-2 sm:px-3 py-1 bg-amber-50 border border-amber-200 rounded-full">
                  <span className="text-amber-600 text-xs font-medium">
                    {isConnected ? '🔶 Loading Data' : '🔶 Demo Mode'}
                  </span>
                </div>
              )}
              
              {/* Wallet Connection Status */}
              {!isConnected && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="hidden md:flex text-blue-600 hover:text-blue-700 hover:bg-blue-50 min-h-[44px] h-11 px-3 text-xs sm:text-sm"
                  onClick={async () => {
                    try {
                      await connectWallet();
                      showNotification('Wallet connected successfully!', 'success');
                    } catch (error) {
                      showNotification('Failed to connect wallet', 'warning');
                    }
                  }}
                >
                  🔗 Connect
                </Button>
              )}
              
              <Button
                variant="outline"
                onClick={() => navigate('/')}
                size="sm"
                className="min-h-[44px] h-11 px-2 sm:px-3 text-xs sm:text-sm"
              >
                <span className="sm:hidden">←</span>
                <span className="hidden sm:inline">← Home</span>
              </Button>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <main className="p-3 sm:p-4 lg:p-6 min-h-screen">
          {activeSection === 'overview' && (
            <ErrorBoundary level="section" key="portfolio-overview">
              <PortfolioOverview 
                wealthData={wealthData}
                contractData={contractData}
                onRefresh={handleDataRefresh}
              />
            </ErrorBoundary>
          )}
          
          {activeSection === 'investments' && (
            <InvestmentOpportunities 
              wealthData={wealthData}
              contractData={contractData}
              onRefresh={handleDataRefresh}
            />
          )}
          
          {activeSection === 'analytics' && (
            <ProfessionalAnalytics 
              wealthData={wealthData}
              contractData={contractData}
              onRefresh={handleDataRefresh}
            />
          )}
          
          {activeSection === 'goals' && (
            <GoalSettingModule 
              wealthData={wealthData}
              contractData={contractData}
              onRefresh={handleDataRefresh}
            />
          )}
          
          {activeSection === 'assets' && (
            <AssetManagementHub 
              wealthData={wealthData}
              contractData={contractData}
              onRefresh={handleDataRefresh}
            />
          )}
          
          {activeSection === 'market' && (
            <ErrorBoundary level="section" key="market-intelligence">
              <MarketIntelligence 
                wealthData={wealthData}
                onRefresh={handleDataRefresh}
              />
            </ErrorBoundary>
          )}
          
          {activeSection === 'risk' && (
            <ErrorBoundary level="section" key="risk-management">
              <RiskManagementTools 
                wealthData={wealthData}
                contractData={contractData}
                onRefresh={handleDataRefresh}
              />
            </ErrorBoundary>
          )}
          
          {activeSection === 'kyc' && (
            <div className="max-w-4xl mx-auto">
              <KYCStatusTracker currentStep={1} className="mb-6" />
              <KYCVerificationPage />
            </div>
          )}
        </main>
      </div>

      {/* Notification Toast */}
      {notification && (
        <div className={`fixed top-4 left-4 right-4 sm:top-6 sm:right-6 sm:left-auto z-40 max-w-sm sm:max-w-md mx-auto sm:mx-0 p-4 rounded-lg shadow-lg ${
          notification.type === 'success' ? 'bg-green-50 border border-green-200' :
          notification.type === 'warning' ? 'bg-amber-50 border border-amber-200' : 
          'bg-blue-50 border border-blue-200'
        } transition-all duration-300`}>
          <div className="flex items-start space-x-3">
            <span className="text-lg flex-shrink-0">
              {notification.type === 'success' ? '✅' : 
               notification.type === 'warning' ? '⚠️' : 'ℹ️'}
            </span>
            <p className="text-sm font-medium text-gray-900 flex-1">{notification.message}</p>
          </div>
        </div>
      )}

      {/* Add Funds Modal */}
      {showAddFundsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-3 sm:p-4">
          <div className="bg-white rounded-xl p-4 sm:p-6 max-w-md w-full max-h-[95vh] sm:max-h-[90vh] overflow-y-auto shadow-2xl mx-auto">
            <div className="flex justify-between items-center mb-4 sm:mb-6">
              <h3 className="text-lg sm:text-xl font-bold text-gray-900">Add Funds to Portfolio</h3>
              <Button
                variant="ghost"
                size="sm"
                className="min-h-[44px] min-w-[44px] h-11 w-11 flex items-center justify-center"
                onClick={() => setShowAddFundsModal(false)}
              >
                <span className="text-lg">✕</span>
              </Button>
            </div>
            
            <div className="space-y-3 sm:space-y-4">
              {/* Bank Transfer */}
              <div className="border border-gray-200 rounded-lg p-3 sm:p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
                    <span className="text-xl sm:text-2xl flex-shrink-0">🏦</span>
                    <div className="min-w-0 flex-1">
                      <h4 className="font-semibold text-gray-900 text-sm sm:text-base">Bank Transfer</h4>
                      <p className="text-xs sm:text-sm text-gray-600 truncate">ACH transfer (3-5 business days)</p>
                    </div>
                  </div>
                  <span className="text-xs sm:text-sm text-green-600 font-medium flex-shrink-0">No fees</span>
                </div>
                <div className="bg-gray-50 p-2 sm:p-3 rounded text-xs sm:text-sm text-gray-700 mb-3 border">
                  <strong>Account Details:</strong><br/>
                  Routing: 121000248<br/>
                  Account: 4127-****-**85
                </div>
                <Button 
                  className="w-full min-h-[44px] h-11 text-sm" 
                  size="sm"
                  onClick={() => {
                    navigator.clipboard.writeText("Routing: 121000248\nAccount: 4127-****-**85");
                    showNotification("Account details copied to clipboard!");
                  }}
                >
                  Copy Account Details
                </Button>
              </div>

              {/* Crypto Deposit */}
              <div className="border border-gray-200 rounded-lg p-3 sm:p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
                    <span className="text-xl sm:text-2xl flex-shrink-0">₿</span>
                    <div className="min-w-0 flex-1">
                      <h4 className="font-semibold text-gray-900 text-sm sm:text-base">Crypto Deposit</h4>
                      <p className="text-xs sm:text-sm text-gray-600 truncate">USDT, USDC, BNB on BSC</p>
                    </div>
                  </div>
                  <span className="text-xs sm:text-sm text-blue-600 font-medium flex-shrink-0">~$5 network fee</span>
                </div>
                <div className="bg-gray-50 p-2 sm:p-3 rounded text-xs sm:text-sm text-gray-700 mb-3 border">
                  <strong>Demo BSC Address:</strong><br/>
                  0xDemo...1ed6
                </div>
                <Button 
                  className="w-full min-h-[44px] h-11 text-sm" 
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const address = '0xDemo123456789abcdef0123456789abcdef1ed6';
                    navigator.clipboard.writeText(address);
                    showNotification("Demo wallet address copied to clipboard!");
                  }}
                >
                  Copy Demo Wallet Address
                </Button>
              </div>

              {/* Credit Card */}
              <div className="border border-gray-200 rounded-lg p-3 sm:p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
                    <span className="text-xl sm:text-2xl flex-shrink-0">💳</span>
                    <div className="min-w-0 flex-1">
                      <h4 className="font-semibold text-gray-900 text-sm sm:text-base">Credit/Debit Card</h4>
                      <p className="text-xs sm:text-sm text-gray-600 truncate">Instant funding available</p>
                    </div>
                  </div>
                  <span className="text-xs sm:text-sm text-blue-600 font-medium flex-shrink-0">2.9% + $0.30</span>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-600 mb-2">
                      Amount to Add ($)
                    </label>
                    <Input
                      type="number"
                      min="10"
                      max="10000"
                      value={paymentAmount}
                      onChange={(e) => setPaymentAmount(parseInt(e.target.value) || 100)}
                      className="w-full h-11 text-base"
                      placeholder="Enter amount"
                    />
                  </div>
                  <Button 
                    className="w-full min-h-[44px] h-11 text-sm bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700" 
                    size="sm"
                    onClick={() => {
                      if (paymentAmount < 10 || paymentAmount > 10000) {
                        showNotification("Amount must be between $10 and $10,000", "warning");
                        return;
                      }
                      setShowCardPayment(true);
                    }}
                  >
                    Pay with Card - ${paymentAmount}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Card Payment Modal */}
      {showCardPayment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[70] p-3 sm:p-4">
          <div className="bg-white rounded-xl p-4 sm:p-6 max-w-md w-full max-h-[95vh] sm:max-h-[90vh] overflow-y-auto shadow-2xl mx-auto">
            <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-4">Complete Payment</h3>
            <CardPaymentForm
              amount={paymentAmount}
              onSuccess={handlePaymentSuccess}
              onError={handlePaymentError}
              onCancel={handlePaymentCancel}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default DashboardPage;