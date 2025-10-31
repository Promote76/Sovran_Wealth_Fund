import React, { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';

interface LandSubmissionData {
  // Property Name & Location
  propertyName: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  
  // Land Details
  acreage: number | '';
  pricePerAcre: number | '';
  askingPrice: number | '';
  landUseType: string;
  
  // Income Sources
  annualIncome: number | '';
  incomeStreams: string[];
  
  // CRP Details
  crpEnrolled: boolean;
  crpAcres: number | '';
  crpAnnualPayment: number | '';
  crpContractExpires: string;
  
  // Timber Details
  timberAcres: number | '';
  timberSpecies: string;
  timberAge: number | '';
  timberAnnualIncome: number | '';
  
  // Land Features
  waterFeatures: string;
  pondAcres: number | '';
  pastureAcres: number | '';
  structures: string;
  utilities: string;
  
  // Contact Information
  sellerName: string;
  sellerPhone: string;
  sellerEmail: string;
  listingUrl: string;
}

const initialFormData: LandSubmissionData = {
  propertyName: '',
  address: '',
  city: '',
  state: '',
  zipCode: '',
  acreage: '',
  pricePerAcre: '',
  askingPrice: '',
  landUseType: 'farm',
  annualIncome: '',
  incomeStreams: [],
  crpEnrolled: false,
  crpAcres: '',
  crpAnnualPayment: '',
  crpContractExpires: '',
  timberAcres: '',
  timberSpecies: '',
  timberAge: '',
  timberAnnualIncome: '',
  waterFeatures: '',
  pondAcres: '',
  pastureAcres: '',
  structures: '',
  utilities: '',
  sellerName: '',
  sellerPhone: '',
  sellerEmail: '',
  listingUrl: ''
};

const INCOME_STREAM_OPTIONS = [
  'CRP payments',
  'Timber sales',
  'Hunting leases',
  'Grazing leases',
  'Hay production',
  'Pine straw',
  'Land appreciation',
  'Mineral rights'
];

export default function LandSubmissionForm({ onClose }: { onClose: () => void }) {
  const [formData, setFormData] = useState<LandSubmissionData>(initialFormData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleChange = (field: keyof LandSubmissionData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Auto-calculate price per acre when acreage or asking price changes
    if (field === 'acreage' || field === 'askingPrice') {
      const acreage = field === 'acreage' ? Number(value) : Number(formData.acreage);
      const asking = field === 'askingPrice' ? Number(value) : Number(formData.askingPrice);
      
      if (acreage > 0 && asking > 0) {
        setFormData(prev => ({
          ...prev,
          [field]: value,
          pricePerAcre: Number((asking / acreage).toFixed(0))
        }));
      }
    }
  };

  const toggleIncomeStream = (stream: string) => {
    setFormData(prev => ({
      ...prev,
      incomeStreams: prev.incomeStreams.includes(stream)
        ? prev.incomeStreams.filter(s => s !== stream)
        : [...prev.incomeStreams, stream]
    }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError('');

    try {
      // Build raw text for IELA parser
      const rawText = `
Property Name: ${formData.propertyName}
Address: ${formData.address}, ${formData.city}, ${formData.state} ${formData.zipCode}
Acreage: ${formData.acreage} acres
Price: $${formData.askingPrice.toLocaleString()} (≈ $${formData.pricePerAcre} / acre)
${formData.crpEnrolled ? `CRP: ${formData.crpAcres} acres enrolled (~$${formData.crpAnnualPayment} / yr income)` : ''}
${formData.timberAcres ? `Timber: ${formData.timberAcres} acres of ${formData.timberSpecies} (${formData.timberAge} years old)` : ''}
${formData.waterFeatures ? `Water Features: ${formData.waterFeatures}` : ''}
${formData.pondAcres ? `Pond: ${formData.pondAcres} acres` : ''}
${formData.pastureAcres ? `Pasture: ${formData.pastureAcres} acres` : ''}
${formData.structures ? `Structures: ${formData.structures}` : ''}
${formData.utilities ? `Utilities: ${formData.utilities}` : ''}
Annual Income: $${formData.annualIncome} (${formData.incomeStreams.join(', ')})
Land Use: ${formData.landUseType}
Agent: ${formData.sellerName} (${formData.sellerPhone})
${formData.listingUrl ? `Listing: ${formData.listingUrl}` : ''}
      `.trim();

      // Submit to IELA pipeline
      const ingestResponse = await fetch('/api/deals/ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source: 'land-form',
          rawText,
          sellerName: formData.sellerName,
          sellerPhone: formData.sellerPhone,
          sellerEmail: formData.sellerEmail
        })
      });

      if (!ingestResponse.ok) {
        throw new Error('Failed to submit land listing');
      }

      const ingestData = await ingestResponse.json();
      const dealId = ingestData.data.id;

      // Enrich the deal
      await fetch(`/api/deals/${dealId}/enrich`, { method: 'POST' });

      // Analyze the deal
      await fetch(`/api/deals/${dealId}/analyze`, { method: 'POST' });

      setSuccess(true);
      setTimeout(() => {
        onClose();
        window.location.href = `/deals/${dealId}`;
      }, 2000);

    } catch (err: any) {
      setError(err.message || 'Failed to submit land listing');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <div className="text-6xl mb-4">✅</div>
            <h2 className="text-2xl font-bold text-green-600 mb-2">Success!</h2>
            <p className="text-gray-600">Land listing submitted successfully</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <Card className="max-w-4xl w-full my-8">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="text-2xl">Submit Land Listing</CardTitle>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              ✕
            </button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {/* Property Name & Location */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Property Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">Property Name *</label>
                <input
                  type="text"
                  value={formData.propertyName}
                  onChange={(e) => handleChange('propertyName', e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="The Patterson Farm"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">Address *</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => handleChange('address', e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="0 Cheek Road"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">City *</label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => handleChange('city', e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">State *</label>
                <input
                  type="text"
                  value={formData.state}
                  onChange={(e) => handleChange('state', e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                  maxLength={2}
                  placeholder="GA"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Zip Code *</label>
                <input
                  type="text"
                  value={formData.zipCode}
                  onChange={(e) => handleChange('zipCode', e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
            </div>
          </div>

          {/* Pricing & Acreage */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Pricing</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Acreage *</label>
                <input
                  type="number"
                  value={formData.acreage}
                  onChange={(e) => handleChange('acreage', e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="120"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Asking Price *</label>
                <input
                  type="number"
                  value={formData.askingPrice}
                  onChange={(e) => handleChange('askingPrice', e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="636000"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Price Per Acre</label>
                <input
                  type="number"
                  value={formData.pricePerAcre}
                  readOnly
                  className="w-full px-3 py-2 border rounded-lg bg-gray-50"
                  placeholder="Auto-calculated"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Land Use Type</label>
              <select
                value={formData.landUseType}
                onChange={(e) => handleChange('landUseType', e.target.value)}
                className="w-full px-3 py-2 border rounded-lg"
              >
                <option value="farm">Farm</option>
                <option value="recreational">Recreational</option>
                <option value="timber">Timber</option>
                <option value="development">Development</option>
                <option value="mixed-use">Mixed Use</option>
              </select>
            </div>
          </div>

          {/* CRP Details */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">CRP Enrollment</h3>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={formData.crpEnrolled}
                onChange={(e) => handleChange('crpEnrolled', e.target.checked)}
                className="w-4 h-4"
              />
              <label className="text-sm font-medium">Property has CRP enrollment</label>
            </div>
            {formData.crpEnrolled && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">CRP Acres</label>
                  <input
                    type="number"
                    value={formData.crpAcres}
                    onChange={(e) => handleChange('crpAcres', e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg"
                    placeholder="48"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Annual CRP Payment</label>
                  <input
                    type="number"
                    value={formData.crpAnnualPayment}
                    onChange={(e) => handleChange('crpAnnualPayment', e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg"
                    placeholder="15000"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Contract Expires</label>
                  <input
                    type="text"
                    value={formData.crpContractExpires}
                    onChange={(e) => handleChange('crpContractExpires', e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg"
                    placeholder="2030"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Timber Details */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Timber</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Timber Acres</label>
                <input
                  type="number"
                  value={formData.timberAcres}
                  onChange={(e) => handleChange('timberAcres', e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="48"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Species</label>
                <input
                  type="text"
                  value={formData.timberSpecies}
                  onChange={(e) => handleChange('timberSpecies', e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="Longleaf Pine"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Age (years)</label>
                <input
                  type="number"
                  value={formData.timberAge}
                  onChange={(e) => handleChange('timberAge', e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="15"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Annual Income</label>
                <input
                  type="number"
                  value={formData.timberAnnualIncome}
                  onChange={(e) => handleChange('timberAnnualIncome', e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="5000"
                />
              </div>
            </div>
          </div>

          {/* Land Features */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Land Features</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Pasture Acres</label>
                <input
                  type="number"
                  value={formData.pastureAcres}
                  onChange={(e) => handleChange('pastureAcres', e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="38"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Pond Acres</label>
                <input
                  type="number"
                  value={formData.pondAcres}
                  onChange={(e) => handleChange('pondAcres', e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="10"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">Water Features</label>
                <textarea
                  value={formData.waterFeatures}
                  onChange={(e) => handleChange('waterFeatures', e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                  rows={2}
                  placeholder="10-acre stocked pond with trophy bass, 2 additional ponds, multiple wells"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">Structures</label>
                <textarea
                  value={formData.structures}
                  onChange={(e) => handleChange('structures', e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                  rows={2}
                  placeholder="60×100 steel barn for storage, hay, equipment, or RV conversion"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">Utilities</label>
                <textarea
                  value={formData.utilities}
                  onChange={(e) => handleChange('utilities', e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                  rows={2}
                  placeholder="3-phase power, fiber internet, multiple wells"
                />
              </div>
            </div>
          </div>

          {/* Income */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Income Streams</h3>
            <div>
              <label className="block text-sm font-medium mb-1">Total Annual Income *</label>
              <input
                type="number"
                value={formData.annualIncome}
                onChange={(e) => handleChange('annualIncome', e.target.value)}
                className="w-full px-3 py-2 border rounded-lg"
                placeholder="15000"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Income Sources (select all that apply)</label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {INCOME_STREAM_OPTIONS.map(stream => (
                  <div key={stream} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.incomeStreams.includes(stream)}
                      onChange={() => toggleIncomeStream(stream)}
                      className="w-4 h-4"
                    />
                    <label className="text-sm">{stream}</label>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Contact Info */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Agent/Seller Contact</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Name</label>
                <input
                  type="text"
                  value={formData.sellerName}
                  onChange={(e) => handleChange('sellerName', e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="Jack Frankhouser"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Phone</label>
                <input
                  type="text"
                  value={formData.sellerPhone}
                  onChange={(e) => handleChange('sellerPhone', e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="478-242-5932"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <input
                  type="email"
                  value={formData.sellerEmail}
                  onChange={(e) => handleChange('sellerEmail', e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div className="md:col-span-3">
                <label className="block text-sm font-medium mb-1">Listing URL</label>
                <input
                  type="url"
                  value={formData.listingUrl}
                  onChange={(e) => handleChange('listingUrl', e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="https://www.land.com/property/..."
                />
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button
              onClick={onClose}
              className="bg-gray-300 hover:bg-gray-400 text-gray-800"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={loading || !formData.propertyName || !formData.askingPrice || !formData.acreage}
              className="bg-green-600 hover:bg-green-700"
            >
              {loading ? 'Submitting...' : 'Submit Land Listing'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
