import React, { useState, useEffect } from 'react';
import { StepWizard } from '../shared/StepWizard';
import { RegistrationJourneyState, RegistrationStep, ProgramType } from '../../types/registration';
import { useSecureAuth } from '../../hooks/useSecureAuth';
import { useRegistration } from '../../contexts/RegistrationContext';
import { PersonalProfileStep } from './PersonalProfileStep';
import { FinancialProfileStep } from './FinancialProfileStep';
import { RiskProfileStep } from './RiskProfileStep';
import { ProgramSelectionStep } from './ProgramSelectionStep';

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
  const {
    journey,
    loading: contextLoading,
    error: contextError,
    loadJourney,
    updatePersonalProfile,
    updateFinancialProfile,
    updateRiskProfile,
    enrollInProgram
  } = useRegistration();
  
  const [currentStepIndex, setCurrentStepIndex] = useState(1);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthenticated) {
      loadJourney();
    }
  }, [isAuthenticated, loadJourney]);

  useEffect(() => {
    if (journey) {
      const stepIndex = JOURNEY_STEPS.findIndex(
        s => s.id === journey.currentStep
      );
      if (stepIndex >= 0) {
        setCurrentStepIndex(stepIndex + 1);
      }
    }
  }, [journey]);

  const handleProgramSelection = async (programType: ProgramType) => {
    const success = await enrollInProgram(programType);
    if (success && onComplete) {
      onComplete();
    }
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

    if (!journey) {
      return (
        <div className="text-center py-12">
          <div className="animate-spin text-4xl mb-4">⏳</div>
          <p className="text-gray-600">Loading your journey...</p>
        </div>
      );
    }

    switch (step.id) {
      case 'account_creation':
        return (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">✓</div>
            <h2 className="text-2xl font-bold mb-4 text-green-600">Account Created!</h2>
            <p className="text-gray-600 mb-6">
              You're logged in as <strong>{user?.email}</strong>
            </p>
            <p className="text-gray-600">
              Let's set up your profile to personalize your AXIOM experience.
            </p>
          </div>
        );

      case 'personal_profile':
        return (
          <PersonalProfileStep
            initialData={journey.personalProfile}
            onSubmit={async (data) => {
              const success = await updatePersonalProfile(data);
              if (success) {
                await loadJourney();
              }
              return success;
            }}
            onBack={() => setCurrentStepIndex(prev => Math.max(1, prev - 1))}
          />
        );

      case 'financial_profile':
        return (
          <FinancialProfileStep
            initialData={journey.financialProfile}
            onSubmit={async (data) => {
              const success = await updateFinancialProfile(data);
              if (success) {
                await loadJourney();
              }
              return success;
            }}
            onBack={() => setCurrentStepIndex(prev => Math.max(1, prev - 1))}
          />
        );

      case 'risk_profile':
        return (
          <RiskProfileStep
            initialData={journey.riskProfile}
            onSubmit={async (data) => {
              const success = await updateRiskProfile(data);
              if (success) {
                await loadJourney();
              }
              return success;
            }}
            onBack={() => setCurrentStepIndex(prev => Math.max(1, prev - 1))}
          />
        );

      case 'program_selection':
        return (
          <ProgramSelectionStep
            journeyState={journey}
            onSelectProgram={handleProgramSelection}
            onBack={() => setCurrentStepIndex(prev => Math.max(1, prev - 1))}
          />
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
        isLoading={contextLoading}
        title="Welcome to AXIOM"
        subtitle="Let's set up your account and get you started"
        showProgress={true}
      >
        {(error || contextError) && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            ⚠️ {error || contextError}
          </div>
        )}

        {renderStepContent()}
      </StepWizard>
    </div>
  );
}
