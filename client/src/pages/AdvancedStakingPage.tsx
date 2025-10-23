import React, { useState, useEffect } from 'react';
import { useWallet } from '../contexts/WalletContext';
import { useContractTransactions } from '../hooks/useContractTransactions';
import { useAdvancedStakingEvents, ContractEvent } from '../hooks/useContractEvents';
import { EventToast } from '../components/EventToast';
import { advancedStakingService, type UserStake } from '../services/contracts';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Input } from '../components/ui/input';

export default function AdvancedStakingPage() {
  const { isConnected, isLoggedIn, account } = useWallet();
  const {
    stakeNFT,
    unstakeNFT,
    claimStakingRewards,
    txStatus,
    resetStatus,
    isReady
  } = useContractTransactions();

  const [stakes, setStakes] = useState<UserStake[]>([]);
  const [pendingRewards, setPendingRewards] = useState('0');
  const [stakingStats, setStakingStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showStakeModal, setShowStakeModal] = useState(false);
  const [toastEvents, setToastEvents] = useState<ContractEvent[]>([]);

  // Real-time event listener
  const { isConnected: eventStreamConnected } = useAdvancedStakingEvents({
    personalEventsOnly: true,
    onEvent: (event) => {
      console.log('[AdvancedStaking] Real-time event received:', event);
      setToastEvents(prev => [...prev, event]);
      
      // Auto-refresh staking data on relevant events
      if (['Staked', 'Unstaked', 'RewardsClaimed'].includes(event.eventName)) {
        setTimeout(() => loadStakingData(), 1000);
      }
    }
  });

  // Stake form state
  const [nftContract, setNftContract] = useState('');
  const [tokenId, setTokenId] = useState('');
  const [selectedTier, setSelectedTier] = useState(0);

  // Load staking data
  useEffect(() => {
    if (isConnected && account) {
      loadStakingData();
    }
  }, [isConnected, account]);

  // Refresh after successful transaction
  useEffect(() => {
    if (txStatus.success && txStatus.txHash) {
      setTimeout(() => {
        loadStakingData();
        resetStatus();
        setShowStakeModal(false);
        setNftContract('');
        setTokenId('');
      }, 2000);
    }
  }, [txStatus.success]);

  const loadStakingData = async () => {
    if (!account) return;
    
    setLoading(true);
    try {
      const [userStakes, rewards, stats] = await Promise.all([
        advancedStakingService.getUserStakes(account),
        advancedStakingService.getPendingRewards(account),
        advancedStakingService.getStakingStats()
      ]);
      
      setStakes(userStakes);
      setPendingRewards(rewards);
      setStakingStats(stats);
    } catch (error) {
      console.error('Failed to load staking data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStakeNFT = async () => {
    if (!nftContract || !tokenId) {
      alert('Please fill in all fields');
      return;
    }
    await stakeNFT(nftContract, tokenId, selectedTier);
  };

  const handleUnstake = async (stakeId: string) => {
    if (confirm('Are you sure you want to unstake this NFT?')) {
      await unstakeNFT(stakeId);
    }
  };

  const handleClaimRewards = async () => {
    await claimStakingRewards();
  };

  const tierNames = ['Bronze', 'Silver', 'Gold', 'Platinum'];
  const tierColors = [
    'bg-orange-100 border-orange-300 text-orange-800',
    'bg-gray-100 border-gray-300 text-gray-800',
    'bg-yellow-100 border-yellow-300 text-yellow-900',
    'bg-purple-100 border-purple-300 text-purple-800',
  ];
  const tierAPRs = [10, 15, 20, 30]; // APR percentages

  if (!isConnected || !isLoggedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-xl shadow-lg p-8 text-center">
            <h1 className="text-3xl font-bold text-gray-800 mb-4">
              ⚡ Advanced NFT Staking
            </h1>
            <p className="text-gray-600 mb-6">
              Please connect your wallet to access staking
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
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl shadow-lg p-8 text-white">
          <h1 className="text-4xl font-bold mb-2">⚡ Advanced NFT Staking</h1>
          <p className="text-blue-100 text-lg">
            Stake your NFTs and earn AXM rewards based on tier and duration
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid md:grid-cols-3 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="text-sm text-gray-600 mb-1">Your Active Stakes</div>
              <div className="text-3xl font-bold text-blue-600">{stakes.length}</div>
              <div className="text-xs text-gray-500 mt-1">NFTs currently staked</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="text-sm text-gray-600 mb-1">Pending Rewards</div>
              <div className="text-3xl font-bold text-green-600">
                {parseFloat(pendingRewards).toFixed(2)} AXM
              </div>
              <div className="text-xs text-gray-500 mt-1">Ready to claim</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="text-sm text-gray-600 mb-1">Daily Rewards</div>
              <div className="text-3xl font-bold text-purple-600">
                {stakingStats?.dailyRewardRate || '100'} AXM
              </div>
              <div className="text-xs text-gray-500 mt-1">Distribution pool</div>
            </CardContent>
          </Card>
        </div>

        {/* Rewards Section */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-xl font-semibold text-gray-800">Your Rewards</h3>
                <p className="text-sm text-gray-600">Claim your accumulated AXM tokens</p>
              </div>
              <Button
                onClick={handleClaimRewards}
                disabled={!isReady || txStatus.loading || parseFloat(pendingRewards) === 0}
                className="bg-green-600 hover:bg-green-700"
              >
                {txStatus.loading ? (
                  <>
                    <span className="animate-spin mr-2">⏳</span>
                    Claiming...
                  </>
                ) : (
                  '💰 Claim Rewards'
                )}
              </Button>
            </div>
            
            {parseFloat(pendingRewards) === 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-700">
                💡 Stake NFTs to start earning AXM rewards daily
              </div>
            )}
          </CardContent>
        </Card>

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

        {/* Active Stakes */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-gray-800">Your Staked NFTs</h3>
              <Button
                onClick={() => setShowStakeModal(true)}
                className="bg-blue-600 hover:bg-blue-700"
              >
                ➕ Stake NFT
              </Button>
            </div>

            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin text-4xl mb-4">⏳</div>
                <div className="text-gray-600">Loading your stakes...</div>
              </div>
            ) : stakes.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">🎨</div>
                <h4 className="text-xl font-semibold text-gray-800 mb-2">No Staked NFTs</h4>
                <p className="text-gray-600 mb-4">Stake your NFTs to start earning rewards</p>
                <Button
                  onClick={() => setShowStakeModal(true)}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Stake Your First NFT
                </Button>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {stakes.map((stake) => (
                  <Card key={stake.id} className="border-2">
                    <CardContent className="p-4">
                      <div className="bg-gradient-to-br from-blue-100 to-indigo-100 rounded-lg h-32 flex items-center justify-center mb-3">
                        <div className="text-5xl">🖼️</div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="text-xs text-gray-500">Token #{stake.nftTokenId}</div>
                            <div className="text-xs text-gray-400 truncate max-w-[120px]">
                              {stake.nftContract.slice(0, 10)}...
                            </div>
                          </div>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${tierColors[stake.tier]}`}>
                            {tierNames[stake.tier]}
                          </span>
                        </div>

                        <div className="border-t pt-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">APR:</span>
                            <span className="font-bold text-blue-600">{tierAPRs[stake.tier]}%</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Rewards:</span>
                            <span className="font-bold text-green-600">{parseFloat(stake.rewards).toFixed(2)} AXM</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Staked:</span>
                            <span className="text-gray-700">
                              {new Date(stake.stakedAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>

                        <Button
                          onClick={() => handleUnstake(stake.id.toString())}
                          disabled={!isReady || txStatus.loading}
                          variant="outline"
                          className="w-full mt-2 border-red-300 text-red-600 hover:bg-red-50"
                        >
                          Unstake
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tier Information */}
        <Card>
          <CardContent className="p-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Staking Tiers & APR</h3>
            <div className="grid md:grid-cols-4 gap-4">
              {tierNames.map((name, index) => (
                <div key={index} className={`p-4 rounded-lg border-2 ${tierColors[index]}`}>
                  <div className="font-bold text-lg mb-1">{name}</div>
                  <div className="text-2xl font-bold mb-1">{tierAPRs[index]}%</div>
                  <div className="text-sm opacity-90">Annual Percentage Rate</div>
                </div>
              ))}
            </div>
            <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-700">
              💡 Higher tiers offer better APR rates. Choose your tier when staking to maximize rewards!
            </div>
          </CardContent>
        </Card>

        {/* Stake Modal */}
        {showStakeModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <Card className="max-w-lg w-full mx-4">
              <CardContent className="p-6">
                <h3 className="text-2xl font-semibold text-gray-800 mb-4">
                  Stake Your NFT
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      NFT Contract Address
                    </label>
                    <Input
                      type="text"
                      placeholder="0x..."
                      value={nftContract}
                      onChange={(e) => setNftContract(e.target.value)}
                      className="w-full"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Token ID
                    </label>
                    <Input
                      type="text"
                      placeholder="1"
                      value={tokenId}
                      onChange={(e) => setTokenId(e.target.value)}
                      className="w-full"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Select Staking Tier
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {tierNames.map((name, index) => (
                        <button
                          key={index}
                          onClick={() => setSelectedTier(index)}
                          className={`p-3 rounded-lg border-2 transition-all text-left ${
                            selectedTier === index
                              ? tierColors[index] + ' ring-2 ring-blue-500'
                              : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                          }`}
                        >
                          <div className="font-bold">{name}</div>
                          <div className="text-sm">{tierAPRs[index]}% APR</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-800">
                    ⚠️ Make sure you've approved the staking contract to transfer your NFT
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={handleStakeNFT}
                      disabled={!isReady || txStatus.loading || !nftContract || !tokenId}
                      className="flex-1 bg-blue-600 hover:bg-blue-700"
                    >
                      {txStatus.loading ? (
                        <>
                          <span className="animate-spin mr-2">⏳</span>
                          Staking...
                        </>
                      ) : (
                        'Stake NFT'
                      )}
                    </Button>
                    <Button
                      onClick={() => {
                        setShowStakeModal(false);
                        setNftContract('');
                        setTokenId('');
                      }}
                      variant="outline"
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Event Toast Notifications */}
        {toastEvents.map((event, index) => (
          <EventToast
            key={`${event.timestamp}-${index}`}
            event={event}
            onClose={() => setToastEvents(prev => prev.filter((_, i) => i !== index))}
          />
        ))}

        {/* Event Stream Status */}
        {eventStreamConnected && (
          <div className="fixed bottom-4 right-4 bg-green-100 border border-green-300 rounded-full px-3 py-1 text-xs text-green-700 flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            Live Updates Active
          </div>
        )}
      </div>
    </div>
  );
}
