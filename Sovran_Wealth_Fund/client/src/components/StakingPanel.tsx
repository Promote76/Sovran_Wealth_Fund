import React, { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { 
  RefreshIcon, 
  ChevronDownIcon, 
  LightningBoltIcon 
} from '@heroicons/react/outline';
import { ArrowSmUpIcon, ArrowSmDownIcon } from '@heroicons/react/solid';
import { registerStakingAction } from '../utils/userJourney';

// Contract ABIs (simplified for this implementation)
const SWF_TOKEN_ABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)",
  "function approve(address spender, uint256 amount) returns (bool)"
];

const STAKING_ABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function stake(uint256 amount) external",
  "function withdraw(uint256 amount) external",
  "function earned(address account) view returns (uint256)",
  "function getRewardRate() view returns (uint256)",
  "function getTotalStaked() view returns (uint256)"
];

// Contract addresses
const SWF_TOKEN_ADDRESS = "0x7e243288B287BEe84A7D40E8520444f47af88335";
const STAKING_ADDRESS = "0x87034C4A1C27DEd5d74819661318840C558bde00";

// Toast component
interface ToastProps {
  message: string;
  type: 'success' | 'error' | 'info';
  isVisible: boolean;
  onClose: () => void;
}

const Toast: React.FC<ToastProps> = ({ message, type, isVisible, onClose }) => {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        onClose();
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose]);
  
  if (!isVisible) return null;
  
  const bgColor = 
    type === 'success' ? 'bg-green-500' : 
    type === 'error' ? 'bg-red-500' : 
    'bg-indigo-500';
  
  return (
    <div className={`fixed bottom-4 right-4 ${bgColor} text-white px-4 py-2 rounded-md shadow-md flex items-center z-50 animate-fade-in`}>
      <span>{message}</span>
      <button 
        onClick={onClose} 
        className="ml-4 text-white hover:text-gray-200"
      >
        <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      </button>
    </div>
  );
};

interface StakingPanelProps {
  provider?: ethers.providers.Web3Provider;
  walletAddress?: string;
}

const StakingPanel: React.FC<StakingPanelProps> = ({
  provider,
  walletAddress
}) => {
  // State variables
  const [swfBalance, setSwfBalance] = useState<string>('0');
  const [stakedBalance, setStakedBalance] = useState<string>('0');
  const [earnedRewards, setEarnedRewards] = useState<string>('0');
  const [apr, setApr] = useState<string>('25.0');
  const [stakeAmount, setStakeAmount] = useState<string>('');
  const [withdrawAmount, setWithdrawAmount] = useState<string>('');
  const [isStakingOpen, setIsStakingOpen] = useState<boolean>(true);
  const [isWithdrawOpen, setIsWithdrawOpen] = useState<boolean>(false);
  const [isStaking, setIsStaking] = useState<boolean>(false);
  const [isWithdrawing, setIsWithdrawing] = useState<boolean>(false);
  const [toast, setToast] = useState<{
    message: string;
    type: 'success' | 'error' | 'info';
    isVisible: boolean;
  }>({
    message: '',
    type: 'info',
    isVisible: false
  });
  const [timeUntilNextReward, setTimeUntilNextReward] = useState<number>(10);
  const [totalStaked, setTotalStaked] = useState<string>('0');
  
  // Format numbers with commas
  const formatNumber = (value: string): string => {
    const parsed = parseFloat(value);
    if (isNaN(parsed)) return '0';
    
    // If it's a whole number, don't show decimal places
    if (Math.floor(parsed) === parsed) {
      return parsed.toLocaleString('en-US');
    }
    
    // Otherwise, format with up to 2 decimal places
    return parsed.toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    });
  };
  
  // Load user's SWF balance
  const loadBalance = useCallback(async () => {
    if (!provider || !walletAddress) return;
    
    try {
      const tokenContract = new ethers.Contract(
        SWF_TOKEN_ADDRESS, 
        SWF_TOKEN_ABI, 
        provider
      );
      
      const balance = await tokenContract.balanceOf(walletAddress);
      const decimals = await tokenContract.decimals();
      setSwfBalance(ethers.utils.formatUnits(balance, decimals));
    } catch (error) {
      console.error('Error loading SWF balance:', error);
    }
  }, [provider, walletAddress]);
  
  // Load user's staked balance
  const loadStakedBalance = useCallback(async () => {
    if (!provider || !walletAddress) return;
    
    try {
      const stakingContract = new ethers.Contract(
        STAKING_ADDRESS, 
        STAKING_ABI, 
        provider
      );
      
      const balance = await stakingContract.balanceOf(walletAddress);
      setStakedBalance(ethers.utils.formatUnits(balance, 18));
      
      // Get total staked
      const total = await stakingContract.getTotalStaked();
      setTotalStaked(ethers.utils.formatUnits(total, 18));
    } catch (error) {
      console.error('Error loading staked balance:', error);
    }
  }, [provider, walletAddress]);
  
  // Load earned rewards
  const loadEarnedRewards = useCallback(async () => {
    if (!provider || !walletAddress) return;
    
    try {
      const stakingContract = new ethers.Contract(
        STAKING_ADDRESS, 
        STAKING_ABI, 
        provider
      );
      
      const earned = await stakingContract.earned(walletAddress);
      setEarnedRewards(ethers.utils.formatUnits(earned, 18));
    } catch (error) {
      console.error('Error loading earned rewards:', error);
    }
  }, [provider, walletAddress]);
  
  // Load APR information
  const loadApr = useCallback(async () => {
    if (!provider) return;
    
    try {
      const stakingContract = new ethers.Contract(
        STAKING_ADDRESS, 
        STAKING_ABI, 
        provider
      );
      
      const rewardRate = await stakingContract.getRewardRate();
      // Calculate APR based on reward rate
      // This is just an example, actual calculation may vary
      const aprValue = 25.0; // Default to 25% as specified in requirements
      setApr(aprValue.toFixed(1));
    } catch (error) {
      console.error('Error loading APR:', error);
      setApr('25.0'); // Fallback to default 25%
    }
  }, [provider]);
  
  // Load all data
  const loadAllData = useCallback(async () => {
    await loadBalance();
    await loadStakedBalance();
    await loadEarnedRewards();
    await loadApr();
  }, [loadBalance, loadStakedBalance, loadEarnedRewards, loadApr]);
  
  // Initialize data loading when provider and wallet address are available
  useEffect(() => {
    if (provider && walletAddress) {
      loadAllData();
    }
  }, [provider, walletAddress, loadAllData]);
  
  // Update rewards and countdown timer every second
  useEffect(() => {
    if (!provider || !walletAddress) return;
    
    // Only update earned rewards every 10 seconds
    let lastFullUpdate = Date.now();
    let countdown = 10;
    
    const updateTimer = () => {
      const now = Date.now();
      const elapsedSeconds = Math.floor((now - lastFullUpdate) / 1000);
      
      if (elapsedSeconds >= 10) {
        // Time to do a full update
        loadEarnedRewards();
        lastFullUpdate = now;
        countdown = 10;
      } else {
        // Just update the countdown
        countdown = 10 - elapsedSeconds;
      }
      
      setTimeUntilNextReward(countdown);
      
      // Simulate small incremental rewards between full updates
      // This gives the appearance of a "live" counter
      if (parseFloat(earnedRewards) > 0) {
        const currentReward = parseFloat(earnedRewards);
        const stakingRate = parseFloat(apr) / 100 / 365 / 24 / 360; // APR per second
        const stakedAmount = parseFloat(stakedBalance);
        const incrementalReward = stakedAmount * stakingRate * (elapsedSeconds % 10);
        setEarnedRewards((currentReward + incrementalReward).toString());
      }
    };
    
    // Run immediately
    updateTimer();
    
    // Then set interval
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [provider, walletAddress, loadEarnedRewards, earnedRewards, apr, stakedBalance]);
  
  // Handle staking
  const handleStake = async () => {
    if (!provider || !walletAddress || !stakeAmount || parseFloat(stakeAmount) <= 0) {
      return;
    }
    
    setIsStaking(true);
    
    try {
      const signer = provider.getSigner();
      const tokenContract = new ethers.Contract(
        SWF_TOKEN_ADDRESS, 
        SWF_TOKEN_ABI, 
        signer
      );
      const stakingContract = new ethers.Contract(
        STAKING_ADDRESS, 
        STAKING_ABI, 
        signer
      );
      
      // Convert input value to token units with 18 decimals
      const amountToStake = ethers.utils.parseUnits(stakeAmount, 18);
      
      // First, approve the staking contract to spend tokens
      const approveTx = await tokenContract.approve(STAKING_ADDRESS, amountToStake);
      await approveTx.wait();
      
      // Now stake the tokens
      const stakeTx = await stakingContract.stake(amountToStake);
      await stakeTx.wait();
      
      // Success! Update balances
      await loadAllData();
      setStakeAmount('');
      
      // Register this staking action in the user journey system
      registerStakingAction();
      
      // Show success toast
      setToast({
        message: `Successfully staked ${stakeAmount} SWF!`,
        type: 'success',
        isVisible: true
      });
    } catch (error) {
      console.error('Error staking tokens:', error);
      setToast({
        message: 'Error staking tokens. Please try again.',
        type: 'error',
        isVisible: true
      });
    } finally {
      setIsStaking(false);
    }
  };
  
  // Handle withdrawal
  const handleWithdraw = async () => {
    if (!provider || !walletAddress || !withdrawAmount || parseFloat(withdrawAmount) <= 0) {
      return;
    }
    
    setIsWithdrawing(true);
    
    try {
      const signer = provider.getSigner();
      const stakingContract = new ethers.Contract(
        STAKING_ADDRESS, 
        STAKING_ABI, 
        signer
      );
      
      // Convert input value to token units with 18 decimals
      const amountToWithdraw = ethers.utils.parseUnits(withdrawAmount, 18);
      
      // Withdraw tokens
      const withdrawTx = await stakingContract.withdraw(amountToWithdraw);
      await withdrawTx.wait();
      
      // Success! Update balances
      await loadAllData();
      setWithdrawAmount('');
      
      // Show success toast
      setToast({
        message: `Successfully withdrew ${withdrawAmount} SWF!`,
        type: 'success',
        isVisible: true
      });
    } catch (error) {
      console.error('Error withdrawing tokens:', error);
      setToast({
        message: 'Error withdrawing tokens. Please try again.',
        type: 'error',
        isVisible: true
      });
    } finally {
      setIsWithdrawing(false);
    }
  };
  
  // Handle quick-stake buttons
  const handleQuickStake = (amount: number) => {
    // If 'Max' is selected, use the full balance
    if (amount === -1) {
      setStakeAmount(swfBalance);
    } else {
      setStakeAmount(amount.toString());
    }
  };
  
  // Handle quick-withdraw buttons
  const handleQuickWithdraw = (amount: number) => {
    // If 'Max' is selected, use the full staked balance
    if (amount === -1) {
      setWithdrawAmount(stakedBalance);
    } else {
      setWithdrawAmount(amount.toString());
    }
  };
  
  // Close toast
  const handleCloseToast = () => {
    setToast({ ...toast, isVisible: false });
  };
  
  // Calculate daily rewards based on APR and staked amount
  const calculateDailyRewards = (): string => {
    const stakedAmount = parseFloat(stakedBalance);
    if (stakedAmount <= 0) return '0';
    
    const dailyRate = parseFloat(apr) / 100 / 365;
    const dailyReward = stakedAmount * dailyRate;
    
    return dailyReward.toFixed(2);
  };
  
  // UI renderings
  return (
    <div className="staking-panel bg-white rounded-lg shadow-lg">
      {/* Staking Overview */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800">Staking Overview</h2>
          <button 
            onClick={loadAllData}
            className="text-indigo-600 flex items-center text-sm hover:text-indigo-800 transition-colors"
          >
            <RefreshIcon className="h-4 w-4 mr-1" />
            Refresh
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-indigo-50 p-4 rounded-lg">
            <div className="text-sm text-indigo-600 mb-1">Your SWF Balance</div>
            <div className="text-2xl font-bold">{formatNumber(swfBalance)} SWF</div>
          </div>
          
          <div className="bg-indigo-50 p-4 rounded-lg">
            <div className="text-sm text-indigo-600 mb-1">Currently Staked</div>
            <div className="text-2xl font-bold">{formatNumber(stakedBalance)} SWF</div>
          </div>
          
          <div className="bg-indigo-50 p-4 rounded-lg">
            <div className="text-sm text-indigo-600 mb-1">Earned Rewards</div>
            <div className="text-2xl font-bold flex items-center">
              {formatNumber(earnedRewards)} SWF
              <div className="ml-2 text-xs bg-indigo-600 text-white rounded-full px-2 py-1 flex items-center">
                <span>Next update in {timeUntilNextReward}s</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="text-sm text-gray-600 mb-1">Current APR</div>
            <div className="text-2xl font-bold text-green-600">{apr}%</div>
            <div className="text-xs text-gray-500 mt-1">Daily rewards: ~{calculateDailyRewards()} SWF</div>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="text-sm text-gray-600 mb-1">Total Staked by All Users</div>
            <div className="text-2xl font-bold">{formatNumber(totalStaked)} SWF</div>
            <div className="text-xs text-gray-500 mt-1">
              Your share: {parseFloat(stakedBalance) > 0 && parseFloat(totalStaked) > 0 
                ? ((parseFloat(stakedBalance) / parseFloat(totalStaked)) * 100).toFixed(2) 
                : "0"}%
            </div>
          </div>
        </div>
      </div>
      
      {/* Stake Section */}
      <div className="p-6 border-b border-gray-200">
        <button 
          className="w-full flex justify-between items-center"
          onClick={() => setIsStakingOpen(!isStakingOpen)}
        >
          <h3 className="text-lg font-medium text-gray-900">Stake SWF Tokens</h3>
          <ChevronDownIcon 
            className={`h-5 w-5 text-gray-500 transform transition-transform ${isStakingOpen ? 'rotate-180' : ''}`} 
          />
        </button>
        
        {isStakingOpen && (
          <div className="mt-4 animate-fade-in">
            <p className="text-sm text-gray-600 mb-4">
              Stake your SWF tokens to earn rewards at {apr}% APR. 
              Minimum stake required: 50 SWF.
            </p>
            
            <div className="mb-4">
              <label 
                htmlFor="stake-amount" 
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Amount to Stake
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <input
                  id="stake-amount"
                  type="number"
                  value={stakeAmount}
                  onChange={(e) => setStakeAmount(e.target.value)}
                  className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-4 pr-12 sm:text-sm border-gray-300 rounded-md"
                  placeholder="0.0"
                  min="0"
                  step="1"
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  <span className="text-gray-500 sm:text-sm">SWF</span>
                </div>
              </div>
            </div>
            
            <div className="flex space-x-2 mb-4">
              <button
                onClick={() => handleQuickStake(50)}
                className="bg-indigo-100 hover:bg-indigo-200 text-indigo-700 px-3 py-1 rounded-md text-sm font-medium transition-colors"
              >
                Stake 50
              </button>
              <button
                onClick={() => handleQuickStake(100)}
                className="bg-indigo-100 hover:bg-indigo-200 text-indigo-700 px-3 py-1 rounded-md text-sm font-medium transition-colors"
              >
                Stake 100
              </button>
              <button
                onClick={() => handleQuickStake(-1)}
                className="bg-indigo-100 hover:bg-indigo-200 text-indigo-700 px-3 py-1 rounded-md text-sm font-medium transition-colors"
              >
                Max
              </button>
            </div>
            
            <button
              onClick={handleStake}
              disabled={isStaking || !stakeAmount || parseFloat(stakeAmount) <= 0 || parseFloat(stakeAmount) > parseFloat(swfBalance)}
              className={`w-full px-4 py-2 rounded-md text-white font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
                isStaking 
                  ? 'bg-indigo-400 cursor-not-allowed' 
                  : (!stakeAmount || parseFloat(stakeAmount) <= 0 || parseFloat(stakeAmount) > parseFloat(swfBalance))
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-indigo-600 hover:bg-indigo-700'
              }`}
            >
              {isStaking ? (
                <div className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Staking...</span>
                </div>
              ) : (
                'Stake SWF'
              )}
            </button>
          </div>
        )}
      </div>
      
      {/* Withdraw Section */}
      <div className="p-6">
        <button 
          className="w-full flex justify-between items-center"
          onClick={() => setIsWithdrawOpen(!isWithdrawOpen)}
        >
          <h3 className="text-lg font-medium text-gray-900">Withdraw Staked SWF</h3>
          <ChevronDownIcon 
            className={`h-5 w-5 text-gray-500 transform transition-transform ${isWithdrawOpen ? 'rotate-180' : ''}`} 
          />
        </button>
        
        {isWithdrawOpen && (
          <div className="mt-4 animate-fade-in">
            <p className="text-sm text-gray-600 mb-4">
              Withdraw your staked SWF tokens. Note that withdrawing will stop earning rewards on the withdrawn amount.
            </p>
            
            <div className="mb-4">
              <label 
                htmlFor="withdraw-amount" 
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Amount to Withdraw
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <input
                  id="withdraw-amount"
                  type="number"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-4 pr-12 sm:text-sm border-gray-300 rounded-md"
                  placeholder="0.0"
                  min="0"
                  step="1"
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  <span className="text-gray-500 sm:text-sm">SWF</span>
                </div>
              </div>
            </div>
            
            <div className="flex space-x-2 mb-4">
              <button
                onClick={() => handleQuickWithdraw(50)}
                className="bg-indigo-100 hover:bg-indigo-200 text-indigo-700 px-3 py-1 rounded-md text-sm font-medium transition-colors"
              >
                Withdraw 50
              </button>
              <button
                onClick={() => handleQuickWithdraw(100)}
                className="bg-indigo-100 hover:bg-indigo-200 text-indigo-700 px-3 py-1 rounded-md text-sm font-medium transition-colors"
              >
                Withdraw 100
              </button>
              <button
                onClick={() => handleQuickWithdraw(-1)}
                className="bg-indigo-100 hover:bg-indigo-200 text-indigo-700 px-3 py-1 rounded-md text-sm font-medium transition-colors"
              >
                Max
              </button>
            </div>
            
            <button
              onClick={handleWithdraw}
              disabled={isWithdrawing || !withdrawAmount || parseFloat(withdrawAmount) <= 0 || parseFloat(withdrawAmount) > parseFloat(stakedBalance)}
              className={`w-full px-4 py-2 rounded-md text-white font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
                isWithdrawing 
                  ? 'bg-indigo-400 cursor-not-allowed' 
                  : (!withdrawAmount || parseFloat(withdrawAmount) <= 0 || parseFloat(withdrawAmount) > parseFloat(stakedBalance))
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-indigo-600 hover:bg-indigo-700'
              }`}
            >
              {isWithdrawing ? (
                <div className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Withdrawing...</span>
                </div>
              ) : (
                'Withdraw SWF'
              )}
            </button>
          </div>
        )}
      </div>
      
      {/* Toast notification */}
      <Toast 
        message={toast.message}
        type={toast.type}
        isVisible={toast.isVisible}
        onClose={handleCloseToast}
      />
    </div>
  );
};

export default StakingPanel;