import React, { useState, useEffect } from 'react';
import { useWallet } from '../context/WalletContext';
import { ethers } from 'ethers';

const GOVERNANCE_POOL_ADDRESS = '0x63df9De7F74c15dE702De7D2fC7eB8205bfAC0B8';
const AXM_TOKEN_ADDRESS = '0x83E17aeB148d9b4b7Be0BE7C87dd73531a5a5738';

const GOVERNANCE_POOL_ABI = [
  'function stake(uint256 amount) external',
  'function withdraw(uint256 amount) external',
  'function claim() external',
  'function stakes(address) view returns (uint256)',
  'function lastClaim(address) view returns (uint256)',
  'function totalStaked() view returns (uint256)',
  'function rewardRate() view returns (uint256)',
  'function swfToken() view returns (address)'
];

const ERC20_ABI = [
  'function balanceOf(address) view returns (uint256)',
  'function approve(address spender, uint256 amount) external returns (bool)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'function symbol() view returns (string)',
  'function decimals() view returns (uint8)'
];

const GovernanceDividendPoolPage: React.FC = () => {
  const { account, provider, connectWallet, disconnectWallet } = useWallet();
  
  // State
  const [loading, setLoading] = useState(false);
  const [userStake, setUserStake] = useState('0');
  const [userBalance, setUserBalance] = useState('0');
  const [totalPoolStaked, setTotalPoolStaked] = useState('0');
  const [rewardRate, setRewardRate] = useState('0');
  const [lastClaimTime, setLastClaimTime] = useState(0);
  const [allowance, setAllowance] = useState('0');
  
  // Input state
  const [stakeAmount, setStakeAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  
  // Transaction state
  const [txStatus, setTxStatus] = useState<{
    type: 'stake' | 'withdraw' | 'claim' | 'approve' | null;
    status: 'pending' | 'success' | 'error' | null;
    message: string;
    txHash?: string;
  }>({ type: null, status: null, message: '' });

  // Load data
  const loadPoolData = async () => {
    if (!provider || !account) return;
    
    try {
      setLoading(true);
      
      const poolContract = new ethers.Contract(
        GOVERNANCE_POOL_ADDRESS,
        GOVERNANCE_POOL_ABI,
        provider
      );
      
      const tokenContract = new ethers.Contract(
        AXM_TOKEN_ADDRESS,
        ERC20_ABI,
        provider
      );

      const [
        userStakeData,
        userBalanceData,
        totalStakedData,
        rewardRateData,
        lastClaimData,
        allowanceData
      ] = await Promise.all([
        poolContract.stakes(account),
        tokenContract.balanceOf(account),
        poolContract.totalStaked(),
        poolContract.rewardRate(),
        poolContract.lastClaim(account),
        tokenContract.allowance(account, GOVERNANCE_POOL_ADDRESS)
      ]);

      setUserStake(ethers.formatEther(userStakeData));
      setUserBalance(ethers.formatEther(userBalanceData));
      setTotalPoolStaked(ethers.formatEther(totalStakedData));
      setRewardRate(ethers.formatEther(rewardRateData));
      setLastClaimTime(Number(lastClaimData));
      setAllowance(ethers.formatEther(allowanceData));
      
    } catch (error) {
      console.error('Error loading pool data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (account && provider) {
      loadPoolData();
    }
  }, [account, provider]);

  // Calculate claimable dividends (simplified - based on time since last claim)
  const calculateClaimable = () => {
    if (!lastClaimTime || parseFloat(userStake) === 0) return '0';
    
    const currentTime = Math.floor(Date.now() / 1000);
    const timeSinceLastClaim = currentTime - lastClaimTime;
    const daysElapsed = timeSinceLastClaim / 86400; // seconds in a day
    
    // Claimable = userStake * rewardRate * days
    const claimable = parseFloat(userStake) * parseFloat(rewardRate) * daysElapsed;
    return claimable.toFixed(6);
  };

  // Approve tokens
  const handleApprove = async () => {
    if (!provider || !account) return;
    
    try {
      setTxStatus({ type: 'approve', status: 'pending', message: 'Approving AXM tokens...' });
      
      const signer = await provider.getSigner();
      const tokenContract = new ethers.Contract(AXM_TOKEN_ADDRESS, ERC20_ABI, signer);
      
      // Approve max amount
      const maxApproval = ethers.MaxUint256;
      const tx = await tokenContract.approve(GOVERNANCE_POOL_ADDRESS, maxApproval);
      
      setTxStatus({ 
        type: 'approve', 
        status: 'pending', 
        message: 'Waiting for confirmation...', 
        txHash: tx.hash 
      });
      
      await tx.wait();
      
      setTxStatus({ 
        type: 'approve', 
        status: 'success', 
        message: 'Tokens approved successfully!', 
        txHash: tx.hash 
      });
      
      await loadPoolData();
      
    } catch (error: any) {
      console.error('Approval error:', error);
      setTxStatus({ 
        type: 'approve', 
        status: 'error', 
        message: error.message || 'Approval failed' 
      });
    }
  };

  // Stake tokens
  const handleStake = async () => {
    if (!provider || !account || !stakeAmount) return;
    
    try {
      const amount = parseFloat(stakeAmount);
      if (amount <= 0 || amount > parseFloat(userBalance)) {
        setTxStatus({ type: 'stake', status: 'error', message: 'Invalid amount' });
        return;
      }
      
      setTxStatus({ type: 'stake', status: 'pending', message: 'Staking tokens...' });
      
      const signer = await provider.getSigner();
      const poolContract = new ethers.Contract(GOVERNANCE_POOL_ADDRESS, GOVERNANCE_POOL_ABI, signer);
      
      const amountWei = ethers.parseEther(stakeAmount);
      const tx = await poolContract.stake(amountWei);
      
      setTxStatus({ 
        type: 'stake', 
        status: 'pending', 
        message: 'Waiting for confirmation...', 
        txHash: tx.hash 
      });
      
      await tx.wait();
      
      setTxStatus({ 
        type: 'stake', 
        status: 'success', 
        message: `Successfully staked ${stakeAmount} AXM!`, 
        txHash: tx.hash 
      });
      
      setStakeAmount('');
      await loadPoolData();
      
    } catch (error: any) {
      console.error('Stake error:', error);
      setTxStatus({ 
        type: 'stake', 
        status: 'error', 
        message: error.message || 'Staking failed' 
      });
    }
  };

  // Withdraw tokens
  const handleWithdraw = async () => {
    if (!provider || !account || !withdrawAmount) return;
    
    try {
      const amount = parseFloat(withdrawAmount);
      if (amount <= 0 || amount > parseFloat(userStake)) {
        setTxStatus({ type: 'withdraw', status: 'error', message: 'Invalid amount' });
        return;
      }
      
      setTxStatus({ type: 'withdraw', status: 'pending', message: 'Withdrawing tokens...' });
      
      const signer = await provider.getSigner();
      const poolContract = new ethers.Contract(GOVERNANCE_POOL_ADDRESS, GOVERNANCE_POOL_ABI, signer);
      
      const amountWei = ethers.parseEther(withdrawAmount);
      const tx = await poolContract.withdraw(amountWei);
      
      setTxStatus({ 
        type: 'withdraw', 
        status: 'pending', 
        message: 'Waiting for confirmation...', 
        txHash: tx.hash 
      });
      
      await tx.wait();
      
      setTxStatus({ 
        type: 'withdraw', 
        status: 'success', 
        message: `Successfully withdrew ${withdrawAmount} AXM!`, 
        txHash: tx.hash 
      });
      
      setWithdrawAmount('');
      await loadPoolData();
      
    } catch (error: any) {
      console.error('Withdraw error:', error);
      setTxStatus({ 
        type: 'withdraw', 
        status: 'error', 
        message: error.message || 'Withdrawal failed' 
      });
    }
  };

  // Claim dividends
  const handleClaim = async () => {
    if (!provider || !account) return;
    
    try {
      setTxStatus({ type: 'claim', status: 'pending', message: 'Claiming dividends...' });
      
      const signer = await provider.getSigner();
      const poolContract = new ethers.Contract(GOVERNANCE_POOL_ADDRESS, GOVERNANCE_POOL_ABI, signer);
      
      const tx = await poolContract.claim();
      
      setTxStatus({ 
        type: 'claim', 
        status: 'pending', 
        message: 'Waiting for confirmation...', 
        txHash: tx.hash 
      });
      
      await tx.wait();
      
      setTxStatus({ 
        type: 'claim', 
        status: 'success', 
        message: 'Dividends claimed successfully!', 
        txHash: tx.hash 
      });
      
      await loadPoolData();
      
    } catch (error: any) {
      console.error('Claim error:', error);
      setTxStatus({ 
        type: 'claim', 
        status: 'error', 
        message: error.message || 'Claim failed' 
      });
    }
  };

  const claimableDividends = calculateClaimable();
  const needsApproval = parseFloat(allowance) === 0;

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-16">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-4xl font-bold">Governance Dividend Pool</h1>
            {account && (
              <button
                onClick={disconnectWallet}
                className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg text-sm"
              >
                {account.slice(0, 6)}...{account.slice(-4)} | Disconnect
              </button>
            )}
          </div>
          <p className="text-xl text-blue-100">
            Stake AXM tokens to earn governance dividends from platform revenue
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Educational Section */}
        <div className="bg-blue-50 border-l-4 border-blue-600 p-6 mb-8 rounded-r-lg">
          <h2 className="text-2xl font-bold text-blue-900 mb-4">📚 What are Governance Dividends?</h2>
          <div className="space-y-3 text-gray-700">
            <p>
              <strong>Passive Income:</strong> Stake your AXM tokens in the Governance Dividend Pool to earn 
              regular dividend payments from platform revenue. The longer you stake, the more you earn.
            </p>
            <p>
              <strong>How it Works:</strong> Platform revenue is distributed proportionally to all stakers 
              based on their stake amount and duration. Claim your dividends anytime without unstaking.
            </p>
            <p>
              <strong>Reward Rate:</strong> The current reward rate is {parseFloat(rewardRate) * 100}% per day 
              based on your staked amount. This compounds over time as you continue to stake.
            </p>
          </div>
        </div>

        {!account ? (
          /* Connect Wallet Section */
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <div className="text-6xl mb-6">🔐</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Connect Your Wallet</h2>
            <p className="text-gray-600 mb-8">
              Connect your wallet to stake AXM tokens and start earning governance dividends
            </p>
            <button
              onClick={connectWallet}
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-lg text-lg font-semibold"
            >
              Connect Wallet
            </button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-8">
            {/* Left Column - Stats */}
            <div className="space-y-6">
              {/* Pool Statistics */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">📊 Pool Statistics</h2>
                {loading ? (
                  <div className="text-center py-8 text-gray-600">Loading pool data...</div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                      <span className="text-gray-600">Total Pool Staked</span>
                      <span className="font-bold text-lg">{parseFloat(totalPoolStaked).toLocaleString()} AXM</span>
                    </div>
                    <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                      <span className="text-gray-600">Daily Reward Rate</span>
                      <span className="font-bold text-lg text-green-600">{(parseFloat(rewardRate) * 100).toFixed(4)}%</span>
                    </div>
                    <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                      <span className="text-gray-600">Your Staked Balance</span>
                      <span className="font-bold text-lg text-blue-600">{parseFloat(userStake).toLocaleString()} AXM</span>
                    </div>
                    <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                      <span className="text-gray-600">Your Wallet Balance</span>
                      <span className="font-bold text-lg">{parseFloat(userBalance).toLocaleString()} AXM</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Claimable Dividends */}
              <div className="bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl shadow-lg p-6">
                <h2 className="text-2xl font-bold mb-4">💰 Claimable Dividends</h2>
                <div className="text-5xl font-bold mb-4">{claimableDividends} AXM</div>
                <p className="text-green-100 mb-6">
                  {lastClaimTime === 0 
                    ? 'Stake tokens to start earning dividends' 
                    : `Earned since ${new Date(lastClaimTime * 1000).toLocaleDateString()}`}
                </p>
                <button
                  onClick={handleClaim}
                  disabled={parseFloat(claimableDividends) === 0 || txStatus.type === 'claim' && txStatus.status === 'pending'}
                  className="w-full bg-white text-green-600 font-bold py-3 rounded-lg hover:bg-green-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {txStatus.type === 'claim' && txStatus.status === 'pending' ? 'Claiming...' : 'Claim Dividends'}
                </button>
              </div>
            </div>

            {/* Right Column - Actions */}
            <div className="space-y-6">
              {/* Stake Section */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">📥 Stake AXM Tokens</h2>
                
                {needsApproval && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                    <p className="text-sm text-yellow-800 mb-3">
                      <strong>⚠️ Approval Required:</strong> You need to approve the contract to spend your AXM tokens before staking.
                    </p>
                    <button
                      onClick={handleApprove}
                      disabled={txStatus.type === 'approve' && txStatus.status === 'pending'}
                      className="w-full bg-yellow-600 hover:bg-yellow-700 text-white py-2 rounded-lg font-semibold disabled:opacity-50"
                    >
                      {txStatus.type === 'approve' && txStatus.status === 'pending' ? 'Approving...' : 'Approve AXM'}
                    </button>
                  </div>
                )}
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Amount to Stake</label>
                    <input
                      type="number"
                      value={stakeAmount}
                      onChange={(e) => setStakeAmount(e.target.value)}
                      placeholder="0.0"
                      className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                      disabled={needsApproval}
                    />
                    <div className="flex justify-between mt-2 text-sm text-gray-600">
                      <span>Available: {parseFloat(userBalance).toLocaleString()} AXM</span>
                      <button
                        onClick={() => setStakeAmount(userBalance)}
                        className="text-blue-600 hover:text-blue-700 font-semibold"
                        disabled={needsApproval}
                      >
                        Max
                      </button>
                    </div>
                  </div>
                  
                  <button
                    onClick={handleStake}
                    disabled={!stakeAmount || needsApproval || (txStatus.type === 'stake' && txStatus.status === 'pending')}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {txStatus.type === 'stake' && txStatus.status === 'pending' ? 'Staking...' : 'Stake Tokens'}
                  </button>
                </div>
              </div>

              {/* Withdraw Section */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">📤 Withdraw Staked Tokens</h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Amount to Withdraw</label>
                    <input
                      type="number"
                      value={withdrawAmount}
                      onChange={(e) => setWithdrawAmount(e.target.value)}
                      placeholder="0.0"
                      className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                    />
                    <div className="flex justify-between mt-2 text-sm text-gray-600">
                      <span>Staked: {parseFloat(userStake).toLocaleString()} AXM</span>
                      <button
                        onClick={() => setWithdrawAmount(userStake)}
                        className="text-blue-600 hover:text-blue-700 font-semibold"
                      >
                        Max
                      </button>
                    </div>
                  </div>
                  
                  <button
                    onClick={handleWithdraw}
                    disabled={!withdrawAmount || (txStatus.type === 'withdraw' && txStatus.status === 'pending')}
                    className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-3 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {txStatus.type === 'withdraw' && txStatus.status === 'pending' ? 'Withdrawing...' : 'Withdraw Tokens'}
                  </button>
                </div>
              </div>

              {/* Transaction Status */}
              {txStatus.status && (
                <div className={`rounded-lg p-4 ${
                  txStatus.status === 'pending' ? 'bg-blue-50 border border-blue-200' :
                  txStatus.status === 'success' ? 'bg-green-50 border border-green-200' :
                  'bg-red-50 border border-red-200'
                }`}>
                  <div className="flex items-start">
                    <span className="text-2xl mr-3">
                      {txStatus.status === 'pending' ? '⏳' : txStatus.status === 'success' ? '✅' : '❌'}
                    </span>
                    <div className="flex-1">
                      <div className={`font-semibold mb-1 ${
                        txStatus.status === 'pending' ? 'text-blue-900' :
                        txStatus.status === 'success' ? 'text-green-900' :
                        'text-red-900'
                      }`}>
                        {txStatus.message}
                      </div>
                      {txStatus.txHash && (
                        <a
                          href={`https://bscscan.com/tx/${txStatus.txHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:text-blue-800 underline"
                        >
                          View on BSCScan →
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GovernanceDividendPoolPage;
