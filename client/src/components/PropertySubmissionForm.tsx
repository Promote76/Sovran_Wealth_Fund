import React, { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { useWallet } from '../contexts/WalletContext';

interface PropertySubmissionData {
  // Submitter info
  submitterName: string;
  submitterEmail: string;
  submitterPhone: string;
  
  // Property details
  propertyName: string;
  propertyAddress: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  propertyDescription: string;
  propertyType: string;
  bedrooms: number | '';
  bathrooms: number | '';
  squareFeet: number | '';
  lotSize: string;
  yearBuilt: number | '';
  
  // Financial data
  purchasePrice: number | '';
  monthlyRent: number | '';
  totalShares: number | '';
  pricePerShare: number | '';
  estimatedAnnualRent: number | '';
  estimatedAppreciation: number | '';
  estimatedROI: number | '';
  rentalYield: number | '';
  occupancyRate: number | '';
  
  // Property management
  managementCompany: string;
  propertyManager: string;
  currentTenant: boolean;
  leaseEndDate: string;
  
  // Media (will handle separately for file uploads)
  virtualTourUrl: string;
}

const initialFormData: PropertySubmissionData = {
  submitterName: '',
  submitterEmail: '',
  submitterPhone: '',
  propertyName: '',
  propertyAddress: '',
  city: '',
  state: '',
  zipCode: '',
  country: 'United States',
  propertyDescription: '',
  propertyType: 'residential',
  bedrooms: '',
  bathrooms: '',
  squareFeet: '',
  lotSize: '',
  yearBuilt: '',
  purchasePrice: '',
  monthlyRent: '',
  totalShares: '',
  pricePerShare: '',
  estimatedAnnualRent: '',
  estimatedAppreciation: '',
  estimatedROI: '',
  rentalYield: '',
  occupancyRate: 100,
  managementCompany: '',
  propertyManager: '',
  currentTenant: false,
  leaseEndDate: '',
  virtualTourUrl: '',
};

export default function PropertySubmissionForm({ onClose }: { onClose: () => void }) {
  const { account } = useWallet();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<PropertySubmissionData>(initialFormData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [bnbPrice, setBnbPrice] = useState<number>(600);

  React.useEffect(() => {
    const fetchBnbPrice = async () => {
      try {
        const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=binancecoin&vs_currencies=usd');
        const data = await response.json();
        if (data.binancecoin?.usd) {
          setBnbPrice(data.binancecoin.usd);
        }
      } catch (err) {
        console.error('Failed to fetch BNB price:', err);
      }
    };
    fetchBnbPrice();
  }, []);

  const handleChange = (field: keyof PropertySubmissionData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const formatUSD = (bnbAmount: number | ''): string => {
    if (bnbAmount === '' || isNaN(Number(bnbAmount))) return '$0';
    return `≈ $${(Number(bnbAmount) * bnbPrice).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1: // Property Details
        return !!(
          formData.propertyName &&
          formData.propertyAddress &&
          formData.city &&
          formData.state &&
          formData.zipCode
        );
      case 2: // Financials
        console.log('🔍 Validating step 2:', {
          purchasePrice: formData.purchasePrice,
          monthlyRent: formData.monthlyRent,
          totalShares: formData.totalShares,
          pricePerShare: formData.pricePerShare
        });

        // Check if fields are filled (not empty strings)
        if (formData.purchasePrice === '' || formData.monthlyRent === '' || 
            formData.totalShares === '' || formData.pricePerShare === '') {
          console.log('❌ Validation failed: Empty fields');
          setError('Please fill in all required fields');
          return false;
        }
        
        const purchasePrice = Number(formData.purchasePrice);
        const monthlyRent = Number(formData.monthlyRent);
        const totalShares = Number(formData.totalShares);
        const pricePerShare = Number(formData.pricePerShare);
        
        console.log('🔢 Converted values:', { purchasePrice, monthlyRent, totalShares, pricePerShare });
        
        // Validate numbers are valid and positive
        if (purchasePrice <= 0 || monthlyRent <= 0 || totalShares <= 0 || pricePerShare <= 0) {
          console.log('❌ Validation failed: Non-positive values');
          setError('All financial values must be positive numbers');
          return false;
        }
        
        // Validate total investment doesn't exceed purchase price by too much
        const totalInvestment = totalShares * pricePerShare;
        console.log('💰 Investment check:', { totalInvestment, maxAllowed: purchasePrice * 1.5 });
        
        if (totalInvestment > purchasePrice * 1.5) {
          console.log('❌ Validation failed: Exceeds 150% limit');
          setError('Total shares × price per share cannot exceed 150% of purchase price');
          return false;
        }
        
        console.log('✅ Validation passed!');
        setError(''); // Clear any previous errors
        return true;
      case 3: // Documents - optional for now, but admins will add metadataURI during approval
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

  const handleSubmit = async () => {
    if (!account) {
      setError('Please connect your wallet');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/real-estate-investor/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          submitterWalletAddress: account,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setSuccess(true);
        setTimeout(() => {
          onClose();
        }, 2000);
      } else {
        setError(result.error || 'Submission failed');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to submit property');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardContent className="p-6 sm:p-8 text-center">
          <div className="text-5xl sm:text-6xl mb-4">✅</div>
          <h3 className="text-xl sm:text-2xl font-bold text-green-600 mb-2">Property Submitted Successfully!</h3>
          <p className="text-sm sm:text-base text-gray-600 px-2">
            Your property submission is now under review. You'll be notified once it's approved.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6">
      {/* Progress Steps - Mobile Optimized */}
      <div className="mb-6 sm:mb-8">
        {/* Mobile: Compact Step Indicator */}
        <div className="flex sm:hidden justify-center items-center mb-4">
          <span className="text-sm font-medium text-gray-600">
            Step {currentStep} of 4
          </span>
        </div>
        
        {/* Desktop: Full Step Indicator */}
        <div className="hidden sm:flex justify-between items-center">
          {[1, 2, 3, 4].map(step => (
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
                {step === 1 && 'Property Details'}
                {step === 2 && 'Financials'}
                {step === 3 && 'Documents'}
                {step === 4 && 'Review & Submit'}
              </div>
              {step < 4 && <div className="w-8 md:w-16 h-1 mx-2 md:mx-4 bg-gray-300" />}
            </div>
          ))}
        </div>
        
        {/* Mobile: Progress Bar */}
        <div className="sm:hidden w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${(currentStep / 4) * 100}%` }}
          />
        </div>
      </div>

      <Card>
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-lg sm:text-xl">
            {currentStep === 1 && 'Property Details'}
            {currentStep === 2 && 'Financial Information'}
            {currentStep === 3 && 'Documents & Media'}
            {currentStep === 4 && 'Review & Submit'}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          {/* Step 1: Property Details */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Property Name *</label>
                  <input
                    type="text"
                    className="w-full border rounded px-3 py-2"
                    value={formData.propertyName}
                    onChange={e => handleChange('propertyName', e.target.value)}
                    placeholder="e.g., Sunset Boulevard Apartments"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Property Type</label>
                  <select
                    className="w-full border rounded px-3 py-2"
                    value={formData.propertyType}
                    onChange={e => handleChange('propertyType', e.target.value)}
                  >
                    <option value="residential">Residential</option>
                    <option value="commercial">Commercial</option>
                    <option value="mixed-use">Mixed Use</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Property Address *</label>
                <input
                  type="text"
                  className="w-full border rounded px-3 py-2"
                  value={formData.propertyAddress}
                  onChange={e => handleChange('propertyAddress', e.target.value)}
                  placeholder="123 Main Street"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">City *</label>
                  <input
                    type="text"
                    className="w-full border rounded px-3 py-2"
                    value={formData.city}
                    onChange={e => handleChange('city', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">State *</label>
                  <input
                    type="text"
                    className="w-full border rounded px-3 py-2"
                    value={formData.state}
                    onChange={e => handleChange('state', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">ZIP Code *</label>
                  <input
                    type="text"
                    className="w-full border rounded px-3 py-2"
                    value={formData.zipCode}
                    onChange={e => handleChange('zipCode', e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  className="w-full border rounded px-3 py-2"
                  rows={4}
                  value={formData.propertyDescription}
                  onChange={e => handleChange('propertyDescription', e.target.value)}
                  placeholder="Describe the property, its features, and investment potential..."
                />
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Bedrooms</label>
                  <input
                    type="number"
                    className="w-full border rounded px-3 py-2"
                    value={formData.bedrooms}
                    onChange={e => handleChange('bedrooms', parseInt(e.target.value) || '')}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Bathrooms</label>
                  <input
                    type="number"
                    step="0.5"
                    className="w-full border rounded px-3 py-2"
                    value={formData.bathrooms}
                    onChange={e => handleChange('bathrooms', parseFloat(e.target.value) || '')}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Square Feet</label>
                  <input
                    type="number"
                    className="w-full border rounded px-3 py-2"
                    value={formData.squareFeet}
                    onChange={e => handleChange('squareFeet', parseInt(e.target.value) || '')}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Year Built</label>
                  <input
                    type="number"
                    className="w-full border rounded px-3 py-2"
                    value={formData.yearBuilt}
                    onChange={e => handleChange('yearBuilt', parseInt(e.target.value) || '')}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Financials */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded p-4">
                <p className="text-sm text-blue-800">
                  💡 <strong>Important:</strong> Enter all financial values in BNB (not USD). The smart contract requires BNB amounts.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Purchase Price (BNB) *</label>
                  <input
                    type="number"
                    step="0.01"
                    className="w-full border rounded px-3 py-2"
                    value={formData.purchasePrice}
                    onChange={e => handleChange('purchasePrice', parseFloat(e.target.value) || '')}
                    placeholder="e.g., 10.5"
                  />
                  <p className="text-xs text-green-600 mt-1 font-medium">{formatUSD(formData.purchasePrice)} USD</p>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Monthly Rent (BNB) *</label>
                  <input
                    type="number"
                    step="0.01"
                    className="w-full border rounded px-3 py-2"
                    value={formData.monthlyRent}
                    onChange={e => handleChange('monthlyRent', parseFloat(e.target.value) || '')}
                    placeholder="e.g., 0.5"
                  />
                  <p className="text-xs text-green-600 mt-1 font-medium">{formatUSD(formData.monthlyRent)} USD/month</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Total Shares *</label>
                  <input
                    type="number"
                    className="w-full border rounded px-3 py-2"
                    value={formData.totalShares}
                    onChange={e => handleChange('totalShares', parseInt(e.target.value) || '')}
                    placeholder="e.g., 1000"
                  />
                  <p className="text-xs text-gray-500 mt-1">Number of investment shares to issue</p>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Price Per Share (BNB) *</label>
                  <input
                    type="number"
                    step="0.001"
                    className="w-full border rounded px-3 py-2"
                    value={formData.pricePerShare}
                    onChange={e => handleChange('pricePerShare', parseFloat(e.target.value) || '')}
                    placeholder="e.g., 0.05"
                  />
                  <p className="text-xs text-green-600 mt-1 font-medium">{formatUSD(formData.pricePerShare)} USD per share</p>
                </div>
              </div>

              {/* Investment Summary */}
              {formData.totalShares !== '' && formData.pricePerShare !== '' && formData.purchasePrice !== '' && (
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-semibold text-sm mb-2">📊 Investment Summary</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <p className="text-gray-600">Total Investment Target:</p>
                      <p className="font-bold text-blue-700">
                        {Number(formData.totalShares) * Number(formData.pricePerShare)} BNB
                        <span className="text-xs ml-1">({formatUSD(Number(formData.totalShares) * Number(formData.pricePerShare))})</span>
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600">Purchase Price:</p>
                      <p className="font-bold text-blue-700">
                        {formData.purchasePrice} BNB
                        <span className="text-xs ml-1">({formatUSD(formData.purchasePrice)})</span>
                      </p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-gray-600">Coverage Ratio:</p>
                      <p className={`font-bold ${
                        (Number(formData.totalShares) * Number(formData.pricePerShare)) > Number(formData.purchasePrice) * 1.5
                          ? 'text-red-600'
                          : 'text-green-600'
                      }`}>
                        {((Number(formData.totalShares) * Number(formData.pricePerShare)) / Number(formData.purchasePrice) * 100).toFixed(1)}%
                        {(Number(formData.totalShares) * Number(formData.pricePerShare)) > Number(formData.purchasePrice) * 1.5 && 
                          ' ⚠️ Exceeds 150% limit'}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Estimated Annual Rent (BNB)</label>
                  <input
                    type="number"
                    step="0.01"
                    className="w-full border rounded px-3 py-2"
                    value={formData.estimatedAnnualRent}
                    onChange={e => handleChange('estimatedAnnualRent', parseFloat(e.target.value) || '')}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Rental Yield (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    className="w-full border rounded px-3 py-2"
                    value={formData.rentalYield}
                    onChange={e => handleChange('rentalYield', parseFloat(e.target.value) || '')}
                    placeholder="e.g., 8.5"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Management Company</label>
                  <input
                    type="text"
                    className="w-full border rounded px-3 py-2"
                    value={formData.managementCompany}
                    onChange={e => handleChange('managementCompany', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Property Manager</label>
                  <input
                    type="text"
                    className="w-full border rounded px-3 py-2"
                    value={formData.propertyManager}
                    onChange={e => handleChange('propertyManager', e.target.value)}
                  />
                </div>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="currentTenant"
                  className="mr-2"
                  checked={formData.currentTenant}
                  onChange={e => handleChange('currentTenant', e.target.checked)}
                />
                <label htmlFor="currentTenant" className="text-sm font-medium">
                  Property currently has tenant
                </label>
              </div>
            </div>
          )}

          {/* Step 3: Documents & Photos */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded p-4">
                <p className="text-sm text-blue-800">
                  📸 <strong>Property Photos & Documents:</strong> Upload high-quality photos and important documents to support your submission.
                </p>
              </div>

              {/* Property Photos Section */}
              <div>
                <label className="block text-sm font-medium mb-2">Property Photos *</label>
                <p className="text-xs text-gray-600 mb-2">Upload 3-10 high-quality photos showing exterior, interior, and key features</p>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    className="hidden"
                    id="property-photos"
                    onChange={(e) => {
                      const files = Array.from(e.target.files || []);
                      console.log('📸 Photos selected:', files.length);
                      // TODO: Handle file upload to object storage
                    }}
                  />
                  <label htmlFor="property-photos" className="cursor-pointer">
                    <div className="text-5xl mb-2">📸</div>
                    <p className="text-sm font-medium text-gray-700">Click to upload property photos</p>
                    <p className="text-xs text-gray-500 mt-1">JPG, PNG, WEBP up to 10MB each</p>
                  </label>
                </div>
              </div>

              {/* Documents Section */}
              <div>
                <label className="block text-sm font-medium mb-2">Property Documents (Optional)</label>
                <p className="text-xs text-gray-600 mb-2">Upload relevant documents (property deed, inspection reports, appraisals, etc.)</p>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
                  <input
                    type="file"
                    multiple
                    accept=".pdf,.doc,.docx"
                    className="hidden"
                    id="property-documents"
                    onChange={(e) => {
                      const files = Array.from(e.target.files || []);
                      console.log('📄 Documents selected:', files.length);
                      // TODO: Handle file upload to object storage
                    }}
                  />
                  <label htmlFor="property-documents" className="cursor-pointer">
                    <div className="text-5xl mb-2">📄</div>
                    <p className="text-sm font-medium text-gray-700">Click to upload documents</p>
                    <p className="text-xs text-gray-500 mt-1">PDF, DOC, DOCX up to 25MB each</p>
                  </label>
                </div>
              </div>

              {/* Virtual Tour URL */}
              <div>
                <label className="block text-sm font-medium mb-1">Virtual Tour URL (Optional)</label>
                <input
                  type="url"
                  className="w-full border rounded px-3 py-2"
                  value={formData.virtualTourUrl}
                  onChange={e => handleChange('virtualTourUrl', e.target.value)}
                  placeholder="https://virtualtour.example.com"
                />
              </div>

              {/* Contact Information */}
              <div>
                <label className="block text-sm font-medium mb-2">Contact Information</label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <input
                    type="text"
                    className="w-full border rounded px-3 py-2"
                    placeholder="Your Name"
                    value={formData.submitterName}
                    onChange={e => handleChange('submitterName', e.target.value)}
                  />
                  <input
                    type="email"
                    className="w-full border rounded px-3 py-2"
                    placeholder="Email"
                    value={formData.submitterEmail}
                    onChange={e => handleChange('submitterEmail', e.target.value)}
                  />
                  <input
                    type="tel"
                    className="w-full border rounded px-3 py-2"
                    placeholder="Phone"
                    value={formData.submitterPhone}
                    onChange={e => handleChange('submitterPhone', e.target.value)}
                  />
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
                <p className="text-xs text-yellow-800">
                  ℹ️ <strong>Note:</strong> Full file upload integration with cloud storage is coming soon. For now, photos and documents are logged for testing. You can proceed with the submission.
                </p>
              </div>
            </div>
          )}

          {/* Step 4: Review */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">📋 Submission Summary</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                  <div>
                    <p className="text-sm font-semibold text-gray-700">Property Name</p>
                    <p className="text-gray-900">{formData.propertyName}</p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-700">Location</p>
                    <p className="text-gray-900">{formData.city}, {formData.state}</p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-700">Purchase Price</p>
                    <p className="text-gray-900">{formData.purchasePrice} BNB</p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-700">Monthly Rent</p>
                    <p className="text-gray-900">{formData.monthlyRent} BNB</p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-700">Total Shares</p>
                    <p className="text-gray-900">{formData.totalShares}</p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-700">Price Per Share</p>
                    <p className="text-gray-900">{formData.pricePerShare} BNB</p>
                  </div>
                </div>

                <div className="mt-6 p-4 bg-white rounded border border-gray-200">
                  <p className="text-sm text-gray-600">
                    ✅ By submitting, you confirm that all information provided is accurate and that you have the authority to list this property for fractional investment.
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
              {currentStep < 4 ? (
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
                  {loading ? 'Submitting...' : 'Submit Property'}
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
