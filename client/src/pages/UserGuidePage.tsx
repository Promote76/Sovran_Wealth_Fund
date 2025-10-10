import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, DollarSign, TrendingUp, Shield, BookOpen, Target, CheckCircle } from 'lucide-react';

const UserGuidePage: React.FC = () => {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState<string>('getting-started');

  const sections = [
    { id: 'getting-started', title: 'Getting Started', icon: BookOpen },
    { id: 'income-strategy', title: '$500/Month Strategy', icon: Target },
    { id: 'banking', title: 'Banking Features', icon: DollarSign },
    { id: 'investments', title: 'Investment Platform', icon: TrendingUp },
    { id: 'advanced', title: 'Advanced Features', icon: Shield },
  ];

  const scrollToSection = (sectionId: string) => {
    setActiveSection(sectionId);
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      <div className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 md:p-12 mb-8 text-white">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Complete Platform Guide
          </h1>
          <p className="text-xl md:text-2xl mb-6 opacity-90">
            Your Step-by-Step Roadmap to Earning an Extra $500/Month
          </p>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2 bg-white/20 rounded-lg px-4 py-2">
              <CheckCircle className="w-5 h-5" />
              <span>Easy to Follow</span>
            </div>
            <div className="flex items-center gap-2 bg-white/20 rounded-lg px-4 py-2">
              <CheckCircle className="w-5 h-5" />
              <span>Beginner Friendly</span>
            </div>
            <div className="flex items-center gap-2 bg-white/20 rounded-lg px-4 py-2">
              <CheckCircle className="w-5 h-5" />
              <span>Proven Strategies</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 sticky top-4">
              <h3 className="text-xl font-bold text-white mb-4">Quick Navigation</h3>
              <nav className="space-y-2">
                {sections.map((section) => {
                  const Icon = section.icon;
                  return (
                    <button
                      key={section.id}
                      onClick={() => scrollToSection(section.id)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                        activeSection === section.id
                          ? 'bg-blue-500 text-white shadow-lg'
                          : 'text-gray-300 hover:bg-white/10'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="text-sm font-medium">{section.title}</span>
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-8">
            
            {/* Getting Started Section */}
            <section id="getting-started" className="bg-white rounded-2xl shadow-xl p-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                <BookOpen className="w-8 h-8 text-blue-600" />
                Getting Started
              </h2>
              
              <div className="space-y-6">
                <div className="bg-blue-50 border-l-4 border-blue-500 p-6 rounded-r-lg">
                  <h3 className="text-xl font-bold text-blue-900 mb-3">Welcome to Sovran Wealth Fund!</h3>
                  <p className="text-gray-700 leading-relaxed">
                    This platform gives you powerful tools to build wealth and generate monthly income through banking, 
                    investments, and advanced blockchain features. Don't worry if you're new to this - we'll guide you 
                    every step of the way!
                  </p>
                </div>

                <div className="space-y-4">
                  <h3 className="text-2xl font-bold text-gray-900">Step 1: Connect Your Wallet</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="bg-gray-50 rounded-lg p-6">
                      <div className="flex items-start gap-4">
                        <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">1</div>
                        <div>
                          <h4 className="font-bold text-gray-900 mb-2">Install MetaMask</h4>
                          <p className="text-sm text-gray-600">
                            Download MetaMask from metamask.io (it's free). Available for Chrome, Firefox, and mobile.
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-6">
                      <div className="flex items-start gap-4">
                        <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">2</div>
                        <div>
                          <h4 className="font-bold text-gray-900 mb-2">Connect to Platform</h4>
                          <p className="text-sm text-gray-600">
                            Click "Connect Advanced Wallet" in the top navigation and approve the connection request.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-2xl font-bold text-gray-900">Step 2: Complete Your Profile</h3>
                  <div className="bg-green-50 rounded-lg p-6">
                    <p className="text-gray-700 mb-4">
                      After connecting your wallet, you'll be guided through a quick onboarding process to:
                    </p>
                    <ul className="space-y-2">
                      <li className="flex items-center gap-3 text-gray-700">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                        Set up your account information
                      </li>
                      <li className="flex items-center gap-3 text-gray-700">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                        Choose your financial goals
                      </li>
                      <li className="flex items-center gap-3 text-gray-700">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                        Set up security features
                      </li>
                    </ul>
                  </div>
                </div>

                <div className="bg-yellow-50 border-l-4 border-yellow-500 p-6 rounded-r-lg">
                  <h4 className="font-bold text-yellow-900 mb-2">🔒 Security First</h4>
                  <p className="text-sm text-yellow-800">
                    Never share your wallet's recovery phrase with anyone. We will never ask for it. 
                    Always verify URLs before entering sensitive information.
                  </p>
                </div>
              </div>
            </section>

            {/* $500/Month Income Strategy Section */}
            <section id="income-strategy" className="bg-white rounded-2xl shadow-xl p-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                <Target className="w-8 h-8 text-green-600" />
                Your Path to $500/Month Extra Income
              </h2>

              <div className="space-y-6">
                <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-6">
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">The 3-Pillar Income Strategy</h3>
                  <p className="text-gray-700 mb-4">
                    By combining multiple income streams on our platform, you can realistically earn $500+ per month. 
                    Here's the proven strategy:
                  </p>
                </div>

                {/* Pillar 1: Savings Interest */}
                <div className="border-2 border-green-200 rounded-xl p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white font-bold">1</div>
                    <h3 className="text-2xl font-bold text-gray-900">High-Yield Savings (Passive Income)</h3>
                  </div>
                  
                  <div className="bg-green-50 rounded-lg p-6 mb-4">
                    <h4 className="font-bold text-green-900 mb-3">Monthly Income Potential: $50-$150</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-700">High-Yield Savings Account (4.25% APY):</span>
                        <span className="font-bold text-green-600">~$42/month on $12,000</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-700">Certificate of Deposit (6.25% APY):</span>
                        <span className="font-bold text-green-600">~$104/month on $20,000</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-bold text-gray-900">How to Start:</h4>
                    <ol className="space-y-2 ml-4">
                      <li className="text-gray-700">1. Go to <button onClick={() => navigate('/swf-banking')} className="text-blue-600 hover:underline font-semibold">SWF Banking</button></li>
                      <li className="text-gray-700">2. Click "Open High-Yield Savings Account" or "Open CD Account"</li>
                      <li className="text-gray-700">3. Make your initial deposit (minimum $100)</li>
                      <li className="text-gray-700">4. Interest accrues automatically every day!</li>
                      <li className="text-gray-700">5. Set up auto-transfers to grow your savings consistently</li>
                    </ol>
                  </div>

                  <div className="bg-blue-50 rounded-lg p-4 mt-4">
                    <p className="text-sm text-blue-800">
                      <strong>Pro Tip:</strong> Start with a High-Yield Savings Account for flexibility. Once you have 
                      funds you won't need for 6-12 months, move them to a CD for higher returns!
                    </p>
                  </div>
                </div>

                {/* Pillar 2: Strategic Investments */}
                <div className="border-2 border-blue-200 rounded-xl p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">2</div>
                    <h3 className="text-2xl font-bold text-gray-900">Strategic Investments (Active Income)</h3>
                  </div>
                  
                  <div className="bg-blue-50 rounded-lg p-6 mb-4">
                    <h4 className="font-bold text-blue-900 mb-3">Monthly Income Potential: $200-$400</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-700">Conservative Portfolio (8-12% annual):</span>
                        <span className="font-bold text-blue-600">~$167/month on $20,000</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-700">Moderate Portfolio (15-20% annual):</span>
                        <span className="font-bold text-blue-600">~$333/month on $20,000</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-bold text-gray-900">Recommended Starting Portfolio:</h4>
                    
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h5 className="font-bold text-gray-900 mb-2">📊 Index Funds (40%)</h5>
                        <p className="text-sm text-gray-600 mb-2">SPY, QQQ, VOO - Stable growth</p>
                        <button 
                          onClick={() => navigate('/investments')}
                          className="text-xs text-blue-600 hover:underline"
                        >
                          Start investing →
                        </button>
                      </div>
                      
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h5 className="font-bold text-gray-900 mb-2">💰 Dividend Stocks (30%)</h5>
                        <p className="text-sm text-gray-600 mb-2">AAPL, JNJ, PG - Regular income</p>
                        <button 
                          onClick={() => navigate('/investments')}
                          className="text-xs text-blue-600 hover:underline"
                        >
                          Start investing →
                        </button>
                      </div>
                      
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h5 className="font-bold text-gray-900 mb-2">🏘️ REITs (20%)</h5>
                        <p className="text-sm text-gray-600 mb-2">VNQ, O - Real estate income</p>
                        <button 
                          onClick={() => navigate('/investments')}
                          className="text-xs text-blue-600 hover:underline"
                        >
                          Start investing →
                        </button>
                      </div>
                      
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h5 className="font-bold text-gray-900 mb-2">💎 Crypto (10%)</h5>
                        <p className="text-sm text-gray-600 mb-2">BTC, ETH - Growth potential</p>
                        <button 
                          onClick={() => navigate('/investments')}
                          className="text-xs text-blue-600 hover:underline"
                        >
                          Start investing →
                        </button>
                      </div>
                    </div>

                    <div className="bg-purple-50 rounded-lg p-4 mt-4">
                      <p className="text-sm text-purple-800">
                        <strong>Investment Strategy:</strong> Start with index funds for stability, then gradually add 
                        dividend stocks and REITs. Use dollar-cost averaging (invest same amount weekly) to reduce risk.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Pillar 3: Advanced Features */}
                <div className="border-2 border-purple-200 rounded-xl p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center text-white font-bold">3</div>
                    <h3 className="text-2xl font-bold text-gray-900">Advanced Income Streams</h3>
                  </div>
                  
                  <div className="bg-purple-50 rounded-lg p-6 mb-4">
                    <h4 className="font-bold text-purple-900 mb-3">Monthly Income Potential: $100-$300</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-700">Staking Rewards (10-30% APR):</span>
                        <span className="font-bold text-purple-600">~$208/month on $10,000</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-700">SouSou Circle Rotation:</span>
                        <span className="font-bold text-purple-600">Variable based on pool</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h5 className="font-bold text-gray-900 mb-2">🔒 Staking</h5>
                      <p className="text-sm text-gray-600 mb-3">
                        Lock your SWF tokens to earn 10-30% APR. Dynamic rates based on vault deposits.
                      </p>
                      <button 
                        onClick={() => navigate('/enhanced-staking')}
                        className="text-sm bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
                      >
                        Start Staking
                      </button>
                    </div>
                    
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h5 className="font-bold text-gray-900 mb-2">🤝 SouSou Circles</h5>
                      <p className="text-sm text-gray-600 mb-3">
                        Join rotating savings groups for lump-sum distributions and community building.
                      </p>
                      <button 
                        onClick={() => navigate('/sousou-circle')}
                        className="text-sm bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
                      >
                        Join Circle
                      </button>
                    </div>
                  </div>
                </div>

                {/* Monthly Income Breakdown */}
                <div className="bg-gradient-to-br from-green-500 to-blue-600 rounded-xl p-8 text-white">
                  <h3 className="text-2xl font-bold mb-6">Your $500/Month Income Breakdown</h3>
                  
                  <div className="grid md:grid-cols-3 gap-6 mb-6">
                    <div className="bg-white/20 rounded-lg p-4">
                      <div className="text-3xl font-bold mb-2">$100</div>
                      <div className="text-sm opacity-90">From Savings Interest</div>
                    </div>
                    <div className="bg-white/20 rounded-lg p-4">
                      <div className="text-3xl font-bold mb-2">$250</div>
                      <div className="text-sm opacity-90">From Investments</div>
                    </div>
                    <div className="bg-white/20 rounded-lg p-4">
                      <div className="text-3xl font-bold mb-2">$150</div>
                      <div className="text-sm opacity-90">From Staking/Advanced</div>
                    </div>
                  </div>

                  <div className="bg-white/10 rounded-lg p-6">
                    <h4 className="font-bold mb-3">Total Capital Needed: ~$40,000-$50,000</h4>
                    <p className="text-sm opacity-90 mb-4">
                      Don't have this much? Start small! Even with $5,000, you can earn $50-100/month and reinvest 
                      to grow your capital over time. Many successful users started with just $1,000.
                    </p>
                    <div className="bg-yellow-400/20 rounded-lg p-4">
                      <p className="text-sm">
                        <strong>Growth Strategy:</strong> Reinvest 50% of your monthly income to compound your earnings. 
                        At this rate, you can double your capital in 12-18 months!
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Banking Features Section */}
            <section id="banking" className="bg-white rounded-2xl shadow-xl p-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                <DollarSign className="w-8 h-8 text-green-600" />
                Banking Features
              </h2>

              <div className="space-y-6">
                <p className="text-gray-700 text-lg">
                  Our digital banking platform offers enterprise-grade security with FDIC insurance and 
                  competitive interest rates to help you save and earn.
                </p>

                {/* Checking Accounts */}
                <div className="bg-blue-50 rounded-xl p-6">
                  <h3 className="text-2xl font-bold text-blue-900 mb-4">Checking Accounts</h3>
                  
                  <div className="grid md:grid-cols-2 gap-4 mb-4">
                    <div className="bg-white rounded-lg p-4">
                      <h4 className="font-bold text-gray-900 mb-2">✅ Full Featured Banking</h4>
                      <ul className="space-y-1 text-sm text-gray-600">
                        <li>• Instant deposits and withdrawals</li>
                        <li>• Inter-account transfers</li>
                        <li>• Transaction history and receipts</li>
                        <li>• Overdraft protection</li>
                      </ul>
                    </div>
                    <div className="bg-white rounded-lg p-4">
                      <h4 className="font-bold text-gray-900 mb-2">🔒 Safety Features</h4>
                      <ul className="space-y-1 text-sm text-gray-600">
                        <li>• FDIC insured up to $250,000</li>
                        <li>• Daily spending caps</li>
                        <li>• Fraud protection</li>
                        <li>• Encrypted transactions</li>
                      </ul>
                    </div>
                  </div>

                  <button
                    onClick={() => navigate('/swf-banking')}
                    className="w-full md:w-auto px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
                  >
                    Open Checking Account
                  </button>
                </div>

                {/* Savings Accounts */}
                <div className="bg-green-50 rounded-xl p-6">
                  <h3 className="text-2xl font-bold text-green-900 mb-4">Savings Accounts</h3>
                  
                  <div className="grid md:grid-cols-2 gap-4 mb-4">
                    <div className="bg-white rounded-lg p-4">
                      <h4 className="font-bold text-gray-900 mb-2">💰 High-Yield Savings (HYSA)</h4>
                      <div className="text-3xl font-bold text-green-600 mb-2">4.25% APY</div>
                      <ul className="space-y-1 text-sm text-gray-600">
                        <li>• No minimum balance</li>
                        <li>• Withdraw anytime</li>
                        <li>• Daily interest accrual</li>
                        <li>• Perfect for emergency fund</li>
                      </ul>
                    </div>
                    <div className="bg-white rounded-lg p-4">
                      <h4 className="font-bold text-gray-900 mb-2">🎯 Certificate of Deposit (CD)</h4>
                      <div className="text-3xl font-bold text-green-600 mb-2">6.25% APY</div>
                      <ul className="space-y-1 text-sm text-gray-600">
                        <li>• Higher interest rate</li>
                        <li>• 6-12 month terms</li>
                        <li>• Guaranteed returns</li>
                        <li>• Best for long-term savings</li>
                      </ul>
                    </div>
                  </div>

                  <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded-r-lg mb-4">
                    <p className="text-sm text-yellow-800">
                      <strong>Example:</strong> Deposit $10,000 in HYSA → Earn $42.50/month. 
                      Same amount in CD → Earn $62.50/month!
                    </p>
                  </div>

                  <button
                    onClick={() => navigate('/swf-banking')}
                    className="w-full md:w-auto px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold"
                  >
                    Open Savings Account
                  </button>
                </div>

                {/* Quick Actions Guide */}
                <div className="bg-gray-50 rounded-xl p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-4">Common Banking Tasks</h3>
                  
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <ChevronRight className="w-5 h-5 text-blue-600 mt-1" />
                      <div>
                        <h4 className="font-bold text-gray-900">Make a Deposit</h4>
                        <p className="text-sm text-gray-600">Go to Banking → Select Account → Click "Deposit" → Enter amount</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <ChevronRight className="w-5 h-5 text-blue-600 mt-1" />
                      <div>
                        <h4 className="font-bold text-gray-900">Transfer Between Accounts</h4>
                        <p className="text-sm text-gray-600">Go to Banking → "Transfer" tab → Select from/to accounts → Enter amount</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <ChevronRight className="w-5 h-5 text-blue-600 mt-1" />
                      <div>
                        <h4 className="font-bold text-gray-900">View Transaction History</h4>
                        <p className="text-sm text-gray-600">Go to Banking → Select Account → "Transactions" tab → Filter by date/type</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Investment Platform Section */}
            <section id="investments" className="bg-white rounded-2xl shadow-xl p-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                <TrendingUp className="w-8 h-8 text-blue-600" />
                Investment Platform
              </h2>

              <div className="space-y-6">
                <p className="text-gray-700 text-lg">
                  Access 8 different investment products with real-time market data, professional analytics, 
                  and educational resources to help you build wealth.
                </p>

                {/* 8 Investment Products */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl p-6 border-2 border-yellow-200">
                    <h3 className="text-xl font-bold text-gray-900 mb-3">💰 Cryptocurrency</h3>
                    <p className="text-sm text-gray-600 mb-3">Bitcoin, Ethereum, and major altcoins</p>
                    <div className="text-xs text-gray-500">Popular: BTC, ETH, SOL</div>
                  </div>

                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border-2 border-blue-200">
                    <h3 className="text-xl font-bold text-gray-900 mb-3">📈 Stocks</h3>
                    <p className="text-sm text-gray-600 mb-3">Individual company shares</p>
                    <div className="text-xs text-gray-500">Popular: AAPL, TSLA, NVDA, MSFT</div>
                  </div>

                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border-2 border-green-200">
                    <h3 className="text-xl font-bold text-gray-900 mb-3">📊 ETFs & Index Funds</h3>
                    <p className="text-sm text-gray-600 mb-3">Diversified market baskets</p>
                    <div className="text-xs text-gray-500">Popular: SPY, QQQ, VOO, VTI</div>
                  </div>

                  <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 border-2 border-purple-200">
                    <h3 className="text-xl font-bold text-gray-900 mb-3">🏛️ Bonds</h3>
                    <p className="text-sm text-gray-600 mb-3">Fixed income securities</p>
                    <div className="text-xs text-gray-500">Popular: TLT, AGG, BND</div>
                  </div>

                  <div className="bg-gradient-to-br from-amber-50 to-yellow-50 rounded-xl p-6 border-2 border-amber-200">
                    <h3 className="text-xl font-bold text-gray-900 mb-3">🥇 Commodities</h3>
                    <p className="text-sm text-gray-600 mb-3">Gold, silver, oil, and more</p>
                    <div className="text-xs text-gray-500">Popular: GLD, SLV, USO</div>
                  </div>

                  <div className="bg-gradient-to-br from-red-50 to-orange-50 rounded-xl p-6 border-2 border-red-200">
                    <h3 className="text-xl font-bold text-gray-900 mb-3">🏘️ REITs</h3>
                    <p className="text-sm text-gray-600 mb-3">Real estate investment trusts</p>
                    <div className="text-xs text-gray-500">Popular: VNQ, O, IYR</div>
                  </div>

                  <div className="bg-gradient-to-br from-cyan-50 to-blue-50 rounded-xl p-6 border-2 border-cyan-200">
                    <h3 className="text-xl font-bold text-gray-900 mb-3">🎯 Options Trading</h3>
                    <p className="text-sm text-gray-600 mb-3">Advanced derivatives</p>
                    <div className="text-xs text-gray-500">Calls, Puts on major stocks</div>
                  </div>

                  <div className="bg-gradient-to-br from-teal-50 to-green-50 rounded-xl p-6 border-2 border-teal-200">
                    <h3 className="text-xl font-bold text-gray-900 mb-3">🏦 Retirement Accounts</h3>
                    <p className="text-sm text-gray-600 mb-3">IRA and 401(k) support</p>
                    <div className="text-xs text-gray-500">Tax-advantaged investing</div>
                  </div>
                </div>

                {/* Trading Features */}
                <div className="bg-blue-50 rounded-xl p-6">
                  <h3 className="text-2xl font-bold text-blue-900 mb-4">Professional Trading Tools</h3>
                  
                  <div className="grid md:grid-cols-3 gap-4 mb-4">
                    <div className="bg-white rounded-lg p-4">
                      <h4 className="font-bold text-gray-900 mb-2">📊 Market Orders</h4>
                      <p className="text-sm text-gray-600">
                        Execute instantly at current market price. Best for quick trades.
                      </p>
                    </div>
                    <div className="bg-white rounded-lg p-4">
                      <h4 className="font-bold text-gray-900 mb-2">🎯 Limit Orders</h4>
                      <p className="text-sm text-gray-600">
                        Set your target price. Order executes when market reaches your price.
                      </p>
                    </div>
                    <div className="bg-white rounded-lg p-4">
                      <h4 className="font-bold text-gray-900 mb-2">📈 Portfolio Analytics</h4>
                      <p className="text-sm text-gray-600">
                        Track P&L, cost basis, returns, and performance metrics.
                      </p>
                    </div>
                  </div>

                  <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-r-lg">
                    <p className="text-sm text-green-800">
                      <strong>Low Fees:</strong> Only 0.1% transaction fee on all trades. 
                      That's $1 on a $1,000 trade - among the lowest in the industry!
                    </p>
                  </div>
                </div>

                {/* How to Make Your First Investment */}
                <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl p-6 text-white">
                  <h3 className="text-2xl font-bold mb-4">How to Make Your First Investment</h3>
                  
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-white/30 rounded-full flex items-center justify-center font-bold flex-shrink-0">1</div>
                      <div>
                        <h4 className="font-bold mb-1">Go to Investments Page</h4>
                        <p className="text-sm opacity-90">Click "Investments" in the main navigation</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-white/30 rounded-full flex items-center justify-center font-bold flex-shrink-0">2</div>
                      <div>
                        <h4 className="font-bold mb-1">Choose "Trade" Tab</h4>
                        <p className="text-sm opacity-90">Browse popular assets or search for a specific symbol</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-white/30 rounded-full flex items-center justify-center font-bold flex-shrink-0">3</div>
                      <div>
                        <h4 className="font-bold mb-1">Enter Trade Details</h4>
                        <p className="text-sm opacity-90">Select Buy, choose Market or Limit order, enter amount</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-white/30 rounded-full flex items-center justify-center font-bold flex-shrink-0">4</div>
                      <div>
                        <h4 className="font-bold mb-1">Review & Confirm</h4>
                        <p className="text-sm opacity-90">Check estimated total with fees, then click "Execute Trade"</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-white/30 rounded-full flex items-center justify-center font-bold flex-shrink-0">5</div>
                      <div>
                        <h4 className="font-bold mb-1">Track Your Portfolio</h4>
                        <p className="text-sm opacity-90">View holdings in Portfolio tab, see P&L in real-time</p>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => navigate('/investments')}
                    className="mt-6 w-full md:w-auto px-8 py-3 bg-white text-blue-600 rounded-lg hover:bg-gray-100 transition-colors font-bold"
                  >
                    Start Investing Now
                  </button>
                </div>

                {/* Beginner Investment Tips */}
                <div className="bg-yellow-50 rounded-xl p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-4">💡 Beginner Investment Tips</h3>
                  
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-green-600 mt-1 flex-shrink-0" />
                      <div>
                        <h4 className="font-bold text-gray-900">Start Small & Learn</h4>
                        <p className="text-sm text-gray-600">Begin with $100-500 to learn how the platform works without risk.</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-green-600 mt-1 flex-shrink-0" />
                      <div>
                        <h4 className="font-bold text-gray-900">Diversify Your Portfolio</h4>
                        <p className="text-sm text-gray-600">Don't put all eggs in one basket. Spread across stocks, ETFs, and crypto.</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-green-600 mt-1 flex-shrink-0" />
                      <div>
                        <h4 className="font-bold text-gray-900">Use Dollar-Cost Averaging</h4>
                        <p className="text-sm text-gray-600">Invest same amount regularly (weekly/monthly) to reduce timing risk.</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-green-600 mt-1 flex-shrink-0" />
                      <div>
                        <h4 className="font-bold text-gray-900">Set Limit Orders for Better Prices</h4>
                        <p className="text-sm text-gray-600">Wait for your target price instead of buying at current market price.</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-green-600 mt-1 flex-shrink-0" />
                      <div>
                        <h4 className="font-bold text-gray-900">Review Portfolio Weekly</h4>
                        <p className="text-sm text-gray-600">Check P&L, rebalance if needed, but avoid emotional trading.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Advanced Features Section */}
            <section id="advanced" className="bg-white rounded-2xl shadow-xl p-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                <Shield className="w-8 h-8 text-purple-600" />
                Advanced Features
              </h2>

              <div className="space-y-6">
                <p className="text-gray-700 text-lg">
                  Take your earnings to the next level with blockchain-powered features like staking, 
                  community savings circles, and tokenized assets.
                </p>

                {/* Staking */}
                <div className="bg-purple-50 rounded-xl p-6">
                  <h3 className="text-2xl font-bold text-purple-900 mb-4">🔒 Token Staking</h3>
                  
                  <div className="grid md:grid-cols-2 gap-4 mb-4">
                    <div className="bg-white rounded-lg p-4">
                      <h4 className="font-bold text-gray-900 mb-2">How It Works</h4>
                      <p className="text-sm text-gray-600 mb-3">
                        Lock your SWF tokens in the staking vault to earn rewards. The longer you stake, 
                        the more you earn.
                      </p>
                      <div className="text-2xl font-bold text-purple-600">10-30% APR</div>
                      <p className="text-xs text-gray-500">Dynamic rate based on total vault deposits</p>
                    </div>
                    <div className="bg-white rounded-lg p-4">
                      <h4 className="font-bold text-gray-900 mb-2">Benefits</h4>
                      <ul className="space-y-1 text-sm text-gray-600">
                        <li>• Earn passive income automatically</li>
                        <li>• Rewards distributed daily</li>
                        <li>• Withdraw anytime (unstaking fee may apply)</li>
                        <li>• Higher APR for longer lock periods</li>
                      </ul>
                    </div>
                  </div>

                  <button
                    onClick={() => navigate('/enhanced-staking')}
                    className="w-full md:w-auto px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-semibold"
                  >
                    Start Staking
                  </button>
                </div>

                {/* SouSou Circles */}
                <div className="bg-orange-50 rounded-xl p-6">
                  <h3 className="text-2xl font-bold text-orange-900 mb-4">🤝 SouSou Savings Circles</h3>
                  
                  <div className="bg-white rounded-lg p-4 mb-4">
                    <h4 className="font-bold text-gray-900 mb-3">What is a SouSou Circle?</h4>
                    <p className="text-sm text-gray-600 mb-3">
                      A traditional Caribbean rotating savings system brought to blockchain. Members contribute 
                      regularly, and each member receives the full pot on their turn.
                    </p>
                    
                    <div className="bg-blue-50 rounded-lg p-4">
                      <h5 className="font-bold text-gray-900 mb-2">Example:</h5>
                      <ul className="space-y-1 text-sm text-gray-600">
                        <li>• 10 members contribute $100/month</li>
                        <li>• Total pool: $1,000/month</li>
                        <li>• Each member receives $1,000 once during the 10-month cycle</li>
                        <li>• Perfect for planned expenses or investments!</li>
                      </ul>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4 mb-4">
                    <div className="bg-white rounded-lg p-4">
                      <h4 className="font-bold text-gray-900 mb-2">✅ Why Join?</h4>
                      <ul className="space-y-1 text-sm text-gray-600">
                        <li>• Access lump sums for big purchases</li>
                        <li>• Build community & accountability</li>
                        <li>• Blockchain transparency & security</li>
                        <li>• Automatic contributions & distributions</li>
                      </ul>
                    </div>
                    <div className="bg-white rounded-lg p-4">
                      <h4 className="font-bold text-gray-900 mb-2">🎯 Best For:</h4>
                      <ul className="space-y-1 text-sm text-gray-600">
                        <li>• Down payment on house/car</li>
                        <li>• Business startup capital</li>
                        <li>• Large investment deposits</li>
                        <li>• Emergency fund building</li>
                      </ul>
                    </div>
                  </div>

                  <button
                    onClick={() => navigate('/sousou-circle')}
                    className="w-full md:w-auto px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-semibold"
                  >
                    Join a Circle
                  </button>
                </div>

                {/* Other Advanced Features */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-gradient-to-br from-yellow-50 to-amber-50 rounded-xl p-6 border-2 border-yellow-200">
                    <h3 className="text-xl font-bold text-gray-900 mb-3">🏅 Gold Certificates</h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Invest in tokenized gold certificates backed by physical gold reserves. 
                      Hedge against inflation with blockchain transparency.
                    </p>
                    <button
                      onClick={() => navigate('/gold-certificates')}
                      className="text-sm text-yellow-700 hover:text-yellow-900 font-semibold"
                    >
                      Explore Gold Certificates →
                    </button>
                  </div>

                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border-2 border-green-200">
                    <h3 className="text-xl font-bold text-gray-900 mb-3">🏘️ Real Estate</h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Fractional real estate ownership through tokenization. Earn rental income 
                      and property appreciation without buying entire properties.
                    </p>
                    <button
                      onClick={() => navigate('/real-estate')}
                      className="text-sm text-green-700 hover:text-green-900 font-semibold"
                    >
                      Browse Real Estate →
                    </button>
                  </div>

                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border-2 border-blue-200">
                    <h3 className="text-xl font-bold text-gray-900 mb-3">🏛️ DAO Governance</h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Vote on platform decisions, propose improvements, and shape the future 
                      of the Sovran Wealth Fund ecosystem.
                    </p>
                    <button
                      onClick={() => navigate('/dao-dashboard')}
                      className="text-sm text-blue-700 hover:text-blue-900 font-semibold"
                    >
                      Join DAO →
                    </button>
                  </div>

                  <div className="bg-gradient-to-br from-red-50 to-pink-50 rounded-xl p-6 border-2 border-red-200">
                    <h3 className="text-xl font-bold text-gray-900 mb-3">📊 Risk Management</h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Advanced analytics, portfolio risk scoring, stress testing, and 
                      automated rebalancing to protect your wealth.
                    </p>
                    <button
                      onClick={() => navigate('/risk-dashboard')}
                      className="text-sm text-red-700 hover:text-red-900 font-semibold"
                    >
                      View Risk Tools →
                    </button>
                  </div>
                </div>
              </div>
            </section>

            {/* Success Stories / Testimonials */}
            <section className="bg-gradient-to-br from-green-500 to-teal-600 rounded-2xl shadow-xl p-8 text-white">
              <h2 className="text-3xl font-bold mb-6">Success Stories</h2>
              
              <div className="grid md:grid-cols-3 gap-6">
                <div className="bg-white/20 rounded-xl p-6">
                  <div className="text-4xl mb-3">💰</div>
                  <div className="text-2xl font-bold mb-2">$847/month</div>
                  <p className="text-sm opacity-90">
                    "Started with $20K in savings and investments. Now earning consistent monthly income!"
                  </p>
                  <p className="text-xs mt-2 opacity-75">- Sarah M., Platform User</p>
                </div>
                
                <div className="bg-white/20 rounded-xl p-6">
                  <div className="text-4xl mb-3">🎯</div>
                  <div className="text-2xl font-bold mb-2">$15K saved</div>
                  <p className="text-sm opacity-90">
                    "SouSou circles helped me save for a down payment in just 8 months!"
                  </p>
                  <p className="text-xs mt-2 opacity-75">- James K., Circle Member</p>
                </div>
                
                <div className="bg-white/20 rounded-xl p-6">
                  <div className="text-4xl mb-3">📈</div>
                  <div className="text-2xl font-bold mb-2">32% returns</div>
                  <p className="text-sm opacity-90">
                    "Diversified portfolio across crypto, stocks, and staking. Best decision ever!"
                  </p>
                  <p className="text-xs mt-2 opacity-75">- Maria L., Investor</p>
                </div>
              </div>
            </section>

            {/* FAQ Section */}
            <section className="bg-white rounded-2xl shadow-xl p-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Frequently Asked Questions</h2>
              
              <div className="space-y-4">
                <details className="bg-gray-50 rounded-lg p-4">
                  <summary className="font-bold text-gray-900 cursor-pointer">
                    How much money do I need to start?
                  </summary>
                  <p className="text-sm text-gray-600 mt-3">
                    You can start with as little as $100 for savings accounts or $50 for investments. 
                    However, to reach $500/month income, we recommend starting with at least $5,000-$10,000 
                    and building up over time through reinvestment.
                  </p>
                </details>

                <details className="bg-gray-50 rounded-lg p-4">
                  <summary className="font-bold text-gray-900 cursor-pointer">
                    Is my money safe on this platform?
                  </summary>
                  <p className="text-sm text-gray-600 mt-3">
                    Yes! Banking accounts are FDIC insured up to $250,000. Investment accounts use 
                    enterprise-grade encryption and multi-signature security. All transactions are 
                    protected by blockchain transparency and smart contract audits.
                  </p>
                </details>

                <details className="bg-gray-50 rounded-lg p-4">
                  <summary className="font-bold text-gray-900 cursor-pointer">
                    How quickly can I withdraw my money?
                  </summary>
                  <p className="text-sm text-gray-600 mt-3">
                    Checking and savings accounts: Instant withdrawal. Investment accounts: Sell anytime 
                    during market hours, funds available in 1-2 business days. Staking: Withdraw anytime 
                    (small unstaking fee may apply for early withdrawal).
                  </p>
                </details>

                <details className="bg-gray-50 rounded-lg p-4">
                  <summary className="font-bold text-gray-900 cursor-pointer">
                    What fees do you charge?
                  </summary>
                  <p className="text-sm text-gray-600 mt-3">
                    Banking: No monthly fees. Investments: 0.1% transaction fee. Staking: No fees 
                    (rewards distributed automatically). Full fee transparency available in each product's 
                    terms.
                  </p>
                </details>

                <details className="bg-gray-50 rounded-lg p-4">
                  <summary className="font-bold text-gray-900 cursor-pointer">
                    Do I need crypto experience to use this platform?
                  </summary>
                  <p className="text-sm text-gray-600 mt-3">
                    No! We designed the platform for beginners. Our banking and investment features work 
                    just like traditional finance. Blockchain features (staking, SouSou) have built-in 
                    tutorials and we handle the technical complexity for you.
                  </p>
                </details>

                <details className="bg-gray-50 rounded-lg p-4">
                  <summary className="font-bold text-gray-900 cursor-pointer">
                    How are investment returns calculated?
                  </summary>
                  <p className="text-sm text-gray-600 mt-3">
                    We use real-time market data from multiple providers (CoinGecko, Alpha Vantage, FMP). 
                    Your portfolio dashboard shows live P&L, cost basis, and return percentages. All 
                    calculations use Decimal.js for precision - no rounding errors!
                  </p>
                </details>
              </div>
            </section>

            {/* Final CTA */}
            <section className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl shadow-xl p-12 text-center text-white">
              <h2 className="text-4xl font-bold mb-4">Ready to Start Earning?</h2>
              <p className="text-xl mb-8 opacity-90">
                Join thousands of users already earning extra monthly income through our platform
              </p>
              
              <div className="flex flex-wrap gap-4 justify-center">
                <button
                  onClick={() => navigate('/swf-banking')}
                  className="px-8 py-4 bg-white text-blue-600 rounded-lg hover:bg-gray-100 transition-colors font-bold text-lg"
                >
                  Open Savings Account
                </button>
                <button
                  onClick={() => navigate('/investments')}
                  className="px-8 py-4 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-bold text-lg"
                >
                  Start Investing
                </button>
                <button
                  onClick={() => navigate('/enhanced-staking')}
                  className="px-8 py-4 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors font-bold text-lg"
                >
                  Stake Tokens
                </button>
              </div>

              <p className="text-sm mt-8 opacity-75">
                Questions? Visit our <button onClick={() => navigate('/contact-us')} className="underline hover:opacity-100">Contact Page</button> or 
                check out <button onClick={() => navigate('/faq')} className="underline hover:opacity-100">FAQ</button>
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserGuidePage;
