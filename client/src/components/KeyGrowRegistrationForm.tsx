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

interface KeyGrowRegistrationData {
  // Personal Information
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  isFirstTimeBuyer: boolean;
  hasStableEmployment: boolean;
  employmentYears: number | '';
  
  // Financial Information
  creditScore: number | '';
  monthlyIncome: number | '';
  monthlyDebt: number | '';
  monthlyExpenses: number | '';
  emergencyFund: number | '';
  currentSavings: number | '';
  monthlySavings: number | '';
  
  // Property Preferences
  preferredLocation: string;
  targetZipCode: string;
  priceRangeMin: number | '';
  priceRangeMax: number | '';
  bedrooms: number | '';
  bathrooms: number | '';
  preferredPropertyType: 'house' | 'condo' | 'townhouse' | 'duplex' | 'apartment';
  
  // Home Buying Goals
  targetHomePrice: number | '';
  downPaymentPercent: number | '';
  loanType: 'conventional' | 'fha' | 'va' | 'usda';
  targetTimeframe: string; // e.g., "6 months", "1 year", "2 years"
}

const initialFormData: KeyGrowRegistrationData = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  isFirstTimeBuyer: true,
  hasStableEmployment: false,
  employmentYears: '',
  
  creditScore: '',
  monthlyIncome: '',
  monthlyDebt: '',
  monthlyExpenses: '',
  emergencyFund: '',
  currentSavings: '',
  monthlySavings: '',
  
  preferredLocation: '',
  targetZipCode: '',
  priceRangeMin: '',
  priceRangeMax: '',
  bedrooms: 3,
  bathrooms: 2,
  preferredPropertyType: 'house',
  
  targetHomePrice: '',
  downPaymentPercent: 20,
  loanType: 'conventional',
  targetTimeframe: '1 year',
};

interface KeyGrowRegistrationFormProps {
  onClose: () => void;
  walletAddress?: string;
}

// Payment Form Component
interface PaymentStepProps {
  onPaymentSuccess: (paymentIntentId: string) => void;
  onError: (error: string) => void;
}

const PaymentStep: React.FC<PaymentStepProps> = ({ onPaymentSuccess, onError }) => {
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
        const response = await fetch('/api/stripe/create-keygrow-registration', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ amount: 500 }), // $500 registration fee
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
  }, []);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements || !clientSecret) {
      return;
    }

    setIsProcessing(true);

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) {
      onError('Card element not found');
      setIsProcessing(false);
      return;
    }

    try {
      const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement,
          billing_details: {
            name: 'KeyGrow Registration',
          },
        }
      });

      if (error) {
        onError(error.message || 'Payment failed');
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        onPaymentSuccess(paymentIntent.id);
      } else {
        onError('Payment was not completed');
      }
    } catch (error: any) {
      onError(error.message || 'Payment processing failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const cardElementOptions = {
    style: {
      base: {
        fontSize: '16px',
        color: '#424770',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        '::placeholder': {
          color: '#aab7c4',
        },
      },
      invalid: {
        color: '#9e2146',
      },
    },
  };

  if (!clientSecret) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full"></div>
        <span className="ml-2 text-gray-600">Loading payment form...</span>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="p-4 border rounded-lg bg-gray-50">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          💳 Card Information
        </label>
        <div className="p-4 border-2 border-gray-300 rounded-lg bg-white focus-within:border-blue-500 transition-colors">
          <CardElement 
            options={cardElementOptions}
            onReady={() => console.log('✅ Stripe CardElement ready')}
            onChange={(event) => {
              console.log('📝 CardElement changed:', event.complete, event.error);
              if (event.error) {
                onError(event.error.message);
              }
            }}
          />
        </div>
        <p className="text-xs text-gray-500 mt-2">
          💡 Enter your card details above. Your payment information is secure and encrypted.
        </p>
      </div>
      
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm">
        <p className="font-semibold text-yellow-900 mb-2">🧪 Test Card (Development Mode)</p>
        <div className="grid grid-cols-2 gap-2 text-xs text-yellow-800">
          <div>
            <span className="font-medium">Card:</span> 4242 4242 4242 4242
          </div>
          <div>
            <span className="font-medium">Expiry:</span> Any future date
          </div>
          <div>
            <span className="font-medium">CVC:</span> Any 3 digits
          </div>
          <div>
            <span className="font-medium">ZIP:</span> Any 5 digits
          </div>
        </div>
      </div>

      <div className="text-sm text-gray-600 bg-blue-50 p-4 rounded">
        <div className="flex justify-between items-center">
          <strong>Registration Fee (2-Year Program):</strong>
          <span className="text-lg font-bold text-blue-900">$500.00 USD</span>
        </div>
        <p className="text-xs mt-2 text-gray-500">
          One-time fee includes 24 months of personalized homeownership coaching, savings tracking, and property matching.
        </p>
      </div>

      <Button
        type="submit"
        disabled={!stripe || isProcessing || !clientSecret}
        className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
      >
        {isProcessing ? (
          <>
            <div className="inline-block animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
            Processing Payment...
          </>
        ) : (
          'Pay $500 & Complete Registration'
        )}
      </Button>
      
      {!stripe && (
        <p className="text-xs text-amber-600 text-center">⏳ Initializing Stripe...</p>
      )}
    </form>
  );
};

export default function KeyGrowRegistrationForm({ onClose, walletAddress }: KeyGrowRegistrationFormProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<KeyGrowRegistrationData>(initialFormData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [paymentIntentId, setPaymentIntentId] = useState('');

  const handleChange = (field: keyof KeyGrowRegistrationData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const calculateSavingsRate = (): number => {
    if (formData.monthlyIncome && formData.monthlySavings) {
      return (Number(formData.monthlySavings) / Number(formData.monthlyIncome)) * 100;
    }
    return 0;
  };

  const calculateDownPaymentAmount = (): number => {
    if (formData.targetHomePrice && formData.downPaymentPercent) {
      return (Number(formData.targetHomePrice) * Number(formData.downPaymentPercent)) / 100;
    }
    return 0;
  };

  const calculateMonthsToGoal = (): number => {
    const downPayment = calculateDownPaymentAmount();
    const closingCosts = downPayment * 0.03; // Estimate 3% for closing costs
    const totalNeeded = downPayment + closingCosts;
    const currentGap = totalNeeded - Number(formData.currentSavings || 0);
    
    if (currentGap <= 0) return 0;
    if (!formData.monthlySavings || Number(formData.monthlySavings) <= 0) return 999;
    
    return Math.ceil(currentGap / Number(formData.monthlySavings));
  };

  // 📚 EDUCATIONAL FINANCIAL CALCULATIONS
  const calculateDebtToIncomeRatio = (): number => {
    // DTI = (Total Monthly Debt Payments / Gross Monthly Income) × 100
    const totalDebt = Number(formData.monthlyDebt || 0);
    const income = Number(formData.monthlyIncome || 0);
    if (income === 0) return 0;
    return (totalDebt / income) * 100;
  };

  const calculateEstimatedMortgagePayment = (): number => {
    // Formula: M = P[r(1+r)^n]/[(1+r)^n-1]
    // M = Monthly payment, P = Principal, r = Monthly interest rate, n = Number of payments
    const homePrice = Number(formData.targetHomePrice || 0);
    const downPayment = calculateDownPaymentAmount();
    const principal = homePrice - downPayment;
    const annualRate = 0.07; // 7% assumed interest rate
    const monthlyRate = annualRate / 12;
    const numPayments = 30 * 12; // 30-year mortgage
    
    if (principal <= 0) return 0;
    
    const payment = principal * (monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / 
                   (Math.pow(1 + monthlyRate, numPayments) - 1);
    
    return payment;
  };

  const calculatePMI = (): number => {
    // PMI (Private Mortgage Insurance) if down payment < 20%
    const downPaymentPercent = Number(formData.downPaymentPercent || 0);
    if (downPaymentPercent >= 20) return 0;
    
    const homePrice = Number(formData.targetHomePrice || 0);
    const loanAmount = homePrice - calculateDownPaymentAmount();
    const pmiRate = 0.005; // 0.5% annual PMI rate
    return (loanAmount * pmiRate) / 12; // Monthly PMI
  };

  const calculateFrontEndRatio = (): number => {
    // Front-end ratio: (Housing costs / Gross income) × 100
    // Should be ≤ 28% for mortgage approval
    const monthlyPayment = calculateEstimatedMortgagePayment();
    const pmi = calculatePMI();
    const propertyTax = (Number(formData.targetHomePrice || 0) * 0.012) / 12; // 1.2% annual tax
    const insurance = 100; // Estimated homeowner's insurance
    const totalHousing = monthlyPayment + pmi + propertyTax + insurance;
    const income = Number(formData.monthlyIncome || 0);
    
    if (income === 0) return 0;
    return (totalHousing / income) * 100;
  };

  const calculateBackEndRatio = (): number => {
    // Back-end ratio: (Housing + Debt / Gross income) × 100
    // Should be ≤ 36% for mortgage approval
    const monthlyPayment = calculateEstimatedMortgagePayment();
    const pmi = calculatePMI();
    const propertyTax = (Number(formData.targetHomePrice || 0) * 0.012) / 12;
    const insurance = 100;
    const totalHousing = monthlyPayment + pmi + propertyTax + insurance;
    const totalDebt = Number(formData.monthlyDebt || 0);
    const income = Number(formData.monthlyIncome || 0);
    
    if (income === 0) return 0;
    return ((totalHousing + totalDebt) / income) * 100;
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1: // Personal Info
        return !!(
          formData.firstName &&
          formData.lastName &&
          formData.email
        );
      case 2: // Financial Info
        return !!(
          formData.monthlyIncome &&
          formData.monthlyDebt !== '' &&
          formData.monthlyExpenses !== '' &&
          formData.currentSavings !== ''
        );
      case 3: // Property Preferences
        return !!(
          formData.preferredLocation &&
          formData.priceRangeMin &&
          formData.priceRangeMax
        );
      case 4: // Home Buying Goals
        return !!(
          formData.targetHomePrice &&
          formData.downPaymentPercent
        );
      case 5: // Review - always valid to proceed to payment
        return true;
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => prev + 1);
      setError('');
    } else {
      setError('Please fill in all required fields');
    }
  };

  const handleBack = () => {
    setCurrentStep(prev => prev - 1);
    setError('');
  };

  const handlePaymentSuccess = (intentId: string) => {
    setPaymentIntentId(intentId);
    // Payment successful, now submit registration
    handleSubmit(intentId);
  };

  const handleSubmit = async (paymentId: string) => {
    if (!walletAddress) {
      setError('Please connect your wallet first');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Calculate derived values
      const savingsRate = calculateSavingsRate();
      const downPaymentAmount = calculateDownPaymentAmount();
      const closingCosts = downPaymentAmount * 0.03;
      const totalNeeded = downPaymentAmount + closingCosts;
      const monthsToGoal = calculateMonthsToGoal();

      const response = await fetch('/api/keygrow/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walletAddress,
          ...formData,
          savingsRate,
          downPaymentAmount,
          closingCosts,
          totalNeeded,
          monthsToGoal,
          paymentIntentId: paymentId,
          registrationFee: 500,
          programDuration: 24, // 2 years in months
        }),
      });

      const result = await response.json();

      if (result.success) {
        setSuccess(true);
        setTimeout(() => {
          onClose();
          window.location.reload(); // Refresh to show updated dashboard
        }, 2000);
      } else {
        setError(result.error || 'Registration failed');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to register for KeyGrow');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardContent className="p-6 sm:p-8 text-center">
          <div className="text-5xl sm:text-6xl mb-4">✅</div>
          <h3 className="text-xl sm:text-2xl font-bold text-green-600 mb-2">
            Registration Successful!
          </h3>
          <p className="text-sm sm:text-base text-gray-600 px-2">
            Welcome to KeyGrow! Your personalized homeownership pathway is being prepared.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6">
      {/* Progress Indicator - Mobile Optimized */}
      <div className="mb-6 sm:mb-8">
        {/* Mobile: Compact */}
        <div className="flex sm:hidden justify-center items-center mb-4">
          <span className="text-sm font-medium text-gray-600">
            Step {currentStep} of 6
          </span>
        </div>
        
        {/* Desktop: Full */}
        <div className="hidden sm:flex justify-between items-center">
          {[1, 2, 3, 4, 5, 6].map(step => (
            <div key={step} className="flex items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                  step === currentStep
                    ? 'bg-blue-600 text-white'
                    : step < currentStep
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-200 text-gray-500'
                }`}
              >
                {step < currentStep ? '✓' : step}
              </div>
              <div className="ml-2 text-xs font-medium hidden lg:block">
                {step === 1 && 'Personal'}
                {step === 2 && 'Financial'}
                {step === 3 && 'Property'}
                {step === 4 && 'Goals'}
                {step === 5 && 'Review'}
                {step === 6 && 'Payment'}
              </div>
              {step < 6 && <div className="w-6 lg:w-10 h-1 mx-1 lg:mx-2 bg-gray-300" />}
            </div>
          ))}
        </div>
        
        {/* Mobile: Progress Bar */}
        <div className="sm:hidden w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${(currentStep / 6) * 100}%` }}
          />
        </div>
      </div>

      <Card>
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-lg sm:text-xl">
            {currentStep === 1 && 'Personal Information'}
            {currentStep === 2 && 'Financial Information'}
            {currentStep === 3 && 'Property Preferences'}
            {currentStep === 4 && 'Home Buying Goals'}
            {currentStep === 5 && 'Review Summary'}
            {currentStep === 6 && 'Registration Payment'}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          {/* Step 1: Personal Information */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded p-4">
                <p className="text-sm text-blue-800">
                  👤 <strong>Tell us about yourself:</strong> This information helps us personalize your homeownership journey.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  <label className="block text-sm font-medium mb-1">Phone (Optional)</label>
                  <input
                    type="tel"
                    className="w-full border rounded px-3 py-2"
                    value={formData.phone}
                    onChange={e => handleChange('phone', e.target.value)}
                    placeholder="(555) 123-4567"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="firstTimeBuyer"
                    className="mr-2 w-4 h-4"
                    checked={formData.isFirstTimeBuyer}
                    onChange={e => handleChange('isFirstTimeBuyer', e.target.checked)}
                  />
                  <label htmlFor="firstTimeBuyer" className="text-sm font-medium">
                    I am a first-time home buyer
                  </label>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="stableEmployment"
                    className="mr-2 w-4 h-4"
                    checked={formData.hasStableEmployment}
                    onChange={e => handleChange('hasStableEmployment', e.target.checked)}
                  />
                  <label htmlFor="stableEmployment" className="text-sm font-medium">
                    I have stable employment (2+ years)
                  </label>
                </div>
              </div>

              {formData.hasStableEmployment && (
                <div>
                  <label className="block text-sm font-medium mb-1">Years of Employment</label>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    className="w-full border rounded px-3 py-2"
                    value={formData.employmentYears}
                    onChange={e => handleChange('employmentYears', parseFloat(e.target.value) || '')}
                    placeholder="2.5"
                  />
                </div>
              )}
            </div>
          )}

          {/* Step 2: Financial Information */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded p-4">
                <p className="text-sm text-green-800">
                  💰 <strong>Financial Snapshot:</strong> This helps us calculate your homeownership readiness and personalized savings plan.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Credit Score (Optional)</label>
                  <input
                    type="number"
                    min="300"
                    max="850"
                    className="w-full border rounded px-3 py-2"
                    value={formData.creditScore}
                    onChange={e => handleChange('creditScore', parseInt(e.target.value) || '')}
                    placeholder="680"
                  />
                  <p className="text-xs text-gray-500 mt-1">300-850 range (estimated if unknown)</p>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Monthly Income (Gross) *</label>
                  <input
                    type="number"
                    min="0"
                    step="100"
                    className="w-full border rounded px-3 py-2"
                    value={formData.monthlyIncome}
                    onChange={e => handleChange('monthlyIncome', parseFloat(e.target.value) || '')}
                    placeholder="5000"
                  />
                  <p className="text-xs text-gray-500 mt-1">Before taxes</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Monthly Debt Payments *</label>
                  <input
                    type="number"
                    min="0"
                    step="10"
                    className="w-full border rounded px-3 py-2"
                    value={formData.monthlyDebt}
                    onChange={e => handleChange('monthlyDebt', parseFloat(e.target.value) || '')}
                    placeholder="500"
                  />
                  <p className="text-xs text-gray-500 mt-1">Credit cards, car loans, student loans</p>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Monthly Expenses *</label>
                  <input
                    type="number"
                    min="0"
                    step="50"
                    className="w-full border rounded px-3 py-2"
                    value={formData.monthlyExpenses}
                    onChange={e => handleChange('monthlyExpenses', parseFloat(e.target.value) || '')}
                    placeholder="2000"
                  />
                  <p className="text-xs text-gray-500 mt-1">Rent, utilities, food, insurance</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Current Savings *</label>
                  <input
                    type="number"
                    min="0"
                    step="100"
                    className="w-full border rounded px-3 py-2"
                    value={formData.currentSavings}
                    onChange={e => handleChange('currentSavings', parseFloat(e.target.value) || '')}
                    placeholder="10000"
                  />
                  <p className="text-xs text-gray-500 mt-1">Total savings available for down payment</p>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Monthly Savings Contribution</label>
                  <input
                    type="number"
                    min="0"
                    step="50"
                    className="w-full border rounded px-3 py-2"
                    value={formData.monthlySavings}
                    onChange={e => handleChange('monthlySavings', parseFloat(e.target.value) || '')}
                    placeholder="500"
                  />
                  <p className="text-xs text-gray-500 mt-1">How much you can save monthly</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Emergency Fund (Optional)</label>
                <input
                  type="number"
                  min="0"
                  step="100"
                  className="w-full border rounded px-3 py-2"
                  value={formData.emergencyFund}
                  onChange={e => handleChange('emergencyFund', parseFloat(e.target.value) || '')}
                  placeholder="5000"
                />
                <p className="text-xs text-gray-500 mt-1">Separate from down payment savings</p>
              </div>

              {/* EDUCATIONAL: Debt-to-Income Ratio */}
              {formData.monthlyIncome && formData.monthlyDebt !== '' && (
                <div className="bg-purple-50 border-2 border-purple-300 rounded-lg p-4 space-y-3">
                  <div className="flex items-start gap-2">
                    <span className="text-2xl">📊</span>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-purple-900">
                        Debt-to-Income (DTI) Ratio: {calculateDebtToIncomeRatio().toFixed(1)}%
                      </p>
                      <p className="text-xs text-purple-700 mt-1">
                        <strong>Formula:</strong> (Monthly Debt ÷ Monthly Income) × 100
                      </p>
                      <p className="text-xs text-purple-700">
                        ({Number(formData.monthlyDebt).toLocaleString()} ÷ {Number(formData.monthlyIncome).toLocaleString()}) × 100 = {calculateDebtToIncomeRatio().toFixed(1)}%
                      </p>
                    </div>
                  </div>
                  <div className="pl-9 border-l-2 border-purple-200">
                    <p className="text-xs font-semibold text-gray-800">💡 What this means:</p>
                    <p className="text-xs text-gray-700">
                      {calculateDebtToIncomeRatio() < 36
                        ? '✅ Excellent! DTI < 36% makes you a strong mortgage candidate.'
                        : calculateDebtToIncomeRatio() < 43
                        ? '⚠️ Fair. DTI 36-43% may qualify but focus on reducing debt.'
                        : '🚨 High DTI (>43%). Work on lowering debt before applying for a mortgage.'}
                    </p>
                  </div>
                </div>
              )}

              {/* EDUCATIONAL: Savings Rate */}
              {formData.monthlyIncome && formData.monthlySavings && (
                <div className="bg-blue-50 border border-blue-200 rounded p-4">
                  <p className="text-sm font-semibold text-blue-900">
                    💡 Your Savings Rate: {calculateSavingsRate().toFixed(1)}%
                  </p>
                  <p className="text-xs text-blue-700 mt-1">
                    <strong>Formula:</strong> (Monthly Savings ÷ Monthly Income) × 100 = {calculateSavingsRate().toFixed(1)}%
                  </p>
                  <p className="text-xs text-blue-700 mt-1">
                    {calculateSavingsRate() >= 20 
                      ? '🎉 Excellent! You\'re saving more than the recommended 20%.'
                      : calculateSavingsRate() >= 10
                      ? '👍 Good progress! Try to increase towards 20% if possible.'
                      : '💪 Consider increasing your savings rate to reach your goal faster.'}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Step 3: Property Preferences */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <div className="bg-purple-50 border border-purple-200 rounded p-4">
                <p className="text-sm text-purple-800">
                  🏠 <strong>Dream Home Details:</strong> Tell us what you're looking for in your future home.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Preferred City/Area *</label>
                  <input
                    type="text"
                    className="w-full border rounded px-3 py-2"
                    value={formData.preferredLocation}
                    onChange={e => handleChange('preferredLocation', e.target.value)}
                    placeholder="e.g., Austin, TX"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Target ZIP Code (Optional)</label>
                  <input
                    type="text"
                    maxLength={10}
                    className="w-full border rounded px-3 py-2"
                    value={formData.targetZipCode}
                    onChange={e => handleChange('targetZipCode', e.target.value)}
                    placeholder="78701"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Minimum Price *</label>
                  <input
                    type="number"
                    min="0"
                    step="10000"
                    className="w-full border rounded px-3 py-2"
                    value={formData.priceRangeMin}
                    onChange={e => handleChange('priceRangeMin', parseFloat(e.target.value) || '')}
                    placeholder="200000"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Maximum Price *</label>
                  <input
                    type="number"
                    min="0"
                    step="10000"
                    className="w-full border rounded px-3 py-2"
                    value={formData.priceRangeMax}
                    onChange={e => handleChange('priceRangeMax', parseFloat(e.target.value) || '')}
                    placeholder="350000"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Bedrooms</label>
                  <select
                    className="w-full border rounded px-3 py-2"
                    value={formData.bedrooms}
                    onChange={e => handleChange('bedrooms', parseInt(e.target.value))}
                  >
                    <option value={1}>1 Bedroom</option>
                    <option value={2}>2 Bedrooms</option>
                    <option value={3}>3 Bedrooms</option>
                    <option value={4}>4 Bedrooms</option>
                    <option value={5}>5+ Bedrooms</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Bathrooms</label>
                  <select
                    className="w-full border rounded px-3 py-2"
                    value={formData.bathrooms}
                    onChange={e => handleChange('bathrooms', parseFloat(e.target.value))}
                  >
                    <option value={1}>1 Bathroom</option>
                    <option value={1.5}>1.5 Bathrooms</option>
                    <option value={2}>2 Bathrooms</option>
                    <option value={2.5}>2.5 Bathrooms</option>
                    <option value={3}>3+ Bathrooms</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Property Type</label>
                  <select
                    className="w-full border rounded px-3 py-2"
                    value={formData.preferredPropertyType}
                    onChange={e => handleChange('preferredPropertyType', e.target.value as any)}
                  >
                    <option value="house">Single-Family House</option>
                    <option value="condo">Condo</option>
                    <option value="townhouse">Townhouse</option>
                    <option value="duplex">Duplex</option>
                    <option value="apartment">Apartment</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Home Buying Goals */}
          {currentStep === 4 && (
            <div className="space-y-4">
              <div className="bg-orange-50 border border-orange-200 rounded p-4">
                <p className="text-sm text-orange-800">
                  🎯 <strong>Your Homeownership Goals:</strong> Let's create a realistic plan to get you there.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Target Home Price *</label>
                  <input
                    type="number"
                    min="0"
                    step="10000"
                    className="w-full border rounded px-3 py-2"
                    value={formData.targetHomePrice}
                    onChange={e => handleChange('targetHomePrice', parseFloat(e.target.value) || '')}
                    placeholder="300000"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Down Payment % *</label>
                  <select
                    className="w-full border rounded px-3 py-2"
                    value={formData.downPaymentPercent}
                    onChange={e => handleChange('downPaymentPercent', parseFloat(e.target.value))}
                  >
                    <option value={3.5}>3.5% (FHA Minimum)</option>
                    <option value={5}>5%</option>
                    <option value={10}>10%</option>
                    <option value={15}>15%</option>
                    <option value={20}>20% (Avoid PMI)</option>
                    <option value={25}>25%</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Loan Type</label>
                  <select
                    className="w-full border rounded px-3 py-2"
                    value={formData.loanType}
                    onChange={e => handleChange('loanType', e.target.value as any)}
                  >
                    <option value="conventional">Conventional</option>
                    <option value="fha">FHA (First-Time Buyers)</option>
                    <option value="va">VA (Veterans)</option>
                    <option value="usda">USDA (Rural Areas)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Target Timeframe</label>
                  <select
                    className="w-full border rounded px-3 py-2"
                    value={formData.targetTimeframe}
                    onChange={e => handleChange('targetTimeframe', e.target.value)}
                  >
                    <option value="6 months">6 months</option>
                    <option value="1 year">1 year</option>
                    <option value="18 months">18 months</option>
                    <option value="2 years">2 years</option>
                    <option value="3 years">3 years</option>
                    <option value="5 years">5 years</option>
                  </select>
                </div>
              </div>

              {/* EDUCATIONAL SECTION 1: Savings Plan */}
              {formData.targetHomePrice && formData.downPaymentPercent && (
                <div className="bg-gradient-to-r from-blue-50 to-green-50 border-2 border-blue-300 rounded-lg p-4 space-y-3">
                  <h3 className="font-bold text-gray-900">💰 Your Savings Plan</h3>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">Down Payment Needed:</p>
                      <p className="font-bold text-gray-900">
                        ${calculateDownPaymentAmount().toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                      <p className="text-xs text-gray-500">({formData.downPaymentPercent}% of ${Number(formData.targetHomePrice).toLocaleString()})</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Estimated Closing Costs:</p>
                      <p className="font-bold text-gray-900">
                        ${(calculateDownPaymentAmount() * 0.03).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                      <p className="text-xs text-gray-500">(~3% of down payment)</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Total Cash Needed:</p>
                      <p className="font-bold text-blue-900">
                        ${(calculateDownPaymentAmount() * 1.03).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600">Current Savings:</p>
                      <p className="font-bold text-green-900">
                        ${Number(formData.currentSavings || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                    </div>
                  </div>

                  {formData.monthlySavings && (
                    <div className="pt-3 border-t border-blue-200">
                      <p className="text-sm text-gray-700">
                        ⏱️ <strong>Estimated Timeline:</strong> {calculateMonthsToGoal()} months
                        {calculateMonthsToGoal() > 0 && ` (${(calculateMonthsToGoal() / 12).toFixed(1)} years)`}
                      </p>
                      {calculateMonthsToGoal() === 0 && (
                        <p className="text-sm text-green-700 mt-1">
                          🎉 You already have enough saved for your down payment!
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* EDUCATIONAL SECTION 2: Estimated Monthly Mortgage Payment */}
              {formData.targetHomePrice && formData.downPaymentPercent && formData.monthlyIncome && (
                <div className="bg-gradient-to-r from-orange-50 to-yellow-50 border-2 border-orange-300 rounded-lg p-4 space-y-3">
                  <h3 className="font-bold text-gray-900">🏠 Estimated Monthly Mortgage Payment</h3>
                  
                  <div className="bg-white rounded p-3 space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Principal & Interest:</span>
                      <span className="font-semibold">${calculateEstimatedMortgagePayment().toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                    {calculatePMI() > 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">PMI ({'<'} 20% down):</span>
                        <span className="font-semibold text-amber-700">+${calculatePMI().toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-gray-600">Property Tax (est.):</span>
                      <span className="font-semibold">+${((Number(formData.targetHomePrice) * 0.012) / 12).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Homeowner's Insurance:</span>
                      <span className="font-semibold">+$100.00</span>
                    </div>
                    <div className="border-t pt-2 flex justify-between text-base">
                      <span className="font-bold text-gray-900">Total Monthly Payment:</span>
                      <span className="font-bold text-orange-900">
                        ${(calculateEstimatedMortgagePayment() + calculatePMI() + ((Number(formData.targetHomePrice) * 0.012) / 12) + 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>

                  <div className="text-xs text-gray-600 bg-white rounded p-2">
                    <p><strong>📐 Formula Used:</strong> M = P[r(1+r)^n] / [(1+r)^n - 1]</p>
                    <p className="mt-1">Loan: ${(Number(formData.targetHomePrice) - calculateDownPaymentAmount()).toLocaleString()} @ 7% for 30 years</p>
                  </div>
                </div>
              )}

              {/* EDUCATIONAL SECTION 3: Mortgage Affordability Analysis */}
              {formData.targetHomePrice && formData.monthlyIncome && formData.monthlyDebt !== '' && (
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-300 rounded-lg p-4 space-y-3">
                  <h3 className="font-bold text-gray-900">📈 Mortgage Affordability Analysis</h3>
                  
                  <div className="space-y-3">
                    {/* Front-End Ratio */}
                    <div className="bg-white rounded p-3">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-semibold text-gray-800">Front-End Ratio (Housing Only)</span>
                        <span className={`text-lg font-bold ${calculateFrontEndRatio() <= 28 ? 'text-green-600' : 'text-red-600'}`}>
                          {calculateFrontEndRatio().toFixed(1)}%
                        </span>
                      </div>
                      <p className="text-xs text-gray-600">
                        <strong>Formula:</strong> (Housing Costs ÷ Income) × 100
                      </p>
                      <p className="text-xs text-gray-600 mt-1">
                        Target: ≤ 28% | {calculateFrontEndRatio() <= 28 ? '✅ You qualify!' : '⚠️ Too high - may not qualify'}
                      </p>
                    </div>

                    {/* Back-End Ratio */}
                    <div className="bg-white rounded p-3">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-semibold text-gray-800">Back-End Ratio (All Debt)</span>
                        <span className={`text-lg font-bold ${calculateBackEndRatio() <= 36 ? 'text-green-600' : 'text-red-600'}`}>
                          {calculateBackEndRatio().toFixed(1)}%
                        </span>
                      </div>
                      <p className="text-xs text-gray-600">
                        <strong>Formula:</strong> (Housing + Debt ÷ Income) × 100
                      </p>
                      <p className="text-xs text-gray-600 mt-1">
                        Target: ≤ 36% | {calculateBackEndRatio() <= 36 ? '✅ You qualify!' : '⚠️ Too high - may not qualify'}
                      </p>
                    </div>
                  </div>

                  <div className="bg-blue-100 rounded p-3 text-xs text-blue-900">
                    <p className="font-semibold">💡 Lender Requirements:</p>
                    <p className="mt-1">Most lenders require both ratios to qualify for a mortgage. If yours are high, consider:</p>
                    <ul className="list-disc ml-4 mt-1 space-y-1">
                      <li>Reducing monthly debt payments</li>
                      <li>Increasing your down payment (lowers PMI)</li>
                      <li>Looking at lower-priced homes</li>
                      <li>Increasing your income</li>
                    </ul>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 5: Review & Submit */}
          {currentStep === 5 && (
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">📋 Registration Summary</h3>
                
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-gray-800 mb-2">Personal Information</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-gray-600">Name:</p>
                        <p className="text-gray-900">{formData.firstName} {formData.lastName}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Email:</p>
                        <p className="text-gray-900">{formData.email}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">First-Time Buyer:</p>
                        <p className="text-gray-900">{formData.isFirstTimeBuyer ? 'Yes' : 'No'}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Stable Employment:</p>
                        <p className="text-gray-900">{formData.hasStableEmployment ? 'Yes' : 'No'}</p>
                      </div>
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <h4 className="font-semibold text-gray-800 mb-2">Financial Snapshot</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-gray-600">Monthly Income:</p>
                        <p className="text-gray-900">${Number(formData.monthlyIncome).toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Monthly Savings:</p>
                        <p className="text-gray-900">${Number(formData.monthlySavings).toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Current Savings:</p>
                        <p className="text-gray-900">${Number(formData.currentSavings).toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Savings Rate:</p>
                        <p className="text-gray-900">{calculateSavingsRate().toFixed(1)}%</p>
                      </div>
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <h4 className="font-semibold text-gray-800 mb-2">Property Preferences</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-gray-600">Preferred Location:</p>
                        <p className="text-gray-900">{formData.preferredLocation}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Price Range:</p>
                        <p className="text-gray-900">
                          ${Number(formData.priceRangeMin).toLocaleString()} - ${Number(formData.priceRangeMax).toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600">Bedrooms / Bathrooms:</p>
                        <p className="text-gray-900">{formData.bedrooms} BD / {formData.bathrooms} BA</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Property Type:</p>
                        <p className="text-gray-900 capitalize">{formData.preferredPropertyType}</p>
                      </div>
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <h4 className="font-semibold text-gray-800 mb-2">Home Buying Goal</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-gray-600">Target Home Price:</p>
                        <p className="text-gray-900">${Number(formData.targetHomePrice).toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Down Payment:</p>
                        <p className="text-gray-900">
                          {formData.downPaymentPercent}% (${calculateDownPaymentAmount().toLocaleString()})
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600">Timeline to Goal:</p>
                        <p className="text-gray-900">{calculateMonthsToGoal()} months</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Target Timeframe:</p>
                        <p className="text-gray-900">{formData.targetTimeframe}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 p-4 bg-white rounded border border-gray-200">
                  <p className="text-sm text-gray-600">
                    ✅ By submitting, you confirm that all information provided is accurate. Our team will use this to create your personalized homeownership pathway.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Step 6: Registration Payment */}
          {currentStep === 6 && (
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">💳 Complete Your Registration</h3>
                <p className="text-gray-700 mb-4">
                  You're one step away from joining the KeyGrow 2-Year Rent-to-Own Program!
                </p>
                
                <div className="bg-white rounded p-4 space-y-3 border border-blue-200">
                  <div className="flex items-start">
                    <div className="text-2xl mr-3">🏠</div>
                    <div>
                      <p className="font-semibold text-gray-900">2-Year Homeownership Program</p>
                      <p className="text-sm text-gray-600">24 months of personalized support and coaching</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <div className="text-2xl mr-3">📊</div>
                    <div>
                      <p className="font-semibold text-gray-900">Savings Tracking & Goal Planning</p>
                      <p className="text-sm text-gray-600">Monitor your progress toward homeownership</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <div className="text-2xl mr-3">🎯</div>
                    <div>
                      <p className="font-semibold text-gray-900">Property Matching Service</p>
                      <p className="text-sm text-gray-600">Find rent-to-own homes that match your criteria</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <div className="text-2xl mr-3">💰</div>
                    <div>
                      <p className="font-semibold text-gray-900">Monthly Revenue Allocations</p>
                      <p className="text-sm text-gray-600">Receive platform revenue share based on your tier</p>
                    </div>
                  </div>
                </div>
              </div>

              <Elements stripe={getStripePromise()}>
                <PaymentStep 
                  onPaymentSuccess={handlePaymentSuccess}
                  onError={setError}
                />
              </Elements>
            </div>
          )}

          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded">
              <p className="text-sm text-red-800">❌ {error}</p>
            </div>
          )}

          {/* Navigation Buttons - Mobile Optimized */}
          <div className="flex flex-col sm:flex-row justify-between gap-4 mt-6 sm:mt-8">
            <div className="order-2 sm:order-1">
              {currentStep > 1 && (
                <Button 
                  onClick={handleBack} 
                  variant="outline" 
                  disabled={loading}
                  className="w-full sm:w-auto"
                >
                  ← Back
                </Button>
              )}
            </div>
            <div className="flex flex-col sm:flex-row gap-3 order-1 sm:order-2">
              <Button 
                onClick={onClose} 
                variant="outline" 
                disabled={loading}
                className="w-full sm:w-auto"
              >
                Cancel
              </Button>
              {currentStep < 6 ? (
                <Button 
                  onClick={handleNext} 
                  disabled={loading}
                  className="w-full sm:w-auto"
                >
                  Next →
                </Button>
              ) : null}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
