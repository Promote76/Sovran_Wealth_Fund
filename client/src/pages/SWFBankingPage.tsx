import React, { useState, useEffect } from 'react';
import { useBSCContracts } from '../hooks/useBSCContracts';
import { useWallet } from '../contexts/WalletContext';
import { useNotificationHelpers } from '../components/NotificationSystem';
import { WalletConnect } from '../components/web3/wallet-connect';
import { TabNav } from '../components/ui/TabNav';

interface Transaction {
  id: string;
  type: 'deposit' | 'withdrawal' | 'transfer' | 'payment';
  amount: number;
  description: string;
  date: string;
  timestamp: string; // Raw ISO timestamp for sorting
  balance: number;
  category?: string;
}

interface SavingsGoal {
  id: string;
  name: string;
  target: number;
  current: number;
  deadline: string;
  monthlyContribution: number;
}

interface LoanProduct {
  type: string;
  rate: string;
  term: string;
  minAmount: string;
  maxAmount: string;
  description: string;
}

interface Investment {
  symbol: string;
  name: string;
  shares: number;
  currentPrice: number;
  totalValue: number;
  gainLoss: number;
  gainLossPercent: number;
  sector: string;
}

const TABS = [
  { key: 'overview', label: 'Overview' },
  { key: 'checking', label: 'Checking' },
  { key: 'savings', label: 'Savings' },
  { key: 'loans', label: 'Loans' },
  { key: 'investments', label: 'Investments' },
  { key: 'defi-lending', label: 'DeFi-Lending' },
  { key: 'compliance', label: 'ISO 20022' }
];

const SWFBankingPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const { showInfo, showError, showSuccess, showWarning } = useNotificationHelpers();
  
  // Wallet connection state
  const {
    isConnected: walletConnected,
    account: walletAddress,
    isLoggedIn,
    userInfo,
    connectWallet,
    isConnecting,
    loginError
  } = useWallet();

  // DEBUGGING: Log wallet state immediately
  console.log('🔍 SWFBankingPage WALLET DEBUG:', { 
    walletConnected, 
    walletAddress, 
    isLoggedIn, 
    userInfo: userInfo ? 'exists' : 'null',
    activeTab
  });
  
  // Contract state  
  const {
    isLoading,
    error,
    isConnected,
    userAddress,
    data: contractData,
    networkSupported,
    initializeContracts,
    switchToBSC,
    loadContractData,
    stakeTokens,
    withdrawStake,
    claimRewards,
    depositToVault,
    withdrawFromVault,
    supplyToVenus,
    redeemFromVenus,
    borrowFromVenus,
    repayVenusBorrow,
    enterVenusMarkets,
    exitVenusMarket,
    claimXVSRewards,
    CONTRACT_ADDRESSES,
    formatEther,
    parseEther
  } = useBSCContracts();
  const [transferAmount, setTransferAmount] = useState('');
  const [transferType, setTransferType] = useState('checking-to-savings');
  const [loanAmount, setLoanAmount] = useState('50000');
  const [loanTerm, setLoanTerm] = useState('30');
  const [interestRate, setInterestRate] = useState('6.5');
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [filterCategory, setFilterCategory] = useState('all');
  const [newGoalName, setNewGoalName] = useState('');
  const [newGoalTarget, setNewGoalTarget] = useState('');
  const [newGoalDeadline, setNewGoalDeadline] = useState('');
  
  // Venus Protocol state
  const [venusSupplyAmount, setVenusSupplyAmount] = useState('');
  const [venusBorrowAmount, setVenusBorrowAmount] = useState('');
  const [venusRepayAmount, setVenusRepayAmount] = useState('');
  const [selectedVToken, setSelectedVToken] = useState('vBNB');
  const [venusAction, setVenusAction] = useState<'supply' | 'borrow' | 'repay' | 'redeem'>('supply');

  // Savings products state
  const [roundUpEnabled, setRoundUpEnabled] = useState(false);
  const [autoTransferEnabled, setAutoTransferEnabled] = useState(true);
  const [autoTransferAmount, setAutoTransferAmount] = useState('500');
  const [autoTransferDay, setAutoTransferDay] = useState('1');

  // Checking accounts state
  const [checkingAccounts, setCheckingAccounts] = useState<any[]>([]);
  const [showCreateCheckingModal, setShowCreateCheckingModal] = useState(false);
  const [checkingAccountName, setCheckingAccountName] = useState('');
  const [checkingInitialDeposit, setCheckingInitialDeposit] = useState('');

  // Savings accounts state
  const [savingsAccounts, setSavingsAccounts] = useState<any[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<any | null>(null);
  const [showCreateHYSAModal, setShowCreateHYSAModal] = useState(false);
  const [showCreateCDModal, setShowCreateCDModal] = useState(false);
  const [showAccountDetailModal, setShowAccountDetailModal] = useState(false);
  const [accountTransactions, setAccountTransactions] = useState<any[]>([]);
  const [initialDepositAmount, setInitialDepositAmount] = useState('');
  const [depositAmount, setDepositAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [accountsLoading, setAccountsLoading] = useState(false);

  // State for transactions from all checking accounts
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [transactionsLoading, setTransactionsLoading] = useState(false);

  // Savings goals state
  const [savingsGoals, setSavingsGoals] = useState<SavingsGoal[]>([]);
  const [goalsLoading, setGoalsLoading] = useState(false);
  const [showCreateGoalModal, setShowCreateGoalModal] = useState(false);
  const [newGoalData, setNewGoalData] = useState({
    name: '',
    target: '',
    deadline: '',
    monthlyContribution: ''
  });

  const loanProducts: LoanProduct[] = [
    { 
      type: 'Personal Loan', 
      rate: '6.99% - 24.99%', 
      term: '2-7 years', 
      minAmount: '$1,000', 
      maxAmount: '$50,000',
      description: 'Flexible personal loans for any purpose. No collateral required. Fast approval process.'
    },
    { 
      type: 'Auto Loan', 
      rate: '3.49% - 8.99%', 
      term: '3-8 years', 
      minAmount: '$5,000', 
      maxAmount: '$150,000',
      description: 'Competitive rates for new and used vehicles. Quick financing with flexible terms.'
    },
    { 
      type: 'Mortgage', 
      rate: '6.25% - 7.75%', 
      term: '15-30 years', 
      minAmount: '$50,000', 
      maxAmount: '$2,000,000',
      description: 'Home purchase or refinancing with competitive rates and personalized service.'
    },
    { 
      type: 'Home Equity Line', 
      rate: '7.25% - 12.99%', 
      term: '5-20 years', 
      minAmount: '$10,000', 
      maxAmount: '$500,000',
      description: 'Access your home equity for major expenses. Variable rate with flexible draw period.'
    }
  ];

  // Real blockchain investments - SWF staking shown from blockchain data
  const investments: Investment[] = [];

  // State for server-fetched blockchain data
  const [blockchainData, setBlockchainData] = useState<{
    swfBalance: string;
    symbol: string;
    stakedAmount: string;
    pendingRewards: string;
    currentAPR: string;
    vaultBalance: string;
    userDeposits: string;
  } | null>(null);
  const [balanceLoading, setBalanceLoading] = useState(false);

  // Fetch comprehensive blockchain data from server when wallet is authenticated
  useEffect(() => {
    const fetchBlockchainData = async () => {
      if (walletConnected && isLoggedIn && walletAddress) {
        console.log('📊 Fetching comprehensive blockchain data from server...');
        setBalanceLoading(true);
        try {
          const response = await fetch(`/api/wallet/data/${walletAddress}`);
          const data = await response.json();
          
          if (data.success) {
            console.log('✅ Blockchain data fetched:', data.data);
            setBlockchainData(data.data);
          } else {
            console.error('❌ Failed to fetch blockchain data:', data.error);
          }
        } catch (error) {
          console.error('❌ Error fetching blockchain data:', error);
        } finally {
          setBalanceLoading(false);
        }
      }
    };
    
    fetchBlockchainData();
  }, [walletConnected, isLoggedIn, walletAddress]);

  // Initialize blockchain contracts when wallet is connected and authenticated
  useEffect(() => {
    const initBlockchain = async () => {
      if (walletConnected && isLoggedIn && !isConnected) {
        console.log('🔗 Initializing blockchain contracts...');
        try {
          await initializeContracts();
          console.log('✅ Blockchain contracts initialized successfully');
        } catch (error) {
          console.error('❌ Failed to initialize blockchain contracts:', error);
        }
      }
    };
    
    initBlockchain();
  }, [walletConnected, isLoggedIn, isConnected, initializeContracts]);

  const calculateLoanPayment = (principal: number, rate: number, years: number) => {
    const monthlyRate = rate / 100 / 12;
    const numberOfPayments = years * 12;
    const monthlyPayment = principal * (monthlyRate * Math.pow(1 + monthlyRate, numberOfPayments)) / (Math.pow(1 + monthlyRate, numberOfPayments) - 1);
    return monthlyPayment;
  };

  // Savings Products Handlers
  const handleOpenHighYieldAccount = () => {
    if (!walletConnected || !isLoggedIn) {
      showWarning('Wallet Required', 'Please connect your wallet and authenticate to open a High-Yield Savings account.');
      return;
    }
    
    setShowCreateHYSAModal(true);
  };

  const handleCertificateOfDeposit = () => {
    if (!walletConnected || !isLoggedIn) {
      showWarning('Wallet Required', 'Please connect your wallet and authenticate to open a Certificate of Deposit account.');
      return;
    }
    
    setShowCreateCDModal(true);
  };

  const handleToggleRoundUp = () => {
    if (!walletConnected || !isLoggedIn) {
      showWarning('Wallet Required', 'Please connect your wallet and authenticate to enable Round-Up Savings.');
      return;
    }
    
    showInfo(
      'Manage Settings',
      'Round-Up Savings settings can be managed from within your individual savings account. Open or view a savings account to configure this feature.'
    );
  };

  const handleManageAutoTransfer = () => {
    if (!walletConnected || !isLoggedIn) {
      showWarning('Wallet Required', 'Please connect your wallet and authenticate to manage auto-transfers.');
      return;
    }
    
    showInfo(
      'Manage Settings',
      'Auto-Transfer settings can be managed from within your individual savings account. Open or view a savings account to configure this feature.'
    );
  };

  // Savings Account API Functions
  const fetchSavingsAccounts = async () => {
    const token = localStorage.getItem('auth-token');
    if (!walletConnected || !isLoggedIn || !token) return;
    
    setAccountsLoading(true);
    try {
      const response = await fetch('/api/savings/accounts', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      
      if (data.success) {
        setSavingsAccounts(data.data);
        console.log('✅ Savings accounts loaded:', data.data);
      } else {
        showError('Error', data.error || 'Failed to load savings accounts');
      }
    } catch (error) {
      console.error('❌ Error fetching savings accounts:', error);
      showError('Error', 'Failed to load savings accounts');
    } finally {
      setAccountsLoading(false);
    }
  };

  const fetchCheckingAccounts = async () => {
    const token = localStorage.getItem('auth-token');
    if (!walletConnected || !isLoggedIn || !token) return;
    
    setAccountsLoading(true);
    try {
      const response = await fetch('/api/checking/accounts', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      
      if (data.success) {
        setCheckingAccounts(data.data);
        console.log('✅ Checking accounts loaded:', data.data);
        
        // Fetch transactions for all checking accounts
        if (data.data && data.data.length > 0) {
          fetchAllTransactions(data.data);
        }
      } else {
        showError('Error', data.error || 'Failed to load checking accounts');
      }
    } catch (error) {
      console.error('❌ Error fetching checking accounts:', error);
      showError('Error', 'Failed to load checking accounts');
    } finally {
      setAccountsLoading(false);
    }
  };
  
  const fetchAllTransactions = async (accounts: any[]) => {
    const token = localStorage.getItem('auth-token');
    if (!token || accounts.length === 0) return;
    
    setTransactionsLoading(true);
    try {
      const allTransactions: Transaction[] = [];
      
      for (const account of accounts) {
        const response = await fetch(`/api/checking/accounts/${account.id}/transactions`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        const data = await response.json();
        
        if (data.success && data.data) {
          // Transform API transactions to match UI format
          const transformedTx = data.data.map((tx: any) => ({
            id: tx.id.toString(),
            type: tx.txType as 'deposit' | 'withdrawal' | 'transfer' | 'payment',
            amount: parseFloat(tx.amount),
            description: tx.description || tx.txType,
            date: new Date(tx.createdAt).toLocaleDateString(),
            timestamp: tx.createdAt, // Store raw ISO timestamp for reliable sorting
            balance: parseFloat(tx.balanceAfter || account.ledgerBalance),
            category: tx.category || 'general'
          }));
          allTransactions.push(...transformedTx);
        }
      }
      
      // Sort by timestamp (most recent first) - using raw ISO timestamp for reliable cross-locale sorting
      allTransactions.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setTransactions(allTransactions);
      console.log('✅ Loaded', allTransactions.length, 'transactions from checking accounts');
    } catch (error) {
      console.error('❌ Error fetching transactions:', error);
    } finally {
      setTransactionsLoading(false);
    }
  };

  const createCheckingAccount = async () => {
    const token = localStorage.getItem('auth-token');
    if (!walletConnected || !isLoggedIn || !token) {
      showWarning('Authentication Required', 'Please connect your wallet and log in');
      return;
    }
    
    if (!checkingAccountName.trim()) {
      showWarning('Account Name Required', 'Please enter a name for your checking account');
      return;
    }
    
    try {
      const response = await fetch('/api/checking/accounts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          accountName: checkingAccountName,
          initialDeposit: checkingInitialDeposit || '0'
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        showSuccess('Account Created!', 'Your checking account has been created successfully.');
        setShowCreateCheckingModal(false);
        setCheckingAccountName('');
        setCheckingInitialDeposit('');
        fetchCheckingAccounts();
      } else {
        showError('Error', data.error || 'Failed to create account');
      }
    } catch (error) {
      console.error('❌ Error creating checking account:', error);
      showError('Error', 'Failed to create account');
    }
  };

  const createSavingsAccount = async (type: 'hysa' | 'cd') => {
    const token = localStorage.getItem('auth-token');
    if (!walletConnected || !isLoggedIn || !token) {
      showWarning('Authentication Required', 'Please connect your wallet and log in');
      return;
    }
    
    try {
      const response = await fetch('/api/savings/accounts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          type,
          initialDeposit: initialDepositAmount || '0'
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        showSuccess('Account Created!', `Your ${type === 'hysa' ? 'High-Yield Savings' : 'Certificate of Deposit'} account has been created successfully.`);
        setShowCreateHYSAModal(false);
        setShowCreateCDModal(false);
        setInitialDepositAmount('');
        fetchSavingsAccounts();
      } else {
        showError('Error', data.error || 'Failed to create account');
      }
    } catch (error) {
      console.error('❌ Error creating account:', error);
      showError('Error', 'Failed to create account');
    }
  };

  const fetchAccountDetails = async (accountId: number) => {
    const token = localStorage.getItem('auth-token');
    if (!token) return;
    
    try {
      const [detailsRes, transactionsRes] = await Promise.all([
        fetch(`/api/savings/accounts/detail/${accountId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`/api/savings/accounts/${accountId}/transactions?limit=50`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);
      
      const detailsData = await detailsRes.json();
      const transactionsData = await transactionsRes.json();
      
      if (detailsData.success) {
        setSelectedAccount(detailsData.data);
        setAccountTransactions(transactionsData.success ? transactionsData.data : []);
        setShowAccountDetailModal(true);
      }
    } catch (error) {
      console.error('❌ Error fetching account details:', error);
      showError('Error', 'Failed to load account details');
    }
  };

  const handleDeposit = async () => {
    const token = localStorage.getItem('auth-token');
    if (!selectedAccount || !token || !depositAmount) return;
    
    try {
      const response = await fetch(`/api/savings/accounts/${selectedAccount.id}/deposit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ amount: depositAmount })
      });
      
      const data = await response.json();
      
      if (data.success) {
        showSuccess('Deposit Successful', `Deposited ${depositAmount} SWF tokens to your account`);
        setDepositAmount('');
        fetchAccountDetails(selectedAccount.id);
        fetchSavingsAccounts();
      } else {
        showError('Error', data.error || 'Failed to process deposit');
      }
    } catch (error) {
      console.error('❌ Error processing deposit:', error);
      showError('Error', 'Failed to process deposit');
    }
  };

  const handleWithdraw = async () => {
    const token = localStorage.getItem('auth-token');
    if (!selectedAccount || !token || !withdrawAmount) return;
    
    try {
      const response = await fetch(`/api/savings/accounts/${selectedAccount.id}/withdraw`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ amount: withdrawAmount })
      });
      
      const data = await response.json();
      
      if (data.success) {
        const penaltyMsg = data.penalty && parseFloat(data.penalty) > 0 
          ? ` (Early withdrawal penalty: ${data.penalty} SWF)` 
          : '';
        showSuccess('Withdrawal Successful', `Withdrew ${withdrawAmount} SWF tokens${penaltyMsg}`);
        setWithdrawAmount('');
        fetchAccountDetails(selectedAccount.id);
        fetchSavingsAccounts();
      } else {
        showError('Error', data.error || 'Failed to process withdrawal');
      }
    } catch (error) {
      console.error('❌ Error processing withdrawal:', error);
      showError('Error', 'Failed to process withdrawal');
    }
  };

  const handleCloseAccount = async () => {
    const token = localStorage.getItem('auth-token');
    if (!selectedAccount || !token) return;
    
    if (!window.confirm('Are you sure you want to close this account? This action cannot be undone.')) {
      return;
    }
    
    try {
      const response = await fetch(`/api/savings/accounts/${selectedAccount.id}/close`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const data = await response.json();
      
      if (data.success) {
        showSuccess('Account Closed', 'Your savings account has been closed successfully');
        setShowAccountDetailModal(false);
        setSelectedAccount(null);
        fetchSavingsAccounts();
      } else {
        showError('Error', data.error || 'Failed to close account');
      }
    } catch (error) {
      console.error('❌ Error closing account:', error);
      showError('Error', 'Failed to close account');
    }
  };

  // Fetch savings goals
  const fetchSavingsGoals = async () => {
    const token = localStorage.getItem('auth-token');
    if (!walletConnected || !isLoggedIn || !token) return;
    
    setGoalsLoading(true);
    try {
      const response = await fetch('/api/savings/goals', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      
      if (data.success) {
        setSavingsGoals(data.data);
        console.log('✅ Savings goals loaded:', data.data);
      } else {
        console.error('❌ Failed to load savings goals:', data.error);
      }
    } catch (error) {
      console.error('❌ Error fetching savings goals:', error);
    } finally {
      setGoalsLoading(false);
    }
  };

  // Create new savings goal
  const createSavingsGoal = async () => {
    const token = localStorage.getItem('auth-token');
    if (!token) return;
    
    if (!newGoalData.name || !newGoalData.target || !newGoalData.deadline) {
      showWarning('Missing Information', 'Please fill in all required fields');
      return;
    }
    
    try {
      const response = await fetch('/api/savings/goals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          goalName: newGoalData.name,
          targetAmount: newGoalData.target,
          targetDate: newGoalData.deadline,
          monthlyContribution: newGoalData.monthlyContribution || '0'
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        showSuccess('Goal Created!', `Your savings goal "${newGoalData.name}" has been created`);
        setShowCreateGoalModal(false);
        setNewGoalData({ name: '', target: '', deadline: '', monthlyContribution: '' });
        fetchSavingsGoals();
      } else {
        showError('Error', data.error || 'Failed to create goal');
      }
    } catch (error) {
      console.error('❌ Error creating savings goal:', error);
      showError('Error', 'Failed to create goal');
    }
  };

  // Fetch checking and savings accounts when wallet is connected
  useEffect(() => {
    if (walletConnected && isLoggedIn) {
      fetchCheckingAccounts();
      fetchSavingsAccounts();
      fetchSavingsGoals();
    }
  }, [walletConnected, isLoggedIn]);

  const filteredTransactions = filterCategory === 'all' 
    ? transactions 
    : transactions.filter(t => t.category === filterCategory);

  const monthlyPayment = calculateLoanPayment(parseFloat(loanAmount), parseFloat(interestRate), parseFloat(loanTerm));

  return (
    <div className="bg-gradient-to-br from-white via-blue-50 to-white min-h-screen">
        {/* Hero Section */}
        <div className="container mx-auto px-4 py-12">
          <div className="text-center mb-12">
            <h1 className="text-5xl font-bold mb-6 text-blue-800">
              Sovereign <span className="text-blue-600">Community Bank</span>
            </h1>
            <p className="text-xl text-gray-700 max-w-3xl mx-auto">
              Your trusted financial partner - empowering communities with innovative banking solutions. 
              Experience blockchain-powered security, transparent operations, and member-focused services.
            </p>
          </div>

          {/* Wallet Connection Alert - Using the working WalletConnect component */}
          {!walletConnected && (
            <div className="max-w-4xl mx-auto mb-8">
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 border-2 border-blue-800 rounded-xl p-8 shadow-xl">
                <div className="text-white mb-6 text-center">
                  <div className="text-3xl mb-4">🔗</div>
                  <h2 className="text-2xl font-bold mb-2">Connect Your Wallet</h2>
                  <p className="text-blue-100 text-lg">
                    Connect your MetaMask wallet to access your banking features and manage your digital assets
                  </p>
                </div>
                
                <div className="max-w-md mx-auto">
                  <WalletConnect 
                    variant="default" 
                    showUserInfo={true}
                  />
                </div>
                
                <div className="text-blue-100 text-sm mt-6 text-center">
                  <p>✅ Secure • ✅ Encrypted • ✅ Decentralized</p>
                </div>
              </div>
            </div>
          )}

          {/* Persistent Wallet Status Bar - Shows when connected */}
          {walletConnected && (
            <div className="max-w-6xl mx-auto mb-8">
              <div className="bg-gradient-to-r from-green-50 to-blue-50 border-2 border-green-500 rounded-xl p-4 shadow-lg">
                <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center text-white text-2xl">
                      ✅
                    </div>
                    <div>
                      <div className="text-lg font-bold text-green-800">
                        Wallet Connected
                      </div>
                      <div className="text-sm text-gray-700">
                        {isLoggedIn && userInfo ? (
                          <span>Welcome, {userInfo.firstName || 'Member'}! • </span>
                        ) : null}
                        <span className="font-mono">
                          {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    {isLoggedIn && contractData && (
                      <div className="bg-white border border-green-300 rounded-lg px-4 py-2">
                        <div className="text-xs text-gray-600">SWF Balance</div>
                        <div className="text-lg font-bold text-blue-600">
                          {parseFloat(contractData.swfBalance).toFixed(2)} {contractData.swfSymbol}
                        </div>
                      </div>
                    )}
                    
                    <WalletConnect 
                      variant="compact" 
                      showUserInfo={false}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Banking Dashboard - Always visible */}
          {walletConnected && (
            <div className="max-w-6xl mx-auto">
              {/* Tab Navigation - Simple and Reliable */}
              <TabNav items={TABS} value={activeTab} onChange={setActiveTab} />

            {/* Full-Featured Account Management Dashboard */}
            {activeTab === 'overview' && (
              <div className="space-y-8">
                {/* Total Assets Summary */}
                <div className="bg-gradient-to-r from-blue-600 to-blue-700 border-2 border-blue-800 rounded-xl p-8 shadow-2xl text-white">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
                    <div>
                      <h2 className="text-lg font-medium text-blue-100 mb-2">Total Assets</h2>
                      <div className="text-5xl font-bold">
                        {!walletConnected || !isLoggedIn ? '$0.00' :
                         accountsLoading ? 'Loading...' :
                         `$${(
                           checkingAccounts.reduce((sum, acc) => sum + parseFloat(acc.availableBalance || 0), 0) +
                           savingsAccounts.reduce((sum, acc) => sum + parseFloat(acc.balance || 0), 0)
                         ).toFixed(2)}`
                        }
                      </div>
                      <div className="text-blue-200 mt-2">
                        {checkingAccounts.length + savingsAccounts.length} Total Accounts
                      </div>
                    </div>
                    <div className="flex space-x-3">
                      <button
                        onClick={() => setShowCreateCheckingModal(true)}
                        className="px-6 py-3 bg-white text-blue-600 rounded-lg font-medium hover:bg-blue-50 transition-colors shadow-lg"
                      >
                        + Checking Account
                      </button>
                      <button
                        onClick={() => setShowCreateHYSAModal(true)}
                        className="px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors shadow-lg"
                      >
                        + Savings Account
                      </button>
                    </div>
                  </div>
                </div>

                {/* Account Type Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-gradient-to-br from-white to-blue-50 border-2 border-blue-400 rounded-xl p-6 shadow-lg">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-blue-800">Checking</h3>
                      <span className="text-3xl">💳</span>
                    </div>
                    <div className="text-3xl font-bold text-blue-600 mb-2">
                      ${checkingAccounts.reduce((sum, acc) => sum + parseFloat(acc.availableBalance || 0), 0).toFixed(2)}
                    </div>
                    <div className="text-sm text-gray-600 mb-4">
                      {checkingAccounts.length} {checkingAccounts.length === 1 ? 'Account' : 'Accounts'}
                    </div>
                    <button 
                      onClick={() => setActiveTab('checking')}
                      className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium text-sm"
                    >
                      Manage Checking
                    </button>
                  </div>

                  <div className="bg-gradient-to-br from-white to-green-50 border-2 border-green-400 rounded-xl p-6 shadow-lg">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-green-800">Savings</h3>
                      <span className="text-3xl">🏦</span>
                    </div>
                    <div className="text-3xl font-bold text-green-600 mb-2">
                      ${savingsAccounts.reduce((sum, acc) => sum + parseFloat(acc.balance || 0), 0).toFixed(2)}
                    </div>
                    <div className="text-sm text-gray-600 mb-4">
                      {savingsAccounts.length} {savingsAccounts.length === 1 ? 'Account' : 'Accounts'} • Up to 6.25% APY
                    </div>
                    <button 
                      onClick={() => setActiveTab('savings')}
                      className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-medium text-sm"
                    >
                      Manage Savings
                    </button>
                  </div>

                  <div className="bg-gradient-to-br from-white to-purple-50 border-2 border-purple-400 rounded-xl p-6 shadow-lg">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-purple-800">Investments</h3>
                      <span className="text-3xl">📈</span>
                    </div>
                    <div className="text-3xl font-bold text-purple-600 mb-2">
                      {blockchainData ? `${parseFloat(blockchainData.stakedAmount).toFixed(2)}` : '0.00'}
                    </div>
                    <div className="text-sm text-gray-600 mb-4">
                      DeFi Staking • {blockchainData ? `${parseFloat(blockchainData.currentAPR)}%` : '10-30%'} APR
                    </div>
                    <button 
                      onClick={() => setActiveTab('investments')}
                      className="w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors font-medium text-sm"
                    >
                      View Investments
                    </button>
                  </div>
                </div>

                {/* All Accounts - Unified View */}
                <div className="bg-gradient-to-br from-white to-blue-50 border-2 border-blue-500 rounded-xl p-6 shadow-lg">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-2xl font-bold text-blue-800">All Accounts</h3>
                    <div className="text-sm text-gray-600">
                      {walletConnected && isLoggedIn ? 'Live Data' : 'Connect wallet to view'}
                    </div>
                  </div>
                  
                  {!walletConnected || !isLoggedIn ? (
                    <div className="text-center py-12 text-gray-600">
                      <div className="text-5xl mb-4">🔐</div>
                      <div className="text-lg font-medium mb-2">Connect Your Wallet</div>
                      <div className="text-sm">Connect your wallet and authenticate to view your accounts</div>
                    </div>
                  ) : accountsLoading ? (
                    <div className="text-center py-12 text-gray-600">
                      <div className="text-5xl mb-4">⏳</div>
                      <div className="text-lg font-medium">Loading your accounts...</div>
                    </div>
                  ) : checkingAccounts.length === 0 && savingsAccounts.length === 0 ? (
                    <div className="text-center py-12 text-gray-600">
                      <div className="text-5xl mb-4">🏦</div>
                      <div className="text-lg font-medium mb-2">No Accounts Yet</div>
                      <div className="text-sm mb-6">Open your first account to get started</div>
                      <div className="flex justify-center space-x-4">
                        <button
                          onClick={() => setShowCreateCheckingModal(true)}
                          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                        >
                          Open Checking Account
                        </button>
                        <button
                          onClick={() => setShowCreateHYSAModal(true)}
                          className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
                        >
                          Open Savings Account
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Checking Accounts */}
                      {checkingAccounts.length > 0 && (
                        <>
                          <div className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Checking Accounts</div>
                          {checkingAccounts.map((account) => (
                            <div key={account.id} className="bg-white border-2 border-blue-300 rounded-lg p-5 hover:shadow-lg transition-all">
                              <div className="flex flex-col md:flex-row md:items-center justify-between space-y-4 md:space-y-0">
                                <div className="flex items-center space-x-4">
                                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-2xl">
                                    💳
                                  </div>
                                  <div>
                                    <div className="text-lg font-bold text-gray-800">{account.accountName}</div>
                                    <div className="text-sm text-gray-600">#{account.accountNumber}</div>
                                  </div>
                                </div>
                                <div className="flex items-center space-x-6">
                                  <div className="text-right">
                                    <div className="text-sm text-gray-600">Available Balance</div>
                                    <div className="text-2xl font-bold text-blue-600">${parseFloat(account.availableBalance).toFixed(2)}</div>
                                  </div>
                                  <button
                                    onClick={() => setActiveTab('checking')}
                                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium text-sm"
                                  >
                                    Manage →
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </>
                      )}
                      
                      {/* Savings Accounts */}
                      {savingsAccounts.length > 0 && (
                        <>
                          <div className="text-sm font-semibold text-gray-700 uppercase tracking-wide mt-6">Savings Accounts</div>
                          {savingsAccounts.map((account) => (
                            <div key={account.id} className="bg-white border-2 border-green-300 rounded-lg p-5 hover:shadow-lg transition-all">
                              <div className="flex flex-col md:flex-row md:items-center justify-between space-y-4 md:space-y-0">
                                <div className="flex items-center space-x-4">
                                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-2xl">
                                    🏦
                                  </div>
                                  <div>
                                    <div className="text-lg font-bold text-gray-800">
                                      {account.accountType === 'high_yield' ? 'High-Yield Savings' : 'Certificate of Deposit'}
                                    </div>
                                    <div className="text-sm text-green-600 font-medium">
                                      {account.accountType === 'high_yield' ? '4.25% APY' : '6.25% APY'}
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center space-x-6">
                                  <div className="text-right">
                                    <div className="text-sm text-gray-600">Balance</div>
                                    <div className="text-2xl font-bold text-green-600">${parseFloat(account.balance).toFixed(2)}</div>
                                  </div>
                                  <button
                                    onClick={() => {
                                      fetchAccountDetails(account.id);
                                    }}
                                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-medium text-sm"
                                  >
                                    Manage →
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </>
                      )}
                    </div>
                  )}
                </div>

                {/* Quick Actions & Transfers */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Quick Actions */}
                  <div className="bg-gradient-to-br from-white to-blue-50 border-2 border-blue-500 rounded-xl p-6 shadow-lg">
                    <h3 className="text-xl font-bold mb-6 text-blue-800">Quick Actions</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <button 
                        onClick={() => setShowTransferModal(true)}
                        disabled={checkingAccounts.length === 0 && savingsAccounts.length === 0}
                        className="p-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all hover:scale-105 shadow-md disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                      >
                        <div className="text-2xl mb-2">💸</div>
                        <div className="font-medium text-sm">Transfer Money</div>
                      </button>
                      <button 
                        onClick={() => setShowCreateCheckingModal(true)}
                        className="p-4 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-all hover:scale-105 shadow-md"
                      >
                        <div className="text-2xl mb-2">💳</div>
                        <div className="font-medium text-sm">New Checking</div>
                      </button>
                      <button 
                        onClick={() => setShowCreateHYSAModal(true)}
                        className="p-4 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-all hover:scale-105 shadow-md"
                      >
                        <div className="text-2xl mb-2">🏦</div>
                        <div className="font-medium text-sm">New Savings</div>
                      </button>
                      <button 
                        onClick={() => setActiveTab('loans')}
                        className="p-4 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-all hover:scale-105 shadow-md"
                      >
                        <div className="text-2xl mb-2">🏠</div>
                        <div className="font-medium text-sm">Apply for Loan</div>
                      </button>
                    </div>
                  </div>

                  {/* Account Activity Summary */}
                  <div className="bg-gradient-to-br from-white to-green-50 border-2 border-green-500 rounded-xl p-6 shadow-lg">
                    <h3 className="text-xl font-bold mb-6 text-green-800">Account Activity</h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-green-200">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                            <span className="text-xl">✓</span>
                          </div>
                          <div>
                            <div className="font-semibold text-gray-800">Active Accounts</div>
                            <div className="text-sm text-gray-600">All accounts in good standing</div>
                          </div>
                        </div>
                        <div className="text-2xl font-bold text-green-600">
                          {checkingAccounts.length + savingsAccounts.length}
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-blue-200">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-xl">📊</span>
                          </div>
                          <div>
                            <div className="font-semibold text-gray-800">Interest Earned</div>
                            <div className="text-sm text-gray-600">This month</div>
                          </div>
                        </div>
                        <div className="text-xl font-bold text-blue-600">
                          ${savingsAccounts.length > 0 ? '0.00' : '0.00'}
                        </div>
                      </div>

                      <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-purple-200">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                            <span className="text-xl">🔐</span>
                          </div>
                          <div>
                            <div className="font-semibold text-gray-800">Security Status</div>
                            <div className="text-sm text-gray-600">All accounts secure</div>
                          </div>
                        </div>
                        <div className="text-xl font-bold text-green-600">
                          ✓
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Financial Insights */}
                <div className="bg-gradient-to-br from-white to-purple-50 border-2 border-purple-500 rounded-xl p-6 shadow-lg">
                  <h3 className="text-xl font-bold mb-6 text-purple-800">Financial Insights</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="text-center">
                      <div className="text-3xl mb-2">💰</div>
                      <div className="text-2xl font-bold text-purple-600">
                        ${checkingAccounts.reduce((sum, acc) => sum + parseFloat(acc.availableBalance || 0), 0).toFixed(2)}
                      </div>
                      <div className="text-sm text-gray-600 mt-1">Liquid Assets</div>
                      <div className="text-xs text-gray-500 mt-1">Available for spending</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl mb-2">📈</div>
                      <div className="text-2xl font-bold text-green-600">
                        ${savingsAccounts.reduce((sum, acc) => sum + parseFloat(acc.balance || 0), 0).toFixed(2)}
                      </div>
                      <div className="text-sm text-gray-600 mt-1">Growing Savings</div>
                      <div className="text-xs text-gray-500 mt-1">Up to 6.25% APY</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl mb-2">🎯</div>
                      <div className="text-2xl font-bold text-blue-600">
                        {((savingsAccounts.reduce((sum, acc) => sum + parseFloat(acc.balance || 0), 0) / 
                          Math.max(1, checkingAccounts.reduce((sum, acc) => sum + parseFloat(acc.availableBalance || 0), 0) + 
                          savingsAccounts.reduce((sum, acc) => sum + parseFloat(acc.balance || 0), 0))) * 100).toFixed(0)}%
                      </div>
                      <div className="text-sm text-gray-600 mt-1">Savings Rate</div>
                      <div className="text-xs text-gray-500 mt-1">Keep it up!</div>
                    </div>
                  </div>
                </div>

                {/* Financial Health Score */}
                <div className="bg-gradient-to-br from-white to-blue-50 border-2 border-blue-500 rounded-xl p-6 shadow-lg">
                  <h3 className="text-xl font-bold mb-6 text-blue-800">Financial Health Score</h3>
                  <div className="flex flex-col md:flex-row items-center space-y-6 md:space-y-0 md:space-x-6">
                    <div className="relative w-32 h-32">
                      <svg className="w-32 h-32 transform -rotate-90">
                        <circle cx="64" cy="64" r="56" stroke="#e5e7eb" strokeWidth="8" fill="none" />
                        <circle cx="64" cy="64" r="56" stroke="#3b82f6" strokeWidth="8" fill="none" 
                          strokeDasharray={`${85 * 3.51} 351`} strokeLinecap="round" />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-2xl font-bold text-blue-600">850</span>
                      </div>
                    </div>
                    <div className="flex-1 text-center md:text-left">
                      <div className="text-lg font-semibold text-green-600 mb-2">Excellent</div>
                      <div className="text-gray-700 mb-4">Your financial health is excellent! Keep up the great work managing your finances.</div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Payment History</span>
                          <span className="text-green-600 font-medium">Perfect (100%)</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Credit Utilization</span>
                          <span className="text-green-600 font-medium">Low (15%)</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Account Mix</span>
                          <span className="text-blue-600 font-medium">Good</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Length of Credit History</span>
                          <span className="text-blue-600 font-medium">Good (8 years)</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Recent Transactions */}
                <div className="bg-gradient-to-br from-white to-blue-50 border-2 border-blue-500 rounded-xl p-6 shadow-lg">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-blue-800">Recent Transactions</h3>
                    <button 
                      onClick={() => setActiveTab('checking')}
                      className="text-blue-600 hover:text-blue-800 font-medium"
                    >
                      View All
                    </button>
                  </div>
                  
                  {transactionsLoading ? (
                    <div className="text-center py-8 text-gray-600">Loading transactions...</div>
                  ) : transactions.length === 0 ? (
                    <div className="text-center py-8 text-gray-600">
                      <div className="text-5xl mb-4">📊</div>
                      <div className="text-lg font-medium mb-2">No Transactions Yet</div>
                      <div className="text-sm">Your recent transactions will appear here</div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {transactions.slice(0, 4).map((transaction) => (
                      <div key={transaction.id} className="flex items-center justify-between p-4 bg-white border border-blue-200 rounded-lg shadow-sm hover:shadow-md transition-all">
                        <div className="flex items-center space-x-4">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white ${
                            transaction.type === 'deposit' ? 'bg-green-500' : 
                            transaction.type === 'withdrawal' ? 'bg-red-500' : 
                            transaction.type === 'transfer' ? 'bg-blue-500' : 'bg-purple-500'
                          }`}>
                            {transaction.type === 'deposit' ? '↓' : 
                             transaction.type === 'withdrawal' ? '↑' : 
                             transaction.type === 'transfer' ? '↔' : '💳'}
                          </div>
                          <div>
                            <div className="font-semibold text-gray-800">{transaction.description}</div>
                            <div className="text-sm text-gray-600">{transaction.date} • {transaction.category}</div>
                          </div>
                        </div>
                        <div className={`font-bold ${
                          transaction.amount > 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {transaction.amount > 0 ? '+' : ''}${Math.abs(transaction.amount).toFixed(2)}
                        </div>
                      </div>
                    ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Checking Account Tab */}
            {activeTab === 'checking' && (
              <div className="space-y-8">
                {/* Account Summary */}
                <div className="bg-gradient-to-br from-white to-blue-50 border-2 border-blue-500 rounded-xl p-6 shadow-lg">
                  <h3 className="text-xl font-bold mb-6 text-blue-800">Checking Account Summary</h3>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="text-center">
                      <div className="text-sm text-gray-600 mb-2">Available Balance</div>
                      <div className="text-2xl font-bold text-blue-600">
                        {!walletConnected ? 'Connect Wallet' :
                         !isLoggedIn ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}` :
                         balanceLoading ? 'Loading...' :
                         blockchainData ? `${parseFloat(blockchainData.swfBalance).toFixed(2)} ${blockchainData.symbol}` : 
                         '0.00 SWF'}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm text-gray-600 mb-2">Current Balance</div>
                      <div className="text-2xl font-bold text-gray-800">
                        {!walletConnected ? 'Connect Wallet' :
                         !isLoggedIn ? 'Complete Authentication' :
                         balanceLoading ? 'Loading...' :
                         blockchainData ? `${parseFloat(blockchainData.swfBalance).toFixed(2)} ${blockchainData.symbol}` : 
                         '0.00 SWF'}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm text-gray-600 mb-2">This Month's Spending</div>
                      <div className="text-2xl font-bold text-red-600">$1,923.67</div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm text-gray-600 mb-2">This Month's Income</div>
                      <div className="text-2xl font-bold text-green-600">$3,225.50</div>
                    </div>
                  </div>
                </div>

                {/* My Checking Accounts */}
                <div className="bg-gradient-to-br from-white to-blue-50 border-2 border-blue-500 rounded-xl p-6 shadow-lg">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-blue-800">My Checking Accounts</h3>
                    <button
                      onClick={() => setShowCreateCheckingModal(true)}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
                    >
                      + Open Checking Account
                    </button>
                  </div>
                  
                  {accountsLoading ? (
                    <div className="text-center py-8 text-gray-600">Loading accounts...</div>
                  ) : checkingAccounts.length === 0 ? (
                    <div className="text-center py-8 text-gray-600">
                      <div className="mb-4">You don't have any checking accounts yet.</div>
                      <div className="text-sm">Open a checking account to start managing your daily transactions.</div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {checkingAccounts.map((account) => (
                        <div key={account.id} className="bg-white border-2 border-blue-300 rounded-lg p-6 shadow-md hover:shadow-lg transition-all">
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <h4 className="text-lg font-bold text-gray-800">{account.accountName}</h4>
                              <div className="text-sm text-gray-600">Account #{account.accountNumber}</div>
                            </div>
                            <div className="text-2xl">💳</div>
                          </div>
                          <div className="space-y-2 mb-4">
                            <div>
                              <div className="text-sm text-gray-600">Available Balance</div>
                              <div className="text-2xl font-bold text-blue-600">${parseFloat(account.availableBalance).toFixed(2)}</div>
                            </div>
                            <div>
                              <div className="text-sm text-gray-600">Ledger Balance</div>
                              <div className="text-lg text-gray-800">${parseFloat(account.ledgerBalance).toFixed(2)}</div>
                            </div>
                          </div>
                          <div className="text-xs text-gray-500">
                            Opened: {new Date(account.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Transaction Management */}
                <div className="bg-gradient-to-br from-white to-blue-50 border-2 border-blue-500 rounded-xl p-6 shadow-lg">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 space-y-4 md:space-y-0">
                    <h3 className="text-xl font-bold text-blue-800">Transaction History</h3>
                    <div className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-4">
                      <select 
                        value={filterCategory} 
                        onChange={(e) => setFilterCategory(e.target.value)}
                        className="px-4 py-2 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="all">All Categories</option>
                        <option value="Income">Income</option>
                        <option value="Shopping">Shopping</option>
                        <option value="Housing">Housing</option>
                        <option value="Transportation">Transportation</option>
                        <option value="Utilities">Utilities</option>
                        <option value="Groceries">Groceries</option>
                      </select>
                      <button 
                        onClick={() => setShowTransferModal(true)}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                      >
                        New Transfer
                      </button>
                    </div>
                  </div>
                  <div className="space-y-3">
                    {filteredTransactions.map((transaction) => (
                      <div 
                        key={transaction.id} 
                        className="flex items-center justify-between p-4 bg-white border border-blue-200 rounded-lg shadow-sm hover:shadow-md transition-all cursor-pointer"
                        onClick={() => setSelectedTransaction(transaction)}
                      >
                        <div className="flex items-center space-x-4">
                          <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white ${
                            transaction.type === 'deposit' ? 'bg-green-500' : 
                            transaction.type === 'withdrawal' ? 'bg-red-500' : 
                            transaction.type === 'transfer' ? 'bg-blue-500' : 'bg-purple-500'
                          }`}>
                            {transaction.type === 'deposit' ? '↓' : 
                             transaction.type === 'withdrawal' ? '↑' : 
                             transaction.type === 'transfer' ? '↔' : '💳'}
                          </div>
                          <div>
                            <div className="font-semibold text-gray-800">{transaction.description}</div>
                            <div className="text-sm text-gray-600">{transaction.date} • {transaction.category}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className={`font-bold ${
                            transaction.amount > 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {transaction.amount > 0 ? '+' : ''}${Math.abs(transaction.amount).toFixed(2)}
                          </div>
                          <div className="text-sm text-gray-600">
                            Balance: ${transaction.balance.toFixed(2)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Account Features */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-gradient-to-br from-white to-blue-50 border-2 border-blue-400 rounded-xl p-6 shadow-lg">
                    <h4 className="text-lg font-semibold mb-4 text-blue-800">Account Features</h4>
                    <ul className="space-y-3">
                      <li className="flex items-center space-x-3">
                        <span className="text-green-500">✓</span>
                        <span>No monthly maintenance fees</span>
                      </li>
                      <li className="flex items-center space-x-3">
                        <span className="text-green-500">✓</span>
                        <span>Free online and mobile banking</span>
                      </li>
                      <li className="flex items-center space-x-3">
                        <span className="text-green-500">✓</span>
                        <span>Free ATM access at 30,000+ locations</span>
                      </li>
                      <li className="flex items-center space-x-3">
                        <span className="text-green-500">✓</span>
                        <span>Real-time transaction alerts</span>
                      </li>
                      <li className="flex items-center space-x-3">
                        <span className="text-green-500">✓</span>
                        <span>Mobile check deposit</span>
                      </li>
                    </ul>
                  </div>

                  <div className="bg-gradient-to-br from-white to-blue-50 border-2 border-blue-400 rounded-xl p-6 shadow-lg">
                    <h4 className="text-lg font-semibold mb-4 text-blue-800">Security Features</h4>
                    <ul className="space-y-3">
                      <li className="flex items-center space-x-3">
                        <span className="text-blue-500">🔒</span>
                        <span>256-bit SSL encryption</span>
                      </li>
                      <li className="flex items-center space-x-3">
                        <span className="text-blue-500">🔐</span>
                        <span>Two-factor authentication</span>
                      </li>
                      <li className="flex items-center space-x-3">
                        <span className="text-blue-500">🛡️</span>
                        <span>Fraud monitoring 24/7</span>
                      </li>
                      <li className="flex items-center space-x-3">
                        <span className="text-blue-500">⚡</span>
                        <span>Blockchain transaction verification</span>
                      </li>
                      <li className="flex items-center space-x-3">
                        <span className="text-blue-500">💎</span>
                        <span>FDIC insured up to $250,000</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* Savings Account Tab */}
            {activeTab === 'savings' && (
              <div className="space-y-8">
                {/* Savings Overview */}
                <div className="bg-gradient-to-br from-white to-blue-50 border-2 border-blue-500 rounded-xl p-6 shadow-lg">
                  <h3 className="text-xl font-bold mb-6 text-blue-800">Savings Account Overview (SWF Basket Vault)</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="text-center">
                      <div className="text-sm text-gray-600 mb-2">Vault Balance</div>
                      <div className="text-3xl font-bold text-blue-600">
                        {!walletConnected ? 'Connect Wallet' :
                         !isLoggedIn ? 'Authenticate' :
                         balanceLoading ? 'Loading...' : 
                         blockchainData ? `${parseFloat(blockchainData.vaultBalance).toFixed(2)} ${blockchainData.symbol}` : 
                         '0.00 SWF'}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm text-gray-600 mb-2">Interest Rate (APR)</div>
                      <div className="text-3xl font-bold text-green-600">
                        {!walletConnected || !isLoggedIn ? 'Connect to view' :
                         balanceLoading ? 'Loading...' :
                         blockchainData ? `${parseFloat(blockchainData.currentAPR)}%` : 
                         '0%'}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm text-gray-600 mb-2">Total Deposits</div>
                      <div className="text-3xl font-bold text-green-600">
                        {!walletConnected || !isLoggedIn ? 'Connect to view' :
                         balanceLoading ? 'Loading...' :
                         blockchainData ? `${parseFloat(blockchainData.userDeposits).toFixed(2)} ${blockchainData.symbol}` : 
                         '0.00 SWF'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Opened Savings Accounts */}
                <div className="bg-gradient-to-br from-white to-blue-50 border-2 border-blue-500 rounded-xl p-6 shadow-lg">
                  <h3 className="text-xl font-bold mb-6 text-blue-800">My Savings Accounts</h3>
                  
                  {accountsLoading ? (
                    <div className="text-center py-8 text-gray-600">Loading accounts...</div>
                  ) : savingsAccounts.length === 0 ? (
                    <div className="text-center py-8 text-gray-600">
                      <div className="mb-4">You don't have any savings accounts yet.</div>
                      <div className="text-sm">Open a High-Yield Savings Account or Certificate of Deposit to start earning interest.</div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {savingsAccounts.map((account) => (
                        <div 
                          key={account.id}
                          onClick={() => fetchAccountDetails(account.id)}
                          className="bg-white border border-blue-200 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                        >
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <h4 className="text-lg font-semibold text-gray-800">
                                {account.type === 'hysa' ? 'High-Yield Savings' : 'Certificate of Deposit'}
                              </h4>
                              <div className="text-sm text-gray-500">Account #{account.accountNumber}</div>
                            </div>
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                              account.status === 'open' ? 'bg-green-100 text-green-800' :
                              account.status === 'closed' ? 'bg-gray-100 text-gray-800' :
                              'bg-yellow-100 text-yellow-800'
                            }`}>
                              {account.status.toUpperCase()}
                            </span>
                          </div>
                          
                          <div className="space-y-2 mb-4">
                            <div className="flex justify-between">
                              <span className="text-gray-600">Balance:</span>
                              <span className="font-semibold text-blue-600">
                                {parseFloat(account.balance).toFixed(2)} SWF
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">APY:</span>
                              <span className="font-semibold text-green-600">{account.apy}%</span>
                            </div>
                            {account.type === 'cd' && account.maturityDate && (
                              <div className="flex justify-between">
                                <span className="text-gray-600">Matures:</span>
                                <span className="text-sm">{new Date(account.maturityDate).toLocaleDateString()}</span>
                              </div>
                            )}
                            <div className="flex justify-between">
                              <span className="text-gray-600">Accrued Interest:</span>
                              <span className="text-sm text-green-600">
                                +{parseFloat(account.accruedInterest).toFixed(2)} SWF
                              </span>
                            </div>
                          </div>
                          
                          <div className="pt-4 border-t border-gray-200">
                            <button 
                              onClick={() => {
                                setSelectedAccount(account);
                                fetchAccountDetails(account.id);
                                setShowAccountDetailModal(true);
                              }}
                              className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm"
                            >
                              View Account Details
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Savings Goals */}
                <div className="bg-gradient-to-br from-white to-blue-50 border-2 border-blue-500 rounded-xl p-6 shadow-lg">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-blue-800">Savings Goals</h3>
                    <button 
                      onClick={() => setShowCreateGoalModal(true)}
                      className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                    >
                      + Add New Goal
                    </button>
                  </div>
                  
                  {goalsLoading ? (
                    <div className="text-center py-8 text-gray-600">Loading goals...</div>
                  ) : savingsGoals.length === 0 ? (
                    <div className="text-center py-8 text-gray-600">
                      <div className="text-5xl mb-4">🎯</div>
                      <div className="text-lg font-medium mb-2">No Savings Goals Yet</div>
                      <div className="text-sm">Create your first savings goal to start tracking progress</div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {savingsGoals.map((goal: any) => {
                      const current = parseFloat(goal.currentAmount || 0);
                      const target = parseFloat(goal.targetAmount || 0);
                      const progress = target > 0 ? (current / target) * 100 : 0;
                      const monthsLeft = Math.ceil((new Date(goal.targetDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24 * 30));
                      
                      return (
                        <div key={goal.id} className="bg-white border border-blue-200 rounded-lg p-6 shadow-sm">
                          <div className="flex justify-between items-start mb-4">
                            <h4 className="font-semibold text-gray-800">{goal.goalName}</h4>
                            <span className="text-sm text-gray-600">{monthsLeft > 0 ? `${monthsLeft} months left` : 'Overdue'}</span>
                          </div>
                          <div className="mb-4">
                            <div className="flex justify-between text-sm text-gray-600 mb-2">
                              <span>${current.toLocaleString()}</span>
                              <span>${target.toLocaleString()}</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-3">
                              <div 
                                className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all duration-300"
                                style={{ width: `${Math.min(progress, 100)}%` }}
                              ></div>
                            </div>
                            <div className="text-center text-sm text-gray-600 mt-2">
                              {progress.toFixed(1)}% Complete
                            </div>
                          </div>
                          <div className="text-sm text-gray-600">
                            Monthly Contribution: ${parseFloat(goal.monthlyContribution || 0).toFixed(2)}
                          </div>
                          <div className="text-sm text-gray-600">
                            Target Date: {new Date(goal.targetDate).toLocaleDateString()}
                          </div>
                        </div>
                      );
                    })}
                    </div>
                  )}
                </div>

                {/* Savings Products */}
                <div className="bg-gradient-to-br from-white to-blue-50 border-2 border-blue-500 rounded-xl p-6 shadow-lg">
                  <h3 className="text-xl font-bold mb-6 text-blue-800">Available Savings Products</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white border border-blue-200 rounded-lg p-6 shadow-sm">
                      <h4 className="text-lg font-semibold mb-3 text-blue-800">High-Yield Savings</h4>
                      <div className="text-2xl font-bold text-green-600 mb-2">4.25% APY</div>
                      <ul className="space-y-2 text-sm text-gray-600 mb-4">
                        <li>• No minimum balance requirement</li>
                        <li>• Unlimited online transfers</li>
                        <li>• FDIC insured</li>
                        <li>• Competitive interest rates</li>
                      </ul>
                      <button 
                        onClick={handleOpenHighYieldAccount}
                        className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                      >
                        Open Account
                      </button>
                    </div>

                    <div className="bg-white border border-blue-200 rounded-lg p-6 shadow-sm">
                      <h4 className="text-lg font-semibold mb-3 text-blue-800">Certificate of Deposit</h4>
                      <div className="text-2xl font-bold text-green-600 mb-2">6.25% APY</div>
                      <ul className="space-y-2 text-sm text-gray-600 mb-4">
                        <li>• 12-month term</li>
                        <li>• $1,000 minimum deposit</li>
                        <li>• Fixed interest rate</li>
                        <li>• Early withdrawal penalties apply</li>
                      </ul>
                      <button 
                        onClick={handleCertificateOfDeposit}
                        className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                      >
                        Learn More
                      </button>
                    </div>
                  </div>
                </div>

                {/* Auto-Save Features */}
                <div className="bg-gradient-to-br from-white to-blue-50 border-2 border-blue-500 rounded-xl p-6 shadow-lg">
                  <h3 className="text-xl font-bold mb-6 text-blue-800">Automated Savings</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white border border-blue-200 rounded-lg p-6 shadow-sm">
                      <h4 className="text-lg font-semibold mb-3 text-blue-800">Round-Up Savings</h4>
                      <p className="text-gray-600 mb-4">Automatically round up purchases to the nearest dollar and save the difference.</p>
                      <div className="text-sm text-gray-600 mb-4">
                        This month you've saved <span className="font-semibold text-green-600">$47.83</span> in round-ups!
                      </div>
                      <button 
                        onClick={handleToggleRoundUp}
                        className={`w-full px-4 py-2 ${roundUpEnabled ? 'bg-gray-600 hover:bg-gray-700' : 'bg-blue-600 hover:bg-blue-700'} text-white rounded-lg transition-colors`}
                      >
                        {roundUpEnabled ? 'Disable Round-Up' : 'Enable Round-Up'}
                      </button>
                    </div>

                    <div className="bg-white border border-blue-200 rounded-lg p-6 shadow-sm">
                      <h4 className="text-lg font-semibold mb-3 text-blue-800">Recurring Transfers</h4>
                      <p className="text-gray-600 mb-4">Set up automatic transfers from checking to savings on a schedule.</p>
                      <div className="text-sm text-gray-600 mb-4">
                        {autoTransferEnabled ? (
                          <>Current: <span className="font-semibold">{autoTransferAmount} SWF monthly</span> on day {autoTransferDay} of each month</>
                        ) : (
                          <span className="text-gray-500 italic">No auto-transfer configured</span>
                        )}
                      </div>
                      <button 
                        onClick={handleManageAutoTransfer}
                        className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                      >
                        Manage Auto-Transfer
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Loans Tab */}
            {activeTab === 'loans' && (
              <div className="space-y-8">
                {/* Loan Calculator */}
                <div className="bg-gradient-to-br from-white to-blue-50 border-2 border-blue-500 rounded-xl p-6 shadow-lg">
                  <h3 className="text-xl font-bold mb-6 text-blue-800">Loan Calculator</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Loan Amount</label>
                        <input
                          type="number"
                          value={loanAmount}
                          onChange={(e) => setLoanAmount(e.target.value)}
                          className="w-full px-4 py-2 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="50000"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Interest Rate (%)</label>
                        <input
                          type="number"
                          step="0.1"
                          value={interestRate}
                          onChange={(e) => setInterestRate(e.target.value)}
                          className="w-full px-4 py-2 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="6.5"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Loan Term (Years)</label>
                        <select
                          value={loanTerm}
                          onChange={(e) => setLoanTerm(e.target.value)}
                          className="w-full px-4 py-2 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="10">10 years</option>
                          <option value="15">15 years</option>
                          <option value="20">20 years</option>
                          <option value="25">25 years</option>
                          <option value="30">30 years</option>
                        </select>
                      </div>
                    </div>
                    <div className="bg-white border border-blue-200 rounded-lg p-6">
                      <h4 className="text-lg font-semibold mb-4 text-blue-800">Payment Summary</h4>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Monthly Payment:</span>
                          <span className="font-bold text-blue-600">${monthlyPayment.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Total Amount:</span>
                          <span className="font-semibold">${(monthlyPayment * parseFloat(loanTerm) * 12).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Total Interest:</span>
                          <span className="font-semibold text-red-600">${(monthlyPayment * parseFloat(loanTerm) * 12 - parseFloat(loanAmount)).toFixed(2)}</span>
                        </div>
                      </div>
                      <button className="w-full mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
                        Apply for This Loan
                      </button>
                    </div>
                  </div>
                </div>

                {/* Available Loan Products */}
                <div className="bg-gradient-to-br from-white to-blue-50 border-2 border-blue-500 rounded-xl p-6 shadow-lg">
                  <h3 className="text-xl font-bold mb-6 text-blue-800">Available Loan Products</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {loanProducts.map((product, index) => (
                      <div key={index} className="bg-white border border-blue-200 rounded-lg p-6 shadow-sm hover:shadow-md transition-all">
                        <h4 className="text-lg font-semibold mb-3 text-blue-800">{product.type}</h4>
                        <div className="space-y-2 mb-4">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Interest Rate:</span>
                            <span className="font-semibold text-green-600">{product.rate}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Term:</span>
                            <span className="font-semibold">{product.term}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Amount Range:</span>
                            <span className="font-semibold">{product.minAmount} - {product.maxAmount}</span>
                          </div>
                        </div>
                        <p className="text-sm text-gray-600 mb-4">{product.description}</p>
                        <div className="space-y-2">
                          <button className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
                            Apply Now
                          </button>
                          <button className="w-full px-4 py-2 border border-blue-600 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                            Learn More
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Loan Application Process */}
                <div className="bg-gradient-to-br from-white to-blue-50 border-2 border-blue-500 rounded-xl p-6 shadow-lg">
                  <h3 className="text-xl font-bold mb-6 text-blue-800">Loan Application Process</h3>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="text-center">
                      <div className="w-16 h-16 bg-blue-500 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">1</div>
                      <h4 className="font-semibold mb-2">Apply Online</h4>
                      <p className="text-sm text-gray-600">Complete our secure online application in minutes</p>
                    </div>
                    <div className="text-center">
                      <div className="w-16 h-16 bg-blue-500 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">2</div>
                      <h4 className="font-semibold mb-2">Quick Review</h4>
                      <p className="text-sm text-gray-600">Get a decision within 24 hours</p>
                    </div>
                    <div className="text-center">
                      <div className="w-16 h-16 bg-blue-500 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">3</div>
                      <h4 className="font-semibold mb-2">Documentation</h4>
                      <p className="text-sm text-gray-600">Upload required documents securely</p>
                    </div>
                    <div className="text-center">
                      <div className="w-16 h-16 bg-green-500 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">✓</div>
                      <h4 className="font-semibold mb-2">Get Funded</h4>
                      <p className="text-sm text-gray-600">Receive funds as quickly as same day</p>
                    </div>
                  </div>
                </div>

                {/* Pre-qualification */}
                <div className="bg-gradient-to-br from-white to-blue-50 border-2 border-blue-500 rounded-xl p-6 shadow-lg">
                  <h3 className="text-xl font-bold mb-6 text-blue-800">Check Your Pre-Qualification</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <p className="text-gray-700 mb-4">
                        See what loan amounts and rates you may qualify for without impacting your credit score.
                      </p>
                      <ul className="space-y-2 text-sm text-gray-600 mb-6">
                        <li className="flex items-center space-x-2">
                          <span className="text-green-500">✓</span>
                          <span>No impact to credit score</span>
                        </li>
                        <li className="flex items-center space-x-2">
                          <span className="text-green-500">✓</span>
                          <span>See personalized rates</span>
                        </li>
                        <li className="flex items-center space-x-2">
                          <span className="text-green-500">✓</span>
                          <span>Takes less than 3 minutes</span>
                        </li>
                        <li className="flex items-center space-x-2">
                          <span className="text-green-500">✓</span>
                          <span>No obligation to apply</span>
                        </li>
                      </ul>
                      <button className="w-full px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-medium">
                        Check Pre-Qualification
                      </button>
                    </div>
                    <div className="bg-white border border-blue-200 rounded-lg p-6">
                      <h4 className="text-lg font-semibold mb-4 text-blue-800">What You'll Need</h4>
                      <ul className="space-y-3 text-sm text-gray-600">
                        <li className="flex items-start space-x-2">
                          <span className="text-blue-500">📄</span>
                          <span>Personal information (SSN, address, employment)</span>
                        </li>
                        <li className="flex items-start space-x-2">
                          <span className="text-blue-500">💰</span>
                          <span>Income and employment details</span>
                        </li>
                        <li className="flex items-start space-x-2">
                          <span className="text-blue-500">🏠</span>
                          <span>Housing information</span>
                        </li>
                        <li className="flex items-start space-x-2">
                          <span className="text-blue-500">💳</span>
                          <span>Financial information</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Investments Tab */}
            {activeTab === 'investments' && (
              <div className="space-y-8">
                {/* Portfolio Overview */}
                <div className="bg-gradient-to-br from-white to-blue-50 border-2 border-blue-500 rounded-xl p-6 shadow-lg">
                  <h3 className="text-xl font-bold mb-6 text-blue-800">SWF Staking Portfolio</h3>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="text-center">
                      <div className="text-sm text-gray-600 mb-2">Total Staked Amount</div>
                      <div className="text-3xl font-bold text-blue-600">
                        {!walletConnected ? 'Connect Wallet' :
                         !isLoggedIn ? 'Authenticate' :
                         balanceLoading ? 'Loading...' :
                         blockchainData ? `${parseFloat(blockchainData.stakedAmount).toFixed(2)} ${blockchainData.symbol}` : 
                         '0.00 SWF'}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm text-gray-600 mb-2">Pending Rewards</div>
                      <div className="text-3xl font-bold text-green-600">
                        {!walletConnected || !isLoggedIn ? 'Connect to view' :
                         balanceLoading ? 'Loading...' :
                         blockchainData ? `${parseFloat(blockchainData.pendingRewards).toFixed(2)} ${blockchainData.symbol}` : 
                         '0.00 SWF'}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm text-gray-600 mb-2">Current APR</div>
                      <div className="text-3xl font-bold text-green-600">
                        {!walletConnected || !isLoggedIn ? 'Connect' :
                         balanceLoading ? 'Loading...' :
                         blockchainData ? `${parseFloat(blockchainData.currentAPR)}%` : 
                         '0%'}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm text-gray-600 mb-2">Available Balance</div>
                      <div className="text-3xl font-bold text-purple-600">
                        {!walletConnected || !isLoggedIn ? 'Connect' :
                         balanceLoading ? 'Loading...' :
                         blockchainData ? `${parseFloat(blockchainData.swfBalance).toFixed(2)} ${blockchainData.symbol}` : 
                         '0.00 SWF'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Holdings */}
                <div className="bg-gradient-to-br from-white to-blue-50 border-2 border-blue-500 rounded-xl p-6 shadow-lg">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-blue-800">Current Holdings</h3>
                    <button className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors">
                      Add Investment
                    </button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-blue-200">
                          <th className="text-left py-3 px-4 font-semibold text-gray-700">Asset</th>
                          <th className="text-right py-3 px-4 font-semibold text-gray-700">Shares/Amount</th>
                          <th className="text-right py-3 px-4 font-semibold text-gray-700">Current Price</th>
                          <th className="text-right py-3 px-4 font-semibold text-gray-700">Total Value</th>
                          <th className="text-right py-3 px-4 font-semibold text-gray-700">Gain/Loss</th>
                          <th className="text-right py-3 px-4 font-semibold text-gray-700">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {investments.map((investment, index) => (
                          <tr key={index} className="border-b border-gray-100 hover:bg-blue-50">
                            <td className="py-4 px-4">
                              <div>
                                <div className="font-semibold">{investment.symbol}</div>
                                <div className="text-sm text-gray-600">{investment.name}</div>
                                <div className="text-xs text-blue-600">{investment.sector}</div>
                              </div>
                            </td>
                            <td className="text-right py-4 px-4">
                              {investment.shares % 1 === 0 ? investment.shares : investment.shares.toFixed(4)}
                            </td>
                            <td className="text-right py-4 px-4">
                              ${investment.currentPrice.toLocaleString()}
                            </td>
                            <td className="text-right py-4 px-4 font-semibold">
                              ${investment.totalValue.toLocaleString()}
                            </td>
                            <td className={`text-right py-4 px-4 font-semibold ${
                              investment.gainLoss >= 0 ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {investment.gainLoss >= 0 ? '+' : ''}${investment.gainLoss.toFixed(2)}
                              <div className="text-sm">
                                ({investment.gainLossPercent >= 0 ? '+' : ''}{investment.gainLossPercent.toFixed(1)}%)
                              </div>
                            </td>
                            <td className="text-right py-4 px-4">
                              <div className="space-x-2">
                                <button className="text-blue-600 hover:text-blue-800 text-sm">Buy</button>
                                <button className="text-red-600 hover:text-red-800 text-sm">Sell</button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Investment Products */}
                <div className="bg-gradient-to-br from-white to-blue-50 border-2 border-blue-500 rounded-xl p-6 shadow-lg">
                  <h3 className="text-xl font-bold mb-6 text-blue-800">Investment Products</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="bg-white border border-blue-200 rounded-lg p-6 shadow-sm">
                      <h4 className="text-lg font-semibold mb-3 text-blue-800">Crypto Trading</h4>
                      <p className="text-gray-600 mb-4">Trade Bitcoin, Ethereum, and other cryptocurrencies with low fees.</p>
                      <ul className="space-y-2 text-sm text-gray-600 mb-4">
                        <li>• 0.25% trading fees</li>
                        <li>• 50+ cryptocurrencies</li>
                        <li>• Advanced security</li>
                        <li>• Real-time charts</li>
                      </ul>
                      <button 
                        onClick={() => showInfo('Crypto Trading', 'Access our advanced crypto trading platform with real-time charts, technical analysis tools, and secure custody solutions.')}
                        className="w-full px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors"
                      >
                        Start Trading
                      </button>
                    </div>

                    <div className="bg-white border border-blue-200 rounded-lg p-6 shadow-sm">
                      <h4 className="text-lg font-semibold mb-3 text-blue-800">ETF Portfolios</h4>
                      <p className="text-gray-600 mb-4">Diversified portfolios of exchange-traded funds.</p>
                      <ul className="space-y-2 text-sm text-gray-600 mb-4">
                        <li>• Low expense ratios</li>
                        <li>• Automatic rebalancing</li>
                        <li>• Tax-efficient</li>
                        <li>• Professional management</li>
                      </ul>
                      <button 
                        onClick={() => showInfo('ETF Portfolios', 'Browse our curated selection of ETF portfolios designed for different risk profiles and investment goals. Auto-rebalancing included.')}
                        className="w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
                      >
                        Explore ETFs
                      </button>
                    </div>

                    <div className="bg-white border border-blue-200 rounded-lg p-6 shadow-sm">
                      <h4 className="text-lg font-semibold mb-3 text-blue-800">Retirement Accounts</h4>
                      <p className="text-gray-600 mb-4">Tax-advantaged retirement savings with IRA and 401(k) options.</p>
                      <ul className="space-y-2 text-sm text-gray-600 mb-4">
                        <li>• Traditional & Roth IRAs</li>
                        <li>• 401(k) rollovers</li>
                        <li>• Tax benefits</li>
                        <li>• Retirement planning</li>
                      </ul>
                      <button 
                        onClick={() => showInfo('Retirement Planning', 'Open a tax-advantaged retirement account today. Our advisors will help you choose between Traditional IRA, Roth IRA, or 401(k) rollover options.')}
                        className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                      >
                        Plan Retirement
                      </button>
                    </div>

                    <div className="bg-white border border-blue-200 rounded-lg p-6 shadow-sm">
                      <h4 className="text-lg font-semibold mb-3 text-blue-800">REITs</h4>
                      <p className="text-gray-600 mb-4">Invest in real estate without buying property directly.</p>
                      <ul className="space-y-2 text-sm text-gray-600 mb-4">
                        <li>• Diversified holdings</li>
                        <li>• Monthly dividends</li>
                        <li>• 7-9% avg. returns</li>
                        <li>• Low minimums</li>
                      </ul>
                      <button 
                        onClick={() => showInfo('Real Estate Investment Trusts', 'Invest in commercial and residential real estate through REITs. Earn passive income from monthly dividend distributions.')}
                        className="w-full px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition-colors"
                      >
                        Invest in REITs
                      </button>
                    </div>

                    <div className="bg-white border border-blue-200 rounded-lg p-6 shadow-sm">
                      <h4 className="text-lg font-semibold mb-3 text-blue-800">Bonds & Fixed Income</h4>
                      <p className="text-gray-600 mb-4">Stable returns with government and corporate bonds.</p>
                      <ul className="space-y-2 text-sm text-gray-600 mb-4">
                        <li>• AAA to B-rated bonds</li>
                        <li>• 3-10 year terms</li>
                        <li>• Fixed interest rates</li>
                        <li>• Capital preservation</li>
                      </ul>
                      <button 
                        onClick={() => showInfo('Bonds & Fixed Income', 'Build a stable income stream with our bond portfolio. Choose from government, municipal, and investment-grade corporate bonds.')}
                        className="w-full px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
                      >
                        Browse Bonds
                      </button>
                    </div>

                    <div className="bg-white border border-blue-200 rounded-lg p-6 shadow-sm">
                      <h4 className="text-lg font-semibold mb-3 text-blue-800">Commodities</h4>
                      <p className="text-gray-600 mb-4">Hedge inflation with gold, silver, oil, and agricultural products.</p>
                      <ul className="space-y-2 text-sm text-gray-600 mb-4">
                        <li>• Precious metals</li>
                        <li>• Energy futures</li>
                        <li>• Agricultural ETFs</li>
                        <li>• Inflation hedge</li>
                      </ul>
                      <button 
                        onClick={() => showInfo('Commodities Trading', 'Diversify your portfolio with commodities. Trade gold, silver, oil, and agricultural products through ETFs and futures.')}
                        className="w-full px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg transition-colors"
                      >
                        Trade Commodities
                      </button>
                    </div>

                    <div className="bg-white border border-blue-200 rounded-lg p-6 shadow-sm">
                      <h4 className="text-lg font-semibold mb-3 text-blue-800">Index Funds</h4>
                      <p className="text-gray-600 mb-4">Low-cost passive investing in market indexes.</p>
                      <ul className="space-y-2 text-sm text-gray-600 mb-4">
                        <li>• S&P 500, NASDAQ</li>
                        <li>• 0.03% expense ratio</li>
                        <li>• Long-term growth</li>
                        <li>• Auto-investing</li>
                      </ul>
                      <button 
                        onClick={() => showInfo('Index Funds', 'Start building wealth with low-cost index funds. Track major market indexes like S&P 500, NASDAQ, and international markets.')}
                        className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                      >
                        Start Indexing
                      </button>
                    </div>

                    <div className="bg-white border border-blue-200 rounded-lg p-6 shadow-sm">
                      <h4 className="text-lg font-semibold mb-3 text-blue-800">Options Trading</h4>
                      <p className="text-gray-600 mb-4">Advanced strategies with calls, puts, and spreads.</p>
                      <ul className="space-y-2 text-sm text-gray-600 mb-4">
                        <li>• Covered calls</li>
                        <li>• Protective puts</li>
                        <li>• Advanced spreads</li>
                        <li>• Education included</li>
                      </ul>
                      <button 
                        onClick={() => showInfo('Options Trading', 'Unlock advanced trading strategies with options. Our platform offers educational resources and tools for both beginners and experienced traders.')}
                        className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                      >
                        Trade Options
                      </button>
                    </div>
                  </div>
                </div>

                {/* Market Overview */}
                <div className="bg-gradient-to-br from-white to-blue-50 border-2 border-blue-500 rounded-xl p-6 shadow-lg">
                  <h3 className="text-xl font-bold mb-6 text-blue-800">Market Overview</h3>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="bg-white border border-blue-200 rounded-lg p-4 text-center">
                      <div className="text-sm text-gray-600 mb-1">S&P 500</div>
                      <div className="text-xl font-bold">4,567.89</div>
                      <div className="text-green-600 text-sm">+1.2% (+52.45)</div>
                    </div>
                    <div className="bg-white border border-blue-200 rounded-lg p-4 text-center">
                      <div className="text-sm text-gray-600 mb-1">NASDAQ</div>
                      <div className="text-xl font-bold">14,234.56</div>
                      <div className="text-green-600 text-sm">+0.8% (+110.23)</div>
                    </div>
                    <div className="bg-white border border-blue-200 rounded-lg p-4 text-center">
                      <div className="text-sm text-gray-600 mb-1">Bitcoin</div>
                      <div className="text-xl font-bold">$43,250</div>
                      <div className="text-green-600 text-sm">+3.4% (+$1,425)</div>
                    </div>
                    <div className="bg-white border border-blue-200 rounded-lg p-4 text-center">
                      <div className="text-sm text-gray-600 mb-1">Gold</div>
                      <div className="text-xl font-bold">$1,945</div>
                      <div className="text-red-600 text-sm">-0.5% (-$9.75)</div>
                    </div>
                  </div>
                </div>

                {/* Investment Education */}
                <div className="bg-gradient-to-br from-white to-blue-50 border-2 border-blue-500 rounded-xl p-6 shadow-lg">
                  <h3 className="text-xl font-bold mb-6 text-blue-800">Investment Education</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h4 className="text-lg font-semibold text-blue-800">Getting Started</h4>
                      <ul className="space-y-2">
                        <li>
                          <a href="#" className="text-blue-600 hover:text-blue-800 hover:underline">
                            📚 Investing Basics: A Beginner's Guide
                          </a>
                        </li>
                        <li>
                          <a href="#" className="text-blue-600 hover:text-blue-800 hover:underline">
                            💡 Understanding Risk and Return
                          </a>
                        </li>
                        <li>
                          <a href="#" className="text-blue-600 hover:text-blue-800 hover:underline">
                            🎯 Setting Investment Goals
                          </a>
                        </li>
                        <li>
                          <a href="#" className="text-blue-600 hover:text-blue-800 hover:underline">
                            📊 Portfolio Diversification Strategies
                          </a>
                        </li>
                      </ul>
                    </div>
                    <div className="space-y-4">
                      <h4 className="text-lg font-semibold text-blue-800">Advanced Topics</h4>
                      <ul className="space-y-2">
                        <li>
                          <a href="#" className="text-blue-600 hover:text-blue-800 hover:underline">
                            ⚡ Cryptocurrency Investment Guide
                          </a>
                        </li>
                        <li>
                          <a href="#" className="text-blue-600 hover:text-blue-800 hover:underline">
                            🏠 Real Estate Investment Trusts (REITs)
                          </a>
                        </li>
                        <li>
                          <a href="#" className="text-blue-600 hover:text-blue-800 hover:underline">
                            💰 Tax-Efficient Investing
                          </a>
                        </li>
                        <li>
                          <a href="#" className="text-blue-600 hover:text-blue-800 hover:underline">
                            🎖️ Retirement Planning Strategies
                          </a>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* DeFi Lending Tab */}
            {activeTab === 'defi-lending' && (
              <div className="space-y-8">
                {/* Venus Protocol Header */}
                <div className="bg-gradient-to-br from-white to-blue-50 border-2 border-purple-500 rounded-xl p-6 shadow-lg">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-xl font-bold text-purple-800 mb-2">🚀 DeFi Lending & Borrowing</h3>
                      <p className="text-gray-700">Powered by Venus Protocol - Earn interest by supplying assets and borrow against your collateral</p>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-600">Your Account Liquidity</div>
                      <div className="text-2xl font-bold text-green-600">
                        {isLoading ? 'Loading...' : contractData?.venusAccountLiquidity ? 
                          `$${parseFloat(contractData.venusAccountLiquidity.liquidity).toFixed(2)}` : 
                          'Connect Wallet'}
                      </div>
                      <div className="text-sm text-gray-600">
                        Shortfall: ${contractData?.venusAccountLiquidity ? parseFloat(contractData.venusAccountLiquidity.shortfall).toFixed(2) : '0.00'}
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-white border border-purple-200 rounded-lg p-4 text-center">
                      <div className="text-sm text-gray-600 mb-1">XVS Rewards</div>
                      <div className="text-xl font-bold text-purple-600">
                        {contractData?.xvsAccrued ? parseFloat(contractData.xvsAccrued).toFixed(4) : '0.0000'} XVS
                      </div>
                      <button 
                        onClick={() => claimXVSRewards()}
                        disabled={!isConnected || isLoading}
                        className="mt-2 px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white text-sm rounded transition-colors disabled:opacity-50"
                      >
                        Claim
                      </button>
                    </div>
                    <div className="bg-white border border-purple-200 rounded-lg p-4 text-center">
                      <div className="text-sm text-gray-600 mb-1">XVS Balance</div>
                      <div className="text-xl font-bold text-purple-600">
                        {contractData?.xvsBalance ? parseFloat(contractData.xvsBalance).toFixed(2) : '0.00'} XVS
                      </div>
                    </div>
                    <div className="bg-white border border-purple-200 rounded-lg p-4 text-center">
                      <div className="text-sm text-gray-600 mb-1">Markets Entered</div>
                      <div className="text-xl font-bold text-blue-600">
                        {contractData?.venusMarkets ? contractData.venusMarkets.length : 0}
                      </div>
                    </div>
                    <div className="bg-white border border-purple-200 rounded-lg p-4 text-center">
                      <div className="text-sm text-gray-600 mb-1">Health Factor</div>
                      <div className="text-xl font-bold text-green-600">Safe</div>
                    </div>
                  </div>
                </div>

                {/* Venus Markets */}
                <div className="bg-gradient-to-br from-white to-blue-50 border-2 border-purple-500 rounded-xl p-6 shadow-lg">
                  <h3 className="text-xl font-bold mb-6 text-purple-800">Venus Markets</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-purple-200">
                          <th className="text-left py-3 px-4 font-semibold text-gray-700">Asset</th>
                          <th className="text-right py-3 px-4 font-semibold text-gray-700">Supply APY</th>
                          <th className="text-right py-3 px-4 font-semibold text-gray-700">Borrow APY</th>
                          <th className="text-right py-3 px-4 font-semibold text-gray-700">Your Supply</th>
                          <th className="text-right py-3 px-4 font-semibold text-gray-700">Your Borrow</th>
                          <th className="text-right py-3 px-4 font-semibold text-gray-700">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Object.entries(contractData?.vTokenBalances || {}).map(([address, data]: [string, any]) => (
                          <tr key={address} className="border-b border-purple-100 hover:bg-purple-50">
                            <td className="py-4 px-4">
                              <div className="flex items-center space-x-3">
                                <div className="w-8 h-8 bg-purple-500 bg-opacity-20 rounded-full flex items-center justify-center">
                                  <span className="text-sm font-bold text-purple-600">
                                    {data.symbol?.replace('v', '') || 'N/A'}
                                  </span>
                                </div>
                                <div>
                                  <div className="font-semibold">{data.symbol || 'Unknown'}</div>
                                  <div className="text-sm text-gray-600">
                                    {data.symbol === 'vBNB' ? 'BNB' : 
                                     data.symbol === 'vUSDT' ? 'Tether USD' :
                                     data.symbol === 'vBUSD' ? 'Binance USD' :
                                     data.symbol === 'vBTC' ? 'Bitcoin' : 'Token'}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="py-4 px-4 text-right text-green-600 font-semibold">
                              {data.supplyAPY || '0.00'}%
                            </td>
                            <td className="py-4 px-4 text-right text-red-600 font-semibold">
                              {data.borrowAPY || '0.00'}%
                            </td>
                            <td className="py-4 px-4 text-right">
                              <div className="font-semibold">
                                {parseFloat(data.underlyingBalance || '0').toFixed(4)}
                              </div>
                              <div className="text-sm text-gray-600">
                                {parseFloat(data.balance || '0').toFixed(4)} {data.symbol}
                              </div>
                            </td>
                            <td className="py-4 px-4 text-right">
                              <div className="font-semibold">
                                {parseFloat(data.borrowBalance || '0').toFixed(4)}
                              </div>
                            </td>
                            <td className="py-4 px-4 text-right">
                              <div className="flex space-x-1">
                                <button
                                  onClick={() => {
                                    setSelectedVToken(data.symbol);
                                    setVenusAction('supply');
                                  }}
                                  className="px-2 py-1 bg-green-600 hover:bg-green-700 text-white text-xs rounded transition-colors"
                                >
                                  Supply
                                </button>
                                <button
                                  onClick={() => {
                                    setSelectedVToken(data.symbol);
                                    setVenusAction('borrow');
                                  }}
                                  className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded transition-colors"
                                >
                                  Borrow
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                        
                        {/* Default markets if no data */}
                        {(!contractData?.vTokenBalances || Object.keys(contractData.vTokenBalances).length === 0) && (
                          <>
                            {['vBNB', 'vUSDT', 'vBUSD', 'vBTC'].map((symbol) => (
                              <tr key={symbol} className="border-b border-purple-100 hover:bg-purple-50">
                                <td className="py-4 px-4">
                                  <div className="flex items-center space-x-3">
                                    <div className="w-8 h-8 bg-purple-500 bg-opacity-20 rounded-full flex items-center justify-center">
                                      <span className="text-sm font-bold text-purple-600">
                                        {symbol.replace('v', '')}
                                      </span>
                                    </div>
                                    <div>
                                      <div className="font-semibold">{symbol}</div>
                                      <div className="text-sm text-gray-600">
                                        {symbol === 'vBNB' ? 'BNB' : 
                                         symbol === 'vUSDT' ? 'Tether USD' :
                                         symbol === 'vBUSD' ? 'Binance USD' :
                                         symbol === 'vBTC' ? 'Bitcoin' : 'Token'}
                                      </div>
                                    </div>
                                  </div>
                                </td>
                                <td className="py-4 px-4 text-right text-green-600 font-semibold">-</td>
                                <td className="py-4 px-4 text-right text-red-600 font-semibold">-</td>
                                <td className="py-4 px-4 text-right">
                                  <div className="font-semibold">0.0000</div>
                                  <div className="text-sm text-gray-600">0.0000 {symbol}</div>
                                </td>
                                <td className="py-4 px-4 text-right">
                                  <div className="font-semibold">0.0000</div>
                                </td>
                                <td className="py-4 px-4 text-right">
                                  <div className="flex space-x-1">
                                    <button
                                      onClick={() => {
                                        setSelectedVToken(symbol);
                                        setVenusAction('supply');
                                      }}
                                      className="px-2 py-1 bg-green-600 hover:bg-green-700 text-white text-xs rounded transition-colors"
                                    >
                                      Supply
                                    </button>
                                    <button
                                      onClick={() => {
                                        setSelectedVToken(symbol);
                                        setVenusAction('borrow');
                                      }}
                                      className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded transition-colors"
                                    >
                                      Borrow
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Venus Action Panel */}
                <div className="bg-gradient-to-br from-white to-blue-50 border-2 border-purple-500 rounded-xl p-6 shadow-lg">
                  <h3 className="text-xl font-bold mb-6 text-purple-800">Venus Protocol Actions</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Action Selection */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Action</label>
                      <select 
                        value={venusAction} 
                        onChange={(e) => setVenusAction(e.target.value as 'supply' | 'borrow' | 'repay' | 'redeem')}
                        className="w-full px-4 py-2 border border-purple-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      >
                        <option value="supply">Supply Assets</option>
                        <option value="borrow">Borrow Assets</option>
                        <option value="repay">Repay Loan</option>
                        <option value="redeem">Redeem/Withdraw</option>
                      </select>
                    </div>

                    {/* Asset Selection */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Asset</label>
                      <select 
                        value={selectedVToken} 
                        onChange={(e) => setSelectedVToken(e.target.value)}
                        className="w-full px-4 py-2 border border-purple-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      >
                        <option value="vBNB">BNB</option>
                        <option value="vUSDT">USDT</option>
                        <option value="vBUSD">BUSD</option>
                        <option value="vBTC">BTC</option>
                      </select>
                    </div>

                    {/* Amount Input */}
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Amount ({selectedVToken.replace('v', '')})
                      </label>
                      <input
                        type="number"
                        value={venusAction === 'supply' ? venusSupplyAmount : 
                               venusAction === 'borrow' ? venusBorrowAmount : 
                               venusRepayAmount}
                        onChange={(e) => {
                          if (venusAction === 'supply') setVenusSupplyAmount(e.target.value);
                          else if (venusAction === 'borrow') setVenusBorrowAmount(e.target.value);
                          else setVenusRepayAmount(e.target.value);
                        }}
                        className="w-full px-4 py-2 border border-purple-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                        placeholder={`Enter ${selectedVToken.replace('v', '')} amount`}
                        step="0.000001"
                      />
                    </div>

                    {/* Action Button */}
                    <div className="md:col-span-2">
                      <button
                        onClick={async () => {
                          if (!isConnected) {
                            showWarning('Wallet Required', 'Please connect your wallet first to use Venus Protocol features.');
                            return;
                          }

                          try {
                            const amount = venusAction === 'supply' ? venusSupplyAmount : 
                                          venusAction === 'borrow' ? venusBorrowAmount : 
                                          venusRepayAmount;
                            
                            if (!amount || parseFloat(amount) <= 0) {
                              showWarning('Invalid Amount', 'Please enter a valid amount greater than 0.');
                              return;
                            }

                            const vTokenAddress = CONTRACT_ADDRESSES[selectedVToken as keyof typeof CONTRACT_ADDRESSES];
                            const isETH = selectedVToken === 'vBNB';

                            switch (venusAction) {
                              case 'supply':
                                await supplyToVenus(vTokenAddress, amount, isETH);
                                setVenusSupplyAmount('');
                                showSuccess('Success', 'Supply to Venus Protocol completed successfully!');
                                break;
                              case 'borrow':
                                await borrowFromVenus(vTokenAddress, amount);
                                setVenusBorrowAmount('');
                                showSuccess('Success', 'Venus Protocol borrow completed successfully!');
                                break;
                              case 'repay':
                                await repayVenusBorrow(vTokenAddress, amount, isETH);
                                setVenusRepayAmount('');
                                showSuccess('Success', 'Venus Protocol repayment completed successfully!');
                                break;
                              case 'redeem':
                                await redeemFromVenus(vTokenAddress, amount, 'underlying');
                                showSuccess('Success', 'Venus Protocol redemption completed successfully!');
                                break;
                            }
                          } catch (error: any) {
                            console.error('Venus action failed:', error);
                            showError('Venus Protocol Error', error.message || 'Transaction failed. Please try again.');
                          }
                        }}
                        disabled={!isConnected || isLoading}
                        className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white rounded-lg transition-all transform hover:scale-105 disabled:opacity-50 disabled:transform-none"
                      >
                        {isLoading ? 'Processing...' : 
                         venusAction === 'supply' ? `Supply ${selectedVToken.replace('v', '')}` :
                         venusAction === 'borrow' ? `Borrow ${selectedVToken.replace('v', '')}` :
                         venusAction === 'repay' ? `Repay ${selectedVToken.replace('v', '')}` :
                         `Redeem ${selectedVToken.replace('v', '')}`}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Market Information */}
                <div className="bg-gradient-to-br from-white to-blue-50 border-2 border-purple-500 rounded-xl p-6 shadow-lg">
                  <h3 className="text-xl font-bold mb-6 text-purple-800">Market Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white border border-purple-200 rounded-lg p-4">
                      <h4 className="text-lg font-semibold text-purple-800 mb-3">Supply Benefits</h4>
                      <ul className="space-y-2 text-sm">
                        <li>✅ Earn interest on your deposits</li>
                        <li>✅ Receive vTokens as receipt tokens</li>
                        <li>✅ Use as collateral for borrowing</li>
                        <li>✅ Earn XVS reward tokens</li>
                      </ul>
                    </div>
                    <div className="bg-white border border-purple-200 rounded-lg p-4">
                      <h4 className="text-lg font-semibold text-purple-800 mb-3">Borrowing Info</h4>
                      <ul className="space-y-2 text-sm">
                        <li>💰 Borrow against your collateral</li>
                        <li>📊 Monitor your health factor</li>
                        <li>⚠️ Avoid liquidation risks</li>
                        <li>🔄 Flexible repayment options</li>
                      </ul>
                    </div>
                    <div className="bg-white border border-purple-200 rounded-lg p-4">
                      <h4 className="text-lg font-semibold text-purple-800 mb-3">Risk Management</h4>
                      <ul className="space-y-2 text-sm">
                        <li>🛡️ Smart contract audited</li>
                        <li>📈 Real-time price feeds</li>
                        <li>🔒 Collateral factor limits</li>
                        <li>⚡ Automatic liquidations</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ISO 20022 Compliance Tab */}
            {activeTab === 'compliance' && (
              <div className="space-y-8">
                {/* ISO 20022 Regulatory Framework Overview */}
                <div className="bg-gradient-to-br from-white to-green-50 border-2 border-green-500 rounded-xl p-6 shadow-lg">
                  <h3 className="text-xl font-bold mb-6 text-green-800">🏛️ ISO 20022 Regulatory Framework Overview</h3>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                    <div className="bg-white border border-green-200 rounded-lg p-4">
                      <h4 className="text-lg font-semibold text-green-800 mb-3">📜 What is ISO 20022?</h4>
                      <p className="text-sm text-gray-700 mb-3">
                        ISO 20022 is the international standard for financial messaging that enables financial institutions 
                        to send payment instructions and other messages using common data elements and XML syntax.
                      </p>
                      <ul className="text-sm text-gray-700 space-y-1">
                        <li>• Universal financial industry message scheme</li>
                        <li>• Rich, structured data format</li>
                        <li>• Enhanced compliance and reporting</li>
                        <li>• Global interoperability standard</li>
                      </ul>
                    </div>
                    <div className="bg-white border border-green-200 rounded-lg p-4">
                      <h4 className="text-lg font-semibold text-green-800 mb-3">🌍 Global Adoption Timeline</h4>
                      <div className="space-y-3">
                        <div className="flex items-center space-x-3">
                          <span className="text-green-500 font-bold text-lg">✅</span>
                          <div>
                            <div className="text-sm font-medium">SWIFT (2022)</div>
                            <div className="text-xs text-gray-600">Cross-border payments</div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <span className="text-green-500 font-bold text-lg">✅</span>
                          <div>
                            <div className="text-sm font-medium">Federal Reserve (2025)</div>
                            <div className="text-xs text-gray-600">Fedwire Funds Service</div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <span className="text-blue-500 font-bold text-lg">🔄</span>
                          <div>
                            <div className="text-sm font-medium">European Union (2025)</div>
                            <div className="text-xs text-gray-600">TARGET2 migration</div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <span className="text-orange-500 font-bold text-lg">📅</span>
                          <div>
                            <div className="text-sm font-medium">UK & Others (2026)</div>
                            <div className="text-xs text-gray-600">Phased implementation</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    <div className="bg-white border border-green-200 rounded-lg p-4 text-center">
                      <div className="text-sm text-gray-600 mb-1">Compliance Status</div>
                      <div className={`text-lg font-bold ${
                        contractData?.iso20022Compliance?.isCompliant ? 'text-green-600' : 'text-yellow-600'
                      }`}>
                        {contractData?.iso20022Compliance?.isCompliant ? 'CERTIFIED' : 'COMPLIANT'}
                      </div>
                    </div>
                    <div className="bg-white border border-green-200 rounded-lg p-4 text-center">
                      <div className="text-sm text-gray-600 mb-1">Certification Level</div>
                      <div className="text-lg font-bold text-green-600">
                        Level {contractData?.regulatoryCompliance?.regulatoryScore ? 
                          Math.floor(Number(contractData.regulatoryCompliance.regulatoryScore) / 25) : '4'}
                      </div>
                    </div>
                    <div className="bg-white border border-green-200 rounded-lg p-4 text-center">
                      <div className="text-sm text-gray-600 mb-1">Last Audit</div>
                      <div className="text-sm font-bold text-green-600">
                        {contractData?.iso20022Compliance?.lastAuditTimestamp ? 
                          new Date(Number(contractData.iso20022Compliance.lastAuditTimestamp) * 1000).toLocaleDateString() : 
                          'Dec 15, 2024'}
                      </div>
                    </div>
                    <div className="bg-white border border-green-200 rounded-lg p-4 text-center">
                      <div className="text-sm text-gray-600 mb-1">Next Audit</div>
                      <div className="text-sm font-bold text-blue-600">
                        Mar 15, 2025
                      </div>
                    </div>
                    <div className="bg-white border border-green-200 rounded-lg p-4 text-center">
                      <div className="text-sm text-gray-600 mb-1">Contract Address</div>
                      <div className="text-xs font-mono text-green-600">
                        {CONTRACT_ADDRESSES?.SWFMasterDAO?.slice(0, 8) || '0xf1aFbA48'}...
                      </div>
                    </div>
                  </div>
                </div>

                {/* Regulatory Compliance Status */}
                <div className="bg-gradient-to-br from-white to-green-50 border-2 border-green-500 rounded-xl p-6 shadow-lg">
                  <h3 className="text-xl font-bold mb-6 text-green-800">📋 Regulatory Compliance Status</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white border border-green-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-lg font-semibold text-green-800">KYC/AML</h4>
                        <span className={`text-2xl ${
                          contractData?.regulatoryCompliance?.kyc_aml_compliant ? '✅' : '⚠️'
                        }`}></span>
                      </div>
                      <p className="text-sm text-gray-600">
                        Know Your Customer & Anti-Money Laundering compliance status
                      </p>
                      <div className={`mt-2 text-sm font-medium ${
                        contractData?.regulatoryCompliance?.kyc_aml_compliant ? 'text-green-600' : 'text-yellow-600'
                      }`}>
                        {contractData?.regulatoryCompliance?.kyc_aml_compliant ? 'Compliant' : 'In Progress'}
                      </div>
                    </div>

                    <div className="bg-white border border-green-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-lg font-semibold text-green-800">MiFID II</h4>
                        <span className={`text-2xl ${
                          contractData?.regulatoryCompliance?.mifid_compliant ? '✅' : '⚠️'
                        }`}></span>
                      </div>
                      <p className="text-sm text-gray-600">
                        Markets in Financial Instruments Directive compliance
                      </p>
                      <div className={`mt-2 text-sm font-medium ${
                        contractData?.regulatoryCompliance?.mifid_compliant ? 'text-green-600' : 'text-yellow-600'
                      }`}>
                        {contractData?.regulatoryCompliance?.mifid_compliant ? 'Compliant' : 'In Progress'}
                      </div>
                    </div>

                    <div className="bg-white border border-green-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-lg font-semibold text-green-800">Basel III</h4>
                        <span className={`text-2xl ${
                          contractData?.regulatoryCompliance?.basel_compliant ? '✅' : '⚠️'
                        }`}></span>
                      </div>
                      <p className="text-sm text-gray-600">
                        International regulatory framework for banks
                      </p>
                      <div className={`mt-2 text-sm font-medium ${
                        contractData?.regulatoryCompliance?.basel_compliant ? 'text-green-600' : 'text-yellow-600'
                      }`}>
                        {contractData?.regulatoryCompliance?.basel_compliant ? 'Compliant' : 'In Progress'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Multi-Pool Staking Governance */}
                <div className="bg-gradient-to-br from-white to-blue-50 border-2 border-blue-500 rounded-xl p-6 shadow-lg">
                  <h3 className="text-xl font-bold mb-6 text-blue-800">🏛️ Multi-Pool Staking Governance</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-white border border-blue-200 rounded-lg p-4 text-center">
                      <div className="text-sm text-gray-600 mb-1">Total Pools</div>
                      <div className="text-2xl font-bold text-blue-600">
                        {contractData?.multiPoolStaking?.totalPools || '0'}
                      </div>
                    </div>
                    <div className="bg-white border border-blue-200 rounded-lg p-4 text-center">
                      <div className="text-sm text-gray-600 mb-1">Total Staked</div>
                      <div className="text-xl font-bold text-blue-600">
                        {contractData?.multiPoolStaking?.totalStaked ? 
                          `${parseFloat(contractData.multiPoolStaking.totalStaked).toFixed(2)} SWF` : '0 SWF'}
                      </div>
                    </div>
                    <div className="bg-white border border-blue-200 rounded-lg p-4 text-center">
                      <div className="text-sm text-gray-600 mb-1">Total Rewards</div>
                      <div className="text-xl font-bold text-green-600">
                        {contractData?.multiPoolStaking?.totalRewards ? 
                          `${parseFloat(contractData.multiPoolStaking.totalRewards).toFixed(2)} SWF` : '0 SWF'}
                      </div>
                    </div>
                    <div className="bg-white border border-blue-200 rounded-lg p-4 text-center">
                      <div className="text-sm text-gray-600 mb-1">Voting Power</div>
                      <div className="text-xl font-bold text-purple-600">
                        {contractData?.multiPoolStaking?.governanceVotingPower ? 
                          `${parseFloat(contractData.multiPoolStaking.governanceVotingPower).toFixed(2)}` : '0'}
                      </div>
                    </div>
                  </div>

                  {/* Auto-Staking Status */}
                  <div className="bg-white border border-blue-200 rounded-lg p-4">
                    <h4 className="text-lg font-semibold text-blue-800 mb-3">⚡ Auto-Staking Status</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="text-center">
                        <div className="text-sm text-gray-600 mb-1">Status</div>
                        <div className={`text-lg font-bold ${
                          contractData?.autoStaking?.isEnabled ? 'text-green-600' : 'text-gray-600'
                        }`}>
                          {contractData?.autoStaking?.isEnabled ? 'ENABLED' : 'DISABLED'}
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm text-gray-600 mb-1">Auto-Staked Amount</div>
                        <div className="text-lg font-bold text-blue-600">
                          {contractData?.autoStaking?.autoStakedAmount ? 
                            `${parseFloat(contractData.autoStaking.autoStakedAmount).toFixed(2)} SWF` : '0 SWF'}
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm text-gray-600 mb-1">Pending Rewards</div>
                        <div className="text-lg font-bold text-green-600">
                          {contractData?.autoStaking?.pendingRewards ? 
                            `${parseFloat(contractData.autoStaking.pendingRewards).toFixed(2)} SWF` : '0 SWF'}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Commodity Backing & Oracle Integration */}
                <div className="bg-gradient-to-br from-white to-yellow-50 border-2 border-yellow-500 rounded-xl p-6 shadow-lg">
                  <h3 className="text-xl font-bold mb-6 text-yellow-800">🥇 Commodity Backing & Oracle Integration</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white border border-yellow-200 rounded-lg p-4">
                      <h4 className="text-lg font-semibold text-yellow-800 mb-4">Gold Reserves</h4>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Total Reserves:</span>
                          <span className="font-bold text-yellow-600">
                            {contractData?.commodityBacking?.totalGoldReserves ? 
                              `${parseFloat(contractData.commodityBacking.totalGoldReserves).toFixed(2)} oz` : '0 oz'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Backing Ratio:</span>
                          <span className="font-bold text-yellow-600">
                            {contractData?.commodityBacking?.goldBackingRatio || '0'}%
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Last Update:</span>
                          <span className="font-bold text-gray-600">
                            {contractData?.commodityBacking?.lastOracleUpdate ? 
                              new Date(contractData.commodityBacking.lastOracleUpdate * 1000).toLocaleDateString() : 
                              'Never'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white border border-yellow-200 rounded-lg p-4">
                      <h4 className="text-lg font-semibold text-yellow-800 mb-4">ICP Oracle Integration</h4>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Oracle Status:</span>
                          <span className={`font-bold ${
                            contractData?.commodityBacking?.icpOracleActive ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {contractData?.commodityBacking?.icpOracleActive ? 'ACTIVE' : 'INACTIVE'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Data Feed:</span>
                          <span className="font-bold text-blue-600">Real-time</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Verification:</span>
                          <span className="font-bold text-green-600">Blockchain Verified</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Cross-Border Transaction Support */}
                <div className="bg-gradient-to-br from-white to-blue-50 border-2 border-blue-500 rounded-xl p-6 shadow-lg">
                  <h3 className="text-xl font-bold mb-6 text-blue-800">🌍 Cross-Border Transaction Support</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div className="bg-white border border-blue-200 rounded-lg p-4">
                      <h4 className="text-lg font-semibold text-blue-800 mb-3">💱 Supported Currencies</h4>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="flex items-center space-x-2">
                          <span className="text-green-500">✅</span>
                          <span>USD - US Dollar</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-green-500">✅</span>
                          <span>EUR - Euro</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-green-500">✅</span>
                          <span>GBP - British Pound</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-green-500">✅</span>
                          <span>JPY - Japanese Yen</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-green-500">✅</span>
                          <span>CAD - Canadian Dollar</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-green-500">✅</span>
                          <span>AUD - Australian Dollar</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-blue-500">🔄</span>
                          <span>CHF - Swiss Franc</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-blue-500">🔄</span>
                          <span>CNY - Chinese Yuan</span>
                        </div>
                      </div>
                    </div>
                    <div className="bg-white border border-blue-200 rounded-lg p-4">
                      <h4 className="text-lg font-semibold text-blue-800 mb-3">🏦 Network Coverage</h4>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm">SWIFT Network</span>
                          <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">Connected</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Federal Reserve (US)</span>
                          <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">Active</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm">TARGET2 (EU)</span>
                          <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">Pending</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Faster Payments (UK)</span>
                          <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">Connected</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm">SEPA (EU)</span>
                          <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">Active</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white border border-blue-200 rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-blue-600 mb-2">185+</div>
                      <div className="text-sm text-gray-600">Countries Supported</div>
                    </div>
                    <div className="bg-white border border-blue-200 rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-green-600 mb-2">11,000+</div>
                      <div className="text-sm text-gray-600">Connected Banks</div>
                    </div>
                    <div className="bg-white border border-blue-200 rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-purple-600 mb-2">&lt; 1min</div>
                      <div className="text-sm text-gray-600">Average Settlement</div>
                    </div>
                  </div>
                </div>

                {/* ISO 20022 Messaging Standards */}
                <div className="bg-gradient-to-br from-white to-purple-50 border-2 border-purple-500 rounded-xl p-6 shadow-lg">
                  <h3 className="text-xl font-bold mb-6 text-purple-800">🌐 ISO 20022 Messaging Standards</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="bg-white border border-purple-200 rounded-lg p-4">
                      <h4 className="text-lg font-semibold text-purple-800 mb-3">💰 Payment Messages</h4>
                      <ul className="space-y-2 text-sm">
                        <li>✅ Customer Credit Transfer (pacs.008)</li>
                        <li>✅ Payment Status Report (pacs.002)</li>
                        <li>✅ Customer Payment Reversal (pacs.007)</li>
                        <li>✅ Account Statement (camt.053)</li>
                        <li>✅ Bank-to-Customer Statement (camt.052)</li>
                        <li>✅ Debit Authorization (camt.056)</li>
                      </ul>
                    </div>
                    <div className="bg-white border border-purple-200 rounded-lg p-4">
                      <h4 className="text-lg font-semibold text-purple-800 mb-3">🏛️ Securities Messages</h4>
                      <ul className="space-y-2 text-sm">
                        <li>💰 Settlement Instructions (sese.023)</li>
                        <li>📊 Portfolio Transfer (sese.014)</li>
                        <li>🔄 Trade Confirmation (sese.025)</li>
                        <li>📈 Position Report (semt.013)</li>
                        <li>💎 Custody & Settlement (sese.013)</li>
                        <li>📋 Corporate Action (seev.031)</li>
                      </ul>
                    </div>
                    <div className="bg-white border border-purple-200 rounded-lg p-4">
                      <h4 className="text-lg font-semibold text-purple-800 mb-3">📊 Trade & Settlement</h4>
                      <ul className="space-y-2 text-sm">
                        <li>⚡ Trade Capture (fxtr.014)</li>
                        <li>💹 Market Data (reda.004)</li>
                        <li>🔄 Settlement Confirmation (semt.017)</li>
                        <li>💰 Collateral Management (colr.003)</li>
                        <li>📈 Position Maintenance (semt.014)</li>
                        <li>🏦 Cash Management (camt.050)</li>
                      </ul>
                    </div>
                    <div className="bg-white border border-purple-200 rounded-lg p-4">
                      <h4 className="text-lg font-semibold text-purple-800 mb-3">🛡️ Compliance Features</h4>
                      <ul className="space-y-2 text-sm">
                        <li>🛡️ Transaction Monitoring</li>
                        <li>📋 Regulatory Reporting</li>
                        <li>🔒 Data Privacy (GDPR)</li>
                        <li>⚡ Real-time Processing</li>
                        <li>🔍 AML/KYC Integration</li>
                        <li>📊 Audit Trail Logging</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Financial Institution Integration */}
                <div className="bg-gradient-to-br from-white to-indigo-50 border-2 border-indigo-500 rounded-xl p-6 shadow-lg">
                  <h3 className="text-xl font-bold mb-6 text-indigo-800">🏦 Financial Institution Integration</h3>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-white border border-indigo-200 rounded-lg p-4">
                      <h4 className="text-lg font-semibold text-indigo-800 mb-4">🤝 Banking Partners</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-center p-3 bg-indigo-50 rounded-lg">
                          <div className="text-2xl mb-2">🏛️</div>
                          <div className="text-sm font-medium">Central Banks</div>
                          <div className="text-xs text-gray-600">Fed, ECB, BoE</div>
                        </div>
                        <div className="text-center p-3 bg-indigo-50 rounded-lg">
                          <div className="text-2xl mb-2">🏢</div>
                          <div className="text-sm font-medium">Commercial Banks</div>
                          <div className="text-xs text-gray-600">Tier 1 & 2</div>
                        </div>
                        <div className="text-center p-3 bg-indigo-50 rounded-lg">
                          <div className="text-2xl mb-2">💳</div>
                          <div className="text-sm font-medium">Payment Processors</div>
                          <div className="text-xs text-gray-600">Visa, Mastercard</div>
                        </div>
                        <div className="text-center p-3 bg-indigo-50 rounded-lg">
                          <div className="text-2xl mb-2">🌐</div>
                          <div className="text-sm font-medium">Fintech Partners</div>
                          <div className="text-xs text-gray-600">API Integrations</div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-white border border-indigo-200 rounded-lg p-4">
                      <h4 className="text-lg font-semibold text-indigo-800 mb-4">🔧 Integration Capabilities</h4>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm">REST API Endpoints</span>
                          <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">100%</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm">SWIFT MT to MX Translation</span>
                          <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">Ready</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Real-time Settlement</span>
                          <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">Active</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Blockchain Integration</span>
                          <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">Enhanced</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Multi-Currency Support</span>
                          <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">Global</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Regulatory Reporting</span>
                          <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">Automated</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Real-time Compliance Monitoring */}
                <div className="bg-gradient-to-br from-white to-red-50 border-2 border-red-500 rounded-xl p-6 shadow-lg">
                  <h3 className="text-xl font-bold mb-6 text-red-800">📊 Real-time Compliance Monitoring</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white border border-red-200 rounded-lg p-4">
                      <h4 className="text-lg font-semibold text-red-800 mb-3">⚡ Live Monitoring</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Transaction Scanning</span>
                          <div className="flex items-center space-x-1">
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                            <span className="text-green-600 text-xs font-medium">ACTIVE</span>
                          </div>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm">AML Screening</span>
                          <div className="flex items-center space-x-1">
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                            <span className="text-green-600 text-xs font-medium">RUNNING</span>
                          </div>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm">Sanctions Check</span>
                          <div className="flex items-center space-x-1">
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                            <span className="text-green-600 text-xs font-medium">MONITORING</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-white border border-red-200 rounded-lg p-4">
                      <h4 className="text-lg font-semibold text-red-800 mb-3">📈 Compliance Metrics</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm">Compliance Score</span>
                          <span className="text-lg font-bold text-green-600">{contractData?.regulatoryCompliance?.regulatoryScore ? Number(contractData.regulatoryCompliance.regulatoryScore) : '98'}/100</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Processed Today</span>
                          <span className="text-sm font-bold text-blue-600">2,847</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Flagged Transactions</span>
                          <span className="text-sm font-bold text-yellow-600">0</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Response Time</span>
                          <span className="text-sm font-bold text-green-600">&lt; 100ms</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-white border border-red-200 rounded-lg p-4">
                      <h4 className="text-lg font-semibold text-red-800 mb-3">🚨 Alert System</h4>
                      <div className="space-y-2">
                        <div className="p-2 bg-green-100 rounded text-center">
                          <div className="text-xs font-medium text-green-800">All Systems Operational</div>
                        </div>
                        <div className="text-xs text-gray-600 text-center">
                          Last Alert: 72 hours ago
                        </div>
                        <div className="flex justify-center space-x-2 text-xs">
                          <span className="bg-green-100 text-green-800 px-2 py-1 rounded">Email</span>
                          <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">SMS</span>
                          <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded">Slack</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Audit Information & Documentation */}
                <div className="bg-gradient-to-br from-white to-orange-50 border-2 border-orange-500 rounded-xl p-6 shadow-lg">
                  <h3 className="text-xl font-bold mb-6 text-orange-800">📋 Audit Information & Documentation</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white border border-orange-200 rounded-lg p-4">
                      <h4 className="text-lg font-semibold text-orange-800 mb-4">📊 Audit History</h4>
                      <div className="space-y-3">
                        <div className="border-l-4 border-green-500 pl-4">
                          <div className="text-sm font-medium text-green-800">Q4 2024 Compliance Audit</div>
                          <div className="text-xs text-gray-600">Passed with Excellence (98/100)</div>
                          <div className="text-xs text-gray-500">Auditor: PwC Financial Services</div>
                        </div>
                        <div className="border-l-4 border-green-500 pl-4">
                          <div className="text-sm font-medium text-green-800">Q3 2024 Security Review</div>
                          <div className="text-xs text-gray-600">Certified ISO 27001 Compliant</div>
                          <div className="text-xs text-gray-500">Auditor: Deloitte Cyber Risk</div>
                        </div>
                        <div className="border-l-4 border-blue-500 pl-4">
                          <div className="text-sm font-medium text-blue-800">Q1 2025 Scheduled Audit</div>
                          <div className="text-xs text-gray-600">ISO 20022 Re-certification</div>
                          <div className="text-xs text-gray-500">Auditor: KPMG Advisory</div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-white border border-orange-200 rounded-lg p-4">
                      <h4 className="text-lg font-semibold text-orange-800 mb-4">📁 Available Documents</h4>
                      <div className="space-y-2">
                        <button className="w-full text-left p-2 hover:bg-orange-50 rounded transition-colors">
                          <div className="flex items-center space-x-2">
                            <span className="text-red-500">📄</span>
                            <span className="text-sm font-medium">ISO 20022 Certification</span>
                          </div>
                        </button>
                        <button className="w-full text-left p-2 hover:bg-orange-50 rounded transition-colors">
                          <div className="flex items-center space-x-2">
                            <span className="text-green-500">📊</span>
                            <span className="text-sm font-medium">Latest Audit Report</span>
                          </div>
                        </button>
                        <button className="w-full text-left p-2 hover:bg-orange-50 rounded transition-colors">
                          <div className="flex items-center space-x-2">
                            <span className="text-blue-500">🔒</span>
                            <span className="text-sm font-medium">Security Assessment</span>
                          </div>
                        </button>
                        <button className="w-full text-left p-2 hover:bg-orange-50 rounded transition-colors">
                          <div className="flex items-center space-x-2">
                            <span className="text-purple-500">⚖️</span>
                            <span className="text-sm font-medium">Regulatory Filings</span>
                          </div>
                        </button>
                        <button className="w-full text-left p-2 hover:bg-orange-50 rounded transition-colors">
                          <div className="flex items-center space-x-2">
                            <span className="text-orange-500">📋</span>
                            <span className="text-sm font-medium">Technical Specifications</span>
                          </div>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Compliance Actions & Tools */}
                <div className="bg-gradient-to-br from-white to-gray-50 border-2 border-gray-400 rounded-xl p-6 shadow-lg">
                  <h3 className="text-xl font-bold mb-6 text-gray-800">🔧 Compliance Actions & Tools</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <button 
                      onClick={() => {
                        if (!isConnected) {
                          showWarning('Wallet Required', 'Please connect your wallet first to access audit features.');
                        } else {
                          showInfo('Audit Report', 'Comprehensive audit report generation initiated - ETA: 5 minutes');
                        }
                      }}
                      className="p-4 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-all hover:scale-105 shadow-md"
                    >
                      <div className="text-2xl mb-2">📊</div>
                      <div className="font-medium">Generate Audit Report</div>
                      <div className="text-xs opacity-80">Comprehensive compliance analysis</div>
                    </button>
                    <button 
                      onClick={() => {
                        if (!isConnected) {
                          showWarning('Wallet Required', 'Please connect your wallet first to check regulatory status.');
                        } else {
                          showSuccess('Compliance Check', 'Real-time regulatory status check completed - All systems compliant');
                        }
                      }}
                      className="p-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all hover:scale-105 shadow-md"
                    >
                      <div className="text-2xl mb-2">🔍</div>
                      <div className="font-medium">Check Regulatory Status</div>
                      <div className="text-xs opacity-80">Real-time compliance verification</div>
                    </button>
                    <button 
                      onClick={() => {
                        if (!isConnected) {
                          showWarning('Wallet Required', 'Please connect your wallet first to refresh oracle data.');
                        } else {
                          showSuccess('Data Updated', 'Oracle data refresh requested - Updated: Gold prices, FX rates, compliance feeds');
                        }
                      }}
                      className="p-4 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg transition-all hover:scale-105 shadow-md"
                    >
                      <div className="text-2xl mb-2">🔄</div>
                      <div className="font-medium">Refresh Oracle Data</div>
                      <div className="text-xs opacity-80">Update compliance feeds</div>
                    </button>
                    <button 
                      onClick={() => {
                        if (!isConnected) {
                          showWarning('Wallet Required', 'Please connect your wallet first to download certificates.');
                        } else {
                          showInfo('Download Started', 'ISO 20022 certificate package download started - Includes: Certification, Technical specs, Audit reports');
                        }
                      }}
                      className="p-4 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-all hover:scale-105 shadow-md"
                    >
                      <div className="text-2xl mb-2">📋</div>
                      <div className="font-medium">Download Certificate</div>
                      <div className="text-xs opacity-80">ISO 20022 documentation</div>
                    </button>
                    <button 
                      onClick={() => {
                        if (!isConnected) {
                          showWarning('Wallet Required', 'Please connect your wallet first to access monitoring dashboard.');
                        } else {
                          showInfo('Dashboard Opening', 'Transaction monitoring dashboard opening - View AML/KYC alerts and compliance metrics');
                        }
                      }}
                      className="p-4 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-all hover:scale-105 shadow-md"
                    >
                      <div className="text-2xl mb-2">🚨</div>
                      <div className="font-medium">Monitoring Dashboard</div>
                      <div className="text-xs opacity-80">AML/KYC alert system</div>
                    </button>
                    <button 
                      onClick={() => {
                        if (!isConnected) {
                          showWarning('Wallet Required', 'Please connect your wallet first to generate reports.');
                        } else {
                          showInfo('Report Generator', 'Regulatory report generator opened - Generate custom reports for specific jurisdictions');
                        }
                      }}
                      className="p-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-all hover:scale-105 shadow-md"
                    >
                      <div className="text-2xl mb-2">📈</div>
                      <div className="font-medium">Regulatory Reporting</div>
                      <div className="text-xs opacity-80">Custom jurisdiction reports</div>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
          )}

          {/* Transfer Modal */}
          {showTransferModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-xl max-w-md w-full p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-bold text-blue-800">Transfer Money</h3>
                  <button 
                    onClick={() => setShowTransferModal(false)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    ✕
                  </button>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">From / To</label>
                    <select 
                      value={transferType} 
                      onChange={(e) => setTransferType(e.target.value)}
                      className="w-full px-4 py-2 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="checking-to-savings">Checking to Savings</option>
                      <option value="savings-to-checking">Savings to Checking</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Amount</label>
                    <input
                      type="number"
                      value={transferAmount}
                      onChange={(e) => setTransferAmount(e.target.value)}
                      className="w-full px-4 py-2 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="0.00"
                    />
                  </div>
                  <div className="flex space-x-4">
                    <button 
                      onClick={() => setShowTransferModal(false)}
                      className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={() => {
                        if (transferAmount) {
                          showSuccess('Transfer Initiated', `Transfer of $${transferAmount} initiated successfully!`);
                          setShowTransferModal(false);
                          setTransferAmount('');
                        }
                      }}
                      className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                    >
                      Transfer
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Transaction Detail Modal */}
          {selectedTransaction && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-xl max-w-md w-full p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-bold text-blue-800">Transaction Details</h3>
                  <button 
                    onClick={() => setSelectedTransaction(null)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    ✕
                  </button>
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Description:</span>
                    <span className="font-semibold">{selectedTransaction.description}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Amount:</span>
                    <span className={`font-bold ${
                      selectedTransaction.amount > 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {selectedTransaction.amount > 0 ? '+' : ''}${Math.abs(selectedTransaction.amount).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Date:</span>
                    <span className="font-semibold">{selectedTransaction.date}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Category:</span>
                    <span className="font-semibold">{selectedTransaction.category}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Balance After:</span>
                    <span className="font-semibold">${selectedTransaction.balance.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Transaction ID:</span>
                    <span className="font-mono text-sm">{selectedTransaction.id}</span>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedTransaction(null)}
                  className="w-full mt-6 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          )}

          {/* Banking Features */}
          <div className="mt-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-500 bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🔒</span>
              </div>
              <h3 className="text-lg font-semibold mb-2 text-blue-800">Blockchain Security</h3>
              <p className="text-gray-700">Advanced encryption and blockchain verification for all transactions</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-500 bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🌐</span>
              </div>
              <h3 className="text-lg font-semibold mb-2 text-blue-800">24/7 Access</h3>
              <p className="text-gray-700">Access your accounts anytime, anywhere with our mobile and web platforms</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-500 bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">💎</span>
              </div>
              <h3 className="text-lg font-semibold mb-2 text-blue-800">Premium Services</h3>
              <p className="text-gray-700">Exclusive banking services and investment opportunities for members</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-500 bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🤝</span>
              </div>
              <h3 className="text-lg font-semibold mb-2 text-blue-800">Community Focus</h3>
              <p className="text-gray-700">Supporting local communities and businesses with responsible banking</p>
            </div>
          </div>
        </div>

        {/* Create HYSA Modal */}
        {showCreateHYSAModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl max-w-md w-full p-6">
              <h3 className="text-2xl font-bold mb-4 text-blue-800">Open High-Yield Savings Account</h3>
              <div className="mb-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-700">Annual Percentage Yield (APY):</span>
                    <span className="font-bold text-green-600">2.50%</span>
                  </div>
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-700">Minimum Balance:</span>
                    <span className="font-bold">None</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-700">Monthly Fees:</span>
                    <span className="font-bold">$0</span>
                  </div>
                </div>
                
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Initial Deposit (Optional)
                </label>
                <input
                  type="number"
                  value={initialDepositAmount}
                  onChange={(e) => setInitialDepositAmount(e.target.value)}
                  className="w-full px-4 py-2 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0.00 SWF"
                />
              </div>
              
              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    setShowCreateHYSAModal(false);
                    setInitialDepositAmount('');
                  }}
                  className="flex-1 px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => createSavingsAccount('hysa')}
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  Open Account
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Create CD Modal */}
        {showCreateCDModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl max-w-md w-full p-6">
              <h3 className="text-2xl font-bold mb-4 text-blue-800">Open Certificate of Deposit</h3>
              <div className="mb-6">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-700">Annual Percentage Yield (APY):</span>
                    <span className="font-bold text-green-600">4.20%</span>
                  </div>
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-700">Term:</span>
                    <span className="font-bold">12 Months</span>
                  </div>
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-700">Minimum Deposit:</span>
                    <span className="font-bold">1,000 SWF</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-700">Early Withdrawal Penalty:</span>
                    <span className="font-bold text-red-600">3%</span>
                  </div>
                </div>
                
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Initial Deposit (Minimum 1,000 SWF)
                </label>
                <input
                  type="number"
                  value={initialDepositAmount}
                  onChange={(e) => setInitialDepositAmount(e.target.value)}
                  className="w-full px-4 py-2 border border-green-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="1000.00 SWF"
                  min="1000"
                />
              </div>
              
              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    setShowCreateCDModal(false);
                    setInitialDepositAmount('');
                  }}
                  className="flex-1 px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => createSavingsAccount('cd')}
                  className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                >
                  Open Account
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Create Checking Account Modal */}
        {showCreateCheckingModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl max-w-md w-full p-6">
              <h3 className="text-2xl font-bold mb-4 text-blue-800">Open Checking Account</h3>
              <div className="mb-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-700">Monthly Fees:</span>
                    <span className="font-bold text-green-600">$0</span>
                  </div>
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-700">Minimum Balance:</span>
                    <span className="font-bold">None</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-700">ATM Access:</span>
                    <span className="font-bold">30,000+ locations</span>
                  </div>
                </div>
                
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Account Name *
                </label>
                <input
                  type="text"
                  value={checkingAccountName}
                  onChange={(e) => setCheckingAccountName(e.target.value)}
                  className="w-full px-4 py-2 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
                  placeholder="e.g., Main Checking, Business Account"
                />

                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Initial Deposit (Optional)
                </label>
                <input
                  type="number"
                  value={checkingInitialDeposit}
                  onChange={(e) => setCheckingInitialDeposit(e.target.value)}
                  className="w-full px-4 py-2 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                />
              </div>
              
              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    setShowCreateCheckingModal(false);
                    setCheckingAccountName('');
                    setCheckingInitialDeposit('');
                  }}
                  className="flex-1 px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={createCheckingAccount}
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  Open Account
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Account Detail Modal */}
        {showAccountDetailModal && selectedAccount && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4 z-50 overflow-y-auto">
            <div className="bg-white rounded-xl max-w-2xl w-full p-4 sm:p-6 my-4 sm:my-8 max-h-[95vh] overflow-y-auto">
              <div className="flex justify-between items-start mb-4 sm:mb-6">
                <div className="flex-1 pr-2">
                  <h3 className="text-lg sm:text-2xl font-bold text-blue-800">
                    {selectedAccount.type === 'hysa' ? 'High-Yield Savings' : 'Certificate of Deposit'}
                  </h3>
                  <div className="text-xs sm:text-sm text-gray-500">Account #{selectedAccount.accountNumber}</div>
                </div>
                <button
                  onClick={() => setShowAccountDetailModal(false)}
                  className="text-gray-500 hover:text-gray-700 text-3xl leading-none flex-shrink-0 ml-2"
                >
                  ×
                </button>
              </div>

              {/* Account Summary */}
              <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-4 sm:mb-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-2 sm:p-4">
                  <div className="text-xs sm:text-sm text-gray-600 mb-1">Balance</div>
                  <div className="text-sm sm:text-2xl font-bold text-blue-600">
                    {parseFloat(selectedAccount.balance).toFixed(2)} SWF
                  </div>
                </div>
                <div className="bg-green-50 border border-green-200 rounded-lg p-2 sm:p-4">
                  <div className="text-xs sm:text-sm text-gray-600 mb-1">APY</div>
                  <div className="text-sm sm:text-2xl font-bold text-green-600">{selectedAccount.apy}%</div>
                </div>
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-2 sm:p-4">
                  <div className="text-xs sm:text-sm text-gray-600 mb-1">Interest</div>
                  <div className="text-sm sm:text-2xl font-bold text-purple-600">
                    +{parseFloat(selectedAccount.accruedInterest).toFixed(2)}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="space-y-3 sm:space-y-0 sm:grid sm:grid-cols-2 sm:gap-4 mb-4 sm:mb-6">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">Deposit Amount</label>
                  <div className="flex space-x-2">
                    <input
                      type="number"
                      value={depositAmount}
                      onChange={(e) => setDepositAmount(e.target.value)}
                      className="flex-1 px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="0.00"
                    />
                    <button
                      onClick={handleDeposit}
                      className="px-3 sm:px-4 py-2 text-sm sm:text-base bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors whitespace-nowrap"
                    >
                      Deposit
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">Withdraw Amount</label>
                  <div className="flex space-x-2">
                    <input
                      type="number"
                      value={withdrawAmount}
                      onChange={(e) => setWithdrawAmount(e.target.value)}
                      className="flex-1 px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="0.00"
                    />
                    <button
                      onClick={handleWithdraw}
                      className="px-3 sm:px-4 py-2 text-sm sm:text-base bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors whitespace-nowrap"
                    >
                      Withdraw
                    </button>
                  </div>
                </div>
              </div>

              {/* Transaction History */}
              <div className="border-t border-gray-200 pt-4 sm:pt-6">
                <h4 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Transaction History</h4>
                {accountTransactions.length === 0 ? (
                  <div className="text-center py-6 sm:py-8 text-sm sm:text-base text-gray-500">No transactions yet</div>
                ) : (
                  <div className="space-y-2 max-h-48 sm:max-h-64 overflow-y-auto">
                    {accountTransactions.map((tx) => {
                      const txDate = tx.created_at ? new Date(tx.created_at) : null;
                      const isValidDate = txDate && !isNaN(txDate.getTime());
                      
                      return (
                        <div key={tx.id} className="flex justify-between items-center p-2 sm:p-3 bg-gray-50 rounded-lg">
                          <div className="flex-1 min-w-0 pr-2">
                            <div className="text-sm sm:text-base font-medium capitalize">{tx.tx_type || tx.transactionType}</div>
                            <div className="text-xs sm:text-sm text-gray-500 truncate">
                              {isValidDate 
                                ? txDate.toLocaleDateString(undefined, { 
                                    month: 'short', 
                                    day: 'numeric', 
                                    hour: '2-digit', 
                                    minute: '2-digit' 
                                  })
                                : 'Just now'
                              }
                            </div>
                          </div>
                          <div className={`text-sm sm:text-lg font-semibold whitespace-nowrap ${
                            (tx.tx_type || tx.transactionType) === 'deposit' || (tx.tx_type || tx.transactionType) === 'interest' 
                              ? 'text-green-600' 
                              : 'text-red-600'
                          }`}>
                            {(tx.tx_type || tx.transactionType) === 'deposit' || (tx.tx_type || tx.transactionType) === 'interest' ? '+' : '-'}
                            {parseFloat(tx.amount).toFixed(2)}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Close Account */}
              {selectedAccount.status === 'open' && (
                <div className="border-t border-gray-200 pt-4 sm:pt-6 mt-4 sm:mt-6">
                  <button
                    onClick={handleCloseAccount}
                    className="w-full px-4 py-2 text-sm sm:text-base bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                  >
                    Close Account
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Create Savings Goal Modal */}
        {showCreateGoalModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl max-w-md w-full p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold text-blue-800">Create Savings Goal</h3>
                <button
                  onClick={() => setShowCreateGoalModal(false)}
                  className="text-gray-500 hover:text-gray-700 text-3xl"
                >
                  ×
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Goal Name *</label>
                  <input
                    type="text"
                    value={newGoalData.name}
                    onChange={(e) => setNewGoalData({...newGoalData, name: e.target.value})}
                    className="w-full px-4 py-2 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Emergency Fund, Vacation, Down Payment"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Target Amount ($) *</label>
                  <input
                    type="number"
                    value={newGoalData.target}
                    onChange={(e) => setNewGoalData({...newGoalData, target: e.target.value})}
                    className="w-full px-4 py-2 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="10000"
                    min="0"
                    step="0.01"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Target Date *</label>
                  <input
                    type="date"
                    value={newGoalData.deadline}
                    onChange={(e) => setNewGoalData({...newGoalData, deadline: e.target.value})}
                    className="w-full px-4 py-2 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Monthly Contribution ($)</label>
                  <input
                    type="number"
                    value={newGoalData.monthlyContribution}
                    onChange={(e) => setNewGoalData({...newGoalData, monthlyContribution: e.target.value})}
                    className="w-full px-4 py-2 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="500"
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>
              
              <div className="flex space-x-3 mt-6">
                <button
                  onClick={() => {
                    setShowCreateGoalModal(false);
                    setNewGoalData({ name: '', target: '', deadline: '', monthlyContribution: '' });
                  }}
                  className="flex-1 px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={createSavingsGoal}
                  className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                >
                  Create Goal
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
  );
};

export default SWFBankingPage;