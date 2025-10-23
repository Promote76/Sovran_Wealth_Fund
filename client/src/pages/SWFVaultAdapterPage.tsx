import React, { useState, useEffect } from 'react';
import { useWallet } from '../contexts/WalletContext';
import { ethers } from 'ethers';
import { getContractConfig, ERC20_ABI } from '../config/contracts';

const contracts = getContractConfig();
const VAULT_ADAPTER_ADDRESS = contracts.VAULT_ADAPTER.address;
const VAULT_ADAPTER_ABI = contracts.VAULT_ADAPTER.abi;
const AXM_TOKEN_ADDRESS = contracts.AXM_TOKEN;

const SWFVaultAdapterPage: React.FC = () => {
  const { account, connectWallet, disconnectWallet } = useWallet();
  
  // State
  const [loading, setLoading] = useState(false);
  const [userDeposit, setUserDeposit] = useState('0');
  const [userBalance, setUserBalance] = useState('0');
  const [totalVaultDeposits, setTotalVaultDeposits] = useState('0');
  const [allowance, setAllowance] = useState('0');
  const [tokenDecimals, setTokenDecimals] = useState(18);
  
  // Form state
  const [depositAmount, setDepositAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  
  // Transaction state
  const [txStatus, setTxStatus] = useState<{
    type: 'approve' | 'deposit' | 'withdraw' | null;
    status: 'pending' | 'success' | 'error' | null;
    message: string;
    txHash?: string;
  }>({ type: null, status: null, message: '' });

  // Load data
  const loadVaultData = async () => {
    if (!account || !window.ethereum) return;
    
    try {
      setLoading(true);
      
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      
      const vaultContract = new ethers.Contract(
        VAULT_ADAPTER_ADDRESS,
        VAULT_ADAPTER_ABI,
        provider
      );
      
      const tokenContract = new ethers.Contract(
        AXM_TOKEN_ADDRESS,
        ERC20_ABI,
        provider
      );

      const [
        userDepositData,
        userBalanceData,
        totalDepositsData,
        allowanceData,
        decimals
      ] = await Promise.all([
        vaultContract.deposits(account),
        tokenContract.balanceOf(account),
        vaultContract.totalDeposits(),
        tokenContract.allowance(account, VAULT_ADAPTER_ADDRESS),
        tokenContract.decimals()
      ]);

      setTokenDecimals(decimals);
      setUserDeposit(ethers.utils.formatUnits(userDepositData, decimals));
      setUserBalance(ethers.utils.formatUnits(userBalanceData, decimals));
      setTotalVaultDeposits(ethers.utils.formatUnits(totalDepositsData, decimals));
      setAllowance(ethers.utils.formatUnits(allowanceData, decimals));
      
    } catch (error) {
      console.error('Error loading vault data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (account) {
      loadVaultData();
    }
  }, [account]);

  // Approve tokens
  const handleApprove = async () => {
    if (!account || !window.ethereum) return;
    
    try {
      setTxStatus({ type: 'approve', status: 'pending', message: 'Approving AXM tokens...' });
      
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = await provider.getSigner();
      const tokenContract = new ethers.Contract(AXM_TOKEN_ADDRESS, ERC20_ABI, signer);
      
      // Approve max amount
      const maxApproval = ethers.constants.MaxUint256;
      const tx = await tokenContract.approve(VAULT_ADAPTER_ADDRESS, maxApproval);
      
      setTxStatus({ 
        type: 'approve', 
        status: 'pending', 
        message: 'Transaction submitted. Waiting for confirmation...', 
        txHash: tx.hash 
      });
      
      await tx.wait();
      
      setTxStatus({ 
        type: 'approve', 
        status: 'success', 
        message: 'Approval successful! You can now deposit AXM tokens.', 
        txHash: tx.hash 
      });
      
      await loadVaultData();
      
      setTimeout(() => {
        setTxStatus({ type: null, status: null, message: '' });
      }, 5000);
      
    } catch (error: any) {
      setTxStatus({ 
        type: 'approve', 
        status: 'error', 
        message: error.message || 'Approval failed. Please try again.' 
      });
    }
  };

  // Deposit tokens
  const handleDeposit = async () => {
    if (!account || !depositAmount || !window.ethereum) return;
    
    try {
      const amount = parseFloat(depositAmount);
      if (amount <= 0 || amount > parseFloat(userBalance)) {
        setTxStatus({ type: 'deposit', status: 'error', message: 'Invalid amount' });
        return;
      }
      
      setTxStatus({ type: 'deposit', status: 'pending', message: 'Depositing tokens...' });
      
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = await provider.getSigner();
      const vaultContract = new ethers.Contract(VAULT_ADAPTER_ADDRESS, VAULT_ADAPTER_ABI, signer);
      
      const amountWei = ethers.utils.parseUnits(depositAmount, tokenDecimals);
      const tx = await vaultContract.deposit(amountWei);
      
      setTxStatus({ 
        type: 'deposit', 
        status: 'pending', 
        message: 'Transaction submitted. Waiting for confirmation...', 
        txHash: tx.hash 
      });
      
      await tx.wait();
      
      setTxStatus({ 
        type: 'deposit', 
        status: 'success', 
        message: 'Deposit successful! Your AXM is now in the vault.', 
        txHash: tx.hash 
      });
      
      setDepositAmount('');
      await loadVaultData();
      
      setTimeout(() => {
        setTxStatus({ type: null, status: null, message: '' });
      }, 5000);
      
    } catch (error: any) {
      setTxStatus({ 
        type: 'deposit', 
        status: 'error', 
        message: error.message || 'Deposit failed. Please try again.' 
      });
    }
  };

  // Withdraw tokens
  const handleWithdraw = async () => {
    if (!account || !withdrawAmount || !window.ethereum) return;
    
    try {
      const amount = parseFloat(withdrawAmount);
      if (amount <= 0 || amount > parseFloat(userDeposit)) {
        setTxStatus({ type: 'withdraw', status: 'error', message: 'Invalid amount' });
        return;
      }
      
      setTxStatus({ type: 'withdraw', status: 'pending', message: 'Withdrawing tokens...' });
      
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = await provider.getSigner();
      const vaultContract = new ethers.Contract(VAULT_ADAPTER_ADDRESS, VAULT_ADAPTER_ABI, signer);
      
      const amountWei = ethers.utils.parseUnits(withdrawAmount, tokenDecimals);
      const tx = await vaultContract.withdraw(amountWei);
      
      setTxStatus({ 
        type: 'withdraw', 
        status: 'pending', 
        message: 'Transaction submitted. Waiting for confirmation...', 
        txHash: tx.hash 
      });
      
      await tx.wait();
      
      setTxStatus({ 
        type: 'withdraw', 
        status: 'success', 
        message: 'Withdrawal successful! AXM returned to your wallet.', 
        txHash: tx.hash 
      });
      
      setWithdrawAmount('');
      await loadVaultData();
      
      setTimeout(() => {
        setTxStatus({ type: null, status: null, message: '' });
      }, 5000);
      
    } catch (error: any) {
      setTxStatus({ 
        type: 'withdraw', 
        status: 'error', 
        message: error.message || 'Withdrawal failed. Please try again.' 
      });
    }
  };

  // Transaction status component
  const TransactionStatus = () => {
    if (!txStatus.status) return null;

    const bgColor = txStatus.status === 'success' 
      ? 'bg-green-50 border-green-200' 
      : txStatus.status === 'error' 
      ? 'bg-red-50 border-red-200' 
      : 'bg-blue-50 border-blue-200';

    const textColor = txStatus.status === 'success' 
      ? 'text-green-800' 
      : txStatus.status === 'error' 
      ? 'text-red-800' 
      : 'text-blue-800';

    return (
      <div className={`p-4 rounded-lg border-2 ${bgColor} ${textColor} mb-6`}>
        <p className="font-semibold">{txStatus.message}</p>
        {txStatus.txHash && (
          <a
            href={`https://bscscan.com/tx/${txStatus.txHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm underline mt-2 block"
          >
            View on BSCScan
          </a>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-blue-50 py-12 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-blue-900 mb-4">
            🏦 AXIOM Sovereign Wealth Vault
          </h1>
          <p className="text-xl text-gray-700 max-w-3xl mx-auto">
            Deposit your AXM tokens into the Sovereign Wealth Fund vault to participate in collective wealth generation
          </p>
        </div>

        {/* Wallet Connection */}
        {!account ? (
          <div className="bg-white rounded-xl shadow-lg p-8 mb-8 text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Connect Your Wallet</h2>
            <p className="text-gray-600 mb-6">
              Connect your wallet to deposit AXM tokens into the vault
            </p>
            <button
              onClick={connectWallet}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg transition-colors"
            >
              Connect Wallet
            </button>
          </div>
        ) : (
          <>
            {/* Transaction Status */}
            <TransactionStatus />

            {/* Vault Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-sm font-semibold text-gray-600 mb-2">Your Deposit</h3>
                <p className="text-3xl font-bold text-blue-900">
                  {loading ? '...' : parseFloat(userDeposit).toFixed(2)} AXM
                </p>
              </div>
              
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-sm font-semibold text-gray-600 mb-2">Your Balance</h3>
                <p className="text-3xl font-bold text-green-700">
                  {loading ? '...' : parseFloat(userBalance).toFixed(2)} AXM
                </p>
              </div>
              
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-sm font-semibold text-gray-600 mb-2">Total Vault Deposits</h3>
                <p className="text-3xl font-bold text-purple-700">
                  {loading ? '...' : parseFloat(totalVaultDeposits).toFixed(2)} AXM
                </p>
              </div>
            </div>

            {/* Approval Section */}
            {parseFloat(allowance) === 0 && (
              <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-6 mb-8">
                <h3 className="text-xl font-bold text-yellow-900 mb-3">⚠️ Approval Required</h3>
                <p className="text-yellow-800 mb-4">
                  Before depositing, you need to approve the vault to access your AXM tokens. This is a one-time transaction.
                </p>
                <button
                  onClick={handleApprove}
                  disabled={txStatus.type === 'approve' && txStatus.status === 'pending'}
                  className="bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-2 px-6 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {txStatus.type === 'approve' && txStatus.status === 'pending' ? 'Approving...' : 'Approve AXM'}
                </button>
              </div>
            )}

            {/* Deposit & Withdraw Forms */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
              {/* Deposit */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-2xl font-bold text-blue-900 mb-4">💰 Deposit AXM</h3>
                <p className="text-gray-600 mb-6">
                  Deposit your AXM tokens to participate in the Sovereign Wealth Fund
                </p>
                
                <div className="mb-4">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Amount to Deposit
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={depositAmount}
                      onChange={(e) => setDepositAmount(e.target.value)}
                      placeholder="0.00"
                      className="flex-1 px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                    />
                    <button
                      onClick={() => setDepositAmount(userBalance)}
                      className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg font-semibold transition-colors"
                    >
                      MAX
                    </button>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    Available: {parseFloat(userBalance).toFixed(2)} AXM
                  </p>
                </div>

                <button
                  onClick={handleDeposit}
                  disabled={
                    !depositAmount || 
                    parseFloat(depositAmount) <= 0 || 
                    parseFloat(allowance) === 0 ||
                    (txStatus.type === 'deposit' && txStatus.status === 'pending')
                  }
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {txStatus.type === 'deposit' && txStatus.status === 'pending' ? 'Depositing...' : 'Deposit AXM'}
                </button>
              </div>

              {/* Withdraw */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-2xl font-bold text-orange-900 mb-4">💸 Withdraw AXM</h3>
                <p className="text-gray-600 mb-6">
                  Withdraw your deposited AXM tokens back to your wallet
                </p>
                
                <div className="mb-4">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Amount to Withdraw
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={withdrawAmount}
                      onChange={(e) => setWithdrawAmount(e.target.value)}
                      placeholder="0.00"
                      className="flex-1 px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-orange-500 focus:outline-none"
                    />
                    <button
                      onClick={() => setWithdrawAmount(userDeposit)}
                      className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg font-semibold transition-colors"
                    >
                      MAX
                    </button>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    Deposited: {parseFloat(userDeposit).toFixed(2)} AXM
                  </p>
                </div>

                <button
                  onClick={handleWithdraw}
                  disabled={
                    !withdrawAmount || 
                    parseFloat(withdrawAmount) <= 0 || 
                    parseFloat(userDeposit) === 0 ||
                    (txStatus.type === 'withdraw' && txStatus.status === 'pending')
                  }
                  className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-3 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {txStatus.type === 'withdraw' && txStatus.status === 'pending' ? 'Withdrawing...' : 'Withdraw AXM'}
                </button>
              </div>
            </div>

            {/* Educational Content */}
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl shadow-lg p-8">
              <h3 className="text-2xl font-bold text-blue-900 mb-6">📚 About the Sovereign Wealth Vault</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-bold text-lg text-blue-800 mb-2">🏛️ Collective Wealth Building</h4>
                  <p className="text-gray-700">
                    The Sovereign Wealth Vault pools AXM tokens from the community to create a collective treasury 
                    that generates returns for all participants.
                  </p>
                </div>

                <div>
                  <h4 className="font-bold text-lg text-blue-800 mb-2">🔒 Secure Storage</h4>
                  <p className="text-gray-700">
                    Your deposits are secured by smart contracts on the Binance Smart Chain, with full transparency 
                    and verifiable on-chain records.
                  </p>
                </div>

                <div>
                  <h4 className="font-bold text-lg text-blue-800 mb-2">💎 Long-term Value</h4>
                  <p className="text-gray-700">
                    The vault participates in AXIOM's ecosystem activities, including staking, liquidity provision, 
                    and governance, generating sustainable returns.
                  </p>
                </div>

                <div>
                  <h4 className="font-bold text-lg text-blue-800 mb-2">🔄 Flexible Access</h4>
                  <p className="text-gray-700">
                    You maintain control of your deposits and can withdraw your AXM tokens at any time. 
                    No lock-up periods or withdrawal penalties.
                  </p>
                </div>
              </div>

              <div className="mt-6 p-4 bg-blue-100 rounded-lg border-2 border-blue-300">
                <p className="text-sm text-blue-900">
                  <strong>Contract Address:</strong> <code className="bg-white px-2 py-1 rounded">{VAULT_ADAPTER_ADDRESS}</code>
                  <a 
                    href={`https://bscscan.com/address/${VAULT_ADAPTER_ADDRESS}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-2 text-blue-600 hover:underline"
                  >
                    View on BSCScan →
                  </a>
                </p>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default SWFVaultAdapterPage;
