import React, { useState, useEffect } from 'react';
import { useWallet } from '../hooks/useWallet';
import { stakingService, StakingData } from '../services/stakingService';
import { WalletConnect } from '../components/web3/wallet-connect';

const EnhancedStakingPage: React.FC = () => {
  const { isConnected, address, balance, connectWallet, isLoading } = useWallet();
  const [stakingData, setStakingData] = useState<StakingData>({
    totalStaked: '0',
    totalRewards: '0',
    currentAPY: '12.5',
    pendingRewards: '0',
    totalStakers: 0
  });
  const [userStaking, setUserStaking] = useState({ userStakeAmount: '0', userRewards: '0' });

  useEffect(() => {
    fetchStakingData();
  }, []);

  useEffect(() => {
    if (isConnected && address) {
      fetchUserStaking();
    }
  }, [isConnected, address]);

  const fetchStakingData = async () => {
    const data = await stakingService.getStakingSummary();
    setStakingData(data);
  };

  const fetchUserStaking = async () => {
    if (address) {
      const data = await stakingService.getUserStaking(address);
      setUserStaking({
        userStakeAmount: data.userStakeAmount || '0',
        userRewards: data.userRewards || '0'
      });
    }
  };

  return (
    <div className="bg-gradient-to-br from-white via-blue-50 to-white min-h-screen">

      {/* Hero Section */}
      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-6 text-blue-800">
            Enhanced <span className="text-blue-600">Staking</span>
          </h1>
          <p className="text-xl text-gray-700 max-w-3xl mx-auto">
            Stake your SWF tokens and earn competitive returns with flexible lock periods, 
            compound interest, and secure smart contracts on BSC.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          <div className="bg-gradient-to-br from-white to-blue-50 border-2 border-blue-400 rounded-xl p-6 shadow-lg">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">{stakingData.currentAPY}%</div>
              <div className="text-gray-700">Current APY</div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-white to-blue-50 border-2 border-blue-400 rounded-xl p-6 shadow-lg">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">{stakingData.totalStaked}</div>
              <div className="text-gray-700">Total Staked</div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-white to-blue-50 border-2 border-blue-400 rounded-xl p-6 shadow-lg">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">{stakingData.pendingRewards}</div>
              <div className="text-gray-700">Pending Rewards</div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-white to-blue-50 border-2 border-blue-400 rounded-xl p-6 shadow-lg">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">{stakingData.totalStakers}</div>
              <div className="text-gray-700">Total Stakers</div>
            </div>
          </div>
        </div>

        {/* Staking Interface */}
        <div className="max-w-2xl mx-auto">
          <div className="bg-gradient-to-br from-white to-blue-50 border-2 border-blue-500 rounded-xl p-8 shadow-lg">
            <h2 className="text-2xl font-bold mb-6 text-center text-blue-800">Stake SWF Tokens</h2>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-blue-700 mb-2">
                  Amount to Stake
                </label>
                <input
                  type="number"
                  placeholder="Enter SWF amount"
                  className="w-full px-4 py-3 bg-white border-2 border-blue-300 rounded-lg text-gray-800 placeholder-gray-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-blue-700 mb-2">
                  Lock Period
                </label>
                <select className="w-full px-4 py-3 bg-white border-2 border-blue-300 rounded-lg text-gray-800 focus:outline-none focus:border-blue-500">
                  <option value="30">30 Days - 8% APY</option>
                  <option value="90">90 Days - 12% APY</option>
                  <option value="180">180 Days - 15% APY</option>
                  <option value="365">365 Days - 20% APY</option>
                </select>
              </div>

              {isConnected ? (
                <button 
                  className="w-full px-6 py-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold rounded-lg transition-all duration-200 hover:scale-105 shadow-lg"
                >
                  Stake Tokens
                </button>
              ) : (
                <div className="staking-wallet-connect">
                  <p className="text-sm text-gray-600 text-center">Wallet connection has been disabled.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-500 bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🔒</span>
            </div>
            <h3 className="text-lg font-semibold mb-2 text-blue-800">Secure Staking</h3>
            <p className="text-gray-700">Smart contract audited for maximum security</p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-500 bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">💰</span>
            </div>
            <h3 className="text-lg font-semibold mb-2 text-blue-800">High Returns</h3>
            <p className="text-gray-700">Competitive APY rates up to 20%</p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-500 bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">⏰</span>
            </div>
            <h3 className="text-lg font-semibold mb-2 text-blue-800">Flexible Terms</h3>
            <p className="text-gray-700">Choose from 30 to 365 day lock periods</p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-500 bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">📈</span>
            </div>
            <h3 className="text-lg font-semibold mb-2 text-blue-800">Compound Interest</h3>
            <p className="text-gray-700">Automatic compounding for maximum growth</p>
          </div>
        </div>
      </div>
      </div>
  );
};

export default EnhancedStakingPage;