import React, { useState, useEffect } from 'react';
import { useWallet } from '../contexts/WalletContext';
import { useContractTransactions } from '../hooks/useContractTransactions';
import { useKeygrowEvents, ContractEvent } from '../hooks/useContractEvents';
import { EventToast } from '../components/EventToast';
import { keygrowService, type RenterInfo } from '../services/contracts';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { ProgramComparison } from '../components/ProgramComparison';
import KeyGrowRegistrationForm from '../components/KeyGrowRegistrationForm';

export default function KeyGrowDashboardPage() {
  const { isConnected, isLoggedIn, account, connectWallet, isConnecting, loginError } = useWallet();
  const {
    registerAsRenter,
    claimKeygrowAllocation,
    txStatus,
    resetStatus,
    isReady
  } = useContractTransactions();

  const [renterInfo, setRenterInfo] = useState<RenterInfo | null>(null);
  const [pendingAllocation, setPendingAllocation] = useState('0');
  const [loading, setLoading] = useState(true);
  const [selectedTier, setSelectedTier] = useState(0);
  const [toastEvents, setToastEvents] = useState<ContractEvent[]>([]);
  
  // Payment method selection
  const [paymentMethod, setPaymentMethod] = useState<'stripe' | 'bnb' | null>(null);
  const [showStripeForm, setShowStripeForm] = useState(false);
  const [showProgramComparison, setShowProgramComparison] = useState(false);
  
  // Fund Statistics
  const [fundStats, setFundStats] = useState({
    totalBalance: '0',
    activeRenters: 0,
    totalDistributed: '0',
    monthlyRevenue: '0'
  });
  
  // Property Management
  const [properties, setProperties] = useState<Array<{
    id: string;
    address: string;
    targetPrice: string;
    monthlyRent: string;
    currentSavings: string;
    progress: number;
  }>>([]);
  const [showAddProperty, setShowAddProperty] = useState(false);
  const [newProperty, setNewProperty] = useState({
    address: '',
    targetPrice: '',
    monthlyRent: ''
  });

  // Real-time event listener
  const { latestEvent, isConnected: eventStreamConnected } = useKeygrowEvents({
    personalEventsOnly: true,
    onEvent: (event) => {
      console.log('[KeyGrow] Real-time event received:', event);
      
      // Show toast notification
      setToastEvents(prev => [...prev, event]);
      
      // Auto-refresh data on relevant events
      if (event.eventName === 'RenterRegistered' || 
          event.eventName === 'AllocationClaimed') {
        setTimeout(() => {
          loadRenterData();
        }, 1000);
      }
    }
  });

  // Fetch renter data
  useEffect(() => {
    if (isConnected && account) {
      loadRenterData();
    }
  }, [isConnected, account]);

  // Refresh data after successful transaction
  useEffect(() => {
    if (txStatus.success && txStatus.txHash) {
      setTimeout(() => {
        loadRenterData();
        resetStatus();
      }, 2000);
    }
  }, [txStatus.success]);

  const loadRenterData = async () => {
    if (!account) return;
    
    setLoading(true);
    try {
      const [info, pending, stats] = await Promise.all([
        keygrowService.getRenterInfo(account),
        keygrowService.getPendingAllocations(account),
        keygrowService.getFundStats().catch(() => ({
          totalBalance: '0',
          activeRenters: 0,
          totalDistributed: '0',
          monthlyRevenue: '0'
        }))
      ]);
      
      setRenterInfo(info);
      setPendingAllocation(pending);
      setFundStats(stats);
    } catch (error) {
      console.error('Failed to load renter data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Load fund stats even without wallet connection
  useEffect(() => {
    const loadPublicStats = async () => {
      try {
        const stats = await keygrowService.getFundStats();
        setFundStats(stats);
      } catch (error) {
        console.error('Failed to load fund stats:', error);
      }
    };
    
    loadPublicStats();
  }, []);

  const handleRegister = async () => {
    await registerAsRenter(selectedTier);
  };

  const handleClaim = async () => {
    await claimKeygrowAllocation();
  };

  const handleWalletConnect = async () => {
    try {
      await connectWallet();
    } catch (error: any) {
      console.error('❌ Wallet connection failed:', error);
    }
  };

  const tierNames = ['Bronze', 'Silver', 'Gold', 'Platinum'];
  const tierColors = [
    'bg-orange-100 border-orange-300 text-orange-800',
    'bg-gray-100 border-gray-300 text-gray-800',
    'bg-yellow-100 border-yellow-300 text-yellow-900',
    'bg-purple-100 border-purple-300 text-purple-800',
  ];
  const tierDescriptions = [
    '1.0x multiplier - Start building your path to homeownership',
    '1.25x multiplier - Accelerate your journey with enhanced allocations',
    '1.5x multiplier - Premium tier with substantial monthly allocations',
    '2.0x multiplier - Maximum benefits for committed members',
  ];

  const isWalletReady = isConnected;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white p-3 sm:p-6">
      <div className="max-w-6xl mx-auto space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl shadow-lg p-4 sm:p-6 md:p-8 text-white">
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
            <div className="flex-1">
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2">🏠 KeyGrow Dashboard</h1>
              <p className="text-blue-100 text-sm sm:text-base md:text-lg mb-3">
                Your path from renting to homeownership through platform revenue sharing
              </p>
              <Button
                onClick={() => setShowProgramComparison(true)}
                variant="outline"
                className="bg-white/10 hover:bg-white/20 text-white border-white/30 text-xs sm:text-sm"
              >
                📊 Compare KeyGrow vs Real Estate Investor
              </Button>
            </div>
            <div className="flex flex-col items-start sm:items-end space-y-2 w-full sm:w-auto">
              {isWalletReady ? (
                <>
                  <div className="bg-white/10 backdrop-blur-sm rounded-lg px-3 sm:px-4 py-2 border border-white/20">
                    <div className="text-xs text-blue-100 mb-1">Connected Wallet</div>
                    <div className="font-mono text-xs sm:text-sm font-semibold">
                      {account?.slice(0, 6)}...{account?.slice(-4)}
                    </div>
                  </div>
                </>
              ) : (
                <Button 
                  onClick={handleWalletConnect}
                  disabled={isConnecting}
                  className="bg-white text-blue-600 hover:bg-blue-50 font-semibold shadow-lg text-sm sm:text-base w-full sm:w-auto"
                >
                  {isConnecting ? '🔄 Connecting...' : '🔗 Connect Wallet'}
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Connect Wallet Banner - shown when not connected */}
        {!isWalletReady && (
          <Card className="border-4 border-blue-600 bg-gradient-to-br from-blue-50 to-green-50 shadow-2xl">
            <CardContent className="p-4 sm:p-6 md:p-8">
              <div className="text-center mb-6">
                <div className="text-5xl sm:text-6xl md:text-7xl mb-4">🏡</div>
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-3 px-2">
                  Ready to Join KeyGrow?
                </h2>
                <p className="text-base sm:text-lg md:text-xl text-gray-700 max-w-2xl mx-auto px-4">
                  Connect your wallet to register, select your tier, and start receiving monthly allocations toward your dream home!
                </p>
              </div>

              {/* 3-Step Process */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
                <div className="bg-white rounded-lg p-6 border-2 border-blue-300 shadow-lg">
                  <div className="bg-blue-600 text-white rounded-full w-12 h-12 flex items-center justify-center font-bold text-xl mb-3 mx-auto">
                    1
                  </div>
                  <h4 className="font-bold text-lg text-gray-900 mb-2 text-center">Connect Wallet</h4>
                  <p className="text-sm text-gray-600 text-center">
                    Click below to connect your MetaMask or Web3 wallet (BSC network)
                  </p>
                </div>
                <div className="bg-white rounded-lg p-6 border-2 border-green-300 shadow-lg">
                  <div className="bg-green-600 text-white rounded-full w-12 h-12 flex items-center justify-center font-bold text-xl mb-3 mx-auto">
                    2
                  </div>
                  <h4 className="font-bold text-lg text-gray-900 mb-2 text-center">Choose Your Tier</h4>
                  <p className="text-sm text-gray-600 text-center">
                    Select Bronze, Silver, Gold, or Platinum (higher tier = bigger allocations)
                  </p>
                </div>
                <div className="bg-white rounded-lg p-6 border-2 border-purple-300 shadow-lg">
                  <div className="bg-purple-600 text-white rounded-full w-12 h-12 flex items-center justify-center font-bold text-xl mb-3 mx-auto">
                    3
                  </div>
                  <h4 className="font-bold text-lg text-gray-900 mb-2 text-center">Complete Registration</h4>
                  <p className="text-sm text-gray-600 text-center">
                    Pay $500 enrollment fee and start earning monthly toward homeownership
                  </p>
                </div>
              </div>

              {loginError && (
                <div className="bg-red-50 border-2 border-red-300 rounded-lg p-4 mb-6">
                  <div className="text-sm font-medium text-red-800 mb-1">❌ Connection Error:</div>
                  <div className="text-xs text-red-600">{loginError}</div>
                </div>
              )}

              <div className="text-center">
                <Button 
                  onClick={handleWalletConnect}
                  disabled={isConnecting}
                  className="bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 text-white text-base sm:text-lg md:text-2xl px-6 sm:px-10 md:px-12 py-4 sm:py-6 md:py-8 shadow-2xl transform hover:scale-105 transition-all w-full sm:w-auto"
                >
                  {isConnecting ? (
                    <>
                      <span className="animate-spin mr-2 sm:mr-3">⏳</span>
                      <span className="hidden sm:inline">Connecting Your Wallet...</span>
                      <span className="sm:hidden">Connecting...</span>
                    </>
                  ) : (
                    <>
                      🔗 <span className="hidden sm:inline">Connect Wallet & Start Registration</span>
                      <span className="sm:hidden">Connect & Register</span>
                    </>
                  )}
                </Button>
                <p className="text-xs sm:text-sm text-gray-600 mt-4 px-2">
                  Don't have a wallet? <a href="https://metamask.io" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline font-semibold">Get MetaMask (Free)</a>
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Program Overview - Comprehensive Information */}
        <Card className="border-2 border-blue-200">
          <CardContent className="p-4 sm:p-6 md:p-8">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-4 sm:mb-6 text-center px-2">
              🏡 Stop Renting, Start Owning - The KeyGrow Path to Homeownership
            </h2>
            
            <div className="bg-gradient-to-r from-blue-50 to-green-50 p-4 sm:p-6 rounded-lg mb-4 sm:mb-6">
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3">
                What is KeyGrow?
              </h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                KeyGrow is AXIOM's revolutionary rent-to-own program that uses <strong>20% of all platform revenue</strong> 
                to help renters become homeowners. Instead of rent disappearing into your landlord's pocket every month, 
                KeyGrow builds real equity toward YOUR down payment.
              </p>
              <p className="text-gray-700 leading-relaxed">
                Think of it as your community helping you buy a home. Every time someone trades crypto, stakes tokens, 
                or uses AXIOM banking services, <strong>you get a piece of that success</strong> - automatically 
                deposited into your homeownership fund.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6 mb-6">
              <div className="bg-blue-50 p-5 rounded-lg border-2 border-blue-200">
                <div className="text-blue-600 font-bold text-lg mb-2">📊 20% Revenue Share</div>
                <div className="text-gray-700 text-sm leading-relaxed">
                  Every dollar earned from platform fees (trading, banking, NFTs, staking) sends 20 cents to the Real Estate 
                  Acquisition Fund. This money is split among qualified renters based on their tier and participation time.
                </div>
              </div>
              <div className="bg-green-50 p-5 rounded-lg border-2 border-green-200">
                <div className="text-green-600 font-bold text-lg mb-2">🎯 Monthly Allocations</div>
                <div className="text-gray-700 text-sm leading-relaxed">
                  Registered members receive monthly allocations that grow over time. Higher tiers get bigger allocations 
                  (up to 2x multiplier for Platinum). Your allocation compounds - the longer you're in, the more you earn.
                </div>
              </div>
              <div className="bg-purple-50 p-5 rounded-lg border-2 border-purple-200">
                <div className="text-purple-600 font-bold text-lg mb-2">🏡 Down Payment Power</div>
                <div className="text-gray-700 text-sm leading-relaxed">
                  Use your accumulated funds for down payments on real properties. Typical timeline: 20% down payment 
                  on a $200K home ($40K) achieved in 2-3 years with platform support + your savings.
                </div>
              </div>
            </div>

            {/* Enrollment Fee Information */}
            <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-6 mb-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-3 flex items-center">
                <span className="text-2xl mr-2">💰</span>
                One-Time Enrollment Fee: $500 (in BNB)
              </h3>
              <div className="text-gray-700 leading-relaxed space-y-2">
                <p>
                  <strong>Why the fee?</strong> This one-time investment ensures serious commitment and covers:
                </p>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li><strong>Property research & verification</strong> - We help you find legitimate properties</li>
                  <li><strong>Credit reporting & documentation</strong> - Building your homeownership profile</li>
                  <li><strong>Legal & escrow services</strong> - Professional support during purchase</li>
                  <li><strong>Platform maintenance</strong> - Keeping the fund running transparently</li>
                </ul>
                <p className="mt-3">
                  <strong>Your $500 works for you:</strong> This fee is NOT taken from your allocation. 
                  It goes to operational costs so 100% of platform revenue reaches renters. 
                  Compare to typical realtor fees (3-6% = $6,000-$12,000 on a $200K home) - this is a bargain!
                </p>
              </div>
            </div>

            {/* How It Works - Step by Step */}
            <div className="mb-6">
              <h3 className="text-2xl font-bold text-gray-900 mb-4 text-center">
                🚀 Your Journey to Homeownership (Simple Steps)
              </h3>
              <div className="space-y-4">
                <div className="flex gap-4 items-start">
                  <div className="bg-blue-600 text-white rounded-full w-10 h-10 flex items-center justify-center font-bold flex-shrink-0">
                    1
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Choose Your Tier & Register</h4>
                    <p className="text-gray-700 text-sm">
                      Select Bronze, Silver, Gold, or Platinum based on your timeline and commitment. 
                      Higher tiers = bigger monthly allocations. Pay the one-time $500 enrollment fee.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4 items-start">
                  <div className="bg-green-600 text-white rounded-full w-10 h-10 flex items-center justify-center font-bold flex-shrink-0">
                    2
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Platform Revenue Flows to You</h4>
                    <p className="text-gray-700 text-sm">
                      As AXIOM users trade, stake, and bank, 20% of fees automatically go to the Real Estate Fund. 
                      Your share is calculated monthly based on your tier multiplier and time in the program.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4 items-start">
                  <div className="bg-purple-600 text-white rounded-full w-10 h-10 flex items-center justify-center font-bold flex-shrink-0">
                    3
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Claim Your Allocations Monthly</h4>
                    <p className="text-gray-700 text-sm">
                      Check back monthly to claim your allocation. Funds are held in your personal smart contract vault. 
                      You can withdraw anytime or let it compound toward your down payment goal.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4 items-start">
                  <div className="bg-orange-600 text-white rounded-full w-10 h-10 flex items-center justify-center font-bold flex-shrink-0">
                    4
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Reach Your Down Payment Goal</h4>
                    <p className="text-gray-700 text-sm">
                      Once you've accumulated enough for a down payment (typically 20% = $40K on a $200K home), 
                      we connect you with trusted real estate partners to find and purchase your property.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4 items-start">
                  <div className="bg-red-600 text-white rounded-full w-10 h-10 flex items-center justify-center font-bold flex-shrink-0">
                    5
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">You're a Homeowner!</h4>
                    <p className="text-gray-700 text-sm">
                      Move in, build equity, stop paying rent forever. Your mortgage payment is often LESS than rent, 
                      and every payment builds YOUR wealth, not your landlord's.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Real Example */}
            <div className="bg-gradient-to-r from-green-50 to-blue-50 p-6 rounded-lg border-2 border-green-300">
              <h3 className="text-xl font-semibold text-gray-900 mb-4 text-center">
                📊 Real Example: Sarah's Path to Homeownership
              </h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Before KeyGrow:</h4>
                  <ul className="text-sm text-gray-700 space-y-1">
                    <li>• Paying $1,500/month rent (money gone forever)</li>
                    <li>• Saving $300/month for down payment</li>
                    <li>• Needs $40,000 for 20% down ($200K home)</li>
                    <li>• Timeline: 11+ years to save $40K alone</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">With KeyGrow (Gold Tier):</h4>
                  <ul className="text-sm text-gray-700 space-y-1">
                    <li>• Still saving $300/month personal funds</li>
                    <li>• + $800/month platform allocation (1.5x multiplier)</li>
                    <li>• Total: $1,100/month toward down payment</li>
                    <li>• <strong className="text-green-600">Timeline: 3 years to homeownership! 🎉</strong></li>
                  </ul>
                </div>
              </div>
              <p className="text-center text-gray-700 mt-4 font-medium">
                KeyGrow cut Sarah's timeline from 11 years to 3 years - that's the power of community wealth building!
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Fund Statistics Dashboard */}
        <Card className="border-2 border-green-200 bg-gradient-to-br from-green-50 to-white">
          <CardContent className="p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <span className="text-3xl">📊</span>
              Real Estate Acquisition Fund - Live Statistics
            </h2>
            <div className="grid md:grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded-lg border-2 border-blue-200 shadow-sm">
                <div className="text-sm text-gray-600 mb-1">Total Fund Balance</div>
                <div className="text-2xl font-bold text-blue-600">{parseFloat(fundStats.totalBalance).toFixed(4)} BNB</div>
                <div className="text-xs text-gray-500 mt-1">≈ ${(parseFloat(fundStats.totalBalance) * 600).toFixed(2)}</div>
              </div>
              <div className="bg-white p-4 rounded-lg border-2 border-green-200 shadow-sm">
                <div className="text-sm text-gray-600 mb-1">Active Renters</div>
                <div className="text-2xl font-bold text-green-600">{fundStats.activeRenters}</div>
                <div className="text-xs text-gray-500 mt-1">Registered participants</div>
              </div>
              <div className="bg-white p-4 rounded-lg border-2 border-purple-200 shadow-sm">
                <div className="text-sm text-gray-600 mb-1">Total Distributed</div>
                <div className="text-2xl font-bold text-purple-600">{parseFloat(fundStats.totalDistributed).toFixed(4)} BNB</div>
                <div className="text-xs text-gray-500 mt-1">All-time allocations</div>
              </div>
              <div className="bg-white p-4 rounded-lg border-2 border-orange-200 shadow-sm">
                <div className="text-sm text-gray-600 mb-1">Monthly Revenue</div>
                <div className="text-2xl font-bold text-orange-600">{parseFloat(fundStats.monthlyRevenue).toFixed(4)} BNB</div>
                <div className="text-xs text-gray-500 mt-1">20% of platform fees</div>
              </div>
            </div>
            <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-gray-700">
              <strong>How it works:</strong> 20% of all AXIOM platform revenue (trading fees, staking fees, banking fees, NFT sales) 
              automatically flows to this fund. Funds are distributed monthly to registered KeyGrow members based on tier multipliers 
              and time in program. All transactions are transparent on-chain via smart contracts.
            </div>
          </CardContent>
        </Card>

        {/* Property Management Section - for registered users only */}
        {isWalletReady && renterInfo && renterInfo.registered && (
          <Card className="border-2 border-purple-200">
            <CardContent className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                  <span className="text-3xl">🏘️</span>
                  My Properties
                </h2>
                <Button
                  onClick={() => setShowAddProperty(!showAddProperty)}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  {showAddProperty ? '✖ Cancel' : '+ Add Property Goal'}
                </Button>
              </div>

              {/* Add Property Form */}
              {showAddProperty && (
                <div className="bg-purple-50 border-2 border-purple-300 rounded-lg p-6 mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Add New Property Goal</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Property Address</label>
                      <input
                        type="text"
                        value={newProperty.address}
                        onChange={(e) => setNewProperty({...newProperty, address: e.target.value})}
                        placeholder="123 Main St, City, State, ZIP"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      />
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Target Purchase Price (USD)</label>
                        <input
                          type="number"
                          value={newProperty.targetPrice}
                          onChange={(e) => setNewProperty({...newProperty, targetPrice: e.target.value})}
                          placeholder="200000"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Current Monthly Rent (USD)</label>
                        <input
                          type="number"
                          value={newProperty.monthlyRent}
                          onChange={(e) => setNewProperty({...newProperty, monthlyRent: e.target.value})}
                          placeholder="1500"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                        />
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <Button
                        onClick={() => {
                          if (newProperty.address && newProperty.targetPrice && newProperty.monthlyRent) {
                            const targetDown = parseFloat(newProperty.targetPrice) * 0.2;
                            setProperties([...properties, {
                              id: Date.now().toString(),
                              ...newProperty,
                              currentSavings: parseFloat(renterInfo.totalContributed).toFixed(2),
                              progress: (parseFloat(renterInfo.totalContributed) / targetDown) * 100
                            }]);
                            setNewProperty({ address: '', targetPrice: '', monthlyRent: '' });
                            setShowAddProperty(false);
                          }
                        }}
                        className="bg-purple-600 hover:bg-purple-700"
                        disabled={!newProperty.address || !newProperty.targetPrice || !newProperty.monthlyRent}
                      >
                        💾 Save Property Goal
                      </Button>
                      <Button
                        onClick={() => {
                          setNewProperty({ address: '', targetPrice: '', monthlyRent: '' });
                          setShowAddProperty(false);
                        }}
                        variant="outline"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Properties List */}
              {properties.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <div className="text-4xl mb-3">🏠</div>
                  <p className="text-lg font-medium">No property goals yet</p>
                  <p className="text-sm">Add a property to start tracking your progress toward homeownership!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {properties.map((property) => (
                    <div key={property.id} className="bg-white border-2 border-gray-200 rounded-lg p-5 hover:shadow-lg transition-shadow">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 className="font-semibold text-lg text-gray-900">{property.address}</h4>
                          <div className="text-sm text-gray-600 mt-1">
                            Target Price: <span className="font-semibold">${parseFloat(property.targetPrice).toLocaleString()}</span>
                            <span className="mx-2">|</span>
                            Monthly Rent: <span className="font-semibold">${parseFloat(property.monthlyRent).toLocaleString()}</span>
                          </div>
                        </div>
                        <button
                          onClick={() => setProperties(properties.filter(p => p.id !== property.id))}
                          className="text-red-600 hover:text-red-800 text-sm"
                        >
                          🗑️ Remove
                        </button>
                      </div>
                      
                      {/* Progress Bar */}
                      <div className="mb-3">
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-600">Down Payment Progress (20%)</span>
                          <span className="font-semibold text-purple-600">
                            ${property.currentSavings} / ${(parseFloat(property.targetPrice) * 0.2).toLocaleString()}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-4">
                          <div
                            className="bg-gradient-to-r from-purple-500 to-blue-500 h-4 rounded-full transition-all duration-300"
                            style={{ width: `${Math.min(property.progress, 100)}%` }}
                          ></div>
                        </div>
                        <div className="text-xs text-gray-500 mt-1 text-center">
                          {property.progress.toFixed(1)}% Complete
                        </div>
                      </div>

                      {/* Savings Comparison */}
                      <div className="grid md:grid-cols-2 gap-3 bg-blue-50 p-3 rounded-lg">
                        <div>
                          <div className="text-xs text-gray-600">Monthly Rent (Lost Forever)</div>
                          <div className="text-lg font-bold text-red-600">-${property.monthlyRent}</div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-600">Estimated Mortgage Payment</div>
                          <div className="text-lg font-bold text-green-600">
                            ${Math.round(parseFloat(property.targetPrice) * 0.8 * 0.005).toLocaleString()}
                          </div>
                          <div className="text-xs text-gray-500">Building YOUR equity!</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {loading ? (
          <Card>
            <CardContent className="p-12 text-center">
              <div className="animate-spin text-4xl mb-4">⏳</div>
              <div className="text-gray-600">Loading your KeyGrow data...</div>
            </CardContent>
          </Card>
        ) : renterInfo && renterInfo.registered ? (
          <>
            {/* Registered User - Dashboard */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* Status Card */}
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-xl font-semibold text-gray-800 mb-4">
                    Your Status
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Tier:</span>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${tierColors[renterInfo.tier]}`}>
                        {tierNames[renterInfo.tier]}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Multiplier:</span>
                      <span className="text-blue-600 font-bold">{renterInfo.multiplier}x</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Total Contributed:</span>
                      <span className="text-green-600 font-bold">
                        {parseFloat(renterInfo.totalContributed).toFixed(4)} BNB
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Last Claim:</span>
                      <span className="text-gray-800">
                        {renterInfo.lastClaimTime > 0
                          ? new Date(renterInfo.lastClaimTime * 1000).toLocaleDateString()
                          : 'Never'}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Pending Allocation Card */}
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-xl font-semibold text-gray-800 mb-4">
                    Available to Claim
                  </h3>
                  <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-6 mb-4">
                    <div className="text-sm text-green-700 mb-2">Pending Allocation</div>
                    <div className="text-4xl font-bold text-green-600 mb-2">
                      {parseFloat(pendingAllocation).toFixed(6)} BNB
                    </div>
                    <div className="text-sm text-green-700">
                      ≈ ${(parseFloat(pendingAllocation) * 600).toFixed(2)} USD
                    </div>
                  </div>
                  <Button
                    onClick={handleClaim}
                    disabled={!isWalletReady || txStatus.loading || parseFloat(pendingAllocation) === 0}
                    className="w-full bg-green-600 hover:bg-green-700"
                  >
                    {txStatus.loading ? (
                      <>
                        <span className="animate-spin mr-2">⏳</span>
                        Claiming...
                      </>
                    ) : (
                      '💰 Claim Allocation'
                    )}
                  </Button>
                  {parseFloat(pendingAllocation) === 0 && (
                    <p className="text-sm text-gray-500 mt-2 text-center">
                      No allocation available yet. Check back next month!
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Transaction Status */}
            {txStatus.loading && (
              <Card>
                <CardContent className="p-6 bg-blue-50">
                  <div className="flex items-center gap-3">
                    <span className="animate-spin text-2xl">⏳</span>
                    <div>
                      <div className="font-medium text-blue-800">Transaction in progress...</div>
                      <div className="text-sm text-blue-600">Please sign the transaction in your wallet</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {txStatus.success && txStatus.txHash && (
              <Card>
                <CardContent className="p-6 bg-green-50">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-green-800 mb-1">✅ Transaction Successful!</div>
                      <div className="text-sm text-green-600">
                        TX: {txStatus.txHash.slice(0, 10)}...{txStatus.txHash.slice(-8)}
                      </div>
                    </div>
                    <a
                      href={`https://bscscan.com/tx/${txStatus.txHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline text-sm"
                    >
                      View on BSCScan →
                    </a>
                  </div>
                </CardContent>
              </Card>
            )}

            {txStatus.error && (
              <Card>
                <CardContent className="p-6 bg-red-50">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-red-800 mb-1">❌ Transaction Failed</div>
                      <div className="text-sm text-red-600">{txStatus.error}</div>
                    </div>
                    <Button onClick={resetStatus} variant="outline" size="sm">
                      Dismiss
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        ) : (
          <>
            {/* Not Registered - Registration Form */}
            <Card className="border-4 border-green-500 bg-gradient-to-br from-green-50 to-blue-50 shadow-2xl">
              <CardContent className="p-10">
                <div className="text-center mb-8">
                  <div className="text-6xl mb-4">🎉</div>
                  <h2 className="text-4xl font-bold text-gray-900 mb-3">
                    Complete Your KeyGrow Registration
                  </h2>
                  <p className="text-xl text-gray-700 max-w-2xl mx-auto">
                    You're one step away from earning monthly allocations toward homeownership! Select your tier and register.
                  </p>
                </div>

                {/* Tier Selection */}
                <div className="mb-8">
                  <label className="block text-2xl font-bold text-gray-900 mb-6 text-center">
                    📊 Choose Your Tier Level
                  </label>
                  <p className="text-center text-gray-600 mb-6">
                    Higher tiers = bigger monthly allocations. Select based on your commitment level and timeline.
                  </p>
                  <div className="grid md:grid-cols-2 gap-6">
                    {tierNames.map((name, index) => (
                      <button
                        key={index}
                        onClick={() => setSelectedTier(index)}
                        className={`p-6 rounded-xl border-3 transition-all text-left transform hover:scale-105 ${
                          selectedTier === index
                            ? tierColors[index] + ' ring-4 ring-blue-500 shadow-2xl scale-105'
                            : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50 shadow-lg'
                        }`}
                      >
                        <div className="flex justify-between items-start mb-3">
                          <div className="font-bold text-2xl">{name} Tier</div>
                          <div className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-bold">
                            {[1.0, 1.25, 1.5, 2.0][index]}x
                          </div>
                        </div>
                        <div className="text-sm opacity-90 leading-relaxed">{tierDescriptions[index]}</div>
                        {selectedTier === index && (
                          <div className="mt-3 bg-white/50 rounded-lg p-2 text-xs font-semibold text-blue-700">
                            ✓ Selected
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Payment Method Selection */}
                <div className="bg-gradient-to-r from-yellow-50 to-blue-50 border-2 border-blue-400 rounded-xl p-6 mb-8">
                  <div className="text-center mb-4">
                    <h4 className="font-bold text-2xl text-gray-900 mb-2">💳 Choose Your Payment Method</h4>
                    <p className="text-sm text-gray-600">
                      One-time enrollment fee: <strong className="text-blue-700">$500</strong>
                    </p>
                  </div>
                  
                  <div className="grid md:grid-cols-2 gap-4 mb-4">
                    {/* Stripe Payment Option */}
                    <button
                      onClick={() => setPaymentMethod('stripe')}
                      className={`p-6 rounded-xl border-3 transition-all transform hover:scale-105 ${
                        paymentMethod === 'stripe'
                          ? 'bg-blue-100 border-blue-500 ring-4 ring-blue-300 shadow-2xl scale-105'
                          : 'bg-white border-gray-300 hover:bg-gray-50 shadow-lg'
                      }`}
                    >
                      <div className="text-4xl mb-3 text-center">💳</div>
                      <h5 className="font-bold text-lg text-gray-900 mb-2 text-center">Credit/Debit Card</h5>
                      <p className="text-sm text-gray-600 text-center mb-2">
                        Pay $500 via Stripe
                      </p>
                      <ul className="text-xs text-gray-600 space-y-1">
                        <li>✓ No crypto wallet required</li>
                        <li>✓ Instant card processing</li>
                        <li>✓ Secure Stripe payment</li>
                        <li>✓ Best for beginners</li>
                      </ul>
                      {paymentMethod === 'stripe' && (
                        <div className="mt-3 bg-blue-600 text-white rounded-lg p-2 text-xs font-semibold text-center">
                          ✓ Selected
                        </div>
                      )}
                    </button>

                    {/* BNB Crypto Payment Option */}
                    <button
                      onClick={() => setPaymentMethod('bnb')}
                      className={`p-6 rounded-xl border-3 transition-all transform hover:scale-105 ${
                        paymentMethod === 'bnb'
                          ? 'bg-yellow-100 border-yellow-500 ring-4 ring-yellow-300 shadow-2xl scale-105'
                          : 'bg-white border-gray-300 hover:bg-gray-50 shadow-lg'
                      }`}
                    >
                      <div className="text-4xl mb-3 text-center">⛓️</div>
                      <h5 className="font-bold text-lg text-gray-900 mb-2 text-center">Cryptocurrency (BNB)</h5>
                      <p className="text-sm text-gray-600 text-center mb-2">
                        Pay $500 worth of BNB
                      </p>
                      <ul className="text-xs text-gray-600 space-y-1">
                        <li>✓ Fully decentralized</li>
                        <li>✓ On-chain transparency</li>
                        <li>✓ Lower fees</li>
                        <li>✓ Requires BSC wallet</li>
                      </ul>
                      {paymentMethod === 'bnb' && (
                        <div className="mt-3 bg-yellow-600 text-white rounded-lg p-2 text-xs font-semibold text-center">
                          ✓ Selected
                        </div>
                      )}
                    </button>
                  </div>

                  <div className="bg-white rounded-lg p-4 text-center">
                    <p className="text-xs text-gray-600">
                      <strong>What's covered:</strong> Property research, credit reporting, legal services, 
                      platform maintenance. <strong className="text-green-700">All revenue allocations go 100% to you!</strong>
                    </p>
                  </div>
                </div>

                {/* Register Button */}
                {!paymentMethod && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
                    <p className="text-sm text-red-700">
                      ⚠️ Please select a payment method above (Stripe or BNB) to continue
                    </p>
                  </div>
                )}
                
                {paymentMethod === 'stripe' && (
                  <Button
                    onClick={() => setShowStripeForm(true)}
                    className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white text-2xl py-8 shadow-2xl transform hover:scale-105 transition-all"
                  >
                    💳 Continue to Credit Card Payment ($500)
                  </Button>
                )}
                
                {paymentMethod === 'bnb' && (
                  <>
                    <Button
                      onClick={handleRegister}
                      disabled={!isWalletReady || txStatus.loading}
                      className="w-full bg-gradient-to-r from-yellow-600 to-yellow-700 hover:from-yellow-700 hover:to-yellow-800 text-white text-2xl py-8 shadow-2xl transform hover:scale-105 transition-all"
                    >
                      {txStatus.loading ? (
                        <>
                          <span className="animate-spin mr-3">⏳</span>
                          Registering for KeyGrow...
                        </>
                      ) : (
                        <>
                          ⛓️ Register as {tierNames[selectedTier]} & Pay in BNB
                        </>
                      )}
                    </Button>
                    <p className="text-center text-sm text-gray-600 mt-4">
                      You'll be prompted to approve the transaction in your wallet
                    </p>
                  </>
                )}

                {/* Transaction Status */}
                {txStatus.loading && (
                  <div className="mt-4 bg-blue-50 border border-blue-200 rounded p-4 text-sm text-blue-700">
                    📝 Please sign the transaction in your wallet to complete registration
                  </div>
                )}

                {txStatus.success && txStatus.txHash && (
                  <div className="mt-4 bg-green-50 border border-green-200 rounded p-4">
                    <div className="text-sm font-medium text-green-800 mb-1">
                      ✅ Registration successful!
                    </div>
                    <div className="text-xs text-green-600">
                      TX: {txStatus.txHash.slice(0, 10)}...{txStatus.txHash.slice(-8)}
                    </div>
                    <a
                      href={`https://bscscan.com/tx/${txStatus.txHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-600 hover:underline mt-2 inline-block"
                    >
                      View on BSCScan →
                    </a>
                  </div>
                )}

                {txStatus.error && (
                  <div className="mt-4 bg-red-50 border border-red-200 rounded p-4">
                    <div className="text-sm font-medium text-red-800 mb-1">
                      ❌ Registration failed
                    </div>
                    <div className="text-xs text-red-600 mb-2">{txStatus.error}</div>
                    <Button onClick={resetStatus} variant="outline" size="sm">
                      Try Again
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}

        {/* Axiom Prime Membership Cross-Promotion */}
        <Card className="border-2 border-purple-500 bg-gradient-to-br from-purple-50 to-pink-50">
          <CardContent className="p-4 sm:p-6 md:p-8">
            <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-6">
              <div className="text-4xl sm:text-5xl md:text-6xl">💎</div>
              <div className="flex-1">
                <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-2 sm:mb-3">
                  ⚡ Boost Your Rewards with Axiom Prime Membership!
                </h2>
                <p className="text-sm sm:text-base md:text-lg text-gray-700 mb-4">
                  Join Axiom Prime to earn <strong>loyalty multipliers up to 1.6x</strong> on your KeyGrow allocations, 
                  get <strong>fee discounts up to 50%</strong>, earn points on every transaction, and access a 
                  <strong>3-level referral system</strong> for passive income. Plus, unlock premium benefits like 
                  priority support, insurance coverage, and exclusive rewards!
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
                  <div className="bg-white rounded-lg p-3 sm:p-4 text-center shadow-sm">
                    <div className="text-2xl sm:text-3xl mb-1 sm:mb-2">🆓</div>
                    <div className="font-bold text-gray-900 text-sm sm:text-base">Free Tier</div>
                    <div className="text-xs sm:text-sm text-gray-600">$0-4,999 TVL</div>
                    <div className="text-xs text-purple-600 mt-1">1.0x</div>
                  </div>
                  <div className="bg-white rounded-lg p-3 sm:p-4 text-center shadow-sm">
                    <div className="text-2xl sm:text-3xl mb-1 sm:mb-2">🥈</div>
                    <div className="font-bold text-gray-900 text-sm sm:text-base">Silver</div>
                    <div className="text-xs sm:text-sm text-gray-600">$5K-24K TVL</div>
                    <div className="text-xs text-purple-600 mt-1">1.2x</div>
                  </div>
                  <div className="bg-white rounded-lg p-3 sm:p-4 text-center shadow-sm">
                    <div className="text-2xl sm:text-3xl mb-1 sm:mb-2">🥇</div>
                    <div className="font-bold text-gray-900 text-sm sm:text-base">Gold</div>
                    <div className="text-xs sm:text-sm text-gray-600">$25K-99K TVL</div>
                    <div className="text-xs text-purple-600 mt-1">1.4x</div>
                  </div>
                  <div className="bg-white rounded-lg p-3 sm:p-4 text-center shadow-sm border-2 border-purple-400">
                    <div className="text-2xl sm:text-3xl mb-1 sm:mb-2">💎</div>
                    <div className="font-bold text-gray-900 text-sm sm:text-base">Platinum</div>
                    <div className="text-xs sm:text-sm text-gray-600">$100K+ TVL</div>
                    <div className="text-xs text-purple-600 mt-1">1.6x!</div>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                  <a 
                    href="/axiom-prime"
                    className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-6 rounded-lg transition-colors shadow-lg text-center text-sm sm:text-base"
                  >
                    View Axiom Prime Dashboard →
                  </a>
                  <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm text-gray-600 justify-center sm:justify-start">
                    <span>✨ Earn points</span>
                    <span className="hidden sm:inline">•</span>
                    <span>💰 Referral commissions</span>
                    <span className="hidden sm:inline">•</span>
                    <span>🎁 Rewards</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Real Estate Investor Cross-Promotion */}
        <Card className="border-2 border-green-500 bg-gradient-to-br from-green-50 to-blue-50">
          <CardContent className="p-4 sm:p-6 md:p-8">
            <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-6">
              <div className="text-4xl sm:text-5xl md:text-6xl">🏢</div>
              <div className="flex-1">
                <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-2 sm:mb-3">
                  💰 Earn While You Save - Become a Real Estate Investor!
                </h2>
                <p className="text-sm sm:text-base md:text-lg text-gray-700 mb-4">
                  While waiting for your KeyGrow allocations to grow, <strong>accelerate your path to homeownership</strong> by investing 
                  in our Real Estate Investor platform. Earn monthly rental income, property appreciation, and exit profits!
                </p>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-6">
                  <div className="bg-white p-3 sm:p-4 rounded-lg border-2 border-green-200">
                    <div className="text-green-600 font-bold text-base sm:text-lg mb-2">🎯 Low Entry: 0.05 BNB</div>
                    <div className="text-gray-700 text-xs sm:text-sm">
                      Start investing with just $30. Own fractional shares of real properties and earn from rental income immediately.
                    </div>
                  </div>
                  <div className="bg-white p-3 sm:p-4 rounded-lg border-2 border-blue-200">
                    <div className="text-blue-600 font-bold text-base sm:text-lg mb-2">📈 5 Ways to Earn</div>
                    <div className="text-gray-700 text-xs sm:text-sm">
                      Monthly rent distributions + property appreciation + exit profits. Diversify across multiple properties.
                    </div>
                  </div>
                  <div className="bg-white p-3 sm:p-4 rounded-lg border-2 border-purple-200">
                    <div className="text-purple-600 font-bold text-base sm:text-lg mb-2">🏠 Real Properties</div>
                    <div className="text-gray-700 text-xs sm:text-sm">
                      Invest in verified, income-generating real estate. All properties are professionally managed with transparent records.
                    </div>
                  </div>
                  <div className="bg-white p-3 sm:p-4 rounded-lg border-2 border-orange-200">
                    <div className="text-orange-600 font-bold text-base sm:text-lg mb-2">⚡ Instant Claims</div>
                    <div className="text-gray-700 text-xs sm:text-sm">
                      Claim your rental income anytime. No lock-up periods. Full control over your investments and earnings.
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-yellow-100 to-green-100 p-3 sm:p-4 md:p-5 rounded-lg border-2 border-yellow-400 mb-4 sm:mb-6">
                  <h3 className="font-bold text-gray-900 mb-2 text-base sm:text-lg">💡 Smart Strategy: Double Your Income</h3>
                  <p className="text-gray-700 text-xs sm:text-sm md:text-base">
                    <strong>KeyGrow allocations</strong> (building down payment) + <strong>RE Investor rental income</strong> (extra cash flow) 
                    = <strong className="text-green-600">Faster path to homeownership!</strong> Many members use rental earnings to 
                    boost their down payment savings by 30-50%.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                  <Button
                    onClick={() => window.location.href = '/real-estate-investor'}
                    className="bg-green-600 hover:bg-green-700 text-white text-sm sm:text-base md:text-lg px-6 sm:px-8 py-3 sm:py-4 md:py-6 shadow-lg w-full sm:w-auto"
                  >
                    🏢 Browse Investment Properties
                  </Button>
                  <Button
                    onClick={() => window.open('/real-estate-investor', '_blank')}
                    variant="outline"
                    className="border-2 border-green-600 text-green-600 hover:bg-green-50 text-sm sm:text-base md:text-lg px-6 sm:px-8 py-3 sm:py-4 md:py-6 w-full sm:w-auto"
                  >
                    📊 View Platform Stats
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Info Section */}
        <Card>
          <CardContent className="p-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">
              Tier Benefits Comparison
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-2">Tier</th>
                    <th className="text-left py-3 px-2">Multiplier</th>
                    <th className="text-left py-3 px-2">Benefits</th>
                  </tr>
                </thead>
                <tbody>
                  {tierNames.map((name, index) => (
                    <tr key={index} className="border-b">
                      <td className="py-3 px-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${tierColors[index]}`}>
                          {name}
                        </span>
                      </td>
                      <td className="py-3 px-2 font-bold text-blue-600">
                        {[1.0, 1.25, 1.5, 2.0][index]}x
                      </td>
                      <td className="py-3 px-2 text-gray-600">
                        {tierDescriptions[index]}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Event Toast Notifications */}
      {toastEvents.map((event, index) => (
        <EventToast
          key={`${event.timestamp}-${index}`}
          event={event}
          onClose={() => setToastEvents(prev => prev.filter((_, i) => i !== index))}
        />
      ))}

      {/* Event Stream Status Indicator */}
      {eventStreamConnected && (
        <div className="fixed bottom-4 right-4 bg-green-100 border border-green-300 rounded-full px-3 py-1 text-xs text-green-700 flex items-center gap-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          Live Updates Active
        </div>
      )}

      {/* Stripe Registration Form Modal */}
      {showStripeForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <KeyGrowRegistrationForm 
              onClose={() => {
                setShowStripeForm(false);
                // Refresh data after successful registration
                loadRenterData();
              }}
              walletAddress={account}
            />
          </div>
        </div>
      )}

      {/* Program Comparison Modal */}
      {showProgramComparison && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-xl max-w-7xl w-full max-h-[90vh] overflow-y-auto">
            <ProgramComparison onClose={() => setShowProgramComparison(false)} />
          </div>
        </div>
      )}
    </div>
  );
}
