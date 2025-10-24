import React, { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';

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

export default function KeyGrowRegistrationForm({ onClose, walletAddress }: KeyGrowRegistrationFormProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<KeyGrowRegistrationData>(initialFormData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

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

  const handleSubmit = async () => {
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
            Step {currentStep} of 5
          </span>
        </div>
        
        {/* Desktop: Full */}
        <div className="hidden sm:flex justify-between items-center">
          {[1, 2, 3, 4, 5].map(step => (
            <div key={step} className="flex items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                  step === currentStep
                    ? 'bg-blue-600 text-white'
                    : step < currentStep
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-200 text-gray-500'
                }`}
              >
                {step < currentStep ? '✓' : step}
              </div>
              <div className="ml-3 text-sm font-medium hidden md:block">
                {step === 1 && 'Personal'}
                {step === 2 && 'Financial'}
                {step === 3 && 'Preferences'}
                {step === 4 && 'Goals'}
                {step === 5 && 'Review'}
              </div>
              {step < 5 && <div className="w-8 md:w-12 h-1 mx-2 md:mx-4 bg-gray-300" />}
            </div>
          ))}
        </div>
        
        {/* Mobile: Progress Bar */}
        <div className="sm:hidden w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${(currentStep / 5) * 100}%` }}
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
            {currentStep === 5 && 'Review & Submit'}
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

              {formData.monthlyIncome && formData.monthlySavings && (
                <div className="bg-blue-50 border border-blue-200 rounded p-4">
                  <p className="text-sm font-semibold text-blue-900">
                    💡 Your Savings Rate: {calculateSavingsRate().toFixed(1)}%
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

              {formData.targetHomePrice && formData.downPaymentPercent && (
                <div className="bg-gradient-to-r from-blue-50 to-green-50 border border-blue-200 rounded p-4 space-y-3">
                  <h3 className="font-bold text-gray-900">📊 Your Savings Plan:</h3>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">Down Payment Needed:</p>
                      <p className="font-bold text-gray-900">
                        ${calculateDownPaymentAmount().toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600">Estimated Closing Costs:</p>
                      <p className="font-bold text-gray-900">
                        ${(calculateDownPaymentAmount() * 0.03).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600">Total Needed:</p>
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
              {currentStep < 5 ? (
                <Button 
                  onClick={handleNext} 
                  disabled={loading}
                  className="w-full sm:w-auto"
                >
                  Next →
                </Button>
              ) : (
                <Button 
                  onClick={handleSubmit} 
                  disabled={loading} 
                  className="w-full sm:w-auto bg-green-600 hover:bg-green-700"
                >
                  {loading ? 'Submitting...' : 'Complete Registration'}
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
