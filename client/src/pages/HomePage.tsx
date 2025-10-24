import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import WealthOnboardingWizard from "../components/WealthOnboardingWizard";
import KeyGrowPathway from "../components/KeyGrowPathway";
import { useStats } from "../contexts/StatsContext";
import { useWallet } from "../contexts/WalletContext";
import { useNotificationHelpers } from "../components/NotificationSystem";

// Community Stats Component
function CommunityStats() {
  const { stats, loading, error, refreshStats } = useStats();
  
  const handleRefresh = async () => {
    await refreshStats();
  };

  return (
    <div className="bg-gradient-to-br from-white to-blue-50 border-2 border-blue-700 rounded-xl p-8 text-center shadow-lg relative">
      <button 
        onClick={handleRefresh}
        className="absolute top-2 right-2 text-blue-600 hover:text-blue-800 transition-colors"
        title="Refresh stats"
        disabled={loading}
      >
        <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
      </button>
      
      <div className="text-4xl font-bold text-blue-800 mb-3">
        {loading ? (
          <div className="animate-pulse bg-blue-200 h-10 w-24 mx-auto rounded"></div>
        ) : (
          stats.totalUsers.toLocaleString()
        )}
      </div>
      <div className="text-lg text-blue-800 font-semibold">
        AXIOM Members Building Sovereign Wealth
      </div>
      <div className="text-sm text-gray-600 mt-2">
        {loading ? (
          <div className="animate-pulse bg-gray-200 h-4 w-32 mx-auto rounded"></div>
        ) : (
          `${stats.activeWallets.toLocaleString()} active wallets circulating energy`
        )}
      </div>
      
      {error && !loading && (
        <div className="text-xs text-red-500 mt-2">
          {error}
        </div>
      )}
    </div>
  );
}

export default function HomePage() {
  const navigate = useNavigate();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showKeyGrow, setShowKeyGrow] = useState(false);
  const [selectedPath, setSelectedPath] = useState<string | undefined>();

  const { connectWallet, isLoggedIn, account, userInfo, loginError, isConnecting } = useWallet();
  const { showError } = useNotificationHelpers();

  const handleWalletConnect = async () => {
    console.log('🔗 Connect Advanced Wallet button clicked...');
    console.log('🔍 DEBUGGING - Current state:', { isLoggedIn, account, isConnected: account ? true : false });
    
    try {
      console.log('🔍 DEBUGGING - About to call connectWallet()...');
      await connectWallet();
      console.log('✅ Wallet connection process initiated');
    } catch (error: any) {
      console.error('❌ Wallet connection failed:', error);
      console.error('❌ Error details:', error.message, error.code, error.data);
      showError('Wallet Connection Failed', error.message || 'Unable to connect to your wallet. Please try again.');
    }
  };

  useEffect(() => {
    if (isLoggedIn && account) {
      console.log('🎯 NAVIGATION: Wallet authenticated successfully, auto-routing to dashboard...');
      setTimeout(() => {
        navigate('/dashboard');
      }, 1000);
    }
  }, [isLoggedIn, account, navigate]);

  const handlePathClick = (pathType: string) => {
    let pathId: string;
    switch (pathType) {
      case 'beginner':
      case 'start-journey':
        pathId = 'beginner';
        setSelectedPath(pathId);
        setShowOnboarding(true);
        break;
      case 'investment':
        pathId = 'investment';
        setSelectedPath(pathId);
        setShowOnboarding(true);
        break;
      case 'property':
      case 'keygrow':
        setShowKeyGrow(true);
        break;
      case 'community':
        pathId = 'community';
        setSelectedPath(pathId);
        setShowOnboarding(true);
        break;
      case 'connect-wallet':
        handleWalletConnect();
        break;
      default:
        pathId = 'beginner';
        setSelectedPath(pathId);
        setShowOnboarding(true);
    }
  };

  const handleCloseOnboarding = () => {
    setShowOnboarding(false);
    setSelectedPath(undefined);
  };

  const handleCloseKeyGrow = () => {
    setShowKeyGrow(false);
  };

  return (
    <main className="bg-gradient-to-br from-white via-blue-50 to-white min-h-screen">
      {/* Hero Section */}
      <section className="text-center py-24 px-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-100/20 via-transparent to-blue-200/20"></div>
        <div className="relative z-10">
          <div className="mb-8 flex justify-center">
            <div className="h-32 w-32 md:h-40 md:w-40 flex items-center justify-center">
              <h1 className="text-6xl md:text-7xl font-bold text-blue-600 animate-bounce">Ⓐ</h1>
            </div>
          </div>
          <h1 className="text-5xl md:text-7xl font-bold mb-8 text-transparent bg-gradient-to-r from-blue-700 via-blue-900 to-blue-700 bg-clip-text">
            From Renting to Homeownership in 24 Months
          </h1>
          <div className="w-32 h-1 bg-gradient-to-r from-blue-600 to-blue-800 mx-auto mb-8 rounded-full"></div>
          <p className="text-2xl max-w-5xl mx-auto mb-12 text-gray-700 leading-relaxed">
            The <span className="text-blue-800 font-semibold">KeyGrow 2-Year Rent-to-Own Program</span> helps renters become homeowners through monthly revenue allocations, 
            personalized coaching, and property matching services. <span className="text-blue-800 font-semibold">20% of all platform revenue goes directly to helping you own your first home.</span>
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-6">
            <Button 
              className="text-base px-8 py-3 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
              onClick={() => handlePathClick('keygrow')}
            >
              🏠 Start Your Homeownership Journey
            </Button>
            <Button 
              variant="outline" 
              className="text-base px-8 py-3 border-2 border-blue-700 text-blue-800 hover:bg-blue-50 font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
              onClick={() => navigate('/learn-how-it-works')}
            >
              Learn How It Works
            </Button>
          </div>
        </div>
      </section>

      {/* KeyGrow Feature Section - PRIMARY FOCUS */}
      <section className="py-20 px-8 bg-gradient-to-br from-green-50 to-blue-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-bold text-blue-800 mb-6">
              🏠 KeyGrow 2-Year Rent-to-Own Program
            </h2>
            <div className="w-32 h-1 bg-gradient-to-r from-green-600 to-blue-600 mx-auto mb-8 rounded-full"></div>
            <p className="text-2xl text-gray-700 max-w-4xl mx-auto leading-relaxed">
              Stop throwing money away on rent. Join the only program that uses <span className="font-bold text-green-700">blockchain technology</span> to 
              transparently allocate platform revenue toward your down payment and homeownership goals.
            </p>
          </div>

          {/* How KeyGrow Works */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
            <Card className="bg-gradient-to-br from-white to-green-50 border-2 border-green-300 shadow-lg hover:shadow-xl transition-all">
              <CardContent className="p-8 text-center">
                <div className="text-5xl mb-4">1️⃣</div>
                <h3 className="text-xl font-bold text-blue-800 mb-3">Register for $500</h3>
                <p className="text-gray-700">One-time registration fee enrolls you in our comprehensive 24-month program with personalized support</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-white to-green-50 border-2 border-green-300 shadow-lg hover:shadow-xl transition-all">
              <CardContent className="p-8 text-center">
                <div className="text-5xl mb-4">2️⃣</div>
                <h3 className="text-xl font-bold text-blue-800 mb-3">Build Your Profile</h3>
                <p className="text-gray-700">Complete our detailed assessment to create your personalized homeownership pathway and timeline</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-white to-green-50 border-2 border-green-300 shadow-lg hover:shadow-xl transition-all">
              <CardContent className="p-8 text-center">
                <div className="text-5xl mb-4">3️⃣</div>
                <h3 className="text-xl font-bold text-blue-800 mb-3">Receive Allocations</h3>
                <p className="text-gray-700">Get monthly revenue shares based on your tier (Bronze 1x, Silver 1.25x, Gold 1.5x, Platinum 2x multipliers)</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-white to-green-50 border-2 border-green-300 shadow-lg hover:shadow-xl transition-all">
              <CardContent className="p-8 text-center">
                <div className="text-5xl mb-4">4️⃣</div>
                <h3 className="text-xl font-bold text-blue-800 mb-3">Own Your Home</h3>
                <p className="text-gray-700">Use accumulated allocations for down payment, with property matching and rent-to-own opportunities</p>
              </CardContent>
            </Card>
          </div>

          {/* Program Benefits */}
          <div className="bg-white rounded-2xl p-10 shadow-2xl border-2 border-blue-300">
            <h3 className="text-3xl font-bold text-center text-blue-800 mb-10">What's Included in Your $500 Registration</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="flex items-start space-x-4">
                <div className="text-3xl">✅</div>
                <div>
                  <h4 className="text-xl font-bold text-gray-900 mb-2">24-Month Program Access</h4>
                  <p className="text-gray-700">Full enrollment in the KeyGrow homeownership program with ongoing support</p>
                </div>
              </div>
              <div className="flex items-start space-x-4">
                <div className="text-3xl">✅</div>
                <div>
                  <h4 className="text-xl font-bold text-gray-900 mb-2">Monthly Revenue Allocations</h4>
                  <p className="text-gray-700">Receive your share of 20% of platform revenue distributed to all active renters</p>
                </div>
              </div>
              <div className="flex items-start space-x-4">
                <div className="text-3xl">✅</div>
                <div>
                  <h4 className="text-xl font-bold text-gray-900 mb-2">Personalized Coaching</h4>
                  <p className="text-gray-700">One-on-one guidance to improve credit, manage debt, and maximize savings</p>
                </div>
              </div>
              <div className="flex items-start space-x-4">
                <div className="text-3xl">✅</div>
                <div>
                  <h4 className="text-xl font-bold text-gray-900 mb-2">Property Matching Service</h4>
                  <p className="text-gray-700">Access to rent-to-own properties that match your budget and preferences</p>
                </div>
              </div>
              <div className="flex items-start space-x-4">
                <div className="text-3xl">✅</div>
                <div>
                  <h4 className="text-xl font-bold text-gray-900 mb-2">Progress Tracking Dashboard</h4>
                  <p className="text-gray-700">Real-time monitoring of savings, allocations, and timeline to homeownership</p>
                </div>
              </div>
              <div className="flex items-start space-x-4">
                <div className="text-3xl">✅</div>
                <div>
                  <h4 className="text-xl font-bold text-gray-900 mb-2">Tier Advancement Opportunities</h4>
                  <p className="text-gray-700">Qualify for higher tiers (Silver, Gold, Platinum) with increased allocation multipliers</p>
                </div>
              </div>
            </div>

            <div className="mt-10 text-center">
              <Button 
                className="text-base px-6 py-2.5 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
                onClick={() => handlePathClick('keygrow')}
              >
                Register Now - $500 One-Time Fee
              </Button>
              <p className="text-sm text-gray-600 mt-4">Secure payment via Stripe • 24-month program enrollment</p>
            </div>
          </div>
        </div>
      </section>

      {/* Revenue Allocation Transparency */}
      <section className="py-20 px-8 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-blue-800 mb-6">
              💰 Where Platform Revenue Goes
            </h2>
            <div className="w-32 h-1 bg-gradient-to-r from-blue-600 to-green-600 mx-auto mb-8 rounded-full"></div>
            <p className="text-xl text-gray-700 max-w-4xl mx-auto">
              Complete transparency. Every revenue source on the AXIOM platform is automatically split using blockchain smart contracts.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-8 border-2 border-blue-300 shadow-lg">
              <h3 className="text-2xl font-bold text-blue-800 mb-6">📊 Revenue Split</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold text-gray-800">Platform Treasury</span>
                  <span className="text-2xl font-bold text-blue-600">80%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-4">
                  <div className="bg-blue-600 h-4 rounded-full" style={{ width: '80%' }}></div>
                </div>
                <p className="text-sm text-gray-600">Operations, development, security, and growth</p>
              </div>
              <div className="mt-8 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold text-gray-800">KeyGrow Fund</span>
                  <span className="text-2xl font-bold text-green-600">20%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-4">
                  <div className="bg-green-600 h-4 rounded-full" style={{ width: '20%' }}></div>
                </div>
                <p className="text-sm text-gray-600">Distributed monthly to all registered renters</p>
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-8 border-2 border-green-300 shadow-lg">
              <h3 className="text-2xl font-bold text-green-800 mb-6">💵 Revenue Sources</h3>
              <ul className="space-y-4">
                <li className="flex items-start">
                  <span className="text-green-600 font-bold mr-3">•</span>
                  <div>
                    <p className="font-semibold text-gray-800">NFT Marketplace Fees</p>
                    <p className="text-sm text-gray-600">2.5% on all NFT sales and transfers</p>
                  </div>
                </li>
                <li className="flex items-start">
                  <span className="text-green-600 font-bold mr-3">•</span>
                  <div>
                    <p className="font-semibold text-gray-800">Real Estate Investment Platform</p>
                    <p className="text-sm text-gray-600">2.5% platform fee on property investments</p>
                  </div>
                </li>
                <li className="flex items-start">
                  <span className="text-green-600 font-bold mr-3">•</span>
                  <div>
                    <p className="font-semibold text-gray-800">Transaction Fees</p>
                    <p className="text-sm text-gray-600">Small fees on staking, swaps, and transfers</p>
                  </div>
                </li>
                <li className="flex items-start">
                  <span className="text-green-600 font-bold mr-3">•</span>
                  <div>
                    <p className="font-semibold text-gray-800">Premium Services</p>
                    <p className="text-sm text-gray-600">Advanced analytics and enterprise features</p>
                  </div>
                </li>
              </ul>
              <div className="mt-6 p-4 bg-white rounded-lg">
                <p className="text-sm font-semibold text-green-800">📈 All distributions tracked on-chain for complete transparency</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Additional Platform Features */}
      <section className="py-20 px-8 bg-gradient-to-br from-blue-50 to-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-blue-800 mb-6">
              🚀 More Ways to Build Wealth on AXIOM
            </h2>
            <div className="w-32 h-1 bg-gradient-to-r from-blue-600 to-blue-800 mx-auto mb-8 rounded-full"></div>
            <p className="text-xl text-gray-700 max-w-4xl mx-auto">
              Beyond homeownership, AXIOM offers multiple paths to financial sovereignty through DeFi innovation
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="bg-gradient-to-br from-white to-purple-50 border-2 border-purple-300 shadow-lg hover:shadow-xl transition-all hover:scale-105 cursor-pointer"
                  onClick={() => navigate('/real-estate-investor')}>
              <CardContent className="p-8 text-center">
                <div className="text-6xl mb-4">🏘️</div>
                <h3 className="text-2xl font-bold text-purple-800 mb-4">Real Estate Investor</h3>
                <p className="text-gray-700 mb-4">Fractional property investment starting at just 0.05 BNB (~$30). Earn rental income, appreciation, and exit profits across 5 mechanisms</p>
                <div className="text-sm text-purple-700 font-semibold">Min: 0.05 BNB • Platform Fee: 2.5%</div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-white to-blue-50 border-2 border-blue-300 shadow-lg hover:shadow-xl transition-all hover:scale-105 cursor-pointer"
                  onClick={() => navigate('/advanced-staking')}>
              <CardContent className="p-8 text-center">
                <div className="text-6xl mb-4">⚡</div>
                <h3 className="text-2xl font-bold text-blue-800 mb-4">Proof of Contribution Staking</h3>
                <p className="text-gray-700 mb-4">Stake AXM tokens and earn 10-30% dynamic APR based on your contribution level. NFT-enhanced staking with tiered rewards</p>
                <div className="text-sm text-blue-700 font-semibold">APR: 10-30% • Dynamic Rewards</div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-white to-green-50 border-2 border-green-300 shadow-lg hover:shadow-xl transition-all hover:scale-105 cursor-pointer"
                  onClick={() => navigate('/liquidity-vault')}>
              <CardContent className="p-8 text-center">
                <div className="text-6xl mb-4">💧</div>
                <h3 className="text-2xl font-bold text-green-800 mb-4">Liquidity Provision</h3>
                <p className="text-gray-700 mb-4">Provide liquidity on PancakeSwap and stake LP tokens in our multi-vault system. Configurable lock periods and reward rates</p>
                <div className="text-sm text-green-700 font-semibold">Multiple Vaults • Customizable Terms</div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Community Stats */}
      <section className="py-16 px-8">
        <div className="max-w-3xl mx-auto">
          <CommunityStats />
        </div>
      </section>

      {/* Final CTA Section with Wallet Connect - DO NOT MODIFY */}
      <section className="py-20 px-8 bg-gradient-to-br from-blue-600 to-blue-800">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-8 text-white">
            Your wealth journey starts today
          </h2>
          <p className="text-xl mb-12 text-blue-100 leading-relaxed">
            Connect your wallet and start building. No minimum amount required. 
            <span className="font-semibold">Your money, your timeline, your wealth.</span>
          </p>
          <Card className="bg-gradient-to-br from-white to-blue-50 border-2 border-blue-300 shadow-2xl">
            <CardContent className="p-10 space-y-6">
              <Button 
                onClick={() => {
                  if (!isLoggedIn) {
                    console.log('🔗 Connect button clicked - triggering wallet connection');
                    handleWalletConnect();
                  } else {
                    console.log('ℹ️ Already connected, going to dashboard');
                    navigate('/dashboard');
                  }
                }}
                className={`w-full cursor-pointer ${
                  isLoggedIn 
                    ? 'bg-blue-600 hover:bg-blue-700' 
                    : 'bg-green-600 hover:bg-green-700'
                } text-white`}
                style={{ pointerEvents: 'auto', position: 'relative', zIndex: 999 }}
              >
                {isLoggedIn 
                  ? `✅ Connected: ${account?.slice(0, 6)}...${account?.slice(-4)}` 
                  : '🔗 Connect Advanced Wallet'
                }
              </Button>
              <div className="text-xs text-gray-500 text-center">
                {isLoggedIn 
                  ? `Welcome ${userInfo?.firstName || 'Member'}! Full platform access enabled`
                  : 'Connect with MetaMask on BSC Network for full platform access'
                }
              </div>
              
              {loginError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="text-sm font-medium text-red-800 mb-2">🔍 Wallet Connection Debug:</div>
                  <div className="text-xs text-red-600">{loginError}</div>
                  <div className="text-xs text-gray-600 mt-2">
                    • Make sure you're using MetaMask mobile browser or have MetaMask extension installed<br/>
                    • Try refreshing the page if you just installed a wallet<br/>
                    • For mobile: Open this site in MetaMask app's browser
                  </div>
                </div>
              )}
              
              {isConnecting && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="text-sm font-medium text-blue-800 mb-2">🔄 Connecting Wallet...</div>
                  <div className="text-xs text-blue-600">Please check your wallet for any prompts to complete the connection.</div>
                </div>
              )}
              <Button 
                className="w-full text-xl py-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
                onClick={() => {
                  if (isLoggedIn) {
                    console.log('💰 Start Building Wealth clicked - wallet connected, going to dashboard');
                    navigate('/dashboard');
                  } else {
                    console.log('💰 Start Building Wealth clicked - opening onboarding wizard');
                    handlePathClick('beginner');
                  }
                }}
              >
                Start Building Wealth
              </Button>
              <p className="text-lg text-gray-700 font-medium">
                Safe, secure, and completely in your control
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      
      {/* Onboarding Wizard */}
      <WealthOnboardingWizard
        isOpen={showOnboarding}
        onClose={handleCloseOnboarding}
        onComplete={() => {
          console.log('🎯 [HOMEPAGE] Onboarding completed - navigating to dashboard');
          handleCloseOnboarding();
          setTimeout(() => {
            navigate('/dashboard');
          }, 100);
        }}
        initialPath={selectedPath}
      />
      
      {/* KeyGrow Pathway for Property Ownership */}
      <KeyGrowPathway
        isOpen={showKeyGrow}
        onClose={handleCloseKeyGrow}
      />
    </main>
  );
}
