import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import axios from 'axios';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { useWallet } from '../contexts/WalletContext';
import { PANCAKESWAP_CONFIG, AXM_TOKEN_ADDRESS } from '../config/pancakeswap';

// ABIs
import PancakeRouterABI from '../abis/PancakeRouterV2.json';
import ERC20ABI from '../abis/ERC20.json';
import PancakePairABI from '../abis/PancakePair.json';

interface PairInfo {
  exists: boolean;
  pairAddress?: string;
  tokenA?: string;
  tokenB?: string;
  symbolA?: string;
  symbolB?: string;
  decimalsA?: number;
  decimalsB?: number;
  reserveA?: string;
  reserveB?: string;
  totalSupply?: string;
  priceAtoB?: number;
  priceBtoA?: number;
}

interface SelectedPair {
  name: string;
  tokenA: string;
  tokenB: string;
  isNative: boolean;
  symbol: string;
}

export default function ProvideLiquidity() {
  const { account } = useWallet();
  
  // Pair selection
  const [selectedPair, setSelectedPair] = useState<SelectedPair>(PANCAKESWAP_CONFIG.SUPPORTED_PAIRS[0]);
  const [pairInfo, setPairInfo] = useState<PairInfo | null>(null);
  const [loadingPairInfo, setLoadingPairInfo] = useState(false);
  
  // Input amounts
  const [amountA, setAmountA] = useState('');
  const [amountB, setAmountB] = useState('');
  const [estimatedLP, setEstimatedLP] = useState('');
  
  // Settings
  const [slippage, setSlippage] = useState(PANCAKESWAP_CONFIG.DEFAULT_SLIPPAGE);
  const [deadline, setDeadline] = useState(PANCAKESWAP_CONFIG.DEFAULT_DEADLINE_MINUTES);
  const [showSettings, setShowSettings] = useState(false);
  
  // Approvals
  const [allowanceA, setAllowanceA] = useState('0');
  const [allowanceB, setAllowanceB] = useState('0');
  const [needsApprovalA, setNeedsApprovalA] = useState(false);
  const [needsApprovalB, setNeedsApprovalB] = useState(false);
  
  // Transaction state
  const [isApproving, setIsApproving] = useState(false);
  const [isAddingLiquidity, setIsAddingLiquidity] = useState(false);
  const [txMessage, setTxMessage] = useState('');
  const [txError, setTxError] = useState('');
  
  // LP Balance
  const [lpBalance, setLPBalance] = useState('0');

  // Get signer from window.ethereum
  const getSigner = async () => {
    if (!window.ethereum) throw new Error('No wallet provider found');
    const provider = new ethers.providers.Web3Provider(window.ethereum as any);
    return provider.getSigner();
  };

  // Load pair info on mount and when pair changes
  useEffect(() => {
    loadPairInfo();
  }, [selectedPair]);

  // Check allowances when amounts change
  useEffect(() => {
    if (account && amountA && amountB) {
      checkAllowances();
    }
  }, [account, amountA, amountB, selectedPair]);

  // Load LP balance
  useEffect(() => {
    if (account && pairInfo?.pairAddress) {
      loadLPBalance();
    }
  }, [account, pairInfo]);

  const loadPairInfo = async () => {
    setLoadingPairInfo(true);
    setTxError('');
    
    try {
      const endpoint = selectedPair.name === 'AXM/BNB' ? '/api/pancake-pools/axm/bnb' : '/api/pancake-pools/axm/busd';
      const response = await axios.get(endpoint);
      
      if (response.data.success) {
        setPairInfo(response.data.data);
        if (!response.data.data.exists) {
          setTxError('⚠️ This liquidity pair does not exist yet on PancakeSwap');
        }
      }
    } catch (error: any) {
      console.error('Failed to load pair info:', error);
      setTxError('Failed to load pool data. Please try again.');
    } finally {
      setLoadingPairInfo(false);
    }
  };

  const loadLPBalance = async () => {
    if (!pairInfo?.pairAddress || !account) return;
    
    try {
      const signer = await getSigner();
      const pairContract = new ethers.Contract(pairInfo.pairAddress, PancakePairABI, signer);
      const balance = await pairContract.balanceOf(account);
      setLPBalance(ethers.utils.formatEther(balance));
    } catch (error) {
      console.error('Failed to load LP balance:', error);
    }
  };

  const checkAllowances = async () => {
    if (!account) return;
    
    try {
      const signer = await getSigner();
      const tokenAContract = new ethers.Contract(selectedPair.tokenA, ERC20ABI, signer);
      const allowanceA = await tokenAContract.allowance(account, PANCAKESWAP_CONFIG.ROUTER_V2);
      setAllowanceA(allowanceA.toString());
      
      // Check if we need approval for token A
      const amountAWei = ethers.utils.parseEther(amountA || '0');
      setNeedsApprovalA(allowanceA.lt(amountAWei));
      
      // For native BNB pairs, we don't need approval for token B
      if (!selectedPair.isNative) {
        const tokenBContract = new ethers.Contract(selectedPair.tokenB, ERC20ABI, signer);
        const allowanceB = await tokenBContract.allowance(account, PANCAKESWAP_CONFIG.ROUTER_V2);
        setAllowanceB(allowanceB.toString());
        
        const amountBWei = ethers.utils.parseEther(amountB || '0');
        setNeedsApprovalB(allowanceB.lt(amountBWei));
      }
    } catch (error) {
      console.error('Failed to check allowances:', error);
    }
  };

  const calculateQuote = (inputAmount: string, isTokenA: boolean) => {
    if (!pairInfo || !inputAmount || !pairInfo.reserveA || !pairInfo.reserveB) return;
    
    try {
      const amount = parseFloat(inputAmount);
      if (isNaN(amount) || amount <= 0) return;
      
      if (isTokenA) {
        // Calculate token B amount based on token A input
        const quoteB = amount * (pairInfo.priceAtoB || 0);
        setAmountB(quoteB.toFixed(6));
        
        // Estimate LP tokens (simplified)
        if (pairInfo.totalSupply && pairInfo.reserveA) {
          const reserveA = parseFloat(ethers.utils.formatEther(pairInfo.reserveA));
          const totalSupply = parseFloat(ethers.utils.formatEther(pairInfo.totalSupply));
          const lpTokens = (amount / reserveA) * totalSupply;
          setEstimatedLP(lpTokens.toFixed(6));
        }
      } else {
        // Calculate token A amount based on token B input
        const quoteA = amount * (pairInfo.priceBtoA || 0);
        setAmountA(quoteA.toFixed(6));
        
        // Estimate LP tokens
        if (pairInfo.totalSupply && pairInfo.reserveB) {
          const reserveB = parseFloat(ethers.utils.formatEther(pairInfo.reserveB));
          const totalSupply = parseFloat(ethers.utils.formatEther(pairInfo.totalSupply));
          const lpTokens = (amount / reserveB) * totalSupply;
          setEstimatedLP(lpTokens.toFixed(6));
        }
      }
    } catch (error) {
      console.error('Quote calculation error:', error);
    }
  };

  const handleAmountAChange = (value: string) => {
    setAmountA(value);
    calculateQuote(value, true);
  };

  const handleAmountBChange = (value: string) => {
    setAmountB(value);
    calculateQuote(value, false);
  };

  const approveToken = async (tokenAddress: string, tokenSymbol: string) => {
    if (!account) {
      setTxError('Please connect your wallet first');
      return;
    }
    
    setIsApproving(true);
    setTxError('');
    setTxMessage(`Approving ${tokenSymbol}...`);
    
    try {
      const signer = await getSigner();
      const tokenContract = new ethers.Contract(tokenAddress, ERC20ABI, signer);
      
      // Approve a large amount (max uint256) for convenience
      const maxApproval = ethers.constants.MaxUint256;
      const tx = await tokenContract.approve(PANCAKESWAP_CONFIG.ROUTER_V2, maxApproval);
      
      setTxMessage(`Waiting for ${tokenSymbol} approval confirmation...`);
      await tx.wait();
      
      setTxMessage(`✅ ${tokenSymbol} approved successfully!`);
      
      // Refresh allowances
      await checkAllowances();
      
      setTimeout(() => setTxMessage(''), 3000);
    } catch (error: any) {
      console.error('Approval error:', error);
      setTxError(`Failed to approve ${tokenSymbol}: ${error.message}`);
    } finally {
      setIsApproving(false);
    }
  };

  const addLiquidity = async () => {
    if (!account) {
      setTxError('Please connect your wallet first');
      return;
    }
    
    if (!amountA || !amountB) {
      setTxError('Please enter both token amounts');
      return;
    }
    
    setIsAddingLiquidity(true);
    setTxError('');
    setTxMessage('Adding liquidity to PancakeSwap...');
    
    try {
      const signer = await getSigner();
      const routerContract = new ethers.Contract(PANCAKESWAP_CONFIG.ROUTER_V2, PancakeRouterABI, signer);
      
      const amountADesired = ethers.utils.parseEther(amountA);
      const amountBDesired = ethers.utils.parseEther(amountB);
      
      // Calculate minimum amounts with slippage
      const slippageMultiplier = 1 - (slippage / 100);
      const slippageFactor = Math.floor(slippageMultiplier * 10000);
      const amountAMin = amountADesired.mul(slippageFactor).div(10000);
      const amountBMin = amountBDesired.mul(slippageFactor).div(10000);
      
      // Calculate deadline (current timestamp + deadline minutes)
      const deadlineTimestamp = Math.floor(Date.now() / 1000) + (deadline * 60);
      
      let tx;
      
      if (selectedPair.isNative) {
        // Add liquidity with native BNB (addLiquidityETH)
        tx = await routerContract.addLiquidityETH(
          selectedPair.tokenA, // AXM token
          amountADesired,
          amountAMin,
          amountBMin,
          account,
          deadlineTimestamp,
          { value: amountBDesired } // Send BNB as value
        );
      } else {
        // Add liquidity with ERC20 tokens (addLiquidity)
        tx = await routerContract.addLiquidity(
          selectedPair.tokenA,
          selectedPair.tokenB,
          amountADesired,
          amountBDesired,
          amountAMin,
          amountBMin,
          account,
          deadlineTimestamp
        );
      }
      
      setTxMessage('Waiting for transaction confirmation...');
      await tx.wait();
      
      setTxMessage('✅ Liquidity added successfully!');
      
      // Reset form
      setAmountA('');
      setAmountB('');
      setEstimatedLP('');
      
      // Refresh balances and pair info
      await loadLPBalance();
      await loadPairInfo();
      
      setTimeout(() => setTxMessage(''), 5000);
    } catch (error: any) {
      console.error('Add liquidity error:', error);
      setTxError(`Failed to add liquidity: ${error.message || 'Unknown error'}`);
    } finally {
      setIsAddingLiquidity(false);
    }
  };

  return (
    <Card className="border-2 border-blue-200">
      <CardContent className="p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">💧 Provide Liquidity</h2>
        
        {/* Educational Info */}
        <div className="bg-blue-50 p-4 rounded-lg mb-6">
          <p className="text-sm text-gray-700 mb-2">
            <strong>Add liquidity to earn trading fees!</strong> When you provide liquidity to a PancakeSwap pool, 
            you'll receive LP (Liquidity Provider) tokens that represent your share of the pool. These LP tokens can 
            then be staked in the vault above to earn additional rewards.
          </p>
          <p className="text-xs text-gray-600">
            ⚠️ <strong>Impermanent Loss Warning:</strong> Providing liquidity carries risk of impermanent loss if token 
            prices diverge significantly.
          </p>
        </div>
        
        {/* Pair Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">Select Trading Pair</label>
          <div className="grid grid-cols-2 gap-3">
            {PANCAKESWAP_CONFIG.SUPPORTED_PAIRS.map((pair) => (
              <button
                key={pair.name}
                onClick={() => setSelectedPair(pair)}
                className={`p-3 rounded-lg border-2 transition-colors ${
                  selectedPair.name === pair.name
                    ? 'border-blue-600 bg-blue-50 text-blue-900'
                    : 'border-gray-300 hover:border-blue-400'
                }`}
              >
                <div className="font-semibold">{pair.name}</div>
                <div className="text-xs text-gray-600">{pair.symbol}</div>
              </button>
            ))}
          </div>
        </div>
        
        {/* Pool Info */}
        {loadingPairInfo ? (
          <div className="text-center py-4 text-gray-600">Loading pool data...</div>
        ) : pairInfo && pairInfo.exists ? (
          <div className="bg-gray-50 p-4 rounded-lg mb-6">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-gray-600">Pool Ratio</div>
                <div className="font-semibold">
                  1 {pairInfo.symbolA} = {pairInfo.priceAtoB?.toFixed(6)} {pairInfo.symbolB}
                </div>
              </div>
              <div>
                <div className="text-gray-600">Your LP Balance</div>
                <div className="font-semibold">{parseFloat(lpBalance).toFixed(6)} LP</div>
              </div>
            </div>
          </div>
        ) : null}
        
        {/* Amount Inputs */}
        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {selectedPair.name.split('/')[0]} Amount
            </label>
            <input
              type="number"
              value={amountA}
              onChange={(e) => handleAmountAChange(e.target.value)}
              placeholder="0.0"
              className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
              disabled={isApproving || isAddingLiquidity}
            />
          </div>
          
          <div className="text-center text-gray-500">+</div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {selectedPair.name.split('/')[1]} Amount
            </label>
            <input
              type="number"
              value={amountB}
              onChange={(e) => handleAmountBChange(e.target.value)}
              placeholder="0.0"
              className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
              disabled={isApproving || isAddingLiquidity}
            />
          </div>
        </div>
        
        {/* Estimated LP Tokens */}
        {estimatedLP && (
          <div className="bg-green-50 p-3 rounded-lg mb-6">
            <div className="text-sm text-gray-700">
              <strong>Estimated LP Tokens:</strong> {estimatedLP} {selectedPair.symbol}
            </div>
          </div>
        )}
        
        {/* Settings Toggle */}
        <button
          onClick={() => setShowSettings(!showSettings)}
          className="text-blue-600 hover:text-blue-700 text-sm mb-4"
        >
          ⚙️ {showSettings ? 'Hide' : 'Show'} Settings
        </button>
        
        {/* Settings Panel */}
        {showSettings && (
          <div className="bg-gray-50 p-4 rounded-lg mb-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Slippage Tolerance: {slippage}%
              </label>
              <input
                type="range"
                min="0.1"
                max="5"
                step="0.1"
                value={slippage}
                onChange={(e) => setSlippage(parseFloat(e.target.value))}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-600 mt-1">
                <span>0.1%</span>
                <span>5%</span>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Transaction Deadline: {deadline} minutes
              </label>
              <input
                type="number"
                min="1"
                max="60"
                value={deadline}
                onChange={(e) => setDeadline(parseInt(e.target.value))}
                className="w-full p-2 border-2 border-gray-300 rounded-lg"
              />
            </div>
          </div>
        )}
        
        {/* Status Messages */}
        {txMessage && (
          <div className="bg-blue-50 border-2 border-blue-200 p-3 rounded-lg mb-4">
            <p className="text-blue-800 text-sm">{txMessage}</p>
          </div>
        )}
        
        {txError && (
          <div className="bg-red-50 border-2 border-red-200 p-3 rounded-lg mb-4">
            <p className="text-red-800 text-sm">{txError}</p>
          </div>
        )}
        
        {/* Action Buttons */}
        <div className="space-y-3">
          {/* Approval Buttons */}
          {needsApprovalA && (
            <Button
              onClick={() => approveToken(selectedPair.tokenA, selectedPair.name.split('/')[0])}
              disabled={isApproving || isAddingLiquidity}
              className="w-full bg-yellow-600 hover:bg-yellow-700 text-white"
            >
              {isApproving ? 'Approving...' : `Approve ${selectedPair.name.split('/')[0]}`}
            </Button>
          )}
          
          {needsApprovalB && !selectedPair.isNative && (
            <Button
              onClick={() => approveToken(selectedPair.tokenB, selectedPair.name.split('/')[1])}
              disabled={isApproving || isAddingLiquidity}
              className="w-full bg-yellow-600 hover:bg-yellow-700 text-white"
            >
              {isApproving ? 'Approving...' : `Approve ${selectedPair.name.split('/')[1]}`}
            </Button>
          )}
          
          {/* Add Liquidity Button */}
          <Button
            onClick={addLiquidity}
            disabled={
              !account ||
              !amountA ||
              !amountB ||
              needsApprovalA ||
              needsApprovalB ||
              isApproving ||
              isAddingLiquidity ||
              !pairInfo?.exists
            }
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
          >
            {isAddingLiquidity ? 'Adding Liquidity...' : '💧 Add Liquidity'}
          </Button>
        </div>
        
        {/* Helper Text */}
        {!account && (
          <p className="text-sm text-gray-600 text-center mt-4">
            Connect your wallet to provide liquidity
          </p>
        )}
      </CardContent>
    </Card>
  );
}
