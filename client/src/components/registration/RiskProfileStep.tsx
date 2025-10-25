import React, { useState } from 'react';
import { FormSection, FormField } from '../shared/FormSection';
import { ValidationErrors } from '../../lib/validation';
import { UnifiedRiskProfile } from '../../types/registration';

interface RiskProfileStepProps {
  initialData?: Partial<UnifiedRiskProfile>;
  onSubmit: (data: UnifiedRiskProfile) => Promise<boolean>;
  onBack?: () => void;
}

const RISK_TOLERANCE_OPTIONS = [
  { label: 'Conservative - Preserve capital, minimal risk', value: 'conservative' },
  { label: 'Moderate - Balance growth and security', value: 'moderate' },
  { label: 'Aggressive - Maximum growth, accept volatility', value: 'aggressive' }
];

const EXPERIENCE_OPTIONS = [
  { label: 'No experience', value: 'none' },
  { label: 'Beginner (< 2 years)', value: 'beginner' },
  { label: 'Intermediate (2-5 years)', value: 'intermediate' },
  { label: 'Advanced (5+ years)', value: 'advanced' }
];

const HORIZON_OPTIONS = [
  { label: '1-3 years', value: '1-3' },
  { label: '3-5 years', value: '3-5' },
  { label: '5-10 years', value: '5-10' },
  { label: '10+ years', value: '10+' }
];

const LIQUIDITY_OPTIONS = [
  { label: 'High - Need access to funds quickly', value: 'high' },
  { label: 'Medium - Some flexibility needed', value: 'medium' },
  { label: 'Low - Can lock funds long-term', value: 'low' }
];

export function RiskProfileStep({ initialData, onSubmit, onBack }: RiskProfileStepProps) {
  const [formData, setFormData] = useState<Partial<UnifiedRiskProfile>>({
    riskTolerance: undefined,
    investmentExperience: undefined,
    investmentHorizon: undefined,
    liquidityNeeds: undefined,
    investmentKnowledge: [],
    hasRealEstateExperience: false,
    hasCryptoExperience: false,
    hasStockExperience: false,
    portfolioDiversification: 5,
    comfortWithVolatility: 5,
    lossComfort: 5,
    ...initialData
  });

  const [errors, setErrors] = useState<ValidationErrors>({});
  const [submitting, setSubmitting] = useState(false);

  const updateField = (field: keyof UnifiedRiskProfile, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const validateForm = (): boolean => {
    const newErrors: ValidationErrors = {};

    if (!formData.riskTolerance) {
      newErrors.riskTolerance = 'Risk tolerance is required';
    }

    if (!formData.investmentExperience) {
      newErrors.investmentExperience = 'Investment experience is required';
    }

    if (!formData.investmentHorizon) {
      newErrors.investmentHorizon = 'Investment horizon is required';
    }

    if (!formData.liquidityNeeds) {
      newErrors.liquidityNeeds = 'Liquidity needs are required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setSubmitting(true);
    try {
      const success = await onSubmit(formData as UnifiedRiskProfile);
      if (!success) {
        setErrors({ submit: 'Failed to save risk profile. Please try again.' });
      }
    } catch (error) {
      console.error('Submit error:', error);
      setErrors({ submit: 'An error occurred. Please try again.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {errors.submit && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          ⚠️ {errors.submit}
        </div>
      )}

      <FormSection
        title="Investment Profile"
        description="Help us understand your investment goals"
        icon="🎯"
        required
      >
        <FormField
          label="Risk Tolerance"
          name="riskTolerance"
          type="select"
          value={formData.riskTolerance || ''}
          onChange={(v) => updateField('riskTolerance', v)}
          required
          error={errors.riskTolerance}
          options={RISK_TOLERANCE_OPTIONS}
          helpText="How much risk are you comfortable taking?"
        />

        <FormField
          label="Investment Experience"
          name="investmentExperience"
          type="select"
          value={formData.investmentExperience || ''}
          onChange={(v) => updateField('investmentExperience', v)}
          required
          error={errors.investmentExperience}
          options={EXPERIENCE_OPTIONS}
          helpText="Your overall investment experience level"
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            label="Investment Horizon"
            name="investmentHorizon"
            type="select"
            value={formData.investmentHorizon || ''}
            onChange={(v) => updateField('investmentHorizon', v)}
            required
            error={errors.investmentHorizon}
            options={HORIZON_OPTIONS}
            helpText="How long can you invest?"
          />

          <FormField
            label="Liquidity Needs"
            name="liquidityNeeds"
            type="select"
            value={formData.liquidityNeeds || ''}
            onChange={(v) => updateField('liquidityNeeds', v)}
            required
            error={errors.liquidityNeeds}
            options={LIQUIDITY_OPTIONS}
          />
        </div>
      </FormSection>

      <FormSection
        title="Investment Experience"
        description="What types of investments have you worked with?"
        icon="📚"
      >
        <div className="space-y-3">
          <FormField
            label=""
            name="hasStockExperience"
            type="checkbox"
            value={formData.hasStockExperience || false}
            onChange={(v) => updateField('hasStockExperience', v)}
            placeholder="I have experience with stocks and ETFs"
          />

          <FormField
            label=""
            name="hasRealEstateExperience"
            type="checkbox"
            value={formData.hasRealEstateExperience || false}
            onChange={(v) => updateField('hasRealEstateExperience', v)}
            placeholder="I have experience with real estate investing"
          />

          <FormField
            label=""
            name="hasCryptoExperience"
            type="checkbox"
            value={formData.hasCryptoExperience || false}
            onChange={(v) => updateField('hasCryptoExperience', v)}
            placeholder="I have experience with cryptocurrency"
          />
        </div>
      </FormSection>

      <FormSection
        title="Investment Preferences"
        description="Rate your preferences on a scale of 1-10"
        icon="⚖️"
      >
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Portfolio Diversification Importance: {formData.portfolioDiversification}/10
            </label>
            <input
              type="range"
              min="1"
              max="10"
              value={formData.portfolioDiversification || 5}
              onChange={(e) => updateField('portfolioDiversification', parseInt(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>Not Important</span>
              <span>Very Important</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Comfort with Market Volatility: {formData.comfortWithVolatility}/10
            </label>
            <input
              type="range"
              min="1"
              max="10"
              value={formData.comfortWithVolatility || 5}
              onChange={(e) => updateField('comfortWithVolatility', parseInt(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>Very Uncomfortable</span>
              <span>Very Comfortable</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Maximum Acceptable Loss: {formData.lossComfort}/10 ({formData.lossComfort ? formData.lossComfort * 10 : 50}%)
            </label>
            <input
              type="range"
              min="1"
              max="10"
              value={formData.lossComfort || 5}
              onChange={(e) => updateField('lossComfort', parseInt(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>10% Loss Max</span>
              <span>100% Loss Acceptable</span>
            </div>
          </div>
        </div>
      </FormSection>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <div className="text-2xl">💡</div>
          <div>
            <h4 className="font-semibold text-blue-900 mb-1">Risk Profile Summary</h4>
            <p className="text-sm text-blue-700">
              Based on your selections, we'll recommend investment opportunities that match 
              your risk tolerance, experience level, and investment goals.
            </p>
          </div>
        </div>
      </div>

      <div className="flex justify-between pt-4">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="px-4 py-2 md:px-6 md:py-3 border border-gray-300 rounded-lg hover:bg-gray-50"
            disabled={submitting}
          >
            ← Back
          </button>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="ml-auto px-4 py-2 md:px-6 md:py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg disabled:opacity-50"
        >
          {submitting ? 'Saving...' : 'Continue to Programs →'}
        </button>
      </div>
    </form>
  );
}
