import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import {
  RegistrationJourneyState,
  UnifiedPersonalProfile,
  UnifiedFinancialProfile,
  UnifiedRiskProfile,
  ProgramType
} from '../types/registration';

interface RegistrationContextValue {
  journey: RegistrationJourneyState | null;
  loading: boolean;
  error: string | null;
  
  loadJourney: () => Promise<void>;
  updatePersonalProfile: (profile: UnifiedPersonalProfile) => Promise<boolean>;
  updateFinancialProfile: (profile: UnifiedFinancialProfile) => Promise<boolean>;
  updateRiskProfile: (profile: UnifiedRiskProfile) => Promise<boolean>;
  enrollInProgram: (programType: ProgramType) => Promise<boolean>;
  clearError: () => void;
}

const RegistrationContext = createContext<RegistrationContextValue | undefined>(undefined);

export function RegistrationProvider({ children }: { children: ReactNode }) {
  const [journey, setJourney] = useState<RegistrationJourneyState | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadJourney = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/registration/journey', {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setJourney(data.journey);
      } else if (response.status !== 404) {
        const data = await response.json();
        setError(data.error || 'Failed to load registration journey');
      }
    } catch (err) {
      console.error('Failed to load journey:', err);
      setError('Network error while loading registration journey');
    } finally {
      setLoading(false);
    }
  }, []);

  const updatePersonalProfile = useCallback(async (profile: UnifiedPersonalProfile): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/registration/personal-profile', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile)
      });

      if (response.ok) {
        const data = await response.json();
        setJourney(data.journey);
        return true;
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to update personal profile');
        return false;
      }
    } catch (err) {
      console.error('Failed to update personal profile:', err);
      setError('Network error');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateFinancialProfile = useCallback(async (profile: UnifiedFinancialProfile): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/registration/financial-profile', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile)
      });

      if (response.ok) {
        const data = await response.json();
        setJourney(data.journey);
        return true;
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to update financial profile');
        return false;
      }
    } catch (err) {
      console.error('Failed to update financial profile:', err);
      setError('Network error');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateRiskProfile = useCallback(async (profile: UnifiedRiskProfile): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/registration/risk-profile', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile)
      });

      if (response.ok) {
        const data = await response.json();
        setJourney(data.journey);
        return true;
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to update risk profile');
        return false;
      }
    } catch (err) {
      console.error('Failed to update risk profile:', err);
      setError('Network error');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const enrollInProgram = useCallback(async (programType: ProgramType): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/registration/enroll', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ programType })
      });

      if (response.ok) {
        const data = await response.json();
        setJourney(data.journey);
        return true;
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to enroll in program');
        return false;
      }
    } catch (err) {
      console.error('Failed to enroll in program:', err);
      setError('Network error');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const value: RegistrationContextValue = {
    journey,
    loading,
    error,
    loadJourney,
    updatePersonalProfile,
    updateFinancialProfile,
    updateRiskProfile,
    enrollInProgram,
    clearError
  };

  return (
    <RegistrationContext.Provider value={value}>
      {children}
    </RegistrationContext.Provider>
  );
}

export function useRegistration() {
  const context = useContext(RegistrationContext);
  if (!context) {
    throw new Error('useRegistration must be used within a RegistrationProvider');
  }
  return context;
}
