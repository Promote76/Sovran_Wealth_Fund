import React, { useState, useEffect } from 'react';
import { useWallet } from '../contexts/WalletContext';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Input } from '../components/ui/input';
import axios from 'axios';
import ProvideLiquidity from '../components/ProvideLiquidity';
import { ethers } from 'ethers';
import { CONTRACTS, ERC20_ABI } from '../config/contracts';
import LiquidityRewardsVaultABI from '../abis/LiquidityRewardsVault.json';

interface VaultInfo {
  lpToken: string;
  vaultAddress: string;
  totalStaked: string;
  rewardRate: string;
  rewardRatePerDay: string;
  minimumStake: string;
  lockPeriodDays: string;
  apy: string;
}

interface UserStakeInfo {
  vaultAddress: string;
  lpToken: string;
  amount: string;
  startTime: number;
  lastClaimTime: number;
  stakeDurationDays: string;
  pendingRewards: string;
  isStaking: boolean;
  canWithdraw: boolean;
  apy: string;
  totalStaked: string;
}

export default function LiquidityVaultPage() {
  const { isConnected, isLoggedIn, account, connectWallet, disconnectWallet, isConnecting, loginError } = useWallet();
  
  // Multi-vault state
  const [allVaults, setAllVaults] = useState<VaultInfo[]>([]);
  const [selectedVault, setSelectedVault] = useState<VaultInfo | null>(null);
  const [userStakes, setUserStakes] = useState<UserStakeInfo[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Transaction state
  const [stakeAmount, setStakeAmount] = useState('');
  const [unstakeAmount, setUnstakeAmount] = useState('');
  const [isStaking, setIsStaking] = useState(false);
  const [isUnstaking, setIsUnstaking] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [txMessage, setTxMessage] = useState('');
  const [txError, setTxError] = useState('');
  const [lpBalance, setLpBalance] = useState('0');
  const [allowance, setAllowance] = useState('0');

  useEffect(() => {
    loadAllVaults();
    const interval = setInterval(() => {
      loadAllVaults();
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (account) {
      loadUserStakes();
    }
  }, [account]);

  useEffect(() => {
    if (account && selectedVault) {
      loadLPBalance();
    }
  }, [account, selectedVault]);

  const loadAllVaults = async () => {
    try {
      const response = await axios.get('/api/liquidity-vault/factory/all-vaults');
      if (response.data.success) {
        const vaults = response.data.data;
        setAllVaults(vaults);
        
        // Auto-select first vault if none selected
        if (!selectedVault && vaults.length > 0) {
          setSelectedVault(vaults[0]);
        }
      }
    } catch (error) {
      console.error('Failed to load vaults:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUserStakes = async () => {
    if (!account) return;
    
    try {
      const response = await axios.get(`/api/liquidity-vault/factory/user-stakes/${account}`);
      if (response.data.success) {
        setUserStakes(response.data.data);
      }
    } catch (error) {
      console.error('Failed to load user stakes:', error);
    }
  };

  const loadLPBalance = async () => {
    if (!account || !selectedVault) return;

    try {
      const signer = await getSigner();
      const lpTokenContract = new ethers.Contract(selectedVault.lpToken, ERC20_ABI, signer);
      
      const balance = await lpTokenContract.balanceOf(account);
      setLpBalance(ethers.utils.formatEther(balance));

      const vaultAddress = ethers.utils.getAddress(selectedVault.vaultAddress);
      const allowed = await lpTokenContract.allowance(account, vaultAddress);
      setAllowance(allowed.toString());
    } catch (error) {
      console.error('Failed to load LP balance:', error);
    }
  };

  const getSigner = async () => {
    if (!window.ethereum) {
      throw new Error('No Web3 provider found');
    }
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    return provider.getSigner();
  };

  const handleSelectVault = (vault: VaultInfo) => {
    setSelectedVault(vault);
    setStakeAmount('');
    setUnstakeAmount('');
    setTxMessage('');
    setTxError('');
  };

  const handleApprove = async () => {
    if (!account || !selectedVault) return;

    setIsApproving(true);
    setTxError('');
    setTxMessage('');

    try {
      const signer = await getSigner();
      const lpTokenContract = new ethers.Contract(selectedVault.lpToken, ERC20_ABI, signer);
      const vaultAddress = ethers.utils.getAddress(selectedVault.vaultAddress);

      const maxAmount = ethers.constants.MaxUint256;
      const tx = await lpTokenContract.approve(vaultAddress, maxAmount);
      
      setTxMessage('⏳ Approval transaction submitted... waiting for confirmation');
      await tx.wait();
      
      setTxMessage('✅ LP tokens approved successfully!');
      await loadLPBalance();
      setTimeout(() => setTxMessage(''), 5000);
    } catch (error: any) {
      console.error('Approval error:', error);
      setTxError(`Failed to approve: ${error?.message || 'Unknown error'}`);
    } finally {
      setIsApproving(false);
    }
  };

  const handleStake = async () => {
    if (!account || !selectedVault || !stakeAmount) return;

    setIsStaking(true);
    setTxError('');
    setTxMessage('');

    try {
      const signer = await getSigner();
      const vaultAddress = ethers.utils.getAddress(selectedVault.vaultAddress);
      const vaultContract = new ethers.Contract(vaultAddress, LiquidityRewardsVaultABI.abi, signer);

      const amount = ethers.utils.parseEther(stakeAmount);

      if (ethers.BigNumber.from(allowance).lt(amount)) {
        setTxError('Insufficient allowance. Please approve LP tokens first.');
        return;
      }

      const tx = await vaultContract.stake(amount);
      setTxMessage('⏳ Staking transaction submitted... waiting for confirmation');
      
      await tx.wait();
      setTxMessage('✅ LP tokens staked successfully!');
      
      await Promise.all([loadUserStakes(), loadAllVaults(), loadLPBalance()]);
      setStakeAmount('');
      setTimeout(() => setTxMessage(''), 5000);
    } catch (error: any) {
      console.error('Stake error:', error);
      let errorMessage = error?.message || 'Unknown error';
      
      if (errorMessage.toLowerCase().includes('user rejected') || errorMessage.toLowerCase().includes('user denied')) {
        errorMessage = 'Transaction was cancelled.';
      } else if (errorMessage.toLowerCase().includes('insufficient')) {
        errorMessage = 'Insufficient LP token balance.';
      }
      
      setTxError(`Failed to stake: ${errorMessage}`);
    } finally {
      setIsStaking(false);
    }
  };

  const handleUnstake = async () => {
    if (!account || !selectedVault || !unstakeAmount) return;

    setIsUnstaking(true);
    setTxError('');
    setTxMessage('');

    try {
      const signer = await getSigner();
      const vaultAddress = ethers.utils.getAddress(selectedVault.vaultAddress);
      const vaultContract = new ethers.Contract(vaultAddress, LiquidityRewardsVaultABI.abi, signer);

      const amount = ethers.utils.parseEther(unstakeAmount);

      const tx = await vaultContract.withdraw(amount);
      setTxMessage('⏳ Unstaking transaction submitted... waiting for confirmation');
      
      await tx.wait();
      setTxMessage('✅ LP tokens unstaked successfully!');
      
      await Promise.all([loadUserStakes(), loadAllVaults(), loadLPBalance()]);
      setUnstakeAmount('');
      setTimeout(() => setTxMessage(''), 5000);
    } catch (error: any) {
      console.error('Unstake error:', error);
      let errorMessage = error?.message || 'Unknown error';
      
      if (errorMessage.toLowerCase().includes('user rejected') || errorMessage.toLowerCase().includes('user denied')) {
        errorMessage = 'Transaction was cancelled.';
      } else if (errorMessage.toLowerCase().includes('lock period')) {
        errorMessage = 'Cannot unstake yet. Lock period has not ended.';
      } else if (errorMessage.toLowerCase().includes('insufficient')) {
        errorMessage = 'Insufficient staked balance.';
      }
      
      setTxError(`Failed to unstake: ${errorMessage}`);
    } finally {
      setIsUnstaking(false);
    }
  };

  const handleClaimRewards = async () => {
    if (!account || !selectedVault) return;

    setIsClaiming(true);
    setTxError('');
    setTxMessage('');

    try {
      const signer = await getSigner();
      const vaultAddress = ethers.utils.getAddress(selectedVault.vaultAddress);
      const vaultContract = new ethers.Contract(vaultAddress, LiquidityRewardsVaultABI.abi, signer);

      const tx = await vaultContract.claimRewards();
      setTxMessage('⏳ Claiming rewards... waiting for confirmation');
      
      await tx.wait();
      setTxMessage('✅ Rewards claimed successfully!');
      
      await Promise.all([loadUserStakes(), loadAllVaults()]);
      setTimeout(() => setTxMessage(''), 5000);
    } catch (error: any) {
      console.error('Claim error:', error);
      setTxError(`Failed to claim rewards: ${error?.message || 'Unknown error'}`);
    } finally {
      setIsClaiming(false);
    }
  };

  const handleWalletConnect = async () => {
    try {
      await connectWallet();
    } catch (error: any) {
      console.error('❌ Wallet connection failed:', error);
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleString();
  };

  const getLPPairName = (lpToken: string) => {
    const knownPairs: {[key: string]: string} = {
      '0x3aA970cD91f792427CF28Bc687B4713Ee26e2090': 'SWF-WBNB',
    };
    return knownPairs[lpToken] || `LP Token ${lpToken.substring(0, 8)}...`;
  };

  const getCurrentUserStake = () => {
    if (!selectedVault || !userStakes.length) return null;
    return userStakes.find(s => s.vaultAddress.toLowerCase() === selectedVault.vaultAddress.toLowerCase());
  };

  const currentStake = getCurrentUserStake();

  if (!isConnected || !isLoggedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-xl shadow-lg p-8 text-center">
            <h1 className="text-3xl font-bold text-gray-800 mb-4">
              💎 Liquidity Vaults
            </h1>
            <p className="text-gray-600 mb-6">
              Please connect your wallet to access the liquidity staking vaults
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

            <div className="mt-12 text-left space-y-6">
              <Card className="border-2 border-blue-200">
                <CardContent className="p-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">
                    💎 What are Liquidity Vaults?
                  </h2>
                  <p className="text-gray-700 mb-4 leading-relaxed">
                    Liquidity Vaults are <strong>staking platforms for multiple LP token pairs</strong>. When you provide liquidity on decentralized exchanges, you receive LP tokens. Stake these in our vaults to earn additional rewards with customized APYs for each pair!
                  </p>
                  <p className="text-gray-700 leading-relaxed">
                    Each vault supports a different LP pair with its own reward rate and lock period, giving you flexibility to choose the best option for your strategy.
                  </p>
                </CardContent>
              </Card>

              <ProvideLiquidity />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading vaults...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl shadow-lg p-8 text-white">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-4xl font-bold mb-2">💎 Liquidity Vaults</h1>
              <p className="text-blue-100 text-lg">
                Stake LP tokens across multiple pairs, earn customized rewards
              </p>
            </div>
            <div className="flex flex-col items-end space-y-2">
              <div className="bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2 border border-white/20">
                <div className="text-xs text-blue-100 mb-1">Connected Wallet</div>
                <div className="font-mono text-sm font-semibold">
                  {account?.slice(0, 6)}...{account?.slice(-4)}
                </div>
              </div>
              <button
                onClick={disconnectWallet}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-sm font-medium rounded-lg transition-colors shadow-lg hover:shadow-xl"
              >
                🔌 Disconnect Wallet
              </button>
            </div>
          </div>
        </div>

        {/* All Available Vaults */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">🏦 Available Vaults ({allVaults.length})</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {allVaults.map((vault) => {
              const isSelected = selectedVault?.vaultAddress === vault.vaultAddress;
              const userStake = userStakes.find(s => s.vaultAddress.toLowerCase() === vault.vaultAddress.toLowerCase());
              
              return (
                <Card 
                  key={vault.vaultAddress}
                  className={`cursor-pointer transition-all ${
                    isSelected 
                      ? 'border-4 border-purple-500 shadow-xl scale-105' 
                      : 'border-2 border-gray-200 hover:border-purple-300 hover:shadow-lg'
                  }`}
                  onClick={() => handleSelectVault(vault)}
                >
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-xl font-bold text-gray-900">
                        {getLPPairName(vault.lpToken)}
                      </h3>
                      {isSelected && <span className="text-purple-600 font-bold">✓ Selected</span>}
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">APY:</span>
                        <span className="font-bold text-purple-600 text-lg">{vault.apy}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Total Staked:</span>
                        <span className="font-semibold text-gray-900">{parseFloat(vault.totalStaked).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Lock Period:</span>
                        <span className="font-semibold text-gray-900">{vault.lockPeriodDays} days</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Min Stake:</span>
                        <span className="font-semibold text-gray-900">{vault.minimumStake} LP</span>
                      </div>
                      
                      {userStake && userStake.isStaking && (
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <div className="bg-green-50 p-2 rounded text-center">
                            <div className="text-xs text-gray-600">Your Stake</div>
                            <div className="font-bold text-green-600">{parseFloat(userStake.amount).toFixed(4)} LP</div>
                            <div className="text-xs text-green-700 mt-1">Rewards: {parseFloat(userStake.pendingRewards).toFixed(6)}</div>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* User's Portfolio Across All Vaults */}
        {userStakes.length > 0 && userStakes.some(s => s.isStaking) && (
          <Card className="border-2 border-indigo-200">
            <CardContent className="p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">📊 Your Portfolio</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {userStakes.filter(s => s.isStaking).map((stake) => (
                  <div key={stake.vaultAddress} className="bg-gradient-to-br from-indigo-50 to-purple-50 p-4 rounded-lg border-2 border-indigo-200">
                    <div className="font-semibold text-indigo-900 mb-2">{getLPPairName(stake.lpToken)}</div>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Staked:</span>
                        <span className="font-bold text-indigo-600">{parseFloat(stake.amount).toFixed(4)} LP</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Pending:</span>
                        <span className="font-bold text-green-600">{parseFloat(stake.pendingRewards).toFixed(6)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">APY:</span>
                        <span className="font-bold text-purple-600">{stake.apy}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Duration:</span>
                        <span className="font-semibold">{stake.stakeDurationDays} days</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {!selectedVault && (
          <Card className="border-2 border-yellow-200 bg-yellow-50">
            <CardContent className="p-6 text-center">
              <p className="text-yellow-800 font-medium">
                ⬆️ Select a vault above to start staking
              </p>
            </CardContent>
          </Card>
        )}

        {selectedVault && (
          <>
            {/* Selected Vault Stats */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">📈 {getLPPairName(selectedVault.lpToken)} Vault</h2>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50">
                  <CardContent className="p-6 text-center">
                    <div className="text-sm text-gray-600 mb-2">Current APY</div>
                    <div className="text-4xl font-bold text-purple-600">{selectedVault.apy}%</div>
                    <div className="text-xs text-gray-500 mt-2">Annual Yield</div>
                  </CardContent>
                </Card>
                
                <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50">
                  <CardContent className="p-6 text-center">
                    <div className="text-sm text-gray-600 mb-2">Total Staked</div>
                    <div className="text-3xl font-bold text-blue-600">
                      {parseFloat(selectedVault.totalStaked).toLocaleString(undefined, {maximumFractionDigits: 2})}
                    </div>
                    <div className="text-xs text-gray-500 mt-2">LP Tokens</div>
                  </CardContent>
                </Card>

                <Card className="border-2 border-green-200 bg-gradient-to-br from-green-50 to-emerald-50">
                  <CardContent className="p-6 text-center">
                    <div className="text-sm text-gray-600 mb-2">Daily Rewards</div>
                    <div className="text-3xl font-bold text-green-600">
                      {parseFloat(selectedVault.rewardRatePerDay).toLocaleString(undefined, {maximumFractionDigits: 4})}
                    </div>
                    <div className="text-xs text-gray-500 mt-2">Tokens/Day</div>
                  </CardContent>
                </Card>

                <Card className="border-2 border-orange-200 bg-gradient-to-br from-orange-50 to-yellow-50">
                  <CardContent className="p-6 text-center">
                    <div className="text-sm text-gray-600 mb-2">Lock Period</div>
                    <div className="text-3xl font-bold text-orange-600">{selectedVault.lockPeriodDays}</div>
                    <div className="text-xs text-gray-500 mt-2">Days</div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Provide Liquidity Section */}
            <ProvideLiquidity />

            {/* Transaction Messages */}
            {txMessage && (
              <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4">
                <div className="text-green-800 font-medium">{txMessage}</div>
              </div>
            )}
            {txError && (
              <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4">
                <div className="text-red-800 font-medium">{txError}</div>
              </div>
            )}

            {/* Stake/Unstake Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="border-2 border-green-200">
                <CardContent className="p-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">💰 Stake LP Tokens</h3>
                  <p className="text-gray-600 text-sm mb-4">
                    Deposit your {getLPPairName(selectedVault.lpToken)} LP tokens to earn {selectedVault.apy}% APY
                  </p>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Amount (LP Tokens)
                      </label>
                      <Input
                        type="number"
                        placeholder={`Min: ${selectedVault.minimumStake}`}
                        value={stakeAmount}
                        onChange={(e) => setStakeAmount(e.target.value)}
                        className="text-lg"
                      />
                      <div className="mt-2 text-xs text-gray-600">
                        Your LP balance: {parseFloat(lpBalance).toFixed(4)} LP tokens
                      </div>
                    </div>
                    
                    {stakeAmount && parseFloat(stakeAmount) > 0 && ethers.BigNumber.from(allowance).lt(ethers.utils.parseEther(stakeAmount || '0')) && (
                      <Button
                        onClick={handleApprove}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                        disabled={isApproving}
                      >
                        {isApproving ? '⏳ Approving...' : '✅ Approve LP Tokens'}
                      </Button>
                    )}
                    
                    <Button
                      onClick={handleStake}
                      className="w-full bg-green-600 hover:bg-green-700 text-white"
                      disabled={!stakeAmount || parseFloat(stakeAmount) < parseFloat(selectedVault.minimumStake) || isStaking || ethers.BigNumber.from(allowance).lt(ethers.utils.parseEther(stakeAmount || '0'))}
                    >
                      {isStaking ? '⏳ Staking...' : 'Stake LP Tokens'}
                    </Button>
                    <div className="text-xs text-gray-500">
                      Minimum stake: {selectedVault.minimumStake} LP tokens
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
                        placeholder={currentStake ? `Max: ${currentStake.amount}` : '0'}
                        value={unstakeAmount}
                        onChange={(e) => setUnstakeAmount(e.target.value)}
                        className="text-lg"
                      />
                    </div>
                    <Button
                      onClick={handleUnstake}
                      className="w-full bg-orange-600 hover:bg-orange-700 text-white"
                      disabled={!unstakeAmount || !currentStake || parseFloat(unstakeAmount) > parseFloat(currentStake.amount) || isUnstaking}
                    >
                      {isUnstaking ? '⏳ Unstaking...' : 'Unstake LP Tokens'}
                    </Button>
                    {currentStake && (
                      <div className="text-xs text-gray-500">
                        Your stake: {parseFloat(currentStake.amount).toFixed(4)} LP tokens
                        {!currentStake.canWithdraw && <div className="text-orange-600 mt-1">⏳ Lock period active</div>}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Claim Rewards */}
            {currentStake && parseFloat(currentStake.pendingRewards) > 0 && (
              <Card className="border-2 border-green-200 bg-green-50">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">🎁 Claim Rewards</h3>
                      <p className="text-gray-600">
                        You have {parseFloat(currentStake.pendingRewards).toFixed(6)} tokens ready to claim!
                      </p>
                    </div>
                    <Button 
                      onClick={handleClaimRewards}
                      className="bg-green-600 hover:bg-green-700 text-white"
                      disabled={isClaiming}
                    >
                      {isClaiming ? '⏳ Claiming...' : 'Claim Rewards'}
                    </Button>
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
                      {selectedVault.vaultAddress}
                    </div>
                    <a
                      href={`https://bscscan.com/address/${selectedVault.vaultAddress}`}
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
                      {selectedVault.lpToken}
                    </div>
                    <a
                      href={`https://bscscan.com/address/${selectedVault.lpToken}`}
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
          </>
        )}
      </div>
    </div>
  );
}
