import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { WalletConnect } from './web3/wallet-connect';
import { Button } from './ui/button';
import { useWallet } from '../contexts/WalletContext';
import { useNotificationHelpers } from './NotificationSystem';

interface DropdownItem {
  path: string;
  label: string;
  isInternal?: boolean;
  isExternal?: boolean;
}

interface NavigationItem {
  path: string;
  label: string;
  isDropdown?: boolean;
  dropdownItems?: DropdownItem[];
}

interface FooterLink {
  path: string;
  label: string;
  isExternal?: boolean;
}

interface LayoutProps {
  children: React.ReactNode;
  title?: string;
  themeColor?: string;
  showWalletConnect?: boolean;
}

const Layout: React.FC<LayoutProps> = ({ 
  children, 
  title = "AXIOM", 
  themeColor = "yellow",
  showWalletConnect = true 
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // Use global wallet context (identical to homepage pattern)
  const { 
    connectWallet, 
    isLoggedIn, 
    account, 
    userInfo, 
    loginError, 
    isConnecting,
    isConnected, 
    disconnectWallet, 
    clearError 
  } = useWallet();
  const { showError } = useNotificationHelpers();
  
  const getThemeColors = () => {
    switch (themeColor) {
      case 'blue':
        return {
          primary: 'text-blue-400',
          border: 'border-blue-500/30',
          button: 'bg-blue-500 hover:bg-blue-400',
          accent: 'text-blue-500',
          background: 'bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900'
        };
      case 'green':
        return {
          primary: 'text-green-400', 
          border: 'border-green-500/30',
          button: 'bg-green-500 hover:bg-green-400',
          accent: 'text-green-500',
          background: 'bg-gradient-to-br from-slate-900 via-green-900 to-slate-900'
        };
      case 'purple':
        return {
          primary: 'text-purple-400',
          border: 'border-purple-500/30', 
          button: 'bg-purple-500 hover:bg-purple-400',
          accent: 'text-purple-500',
          background: 'bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900'
        };
      case 'white':
        return {
          primary: 'text-gray-900',
          border: 'border-gray-300',
          button: 'bg-golden hover:bg-golden/80 text-black',
          accent: 'text-golden',
          background: 'bg-white'
        };
      default: // yellow
        return {
          primary: 'text-yellow-500',
          border: 'border-yellow-500/30',
          button: 'bg-yellow-500 hover:bg-yellow-400 text-black',
          accent: 'text-yellow-500',
          background: 'bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900'
        };
    }
  };

  const theme = getThemeColors();

  // Handle mobile menu toggle
  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  // Close mobile menu and dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target as Node)) {
        setIsMobileMenuOpen(false);
      }
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setActiveDropdown(null);
      }
    };

    if (isMobileMenuOpen || activeDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      if (isMobileMenuOpen) {
        document.body.style.overflow = 'hidden'; // Prevent background scrolling
      }
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = 'unset';
    };
  }, [isMobileMenuOpen, activeDropdown]);

  // Handle mobile menu item click
  const handleMobileMenuItemClick = () => {
    setIsMobileMenuOpen(false);
  };

  // Handle wallet connection using identical logic from homepage
  const handleWalletConnect = async () => {
    try {
      await connectWallet();
    } catch (error: any) {
      showError('Wallet Connection Failed', error.message || 'Unable to connect to your wallet. Please try again.');
    }
  };

  // Auto-navigate to dashboard after successful wallet authentication
  useEffect(() => {
    // Don't auto-navigate from layout, let user control navigation
  }, [isLoggedIn, account]);


  // Get current domain for external links (for production deployment)
  const currentDomain = window.location.origin;
  
  // For Replit deployment, use the proper transparency portal URL
  const getTransparencyPortalUrl = () => {
    if (currentDomain.includes('localhost')) {
      return 'http://localhost:3000';
    }
    
    // For Replit deployment - use the actual domain from your deployment
    if (currentDomain.includes('replit.app')) {
      // Extract the base domain and create transparency portal URL
      const baseUrl = currentDomain.replace(/:\d+$/, ''); // Remove port if present
      // For your specific domain
      if (baseUrl.includes('sovran-wealth-token')) {
        return 'https://sovran-wealth-token-transparency-pnandnpn.replit.app';
      }
      return `${baseUrl.replace('-pnandnpn', '-transparency-pnandnpn')}`;
    }
    
    // Fallback for other deployments
    return `${currentDomain.replace(':5000', ':3000')}`;
  };
  
  const transparencyPortalUrl = getTransparencyPortalUrl();

  const navigationItems: NavigationItem[] = [
    { path: '/', label: 'Home' },
    { path: '/dashboard', label: 'Dashboard' },
    { 
      path: '#', 
      label: 'DeFi Services', 
      isDropdown: true,
      dropdownItems: [
        { path: '/swf-banking', label: 'Banking', isInternal: true },
        { path: '/investments', label: 'Investments', isInternal: true },
        { path: '/enhanced-staking', label: 'Staking', isInternal: true },
        { path: '/advanced-staking', label: 'NFT Staking', isInternal: true },
        { path: '/airdrop', label: 'Airdrop', isInternal: true }
      ]
    },
    { 
      path: '#', 
      label: 'Smart Contracts', 
      isDropdown: true,
      dropdownItems: [
        { path: '/basket-index', label: 'Basket Index', isInternal: true },
        { path: '/dynamic-apr', label: 'APR Control', isInternal: true },
        { path: '/liquidity-vault', label: 'Liquidity Vault', isInternal: true },
        { path: '/governance-dividends', label: 'Governance Dividends', isInternal: true },
        { path: '/vault-adapter', label: 'SWF Vault Adapter', isInternal: true },
        { path: '/nft-marketplace', label: 'NFT Marketplace', isInternal: true },
        { path: '/real-estate', label: 'Real Estate Fund', isInternal: true }
      ]
    },
    { 
      path: '#', 
      label: 'Programs', 
      isDropdown: true,
      dropdownItems: [
        { path: '/keygrow-dashboard', label: 'KeyGrow', isInternal: true },
        { path: '/sousou-circle', label: 'SouSou Circle', isInternal: true }
      ]
    },
    { 
      path: '#', 
      label: 'Platform', 
      isDropdown: true,
      dropdownItems: [
        { path: '/oracle-dashboard', label: 'Oracle Dashboard', isInternal: true },
        { path: '/dao-dashboard', label: 'DAO', isInternal: true },
        { path: '/risk-dashboard', label: 'Risk Dashboard', isInternal: true },
        { path: '/gold-certificates', label: 'Gold Certificates', isInternal: true },
        { path: '/liquidity-management', label: 'Liquidity Management', isInternal: true },
        { path: '/denet-storage', label: 'Storage', isInternal: true }
      ]
    },
    { 
      path: '#', 
      label: 'About', 
      isDropdown: true,
      dropdownItems: [
        { path: '/investors', label: 'Investors', isInternal: true },
        { path: '/user-guide', label: 'User Guide', isInternal: true },
        { path: '/faq', label: 'FAQ', isInternal: true },
        { path: '/team', label: 'Team', isInternal: true },
        { path: '/roadmap', label: 'Roadmap', isInternal: true }
      ]
    },
    { 
      path: '#', 
      label: 'Transparency', 
      isDropdown: true,
      dropdownItems: [
        { path: '/transparency-reports', label: 'Reports', isInternal: true },
        { path: '/compliance', label: 'Compliance', isInternal: true },
        { path: '/download-logs', label: 'Download Logs', isInternal: true }
      ]
    }
  ];

  // Removed - these are now in main navigation dropdowns

  // Footer links (moved from main navigation)
  const footerLinks: FooterLink[] = [
    { path: '/about', label: 'About Us', isExternal: false },
    { path: '/contact-us', label: 'Contact', isExternal: false },
    { path: '/learn-how-it-works', label: 'Learn How It Works', isExternal: false },
    { path: '/admin', label: 'Admin', isExternal: false },
    { path: '/pricing', label: 'Pricing', isExternal: false },
    { path: '/terms-and-conditions', label: 'Terms & Conditions', isExternal: false },
    { path: '/privacy-policy', label: 'Privacy Policy', isExternal: false },
    { path: '/security', label: 'Security', isExternal: false }
  ];

  return (
    <div className={`min-h-screen ${theme.background}`}>
      {/* Navigation */}
      <nav className="relative z-[1000] bg-white border-b-2 border-blue-300 shadow-lg p-4 pt-safe">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <Link to="/" className="flex items-center space-x-3 hover:opacity-90 transition-opacity group">
              <img 
                src="/swf-logo.png" 
                alt="AXIOM Logo" 
                className="h-10 w-10 sm:h-12 sm:w-12 md:h-14 md:w-14 lg:h-16 lg:w-16"
              />
              <div className="flex flex-col">
                <span className="text-xl sm:text-2xl md:text-3xl font-bold text-blue-800 hover:text-blue-700 transition-colors leading-tight">
                  AXIOM
                </span>
                <span className="text-xs sm:text-sm text-blue-600 font-medium tracking-wide hidden sm:block">
                  The Foundation of Sovereign Wealth
                </span>
              </div>
            </Link>
            
            {/* Navigation Menu */}
            <div className="hidden lg:flex items-center space-x-4 ml-8">
              {navigationItems.map((item) => (
                <div key={item.path} className="relative">
                  {item.isDropdown ? (
                    // Dropdown Menu
                    <div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          const newState = activeDropdown === item.label ? null : item.label;
                          setActiveDropdown(newState);
                        }}
                        className={`text-sm font-medium px-3 py-2 rounded-lg transition-colors flex items-center space-x-1 ${
                          activeDropdown === item.label
                            ? 'bg-blue-100 text-blue-800 font-semibold'
                            : 'text-blue-600 hover:text-blue-800 hover:bg-blue-50'
                        }`}
                      >
                        <span>{item.label}</span>
                        <svg 
                          className={`w-4 h-4 transition-transform ${activeDropdown === item.label ? 'rotate-180' : ''}`} 
                          fill="none" 
                          stroke="currentColor" 
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                      
                      {/* Dropdown Content */}
                      {activeDropdown === item.label && (
                        <div className="absolute top-full left-0 mt-1 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                          <div className="py-2">
                            {item.dropdownItems?.map((dropdownItem) => (
                              <div key={dropdownItem.path}>
                                {dropdownItem.isExternal ? (
                                  <a
                                    href={dropdownItem.path}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={() => setActiveDropdown(null)}
                                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-800 transition-colors"
                                  >
                                    <div className="flex items-center justify-between">
                                      <span>{dropdownItem.label}</span>
                                      <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                      </svg>
                                    </div>
                                  </a>
                                ) : (
                                  <button
                                    onClick={() => {
                                      navigate(dropdownItem.path);
                                      setActiveDropdown(null);
                                    }}
                                    className={`w-full text-left block px-4 py-2 text-sm transition-colors ${
                                      location.pathname === dropdownItem.path
                                        ? 'bg-blue-100 text-blue-800 font-semibold'
                                        : 'text-gray-700 hover:bg-blue-50 hover:text-blue-800'
                                    }`}
                                  >
                                    {dropdownItem.label}
                                  </button>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    // Regular Menu Item
                    <Link
                      to={item.path}
                      className={`text-sm font-medium px-3 py-2 rounded-lg transition-colors ${
                        location.pathname === item.path 
                          ? 'bg-blue-100 text-blue-800 font-semibold'
                          : 'text-blue-600 hover:text-blue-800 hover:bg-blue-50'
                      }`}
                    >
                      {item.label}
                    </Link>
                  )}
                </div>
              ))}
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Platform & Connection Status */}
            <div className="hidden md:flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-gray-600">Live</span>
              </div>
              {isConnected && (
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <span className="text-sm text-blue-600 font-medium">Wallet Connected</span>
                </div>
              )}
            </div>
            
            {/* Global Persistent Wallet Interface */}
            {showWalletConnect && (
              <div className="hidden lg:block relative z-[60] pointer-events-auto">
                {isConnected && isLoggedIn ? (
                  // Connected and authenticated user
                  <div className="text-center">
                    <div className="text-sm font-medium text-green-800 mb-2">
                      ✅ Welcome back, {userInfo?.firstName || 'Member'}!
                    </div>
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                      <div className="flex items-center justify-between">
                        <div className="text-left">
                          <div className="text-xs font-medium text-green-800">
                            {account.slice(0, 6)}...{account.slice(-4)}
                          </div>
                          <div className="text-xs text-green-600">BSC Network</div>
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => navigate('/dashboard')}
                            className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white text-xs rounded transition-colors"
                          >
                            Dashboard
                          </button>
                          <button
                            onClick={disconnectWallet}
                            className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white text-xs rounded transition-colors"
                          >
                            Disconnect
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : isConnected && !isLoggedIn ? (
                  // Connected but not authenticated
                  <div className="text-center">
                    <div className="text-sm font-medium text-orange-700 mb-2">
                      🔐 Complete Your Authentication
                    </div>
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                      <div className="text-xs text-orange-600 mb-2">
                        Wallet connected! Sign the message to access your account.
                      </div>
                      {loginError && (
                        <div className="text-xs text-red-600 mb-2">
                          {loginError}
                        </div>
                      )}
                      <button
                        onClick={() => clearError()}
                        className="px-3 py-1 bg-orange-500 hover:bg-orange-600 text-white text-xs rounded transition-colors"
                      >
                        Try Again
                      </button>
                    </div>
                  </div>
                ) : (
                  // Not connected - using exact homepage pattern
                  <div className="text-center">
                    <Button 
                      onClick={() => {
                        if (!isLoggedIn) {
                          handleWalletConnect();
                        } else {
                          navigate('/dashboard');
                        }
                      }}
                      className={`w-full cursor-pointer ${
                        isLoggedIn 
                          ? 'bg-blue-600 hover:bg-blue-700' 
                          : 'bg-green-600 hover:bg-green-700'
                      } text-white`}
                      style={{ pointerEvents: 'auto', position: 'relative', zIndex: 999 }}
                    >
                      {isLoggedIn 
                        ? `✅ Connected: ${account?.slice(0, 6)}...${account?.slice(-4)}` 
                        : '🔗 Connect Advanced Wallet'
                      }
                    </Button>
                    <div className="text-xs text-gray-500 text-center mt-2">
                      {isLoggedIn 
                        ? `Welcome ${userInfo?.firstName || 'Member'}! Full platform access enabled`
                        : 'Connect with MetaMask on BSC Network for full platform access'
                      }
                    </div>
                    
                    {loginError && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-4 mt-3">
                        <div className="text-sm font-medium text-red-800 mb-2">Connection Issue</div>
                        <div className="text-xs text-red-600">{loginError}</div>
                        <div className="text-xs text-gray-600 mt-2">
                          • Make sure you're using MetaMask mobile browser or have MetaMask extension installed<br/>
                          • Try refreshing the page if you just installed a wallet<br/>
                          • For mobile: Open this site in MetaMask app's browser
                        </div>
                      </div>
                    )}
                    
                    {isConnecting && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-3">
                        <div className="text-sm font-medium text-blue-800 mb-2">🔄 Connecting Wallet...</div>
                        <div className="text-xs text-blue-600">Please check your wallet for any prompts to complete the connection.</div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
            
            {/* Mobile Menu Button */}
            <button 
              onClick={toggleMobileMenu}
              className="lg:hidden text-blue-600 hover:text-blue-800 p-2 rounded-md transition-colors"
              aria-label="Toggle mobile menu"
              aria-expanded={isMobileMenuOpen}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {isMobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop */}
          <div className="fixed inset-0 bg-black/50 z-40 pointer-events-auto transition-opacity" />
          
          {/* Mobile Menu */}
          <div 
            ref={mobileMenuRef}
            className="fixed top-0 right-0 bottom-0 w-80 max-w-sm bg-white shadow-xl transform transition-transform duration-300 ease-in-out overflow-y-auto z-50"
          >
            {/* Mobile Menu Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <img 
                  src="/swf-logo.png" 
                  alt="SWF Logo" 
                  className="h-8 w-8"
                />
                <span className="text-lg font-bold text-blue-800">
                  SWF Navigation
                </span>
              </div>
              <button
                onClick={toggleMobileMenu}
                className="text-gray-400 hover:text-gray-600 p-2"
                aria-label="Close mobile menu"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Mobile Navigation Links */}
            <div className="py-4">
              {navigationItems.map((item) => (
                <div key={item.path}>
                  {item.isDropdown ? (
                    // Mobile Dropdown
                    <div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveDropdown(activeDropdown === item.label ? null : item.label);
                        }}
                        className="w-full flex items-center justify-between px-4 py-3 text-base font-medium text-gray-700 hover:bg-blue-50 hover:text-blue-800 transition-colors"
                      >
                        <div className="flex items-center space-x-3">
                          <span className="text-sm opacity-60">📊</span>
                          <span>{item.label}</span>
                        </div>
                        <svg 
                          className={`w-4 h-4 transition-transform ${activeDropdown === item.label ? 'rotate-180' : ''}`} 
                          fill="none" 
                          stroke="currentColor" 
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                      
                      {/* Mobile Dropdown Content */}
                      {activeDropdown === item.label && (
                        <div className="bg-gray-50 border-l-4 border-blue-300">
                          {item.dropdownItems?.map((dropdownItem) => (
                            <div key={dropdownItem.path}>
                              {dropdownItem.isExternal ? (
                                <a
                                  href={dropdownItem.path}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={handleMobileMenuItemClick}
                                  className="block pl-8 pr-4 py-2 text-sm text-gray-600 hover:bg-blue-50 hover:text-blue-800 transition-colors"
                                >
                                  <div className="flex items-center justify-between">
                                    <span>{dropdownItem.label}</span>
                                    <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                    </svg>
                                  </div>
                                </a>
                              ) : (
                                <button
                                  onClick={() => {
                                    navigate(dropdownItem.path);
                                    handleMobileMenuItemClick();
                                  }}
                                  className={`w-full text-left block pl-8 pr-4 py-2 text-sm transition-colors ${
                                    location.pathname === dropdownItem.path
                                      ? 'bg-blue-100 text-blue-800 font-semibold'
                                      : 'text-gray-600 hover:bg-blue-50 hover:text-blue-800'
                                  }`}
                                >
                                  {dropdownItem.label}
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    // Regular Mobile Menu Item
                    <Link
                      to={item.path}
                      onClick={handleMobileMenuItemClick}
                      className={`block px-4 py-3 text-base font-medium transition-colors ${
                        location.pathname === item.path 
                          ? 'bg-blue-50 text-blue-800 border-r-4 border-blue-500 font-semibold'
                          : 'text-gray-700 hover:bg-blue-50 hover:text-blue-800'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <span className="text-sm opacity-60">📱</span>
                        <span>{item.label}</span>
                      </div>
                    </Link>
                  )}
                </div>
              ))}
            </div>

            {/* Mobile Menu Footer */}
            <div className="border-t border-gray-200 p-4 mt-8">
              {showWalletConnect && (
                <div className="relative z-[60] pointer-events-auto mb-4">
                  {isLoggedIn && account ? (
                    // Mobile - Connected - using exact homepage pattern
                    <div className="text-center mb-4">
                      <h3 className="text-lg font-bold text-green-800 mb-2">
                        ✅ Welcome back, {userInfo?.firstName || 'Member'}!
                      </h3>
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <div className="text-sm text-green-700 mb-3">
                          <div className="font-medium">Connected Wallet:</div>
                          <div className="font-mono text-xs">
                            {account.slice(0, 8)}...{account.slice(-6)}
                          </div>
                          <div className="text-xs mt-1">BSC Network</div>
                        </div>
                        <div className="space-y-2">
                          <button
                            onClick={() => {
                              setIsMobileMenuOpen(false);
                              navigate('/dashboard');
                            }}
                            className="w-full px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
                          >
                            Go to Dashboard
                          </button>
                          <button
                            onClick={() => {
                              disconnectWallet();
                              setIsMobileMenuOpen(false);
                            }}
                            className="w-full px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
                          >
                            Disconnect Wallet
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    // Mobile - Not connected - using exact homepage pattern
                    <div className="text-center mb-4">
                      <h3 className="text-lg font-bold text-gray-800 mb-2">
                        Your wealth journey starts today
                      </h3>
                      <p className="text-sm text-gray-600 mb-4">
                        Connect your wallet and start building. No minimum amount required.
                        <br />Your money, your timeline, your wealth.
                      </p>
                      <Button 
                        onClick={() => {
                          if (!isLoggedIn) {
                            handleWalletConnect();
                          } else {
                            navigate('/dashboard');
                          }
                          setIsMobileMenuOpen(false);
                        }}
                        className={`w-full cursor-pointer ${
                          isLoggedIn 
                            ? 'bg-blue-600 hover:bg-blue-700' 
                            : 'bg-green-600 hover:bg-green-700'
                        } text-white text-lg`}
                        style={{ pointerEvents: 'auto', position: 'relative', zIndex: 999 }}
                      >
                        {isLoggedIn 
                          ? `✅ Connected: ${account?.slice(0, 6)}...${account?.slice(-4)}` 
                          : '🔗 Connect Advanced Wallet'
                        }
                      </Button>
                      <div className="text-xs text-gray-500 text-center mt-2">
                        {isLoggedIn 
                          ? `Welcome ${userInfo?.firstName || 'Member'}! Full platform access enabled`
                          : 'Connect with MetaMask on BSC Network for full platform access'
                        }
                      </div>
                      
                      {loginError && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mt-3">
                          <div className="text-sm font-medium text-red-800 mb-2">Connection Issue</div>
                          <div className="text-xs text-red-600">{loginError}</div>
                          <div className="text-xs text-gray-600 mt-2">
                            • Make sure you're using MetaMask mobile browser or have MetaMask extension installed<br/>
                            • Try refreshing the page if you just installed a wallet<br/>
                            • For mobile: Open this site in MetaMask app's browser
                          </div>
                        </div>
                      )}
                      
                      {isConnecting && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-3">
                          <div className="text-sm font-medium text-blue-800 mb-2">🔄 Connecting Wallet...</div>
                          <div className="text-xs text-blue-600">Please check your wallet for any prompts to complete the connection.</div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main>
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t-2 border-blue-300 text-gray-600 py-8 mt-12">
        <div className="container mx-auto px-4">
          <div className="text-center mb-6">
            <div className="flex justify-center items-center space-x-3 mb-4">
              <img 
                src="/swf-logo.svg" 
                alt="Sovran Wealth Fund Logo" 
                className="h-8 w-8 drop-shadow-sm"
              />
              <span className="text-lg font-bold text-blue-800">
                Sovran Wealth Fund
              </span>
            </div>
            <p className="text-sm text-blue-600 font-medium">
              Building Financial Sovereignty
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
            {footerLinks.map((footerLink) => (
              <div key={footerLink.path} className="text-center">
                {footerLink.isExternal ? (
                  <a
                    href={footerLink.path}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm hover:text-blue-800 transition-colors font-medium"
                  >
                    {footerLink.label}
                  </a>
                ) : (
                  <Link
                    to={footerLink.path}
                    className="text-sm hover:text-blue-800 transition-colors font-medium"
                  >
                    {footerLink.label}
                  </Link>
                )}
              </div>
            ))}
          </div>
          
          <div className="flex justify-center items-center space-x-6 mb-4 flex-wrap gap-y-2">
            <Link to="/dashboard" className="text-sm hover:text-blue-800 transition-colors font-medium">Dashboard</Link>
            <Link to="/learn-how-it-works" className="text-sm hover:text-blue-800 transition-colors font-medium">Learn How It Works</Link>
            <Link to="/admin" className="text-sm hover:text-blue-800 transition-colors font-medium">Admin</Link>
            <Link to="/status" className="text-sm hover:text-blue-800 transition-colors font-medium">Status</Link>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-500">
              © 2025 Sovran Wealth Fund. Empowering financial sovereignty through blockchain technology.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;