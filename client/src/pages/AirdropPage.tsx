import React, { useState, useEffect } from 'react';
import { useNotificationHelpers } from '../components/NotificationSystem';

const AirdropPage: React.FC = () => {
  const [walletAddress, setWalletAddress] = useState('');
  const [claimStatus, setClaimStatus] = useState<'idle' | 'checking' | 'eligible' | 'not-eligible' | 'claimed'>('idle');
  const [claimAmount, setClaimAmount] = useState('0');
  const { showError, showWarning } = useNotificationHelpers();

  const checkEligibility = async () => {
    if (!walletAddress) {
      showWarning('Wallet Address Required', 'Please enter a valid wallet address to check your airdrop eligibility.');
      return;
    }

    setClaimStatus('checking');
    
    try {
      const response = await fetch('/api/airdrop/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ walletAddress })
      });
      
      const data = await response.json();
      
      if (data.eligible) {
        setClaimAmount(data.amount);
        setClaimStatus('eligible');
      } else {
        setClaimStatus('not-eligible');
      }
    } catch (error) {
      console.error('Error checking eligibility:', error);
      setClaimStatus('idle');
    }
  };

  const claimTokens = async () => {
    try {
      const response = await fetch('/api/airdrop/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ walletAddress })
      });
      
      if (response.ok) {
        setClaimStatus('claimed');
      }
    } catch (error) {
      console.error('Error claiming tokens:', error);
    }
  };

  return (
    <div className="bg-gradient-to-br from-white via-blue-50 to-white min-h-screen">
        {/* Hero Section */}
      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-6 text-blue-800">
            SWF Token <span className="text-blue-600">Airdrop</span>
          </h1>
          <p className="text-xl text-gray-700 max-w-3xl mx-auto">
            Claim your free SWF tokens through our secure Merkle proof verification system. 
            Limited time airdrop for qualified wallet addresses.
          </p>
        </div>

        {/* Airdrop Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          <div className="bg-gradient-to-br from-white to-blue-50 border-2 border-blue-400 rounded-xl p-6 shadow-lg">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">1,000,000</div>
              <div className="text-gray-700">Total Tokens</div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-white to-blue-50 border-2 border-blue-400 rounded-xl p-6 shadow-lg">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">50 - 500</div>
              <div className="text-gray-700">Tokens Per Claim</div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-white to-blue-50 border-2 border-blue-400 rounded-xl p-6 shadow-lg">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">30 Days</div>
              <div className="text-gray-700">Time Remaining</div>
            </div>
          </div>
        </div>

        {/* Claim Interface */}
        <div className="max-w-2xl mx-auto">
          <div className="bg-gradient-to-br from-white to-blue-50 border-2 border-blue-500 rounded-xl p-8 shadow-lg">
            <h2 className="text-2xl font-bold mb-6 text-center text-blue-800">Check Eligibility & Claim</h2>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-blue-700 mb-2">
                  Wallet Address
                </label>
                <input
                  type="text"
                  placeholder="0x..."
                  value={walletAddress}
                  onChange={(e) => setWalletAddress(e.target.value)}
                  className="w-full px-4 py-3 bg-white border-2 border-blue-300 rounded-lg text-gray-800 placeholder-gray-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              {claimStatus === 'idle' && (
                <button 
                  onClick={checkEligibility}
                  className="w-full px-6 py-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold rounded-lg transition-all duration-200 hover:scale-105 shadow-lg"
                >
                  Check Eligibility
                </button>
              )}

              {claimStatus === 'checking' && (
                <div className="text-center py-8">
                  <div className="text-blue-600 text-lg">Checking eligibility...</div>
                </div>
              )}

              {claimStatus === 'eligible' && (
                <div className="text-center space-y-4">
                  <div className="text-blue-600 text-lg">
                    🎉 You're eligible to claim {claimAmount} SWF tokens!
                  </div>
                  <button 
                    onClick={claimTokens}
                    className="w-full px-6 py-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold rounded-lg transition-all duration-200 hover:scale-105 shadow-lg"
                  >
                    Claim Tokens
                  </button>
                </div>
              )}

              {claimStatus === 'not-eligible' && (
                <div className="text-center py-8">
                  <div className="text-red-400 text-lg">
                    Sorry, this wallet address is not eligible for the airdrop.
                  </div>
                </div>
              )}

              {claimStatus === 'claimed' && (
                <div className="text-center py-8">
                  <div className="text-blue-600 text-lg">
                    ✅ Tokens claimed successfully! Check your wallet.
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* How It Works */}
        <div className="mt-16">
          <h2 className="text-3xl font-bold text-center mb-12 text-blue-800">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-500 bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">1️⃣</span>
              </div>
              <h3 className="text-lg font-semibold mb-2 text-blue-800">Enter Address</h3>
              <p className="text-gray-700">Enter your wallet address to check eligibility</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-500 bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">2️⃣</span>
              </div>
              <h3 className="text-lg font-semibold mb-2 text-blue-800">Verify Eligibility</h3>
              <p className="text-gray-700">System checks if you qualify for the airdrop</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-500 bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">3️⃣</span>
              </div>
              <h3 className="text-lg font-semibold mb-2 text-blue-800">Claim Tokens</h3>
              <p className="text-gray-700">Claim your free SWF tokens directly to your wallet</p>
            </div>
          </div>
        </div>
      </div>
      </div>
  );
};

export default AirdropPage;