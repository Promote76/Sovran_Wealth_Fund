export interface ValidationRule {
  required?: boolean;
  min?: number;
  max?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: any) => boolean;
  message?: string;
}

export interface ValidationRules {
  [field: string]: ValidationRule[];
}

export interface ValidationErrors {
  [field: string]: string;
}

export class Validator {
  static validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  static validatePhone(phone: string): boolean {
    const phoneRegex = /^\+?[\d\s\-()]+$/;
    return phoneRegex.test(phone) && phone.replace(/\D/g, '').length >= 10;
  }

  static validateZipCode(zipCode: string): boolean {
    const usZipRegex = /^\d{5}(-\d{4})?$/;
    return usZipRegex.test(zipCode);
  }

  static validateSSN(ssn: string): boolean {
    const ssnRegex = /^\d{3}-?\d{2}-?\d{4}$/;
    return ssnRegex.test(ssn);
  }

  static validateCreditScore(score: number): boolean {
    return score >= 300 && score <= 850;
  }

  static validatePassword(password: string): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (password.length < 8) {
      errors.push('Password must be at least 8 characters');
    }
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }
    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }
    if (!/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  static validateField(
    value: any,
    rules: ValidationRule[]
  ): string | null {
    for (const rule of rules) {
      if (rule.required && !value) {
        return rule.message || 'This field is required';
      }

      if (value) {
        if (rule.min !== undefined && Number(value) < rule.min) {
          return rule.message || `Value must be at least ${rule.min}`;
        }

        if (rule.max !== undefined && Number(value) > rule.max) {
          return rule.message || `Value must be at most ${rule.max}`;
        }

        if (rule.minLength !== undefined && String(value).length < rule.minLength) {
          return rule.message || `Must be at least ${rule.minLength} characters`;
        }

        if (rule.maxLength !== undefined && String(value).length > rule.maxLength) {
          return rule.message || `Must be at most ${rule.maxLength} characters`;
        }

        if (rule.pattern && !rule.pattern.test(String(value))) {
          return rule.message || 'Invalid format';
        }

        if (rule.custom && !rule.custom(value)) {
          return rule.message || 'Validation failed';
        }
      }
    }

    return null;
  }

  static validateForm(
    data: { [key: string]: any },
    rules: ValidationRules
  ): ValidationErrors {
    const errors: ValidationErrors = {};

    for (const [field, fieldRules] of Object.entries(rules)) {
      const error = this.validateField(data[field], fieldRules);
      if (error) {
        errors[field] = error;
      }
    }

    return errors;
  }

  static hasErrors(errors: ValidationErrors): boolean {
    return Object.keys(errors).length > 0;
  }
}

export const commonRules = {
  email: [
    { required: true, message: 'Email is required' },
    {
      custom: (value: string) => Validator.validateEmail(value),
      message: 'Please enter a valid email address'
    }
  ],

  phone: [
    { required: true, message: 'Phone number is required' },
    {
      custom: (value: string) => Validator.validatePhone(value),
      message: 'Please enter a valid phone number'
    }
  ],

  zipCode: [
    { required: true, message: 'ZIP code is required' },
    {
      custom: (value: string) => Validator.validateZipCode(value),
      message: 'Please enter a valid ZIP code'
    }
  ],

  password: [
    { required: true, message: 'Password is required' },
    { minLength: 8, message: 'Password must be at least 8 characters' },
    {
      custom: (value: string) => Validator.validatePassword(value).isValid,
      message: 'Password must contain uppercase, lowercase, number, and special character'
    }
  ],

  creditScore: [
    { required: true, message: 'Credit score is required' },
    {
      custom: (value: number) => Validator.validateCreditScore(value),
      message: 'Credit score must be between 300 and 850'
    }
  ],

  positiveNumber: [
    { required: true, message: 'This field is required' },
    { min: 0, message: 'Value must be positive' }
  ],

  requiredText: [
    { required: true, message: 'This field is required' },
    { minLength: 1, message: 'This field cannot be empty' }
  ]
};
