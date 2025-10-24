import React from 'react';
import { useNavigate } from 'react-router-dom';
import PropertySubmissionForm from '../components/PropertySubmissionForm';

export default function PropertySubmitPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Submit Property for Investment
          </h1>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            List your property on the Real Estate Investor platform. Once approved by our admin team, 
            your property will be minted on-chain and available for fractional investment.
          </p>
        </div>

        {/* How It Works */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">📋 How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-3xl mb-2">1️⃣</div>
              <h3 className="font-semibold text-gray-900 mb-1">Submit Details</h3>
              <p className="text-sm text-gray-600">Fill out property & financial info</p>
            </div>
            <div className="text-center">
              <div className="text-3xl mb-2">2️⃣</div>
              <h3 className="font-semibold text-gray-900 mb-1">Admin Review</h3>
              <p className="text-sm text-gray-600">Our team validates your submission</p>
            </div>
            <div className="text-center">
              <div className="text-3xl mb-2">3️⃣</div>
              <h3 className="font-semibold text-gray-900 mb-1">On-Chain Listing</h3>
              <p className="text-sm text-gray-600">Property minted to smart contract</p>
            </div>
            <div className="text-center">
              <div className="text-3xl mb-2">4️⃣</div>
              <h3 className="font-semibold text-gray-900 mb-1">Live for Investment</h3>
              <p className="text-sm text-gray-600">Investors can buy fractional shares</p>
            </div>
          </div>
        </div>

        {/* Form */}
        <PropertySubmissionForm onClose={() => navigate('/real-estate-investor')} />

        {/* Footer Note */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>
            Need help? Contact our property submissions team at{' '}
            <a href="mailto:properties@axiom.com" className="text-blue-600 hover:underline">
              properties@axiom.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
