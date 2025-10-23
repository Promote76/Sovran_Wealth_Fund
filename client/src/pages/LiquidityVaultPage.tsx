import React, { useState, useEffect } from 'react';
import { useWallet } from '../contexts/WalletContext';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Input } from '../components/ui/input';
import axios from 'axios';
import ProvideLiquidity from '../components/ProvideLiquidity';

interface VaultStats {
  lpTokenAddress: string;
  totalStaked: string;
  rewardRate: string;
  rewardRatePerDay: string;
  minimumStake: string;
  lockPeriodSeconds: number;
  lockPeriodDays: string;
  contractAddress: string;
  apy: string;
}

interface UserStake {
  amount: string;
  startTime: number;
  lastRewardTime: number;
  stakeDurationDays: string;
  pendingRewards: string;
  isStaking: boolean;
}

interface StakingEvent {
  type: 'stake' | 'unstake' | 'claim';
  user: string;
  amount: string;
  timestamp: number;
  blockNumber: number;
  txHash: string;
}

export default function LiquidityVaultPage() {
  const { isConnected, isLoggedIn, account, connectWallet, isConnecting, loginError } = useWallet();
  const [stats, setStats] = useState<VaultStats | null>(null);
  const [userStake, setUserStake] = useState<UserStake | null>(null);
  const [history, setHistory] = useState<StakingEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [stakeAmount, setStakeAmount] = useState('');
  const [unstakeAmount, setUnstakeAmount] = useState('');

  useEffect(() => {
    loadStats();
    loadHistory();
    const interval = setInterval(() => {
      loadStats();
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (account) {
      loadUserStake();
    }
  }, [account]);

  const loadStats = async () => {
    try {
      const response = await axios.get('/api/liquidity-vault/stats');
      if (response.data.success) {
        setStats(response.data.data);
      }
    } catch (error) {
      console.error('Failed to load stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUserStake = async () => {
    if (!account) return;
    
    try {
      const response = await axios.get(`/api/liquidity-vault/user-stake/${account}`);
      if (response.data.success) {
        setUserStake(response.data.data);
      }
    } catch (error) {
      console.error('Failed to load user stake:', error);
    }
  };

  const loadHistory = async () => {
    try {
      const response = await axios.get('/api/liquidity-vault/history');
      if (response.data.success) {
        setHistory(response.data.data);
      }
    } catch (error) {
      console.error('Failed to load history:', error);
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleString();
  };

  const handleWalletConnect = async () => {
    try {
      await connectWallet();
    } catch (error: any) {
      console.error('❌ Wallet connection failed:', error);
    }
  };

  if (!isConnected || !isLoggedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-xl shadow-lg p-8 text-center">
            <h1 className="text-3xl font-bold text-gray-800 mb-4">
              💎 Liquidity Vault
            </h1>
            <p className="text-gray-600 mb-6">
              Please connect your wallet to access the liquidity staking vault
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

            {/* Educational Content for Non-Connected Users */}
            <div className="mt-12 text-left space-y-6">
              <Card className="border-2 border-blue-200">
                <CardContent className="p-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">
                    💎 What is the Liquidity Vault?
                  </h2>
                  <p className="text-gray-700 mb-4 leading-relaxed">
                    The Liquidity Vault is a <strong>staking platform for liquidity providers</strong>. When you provide liquidity on decentralized exchanges (adding both AXM and BNB to trading pools), you receive LP (Liquidity Provider) tokens. You can stake these LP tokens in the vault to earn additional rewards!
                  </p>
                  <p className="text-gray-700 leading-relaxed">
                    This creates a win-win: liquidity providers get extra income beyond trading fees, and the platform maintains healthy liquidity for smooth trading.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-2 border-green-200">
                <CardContent className="p-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">
                    🎯 How It Works
                  </h3>
                  <div className="space-y-4">
                    <div className="bg-green-50 p-4 rounded-lg">
                      <h4 className="font-semibold text-green-900 mb-2">1️⃣ Provide Liquidity</h4>
                      <p className="text-gray-700 text-sm">
                        First, add liquidity to the AXM trading pair on a DEX (like PancakeSwap). You'll receive LP tokens representing your share of the pool.
                      </p>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg">
                      <h4 className="font-semibold text-green-900 mb-2">2️⃣ Stake LP Tokens</h4>
                      <p className="text-gray-700 text-sm">
                        Deposit your LP tokens into the Liquidity Vault. Your tokens are locked for a set period, during which they earn continuous rewards.
                      </p>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg">
                      <h4 className="font-semibold text-green-900 mb-2">3️⃣ Earn & Claim Rewards</h4>
                      <p className="text-gray-700 text-sm">
                        Watch your rewards accumulate over time! Claim them whenever you want, or let them compound. After the lock period ends, unstake to get your LP tokens back.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-2 border-purple-200">
                <CardContent className="p-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">
                    ✨ Benefits for Liquidity Providers
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-start">
                      <span className="text-purple-600 font-bold mr-3">•</span>
                      <div>
                        <strong className="text-gray-900">Double Income:</strong>
                        <span className="text-gray-700"> Earn trading fees from the DEX PLUS staking rewards from the vault</span>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <span className="text-purple-600 font-bold mr-3">•</span>
                      <div>
                        <strong className="text-gray-900">Transparent APY:</strong>
                        <span className="text-gray-700"> See exactly what your annual percentage yield is before staking</span>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <span className="text-purple-600 font-bold mr-3">•</span>
                      <div>
                        <strong className="text-gray-900">Flexible Claims:</strong>
                        <span className="text-gray-700"> Claim rewards anytime without unstaking your LP tokens</span>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <span className="text-purple-600 font-bold mr-3">•</span>
                      <div>
                        <strong className="text-gray-900">Support the Ecosystem:</strong>
                        <span className="text-gray-700"> Your liquidity helps traders get better prices and lower slippage</span>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <span className="text-purple-600 font-bold mr-3">•</span>
                      <div>
                        <strong className="text-gray-900">Smart Contract Security:</strong>
                        <span className="text-gray-700"> All staking is managed by audited smart contracts, not by individuals</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-2 border-yellow-200 bg-yellow-50">
                <CardContent className="p-6">
                  <h3 className="text-xl font-semibold text-yellow-900 mb-3">
                    ⚠️ Important Information
                  </h3>
                  <div className="space-y-2 text-gray-800">
                    <div className="bg-white p-3 rounded">
                      <strong>Lock Period:</strong>
                      <div className="text-sm mt-1">Your LP tokens are locked for a set period. You can't unstake until this period ends, so plan accordingly!</div>
                    </div>
                    <div className="bg-white p-3 rounded">
                      <strong>Impermanent Loss:</strong>
                      <div className="text-sm mt-1">As with all liquidity provision, price changes can cause impermanent loss. Vault rewards help offset this risk.</div>
                    </div>
                    <div className="bg-white p-3 rounded">
                      <strong>Minimum Stake:</strong>
                      <div className="text-sm mt-1">There's a minimum amount required to stake. This helps maintain vault efficiency and gas cost effectiveness.</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Provide Liquidity Component - Available Without Wallet */}
              <ProvideLiquidity />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (loading || !stats) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading vault data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl shadow-lg p-8 text-white">
          <h1 className="text-4xl font-bold mb-2">💎 Liquidity Vault</h1>
          <p className="text-blue-100 text-lg">
            Stake LP tokens, earn rewards, support the ecosystem
          </p>
        </div>

        {/* Vault Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50">
            <CardContent className="p-6 text-center">
              <div className="text-sm text-gray-600 mb-2">Current APY</div>
              <div className="text-4xl font-bold text-purple-600">{stats.apy}%</div>
              <div className="text-xs text-gray-500 mt-2">Annual Yield</div>
            </CardContent>
          </Card>
          
          <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50">
            <CardContent className="p-6 text-center">
              <div className="text-sm text-gray-600 mb-2">Total Staked</div>
              <div className="text-3xl font-bold text-blue-600">
                {parseFloat(stats.totalStaked).toLocaleString(undefined, {maximumFractionDigits: 2})}
              </div>
              <div className="text-xs text-gray-500 mt-2">LP Tokens</div>
            </CardContent>
          </Card>

          <Card className="border-2 border-green-200 bg-gradient-to-br from-green-50 to-emerald-50">
            <CardContent className="p-6 text-center">
              <div className="text-sm text-gray-600 mb-2">Daily Rewards</div>
              <div className="text-3xl font-bold text-green-600">
                {parseFloat(stats.rewardRatePerDay).toLocaleString(undefined, {maximumFractionDigits: 4})}
              </div>
              <div className="text-xs text-gray-500 mt-2">Tokens/Day</div>
            </CardContent>
          </Card>

          <Card className="border-2 border-orange-200 bg-gradient-to-br from-orange-50 to-yellow-50">
            <CardContent className="p-6 text-center">
              <div className="text-sm text-gray-600 mb-2">Lock Period</div>
              <div className="text-3xl font-bold text-orange-600">{stats.lockPeriodDays}</div>
              <div className="text-xs text-gray-500 mt-2">Days</div>
            </CardContent>
          </Card>
        </div>

        {/* Provide Liquidity Section */}
        <ProvideLiquidity />

        {/* User Stake Info */}
        {userStake && (
          <Card className="border-2 border-indigo-200">
            <CardContent className="p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Your Stake</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-indigo-50 p-4 rounded-lg">
                  <div className="text-sm text-gray-600 mb-1">Staked Amount</div>
                  <div className="text-2xl font-bold text-indigo-600">
                    {parseFloat(userStake.amount).toLocaleString(undefined, {maximumFractionDigits: 4})} LP
                  </div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="text-sm text-gray-600 mb-1">Pending Rewards</div>
                  <div className="text-2xl font-bold text-green-600">
                    {parseFloat(userStake.pendingRewards).toLocaleString(undefined, {maximumFractionDigits: 6})}
                  </div>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="text-sm text-gray-600 mb-1">Stake Duration</div>
                  <div className="text-2xl font-bold text-blue-600">
                    {userStake.stakeDurationDays} days
                  </div>
                </div>
              </div>
              {userStake.isStaking && userStake.startTime > 0 && (
                <div className="mt-4 text-sm text-gray-600">
                  Staking since: {formatDate(userStake.startTime)}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Stake/Unstake Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="border-2 border-green-200">
            <CardContent className="p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">💰 Stake LP Tokens</h3>
              <p className="text-gray-600 text-sm mb-4">
                Deposit your LP tokens to start earning rewards
              </p>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Amount (LP Tokens)
                  </label>
                  <Input
                    type="number"
                    placeholder={`Min: ${stats.minimumStake}`}
                    value={stakeAmount}
                    onChange={(e) => setStakeAmount(e.target.value)}
                    className="text-lg"
                  />
                </div>
                <Button
                  className="w-full bg-green-600 hover:bg-green-700 text-white"
                  disabled={!stakeAmount || parseFloat(stakeAmount) < parseFloat(stats.minimumStake)}
                >
                  Stake LP Tokens
                </Button>
                <div className="text-xs text-gray-500">
                  Minimum stake: {stats.minimumStake} LP tokens
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-orange-200">
            <CardContent className="p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">🔓 Unstake LP Tokens</h3>
              <p className="text-gray-600 text-sm mb-4">
                Withdraw your LP tokens (after lock period)
              </p>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Amount (LP Tokens)
                  </label>
                  <Input
                    type="number"
                    placeholder={userStake ? `Max: ${userStake.amount}` : '0'}
                    value={unstakeAmount}
                    onChange={(e) => setUnstakeAmount(e.target.value)}
                    className="text-lg"
                  />
                </div>
                <Button
                  className="w-full bg-orange-600 hover:bg-orange-700 text-white"
                  disabled={!unstakeAmount || !userStake || parseFloat(unstakeAmount) > parseFloat(userStake.amount)}
                >
                  Unstake LP Tokens
                </Button>
                {userStake && (
                  <div className="text-xs text-gray-500">
                    Your stake: {parseFloat(userStake.amount).toFixed(4)} LP tokens
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Claim Rewards */}
        {userStake && parseFloat(userStake.pendingRewards) > 0 && (
          <Card className="border-2 border-green-200 bg-green-50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">🎁 Claim Rewards</h3>
                  <p className="text-gray-600">
                    You have {parseFloat(userStake.pendingRewards).toFixed(6)} tokens ready to claim!
                  </p>
                </div>
                <Button className="bg-green-600 hover:bg-green-700 text-white">
                  Claim Rewards
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Staking History */}
        {history.length > 0 && (
          <Card className="border-2 border-gray-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-gray-900">📜 Recent Staking Activity</h2>
                <Button
                  onClick={loadHistory}
                  className="bg-blue-600 hover:bg-blue-700 text-white text-sm"
                >
                  Refresh
                </Button>
              </div>
              <div className="space-y-3">
                {history.slice(0, 20).map((event, index) => {
                  const eventColors = {
                    stake: { bg: 'bg-green-50', text: 'text-green-800', icon: '⬆️', label: 'Stake' },
                    unstake: { bg: 'bg-orange-50', text: 'text-orange-800', icon: '⬇️', label: 'Unstake' },
                    claim: { bg: 'bg-purple-50', text: 'text-purple-800', icon: '🎁', label: 'Claim' }
                  };
                  const style = eventColors[event.type];

                  return (
                    <div key={index} className={`${style.bg} p-4 rounded-lg flex justify-between items-center`}>
                      <div>
                        <div className={`font-medium ${style.text} mb-1`}>
                          {style.icon} {style.label} - {parseFloat(event.amount).toLocaleString(undefined, {maximumFractionDigits: 4})} LP
                        </div>
                        <div className="text-sm text-gray-600">
                          {formatDate(event.timestamp)}
                        </div>
                        <div className="text-xs text-gray-500 font-mono mt-1">
                          User: {event.user.substring(0, 10)}...{event.user.substring(event.user.length - 8)}
                        </div>
                      </div>
                      <a
                        href={`https://bscscan.com/tx/${event.txHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-700 text-sm"
                      >
                        View TX →
                      </a>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Contract Info */}
        <Card className="border-2 border-gray-200 bg-gray-50">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Vault Contract</h3>
                <div className="font-mono text-sm text-gray-600 break-all">
                  {stats.contractAddress}
                </div>
                <a
                  href={`https://bscscan.com/address/${stats.contractAddress}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-700 text-sm mt-1 inline-block"
                >
                  View on BSCScan →
                </a>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">LP Token</h3>
                <div className="font-mono text-sm text-gray-600 break-all">
                  {stats.lpTokenAddress}
                </div>
                <a
                  href={`https://bscscan.com/address/${stats.lpTokenAddress}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-700 text-sm mt-1 inline-block"
                >
                  View on BSCScan →
                </a>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
