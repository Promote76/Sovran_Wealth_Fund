import React, { useState } from 'react';
import { FormSection, FormField } from '../shared/FormSection';
import { ValidationErrors } from '../../lib/validation';
import { UnifiedFinancialProfile } from '../../types/registration';

interface FinancialProfileStepProps {
  initialData?: Partial<UnifiedFinancialProfile>;
  onSubmit: (data: UnifiedFinancialProfile) => Promise<boolean>;
  onBack?: () => void;
}

const INCOME_SOURCE_OPTIONS = [
  { label: 'Employment', value: 'employment' },
  { label: 'Self-Employment', value: 'self_employment' },
  { label: 'Investment Income', value: 'investment' },
  { label: 'Rental Income', value: 'rental' },
  { label: 'Retirement', value: 'retirement' },
  { label: 'Multiple Sources', value: 'multiple' },
  { label: 'Other', value: 'other' }
];

export function FinancialProfileStep({ initialData, onSubmit, onBack }: FinancialProfileStepProps) {
  const [formData, setFormData] = useState<Partial<UnifiedFinancialProfile>>({
    annualIncome: undefined,
    monthlyIncome: undefined,
    incomeSource: '',
    totalNetWorth: undefined,
    liquidAssets: undefined,
    realEstateValue: undefined,
    investmentValue: undefined,
    totalDebt: undefined,
    monthlyDebt: undefined,
    monthlyExpenses: undefined,
    emergencyFund: undefined,
    currentSavings: undefined,
    monthlySavings: undefined,
    creditScore: undefined,
    hasBankruptcy: false,
    hasForeclosure: false,
    ...initialData
  });

  const [errors, setErrors] = useState<ValidationErrors>({});
  const [submitting, setSubmitting] = useState(false);

  const updateField = (field: keyof UnifiedFinancialProfile, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    if (field === 'annualIncome' && value) {
      setFormData(prev => ({ ...prev, monthlyIncome: Math.round(value / 12) }));
    }
    
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

    if (!formData.annualIncome || formData.annualIncome <= 0) {
      newErrors.annualIncome = 'Annual income is required';
    }

    if (!formData.incomeSource) {
      newErrors.incomeSource = 'Income source is required';
    }

    if (formData.creditScore && (formData.creditScore < 300 || formData.creditScore > 850)) {
      newErrors.creditScore = 'Credit score must be between 300 and 850';
    }

    if (formData.totalDebt && formData.totalDebt < 0) {
      newErrors.totalDebt = 'Debt cannot be negative';
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
      const success = await onSubmit(formData as UnifiedFinancialProfile);
      if (!success) {
        setErrors({ submit: 'Failed to save financial profile. Please try again.' });
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
        title="Income Information"
        description="Help us understand your income"
        icon="💰"
        required
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            label="Annual Income"
            name="annualIncome"
            type="number"
            value={formData.annualIncome || ''}
            onChange={(v) => updateField('annualIncome', v)}
            required
            error={errors.annualIncome}
            placeholder="75000"
            min={0}
            step={1000}
            helpText="Your total annual income before taxes"
          />

          <FormField
            label="Monthly Income"
            name="monthlyIncome"
            type="number"
            value={formData.monthlyIncome || ''}
            onChange={(v) => updateField('monthlyIncome', v)}
            placeholder="6250"
            disabled
            helpText="Calculated automatically"
          />
        </div>

        <FormField
          label="Primary Income Source"
          name="incomeSource"
          type="select"
          value={formData.incomeSource || ''}
          onChange={(v) => updateField('incomeSource', v)}
          required
          error={errors.incomeSource}
          options={INCOME_SOURCE_OPTIONS}
        />
      </FormSection>

      <FormSection
        title="Assets & Net Worth"
        description="Your current financial position (optional but helpful)"
        icon="💎"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            label="Total Net Worth"
            name="totalNetWorth"
            type="number"
            value={formData.totalNetWorth || ''}
            onChange={(v) => updateField('totalNetWorth', v)}
            error={errors.totalNetWorth}
            placeholder="150000"
            min={0}
            step={1000}
            helpText="Total assets minus total debts"
          />

          <FormField
            label="Liquid Assets"
            name="liquidAssets"
            type="number"
            value={formData.liquidAssets || ''}
            onChange={(v) => updateField('liquidAssets', v)}
            error={errors.liquidAssets}
            placeholder="25000"
            min={0}
            step={1000}
            helpText="Cash, savings, checking accounts"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            label="Real Estate Value"
            name="realEstateValue"
            type="number"
            value={formData.realEstateValue || ''}
            onChange={(v) => updateField('realEstateValue', v)}
            error={errors.realEstateValue}
            placeholder="200000"
            min={0}
            step={1000}
            helpText="Current value of properties owned"
          />

          <FormField
            label="Investment Value"
            name="investmentValue"
            type="number"
            value={formData.investmentValue || ''}
            onChange={(v) => updateField('investmentValue', v)}
            error={errors.investmentValue}
            placeholder="50000"
            min={0}
            step={1000}
            helpText="Stocks, bonds, crypto, etc."
          />
        </div>
      </FormSection>

      <FormSection
        title="Debt & Expenses"
        description="Your monthly financial obligations"
        icon="📊"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            label="Total Debt"
            name="totalDebt"
            type="number"
            value={formData.totalDebt || ''}
            onChange={(v) => updateField('totalDebt', v)}
            error={errors.totalDebt}
            placeholder="30000"
            min={0}
            step={1000}
            helpText="Total outstanding debt"
          />

          <FormField
            label="Monthly Debt Payments"
            name="monthlyDebt"
            type="number"
            value={formData.monthlyDebt || ''}
            onChange={(v) => updateField('monthlyDebt', v)}
            error={errors.monthlyDebt}
            placeholder="1500"
            min={0}
            step={100}
            helpText="Total monthly debt payments"
          />
        </div>

        <FormField
          label="Monthly Expenses"
          name="monthlyExpenses"
          type="number"
          value={formData.monthlyExpenses || ''}
          onChange={(v) => updateField('monthlyExpenses', v)}
          error={errors.monthlyExpenses}
          placeholder="3000"
          min={0}
          step={100}
          helpText="All monthly expenses (housing, food, etc.)"
        />
      </FormSection>

      <FormSection
        title="Savings & Credit"
        description="Your savings capacity and credit history"
        icon="🏦"
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormField
            label="Emergency Fund"
            name="emergencyFund"
            type="number"
            value={formData.emergencyFund || ''}
            onChange={(v) => updateField('emergencyFund', v)}
            error={errors.emergencyFund}
            placeholder="10000"
            min={0}
            step={1000}
          />

          <FormField
            label="Current Savings"
            name="currentSavings"
            type="number"
            value={formData.currentSavings || ''}
            onChange={(v) => updateField('currentSavings', v)}
            error={errors.currentSavings}
            placeholder="15000"
            min={0}
            step={1000}
          />

          <FormField
            label="Monthly Savings"
            name="monthlySavings"
            type="number"
            value={formData.monthlySavings || ''}
            onChange={(v) => updateField('monthlySavings', v)}
            error={errors.monthlySavings}
            placeholder="500"
            min={0}
            step={50}
          />
        </div>

        <FormField
          label="Credit Score (Optional)"
          name="creditScore"
          type="number"
          value={formData.creditScore || ''}
          onChange={(v) => updateField('creditScore', v)}
          error={errors.creditScore}
          placeholder="720"
          min={300}
          max={850}
          helpText="Between 300 and 850"
        />

        <div className="space-y-3">
          <FormField
            label=""
            name="hasBankruptcy"
            type="checkbox"
            value={formData.hasBankruptcy || false}
            onChange={(v) => updateField('hasBankruptcy', v)}
            placeholder="I have filed for bankruptcy in the past 7 years"
          />

          <FormField
            label=""
            name="hasForeclosure"
            type="checkbox"
            value={formData.hasForeclosure || false}
            onChange={(v) => updateField('hasForeclosure', v)}
            placeholder="I have had a foreclosure in the past 7 years"
          />
        </div>
      </FormSection>

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
          {submitting ? 'Saving...' : 'Continue →'}
        </button>
      </div>
    </form>
  );
}
