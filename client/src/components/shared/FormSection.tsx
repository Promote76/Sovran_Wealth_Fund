import React from 'react';

interface FormSectionProps {
  title: string;
  description?: string;
  icon?: string;
  children: React.ReactNode;
  required?: boolean;
  error?: string;
  className?: string;
}

export function FormSection({
  title,
  description,
  icon,
  children,
  required = false,
  error,
  className = ''
}: FormSectionProps) {
  return (
    <div className={`space-y-4 ${className}`}>
      {/* Section Header */}
      <div className="flex items-start gap-3">
        {icon && (
          <div className="text-2xl md:text-3xl flex-shrink-0">
            {icon}
          </div>
        )}
        <div className="flex-1">
          <h3 className="text-lg md:text-xl font-semibold text-gray-900 flex items-center gap-2">
            {title}
            {required && (
              <span className="text-red-500 text-sm">*</span>
            )}
          </h3>
          {description && (
            <p className="text-sm text-gray-600 mt-1">{description}</p>
          )}
          {error && (
            <div className="mt-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              ⚠️ {error}
            </div>
          )}
        </div>
      </div>

      {/* Section Content */}
      <div className="pl-0 md:pl-11 space-y-4">
        {children}
      </div>
    </div>
  );
}

interface FormFieldProps {
  label: string;
  name: string;
  type?: string;
  value: any;
  onChange: (value: any) => void;
  required?: boolean;
  error?: string;
  placeholder?: string;
  helpText?: string;
  options?: { label: string; value: any }[];
  min?: number;
  max?: number;
  step?: number;
  className?: string;
  disabled?: boolean;
}

export function FormField({
  label,
  name,
  type = 'text',
  value,
  onChange,
  required = false,
  error,
  placeholder,
  helpText,
  options,
  min,
  max,
  step,
  className = '',
  disabled = false
}: FormFieldProps) {
  const inputId = `field-${name}`;

  const renderInput = () => {
    const baseClasses = `w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
      error ? 'border-red-500' : 'border-gray-300'
    } ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}`;

    switch (type) {
      case 'select':
        return (
          <select
            id={inputId}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className={baseClasses}
            required={required}
            disabled={disabled}
          >
            <option value="">Select...</option>
            {options?.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        );

      case 'textarea':
        return (
          <textarea
            id={inputId}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className={`${baseClasses} min-h-[100px]`}
            placeholder={placeholder}
            required={required}
            disabled={disabled}
            rows={4}
          />
        );

      case 'checkbox':
        return (
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id={inputId}
              checked={value}
              onChange={(e) => onChange(e.target.checked)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              required={required}
              disabled={disabled}
            />
            <label htmlFor={inputId} className="text-sm text-gray-700">
              {placeholder || label}
            </label>
          </div>
        );

      case 'number':
        return (
          <input
            type="number"
            id={inputId}
            value={value}
            onChange={(e) => onChange(e.target.value ? parseFloat(e.target.value) : '')}
            className={baseClasses}
            placeholder={placeholder}
            required={required}
            min={min}
            max={max}
            step={step}
            disabled={disabled}
          />
        );

      default:
        return (
          <input
            type={type}
            id={inputId}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className={baseClasses}
            placeholder={placeholder}
            required={required}
            disabled={disabled}
          />
        );
    }
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {type !== 'checkbox' && (
        <label htmlFor={inputId} className="block text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      {renderInput()}

      {helpText && (
        <p className="text-xs text-gray-500">{helpText}</p>
      )}

      {error && (
        <p className="text-sm text-red-600">⚠️ {error}</p>
      )}
    </div>
  );
}
