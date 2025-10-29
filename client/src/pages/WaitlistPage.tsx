import React, { useState, useEffect } from 'react';
import axios from 'axios';

type Role = 'investor' | 'wholesaler' | 'both';

const WaitlistPage: React.FC = () => {
  const [role, setRole] = useState<Role>('investor');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [country, setCountry] = useState('');
  const [investmentRange, setInvestmentRange] = useState('');
  const [investorType, setInvestorType] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [marketsServed, setMarketsServed] = useState('');
  const [avgMonthlyDeals, setAvgMonthlyDeals] = useState('');
  const [assignmentFeePercent, setAssignmentFeePercent] = useState('');
  const [entityType, setEntityType] = useState('');
  const [hasEin, setHasEin] = useState<boolean | null>(null);
  const [hasEoInsurance, setHasEoInsurance] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [stats, setStats] = useState({ 
    totalSignups: 0, 
    availableFoundingSpots: 500,
    investors: 0,
    wholesalers: 0
  });
  const [position, setPosition] = useState<number | null>(null);
  const [responseRole, setResponseRole] = useState<Role>('investor');
  const [referralLink, setReferralLink] = useState('');
  const [copySuccess, setCopySuccess] = useState(false);
  
  // NEW: Conversion optimization state
  const [touchedFields, setTouchedFields] = useState<Record<string, boolean>>({});
  const [showExitIntent, setShowExitIntent] = useState(false);
  const [recentSignups, setRecentSignups] = useState<string[]>([
    'John D. from Miami', 'Sarah K. from Dallas', 'Mike R. from Houston',
    'Lisa M. from Phoenix', 'David W. from Atlanta', 'Emma B. from Chicago'
  ]);

  const FEATURE_FLAG_WAITLIST_LANES = process.env.REACT_APP_WAITLIST_LANES_ENABLED === 'true';
  
  // NEW: Field validation helpers
  const isEmailValid = () => email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
  const isFieldValid = (fieldName: string): boolean => {
    if (fieldName === 'email') return !!isEmailValid();
    if (fieldName === 'investorType') return !!(role === 'investor' || role === 'both') && !!investorType;
    if (fieldName === 'investmentRange') return !!(role === 'investor' || role === 'both') && !!investmentRange;
    if (fieldName === 'companyName') return !!(role === 'wholesaler' || role === 'both') && !!companyName.trim();
    if (fieldName === 'avgMonthlyDeals') return !!(role === 'wholesaler' || role === 'both') && !!avgMonthlyDeals && !isNaN(Number(avgMonthlyDeals));
    return false;
  };

  useEffect(() => {
    fetchStats();
    const params = new URLSearchParams(window.location.search);
    const refParam = params.get('ref');
    if (refParam) {
      setReferralLink(`${window.location.origin}/waitlist?ref=${refParam}`);
    }
    
    // NEW: Exit intent detection
    const handleMouseLeave = (e: MouseEvent) => {
      if (e.clientY <= 0 && !success && !showExitIntent) {
        setShowExitIntent(true);
      }
    };
    document.addEventListener('mouseleave', handleMouseLeave);
    
    // NEW: Social proof ticker rotation
    const tickerInterval = setInterval(() => {
      setRecentSignups(prev => {
        const rotated = [...prev];
        rotated.push(rotated.shift()!);
        return rotated;
      });
    }, 3000);
    
    return () => {
      document.removeEventListener('mouseleave', handleMouseLeave);
      clearInterval(tickerInterval);
    };
  }, [success, showExitIntent]);

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

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!email.trim()) {
      errors.email = 'Email is required';
    } else if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      errors.email = 'Please enter a valid email address';
    }

    if (role === 'investor' || role === 'both') {
      if (!investorType) {
        errors.investorType = 'Please select an investor type';
      }
      if (!investmentRange) {
        errors.investmentRange = 'Please select an investment range';
      }
    }

    if (role === 'wholesaler' || role === 'both') {
      if (!companyName.trim()) {
        errors.companyName = 'Company name is required for wholesalers';
      }
      if (!avgMonthlyDeals.trim()) {
        errors.avgMonthlyDeals = 'Average monthly deals is required';
      } else if (isNaN(Number(avgMonthlyDeals)) || Number(avgMonthlyDeals) < 0) {
        errors.avgMonthlyDeals = 'Must be a number 0 or greater';
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setValidationErrors({});

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const params = new URLSearchParams(window.location.search);
      const refParam = params.get('ref');

      const payload: any = {
        email,
        name,
        country,
        role: FEATURE_FLAG_WAITLIST_LANES ? role : 'investor',
        source: 'landing_page',
        ref: refParam
      };

      if (role === 'investor' || role === 'both') {
        payload.investmentRange = investmentRange;
        payload.investorType = investorType;
      }

      if (role === 'wholesaler' || role === 'both') {
        payload.companyName = companyName;
        payload.marketsServed = marketsServed;
        payload.avgMonthlyDeals = Number(avgMonthlyDeals);
        if (assignmentFeePercent) {
          payload.assignmentFeePercent = Number(assignmentFeePercent);
        }
        if (entityType) {
          payload.entityType = entityType;
        }
        if (hasEin !== null) {
          payload.hasEin = hasEin;
        }
        if (hasEoInsurance !== null) {
          payload.hasEoInsurance = hasEoInsurance;
        }
      }

      const response = await axios.post('/api/waitlist/signup', payload);

      if (response.data.success) {
        setSuccess(true);
        setPosition(response.data.position);
        setResponseRole(response.data.role);
        const baseUrl = `${window.location.origin}/waitlist?ref=${response.data.position}`;
        setReferralLink(baseUrl);
        fetchStats();
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to join waitlist');
    } finally {
      setLoading(false);
    }
  };

  const copyReferralLink = () => {
    navigator.clipboard.writeText(referralLink);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  if (success) {
    const isInvestor = responseRole === 'investor' || responseRole === 'both';
    const isWholesaler = responseRole === 'wholesaler' || responseRole === 'both';

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
            <p className="text-xl text-gray-600">
              {responseRole === 'both' 
                ? "You're registered as both an Investor and Wholesaler" 
                : `You're on the ${responseRole} waitlist`}
            </p>
          </div>

          <div className="bg-blue-50 rounded-xl p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="bg-white rounded-lg p-4 shadow">
                <div className="text-3xl font-bold text-blue-600">#{position}</div>
                <div className="text-sm text-gray-600">Your Position</div>
              </div>
              <div className="bg-white rounded-lg p-4 shadow">
                <div className="text-3xl font-bold text-blue-600">{stats.availableFoundingSpots}</div>
                <div className="text-sm text-gray-600">Founding Spots Left</div>
              </div>
            </div>

            <h3 className="font-bold text-lg text-gray-900 mb-3">
              {isInvestor && isWholesaler ? 'Your Benefits:' : isWholesaler ? 'Wholesaler Benefits:' : 'Founding Member Benefits:'}
            </h3>
            <div className="space-y-2 text-left">
              {isInvestor && (
                <>
                  <div className="flex items-start">
                    <svg className="w-5 h-5 text-green-600 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="text-gray-700"><strong>1% platform fee</strong> for founding members (50% off lifetime)</span>
                  </div>
                  <div className="flex items-start">
                    <svg className="w-5 h-5 text-green-600 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="text-gray-700"><strong>First access</strong> to tokenized properties before public launch</span>
                  </div>
                </>
              )}
              {isWholesaler && (
                <>
                  <div className="flex items-start">
                    <svg className="w-5 h-5 text-green-600 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="text-gray-700"><strong>Zero listing fees</strong> for first 60 days</span>
                  </div>
                  <div className="flex items-start">
                    <svg className="w-5 h-5 text-green-600 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="text-gray-700"><strong>Access to investor pool</strong> of verified buyers</span>
                  </div>
                  <div className="flex items-start">
                    <svg className="w-5 h-5 text-green-600 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="text-gray-700"><strong>Flexible payouts</strong> in stablecoin or fiat</span>
                  </div>
                </>
              )}
              <div className="flex items-start">
                <svg className="w-5 h-5 text-green-600 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-gray-700"><strong>Priority support</strong> and exclusive updates</span>
              </div>
            </div>
          </div>

          {referralLink && (
            <div className="bg-gray-50 rounded-xl p-4 mb-6">
              <p className="text-sm font-medium text-gray-700 mb-2">Share AXIOM and move up the waitlist:</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  readOnly
                  value={referralLink}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
                />
                <button
                  onClick={copyReferralLink}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium"
                >
                  {copySuccess ? '✓ Copied' : 'Copy Link'}
                </button>
              </div>
            </div>
          )}

          <div className="text-sm text-gray-600">
            <p>Check your email to confirm your spot on the waitlist.</p>
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

      <div className="container mx-auto px-4 py-12 md:py-20">
        <div className="max-w-4xl mx-auto text-center mb-12">
          <div className="inline-block bg-yellow-400 text-gray-900 px-4 py-2 rounded-full text-sm font-semibold mb-4 animate-pulse">
            🚀 LAUNCHING SOON - Limited Founding Member Spots
          </div>
          
          {/* NEW: Social Proof Ticker */}
          <div className="bg-white/20 backdrop-blur-md rounded-lg px-6 py-3 mb-6 border border-white/30 shadow-lg">
            <div className="flex items-center justify-center space-x-2 text-sm text-white font-medium">
              <span className="animate-pulse text-lg">🔥</span>
              <span>{recentSignups[0]} just joined</span>
              <span className="mx-2">•</span>
              <span>{stats.totalSignups} members waiting</span>
            </div>
          </div>
          
          <h2 className="text-4xl md:text-6xl font-bold text-white mb-6">
            The First GENIUS Act<br />
            <span className="text-blue-300">Crypto Real Estate Platform</span>
          </h2>
          
          <p className="text-xl md:text-2xl text-blue-100 mb-4">
            Investors + Wholesalers: The only platform connecting <strong>$52B in crypto capital</strong> with wholesale deals
          </p>
          
          <p className="text-lg text-blue-200 mb-8 max-w-3xl mx-auto">
            The <strong>GENIUS Act</strong> unlocks <strong className="text-yellow-300">$52 billion</strong> in 
            global crypto liquidity. AXIOM is the <strong>only platform</strong> giving wholesalers direct access to 
            international crypto investors + verified U.S. buyers seeking fractional property ownership.
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

          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 mb-12">
            <div className="grid grid-cols-3 gap-6 text-white">
              <div>
                <div className="text-3xl md:text-4xl font-bold text-blue-300">{stats.totalSignups}</div>
                <div className="text-sm text-blue-100">Investors Waiting</div>
              </div>
              <div>
                <div className="text-3xl md:text-4xl font-bold text-yellow-300">{stats.availableFoundingSpots}</div>
                <div className="text-sm text-blue-100">Founding Spots Left</div>
              </div>
              <div>
                <div className="text-3xl md:text-4xl font-bold text-green-300">50%</div>
                <div className="text-sm text-blue-100">Lifetime Fee Discount</div>
              </div>
            </div>
          </div>

          {/* Why Founding Members Win Section */}
          <div className="bg-gradient-to-br from-yellow-400 via-orange-400 to-orange-500 rounded-2xl p-8 mb-12 shadow-2xl">
            <h3 className="text-3xl font-bold text-gray-900 mb-8 text-center">
              Why Founding Members Win
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Card 1: Platform Fee */}
              <div className="bg-white rounded-xl p-6 shadow-lg">
                <div className="text-4xl mb-3">💵</div>
                <h4 className="text-xl font-bold text-gray-900 mb-3">
                  1% Platform Fee (50% Off Forever)
                </h4>
                <p className="text-gray-700 text-sm">
                  Save $5,000 on every $500K investment compared to standard 2% fees. This 
                  discount applies to <strong>every transaction</strong>, compounding your returns year after year.
                </p>
              </div>

              {/* Card 2: First Access */}
              <div className="bg-white rounded-xl p-6 shadow-lg">
                <div className="text-4xl mb-3">🎯</div>
                <h4 className="text-xl font-bold text-gray-900 mb-3">
                  First Access to Premium Deals
                </h4>
                <p className="text-gray-700 text-sm">
                  Get <strong>48-hour early access</strong> to new tokenized properties before they're available to the 
                  general public. Best locations, highest yields, lowest entry points.
                </p>
              </div>

              {/* Card 3: International Investor Focus */}
              <div className="bg-white rounded-xl p-6 shadow-lg">
                <div className="text-4xl mb-3">🌍</div>
                <h4 className="text-xl font-bold text-gray-900 mb-3">
                  International Investor Focus
                </h4>
                <p className="text-gray-700 text-sm">
                  Built for DAOs, family offices, and international crypto investors. 
                  Stablecoin escrow, multi-chain support (BSC, Polygon, Arbitrum), and 
                  Chainalysis wallet screening for OFAC compliance.
                </p>
              </div>

              {/* Card 4: Massive Market Opportunity */}
              <div className="bg-white rounded-xl p-6 shadow-lg">
                <div className="text-4xl mb-3">📈</div>
                <h4 className="text-xl font-bold text-gray-900 mb-3">
                  Massive Market Opportunity
                </h4>
                <p className="text-gray-700 text-sm">
                  <strong>$52B</strong> crypto liquidity waiting to enter U.S. real estate. AXIOM is the 
                  <strong> only platform</strong> positioned to capture this GENIUS Act opportunity with 
                  full regulatory compliance.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-md mx-auto bg-white rounded-2xl shadow-2xl p-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-2 text-center">
            Join the Waitlist
          </h3>
          <p className="text-gray-600 text-center mb-6">
            First 100 investors get <strong>50% off platform fees for life</strong>
          </p>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {FEATURE_FLAG_WAITLIST_LANES && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  I am a... *
                </label>
                <div className="flex gap-2" role="radiogroup" aria-label="Select your role">
                  <button
                    type="button"
                    onClick={() => setRole('investor')}
                    className={`flex-1 px-4 py-3 rounded-lg font-medium transition ${
                      role === 'investor'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                    role="radio"
                    aria-checked={role === 'investor'}
                  >
                    Investor
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole('wholesaler')}
                    className={`flex-1 px-4 py-3 rounded-lg font-medium transition ${
                      role === 'wholesaler'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                    role="radio"
                    aria-checked={role === 'wholesaler'}
                  >
                    Wholesaler
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole('both')}
                    className={`flex-1 px-4 py-3 rounded-lg font-medium transition ${
                      role === 'both'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                    role="radio"
                    aria-checked={role === 'both'}
                  >
                    Both
                  </button>
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email Address *
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onBlur={() => setTouchedFields({...touchedFields, email: true})}
                  autoComplete="email"
                  className={`w-full px-4 py-3 pr-12 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    validationErrors.email ? 'border-red-500' : 
                    (touchedFields.email && isEmailValid()) ? 'border-green-500' : 'border-gray-300'
                  }`}
                  placeholder="your@email.com"
                  aria-invalid={!!validationErrors.email}
                  aria-describedby={validationErrors.email ? 'email-error' : undefined}
                />
                {touchedFields.email && isEmailValid() && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <svg className="w-6 h-6 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </div>
              {validationErrors.email && (
                <p id="email-error" className="mt-1 text-sm text-red-600">{validationErrors.email}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Full Name (Optional)
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="name"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="John Doe"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Country/Region
              </label>
              <select
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select country...</option>
                <option value="United States">🇺🇸 United States of America</option>
                <option disabled>───────────────────</option>
                <option value="United Arab Emirates">🇦🇪 United Arab Emirates</option>
                <option value="United Kingdom">🇬🇧 United Kingdom</option>
                <option value="Singapore">🇸🇬 Singapore</option>
                <option value="Canada">🇨🇦 Canada</option>
                <option value="Australia">🇦🇺 Australia</option>
                <option value="Germany">🇩🇪 Germany</option>
                <option value="France">🇫🇷 France</option>
                <option value="Switzerland">🇨🇭 Switzerland</option>
                <option value="Netherlands">🇳🇱 Netherlands</option>
                <option value="Brazil">🇧🇷 Brazil</option>
                <option value="Mexico">🇲🇽 Mexico</option>
                <option value="India">🇮🇳 India</option>
                <option value="China">🇨🇳 China</option>
                <option value="Japan">🇯🇵 Japan</option>
                <option value="South Korea">🇰🇷 South Korea</option>
                <option value="Nigeria">🇳🇬 Nigeria</option>
                <option value="South Africa">🇿🇦 South Africa</option>
                <option value="Argentina">🇦🇷 Argentina</option>
                <option value="Spain">🇪🇸 Spain</option>
                <option value="Italy">🇮🇹 Italy</option>
                <option value="Turkey">🇹🇷 Turkey</option>
                <option value="Other">🌍 Other</option>
              </select>
            </div>

            {(role === 'investor' || role === 'both') && (
              <>
                <div className="pt-4 border-t border-gray-200">
                  <h4 className="font-semibold text-gray-900 mb-3">Investor Information</h4>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Investment Range *
                  </label>
                  <select
                    value={investmentRange}
                    onChange={(e) => setInvestmentRange(e.target.value)}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      validationErrors.investmentRange ? 'border-red-500' : 'border-gray-300'
                    }`}
                    aria-invalid={!!validationErrors.investmentRange}
                    aria-describedby={validationErrors.investmentRange ? 'range-error' : undefined}
                  >
                    <option value="">Select range...</option>
                    <option value="500-5000">$500 - $5,000 (Retail)</option>
                    <option value="5000-25000">$5,000 - $25,000 (Accredited)</option>
                    <option value="25000-100000">$25,000 - $100,000 (Premium)</option>
                    <option value="100000-500000">$100,000 - $500,000 (Institutional)</option>
                    <option value="500000+">$500,000+ (Family Office / DAO)</option>
                  </select>
                  {validationErrors.investmentRange && (
                    <p id="range-error" className="mt-1 text-sm text-red-600">{validationErrors.investmentRange}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Investor Type *
                  </label>
                  <select
                    value={investorType}
                    onChange={(e) => setInvestorType(e.target.value)}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      validationErrors.investorType ? 'border-red-500' : 'border-gray-300'
                    }`}
                    aria-invalid={!!validationErrors.investorType}
                    aria-describedby={validationErrors.investorType ? 'type-error' : undefined}
                  >
                    <option value="">Select type...</option>
                    <option value="individual">Individual Investor</option>
                    <option value="accredited">Accredited Investor (U.S.)</option>
                    <option value="international">International Investor</option>
                    <option value="dao">DAO / Family Office</option>
                    <option value="fund">Investment Fund</option>
                  </select>
                  {validationErrors.investorType && (
                    <p id="type-error" className="mt-1 text-sm text-red-600">{validationErrors.investorType}</p>
                  )}
                </div>
              </>
            )}

            {(role === 'wholesaler' || role === 'both') && (
              <>
                <div className="pt-4 border-t border-gray-200">
                  <h4 className="font-semibold text-gray-900 mb-3">Wholesaler Information</h4>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Company Name *
                  </label>
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      validationErrors.companyName ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="ABC Properties LLC"
                    aria-invalid={!!validationErrors.companyName}
                    aria-describedby={validationErrors.companyName ? 'company-error' : undefined}
                  />
                  {validationErrors.companyName && (
                    <p id="company-error" className="mt-1 text-sm text-red-600">{validationErrors.companyName}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Markets Served
                  </label>
                  <input
                    type="text"
                    value={marketsServed}
                    onChange={(e) => setMarketsServed(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Atlanta, Dallas, Phoenix"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Average Monthly Deals *
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={avgMonthlyDeals}
                    onChange={(e) => setAvgMonthlyDeals(e.target.value)}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      validationErrors.avgMonthlyDeals ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="5"
                    aria-invalid={!!validationErrors.avgMonthlyDeals}
                    aria-describedby={validationErrors.avgMonthlyDeals ? 'deals-error' : undefined}
                  />
                  {validationErrors.avgMonthlyDeals && (
                    <p id="deals-error" className="mt-1 text-sm text-red-600">{validationErrors.avgMonthlyDeals}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Assignment Fee %
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      value={assignmentFeePercent}
                      onChange={(e) => setAssignmentFeePercent(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="5.0"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Entity Type
                    </label>
                    <select
                      value={entityType}
                      onChange={(e) => setEntityType(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select...</option>
                      <option value="llc">LLC</option>
                      <option value="s_corp">S-Corp</option>
                      <option value="sole_prop">Sole Proprietor</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Has EIN?
                    </label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setHasEin(true)}
                        className={`flex-1 px-4 py-2 rounded-lg transition ${
                          hasEin === true
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        Yes
                      </button>
                      <button
                        type="button"
                        onClick={() => setHasEin(false)}
                        className={`flex-1 px-4 py-2 rounded-lg transition ${
                          hasEin === false
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        No
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      E&O Insurance?
                    </label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setHasEoInsurance(true)}
                        className={`flex-1 px-4 py-2 rounded-lg transition ${
                          hasEoInsurance === true
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        Yes
                      </button>
                      <button
                        type="button"
                        onClick={() => setHasEoInsurance(false)}
                        className={`flex-1 px-4 py-2 rounded-lg transition ${
                          hasEoInsurance === false
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        No
                      </button>
                    </div>
                  </div>
                </div>
              </>
            )}

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
            
            {/* NEW: Trust Badges */}
            <div className="flex flex-wrap justify-center gap-4 text-xs text-gray-600 border-t pt-4">
              <div className="flex items-center">
                <svg className="w-4 h-4 mr-1 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>🔒 Your data is encrypted</span>
              </div>
              <div className="flex items-center">
                <svg className="w-4 h-4 mr-1 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>No credit card required</span>
              </div>
              <div className="flex items-center">
                <svg className="w-4 h-4 mr-1 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Unsubscribe anytime</span>
              </div>
            </div>
          </form>
          
          {/* NEW: What Happens Next */}
          <div className="mt-8 bg-blue-50 rounded-xl p-6 border-2 border-blue-100">
            <h4 className="text-lg font-bold text-gray-900 mb-4 text-center">What Happens Next?</h4>
            <div className="space-y-3">
              <div className="flex items-start">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold mr-3">1</div>
                <div>
                  <p className="font-semibold text-gray-900">Confirm your email</p>
                  <p className="text-sm text-gray-600">Check your inbox (and spam folder) for confirmation link</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold mr-3">2</div>
                <div>
                  <p className="font-semibold text-gray-900">Get founding member welcome guide</p>
                  <p className="text-sm text-gray-600">Exclusive insights on the $52B GENIUS Act opportunity</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold mr-3">3</div>
                <div>
                  <p className="font-semibold text-gray-900">Early access when we launch (Q1 2025)</p>
                  <p className="text-sm text-gray-600">30-day head start + lifetime 50% fee discount</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* NEW: FAQ Section */}
        <div className="max-w-3xl mx-auto mt-20 mb-12">
          <h3 className="text-3xl font-bold text-white text-center mb-8">Frequently Asked Questions</h3>
          <div className="space-y-4">
            <details className="bg-white/10 backdrop-blur-sm rounded-xl p-6 cursor-pointer group">
              <summary className="font-semibold text-white text-lg list-none flex justify-between items-center">
                Is this really free to join?
                <svg className="w-5 h-5 transform group-open:rotate-180 transition-transform" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </summary>
              <p className="mt-4 text-blue-100">Yes! Joining the waitlist is completely free with no payment or credit card required. Founding members get 50% off platform fees for life (1% vs 2% standard).</p>
            </details>
            
            <details className="bg-white/10 backdrop-blur-sm rounded-xl p-6 cursor-pointer group">
              <summary className="font-semibold text-white text-lg list-none flex justify-between items-center">
                When will AXIOM launch?
                <svg className="w-5 h-5 transform group-open:rotate-180 transition-transform" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </summary>
              <p className="mt-4 text-blue-100">We're targeting Q1 2025 for full platform launch. Founding members get 30-day early access to list properties and invest before the general public.</p>
            </details>
            
            <details className="bg-white/10 backdrop-blur-sm rounded-xl p-6 cursor-pointer group">
              <summary className="font-semibold text-white text-lg list-none flex justify-between items-center">
                Can I invest or list properties from outside the US?
                <svg className="w-5 h-5 transform group-open:rotate-180 transition-transform" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </summary>
              <p className="mt-4 text-blue-100"><strong>Investors:</strong> Yes! The GENIUS Act specifically enables international crypto investors (DAOs, family offices, individuals) to invest in U.S. real estate. <strong>Wholesalers:</strong> Properties must be located in the United States, but you can operate from anywhere.</p>
            </details>
            
            <details className="bg-white/10 backdrop-blur-sm rounded-xl p-6 cursor-pointer group">
              <summary className="font-semibold text-white text-lg list-none flex justify-between items-center">
                What makes AXIOM different from other platforms?
                <svg className="w-5 h-5 transform group-open:rotate-180 transition-transform" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </summary>
              <p className="mt-4 text-blue-100">We're the ONLY platform connecting wholesalers to $52B in international crypto capital + verified U.S. investors. Fractional ownership means 10-50 buyers per property instead of finding 1 cash buyer. Deals close in 48-72 hours with stablecoin escrow.</p>
            </details>
          </div>
        </div>

        <div className="max-w-6xl mx-auto mt-20 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 text-white">
            <div className="text-4xl mb-4">🌎</div>
            <h3 className="text-xl font-bold mb-2">Access $52B Global Investor Pool</h3>
            <p className="text-blue-100">
              <strong>Why list on AXIOM?</strong> We're the ONLY platform connecting wholesalers to international 
              crypto investors + verified U.S. buyers. DAOs, family offices, and accredited investors 
              actively seeking wholesale deals with stablecoin liquidity.
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 text-white">
            <div className="text-4xl mb-4">⚡</div>
            <h3 className="text-xl font-bold mb-2">Faster Closings, Higher Margins</h3>
            <p className="text-blue-100">
              Fractional ownership = <strong>10-50 buyers per property</strong> instead of finding 1 whale. 
              Wholesale deals close in 48-72 hours with stablecoin escrow. Eliminate wire delays, 
              bank holds, and financing contingencies.
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 text-white">
            <div className="text-4xl mb-4">💎</div>
            <h3 className="text-xl font-bold mb-2">Invest Your Own Capital Too</h3>
            <p className="text-blue-100">
              <strong>Wholesalers can invest</strong> in fractional shares of your own deals OR other properties. 
              Earn 6-12% annual yields + appreciation on capital you keep deployed. Build a rental 
              portfolio while wholesaling actively.
            </p>
          </div>
        </div>
      </div>
      
      {/* NEW: Exit Intent Popup */}
      {showExitIntent && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl transform animate-slideUp">
            <div className="text-center">
              <div className="text-6xl mb-4">⏰</div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                Wait! Don't Miss Out
              </h3>
              <p className="text-gray-600 mb-6">
                Only <strong className="text-yellow-600">{stats.availableFoundingSpots} founding member spots</strong> left! 
                Get <strong>50% off platform fees for life</strong> before spots run out.
              </p>
              <div className="space-y-3">
                <button
                  onClick={() => setShowExitIntent(false)}
                  className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
                >
                  Yes, Reserve My Spot Now
                </button>
                <button
                  onClick={() => setShowExitIntent(false)}
                  className="w-full bg-gray-100 text-gray-700 px-6 py-3 rounded-lg font-medium hover:bg-gray-200 transition text-sm"
                >
                  No thanks, I'll pay full price later
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WaitlistPage;
