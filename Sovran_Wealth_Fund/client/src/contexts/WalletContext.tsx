import React, { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';

// Provider utilities for Web3 browser compatibility with Binance Wallet support
const getEthereumProvider = () => {
  if (typeof window === 'undefined') return null;
  
  // Provider priority order:
  // 1. Modern Binance Web3 Wallet (window.binancew3w.ethereum)
  // 2. Legacy Binance Chain Wallet (window.BinanceChain)
  // 3. MetaMask and other providers (window.ethereum)
  
  // Check for modern Binance Web3 Wallet first (highest priority)
  if ((window as any).binancew3w?.ethereum) {
    console.log('🟡 Detected Binance Web3 Wallet (modern)');
    return (window as any).binancew3w.ethereum;
  }
  
  // Check for legacy Binance Chain Wallet
  if ((window as any).BinanceChain) {
    console.log('🟡 Detected Binance Chain Wallet (legacy)');
    return (window as any).BinanceChain;
  }
  
  // Type assertion to handle multiple providers (common in Web3 browsers)
  const ethereumWithProviders = window.ethereum as any;
  
  // Handle multiple providers in window.ethereum
  if (ethereumWithProviders?.providers?.length) {
    // Check for Binance providers first in the providers array
    const binanceWeb3Provider = ethereumWithProviders.providers.find(
      (provider: any) => provider.isBinanceW3W || provider.isBinance
    );
    if (binanceWeb3Provider) {
      console.log('🟡 Detected Binance provider in providers array');
      return binanceWeb3Provider;
    }
    
    // Then prefer MetaMask
    const metaMaskProvider = ethereumWithProviders.providers.find(
      (provider: any) => provider.isMetaMask
    );
    if (metaMaskProvider) {
      console.log('🦊 Detected MetaMask provider in providers array');
      return metaMaskProvider;
    }
    
    // Return first provider as fallback
    return ethereumWithProviders.providers[0];
  }
  
  // Single provider or direct access (could be MetaMask or others)
  if (window.ethereum) {
    console.log('🔗 Detected Web3 provider (window.ethereum)');
    return window.ethereum;
  }
  
  return null;
};

const waitForProvider = (maxWaitTime = 15000): Promise<any> => {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    const pollInterval = 400; // Poll every 400ms
    let ethereumInitializedListener: any = null;
    
    const cleanup = () => {
      if (ethereumInitializedListener) {
        window.removeEventListener('ethereum#initialized', ethereumInitializedListener);
      }
    };
    
    const checkProvider = () => {
      const provider = getEthereumProvider();
      if (provider) {
        console.log(`✅ Provider found after ${Date.now() - startTime}ms`);
        cleanup();
        resolve(provider);
        return true;
      }
      return false;
    };
    
    // Check immediately first
    if (checkProvider()) return;
    
    // Set up ethereum#initialized event listener for MetaMask/Web3 wallet initialization
    ethereumInitializedListener = () => {
      console.log('🔧 ethereum#initialized event fired');
      setTimeout(() => {
        if (checkProvider()) return;
      }, 100); // Small delay to let provider fully initialize
    };
    window.addEventListener('ethereum#initialized', ethereumInitializedListener);
    
    // Set up polling with backoff
    const pollForProvider = () => {
      const elapsed = Date.now() - startTime;
      
      if (elapsed >= maxWaitTime) {
        cleanup();
        reject(new Error(`Provider not found after ${maxWaitTime}ms`));
        return;
      }
      
      if (!checkProvider()) {
        // Continue polling
        setTimeout(pollForProvider, pollInterval);
      }
    };
    
    // Start polling
    setTimeout(pollForProvider, pollInterval);
  });
};

// Helper function to get wallet type for better user experience
const getWalletType = (provider: any): string => {
  if (!provider) return 'Unknown';
  
  // Check for Binance wallets
  if (provider.isBinanceW3W || (window as any).binancew3w?.ethereum === provider) {
    return 'Binance Web3 Wallet';
  }
  if (provider.isBinance || (window as any).BinanceChain === provider) {
    return 'Binance Chain Wallet';
  }
  
  // Check for MetaMask
  if (provider.isMetaMask) {
    return 'MetaMask';
  }
  
  return 'Web3 Wallet';
};

// Helper function to hex-encode messages for wallet compatibility (MetaMask Mobile, Binance Wallet)
const hexEncodeMessage = (message: string): string => {
  if (typeof Buffer !== 'undefined') {
    return '0x' + Buffer.from(message, 'utf8').toString('hex');
  }
  // Fallback for environments without Buffer
  return '0x' + Array.from(new TextEncoder().encode(message))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
};

// Types for wallet state
interface UserInfo {
  id?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  walletAddress?: string;
  createdAt?: string;
  lastLogin?: string;
}

interface WalletState {
  isConnected: boolean;
  account: string;
  isConnecting: boolean;
  isLoggedIn: boolean;
  userInfo: UserInfo | null;
  loginError: string | null;
  networkInfo: {
    chainId: string | null;
    chainName: string | null;
  };
}

interface WalletContextType extends WalletState {
  // Connection methods
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  loginWithWallet: (walletAddress: string) => Promise<boolean>;
  
  // Utility methods
  checkWalletConnection: () => Promise<void>;
  checkExistingAuth: () => Promise<void>;
  clearError: () => void;
  
  // Network methods
  switchToBSC: () => Promise<void>;
  
  // Persistence
  refreshAuth: () => Promise<void>;
}

// Create the context
const WalletContext = createContext<WalletContextType | undefined>(undefined);

// Hook to use wallet context
export const useWallet = () => {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
};

// Provider component
interface WalletProviderProps {
  children: ReactNode;
}

export const WalletProvider: React.FC<WalletProviderProps> = ({ children }) => {
  // Provider ref for reliable Web3 browser compatibility
  const providerRef = useRef<any>(null);
  const eventListenersAttached = useRef(false);
  
  // State management
  const [walletState, setWalletState] = useState<WalletState>({
    isConnected: false,
    account: '',
    isConnecting: false,
    isLoggedIn: false,
    userInfo: null,
    loginError: null,
    networkInfo: {
      chainId: null,
      chainName: null
    }
  });

  // Initialize provider and wallet on mount
  useEffect(() => {
    initializeProvider();
  }, []);
  
  // Initialize provider with robust timing handling
  const initializeProvider = async () => {
    console.log('🔍 Initializing Web3 provider...');
    console.log('📱 User Agent:', navigator.userAgent);
    console.log('🪟 Window ethereum:', typeof window.ethereum, !!window.ethereum);
    console.log('🪟 Window binancew3w:', typeof (window as any).binancew3w, !!(window as any).binancew3w);
    console.log('🪟 Window BinanceChain:', typeof (window as any).BinanceChain, !!(window as any).BinanceChain);
    
    try {
      // First attempt - immediate check
      let provider = getEthereumProvider();
      console.log('🔍 getEthereumProvider returned:', !!provider, provider ? 'PROVIDER FOUND' : 'NO PROVIDER');
      if (provider) {
        console.log('✅ Provider available immediately');
        providerRef.current = provider;
        await setupProviderAndWallet(provider);
        return;
      }
      
      console.log('⌛ Provider not immediately available, waiting with polling...');
      
      // Robust waiting with polling and event listeners
      provider = await waitForProvider(15000);
      
      if (provider) {
        providerRef.current = provider;
        await setupProviderAndWallet(provider);
      } else {
        handleProviderNotFound();
      }
    } catch (error) {
      console.warn('⚠️ Provider initialization timeout:', error.message);
      handleProviderNotFound();
      
      // Continue trying in background for Web3 browsers
      const isWeb3Browser = /MetaMask|Binance|TrustWallet|Web3|DApp|TokenPocket|imToken/i.test(navigator.userAgent);
      if (isWeb3Browser) {
        console.log('🔄 Web3 browser detected, continuing background attempts...');
        continueBackgroundProviderSearch();
      }
    }
  };
  
  const setupProviderAndWallet = async (provider: any) => {
    const walletType = getWalletType(provider);
    console.log(`✅ Provider ready: ${walletType}`);
    
    // Clear any previous errors
    setWalletState(prev => ({
      ...prev,
      loginError: null
    }));
    
    // Attach event listeners once
    attachProviderEventListeners();
    
    // Initialize wallet after provider is ready
    await initializeWallet();
  };
  
  const handleProviderNotFound = () => {
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const isWeb3Browser = /MetaMask|Binance|TrustWallet|Web3|DApp|TokenPocket|imToken/i.test(navigator.userAgent);
    
    let errorMessage: string;
    if (isWeb3Browser) {
      errorMessage = 'Web3 provider is loading... Please wait or refresh if this persists.';
    } else if (isMobile) {
      errorMessage = 'Please open this site in Binance Wallet, MetaMask Mobile Browser, or install a Web3 wallet app';
    } else {
      errorMessage = 'Please install Binance Wallet, MetaMask browser extension, or another Web3 wallet to connect';
    }
    
    console.log('❌ Provider not found:', errorMessage);
    setWalletState(prev => ({
      ...prev,
      loginError: errorMessage
    }));
  };
  
  const continueBackgroundProviderSearch = () => {
    const backgroundSearch = async () => {
      try {
        console.log('🔍 Background search for provider...');
        const provider = await waitForProvider(30000); // Longer timeout for background
        if (provider && !providerRef.current) {
          console.log('✅ Provider found in background!');
          providerRef.current = provider;
          await setupProviderAndWallet(provider);
        }
      } catch (error) {
        // Silent fail for background search
        console.log('🔴 Background provider search timeout');
      }
    };
    
    // Start background search after a delay
    setTimeout(backgroundSearch, 2000);
  };

  // Attach provider event listeners with WebView compatibility
  const attachProviderEventListeners = () => {
    if (!providerRef.current || eventListenersAttached.current) return;
    
    const provider = providerRef.current;
    
    const handleAccountsChanged = (accounts: string[]) => {
      console.log('👥 Accounts changed:', accounts);
      if (accounts.length === 0) {
        // User disconnected their wallet
        disconnectWallet();
      } else if (accounts[0] !== walletState.account) {
        // User switched accounts
        setWalletState(prev => ({
          ...prev,
          account: accounts[0],
          isConnected: true,
          isLoggedIn: false,
          userInfo: null,
          loginError: null
        }));
        // Auto-attempt login with new account
        loginWithWallet(accounts[0]);
      }
    };

    const handleChainChanged = (chainId: string) => {
      console.log('🔗 Chain changed:', chainId);
      setWalletState(prev => ({
        ...prev,
        networkInfo: {
          ...prev.networkInfo,
          chainId
        }
      }));
    };

    // Guarded event listener attachment for WebView compatibility
    if (provider.on) {
      provider.on('accountsChanged', handleAccountsChanged);
      provider.on('chainChanged', handleChainChanged);
      eventListenersAttached.current = true;
      
      // Cleanup function
      return () => {
        if (provider.removeListener) {
          provider.removeListener('accountsChanged', handleAccountsChanged);
          provider.removeListener('chainChanged', handleChainChanged);
        } else if (provider.off) {
          provider.off('accountsChanged', handleAccountsChanged);
          provider.off('chainChanged', handleChainChanged);
        }
        eventListenersAttached.current = false;
      };
    }
  };
  
  // Cleanup event listeners on unmount
  useEffect(() => {
    return () => {
      if (providerRef.current && eventListenersAttached.current) {
        const provider = providerRef.current;
        if (provider.removeAllListeners) {
          provider.removeAllListeners();
        }
        eventListenersAttached.current = false;
      }
    };
  }, []);

  // Initialize wallet on app start (after provider is ready)
  const initializeWallet = async () => {
    console.log('🚀 Initializing wallet context...');
    console.log('🔍 DEBUGGING - Provider available:', !!providerRef.current);
    console.log('🔍 DEBUGGING - User agent:', navigator.userAgent);
    
    if (providerRef.current) {
      await checkWalletConnection();
      await checkExistingAuth();
    } else {
      console.log('❌ Cannot initialize wallet - provider not ready');
    }
  };

  // Check existing authentication
  const checkExistingAuth = async () => {
    try {
      const token = localStorage.getItem('auth-token');
      console.log('🔍 AUTH CHECK - Token in localStorage:', token ? 'TOKEN FOUND' : 'NO TOKEN');
      if (token) {
        console.log('🔍 Checking existing auth token...');
        const response = await fetch('/api/auth/verify', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.valid) {
            console.log('✅ Valid auth token found, restoring session...');
            setWalletState(prev => ({
              ...prev,
              isLoggedIn: true,
              userInfo: data.user,
              account: data.user.walletAddress || prev.account,
              isConnected: data.user.walletAddress ? true : prev.isConnected
            }));
            return;
          }
        }
      }
      console.log('❌ No valid auth found');
    } catch (error) {
      console.log('No existing auth found');
    }
  };

  // Check wallet connection
  const checkWalletConnection = async () => {
    if (!providerRef.current) {
      console.log('❌ Cannot check wallet connection - provider not available');
      return;
    }
    
    try {
      const provider = providerRef.current;
      const accounts = await provider.request({ method: 'eth_accounts' });
      const chainId = await provider.request({ method: 'eth_chainId' });
      
      if (accounts.length > 0) {
        console.log('👛 Wallet already connected:', accounts[0]);
        setWalletState(prev => ({
          ...prev,
          account: accounts[0],
          isConnected: true,
          networkInfo: {
            chainId,
            chainName: chainId === '0x38' ? 'BSC Mainnet' : 'Unknown Network'
          }
        }));
      }
    } catch (error) {
      console.error('Error checking wallet connection:', error);
    }
  };

  // Connect wallet
  const connectWallet = async () => {
    console.log('🔗 WalletContext: Connecting wallet...');
    console.log('🔍 DEBUGGING - providerRef.current:', !!providerRef.current);
    console.log('🔍 DEBUGGING - window.ethereum:', !!window.ethereum);
    console.log('🔍 DEBUGGING - Trying to re-detect provider...');
    
    // Try to re-detect provider in case it was loaded after initial check
    if (!providerRef.current) {
      const freshProvider = getEthereumProvider();
      console.log('🔍 DEBUGGING - Fresh provider detection:', !!freshProvider);
      if (freshProvider) {
        providerRef.current = freshProvider;
        console.log('✅ Provider found on retry!');
      }
    }
    
    // Improved wallet detection for mobile and desktop
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    if (!providerRef.current) {
      console.error('❌ Web3 provider not found');
      console.error('🔍 DEBUGGING - Final provider check failed, available providers:');
      console.error('🔍 DEBUGGING - window.ethereum:', typeof window.ethereum, !!window.ethereum);
      console.error('🔍 DEBUGGING - window.binancew3w:', typeof (window as any).binancew3w, !!(window as any).binancew3w);
      console.error('🔍 DEBUGGING - window.BinanceChain:', typeof (window as any).BinanceChain, !!(window as any).BinanceChain);
      
      const errorMessage = isMobile 
        ? 'Please open this site in Binance Wallet, MetaMask Mobile Browser, or install a Web3 wallet app'
        : 'Please install Binance Wallet, MetaMask browser extension, or another Web3 wallet to connect';
      
      setWalletState(prev => ({
        ...prev,
        loginError: errorMessage
      }));
      throw new Error(errorMessage);
    }

    setWalletState(prev => ({
      ...prev,
      isConnecting: true,
      loginError: null
    }));

    try {
      const provider = providerRef.current;
      
      // Request account access
      console.log('📝 Requesting account access from Web3 provider...');
      const accounts = await provider.request({
        method: 'eth_requestAccounts',
      });

      // Switch to BSC network
      await switchToBSC();

      const account = accounts[0];
      setWalletState(prev => ({
        ...prev,
        account,
        isConnected: true,
        isConnecting: false
      }));
      
      // Automatically attempt to login with the connected wallet
      console.log('🔐 Attempting automatic login...');
      const loginSuccess = await loginWithWallet(account);
      if (!loginSuccess) {
        console.log('Wallet connected but user authentication pending');
      }
    } catch (error: any) {
      console.error('Error connecting wallet:', error);
      setWalletState(prev => ({
        ...prev,
        isConnecting: false,
        loginError: 'Failed to connect wallet. Please try again.'
      }));
    }
  };

  // Login with wallet (challenge-response authentication)
  const loginWithWallet = async (walletAddress: string): Promise<boolean> => {
    try {
      setWalletState(prev => ({
        ...prev,
        loginError: null
      }));
      
      console.log('🚀 Starting wallet authentication for:', walletAddress);
      
      // Step 1: Request authentication challenge from server
      console.log('🔐 Requesting secure authentication challenge...');
      const challengeResponse = await fetch('/api/auth/wallet-challenge', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ walletAddress })
      });

      const challengeData = await challengeResponse.json();
      
      if (!challengeResponse.ok || !challengeData.success) {
        console.error('❌ Challenge request failed:', challengeData);
        throw new Error(challengeData.error || 'Failed to generate authentication challenge');
      }

      const { nonce, challengeMessage } = challengeData;
      console.log('✅ Challenge received successfully!');

      // Step 2: Request user to sign the challenge message with Web3 provider
      if (!providerRef.current) {
        throw new Error('Web3 provider not found. Please ensure your wallet is connected.');
      }

      console.log('📝 Requesting signature from Web3 provider...');
      let signature: string;
      try {
        const provider = providerRef.current;
        
        // Hex-encode message for MetaMask Mobile compatibility
        const hexEncodedMessage = hexEncodeMessage(challengeMessage);
        console.log('🔤 Using hex-encoded message for mobile compatibility');
        
        signature = await provider.request({
          method: 'personal_sign',
          params: [hexEncodedMessage, walletAddress],
        });
        
        if (!signature) {
          throw new Error('Signature was cancelled or failed');
        }
        
        console.log('✅ Message signed successfully!');
      } catch (signError: any) {
        console.error('🚨 Signing error:', signError);
        
        if (signError.code === 4001 || signError.message?.includes('User rejected')) {
          throw new Error('Authentication was cancelled. Please sign the message to securely log in.');
        }
        throw new Error('Failed to sign authentication message. Please try again.');
      }

      // Step 3: Verify signature with server to complete authentication
      console.log('🔐 Verifying signature with server...');
      const verifyResponse = await fetch('/api/auth/wallet-verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          walletAddress, 
          signature, 
          nonce 
        })
      });

      const verifyData = await verifyResponse.json();
      
      if (verifyResponse.ok && verifyData.success) {
        // Store auth token and update state
        console.log('✅ Authentication successful!');
        console.log('💾 STORING TOKEN:', verifyData.token ? 'TOKEN RECEIVED' : 'NO TOKEN IN RESPONSE');
        localStorage.setItem('auth-token', verifyData.token);
        
        // VERIFY TOKEN WAS STORED
        const storedToken = localStorage.getItem('auth-token');
        console.log('🔍 TOKEN VERIFICATION:', storedToken ? 'TOKEN STORED SUCCESSFULLY' : 'TOKEN STORAGE FAILED');
        
        setWalletState(prev => ({
          ...prev,
          isLoggedIn: true,
          userInfo: verifyData.user,
          loginError: null
        }));
        
        console.log('🎉 Secure wallet authentication complete!');
        return true;
      } else {
        console.error('❌ Authentication verification failed');
        
        // Handle specific error cases with user-friendly messages
        let errorMessage = 'Setting up your account - please try again.';
        if (verifyResponse.status === 429) {
          errorMessage = 'Too many authentication attempts. Please wait a few minutes and try again.';
        } else if (verifyResponse.status === 404) {
          errorMessage = 'Setting up your new account automatically - please try again in a moment.';
        } else if (verifyResponse.status === 401) {
          errorMessage = 'Authentication failed. Please ensure you signed the message correctly.';
        } else if (verifyResponse.status === 400 && verifyData.error?.includes('expired')) {
          errorMessage = 'Authentication challenge expired. Please try connecting your wallet again.';
        }
        
        setWalletState(prev => ({
          ...prev,
          loginError: errorMessage
        }));
        return false;
      }
    } catch (error: any) {
      console.error('💥 CRITICAL ERROR during wallet authentication:', error);
      
      // Handle user-friendly error messages
      let errorMessage = 'Secure wallet authentication failed. Please ensure your wallet is connected and try again.';
      if (error.message.includes('challenge')) {
        errorMessage = 'Failed to start secure authentication process. Please check your connection and try again.';
      } else if (error.message.includes('cancelled') || error.message.includes('sign')) {
        errorMessage = error.message;
      } else if (error.message.includes('rate limit') || error.message.includes('Too many')) {
        errorMessage = 'Too many authentication attempts. Please wait a few minutes and try again.';
      } else if (error.message.includes('MetaMask') || error.message.includes('Binance')) {
        errorMessage = 'A Web3 wallet (Binance Wallet, MetaMask, etc.) is required for secure authentication. Please install one and try again.';
      }
      
      setWalletState(prev => ({
        ...prev,
        loginError: errorMessage
      }));
      return false;
    }
  };

  // Switch to BSC network
  const switchToBSC = async () => {
    if (!providerRef.current) {
      console.log('❌ Cannot switch network - provider not available');
      return;
    }

    try {
      const provider = providerRef.current;
      
      await provider.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0x38' }], // BSC Mainnet
      });
      
      setWalletState(prev => ({
        ...prev,
        networkInfo: {
          chainId: '0x38',
          chainName: 'BSC Mainnet'
        }
      }));
    } catch (switchError: any) {
      // If BSC is not added, add it
      if (switchError.code === 4902) {
        try {
          const provider = providerRef.current;
          
          await provider.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: '0x38',
              chainName: 'BNB Smart Chain',
              nativeCurrency: {
                name: 'BNB',
                symbol: 'BNB',
                decimals: 18,
              },
              rpcUrls: ['https://bsc-dataseed1.binance.org/'],
              blockExplorerUrls: ['https://bscscan.com/'],
            }],
          });
          
          setWalletState(prev => ({
            ...prev,
            networkInfo: {
              chainId: '0x38',
              chainName: 'BSC Mainnet'
            }
          }));
        } catch (addError) {
          console.error('Failed to add BSC network:', addError);
        }
      }
    }
  };

  // Disconnect wallet
  const disconnectWallet = () => {
    console.log('🔌 Disconnecting wallet...');
    setWalletState({
      isConnected: false,
      account: '',
      isConnecting: false,
      isLoggedIn: false,
      userInfo: null,
      loginError: null,
      networkInfo: {
        chainId: null,
        chainName: null
      }
    });
    localStorage.removeItem('auth-token');
  };

  // Clear error
  const clearError = () => {
    setWalletState(prev => ({
      ...prev,
      loginError: null
    }));
  };

  // Refresh authentication
  const refreshAuth = async () => {
    await checkExistingAuth();
  };

  // Context value
  const contextValue: WalletContextType = {
    ...walletState,
    connectWallet,
    disconnectWallet,
    loginWithWallet,
    checkWalletConnection,
    checkExistingAuth,
    clearError,
    switchToBSC,
    refreshAuth
  };

  return (
    <WalletContext.Provider value={contextValue}>
      {children}
    </WalletContext.Provider>
  );
};

// Export types for use in other components
export type { WalletContextType, UserInfo, WalletState };