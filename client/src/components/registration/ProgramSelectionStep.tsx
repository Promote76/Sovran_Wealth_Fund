import React, { useState } from 'react';
import { ProgramType, RegistrationJourneyState } from '../../types/registration';

interface ProgramCard {
  id: ProgramType;
  name: string;
  description: string;
  icon: string;
  features: string[];
  requiresPayment: boolean;
  paymentAmount?: number;
  isEligible: boolean;
  eligibilityReason?: string;
  badge?: string;
}

interface ProgramSelectionStepProps {
  journeyState: RegistrationJourneyState;
  onSelectProgram: (programType: ProgramType) => void;
  onBack?: () => void;
}

export function ProgramSelectionStep({ journeyState, onSelectProgram, onBack }: ProgramSelectionStepProps) {
  const [selectedProgram, setSelectedProgram] = useState<ProgramType | null>(null);

  const programs: ProgramCard[] = [
    {
      id: 'real_estate_investor',
      name: 'Real Estate Investor',
      description: 'Invest in fractional real estate shares starting at just $30',
      icon: '🏘️',
      features: [
        'Start with as little as $30 per share',
        'Earn rental income monthly',
        'Benefit from property appreciation',
        'Exit profits when properties sell',
        'Diversify across multiple properties'
      ],
      requiresPayment: false,
      isEligible: true,
      badge: 'FREE TO JOIN'
    },
    {
      id: 'keygrow_rent_to_own',
      name: 'KeyGrow Rent-to-Own',
      description: 'Turn your rent into homeownership with 20% platform revenue allocation',
      icon: '🏡',
      features: [
        '$500 enrollment fee',
        'Monthly allocations from 20% revenue pool',
        'Time-weighted multipliers (up to 2.5x)',
        'Tiered allocation system (Seed to Summit)',
        'Dedicated property acquisition support'
      ],
      requiresPayment: true,
      paymentAmount: 500,
      isEligible: journeyState.hasFinancialProfile && journeyState.hasPersonalProfile,
      eligibilityReason: !journeyState.hasFinancialProfile ? 'Complete financial profile first' : undefined,
      badge: '$500 ENROLLMENT'
    },
    {
      id: 'staking',
      name: 'Token Staking',
      description: 'Stake AXM tokens for dynamic APR rewards (10-30%)',
      icon: '⚡',
      features: [
        'Dynamic APR from 10% to 30%',
        'Proof of Contribution rewards',
        'NFT boosted staking',
        'Flexible lock periods',
        'Energy-based mechanics'
      ],
      requiresPayment: false,
      isEligible: true,
      badge: 'FREE'
    },
    {
      id: 'nft_marketplace',
      name: 'NFT Marketplace',
      description: 'Buy, sell, and trade NFTs with 2.5% marketplace fees',
      icon: '🎨',
      features: [
        'Buy and sell NFTs',
        'Create listings with custom pricing',
        'Bidding system',
        'Collection browsing',
        '2.5% marketplace fee'
      ],
      requiresPayment: false,
      isEligible: true,
      badge: 'FREE'
    },
    {
      id: 'banking',
      name: 'Digital Banking',
      description: 'High-yield savings, checking, CDs, and more',
      icon: '🏦',
      features: [
        'High-yield savings accounts',
        'Checking accounts',
        'Certificates of Deposit (CDs)',
        'Inter-account transfers',
        'Detailed transaction history'
      ],
      requiresPayment: false,
      isEligible: journeyState.hasFinancialProfile,
      eligibilityReason: !journeyState.hasFinancialProfile ? 'Complete financial profile first' : undefined,
      badge: 'FREE'
    },
    {
      id: 'governance',
      name: 'Governance',
      description: 'Participate in platform governance with quadratic voting',
      icon: '🗳️',
      features: [
        'Submit proposals',
        'Quadratic voting system',
        'Transparent decision making',
        'Community-driven development',
        'Dividend pool participation'
      ],
      requiresPayment: false,
      isEligible: true,
      badge: 'FREE'
    }
  ];

  const handleSelectProgram = (program: ProgramCard) => {
    if (!program.isEligible) return;
    
    setSelectedProgram(program.id);
    onSelectProgram(program.id);
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">
          Choose Your Programs
        </h2>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Select which AXIOM programs you'd like to join. You can enroll in multiple 
          programs at any time. Most programs are FREE to join!
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {programs.map((program) => (
          <button
            key={program.id}
            onClick={() => handleSelectProgram(program)}
            disabled={!program.isEligible}
            className={`text-left p-6 rounded-lg border-2 transition-all ${
              program.isEligible
                ? selectedProgram === program.id
                  ? 'border-blue-500 bg-blue-50 shadow-lg'
                  : 'border-gray-200 hover:border-blue-300 hover:shadow-md'
                : 'border-gray-200 bg-gray-50 opacity-60 cursor-not-allowed'
            }`}
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
              <div className="text-4xl">{program.icon}</div>
              <span className={`text-xs font-bold px-2 py-1 rounded ${
                program.requiresPayment
                  ? 'bg-yellow-100 text-yellow-800'
                  : 'bg-green-100 text-green-800'
              }`}>
                {program.badge}
              </span>
            </div>

            {/* Title & Description */}
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              {program.name}
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              {program.description}
            </p>

            {/* Features */}
            <ul className="space-y-2 mb-4">
              {program.features.map((feature, index) => (
                <li key={index} className="text-sm text-gray-700 flex items-start gap-2">
                  <span className="text-green-500 mt-0.5">✓</span>
                  <span>{feature}</span>
                </li>
              ))}
            </ul>

            {/* Eligibility Warning */}
            {!program.isEligible && program.eligibilityReason && (
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-800">
                ⚠️ {program.eligibilityReason}
              </div>
            )}

            {/* Action */}
            {program.isEligible && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="text-center">
                  <span className="text-blue-600 font-semibold text-sm">
                    {selectedProgram === program.id ? '✓ Selected' : 'Select Program →'}
                  </span>
                </div>
              </div>
            )}
          </button>
        ))}
      </div>

      {/* Cross-Promotion */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-start gap-4">
          <div className="text-3xl">🎁</div>
          <div>
            <h4 className="text-lg font-bold text-gray-900 mb-2">
              Multi-Program Benefits
            </h4>
            <p className="text-gray-700 mb-3">
              Join multiple programs to maximize your opportunities:
            </p>
            <ul className="space-y-1 text-sm text-gray-700">
              <li>✓ <strong>Real Estate + KeyGrow:</strong> Invest while building toward homeownership</li>
              <li>✓ <strong>Staking + Governance:</strong> Earn rewards and shape the platform</li>
              <li>✓ <strong>Banking + Investing:</strong> Complete financial ecosystem</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <div className="text-2xl">💡</div>
          <div>
            <h4 className="font-semibold text-blue-900 mb-1">No Commitment Required</h4>
            <p className="text-sm text-blue-700">
              You can explore programs now and decide later. Most programs are FREE to join, 
              and you can add more programs to your account anytime.
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between pt-4">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="px-4 py-2 md:px-6 md:py-3 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            ← Back
          </button>
        )}

        <button
          onClick={() => {
            if (!selectedProgram) {
              alert('Please select at least one program to continue');
            }
          }}
          className="ml-auto px-4 py-2 md:px-6 md:py-3 bg-gray-300 text-gray-600 rounded-lg cursor-not-allowed"
          disabled
        >
          Continue to Dashboard →
        </button>
      </div>

      <p className="text-center text-sm text-gray-500">
        After selecting a program, you'll be taken to its specific enrollment page
      </p>
    </div>
  );
}
