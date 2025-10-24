import React, { useEffect, useState } from 'react';
import { useWallet } from '../contexts/WalletContext';

interface TierInfo {
  currentTier: {
    name: string;
    multiplier: number;
    fees: any;
  };
  holdings: {
    totalUSD: number;
    realEstate: any;
    staking: any;
    liquidity: any;
    governance?: any;
    basket?: any;
  };
  nextTier: any;
  progressToNext: number;
  amountToNextTier: number;
}

interface PointsData {
  balance: {
    total_points: number;
    available_points: number;
  };
  activeRewards: any[];
}

interface ReferralData {
  referralCode: string;
  networkSize: number;
  totalEarnings: number;
  level1Count: number;
  level2Count: number;
  level3Count: number;
}

export default function AxiomPrimeDashboard() {
  const wallet = useWallet();
  const { address, isConnected } = wallet as any;
  const [loading, setLoading] = useState(true);
  const [tier, setTier] = useState<TierInfo | null>(null);
  const [points, setPoints] = useState<PointsData | null>(null);
  const [referral, setReferral] = useState<ReferralData | null>(null);

  useEffect(() => {
    if (isConnected && address) {
      loadDashboardData();
    }
  }, [address, isConnected]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/axiom-prime/dashboard/${address}`);
      const data = await response.json();

      if (data.success) {
        setTier(data.tier);
        setPoints(data.points);
        setReferral(data.referral);
      }
    } catch (error) {
      console.error('Failed to load dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTierColor = (tierName: string) => {
    switch (tierName) {
      case 'Platinum': return 'from-purple-500 to-pink-500';
      case 'Gold': return 'from-yellow-400 to-orange-500';
      case 'Silver': return 'from-gray-300 to-gray-500';
      default: return 'from-blue-400 to-blue-600';
    }
  };

  const getTierBadge = (tierName: string) => {
    const emojis = { Platinum: '💎', Gold: '🥇', Silver: '🥈', Free: '🆓' };
    return emojis[tierName] || '🆓';
  };

  if (!isConnected) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12 text-center">
        <h1 className="text-4xl font-bold mb-4">Axiom Prime Dashboard</h1>
        <p className="text-gray-600 mb-8">Connect your wallet to view your membership benefits</p>
        <button className="bg-blue-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-blue-700">
          Connect Wallet
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading your Axiom Prime dashboard...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Axiom Prime Dashboard</h1>
        <p className="text-gray-600">Earn More, Pay Less, Own Your Future</p>
      </div>

      {/* Tier Card */}
      {tier && (
        <div className={`bg-gradient-to-r ${getTierColor(tier.currentTier.name)} p-6 rounded-2xl text-white mb-6 shadow-xl`}>
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="text-4xl">{getTierBadge(tier.currentTier.name)}</span>
                <h2 className="text-3xl font-bold">{tier.currentTier.name} Member</h2>
              </div>
              <p className="text-white/90 text-lg">
                {tier.currentTier.multiplier}x Loyalty Multiplier
              </p>
            </div>
            <div className="text-right">
              <p className="text-white/90 text-sm">Total Value Locked</p>
              <p className="text-4xl font-bold">${tier.holdings.totalUSD.toLocaleString()}</p>
            </div>
          </div>

          {/* Progress to Next Tier */}
          {tier.nextTier && (
            <div className="mt-6 bg-white/20 rounded-lg p-4">
              <div className="flex justify-between text-sm mb-2">
                <span>Progress to {tier.nextTier.name}</span>
                <span>{tier.progressToNext.toFixed(1)}%</span>
              </div>
              <div className="w-full bg-white/30 rounded-full h-3">
                <div 
                  className="bg-white h-3 rounded-full transition-all duration-500"
                  style={{ width: `${tier.progressToNext}%` }}
                />
              </div>
              <p className="text-sm mt-2 text-white/80">
                ${tier.amountToNextTier.toLocaleString()} more to unlock {tier.nextTier.name}
              </p>
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {/* Points Card */}
        {points && (
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Axiom Points</h3>
              <span className="text-2xl">⭐</span>
            </div>
            <div className="mb-4">
              <p className="text-3xl font-bold text-blue-600">
                {points.balance.available_points.toLocaleString()}
              </p>
              <p className="text-sm text-gray-600">Available Points</p>
            </div>
            <div className="text-sm text-gray-500">
              <p>Lifetime Earned: {points.balance.total_points.toLocaleString()}</p>
              <p className="mt-1">Active Rewards: {points.activeRewards.length}</p>
            </div>
            <button className="mt-4 w-full bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700">
              Redeem Points
            </button>
          </div>
        )}

        {/* Referral Card */}
        {referral && (
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Referral Network</h3>
              <span className="text-2xl">🤝</span>
            </div>
            <div className="mb-4">
              <p className="text-3xl font-bold text-green-600">
                {referral.networkSize}
              </p>
              <p className="text-sm text-gray-600">Total Network Size</p>
            </div>
            <div className="text-sm text-gray-500 space-y-1">
              <p>Level 1: {referral.level1Count} users</p>
              <p>Level 2: {referral.level2Count} users</p>
              <p>Level 3: {referral.level3Count} users</p>
            </div>
            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-600 mb-1">Your Referral Code</p>
              <p className="font-mono font-bold text-sm">{referral.referralCode}</p>
            </div>
          </div>
        )}

        {/* Earnings Card */}
        {referral && (
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Referral Earnings</h3>
              <span className="text-2xl">💰</span>
            </div>
            <div className="mb-4">
              <p className="text-3xl font-bold text-purple-600">
                ${referral.totalEarnings.toFixed(2)}
              </p>
              <p className="text-sm text-gray-600">Total Earned</p>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Level 1 (10%)</span>
                <span className="font-medium">Active</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Level 2 (5%)</span>
                <span className="font-medium">Active</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Level 3 (2.5%)</span>
                <span className="font-medium">Active</span>
              </div>
            </div>
            <button className="mt-4 w-full bg-purple-600 text-white py-2 rounded-lg font-medium hover:bg-purple-700">
              View Details
            </button>
          </div>
        )}
      </div>

      {/* Holdings Breakdown */}
      {tier && (
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
          <h3 className="text-xl font-bold mb-4">Portfolio Breakdown</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Real Estate</p>
              <p className="text-2xl font-bold text-blue-600">
                ${tier.holdings.realEstate.valueUSD.toLocaleString()}
              </p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Staking</p>
              <p className="text-2xl font-bold text-green-600">
                ${tier.holdings.staking.valueUSD.toLocaleString()}
              </p>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Liquidity</p>
              <p className="text-2xl font-bold text-purple-600">
                ${tier.holdings.liquidity.valueUSD.toLocaleString()}
              </p>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Governance</p>
              <p className="text-2xl font-bold text-orange-600">
                ${tier.holdings.governance?.valueUSD.toLocaleString() || 0}
              </p>
            </div>
            <div className="text-center p-4 bg-pink-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Basket</p>
              <p className="text-2xl font-bold text-pink-600">
                ${tier.holdings.basket?.valueUSD.toLocaleString() || 0}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tier Benefits */}
      {tier && (
        <div className="mt-6 bg-white rounded-xl shadow-lg p-6 border border-gray-200">
          <h3 className="text-xl font-bold mb-4">Your {tier.currentTier.name} Benefits</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
              <span className="text-2xl">📊</span>
              <div>
                <p className="font-semibold">Fee Discounts</p>
                <p className="text-sm text-gray-600">
                  Trading: {(tier.currentTier.fees.trading * 100).toFixed(2)}% | 
                  Real Estate: {(tier.currentTier.fees.realEstate * 100).toFixed(2)}%
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
              <span className="text-2xl">🚀</span>
              <div>
                <p className="font-semibold">Loyalty Multiplier</p>
                <p className="text-sm text-gray-600">
                  All rewards boosted by {tier.currentTier.multiplier}x
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
              <span className="text-2xl">🛡️</span>
              <div>
                <p className="font-semibold">Insurance Coverage</p>
                <p className="text-sm text-gray-600">
                  {tier.currentTier.name === 'Platinum' ? '$250K' : 
                   tier.currentTier.name === 'Gold' ? '$50K' : 
                   tier.currentTier.name === 'Silver' ? '$10K' : 'Basic'}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
              <span className="text-2xl">💬</span>
              <div>
                <p className="font-semibold">Support Level</p>
                <p className="text-sm text-gray-600">
                  {tier.currentTier.name === 'Platinum' ? 'Dedicated Manager' : 
                   tier.currentTier.name === 'Gold' ? 'Priority Queue' : 
                   tier.currentTier.name === 'Silver' ? 'Email + Chat' : 'Email Only'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
