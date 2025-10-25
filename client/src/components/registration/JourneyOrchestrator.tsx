import React, { useState, useEffect } from 'react';
import { StepWizard } from '../shared/StepWizard';
import { RegistrationJourneyState, RegistrationStep, ProgramType } from '../../types/registration';
import { useSecureAuth } from '../../hooks/useSecureAuth';

interface JourneyOrchestratorProps {
  onComplete?: () => void;
  initialStep?: RegistrationStep;
}

const JOURNEY_STEPS = [
  {
    id: 'account_creation',
    title: 'Account',
    description: 'Create your account',
    icon: '👤'
  },
  {
    id: 'personal_profile',
    title: 'Personal Info',
    description: 'Basic information',
    icon: '📝'
  },
  {
    id: 'financial_profile',
    title: 'Financial',
    description: 'Financial details',
    icon: '💰'
  },
  {
    id: 'risk_profile',
    title: 'Risk',
    description: 'Investment profile',
    icon: '📊'
  },
  {
    id: 'program_selection',
    title: 'Programs',
    description: 'Choose programs',
    icon: '🎯'
  }
];

export function JourneyOrchestrator({
  onComplete,
  initialStep = 'account_creation'
}: JourneyOrchestratorProps) {
  const { user, isAuthenticated } = useSecureAuth();
  const [currentStepIndex, setCurrentStepIndex] = useState(1);
  const [journeyState, setJourneyState] = useState<RegistrationJourneyState>({
    currentStep: initialStep,
    completedSteps: [],
    hasPersonalProfile: false,
    hasFinancialProfile: false,
    hasRiskProfile: false,
    hasKycVerification: false
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthenticated) {
      loadJourneyState();
    }
  }, [isAuthenticated]);

  const loadJourneyState = async () => {
    try {
      const response = await fetch('/api/registration/journey', {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        if (data.journey) {
          setJourneyState(data.journey);
          const stepIndex = JOURNEY_STEPS.findIndex(
            s => s.id === data.journey.currentStep
          );
          setCurrentStepIndex(stepIndex + 1);
        }
      }
    } catch (err) {
      console.error('Failed to load journey state:', err);
    }
  };

  const saveJourneyState = async (updates: Partial<RegistrationJourneyState>) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/registration/journey', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });

      if (response.ok) {
        const data = await response.json();
        setJourneyState(prev => ({ ...prev, ...data.journey }));
        return true;
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to save progress');
        return false;
      }
    } catch (err) {
      console.error('Failed to save journey state:', err);
      setError('Network error');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const completeStep = async (step: RegistrationStep, data?: any) => {
    const completedSteps = [...journeyState.completedSteps];
    if (!completedSteps.includes(step)) {
      completedSteps.push(step);
    }

    const updates: Partial<RegistrationJourneyState> = {
      completedSteps,
      currentStep: getNextStep(step)
    };

    if (step === 'personal_profile' && data) {
      updates.personalProfile = data;
      updates.hasPersonalProfile = true;
    } else if (step === 'financial_profile' && data) {
      updates.financialProfile = data;
      updates.hasFinancialProfile = true;
    } else if (step === 'risk_profile' && data) {
      updates.riskProfile = data;
      updates.hasRiskProfile = true;
    }

    const success = await saveJourneyState(updates);
    if (success) {
      const nextStepIndex = JOURNEY_STEPS.findIndex(
        s => s.id === updates.currentStep
      );
      setCurrentStepIndex(nextStepIndex + 1);
    }

    return success;
  };

  const getNextStep = (current: RegistrationStep): RegistrationStep => {
    const stepOrder: RegistrationStep[] = [
      'account_creation',
      'personal_profile',
      'financial_profile',
      'risk_profile',
      'program_selection'
    ];

    const currentIndex = stepOrder.indexOf(current);
    return stepOrder[currentIndex + 1] || current;
  };

  const handleNext = async () => {
    const currentStep = JOURNEY_STEPS[currentStepIndex - 1];
    console.log('Moving to next step from:', currentStep.id);
  };

  const handlePrevious = () => {
    if (currentStepIndex > 1) {
      setCurrentStepIndex(currentStepIndex - 1);
    }
  };

  const handleStepChange = (stepNumber: number) => {
    setCurrentStepIndex(stepNumber);
  };

  const renderStepContent = () => {
    const step = JOURNEY_STEPS[currentStepIndex - 1];

    switch (step.id) {
      case 'account_creation':
        return (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">👤</div>
            <h2 className="text-2xl font-bold mb-4">Account Creation Step</h2>
            <p className="text-gray-600">
              This step will integrate with the secure auth system
            </p>
          </div>
        );

      case 'personal_profile':
        return (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📝</div>
            <h2 className="text-2xl font-bold mb-4">Personal Profile Step</h2>
            <p className="text-gray-600">
              Collect shared personal information
            </p>
          </div>
        );

      case 'financial_profile':
        return (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">💰</div>
            <h2 className="text-2xl font-bold mb-4">Financial Profile Step</h2>
            <p className="text-gray-600">
              Collect shared financial information
            </p>
          </div>
        );

      case 'risk_profile':
        return (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📊</div>
            <h2 className="text-2xl font-bold mb-4">Risk Profile Step</h2>
            <p className="text-gray-600">
              Assess investment risk tolerance
            </p>
          </div>
        );

      case 'program_selection':
        return (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🎯</div>
            <h2 className="text-2xl font-bold mb-4">Program Selection Step</h2>
            <p className="text-gray-600">
              Choose which programs to enroll in
            </p>
          </div>
        );

      default:
        return null;
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold mb-4">Please Log In</h2>
        <p className="text-gray-600">
          You need to be logged in to access the registration journey
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <StepWizard
        steps={JOURNEY_STEPS}
        currentStep={currentStepIndex}
        onStepChange={handleStepChange}
        onNext={handleNext}
        onPrevious={handlePrevious}
        onComplete={onComplete}
        isLoading={loading}
        title="Welcome to AXIOM"
        subtitle="Let's set up your account and get you started"
        showProgress={true}
      >
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            ⚠️ {error}
          </div>
        )}

        {renderStepContent()}
      </StepWizard>
    </div>
  );
}
