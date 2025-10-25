import React from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';

interface Step {
  id: string;
  title: string;
  description?: string;
  icon?: string;
}

interface StepWizardProps {
  steps: Step[];
  currentStep: number;
  onStepChange: (step: number) => void;
  onNext: () => void;
  onPrevious: () => void;
  onComplete?: () => void;
  canGoNext?: boolean;
  canGoPrevious?: boolean;
  isLoading?: boolean;
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  showProgress?: boolean;
}

export function StepWizard({
  steps,
  currentStep,
  onStepChange,
  onNext,
  onPrevious,
  onComplete,
  canGoNext = true,
  canGoPrevious = true,
  isLoading = false,
  children,
  title,
  subtitle,
  showProgress = true
}: StepWizardProps) {
  const isFirstStep = currentStep === 1;
  const isLastStep = currentStep === steps.length;
  const progressPercent = ((currentStep - 1) / (steps.length - 1)) * 100;

  const handleNext = () => {
    if (isLastStep && onComplete) {
      onComplete();
    } else {
      onNext();
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader className="space-y-4">
        {title && (
          <div className="text-center">
            <CardTitle className="text-2xl md:text-3xl font-bold text-gray-900">
              {title}
            </CardTitle>
            {subtitle && (
              <p className="text-gray-600 mt-2">{subtitle}</p>
            )}
          </div>
        )}

        {/* Step Progress Indicator */}
        {showProgress && (
          <div className="space-y-4">
            {/* Progress Bar */}
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            {/* Step Indicators */}
            <div className="flex justify-between items-start gap-2">
              {steps.map((step, index) => {
                const stepNumber = index + 1;
                const isActive = stepNumber === currentStep;
                const isCompleted = stepNumber < currentStep;
                const isClickable = stepNumber < currentStep;

                return (
                  <button
                    key={step.id}
                    onClick={() => isClickable && onStepChange(stepNumber)}
                    disabled={!isClickable}
                    className={`flex-1 flex flex-col items-center gap-2 p-2 rounded-lg transition-colors ${
                      isActive
                        ? 'bg-blue-50 border-2 border-blue-500'
                        : isCompleted
                        ? 'hover:bg-gray-50 cursor-pointer'
                        : 'cursor-not-allowed opacity-50'
                    }`}
                  >
                    <div
                      className={`w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center font-bold text-sm md:text-base ${
                        isActive
                          ? 'bg-blue-500 text-white'
                          : isCompleted
                          ? 'bg-green-500 text-white'
                          : 'bg-gray-300 text-gray-600'
                      }`}
                    >
                      {isCompleted ? '✓' : step.icon || stepNumber}
                    </div>
                    <div className="text-center">
                      <div className={`text-xs md:text-sm font-medium ${
                        isActive ? 'text-blue-700' : 'text-gray-700'
                      }`}>
                        {step.title}
                      </div>
                      {step.description && (
                        <div className="text-xs text-gray-500 hidden md:block">
                          {step.description}
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Step Content */}
        <div className="min-h-[300px]">
          {children}
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between items-center pt-4 border-t">
          <Button
            onClick={onPrevious}
            disabled={isFirstStep || !canGoPrevious || isLoading}
            variant="outline"
            className="px-4 py-2 md:px-6 md:py-3"
          >
            ← Previous
          </Button>

          <div className="text-sm text-gray-600">
            Step {currentStep} of {steps.length}
          </div>

          <Button
            onClick={handleNext}
            disabled={!canGoNext || isLoading}
            className="px-4 py-2 md:px-6 md:py-3 bg-blue-500 hover:bg-blue-600 text-white"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <div className="animate-spin">⏳</div>
                Loading...
              </span>
            ) : isLastStep ? (
              'Complete ✓'
            ) : (
              'Next →'
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
