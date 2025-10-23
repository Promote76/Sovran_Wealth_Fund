import React, { useState, useEffect } from 'react';
import { useWallet } from '../contexts/WalletContext';
import { useContractTransactions } from '../hooks/useContractTransactions';
import { useKeygrowEvents, ContractEvent } from '../hooks/useContractEvents';
import { EventToast } from '../components/EventToast';
import { keygrowService, type RenterInfo } from '../services/contracts';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';

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
      const [info, pending] = await Promise.all([
        keygrowService.getRenterInfo(account),
        keygrowService.getPendingAllocations(account)
      ]);
      
      setRenterInfo(info);
      setPendingAllocation(pending);
    } catch (error) {
      console.error('Failed to load renter data:', error);
    } finally {
      setLoading(false);
    }
  };

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

  if (!isConnected || !isLoggedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-xl shadow-lg p-8 text-center">
            <h1 className="text-3xl font-bold text-gray-800 mb-4">
              🏠 KeyGrow Rent-to-Own Program
            </h1>
            <p className="text-gray-600 mb-6">
              Please connect your wallet to access the KeyGrow dashboard
            </p>
            <Button 
              onClick={handleWalletConnect}
              disabled={isConnecting}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isConnecting ? '🔄 Connecting...' : '🔗 Connect Wallet'}
            </Button>
            {loginError && (
              <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="text-sm font-medium text-red-800 mb-2">Connection Error:</div>
                <div className="text-xs text-red-600">{loginError}</div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl shadow-lg p-8 text-white">
          <h1 className="text-4xl font-bold mb-2">🏠 KeyGrow Dashboard</h1>
          <p className="text-blue-100 text-lg">
            Your path from renting to homeownership through platform revenue sharing
          </p>
        </div>

        {/* Program Overview - Comprehensive Information */}
        <Card className="border-2 border-blue-200">
          <CardContent className="p-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-6 text-center">
              🏡 Stop Renting, Start Owning - The KeyGrow Path to Homeownership
            </h2>
            
            <div className="bg-gradient-to-r from-blue-50 to-green-50 p-6 rounded-lg mb-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
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
                    disabled={!isReady || txStatus.loading || parseFloat(pendingAllocation) === 0}
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
            <Card>
              <CardContent className="p-8">
                <h2 className="text-2xl font-semibold text-gray-800 mb-2">
                  Join KeyGrow Today
                </h2>
                <p className="text-gray-600 mb-6">
                  Register now to start receiving monthly allocations from platform revenue
                </p>

                {/* Tier Selection */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Select Your Tier
                  </label>
                  <div className="grid md:grid-cols-2 gap-4">
                    {tierNames.map((name, index) => (
                      <button
                        key={index}
                        onClick={() => setSelectedTier(index)}
                        className={`p-4 rounded-lg border-2 transition-all text-left ${
                          selectedTier === index
                            ? tierColors[index] + ' ring-2 ring-blue-500 shadow-md'
                            : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                        }`}
                      >
                        <div className="font-bold text-lg mb-1">{name} Tier</div>
                        <div className="text-sm opacity-90">{tierDescriptions[index]}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Register Button */}
                <Button
                  onClick={handleRegister}
                  disabled={!isReady || txStatus.loading}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-lg py-6"
                >
                  {txStatus.loading ? (
                    <>
                      <span className="animate-spin mr-2">⏳</span>
                      Registering...
                    </>
                  ) : (
                    `Register as ${tierNames[selectedTier]}`
                  )}
                </Button>

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
    </div>
  );
}
