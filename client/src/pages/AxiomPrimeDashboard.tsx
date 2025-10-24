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
  const { account, isConnected } = wallet as any;
  const [loading, setLoading] = useState(false);
  const [tier, setTier] = useState<TierInfo | null>(null);
  const [points, setPoints] = useState<PointsData | null>(null);
  const [referral, setReferral] = useState<ReferralData | null>(null);

  useEffect(() => {
    if (isConnected && account) {
      loadDashboardData();
    } else {
      setLoading(false);
    }
  }, [account, isConnected]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/axiom-prime/dashboard/${account}`);
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
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-12">
          {/* Hero Section */}
          <div className="text-center mb-8 sm:mb-16">
            <div className="text-4xl sm:text-6xl mb-4">💎</div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent px-2">
              Axiom Prime Membership
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-gray-700 mb-6 sm:mb-8 max-w-3xl mx-auto px-4">
              Earn More, Pay Less, Own Your Future. Join our tiered membership program to unlock 
              loyalty multipliers up to 1.6x, fee discounts up to 50%, and passive income through referrals.
            </p>
            <button 
              onClick={() => (wallet as any)?.connectWallet?.()}
              className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 sm:px-10 py-3 sm:py-4 rounded-xl font-bold text-base sm:text-lg hover:from-purple-700 hover:to-pink-700 shadow-xl transform hover:scale-105 transition-all"
            >
              Connect Wallet to Get Started
            </button>
          </div>

          {/* Tier Comparison Grid */}
          <div className="mb-8 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl font-bold text-center mb-6 sm:mb-8">Choose Your Tier</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {[
                { name: 'Free', emoji: '🆓', tvl: '$0-4,999', multiplier: '1.0x', fees: '2.0%', bg: 'bg-gray-100', border: 'border-gray-300' },
                { name: 'Silver', emoji: '🥈', tvl: '$5K-24K', multiplier: '1.2x', fees: '1.5%', bg: 'bg-gradient-to-br from-gray-100 to-gray-200', border: 'border-gray-400' },
                { name: 'Gold', emoji: '🥇', tvl: '$25K-99K', multiplier: '1.4x', fees: '1.0%', bg: 'bg-gradient-to-br from-yellow-100 to-orange-100', border: 'border-yellow-500' },
                { name: 'Platinum', emoji: '💎', tvl: '$100K+', multiplier: '1.6x', fees: '0.4%', bg: 'bg-gradient-to-br from-purple-100 to-pink-100', border: 'border-purple-500', highlight: true }
              ].map((tier) => (
                <div 
                  key={tier.name}
                  className={`${tier.bg} border-2 ${tier.border} rounded-2xl p-4 sm:p-6 ${tier.highlight ? 'shadow-2xl lg:scale-105' : 'shadow-lg'} transform hover:scale-105 transition-all`}
                >
                  <div className="text-4xl sm:text-5xl text-center mb-3">{tier.emoji}</div>
                  <h3 className="text-xl sm:text-2xl font-bold text-center mb-2">{tier.name}</h3>
                  <p className="text-center text-gray-700 font-semibold mb-4 text-sm sm:text-base">{tier.tvl}</p>
                  <div className="space-y-2 text-xs sm:text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Multiplier:</span>
                      <span className="font-bold text-purple-600">{tier.multiplier}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Platform Fees:</span>
                      <span className="font-bold text-green-600">{tier.fees}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8 mb-8 sm:mb-16">
            <div className="bg-white rounded-xl p-6 sm:p-8 shadow-lg border border-purple-200">
              <div className="text-3xl sm:text-4xl mb-4">⚡</div>
              <h3 className="text-xl sm:text-2xl font-bold mb-3">Loyalty Multipliers</h3>
              <p className="text-gray-700">
                Earn up to 1.6x more rewards on staking, real estate investments, and liquidity provision. 
                Your tier automatically adjusts based on Total Value Locked (TVL).
              </p>
            </div>
            <div className="bg-white rounded-xl p-6 sm:p-8 shadow-lg border border-purple-200">
              <div className="text-3xl sm:text-4xl mb-4">💰</div>
              <h3 className="text-xl sm:text-2xl font-bold mb-3">Fee Discounts</h3>
              <p className="text-gray-700">
                Save up to 50% on platform fees. Platinum members pay just 0.4% compared to the base 2.0% fee, 
                saving thousands on large transactions.
              </p>
            </div>
            <div className="bg-white rounded-xl p-6 sm:p-8 shadow-lg border border-purple-200">
              <div className="text-3xl sm:text-4xl mb-4">🎁</div>
              <h3 className="text-xl sm:text-2xl font-bold mb-3">Axiom Points Rewards</h3>
              <p className="text-gray-700">
                Earn points on every transaction, stake, and referral. Redeem for fee rebates, NFT rewards, 
                governance power, and exclusive merchandise.
              </p>
            </div>
            <div className="bg-white rounded-xl p-6 sm:p-8 shadow-lg border border-purple-200">
              <div className="text-3xl sm:text-4xl mb-4">🔗</div>
              <h3 className="text-xl sm:text-2xl font-bold mb-3">3-Level Referral System</h3>
              <p className="text-gray-700">
                Earn 5% commission on direct referrals, 2% on their referrals, and 1% on the third level. 
                Build your network and earn passive income forever.
              </p>
            </div>
            <div className="bg-white rounded-xl p-6 sm:p-8 shadow-lg border border-purple-200">
              <div className="text-3xl sm:text-4xl mb-4">🛡️</div>
              <h3 className="text-xl sm:text-2xl font-bold mb-3">Premium Benefits</h3>
              <p className="text-gray-700">
                Priority support, smart contract insurance, early access to new features, exclusive airdrops, 
                and VIP access to platform governance.
              </p>
            </div>
            <div className="bg-white rounded-xl p-6 sm:p-8 shadow-lg border border-purple-200">
              <div className="text-3xl sm:text-4xl mb-4">📊</div>
              <h3 className="text-xl sm:text-2xl font-bold mb-3">Transparent Tracking</h3>
              <p className="text-gray-700">
                Real-time dashboard showing your tier status, TVL across all contracts, points balance, 
                referral network size, and projected earnings.
              </p>
            </div>
          </div>

          {/* CTA Section */}
          <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl p-6 sm:p-8 md:p-12 text-white text-center shadow-2xl">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4">Ready to Unlock Premium Benefits?</h2>
            <p className="text-base sm:text-lg md:text-xl mb-6 sm:mb-8 opacity-90 px-2">
              Connect your wallet to view your current tier, start earning points, and get your unique referral code.
            </p>
            <button 
              onClick={() => (wallet as any)?.connectWallet?.()}
              className="bg-white text-purple-600 px-8 sm:px-12 py-3 sm:py-4 rounded-xl font-bold text-base sm:text-lg hover:bg-gray-100 shadow-xl transform hover:scale-105 transition-all"
            >
              Connect Wallet Now →
            </button>
          </div>
        </div>
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2">Axiom Prime Dashboard</h1>
        <p className="text-sm sm:text-base text-gray-600">Earn More, Pay Less, Own Your Future</p>
      </div>

      {/* Tier Card */}
      {tier && (
        <div className={`bg-gradient-to-r ${getTierColor(tier.currentTier.name)} p-4 sm:p-6 rounded-2xl text-white mb-6 shadow-xl`}>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 sm:gap-3 mb-2">
                <span className="text-3xl sm:text-4xl">{getTierBadge(tier.currentTier.name)}</span>
                <h2 className="text-2xl sm:text-3xl font-bold">{tier.currentTier.name} Member</h2>
              </div>
              <p className="text-white/90 text-base sm:text-lg">
                {tier.currentTier.multiplier}x Loyalty Multiplier
              </p>
            </div>
            <div className="text-left sm:text-right">
              <p className="text-white/90 text-xs sm:text-sm">Total Value Locked</p>
              <p className="text-3xl sm:text-4xl font-bold">${tier.holdings.totalUSD.toLocaleString()}</p>
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

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6">
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
        <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 border border-gray-200">
          <h3 className="text-lg sm:text-xl font-bold mb-4">Portfolio Breakdown</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
            <div className="text-center p-3 sm:p-4 bg-blue-50 rounded-lg">
              <p className="text-xs sm:text-sm text-gray-600 mb-1">Real Estate</p>
              <p className="text-lg sm:text-2xl font-bold text-blue-600">
                ${tier.holdings.realEstate.valueUSD.toLocaleString()}
              </p>
            </div>
            <div className="text-center p-3 sm:p-4 bg-green-50 rounded-lg">
              <p className="text-xs sm:text-sm text-gray-600 mb-1">Staking</p>
              <p className="text-lg sm:text-2xl font-bold text-green-600">
                ${tier.holdings.staking.valueUSD.toLocaleString()}
              </p>
            </div>
            <div className="text-center p-3 sm:p-4 bg-purple-50 rounded-lg">
              <p className="text-xs sm:text-sm text-gray-600 mb-1">Liquidity</p>
              <p className="text-lg sm:text-2xl font-bold text-purple-600">
                ${tier.holdings.liquidity.valueUSD.toLocaleString()}
              </p>
            </div>
            <div className="text-center p-3 sm:p-4 bg-orange-50 rounded-lg">
              <p className="text-xs sm:text-sm text-gray-600 mb-1">Governance</p>
              <p className="text-lg sm:text-2xl font-bold text-orange-600">
                ${tier.holdings.governance?.valueUSD.toLocaleString() || 0}
              </p>
            </div>
            <div className="text-center p-3 sm:p-4 bg-pink-50 rounded-lg">
              <p className="text-xs sm:text-sm text-gray-600 mb-1">Basket</p>
              <p className="text-lg sm:text-2xl font-bold text-pink-600">
                ${tier.holdings.basket?.valueUSD.toLocaleString() || 0}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tier Benefits */}
      {tier && (
        <div className="mt-6 bg-white rounded-xl shadow-lg p-4 sm:p-6 border border-gray-200">
          <h3 className="text-lg sm:text-xl font-bold mb-4">Your {tier.currentTier.name} Benefits</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
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
