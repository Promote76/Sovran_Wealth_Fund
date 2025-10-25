import React, { useState, useEffect } from 'react';
import { FormSection, FormField } from '../shared/FormSection';
import { Validator, commonRules, ValidationErrors } from '../../lib/validation';
import { UnifiedPersonalProfile } from '../../types/registration';

interface PersonalProfileStepProps {
  initialData?: Partial<UnifiedPersonalProfile>;
  onSubmit: (data: UnifiedPersonalProfile) => Promise<boolean>;
  onBack?: () => void;
}

const US_STATES = [
  'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut',
  'Delaware', 'Florida', 'Georgia', 'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa',
  'Kansas', 'Kentucky', 'Louisiana', 'Maine', 'Maryland', 'Massachusetts', 'Michigan',
  'Minnesota', 'Mississippi', 'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire',
  'New Jersey', 'New Mexico', 'New York', 'North Carolina', 'North Dakota', 'Ohio',
  'Oklahoma', 'Oregon', 'Pennsylvania', 'Rhode Island', 'South Carolina', 'South Dakota',
  'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia', 'Washington', 'West Virginia',
  'Wisconsin', 'Wyoming'
];

const EMPLOYMENT_STATUS_OPTIONS = [
  { label: 'Employed Full-Time', value: 'employed_full_time' },
  { label: 'Employed Part-Time', value: 'employed_part_time' },
  { label: 'Self-Employed', value: 'self_employed' },
  { label: 'Unemployed', value: 'unemployed' },
  { label: 'Retired', value: 'retired' },
  { label: 'Student', value: 'student' }
];

export function PersonalProfileStep({ initialData, onSubmit, onBack }: PersonalProfileStepProps) {
  const [formData, setFormData] = useState<Partial<UnifiedPersonalProfile>>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    country: 'United States',
    state: '',
    city: '',
    zipCode: '',
    address: '',
    employmentStatus: '',
    employmentYears: 0,
    employer: '',
    occupation: '',
    ...initialData
  });

  const [errors, setErrors] = useState<ValidationErrors>({});
  const [submitting, setSubmitting] = useState(false);

  const updateField = (field: keyof UnifiedPersonalProfile, value: any) => {
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

    if (!formData.firstName?.trim()) {
      newErrors.firstName = 'First name is required';
    }

    if (!formData.lastName?.trim()) {
      newErrors.lastName = 'Last name is required';
    }

    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!Validator.validateEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (formData.phone && !Validator.validatePhone(formData.phone)) {
      newErrors.phone = 'Please enter a valid phone number';
    }

    if (!formData.state) {
      newErrors.state = 'State is required';
    }

    if (!formData.city?.trim()) {
      newErrors.city = 'City is required';
    }

    if (!formData.zipCode) {
      newErrors.zipCode = 'ZIP code is required';
    } else if (!Validator.validateZipCode(formData.zipCode)) {
      newErrors.zipCode = 'Please enter a valid ZIP code';
    }

    if (!formData.employmentStatus) {
      newErrors.employmentStatus = 'Employment status is required';
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
      const success = await onSubmit(formData as UnifiedPersonalProfile);
      if (!success) {
        setErrors({ submit: 'Failed to save profile. Please try again.' });
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
        title="Personal Information"
        description="Let's start with your basic information"
        icon="👤"
        required
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            label="First Name"
            name="firstName"
            value={formData.firstName || ''}
            onChange={(v) => updateField('firstName', v)}
            required
            error={errors.firstName}
            placeholder="John"
          />

          <FormField
            label="Last Name"
            name="lastName"
            value={formData.lastName || ''}
            onChange={(v) => updateField('lastName', v)}
            required
            error={errors.lastName}
            placeholder="Smith"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            label="Email"
            name="email"
            type="email"
            value={formData.email || ''}
            onChange={(v) => updateField('email', v)}
            required
            error={errors.email}
            placeholder="john.smith@example.com"
          />

          <FormField
            label="Phone Number"
            name="phone"
            type="tel"
            value={formData.phone || ''}
            onChange={(v) => updateField('phone', v)}
            error={errors.phone}
            placeholder="+1 (555) 123-4567"
            helpText="Include country code"
          />
        </div>
      </FormSection>

      <FormSection
        title="Address"
        description="Where do you currently reside?"
        icon="🏠"
        required
      >
        <FormField
          label="Street Address"
          name="address"
          value={formData.address || ''}
          onChange={(v) => updateField('address', v)}
          error={errors.address}
          placeholder="123 Main Street, Apt 4B"
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormField
            label="City"
            name="city"
            value={formData.city || ''}
            onChange={(v) => updateField('city', v)}
            required
            error={errors.city}
            placeholder="New York"
          />

          <FormField
            label="State"
            name="state"
            type="select"
            value={formData.state || ''}
            onChange={(v) => updateField('state', v)}
            required
            error={errors.state}
            options={US_STATES.map(state => ({ label: state, value: state }))}
          />

          <FormField
            label="ZIP Code"
            name="zipCode"
            value={formData.zipCode || ''}
            onChange={(v) => updateField('zipCode', v)}
            required
            error={errors.zipCode}
            placeholder="10001"
          />
        </div>
      </FormSection>

      <FormSection
        title="Employment"
        description="Tell us about your current employment"
        icon="💼"
        required
      >
        <FormField
          label="Employment Status"
          name="employmentStatus"
          type="select"
          value={formData.employmentStatus || ''}
          onChange={(v) => updateField('employmentStatus', v)}
          required
          error={errors.employmentStatus}
          options={EMPLOYMENT_STATUS_OPTIONS}
        />

        {formData.employmentStatus && 
         !['unemployed', 'retired', 'student'].includes(formData.employmentStatus) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              label="Employer"
              name="employer"
              value={formData.employer || ''}
              onChange={(v) => updateField('employer', v)}
              error={errors.employer}
              placeholder="Company Name"
            />

            <FormField
              label="Occupation"
              name="occupation"
              value={formData.occupation || ''}
              onChange={(v) => updateField('occupation', v)}
              error={errors.occupation}
              placeholder="Software Engineer"
            />
          </div>
        )}

        {formData.employmentStatus && 
         !['unemployed', 'student'].includes(formData.employmentStatus) && (
          <FormField
            label="Years Employed"
            name="employmentYears"
            type="number"
            value={formData.employmentYears || 0}
            onChange={(v) => updateField('employmentYears', v)}
            error={errors.employmentYears}
            min={0}
            max={60}
            helpText="Total years of employment experience"
          />
        )}
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
