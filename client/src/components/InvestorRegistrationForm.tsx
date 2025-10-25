import React, { useState, useEffect, useRef } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';

// Load Stripe promise
let stripePromise: Promise<any> | null = null;

const getStripePromise = () => {
  if (!stripePromise) {
    stripePromise = fetch('/api/stripe/public-key')
      .then(res => res.json())
      .then(data => loadStripe(data.publicKey))
      .catch(err => {
        console.error('Failed to load Stripe:', err);
        return null;
      });
  }
  return stripePromise;
};

interface InvestorRegistrationData {
  // Personal Information
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  country: string;
  isAccreditedInvestor: boolean;
  
  // Financial Information
  annualIncome: number | '';
  netWorth: number | '';
  liquidAssets: number | '';
  investmentExperience: 'none' | 'beginner' | 'intermediate' | 'advanced';
  investmentKnowledge: string[];
  
  // Risk Assessment
  riskTolerance: 'conservative' | 'moderate' | 'aggressive';
  investmentHorizon: '1-3' | '3-5' | '5-10' | '10+';
  liquidityNeeds: 'high' | 'medium' | 'low';
  portfolioDiversification: number | '';
  
  // Investment Preferences
  preferredPropertyTypes: string[];
  preferredLocations: string[];
  targetAnnualReturn: number | '';
  minimumInvestment: number | '';
  maxPropertyAllocation: number | '';
  reinvestDividends: boolean;
  
  // Education Progress
  completedModules: string[];
  understandsRisks: boolean;
  acceptsTerms: boolean;
}

const initialFormData: InvestorRegistrationData = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  dateOfBirth: '',
  country: 'United States',
  isAccreditedInvestor: false,
  
  annualIncome: '',
  netWorth: '',
  liquidAssets: '',
  investmentExperience: 'beginner',
  investmentKnowledge: [],
  
  riskTolerance: 'moderate',
  investmentHorizon: '5-10',
  liquidityNeeds: 'medium',
  portfolioDiversification: '',
  
  preferredPropertyTypes: [],
  preferredLocations: [],
  targetAnnualReturn: '',
  minimumInvestment: 30,
  maxPropertyAllocation: '',
  reinvestDividends: true,
  
  completedModules: [],
  understandsRisks: false,
  acceptsTerms: false,
};

interface InvestorRegistrationFormProps {
  onClose: () => void;
  walletAddress?: string;
}

// Payment Form Component
interface PaymentStepProps {
  investmentAmount: number;
  selectedProperty?: any;
  onPaymentSuccess: (paymentIntentId: string) => void;
  onError: (error: string) => void;
}

const PaymentStep: React.FC<PaymentStepProps> = ({ investmentAmount, selectedProperty, onPaymentSuccess, onError }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [clientSecret, setClientSecret] = useState('');
  const hasCreatedIntent = useRef(false);

  useEffect(() => {
    if (hasCreatedIntent.current) return;
    hasCreatedIntent.current = true;

    const createPaymentIntent = async () => {
      try {
        const response = await fetch('/api/investor/stripe-payment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            amount: investmentAmount,
            propertyId: selectedProperty?.id 
          }),
        });

        const data = await response.json();
        if (data.clientSecret) {
          setClientSecret(data.clientSecret);
        } else {
          onError('Failed to initialize payment');
        }
      } catch (err: any) {
        onError(err.message || 'Payment initialization failed');
      }
    };

    createPaymentIntent();
  }, [investmentAmount, selectedProperty, onError]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      onError('Stripe not loaded');
      return;
    }

    setIsProcessing(true);

    try {
      const cardElement = elements.getElement(CardElement);
      if (!cardElement) {
        throw new Error('Card element not found');
      }

      const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement,
        },
      });

      if (error) {
        onError(error.message || 'Payment failed');
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        onPaymentSuccess(paymentIntent.id);
      }
    } catch (err: any) {
      onError(err.message || 'Payment processing failed');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-semibold text-gray-900 mb-2">Investment Summary</h4>
        <div className="space-y-1 text-sm">
          {selectedProperty && (
            <p className="text-gray-700">
              <span className="font-medium">Property:</span> {selectedProperty.propertyAddress}
            </p>
          )}
          <p className="text-gray-700">
            <span className="font-medium">Investment Amount:</span> ${investmentAmount.toFixed(2)}
          </p>
        </div>
      </div>

      <div className="border rounded-lg p-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Credit or Debit Card
        </label>
        <CardElement
          options={{
            style: {
              base: {
                fontSize: '16px',
                color: '#32325d',
                '::placeholder': { color: '#aab7c4' },
              },
              invalid: { color: '#fa755a' },
            },
          }}
        />
      </div>

      <Button
        type="submit"
        disabled={!stripe || isProcessing}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3"
      >
        {isProcessing ? '⏳ Processing Payment...' : `💳 Pay $${investmentAmount.toFixed(2)}`}
      </Button>

      <p className="text-xs text-gray-500 text-center">
        🔒 Secure payment powered by Stripe. Your payment information is encrypted.
      </p>
    </form>
  );
};

export default function InvestorRegistrationForm({ onClose, walletAddress }: InvestorRegistrationFormProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<InvestorRegistrationData>(initialFormData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'stripe' | 'bnb' | null>(null);

  const handleChange = (field: keyof InvestorRegistrationData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleMultiSelect = (field: keyof InvestorRegistrationData, value: string) => {
    const currentValues = formData[field] as string[];
    const newValues = currentValues.includes(value)
      ? currentValues.filter(v => v !== value)
      : [...currentValues, value];
    handleChange(field, newValues);
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1: // Welcome - no validation needed
        return true;
      case 2: // Personal Information
        return !!(formData.firstName && formData.lastName && formData.email && formData.dateOfBirth);
      case 3: // Financial Information
        return !!(formData.annualIncome && formData.netWorth && formData.liquidAssets);
      case 4: // Risk Assessment
        return !!(formData.riskTolerance && formData.investmentHorizon);
      case 5: // Investment Preferences
        return formData.preferredPropertyTypes.length > 0;
      case 6: // Payment
        return formData.understandsRisks && formData.acceptsTerms;
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => prev + 1);
      setError('');
    } else {
      setError('Please complete all required fields');
    }
  };

  const handleBack = () => {
    setCurrentStep(prev => prev - 1);
    setError('');
  };

  const handleBNBPayment = async () => {
    setLoading(true);
    setError('');

    try {
      if (!walletAddress) {
        setError('Please connect your wallet');
        return;
      }

      const response = await fetch('/api/investor/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          walletAddress,
          paymentMethod: 'bnb',
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(true);
        setTimeout(() => onClose(), 3000);
      } else {
        setError(data.error || 'Registration failed');
      }
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleStripePaymentSuccess = async (paymentIntentId: string) => {
    try {
      const response = await fetch('/api/investor/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          walletAddress,
          paymentMethod: 'stripe',
          paymentIntentId,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(true);
        setTimeout(() => onClose(), 3000);
      } else {
        setError(data.error || 'Registration failed');
      }
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    }
  };

  if (success) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardContent className="p-8 text-center">
          <div className="text-6xl mb-4">🎉</div>
          <h3 className="text-2xl font-bold text-green-600 mb-2">Welcome to Real Estate Investor!</h3>
          <p className="text-gray-600 mb-4">
            Your investor profile has been created successfully.
          </p>
          <p className="text-sm text-gray-500">
            You can now browse properties and start investing in fractional real estate.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      {/* Progress Indicator */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          {[1, 2, 3, 4, 5, 6].map((step) => (
            <React.Fragment key={step}>
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-colors ${
                  step === currentStep
                    ? 'bg-blue-600 text-white'
                    : step < currentStep
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-200 text-gray-500'
                }`}
              >
                {step < currentStep ? '✓' : step}
              </div>
              {step < 6 && (
                <div
                  className={`flex-1 h-1 mx-2 ${
                    step < currentStep ? 'bg-green-500' : 'bg-gray-300'
                  }`}
                />
              )}
            </React.Fragment>
          ))}
        </div>
        <div className="grid grid-cols-6 gap-2 text-xs text-center text-gray-600">
          <div>Welcome</div>
          <div>Personal</div>
          <div>Financial</div>
          <div>Risk</div>
          <div>Preferences</div>
          <div>Payment</div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">
            {currentStep === 1 && 'Welcome to Real Estate Investor'}
            {currentStep === 2 && 'Personal Information'}
            {currentStep === 3 && 'Financial Profile'}
            {currentStep === 4 && 'Risk Assessment'}
            {currentStep === 5 && 'Investment Preferences'}
            {currentStep === 6 && 'Complete Registration'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Error Message */}
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              {error}
            </div>
          )}

          {/* Step 1: Welcome & Education */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-blue-50 to-green-50 p-6 rounded-lg">
                <h3 className="text-xl font-bold text-gray-900 mb-3">🏢 Invest in Fractional Real Estate</h3>
                <p className="text-gray-700 mb-4">
                  Start building your real estate portfolio with as little as <strong>$30</strong>. 
                  Own fractional shares in professionally managed properties and earn passive income.
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-white border-2 border-blue-200 rounded-lg p-4">
                  <div className="text-3xl mb-2">💰</div>
                  <h4 className="font-semibold text-gray-900 mb-2">Low Minimum Investment</h4>
                  <p className="text-sm text-gray-600">
                    Start with just $30 (0.05 BNB) per share. No need for large down payments or mortgages.
                  </p>
                </div>
                <div className="bg-white border-2 border-green-200 rounded-lg p-4">
                  <div className="text-3xl mb-2">📊</div>
                  <h4 className="font-semibold text-gray-900 mb-2">Portfolio Diversification</h4>
                  <p className="text-sm text-gray-600">
                    Spread your investment across multiple properties and locations to reduce risk.
                  </p>
                </div>
                <div className="bg-white border-2 border-purple-200 rounded-lg p-4">
                  <div className="text-3xl mb-2">🏠</div>
                  <h4 className="font-semibold text-gray-900 mb-2">Passive Rental Income</h4>
                  <p className="text-sm text-gray-600">
                    Receive monthly rental distributions proportional to your share ownership.
                  </p>
                </div>
                <div className="bg-white border-2 border-orange-200 rounded-lg p-4">
                  <div className="text-3xl mb-2">📈</div>
                  <h4 className="font-semibold text-gray-900 mb-2">Property Appreciation</h4>
                  <p className="text-sm text-gray-600">
                    Benefit from long-term property value increases as the real estate market grows.
                  </p>
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-2">⚠️ Important Disclosure</h4>
                <p className="text-sm text-gray-700">
                  Real estate investments carry risks including property value fluctuations, market conditions, 
                  tenant defaults, and liquidity constraints. Past performance does not guarantee future results. 
                  This is not financial advice - please consult with a qualified financial advisor.
                </p>
              </div>
            </div>
          )}

          {/* Step 2: Personal Information */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-900">
                  👤 <strong>About You:</strong> We need basic information to create your investor profile and comply with regulatory requirements.
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">First Name *</label>
                  <input
                    type="text"
                    className="w-full border rounded px-3 py-2"
                    value={formData.firstName}
                    onChange={e => handleChange('firstName', e.target.value)}
                    placeholder="John"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Last Name *</label>
                  <input
                    type="text"
                    className="w-full border rounded px-3 py-2"
                    value={formData.lastName}
                    onChange={e => handleChange('lastName', e.target.value)}
                    placeholder="Doe"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Email *</label>
                  <input
                    type="email"
                    className="w-full border rounded px-3 py-2"
                    value={formData.email}
                    onChange={e => handleChange('email', e.target.value)}
                    placeholder="john.doe@example.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Phone</label>
                  <input
                    type="tel"
                    className="w-full border rounded px-3 py-2"
                    value={formData.phone}
                    onChange={e => handleChange('phone', e.target.value)}
                    placeholder="(555) 123-4567"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Date of Birth *</label>
                  <input
                    type="date"
                    className="w-full border rounded px-3 py-2"
                    value={formData.dateOfBirth}
                    onChange={e => handleChange('dateOfBirth', e.target.value)}
                  />
                  <p className="text-xs text-gray-500 mt-1">Must be 18+ to invest</p>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Country</label>
                  <select
                    className="w-full border rounded px-3 py-2"
                    value={formData.country}
                    onChange={e => handleChange('country', e.target.value)}
                  >
                    <option value="United States">United States</option>
                    <option value="Canada">Canada</option>
                    <option value="United Kingdom">United Kingdom</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <label className="flex items-start space-x-3">
                  <input
                    type="checkbox"
                    className="mt-1"
                    checked={formData.isAccreditedInvestor}
                    onChange={e => handleChange('isAccreditedInvestor', e.target.checked)}
                  />
                  <div>
                    <p className="font-medium text-gray-900">I am an accredited investor</p>
                    <p className="text-xs text-gray-600 mt-1">
                      Accredited investors have annual income of $200k+ or net worth of $1M+ (excluding primary residence)
                    </p>
                  </div>
                </label>
              </div>
            </div>
          )}

          {/* Step 3: Financial Information */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-sm text-green-900">
                  💵 <strong>Financial Profile:</strong> This helps us determine suitable investment options and comply with investor protection regulations.
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Annual Income *</label>
                  <select
                    className="w-full border rounded px-3 py-2"
                    value={formData.annualIncome}
                    onChange={e => handleChange('annualIncome', parseInt(e.target.value))}
                  >
                    <option value="">Select range</option>
                    <option value={25000}>$0 - $50,000</option>
                    <option value={75000}>$50,000 - $100,000</option>
                    <option value={150000}>$100,000 - $200,000</option>
                    <option value={250000}>$200,000 - $300,000</option>
                    <option value={400000}>$300,000+</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Net Worth *</label>
                  <select
                    className="w-full border rounded px-3 py-2"
                    value={formData.netWorth}
                    onChange={e => handleChange('netWorth', parseInt(e.target.value))}
                  >
                    <option value="">Select range</option>
                    <option value={50000}>$0 - $100,000</option>
                    <option value={250000}>$100,000 - $500,000</option>
                    <option value={750000}>$500,000 - $1,000,000</option>
                    <option value={1500000}>$1,000,000 - $2,000,000</option>
                    <option value={3000000}>$2,000,000+</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Liquid Assets *</label>
                <select
                  className="w-full border rounded px-3 py-2"
                  value={formData.liquidAssets}
                  onChange={e => handleChange('liquidAssets', parseInt(e.target.value))}
                >
                  <option value="">Select range</option>
                  <option value={5000}>$0 - $10,000</option>
                  <option value={25000}>$10,000 - $50,000</option>
                  <option value={100000}>$50,000 - $150,000</option>
                  <option value={250000}>$150,000 - $350,000</option>
                  <option value={500000}>$350,000+</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Cash, savings, stocks, and other easily convertible assets
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Investment Experience</label>
                <select
                  className="w-full border rounded px-3 py-2"
                  value={formData.investmentExperience}
                  onChange={e => handleChange('investmentExperience', e.target.value)}
                >
                  <option value="none">None - First time investor</option>
                  <option value="beginner">Beginner - Less than 2 years</option>
                  <option value="intermediate">Intermediate - 2-5 years</option>
                  <option value="advanced">Advanced - 5+ years</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Investment Knowledge (select all that apply)</label>
                <div className="grid md:grid-cols-2 gap-2">
                  {['Stocks', 'Bonds', 'Real Estate', 'Cryptocurrency', 'REITs', 'Mutual Funds'].map(type => (
                    <label key={type} className="flex items-center space-x-2 p-2 border rounded hover:bg-gray-50">
                      <input
                        type="checkbox"
                        checked={formData.investmentKnowledge.includes(type)}
                        onChange={() => handleMultiSelect('investmentKnowledge', type)}
                      />
                      <span className="text-sm">{type}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Risk Assessment */}
          {currentStep === 4 && (
            <div className="space-y-4">
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <p className="text-sm text-purple-900">
                  ⚖️ <strong>Risk Profile:</strong> Understanding your risk tolerance helps us recommend suitable investment opportunities.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Risk Tolerance</label>
                <div className="space-y-2">
                  {[
                    { value: 'conservative', label: 'Conservative', desc: 'Prefer stable, predictable returns with minimal risk' },
                    { value: 'moderate', label: 'Moderate', desc: 'Comfortable with some fluctuations for balanced growth' },
                    { value: 'aggressive', label: 'Aggressive', desc: 'Willing to accept higher volatility for maximum returns' },
                  ].map(option => (
                    <label
                      key={option.value}
                      className={`flex items-start p-3 border-2 rounded-lg cursor-pointer transition ${
                        formData.riskTolerance === option.value
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-blue-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="riskTolerance"
                        value={option.value}
                        checked={formData.riskTolerance === option.value}
                        onChange={e => handleChange('riskTolerance', e.target.value)}
                        className="mt-1 mr-3"
                      />
                      <div>
                        <p className="font-medium text-gray-900">{option.label}</p>
                        <p className="text-xs text-gray-600">{option.desc}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Investment Horizon</label>
                <select
                  className="w-full border rounded px-3 py-2"
                  value={formData.investmentHorizon}
                  onChange={e => handleChange('investmentHorizon', e.target.value)}
                >
                  <option value="1-3">1-3 years - Short term</option>
                  <option value="3-5">3-5 years - Medium term</option>
                  <option value="5-10">5-10 years - Long term</option>
                  <option value="10+">10+ years - Very long term</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  How long do you plan to hold your investments?
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Liquidity Needs</label>
                <select
                  className="w-full border rounded px-3 py-2"
                  value={formData.liquidityNeeds}
                  onChange={e => handleChange('liquidityNeeds', e.target.value)}
                >
                  <option value="high">High - Need quick access to funds</option>
                  <option value="medium">Medium - Occasional liquidity needed</option>
                  <option value="low">Low - Can lock funds long-term</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  What % of your portfolio do you want in real estate?
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  className="w-full border rounded px-3 py-2"
                  value={formData.portfolioDiversification}
                  onChange={e => handleChange('portfolioDiversification', parseInt(e.target.value) || '')}
                  placeholder="e.g., 20"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Financial advisors typically recommend 20-40% real estate allocation
                </p>
              </div>
            </div>
          )}

          {/* Step 5: Investment Preferences */}
          {currentStep === 5 && (
            <div className="space-y-4">
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <p className="text-sm text-orange-900">
                  🎯 <strong>Investment Preferences:</strong> Tell us what types of properties and returns you're looking for.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Preferred Property Types *</label>
                <div className="grid md:grid-cols-2 gap-2">
                  {['Single Family Home', 'Multi-Family', 'Apartment Complex', 'Commercial', 'Mixed-Use', 'Industrial'].map(type => (
                    <label key={type} className="flex items-center space-x-2 p-2 border rounded hover:bg-gray-50">
                      <input
                        type="checkbox"
                        checked={formData.preferredPropertyTypes.includes(type)}
                        onChange={() => handleMultiSelect('preferredPropertyTypes', type)}
                      />
                      <span className="text-sm">{type}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Preferred Locations</label>
                <div className="grid md:grid-cols-3 gap-2">
                  {['Northeast', 'Southeast', 'Midwest', 'Southwest', 'West Coast', 'International'].map(location => (
                    <label key={location} className="flex items-center space-x-2 p-2 border rounded hover:bg-gray-50">
                      <input
                        type="checkbox"
                        checked={formData.preferredLocations.includes(location)}
                        onChange={() => handleMultiSelect('preferredLocations', location)}
                      />
                      <span className="text-sm">{location}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Target Annual Return (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  className="w-full border rounded px-3 py-2"
                  value={formData.targetAnnualReturn}
                  onChange={e => handleChange('targetAnnualReturn', parseFloat(e.target.value) || '')}
                  placeholder="e.g., 8.5"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Typical real estate returns: 6-12% annually (rental income + appreciation)
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Minimum Investment per Property</label>
                  <input
                    type="number"
                    min="30"
                    className="w-full border rounded px-3 py-2"
                    value={formData.minimumInvestment}
                    onChange={e => handleChange('minimumInvestment', parseFloat(e.target.value) || '')}
                    placeholder="30"
                  />
                  <p className="text-xs text-gray-500 mt-1">Minimum: $30</p>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Max % per Property</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    className="w-full border rounded px-3 py-2"
                    value={formData.maxPropertyAllocation}
                    onChange={e => handleChange('maxPropertyAllocation', parseFloat(e.target.value) || '')}
                    placeholder="e.g., 10"
                  />
                  <p className="text-xs text-gray-500 mt-1">Diversification limit</p>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <label className="flex items-start space-x-3">
                  <input
                    type="checkbox"
                    className="mt-1"
                    checked={formData.reinvestDividends}
                    onChange={e => handleChange('reinvestDividends', e.target.checked)}
                  />
                  <div>
                    <p className="font-medium text-gray-900">Automatically reinvest rental dividends</p>
                    <p className="text-xs text-gray-600 mt-1">
                      Compound your returns by reinvesting monthly rental income into more shares
                    </p>
                  </div>
                </label>
              </div>
            </div>
          )}

          {/* Step 6: Payment & Confirmation */}
          {currentStep === 6 && (
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-sm text-green-900">
                  ✅ <strong>Complete Registration:</strong> Choose your payment method and confirm your understanding of the risks.
                </p>
              </div>

              <div className="bg-white border-2 border-gray-200 rounded-lg p-6">
                <h4 className="font-semibold text-gray-900 mb-4">Registration Summary</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Name:</span>
                    <span className="font-medium">{formData.firstName} {formData.lastName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Email:</span>
                    <span className="font-medium">{formData.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Risk Tolerance:</span>
                    <span className="font-medium capitalize">{formData.riskTolerance}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Investment Horizon:</span>
                    <span className="font-medium">{formData.investmentHorizon} years</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Preferred Properties:</span>
                    <span className="font-medium">{formData.preferredPropertyTypes.join(', ')}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <label className="flex items-start space-x-3 p-3 border rounded-lg">
                  <input
                    type="checkbox"
                    className="mt-1"
                    checked={formData.understandsRisks}
                    onChange={e => handleChange('understandsRisks', e.target.checked)}
                  />
                  <p className="text-sm text-gray-700">
                    I understand that real estate investments involve risks, including potential loss of principal, 
                    and that returns are not guaranteed.
                  </p>
                </label>

                <label className="flex items-start space-x-3 p-3 border rounded-lg">
                  <input
                    type="checkbox"
                    className="mt-1"
                    checked={formData.acceptsTerms}
                    onChange={e => handleChange('acceptsTerms', e.target.checked)}
                  />
                  <p className="text-sm text-gray-700">
                    I agree to the Terms of Service and Privacy Policy, and confirm that the information provided is accurate.
                  </p>
                </label>
              </div>

              {formData.understandsRisks && formData.acceptsTerms && (
                <div className="space-y-4 pt-4 border-t">
                  <h4 className="font-semibold text-gray-900">Choose Payment Method</h4>
                  
                  {!paymentMethod && (
                    <div className="grid md:grid-cols-2 gap-4">
                      <button
                        onClick={() => setPaymentMethod('stripe')}
                        className="p-6 border-2 border-blue-400 rounded-lg hover:bg-blue-50 transition text-left"
                      >
                        <div className="text-3xl mb-2">💳</div>
                        <h5 className="font-semibold text-gray-900 mb-1">Credit/Debit Card</h5>
                        <p className="text-sm text-gray-600">Pay with Visa, Mastercard, or American Express</p>
                        <p className="text-xs text-green-600 mt-2 font-medium">✓ Instant processing</p>
                      </button>

                      <button
                        onClick={() => setPaymentMethod('bnb')}
                        className="p-6 border-2 border-green-400 rounded-lg hover:bg-green-50 transition text-left"
                      >
                        <div className="text-3xl mb-2">🪙</div>
                        <h5 className="font-semibold text-gray-900 mb-1">BNB Cryptocurrency</h5>
                        <p className="text-sm text-gray-600">Pay with Binance Coin from your wallet</p>
                        <p className="text-xs text-green-600 mt-2 font-medium">✓ Lower fees</p>
                      </button>
                    </div>
                  )}

                  {paymentMethod === 'stripe' && (
                    <div>
                      <Button
                        onClick={() => setPaymentMethod(null)}
                        variant="outline"
                        className="mb-4"
                      >
                        ← Change Payment Method
                      </Button>
                      <Elements stripe={getStripePromise()}>
                        <PaymentStep
                          investmentAmount={0}
                          onPaymentSuccess={handleStripePaymentSuccess}
                          onError={setError}
                        />
                      </Elements>
                    </div>
                  )}

                  {paymentMethod === 'bnb' && (
                    <div className="space-y-4">
                      <Button
                        onClick={() => setPaymentMethod(null)}
                        variant="outline"
                      >
                        ← Change Payment Method
                      </Button>
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <p className="text-sm text-yellow-900">
                          <strong>Note:</strong> BNB payment is free for registration. You'll be able to invest 
                          in properties using BNB after completing this step.
                        </p>
                      </div>
                      <Button
                        onClick={handleBNBPayment}
                        disabled={loading}
                        className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3"
                      >
                        {loading ? '⏳ Processing...' : '✓ Complete Registration (Free)'}
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8 pt-6 border-t">
            {currentStep > 1 && (
              <Button onClick={handleBack} variant="outline">
                ← Back
              </Button>
            )}
            {currentStep === 1 && (
              <Button onClick={onClose} variant="outline">
                Cancel
              </Button>
            )}
            <div className="flex-1" />
            {currentStep < 6 && (
              <Button onClick={handleNext} className="bg-blue-600 hover:bg-blue-700">
                Next →
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
