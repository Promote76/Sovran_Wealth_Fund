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

  const FEATURE_FLAG_WAITLIST_LANES = process.env.REACT_APP_WAITLIST_LANES_ENABLED === 'true';

  useEffect(() => {
    fetchStats();
    const params = new URLSearchParams(window.location.search);
    const refParam = params.get('ref');
    if (refParam) {
      setReferralLink(`${window.location.origin}/waitlist?ref=${refParam}`);
    }
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
          <div className="inline-block bg-yellow-400 text-gray-900 px-4 py-2 rounded-full text-sm font-semibold mb-6">
            🚀 LAUNCHING SOON - Limited Founding Member Spots
          </div>
          
          <h2 className="text-4xl md:text-6xl font-bold text-white mb-6">
            The First GENIUS Act<br />
            <span className="text-blue-300">Crypto Real Estate Platform</span>
          </h2>
          
          <p className="text-xl md:text-2xl text-blue-100 mb-4">
            {FEATURE_FLAG_WAITLIST_LANES 
              ? 'For Investors & Wholesalers - Join the revolution in crypto real estate'
              : 'International crypto investors can now legally invest in U.S. real estate'}
          </p>
          
          <p className="text-lg text-blue-200 mb-8 max-w-3xl mx-auto">
            The <strong>GENIUS Act</strong> unlocks <strong className="text-yellow-300">$52 billion</strong> in 
            global crypto liquidity for U.S. real estate. AXIOM is the <strong>first-mover platform</strong> to 
            capture this massive opportunity.
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
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-white">
              <div>
                <div className="text-3xl md:text-4xl font-bold text-blue-300">{stats.totalSignups}</div>
                <div className="text-sm text-blue-100">Total Signups</div>
              </div>
              {FEATURE_FLAG_WAITLIST_LANES && (
                <>
                  <div>
                    <div className="text-3xl md:text-4xl font-bold text-green-300">{stats.investors}</div>
                    <div className="text-sm text-blue-100">Investors</div>
                  </div>
                  <div>
                    <div className="text-3xl md:text-4xl font-bold text-purple-300">{stats.wholesalers}</div>
                    <div className="text-sm text-blue-100">Wholesalers</div>
                  </div>
                </>
              )}
              <div>
                <div className="text-3xl md:text-4xl font-bold text-yellow-300">{stats.availableFoundingSpots}</div>
                <div className="text-sm text-blue-100">Founding Spots Left</div>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-md mx-auto bg-white rounded-2xl shadow-2xl p-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-2 text-center">
            Join the Waitlist
          </h3>
          <p className="text-gray-600 text-center mb-6">
            {FEATURE_FLAG_WAITLIST_LANES 
              ? 'First 500 qualified members get exclusive founding benefits'
              : 'First 100 investors get 50% off platform fees for life'}
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
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  validationErrors.email ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="your@email.com"
                aria-invalid={!!validationErrors.email}
                aria-describedby={validationErrors.email ? 'email-error' : undefined}
              />
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
          </form>
        </div>

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
      </div>
    </div>
  );
};

export default WaitlistPage;
