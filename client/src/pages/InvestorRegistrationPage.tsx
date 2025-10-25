import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '../contexts/WalletContext';
import InvestorRegistrationForm from '../components/InvestorRegistrationForm';

export default function InvestorRegistrationPage() {
  const navigate = useNavigate();
  const { account } = useWallet();

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-3">
            🏢 Become a Real Estate Investor
          </h1>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Start your journey to building wealth through fractional real estate ownership. 
            Complete your investor profile to access exclusive property investment opportunities.
          </p>
        </div>

        {/* Key Benefits */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg p-4 text-center border-2 border-green-200 shadow-sm">
            <div className="text-3xl mb-2">💰</div>
            <p className="text-sm font-semibold text-gray-900">Start at $30</p>
            <p className="text-xs text-gray-600">Low minimum investment</p>
          </div>
          <div className="bg-white rounded-lg p-4 text-center border-2 border-blue-200 shadow-sm">
            <div className="text-3xl mb-2">🏠</div>
            <p className="text-sm font-semibold text-gray-900">Passive Income</p>
            <p className="text-xs text-gray-600">Monthly rental distributions</p>
          </div>
          <div className="bg-white rounded-lg p-4 text-center border-2 border-purple-200 shadow-sm">
            <div className="text-3xl mb-2">📈</div>
            <p className="text-sm font-semibold text-gray-900">Appreciation</p>
            <p className="text-xs text-gray-600">Property value growth</p>
          </div>
          <div className="bg-white rounded-lg p-4 text-center border-2 border-orange-200 shadow-sm">
            <div className="text-3xl mb-2">🔐</div>
            <p className="text-sm font-semibold text-gray-900">On-Chain</p>
            <p className="text-xs text-gray-600">Blockchain verified ownership</p>
          </div>
        </div>

        {/* Registration Form */}
        <InvestorRegistrationForm
          onClose={() => navigate('/real-estate-investor')}
          walletAddress={account}
        />

        {/* Footer Note */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>
            Already registered?{' '}
            <button
              onClick={() => navigate('/real-estate-investor')}
              className="text-blue-600 hover:underline font-medium"
            >
              Browse Properties →
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
