import React from 'react';
import { useNavigate } from 'react-router-dom';
import { JourneyOrchestrator } from '../components/registration/JourneyOrchestrator';
import { RegistrationProvider } from '../contexts/RegistrationContext';

export default function UnifiedRegistrationPage() {
  const navigate = useNavigate();

  const handleComplete = () => {
    console.log('Registration journey complete!');
    navigate('/dashboard');
  };

  return (
    <RegistrationProvider>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        <JourneyOrchestrator onComplete={handleComplete} />
      </div>
    </RegistrationProvider>
  );
}
