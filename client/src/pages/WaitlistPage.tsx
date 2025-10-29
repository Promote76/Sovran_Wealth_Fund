import React, { useState, useEffect } from 'react';
import axios from 'axios';

const WaitlistPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [investmentRange, setInvestmentRange] = useState('');
  const [investorType, setInvestorType] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [stats, setStats] = useState({ totalSignups: 0, availableSpots: 100 });
  const [position, setPosition] = useState<number | null>(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await axios.get('/api/waitlist/stats');
      if (response.data.success) {
        setStats(response.data.stats);
      }
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await axios.post('/api/waitlist/signup', {
        email,
        name,
        investmentRange,
        investorType,
        source: 'landing_page'
      });

      if (response.data.success) {
        setSuccess(true);
        setPosition(response.data.position);
        fetchStats();
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to join waitlist');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 flex items-center justify-center px-4">
        <div className="max-w-2xl w-full bg-white rounded-2xl shadow-2xl p-8 text-center">
          <div className="mb-6">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Welcome to AXIOM! 🎉</h2>
            <p className="text-xl text-gray-600">You're on the founding member waitlist</p>
          </div>

          <div className="bg-blue-50 rounded-xl p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="bg-white rounded-lg p-4 shadow">
                <div className="text-3xl font-bold text-blue-600">#{position}</div>
                <div className="text-sm text-gray-600">Your Position</div>
              </div>
              <div className="bg-white rounded-lg p-4 shadow">
                <div className="text-3xl font-bold text-blue-600">{stats.availableSpots}</div>
                <div className="text-sm text-gray-600">Spots Remaining</div>
              </div>
            </div>

            <h3 className="font-bold text-lg text-gray-900 mb-3">Founding Member Benefits:</h3>
            <div className="space-y-2 text-left">
              <div className="flex items-start">
                <svg className="w-5 h-5 text-green-600 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-gray-700"><strong>1% platform fee</strong> (50% off lifetime - normally 2%)</span>
              </div>
              <div className="flex items-start">
                <svg className="w-5 h-5 text-green-600 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-gray-700"><strong>First access</strong> to tokenized properties before public launch</span>
              </div>
              <div className="flex items-start">
                <svg className="w-5 h-5 text-green-600 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-gray-700"><strong>Priority support</strong> & exclusive founding member updates</span>
              </div>
              <div className="flex items-start">
                <svg className="w-5 h-5 text-green-600 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-gray-700"><strong>First-mover advantage</strong> on GENIUS Act opportunities</span>
              </div>
              <div className="flex items-start">
                <svg className="w-5 h-5 text-green-600 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-gray-700"><strong>Influence platform features</strong> as an early adopter</span>
              </div>
            </div>
          </div>

          <div className="text-sm text-gray-600">
            <p>Check your email for confirmation and next steps.</p>
            <p className="mt-2">We'll notify you when AXIOM officially launches!</p>
          </div>

          <button
            onClick={() => window.location.href = '/'}
            className="mt-6 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Explore Platform
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900">
      {/* Header */}
      <header className="container mx-auto px-4 py-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-white">AXIOM</h1>
          <button
            onClick={() => window.location.href = '/'}
            className="text-white hover:text-blue-200 transition"
          >
            Back to Platform
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <div className="container mx-auto px-4 py-12 md:py-20">
        <div className="max-w-4xl mx-auto text-center mb-12">
          <div className="inline-block bg-yellow-400 text-gray-900 px-4 py-2 rounded-full text-sm font-semibold mb-6">
            🚀 LAUNCHING SOON - Limited Founding Member Spots
          </div>
          
          <h2 className="text-4xl md:text-6xl font-bold text-white mb-6">
            The First GENIUS Act<br />
            <span className="text-blue-300">Crypto Real Estate Platform</span>
          </h2>
          
          <p className="text-xl md:text-2xl text-blue-100 mb-4">
            International crypto investors can now legally invest in U.S. real estate
          </p>
          
          <p className="text-lg text-blue-200 mb-8 max-w-3xl mx-auto">
            The <strong>GENIUS Act</strong> (Generating Excellent New Investment from Underutilized Sources) unlocks 
            <strong className="text-yellow-300"> $52 billion</strong> in global crypto liquidity for U.S. real estate. 
            AXIOM is positioned as the <strong>first-mover platform</strong> to capture this massive market opportunity.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center text-white mb-8">
            <div className="flex items-center">
              <svg className="w-6 h-6 text-green-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Chainalysis Wallet Screening
            </div>
            <div className="flex items-center">
              <svg className="w-6 h-6 text-green-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              KYC/AML Compliant
            </div>
            <div className="flex items-center">
              <svg className="w-6 h-6 text-green-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              USDC/USDT/BUSD
            </div>
          </div>

          {/* Stats Banner */}
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 mb-12">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6 text-white">
              <div>
                <div className="text-3xl md:text-4xl font-bold text-blue-300">{stats.totalSignups}</div>
                <div className="text-sm text-blue-100">Investors Waiting</div>
              </div>
              <div>
                <div className="text-3xl md:text-4xl font-bold text-yellow-300">{stats.availableSpots}</div>
                <div className="text-sm text-blue-100">Founding Spots Left</div>
              </div>
              <div className="col-span-2 md:col-span-1">
                <div className="text-3xl md:text-4xl font-bold text-green-300">50%</div>
                <div className="text-sm text-blue-100">Lifetime Fee Discount</div>
              </div>
            </div>
          </div>
        </div>

        {/* Value Proposition Section */}
        <div className="max-w-5xl mx-auto mb-16">
          <div className="bg-gradient-to-r from-yellow-400 to-orange-400 rounded-2xl p-8 text-gray-900 shadow-2xl">
            <h3 className="text-2xl md:text-3xl font-bold mb-6 text-center">
              Why Founding Members Win
            </h3>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-white/90 rounded-xl p-6">
                <div className="text-3xl mb-3">💰</div>
                <h4 className="font-bold text-lg mb-2">1% Platform Fee (50% Off Forever)</h4>
                <p className="text-gray-700 text-sm">
                  Save <strong>$5,000 on every $500K</strong> investment compared to standard 2% fees. 
                  This discount applies to <strong>every transaction, forever</strong>.
                </p>
              </div>
              
              <div className="bg-white/90 rounded-xl p-6">
                <div className="text-3xl mb-3">🎯</div>
                <h4 className="font-bold text-lg mb-2">First Access to Premium Deals</h4>
                <p className="text-gray-700 text-sm">
                  Get <strong>48-hour early access</strong> to new tokenized properties before they're 
                  available to the general public. Best locations, highest yields, lowest entry points.
                </p>
              </div>
              
              <div className="bg-white/90 rounded-xl p-6">
                <div className="text-3xl mb-3">🌍</div>
                <h4 className="font-bold text-lg mb-2">International Investor Focus</h4>
                <p className="text-gray-700 text-sm">
                  Built for <strong>DAOs, family offices, and international crypto investors</strong>. 
                  Stablecoin escrow, multi-chain support (BSC, Polygon, Arbitrum), and compliant onboarding.
                </p>
              </div>
              
              <div className="bg-white/90 rounded-xl p-6">
                <div className="text-3xl mb-3">📈</div>
                <h4 className="font-bold text-lg mb-2">Massive Market Opportunity</h4>
                <p className="text-gray-700 text-sm">
                  <strong>$52B</strong> crypto liquidity waiting to enter U.S. real estate. 
                  AXIOM is the <strong>only platform</strong> positioned to capture this GENIUS Act windfall.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Signup Form */}
        <div className="max-w-md mx-auto bg-white rounded-2xl shadow-2xl p-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-2 text-center">
            Join the Waitlist
          </h3>
          <p className="text-gray-600 text-center mb-6">
            First 100 investors get <span className="text-blue-600 font-bold">50% off platform fees for life</span>
          </p>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email Address *
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="your@email.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Full Name (Optional)
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="John Doe"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Investment Range
              </label>
              <select
                value={investmentRange}
                onChange={(e) => setInvestmentRange(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select range...</option>
                <option value="500-5000">$500 - $5,000 (Retail)</option>
                <option value="5000-25000">$5,000 - $25,000 (Accredited)</option>
                <option value="25000-100000">$25,000 - $100,000 (Premium)</option>
                <option value="100000-500000">$100,000 - $500,000 (Institutional)</option>
                <option value="500000+">$500,000+ (Family Office / DAO)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Investor Type
              </label>
              <select
                value={investorType}
                onChange={(e) => setInvestorType(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select type...</option>
                <option value="individual">Individual Investor</option>
                <option value="accredited">Accredited Investor (U.S.)</option>
                <option value="international">International Investor</option>
                <option value="dao">DAO / Family Office</option>
                <option value="fund">Investment Fund</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white px-6 py-4 rounded-lg font-semibold hover:bg-blue-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {loading ? 'Joining...' : 'Reserve My Founding Member Spot →'}
            </button>

            <p className="text-xs text-gray-500 text-center">
              By joining, you'll receive updates about AXIOM's launch and founding member benefits.
              No spam, unsubscribe anytime.
            </p>
          </form>
        </div>

        {/* Features Grid */}
        <div className="max-w-6xl mx-auto mt-20 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 text-white">
            <div className="text-4xl mb-4">🏠</div>
            <h3 className="text-xl font-bold mb-2">Fractional Real Estate</h3>
            <p className="text-blue-100">
              Own shares of U.S. rental properties starting at $500. Blockchain-verified ownership, 
              monthly stablecoin distributions, and full transparency.
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 text-white">
            <div className="text-4xl mb-4">💰</div>
            <h3 className="text-xl font-bold mb-2">Passive Income Streams</h3>
            <p className="text-blue-100">
              Earn 6-12% annual yields from rental income + property appreciation. 
              Distributions sent directly to your wallet in USDC, USDT, or BUSD.
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 text-white">
            <div className="text-4xl mb-4">🔒</div>
            <h3 className="text-xl font-bold mb-2">Institutional-Grade Security</h3>
            <p className="text-blue-100">
              Chainalysis wallet screening, KYC/AML compliance, Circle escrow integration, 
              and smart contract audits for maximum investor protection.
            </p>
          </div>
        </div>

        {/* GENIUS Act Explainer */}
        <div className="max-w-4xl mx-auto mt-20 bg-white/10 backdrop-blur-sm rounded-2xl p-8 text-white">
          <h3 className="text-2xl font-bold mb-4 text-center">What is the GENIUS Act?</h3>
          <p className="text-blue-100 mb-4">
            The <strong>Generating Excellent New Investment from Underutilized Sources (GENIUS) Act</strong> is 
            groundbreaking legislation that allows <strong>international crypto investors</strong> to legally invest 
            in U.S. real estate using digital assets.
          </p>
          <div className="grid md:grid-cols-2 gap-6 mt-6">
            <div className="bg-white/5 rounded-lg p-4">
              <h4 className="font-bold mb-2">🌍 Who Benefits?</h4>
              <ul className="text-sm text-blue-100 space-y-1">
                <li>• International crypto holders (UAE, Singapore, Brazil, etc.)</li>
                <li>• DAOs and family offices with digital assets</li>
                <li>• Offshore investors seeking U.S. real estate exposure</li>
              </ul>
            </div>
            <div className="bg-white/5 rounded-lg p-4">
              <h4 className="font-bold mb-2">💡 Why AXIOM?</h4>
              <ul className="text-sm text-blue-100 space-y-1">
                <li>• First-mover advantage in $52B market</li>
                <li>• Built specifically for GENIUS Act compliance</li>
                <li>• No competition in this regulatory space yet</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WaitlistPage;
