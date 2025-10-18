import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { WalletConnect } from "../components/web3/wallet-connect";
import WealthOnboardingWizard from "../components/WealthOnboardingWizard";
import KeyGrowPathway from "../components/KeyGrowPathway";
import { useStats } from "../contexts/StatsContext";
import { useWallet } from "../contexts/WalletContext";
import { useNotificationHelpers } from "../components/NotificationSystem";

// Community Stats Component - Now optimized with centralized stats
function CommunityStats() {
  const { stats, loading, error, refreshStats } = useStats();
  
  // Manual refresh handler for user-initiated updates
  const handleRefresh = async () => {
    await refreshStats();
  };

  return (
    <div className="bg-gradient-to-br from-white to-blue-50 border-2 border-blue-700 rounded-xl p-8 text-center shadow-lg relative">
      {/* Refresh button for manual updates */}
      <button 
        onClick={handleRefresh}
        className="absolute top-2 right-2 text-blue-600 hover:text-blue-800 transition-colors"
        title="Refresh stats"
        disabled={loading}
      >
        <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
      </button>
      
      <div className="text-4xl font-bold text-blue-800 mb-3">
        {loading ? (
          <div className="animate-pulse bg-blue-200 h-10 w-24 mx-auto rounded"></div>
        ) : (
          stats.totalUsers.toLocaleString()
        )}
      </div>
      <div className="text-lg text-blue-800 font-semibold">
        AXIOM Members Building Sovereign Wealth
      </div>
      <div className="text-sm text-gray-600 mt-2">
        {loading ? (
          <div className="animate-pulse bg-gray-200 h-4 w-32 mx-auto rounded"></div>
        ) : (
          `${stats.activeWallets.toLocaleString()} active wallets circulating energy`
        )}
      </div>
      
      {/* Error state */}
      {error && !loading && (
        <div className="text-xs text-red-500 mt-2">
          {error}
        </div>
      )}
      
      {/* Cache status indicator for development */}
      {process.env.NODE_ENV === 'development' && (
        <div className="text-xs text-gray-400 mt-1">
          Last updated: {stats.lastUpdated ? new Date(stats.lastUpdated).toLocaleTimeString() : 'Never'}
        </div>
      )}
    </div>
  );
}

// FAQ Component for Crypto Concerns
function CryptoFAQ() {
  const [openFAQ, setOpenFAQ] = useState<string | null>(null);

  const faqs = [
    {
      id: 'crypto-safe',
      question: "Is this crypto? I thought crypto was risky.",
      answer: "We use blockchain technology to keep your money safe and transparent, but you're not gambling on crypto prices. Your wealth grows through steady, real-world investments. Think of blockchain as a secure ledger that tracks your progress."
    },
    {
      id: 'start-small',
      question: "Do I need a lot of money to start?",
      answer: "No! You can start with as little as $25 and add more when you're comfortable. Many of our members began with small amounts and increased their contributions as they saw results."
    },
    {
      id: 'wallet-confusing',
      question: "What's a wallet? This sounds complicated.",
      answer: "A wallet is just like having an account, but more secure. We'll guide you through setting it up in 2 minutes. It's your key to access your money - only you control it, not some big bank."
    },
    {
      id: 'too-good',
      question: "This sounds too good to be true. What's the catch?",
      answer: "No catch. We're transparent about everything: how your money grows, what fees exist, and what risks are involved. You can withdraw your money anytime. We succeed when you succeed."
    }
  ];

  return (
    <div className="space-y-4">
      <h3 className="text-2xl font-semibold text-gray-100 text-center mb-6">
        Common Questions We Hear
      </h3>
      {faqs.map((faq) => (
        <div key={faq.id} className="border-2 border-blue-200 rounded-xl bg-white shadow-md">
          <button
            className="w-full text-left p-6 hover:bg-blue-50 flex justify-between items-center transition-colors"
            onClick={() => setOpenFAQ(openFAQ === faq.id ? null : faq.id)}
          >
            <span className="font-semibold text-gray-800">{faq.question}</span>
            <span className="text-blue-600 text-xl font-bold">
              {openFAQ === faq.id ? '−' : '+'}
            </span>
          </button>
          {openFAQ === faq.id && (
            <div className="px-6 pb-6 text-gray-700 border-t border-blue-200">
              <p className="pt-4">{faq.answer}</p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// Path Selector Card Component
interface PathCardProps {
  icon: string;
  title: string;
  description: string;
  onClick: () => void;
}

function PathCard({ icon, title, description, onClick }: PathCardProps) {
  return (
    <Card 
      className="bg-gradient-to-br from-white to-blue-50 hover:from-blue-50 hover:to-blue-100 cursor-pointer transition-all duration-300 hover:shadow-xl border-2 border-blue-300 hover:border-blue-500 hover:scale-105"
      onClick={onClick}
    >
      <CardContent className="p-8 text-center">
        <div className="text-5xl mb-6">{icon}</div>
        <h3 className="text-xl font-bold text-blue-800 mb-4">{title}</h3>
        <p className="text-gray-600 leading-relaxed">{description}</p>
      </CardContent>
    </Card>
  );
}

// Wealth Calculator Widget
function WealthCalculator() {
  const [monthlyAmount, setMonthlyAmount] = useState(100);
  const [activeTab, setActiveTab] = useState('5years');

  const calculateWealth = (years: number, rate: number) => {
    const months = years * 12;
    const monthlyRate = rate / 12 / 100;
    
    if (rate === 0) return monthlyAmount * months;
    
    const futureValue = monthlyAmount * (((1 + monthlyRate) ** months - 1) / monthlyRate);
    return Math.round(futureValue);
  };

  const getTimeframeName = () => {
    switch (activeTab) {
      case '1year': return '1 Year';
      case '5years': return '5 Years'; 
      case '10years': return '10 Years';
      default: return '5 Years';
    }
  };

  const getYears = () => {
    switch (activeTab) {
      case '1year': return 1;
      case '5years': return 5;
      case '10years': return 10;
      default: return 5;
    }
  };

  return (
    <Card className="bg-gradient-to-br from-white to-blue-50 border-2 border-blue-500 shadow-xl">
      <CardContent className="p-8">
        <h3 className="text-3xl font-bold text-blue-800 mb-8 text-center">See Your Wealth Grow</h3>
        
        {/* Amount Slider */}
        <div className="mb-8">
          <label className="block text-lg font-semibold text-blue-700 mb-3">
            Monthly Contribution: ${monthlyAmount}
          </label>
          <input
            type="range"
            min="25"
            max="1000"
            step="25"
            value={monthlyAmount}
            onChange={(e) => setMonthlyAmount(Number(e.target.value))}
            className="w-full h-3 bg-blue-200 rounded-lg appearance-none cursor-pointer slider"
          />
          <div className="flex justify-between text-sm mt-2">
            <span className="font-semibold text-blue-600">Start with just $25</span>
            <span className="text-gray-600">$1000+</span>
          </div>
        </div>

        {/* Time Period Tabs */}
        <div className="flex mb-8 bg-blue-100 rounded-xl p-2 shadow-inner">
          {['1year', '5years', '10years'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-3 px-6 rounded-lg text-sm font-semibold transition-all duration-200 ${
                activeTab === tab 
                  ? 'bg-blue-600 text-white shadow-lg' 
                  : 'text-blue-600 hover:text-blue-800 hover:bg-blue-200'
              }`}
            >
              {tab === '1year' ? '1 Year' : tab === '5years' ? '5 Years' : '10 Years'}
            </button>
          ))}
        </div>

        {/* Projections */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center p-6 bg-gradient-to-br from-white to-green-50 rounded-xl border-2 border-green-400 shadow-lg">
            <div className="text-lg font-bold text-green-700">Safe Growth (3%)</div>
            <div className="text-3xl font-bold text-green-600 my-3">
              ${calculateWealth(getYears(), 3).toLocaleString()}
            </div>
            <div className="text-sm text-gray-700">after {getTimeframeName()}</div>
            <div className="text-xs text-green-600 mt-2 font-medium">Stable & Secure</div>
          </div>
          <div className="text-center p-6 bg-gradient-to-br from-white to-blue-50 rounded-xl border-2 border-blue-400 shadow-lg">
            <div className="text-lg font-bold text-blue-700">Better Growth (7%)</div>
            <div className="text-3xl font-bold text-blue-600 my-3">
              ${calculateWealth(getYears(), 7).toLocaleString()}
            </div>
            <div className="text-sm text-gray-700">after {getTimeframeName()}</div>
            <div className="text-xs text-blue-600 mt-2 font-medium">Balanced Risk</div>
          </div>
          <div className="text-center p-6 bg-gradient-to-br from-white to-purple-50 rounded-xl border-2 border-purple-500 shadow-lg">
            <div className="text-lg font-bold text-purple-700">Aggressive Growth</div>
            <div className="text-xs text-purple-600 mb-2 font-medium">Variable: 8-12% Target</div>
            <div className="text-3xl font-bold text-purple-600 my-3">
              ${calculateWealth(getYears(), 10).toLocaleString()}
            </div>
            <div className="text-sm text-gray-700">after {getTimeframeName()}</div>
            <div className="text-xs text-purple-600 mt-2 font-medium">⚠️ Higher Risk</div>
          </div>
        </div>
        
        <div className="mt-8 space-y-4">
          <p className="text-lg text-gray-700 text-center font-medium">
            Your money works for you while you sleep. Start with just $25/month.
          </p>
          
          {/* Risk Disclaimer for Aggressive Growth */}
          <div className="bg-gradient-to-br from-yellow-50 to-orange-50 border-2 border-orange-400 rounded-xl p-6">
            <div className="flex items-start space-x-3">
              <span className="text-orange-500 text-lg">⚠️</span>
              <div>
                <p className="text-sm font-bold text-orange-700">Aggressive Growth Disclaimer:</p>
                <p className="text-sm text-gray-700 mt-2 leading-relaxed">
                  Returns are variable and not guaranteed. May experience losses. Target range 8-12% based on DeFi strategies. 
                  Only invest what you can afford to lose. Past performance doesn't guarantee future results.
                </p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Trust Foundation Pillar
interface TrustPillarProps {
  icon: string;
  title: string;
  points: string[];
}

function TrustPillar({ icon, title, points }: TrustPillarProps) {
  return (
    <div className="text-center bg-gradient-to-br from-white to-blue-50 p-8 rounded-xl border-2 border-blue-300 shadow-lg">
      <div className="text-6xl mb-6">{icon}</div>
      <h3 className="text-2xl font-bold text-blue-800 mb-6">{title}</h3>
      <ul className="space-y-3">
        {points.map((point, index) => (
          <li key={index} className="text-gray-700 text-lg">• {point}</li>
        ))}
      </ul>
    </div>
  );
}

// Success Story Component
interface SuccessStoryProps {
  story: string;
  name: string;
  timeframe: string;
  amount: string;
}

function SuccessStory({ story, name, timeframe, amount }: SuccessStoryProps) {
  return (
    <div className="text-center p-8 bg-gradient-to-br from-white to-blue-50 rounded-xl shadow-xl border-2 border-blue-400">
      <p className="text-xl text-gray-800 mb-6 italic">"{story}"</p>
      <div className="text-3xl font-bold text-blue-600 mb-4">{amount}</div>
      <div className="text-sm text-gray-700">
        <div className="font-semibold text-lg">{name}</div>
        <div className="text-gray-600">{timeframe}</div>
      </div>
    </div>
  );
}

// Success Stories Carousel
function SuccessCarousel() {
  const [currentStory, setCurrentStory] = useState(0);
  
  const stories = [
    {
      story: "I started with just $100 a month. Now I have enough saved to put a down payment on a house.",
      name: "Angela M., Atlanta",
      timeframe: "After 18 months",
      amount: "Saved $2,400"
    },
    {
      story: "The automatic deposits made it easy. I didn't even notice the money leaving my account.",
      name: "Marcus T., Detroit", 
      timeframe: "After 1 year",
      amount: "Saved $1,800"
    },
    {
      story: "I learned so much about managing money. My kids see me building wealth now.",
      name: "Keisha R., Houston",
      timeframe: "After 2 years", 
      amount: "Saved $4,200"
    },
    {
      story: "Started at $75 monthly. Increased to $200 as my confidence grew. Best decision ever.",
      name: "Jerome L., Oakland",
      timeframe: "After 14 months",
      amount: "Saved $2,100"
    }
  ];

  // Auto-rotate stories
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStory((prev) => (prev + 1) % stories.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative">
      <SuccessStory {...stories[currentStory]} />
      
      {/* Carousel Controls */}
      <div className="flex justify-center mt-6 space-x-2">
        {stories.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentStory(index)}
            className={`w-4 h-4 rounded-full transition-all duration-200 ${
              index === currentStory ? 'bg-blue-600 scale-125' : 'bg-blue-300 hover:bg-blue-400'
            }`}
          />
        ))}
      </div>
      
      {/* Navigation Arrows */}
      <button
        onClick={() => setCurrentStory((prev) => prev === 0 ? stories.length - 1 : prev - 1)}
        className="absolute left-0 top-1/2 transform -translate-y-1/2 bg-blue-600 text-white rounded-full p-3 shadow-lg hover:shadow-xl hover:bg-blue-700 transition-all"
      >
        ←
      </button>
      <button
        onClick={() => setCurrentStory((prev) => (prev + 1) % stories.length)}
        className="absolute right-0 top-1/2 transform -translate-y-1/2 bg-blue-600 text-white rounded-full p-3 shadow-lg hover:shadow-xl hover:bg-blue-700 transition-all"
      >
        →
      </button>
    </div>
  );
}

export default function HomePage() {
  const navigate = useNavigate();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showKeyGrow, setShowKeyGrow] = useState(false);
  const [selectedPath, setSelectedPath] = useState<string | undefined>();

  // Import wallet context to use proper SIWE authentication
  const { connectWallet, isLoggedIn, account, userInfo, loginError, isConnecting } = useWallet();
  const { showError } = useNotificationHelpers();

  // Handle wallet connection using proper SIWE authentication
  const handleWalletConnect = async () => {
    console.log('🔗 Connect Advanced Wallet button clicked...');
    console.log('🔍 DEBUGGING - Current state:', { isLoggedIn, account, isConnected: account ? true : false });
    
    try {
      console.log('🔍 DEBUGGING - About to call connectWallet()...');
      await connectWallet();
      console.log('✅ Wallet connection process initiated');
      
      // Auto-navigate to dashboard after successful authentication
      // We'll check isLoggedIn state change via useEffect below
    } catch (error: any) {
      console.error('❌ Wallet connection failed:', error);
      console.error('❌ Error details:', error.message, error.code, error.data);
      showError('Wallet Connection Failed', error.message || 'Unable to connect to your wallet. Please try again.');
    }
  };

  // Auto-navigate to dashboard after successful wallet authentication
  useEffect(() => {
    if (isLoggedIn && account) {
      console.log('🎯 NAVIGATION: Wallet authenticated successfully, auto-routing to dashboard...');
      setTimeout(() => {
        navigate('/dashboard');
      }, 1000); // 1 second delay to allow UI to update
    }
  }, [isLoggedIn, account, navigate]);

  const handlePathClick = (pathType: string) => {
    let pathId: string;
    switch (pathType) {
      case 'beginner':
      case 'start-journey':
        pathId = 'beginner';
        setSelectedPath(pathId);
        setShowOnboarding(true);
        break;
      case 'investment':
        pathId = 'investment';
        setSelectedPath(pathId);
        setShowOnboarding(true);
        break;
      case 'property':
        // Launch KeyGrow pathway instead of regular onboarding
        setShowKeyGrow(true);
        break;
      case 'community':
        pathId = 'community';
        setSelectedPath(pathId);
        setShowOnboarding(true);
        break;
      case 'connect-wallet':
        // Now properly handle wallet connection
        handleWalletConnect();
        break;
      default:
        pathId = 'beginner';
        setSelectedPath(pathId);
        setShowOnboarding(true);
    }
  };

  const handleCloseOnboarding = () => {
    setShowOnboarding(false);
    setSelectedPath(undefined);
  };

  const handleCloseKeyGrow = () => {
    setShowKeyGrow(false);
  };

  return (
    <main className="bg-gradient-to-br from-white via-blue-50 to-white min-h-screen">
      {/* Hero Section */}
      <section className="text-center py-24 px-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-100/20 via-transparent to-blue-200/20"></div>
        <div className="relative z-10">
          <div className="mb-8 flex justify-center">
            <img 
              src="/swf-logo.png" 
              alt="AXIOM Logo" 
              className="h-32 w-32 md:h-40 md:w-40 animate-bounce"
            />
          </div>
          <h1 className="text-5xl md:text-7xl font-bold mb-8 text-transparent bg-gradient-to-r from-blue-700 via-blue-900 to-blue-700 bg-clip-text">
            AXIOM: The Foundation of Sovereign Wealth
          </h1>
          <div className="w-32 h-1 bg-gradient-to-r from-blue-600 to-blue-800 mx-auto mb-8 rounded-full"></div>
          <p className="text-2xl max-w-5xl mx-auto mb-12 text-gray-700 leading-relaxed">
            A lawful digital economy where wealth arises from participation, not permission. Energy-based tokenomics, Proof of Contribution staking, and transparent governance on Binance Smart Chain. 
            <span className="text-blue-800 font-semibold">Truth creates value. Circulation over hoarding. Energy in motion.</span> When truth becomes law, law becomes light.
          </p>
          <div className="flex justify-center gap-6">
            <Button 
              className="text-xl px-12 py-4 bg-gradient-to-r from-blue-700 to-blue-800 hover:from-blue-800 hover:to-blue-900 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
              onClick={() => handlePathClick('start-journey')}
            >
              Join AXIOM
            </Button>
            <Button 
              variant="outline" 
              className="text-xl px-12 py-4 border-2 border-blue-700 text-blue-800 hover:bg-blue-50 font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
              onClick={() => {
                console.log('🎓 Explore Platform Features button clicked - redirecting to Learn How It Works page');
                navigate('/learn-how-it-works');
              }}
            >
              Explore Platform Features
            </Button>
          </div>
        </div>
      </section>

      {/* Community Stats */}
      <section className="py-16 px-8">
        <div className="max-w-3xl mx-auto">
          <CommunityStats />
        </div>
      </section>

      {/* Educational Section: Why Traditional Savings Aren't Enough */}
      <section className="py-20 px-8 bg-gradient-to-br from-red-50 to-orange-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-red-800 mb-8">
              ⚠️ The Silent Wealth Killer Most People Ignore
            </h2>
            <div className="w-32 h-1 bg-gradient-to-r from-red-400 to-orange-600 mx-auto mb-8 rounded-full"></div>
            <p className="text-xl text-gray-700 max-w-4xl mx-auto leading-relaxed">
              While you're saving "safely" in traditional accounts, <span className="font-bold text-red-700">inflation is quietly stealing your future.</span> 
              Here's the harsh reality most financial institutions won't tell you.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-white rounded-xl p-8 shadow-lg border-2 border-red-200">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-white text-2xl font-bold">0.1%</span>
                </div>
                <h3 className="text-xl font-bold text-red-800">Traditional Savings</h3>
                <p className="text-sm text-gray-600">Average bank interest rate</p>
              </div>
              <div className="space-y-3 text-sm">
                <p className="flex justify-between"><span>$10,000 after 1 year:</span> <span className="font-semibold">$10,010</span></p>
                <p className="flex justify-between"><span>Real value (after 3.2% inflation):</span> <span className="text-red-600 font-bold">$9,690</span></p>
                <p className="text-red-600 font-bold text-center mt-4">You LOST $310!</p>
              </div>
            </div>
            
            <div className="bg-white rounded-xl p-8 shadow-lg border-2 border-blue-200">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-white text-2xl font-bold">7%</span>
                </div>
                <h3 className="text-xl font-bold text-blue-800">Our Smart Strategy</h3>
                <p className="text-sm text-gray-600">Conservative approach</p>
              </div>
              <div className="space-y-3 text-sm">
                <p className="flex justify-between"><span>$10,000 after 1 year:</span> <span className="font-semibold">$10,700</span></p>
                <p className="flex justify-between"><span>Real value (after 3.2% inflation):</span> <span className="text-blue-600 font-bold">$10,357</span></p>
                <p className="text-green-600 font-bold text-center mt-4">You GAINED $357!</p>
              </div>
            </div>
            
            <div className="bg-white rounded-xl p-8 shadow-lg border-2 border-purple-200">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-white text-lg font-bold">15%+</span>
                </div>
                <h3 className="text-xl font-bold text-purple-800">Optimized Returns</h3>
                <p className="text-sm text-gray-600">Balanced strategy</p>
              </div>
              <div className="space-y-3 text-sm">
                <p className="flex justify-between"><span>$10,000 after 1 year:</span> <span className="font-semibold">$11,500</span></p>
                <p className="flex justify-between"><span>Real value (after 3.2% inflation):</span> <span className="text-purple-600 font-bold">$11,132</span></p>
                <p className="text-green-600 font-bold text-center mt-4">You GAINED $1,132!</p>
              </div>
            </div>
          </div>
          
          <div className="mt-12 bg-white rounded-xl p-8 shadow-lg border-l-4 border-orange-500">
            <h4 className="text-2xl font-bold text-orange-800 mb-4">💡 The Compound Effect Over Time</h4>
            <p className="text-lg text-gray-700 mb-6">
              Here's what happens to $10,000 over 10 years with different approaches:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-red-600 mb-2">$8,743</div>
                <div className="text-sm text-gray-600">Traditional savings</div>
                <div className="text-xs text-red-600">Lost $1,257 to inflation</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600 mb-2">$15,398</div>
                <div className="text-sm text-gray-600">Conservative DeFi (7%)</div>
                <div className="text-xs text-green-600">Real gain of $5,398</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600 mb-2">$31,384</div>
                <div className="text-sm text-gray-600">Optimized DeFi (15%)</div>
                <div className="text-xs text-green-600">Real gain of $21,384</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Educational Section: DeFi Explained Simply */}
      <section className="py-20 px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-blue-800 mb-8">
              🎓 DeFi Made Simple: Your Money, Your Rules
            </h2>
            <div className="w-32 h-1 bg-gradient-to-r from-blue-400 to-blue-600 mx-auto mb-8 rounded-full"></div>
            <p className="text-xl text-gray-700 max-w-4xl mx-auto leading-relaxed">
              Forget complex jargon. Here's how <span className="font-bold text-blue-700">Decentralized Finance (DeFi)</span> puts you back in control 
              of your financial future - explained in terms anyone can understand.
            </p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
            <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-8 border-2 border-red-200">
              <h3 className="text-2xl font-bold text-red-800 mb-6">🏦 Traditional Banking</h3>
              <div className="space-y-4">
                <div className="flex items-start">
                  <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center mr-3 mt-1">
                    <span className="text-white text-xs">✕</span>
                  </div>
                  <div>
                    <p className="font-semibold text-red-800">They control your money</p>
                    <p className="text-sm text-gray-600">Banks can freeze accounts, limit withdrawals, or deny transactions</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center mr-3 mt-1">
                    <span className="text-white text-xs">✕</span>
                  </div>
                  <div>
                    <p className="font-semibold text-red-800">Tiny returns (0.1% APY)</p>
                    <p className="text-sm text-gray-600">While banks lend your money at 6-20% interest rates</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center mr-3 mt-1">
                    <span className="text-white text-xs">✕</span>
                  </div>
                  <div>
                    <p className="font-semibold text-red-800">Hidden fees everywhere</p>
                    <p className="text-sm text-gray-600">Monthly fees, withdrawal fees, overdraft fees, maintenance fees</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center mr-3 mt-1">
                    <span className="text-white text-xs">✕</span>
                  </div>
                  <div>
                    <p className="font-semibold text-red-800">No transparency</p>
                    <p className="text-sm text-gray-600">You never know what they're doing with your money</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-8 border-2 border-blue-200">
              <h3 className="text-2xl font-bold text-blue-800 mb-6">⚡ DeFi (Our Way)</h3>
              <div className="space-y-4">
                <div className="flex items-start">
                  <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center mr-3 mt-1">
                    <span className="text-white text-xs">✓</span>
                  </div>
                  <div>
                    <p className="font-semibold text-blue-800">You own your money</p>
                    <p className="text-sm text-gray-600">Your wallet, your keys, your control - no one can freeze or limit you</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center mr-3 mt-1">
                    <span className="text-white text-xs">✓</span>
                  </div>
                  <div>
                    <p className="font-semibold text-blue-800">Real returns (7-15%+ APY)</p>
                    <p className="text-sm text-gray-600">Earn what your money is actually worth in today's economy</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center mr-3 mt-1">
                    <span className="text-white text-xs">✓</span>
                  </div>
                  <div>
                    <p className="font-semibold text-blue-800">Transparent fees</p>
                    <p className="text-sm text-gray-600">Everything on blockchain - you can see exactly where every penny goes</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center mr-3 mt-1">
                    <span className="text-white text-xs">✓</span>
                  </div>
                  <div>
                    <p className="font-semibold text-blue-800">Complete transparency</p>
                    <p className="text-sm text-gray-600">Smart contracts are public code - no hidden tricks or fine print</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-8 border-2 border-green-200">
            <h4 className="text-2xl font-bold text-green-800 mb-6">🎯 How We Make It Work For You</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h5 className="text-lg font-bold text-green-800 mb-3">1. Smart Contract Automation</h5>
                <p className="text-gray-700 mb-4">
                  Think of smart contracts like vending machines - you put money in, they automatically execute the program, 
                  no human can interfere or steal your funds.
                </p>
                <h5 className="text-lg font-bold text-green-800 mb-3">2. Yield Farming Simplified</h5>
                <p className="text-gray-700">
                  Instead of banks lending your money for profit, DeFi protocols pay YOU to provide liquidity. 
                  We find the best rates and manage everything automatically.
                </p>
              </div>
              <div>
                <h5 className="text-lg font-bold text-green-800 mb-3">3. Diversification Protection</h5>
                <p className="text-gray-700 mb-4">
                  We never put all your eggs in one basket. Your funds are spread across multiple proven protocols 
                  to minimize risk while maximizing returns.
                </p>
                <h5 className="text-lg font-bold text-green-800 mb-3">4. You Stay In Control</h5>
                <p className="text-gray-700">
                  Your crypto stays in YOUR wallet. We can't steal it, lose it, or lend it out. 
                  You can withdraw anytime without asking permission.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Path Selector Cards */}
      <section className="py-20 px-8 bg-gradient-to-br from-blue-50 to-white">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-16 text-blue-800">
            Choose Your Wealth-Building Path
          </h2>
          <div className="w-32 h-1 bg-gradient-to-r from-blue-400 to-blue-600 mx-auto mb-16 rounded-full"></div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <PathCard
              icon="🌱"
              title="I'm New to Building Wealth"
              description="Start with the basics. Learn how to make your first dollar work for you."
              onClick={() => handlePathClick('beginner')}
            />
            <PathCard
              icon="📈" 
              title="I Want Better Returns"
              description="Earn more than savings accounts. Safe growth with higher yields."
              onClick={() => handlePathClick('investment')}
            />
            <PathCard
              icon="🏠"
              title="I Want to Own Property"
              description="Rent-to-own pathway. Build equity while you live in your future home."
              onClick={() => handlePathClick('property')}
            />
            <PathCard
              icon="🤝"
              title="I Want to Save with Others"
              description="Join community savings circles. Achieve goals together, faster."
              onClick={() => handlePathClick('community')}
            />
          </div>
        </div>
      </section>

      {/* Wealth Calculator Widget */}
      <section className="py-20 px-8">
        <div className="max-w-4xl mx-auto">
          <WealthCalculator />
        </div>
      </section>

      {/* Educational Section: The Wealth Building Hierarchy */}
      <section className="py-20 px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-blue-800 mb-8">
              📊 The Wealth Building Hierarchy: Where Do You Stand?
            </h2>
            <div className="w-32 h-1 bg-gradient-to-r from-blue-400 to-blue-600 mx-auto mb-8 rounded-full"></div>
            <p className="text-xl text-gray-700 max-w-4xl mx-auto leading-relaxed">
              Most people are stuck at Level 1-2, slowly losing money to inflation. 
              <span className="font-bold text-blue-700">Here's how to climb to financial freedom.</span>
            </p>
          </div>
          
          <div className="space-y-6">
            {/* Level 1 - Worst */}
            <div className="bg-gradient-to-r from-red-100 to-red-50 border-l-4 border-red-500 rounded-xl p-8">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center text-white font-bold text-xl mr-4">1</div>
                <div>
                  <h3 className="text-2xl font-bold text-red-800">Cash Under Mattress</h3>
                  <p className="text-red-600">Guaranteed -3.2% per year (inflation)</p>
                </div>
              </div>
              <p className="text-gray-700 mb-4">
                <strong>Reality Check:</strong> $10,000 today will only buy $7,000 worth of goods in 10 years. 
                You're literally paying to hold cash.
              </p>
              <div className="bg-white rounded-lg p-4">
                <p className="text-sm"><strong>Example:</strong> $50,000 emergency fund loses $1,600 in buying power each year</p>
              </div>
            </div>
            
            {/* Level 2 - Still Bad */}
            <div className="bg-gradient-to-r from-orange-100 to-orange-50 border-l-4 border-orange-500 rounded-xl p-8">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center text-white font-bold text-xl mr-4">2</div>
                <div>
                  <h3 className="text-2xl font-bold text-orange-800">Traditional Savings Account</h3>
                  <p className="text-orange-600">0.1% APY = Still losing -3.1% per year</p>
                </div>
              </div>
              <p className="text-gray-700 mb-4">
                <strong>The Illusion:</strong> Banks make you feel safe while systematically transferring your wealth to themselves. 
                They lend your money at 6-20% and give you crumbs.
              </p>
              <div className="bg-white rounded-lg p-4">
                <p className="text-sm"><strong>Example:</strong> $100,000 in savings earns $100/year while losing $3,100 to inflation</p>
              </div>
            </div>
            
            {/* Level 3 - Better */}
            <div className="bg-gradient-to-r from-yellow-100 to-yellow-50 border-l-4 border-yellow-500 rounded-xl p-8">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-yellow-500 rounded-full flex items-center justify-center text-white font-bold text-xl mr-4">3</div>
                <div>
                  <h3 className="text-2xl font-bold text-yellow-800">Traditional Investments</h3>
                  <p className="text-yellow-600">5-8% APY = Actually growing wealth</p>
                </div>
              </div>
              <p className="text-gray-700 mb-4">
                <strong>The Problem:</strong> High fees (1-2% annually), limited access, tax complications, and you don't actually own anything. 
                Plus, traditional markets are closed 16 hours a day.
              </p>
              <div className="bg-white rounded-lg p-4">
                <p className="text-sm"><strong>Example:</strong> $100,000 in index funds might return $7,000 but you pay $1,500 in fees and taxes</p>
              </div>
            </div>
            
            {/* Level 4 - Good */}
            <div className="bg-gradient-to-r from-blue-100 to-blue-50 border-l-4 border-blue-500 rounded-xl p-8">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-xl mr-4">4</div>
                <div>
                  <h3 className="text-2xl font-bold text-blue-800">Smart DeFi Strategy</h3>
                  <p className="text-blue-600">7-15% APY = Real wealth building</p>
                </div>
              </div>
              <p className="text-gray-700 mb-4">
                <strong>The Advantage:</strong> 24/7 markets, you own your assets, transparent fees, higher yields, 
                and complete control over your money. This is where wealth building actually begins.
              </p>
              <div className="bg-white rounded-lg p-4 space-y-2">
                <p className="text-sm"><strong>Conservative Example:</strong> $100,000 at 8% = $8,000 profit per year</p>
                <p className="text-sm"><strong>Optimized Example:</strong> $100,000 at 15% = $15,000 profit per year</p>
              </div>
            </div>
            
            {/* Level 5 - Best */}
            <div className="bg-gradient-to-r from-green-100 to-green-50 border-l-4 border-green-500 rounded-xl p-8">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center text-white font-bold text-xl mr-4">5</div>
                <div>
                  <h3 className="text-2xl font-bold text-green-800">Automated DeFi Optimization</h3>
                  <p className="text-green-600">15-25%+ APY = Accelerated wealth building</p>
                </div>
              </div>
              <p className="text-gray-700 mb-4">
                <strong>The Secret:</strong> AI-powered strategies that automatically find and capture the highest yields 
                across multiple protocols. Your money works harder than most people's jobs.
              </p>
              <div className="bg-white rounded-lg p-4 space-y-2">
                <p className="text-sm font-bold text-green-700">This is where we operate ↗️</p>
                <p className="text-sm"><strong>Real Example:</strong> $100,000 at 20% = $20,000 profit per year</p>
                <p className="text-sm text-green-600"><strong>Compound Effect:</strong> Becomes $619,000 in 10 years</p>
              </div>
            </div>
          </div>
          
          <div className="mt-12 text-center">
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-8 border-2 border-purple-200">
              <h4 className="text-2xl font-bold text-purple-800 mb-4">🚀 Ready to Level Up?</h4>
              <p className="text-lg text-gray-700 mb-6">
                Every day you stay at Level 1-3, you're falling further behind. 
                The sooner you move to Level 4-5, the more wealth you'll build.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
                <div>
                  <div className="text-2xl font-bold text-red-600">Level 1-2</div>
                  <div className="text-sm text-gray-600">Losing money daily</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-yellow-600">Level 3</div>
                  <div className="text-sm text-gray-600">Slow, expensive growth</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-600">Level 4-5</div>
                  <div className="text-sm text-gray-600">True wealth building</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Foundation Row */}
      <section className="py-20 px-8 bg-gradient-to-br from-blue-50 to-white">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-8 text-blue-800">
            Built on Trust, Not Hype
          </h2>
          <div className="w-32 h-1 bg-gradient-to-r from-blue-400 to-blue-600 mx-auto mb-16 rounded-full"></div>
          <div className="grid md:grid-cols-3 gap-12">
            <TrustPillar
              icon="📊"
              title="Complete Transparency"
              points={[
                "Monthly reports on your money",
                "See exactly where funds go",
                "Open data, no hidden fees"
              ]}
            />
            <TrustPillar
              icon="🛡️"
              title="Built-in Safety"
              points={[
                "Risk controls protect your money",
                "Start and stop anytime",
                "No long-term lockups"
              ]}
            />
            <TrustPillar
              icon="🏠"
              title="Real Asset Path"
              points={[
                "Clear roadmap to property ownership",
                "Build equity, not just savings",
                "Community support every step"
              ]}
            />
          </div>
        </div>
      </section>

      {/* Success Stories Carousel */}
      <section className="py-20 px-8">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-8 text-blue-800">
            Real People, Real Progress
          </h2>
          <div className="w-32 h-1 bg-gradient-to-r from-blue-400 to-blue-600 mx-auto mb-16 rounded-full"></div>
          <SuccessCarousel />
        </div>
      </section>

      {/* Educational Section: Risk Management Reality */}
      <section className="py-20 px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-blue-800 mb-8">
              🛡️ Let's Talk About Risk (The Honest Truth)
            </h2>
            <div className="w-32 h-1 bg-gradient-to-r from-blue-400 to-blue-600 mx-auto mb-8 rounded-full"></div>
            <p className="text-xl text-gray-700 max-w-4xl mx-auto leading-relaxed">
              Every financial decision has risk. The question isn't "Is there risk?" but 
              <span className="font-bold text-blue-700">"What's the smartest risk to take?"</span>
            </p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div className="space-y-8">
              <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-8 border-2 border-red-200">
                <h3 className="text-2xl font-bold text-red-800 mb-6">⚠️ Hidden Risks Everyone Ignores</h3>
                <div className="space-y-4">
                  <div className="flex items-start">
                    <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center mr-4 mt-1">
                      <span className="text-white text-sm">1</span>
                    </div>
                    <div>
                      <h4 className="font-bold text-red-800">Inflation Risk</h4>
                      <p className="text-gray-700 text-sm">Your "safe" savings lose 3.2% buying power annually. Guaranteed loss.</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center mr-4 mt-1">
                      <span className="text-white text-sm">2</span>
                    </div>
                    <div>
                      <h4 className="font-bold text-red-800">Opportunity Risk</h4>
                      <p className="text-gray-700 text-sm">Missing out on growth while others build wealth. Time you can't get back.</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center mr-4 mt-1">
                      <span className="text-white text-sm">3</span>
                    </div>
                    <div>
                      <h4 className="font-bold text-red-800">System Risk</h4>
                      <p className="text-gray-700 text-sm">Banks can freeze accounts, governments can seize assets, systems can fail.</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center mr-4 mt-1">
                      <span className="text-white text-sm">4</span>
                    </div>
                    <div>
                      <h4 className="font-bold text-red-800">Longevity Risk</h4>
                      <p className="text-gray-700 text-sm">Living longer than your money lasts. Outliving your savings.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="space-y-8">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-8 border-2 border-blue-200">
                <h3 className="text-2xl font-bold text-blue-800 mb-6">✅ How We Manage Risk Smart</h3>
                <div className="space-y-4">
                  <div className="flex items-start">
                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center mr-4 mt-1">
                      <span className="text-white text-sm">1</span>
                    </div>
                    <div>
                      <h4 className="font-bold text-blue-800">Diversification</h4>
                      <p className="text-gray-700 text-sm">Never more than 20% in any single protocol. Spread risk across 5-10 platforms.</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center mr-4 mt-1">
                      <span className="text-white text-sm">2</span>
                    </div>
                    <div>
                      <h4 className="font-bold text-blue-800">Graduated Entry</h4>
                      <p className="text-gray-700 text-sm">Start small ($100-1000), learn the system, scale up as you get comfortable.</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center mr-4 mt-1">
                      <span className="text-white text-sm">3</span>
                    </div>
                    <div>
                      <h4 className="font-bold text-blue-800">Smart Contract Audits</h4>
                      <p className="text-gray-700 text-sm">Only use protocols audited by top firms. Multiple security reviews.</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center mr-4 mt-1">
                      <span className="text-white text-sm">4</span>
                    </div>
                    <div>
                      <h4 className="font-bold text-blue-800">Liquidity Management</h4>
                      <p className="text-gray-700 text-sm">Keep 80%+ liquid for quick withdrawals. Never lock up emergency funds.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-12 bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-8 border-2 border-green-200">
            <h4 className="text-2xl font-bold text-green-800 mb-6">📈 The Risk-Adjusted Reality</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="text-3xl font-bold text-red-600 mb-2">100%</div>
                <div className="text-lg font-semibold text-gray-800">Traditional Savings</div>
                <div className="text-sm text-gray-600 mt-2">Guaranteed to lose money to inflation</div>
                <div className="text-xs text-red-600 mt-1">Real loss: -3.1% annually</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-yellow-600 mb-2">15%</div>
                <div className="text-lg font-semibold text-gray-800">Smart DeFi Portfolio</div>
                <div className="text-sm text-gray-600 mt-2">Managed risk with multiple safeguards</div>
                <div className="text-xs text-green-600 mt-1">Expected gain: +8-15% annually</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600 mb-2">5%</div>
                <div className="text-lg font-semibold text-gray-800">Conservative DeFi</div>
                <div className="text-sm text-gray-600 mt-2">Ultra-safe protocols, established platforms</div>
                <div className="text-xs text-green-600 mt-1">Expected gain: +5-8% annually</div>
              </div>
            </div>
            <div className="mt-8 text-center">
              <p className="text-lg text-green-800 font-semibold">
                💡 The biggest risk? Doing nothing while inflation eats your wealth.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section for Crypto Concerns */}
      <section className="py-20 px-8 bg-gradient-to-br from-blue-50 to-white">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-8 text-blue-800">
            Common Questions We Hear
          </h2>
          <div className="w-32 h-1 bg-gradient-to-r from-blue-400 to-blue-600 mx-auto mb-16 rounded-full"></div>
          <CryptoFAQ />
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-20 px-8 bg-gradient-to-br from-blue-600 to-blue-800">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-8 text-white">
            Your wealth journey starts today
          </h2>
          <p className="text-xl mb-12 text-blue-100 leading-relaxed">
            Connect your wallet and start building. No minimum amount required. 
            <span className="font-semibold">Your money, your timeline, your wealth.</span>
          </p>
          <Card className="bg-gradient-to-br from-white to-blue-50 border-2 border-blue-300 shadow-2xl">
            <CardContent className="p-10 space-y-6">
              <Button 
                onClick={() => {
                  if (!isLoggedIn) {
                    console.log('🔗 Connect button clicked - triggering wallet connection');
                    handleWalletConnect();
                  } else {
                    console.log('ℹ️ Already connected, going to dashboard');
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
              <div className="text-xs text-gray-500 text-center">
                {isLoggedIn 
                  ? `Welcome ${userInfo?.firstName || 'Member'}! Full platform access enabled`
                  : 'Connect with MetaMask on BSC Network for full platform access'
                }
              </div>
              
              {/* Debugging section for wallet connection issues */}
              {loginError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="text-sm font-medium text-red-800 mb-2">🔍 Wallet Connection Debug:</div>
                  <div className="text-xs text-red-600">{loginError}</div>
                  <div className="text-xs text-gray-600 mt-2">
                    • Make sure you're using MetaMask mobile browser or have MetaMask extension installed<br/>
                    • Try refreshing the page if you just installed a wallet<br/>
                    • For mobile: Open this site in MetaMask app's browser
                  </div>
                </div>
              )}
              
              {isConnecting && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="text-sm font-medium text-blue-800 mb-2">🔄 Connecting Wallet...</div>
                  <div className="text-xs text-blue-600">Please check your wallet for any prompts to complete the connection.</div>
                </div>
              )}
              <Button 
                className="w-full text-xl py-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
                onClick={() => {
                  if (isLoggedIn) {
                    console.log('💰 Start Building Wealth clicked - wallet connected, going to dashboard');
                    navigate('/dashboard');
                  } else {
                    console.log('💰 Start Building Wealth clicked - opening onboarding wizard');
                    // Open onboarding wizard instead of wallet connection
                    handlePathClick('beginner');
                  }
                }}
              >
                Start Building Wealth
              </Button>
              <p className="text-lg text-gray-700 font-medium">
                Safe, secure, and completely in your control
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      
      {/* Onboarding Wizard */}
      <WealthOnboardingWizard
        isOpen={showOnboarding}
        onClose={handleCloseOnboarding}
        onComplete={() => {
          console.log('🎯 [HOMEPAGE] Onboarding completed - navigating to dashboard');
          handleCloseOnboarding();
          setTimeout(() => {
            navigate('/dashboard');
          }, 100);
        }}
        initialPath={selectedPath}
      />
      
      {/* KeyGrow Pathway for Property Ownership */}
      <KeyGrowPathway
        isOpen={showKeyGrow}
        onClose={handleCloseKeyGrow}
      />
    </main>
  );
}