import React, { useState, useEffect } from 'react';
import { useWallet } from '../contexts/WalletContext';
import { useContractTransactions } from '../hooks/useContractTransactions';
import { useKeygrowEvents, ContractEvent } from '../hooks/useContractEvents';
import { EventToast } from '../components/EventToast';
import { keygrowService, type RenterInfo } from '../services/contracts';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';

export default function KeyGrowDashboardPage() {
  const { isConnected, isLoggedIn, account } = useWallet();
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
            <Button className="bg-blue-600 hover:bg-blue-700">
              Connect Wallet
            </Button>
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

        {/* Program Overview */}
        <Card>
          <CardContent className="p-6">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">
              How KeyGrow Works
            </h2>
            <div className="grid md:grid-cols-3 gap-4 text-sm">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="text-blue-600 font-bold mb-2">📊 20% Revenue Share</div>
                <div className="text-gray-700">
                  20% of all AXIOM platform revenue goes to the Real Estate Acquisition Fund
                </div>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="text-green-600 font-bold mb-2">🎯 Monthly Allocations</div>
                <div className="text-gray-700">
                  Registered renters receive monthly allocations based on their tier
                </div>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <div className="text-purple-600 font-bold mb-2">🏡 Down Payment Assistance</div>
                <div className="text-gray-700">
                  Use accumulated funds for property down payments and acquisition
                </div>
              </div>
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
