export type ProgramType =
  | 'real_estate_investor'
  | 'keygrow_rent_to_own'
  | 'property_owner'
  | 'banking'
  | 'staking'
  | 'nft_marketplace'
  | 'governance';

export type RegistrationStep =
  | 'account_creation'
  | 'personal_profile'
  | 'financial_profile'
  | 'risk_profile'
  | 'program_selection'
  | 'program_enrollment';

export interface UnifiedPersonalProfile {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  dateOfBirth?: Date;
  country?: string;
  state?: string;
  city?: string;
  zipCode?: string;
  address?: string;
  employmentStatus?: string;
  employmentYears?: number;
  employer?: string;
  occupation?: string;
}

export interface UnifiedFinancialProfile {
  annualIncome?: number;
  monthlyIncome?: number;
  incomeSource?: string;
  totalNetWorth?: number;
  liquidAssets?: number;
  realEstateValue?: number;
  investmentValue?: number;
  totalDebt?: number;
  monthlyDebt?: number;
  monthlyExpenses?: number;
  emergencyFund?: number;
  currentSavings?: number;
  monthlySavings?: number;
  creditScore?: number;
  hasBankruptcy?: boolean;
  hasForeclosure?: boolean;
}

export interface UnifiedRiskProfile {
  riskTolerance?: 'conservative' | 'moderate' | 'aggressive';
  investmentExperience?: 'none' | 'beginner' | 'intermediate' | 'advanced';
  investmentHorizon?: '1-3' | '3-5' | '5-10' | '10+';
  liquidityNeeds?: 'high' | 'medium' | 'low';
  investmentKnowledge?: string[];
  hasRealEstateExperience?: boolean;
  hasCryptoExperience?: boolean;
  hasStockExperience?: boolean;
  portfolioDiversification?: number;
  comfortWithVolatility?: number;
  lossComfort?: number;
}

export interface RegistrationJourneyState {
  currentStep: RegistrationStep;
  completedSteps: RegistrationStep[];
  hasPersonalProfile: boolean;
  hasFinancialProfile: boolean;
  hasRiskProfile: boolean;
  hasKycVerification: boolean;
  personalProfile?: UnifiedPersonalProfile;
  financialProfile?: UnifiedFinancialProfile;
  riskProfile?: UnifiedRiskProfile;
}

export interface ProgramModule {
  id: ProgramType;
  name: string;
  description: string;
  icon: string;
  requiresPayment: boolean;
  paymentAmount?: number;
  paymentCurrency?: string;
  requiredProfiles: ('personal' | 'financial' | 'risk' | 'kyc')[];
  differentialFields?: string[];
  eligibilityCheck?: (journey: RegistrationJourneyState) => {
    isEligible: boolean;
    reason?: string;
  };
}
