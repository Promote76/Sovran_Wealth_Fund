/**
 * KeyGrow Register Button Component
 * Example component demonstrating contract transaction integration
 */

import React, { useState } from 'react';
import { useContractTransactions } from '../../hooks/useContractTransactions';
import { useWallet } from '../../contexts/WalletContext';
import { Button } from '../ui/button';

interface KeyGrowRegisterButtonProps {
  onSuccess?: (txHash: string) => void;
  onError?: (error: string) => void;
}

export function KeyGrowRegisterButton({ 
  onSuccess, 
  onError 
}: KeyGrowRegisterButtonProps) {
  const { isConnected, isLoggedIn } = useWallet();
  const { registerAsRenter, txStatus, resetStatus } = useContractTransactions();
  const [selectedTier, setSelectedTier] = useState(0); // 0=Bronze

  const handleRegister = async () => {
    resetStatus();
    await registerAsRenter(selectedTier);
  };

  // Handle transaction completion
  React.useEffect(() => {
    if (txStatus.success && txStatus.txHash) {
      onSuccess?.(txStatus.txHash);
    } else if (txStatus.error) {
      onError?.(txStatus.error);
    }
  }, [txStatus, onSuccess, onError]);

  if (!isConnected || !isLoggedIn) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <p className="text-sm text-yellow-800">
          Please connect your wallet to register for KeyGrow
        </p>
      </div>
    );
  }

  const tierNames = ['Bronze', 'Silver', 'Gold', 'Platinum'];
  const tierColors = [
    'bg-orange-100 border-orange-300 text-orange-800',
    'bg-gray-100 border-gray-300 text-gray-800',
    'bg-yellow-100 border-yellow-300 text-yellow-800',
    'bg-purple-100 border-purple-300 text-purple-800',
  ];

  return (
    <div className="bg-white border border-blue-200 rounded-lg p-6 space-y-4">
      <h3 className="text-lg font-semibold text-gray-800">
        Join KeyGrow Rent-to-Own Program
      </h3>
      
      <p className="text-sm text-gray-600">
        Select your tier and register to start receiving allocations from platform revenue
      </p>

      {/* Tier Selection */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Select Tier
        </label>
        <div className="grid grid-cols-2 gap-2">
          {tierNames.map((name, index) => (
            <button
              key={index}
              onClick={() => setSelectedTier(index)}
              className={`p-3 rounded-lg border-2 transition-all ${
                selectedTier === index
                  ? tierColors[index] + ' ring-2 ring-blue-500'
                  : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
              }`}
            >
              <div className="font-medium">{name}</div>
              <div className="text-xs">Tier {index}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Register Button */}
      <Button
        onClick={handleRegister}
        disabled={txStatus.loading}
        className="w-full bg-blue-600 hover:bg-blue-700"
      >
        {txStatus.loading ? (
          <>
            <span className="animate-spin mr-2">⏳</span>
            Registering...
          </>
        ) : (
          `Register as ${tierNames[selectedTier]}`
        )}
      </Button>

      {/* Transaction Status */}
      {txStatus.loading && (
        <div className="bg-blue-50 border border-blue-200 rounded p-3 text-sm text-blue-700">
          📝 Please sign the transaction in your wallet...
        </div>
      )}

      {txStatus.success && txStatus.txHash && (
        <div className="bg-green-50 border border-green-200 rounded p-3">
          <div className="text-sm font-medium text-green-800">
            ✅ Registration successful!
          </div>
          <div className="text-xs text-green-600 mt-1">
            Transaction: {txStatus.txHash.slice(0, 10)}...{txStatus.txHash.slice(-8)}
          </div>
          <a
            href={`https://bscscan.com/tx/${txStatus.txHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-blue-600 hover:underline mt-2 inline-block"
          >
            View on BSCScan →
          </a>
        </div>
      )}

      {txStatus.error && (
        <div className="bg-red-50 border border-red-200 rounded p-3">
          <div className="text-sm font-medium text-red-800">
            ❌ Registration failed
          </div>
          <div className="text-xs text-red-600 mt-1">
            {txStatus.error}
          </div>
          <Button
            onClick={resetStatus}
            variant="outline"
            size="sm"
            className="mt-2"
          >
            Try Again
          </Button>
        </div>
      )}
    </div>
  );
}
