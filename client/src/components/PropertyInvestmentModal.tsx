import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { useWallet } from '../contexts/WalletContext';
import { ethers } from 'ethers';

const formatEther = (value: string | number) => {
  return ethers.utils.formatEther(value.toString());
};

interface Property {
  id: number;
  propertyAddress: string;
  currentValue: string;
  targetRaise: string;
  currentRaise: string;
  monthlyRent: string;
  totalShares: number;
  sharesIssued: number;
  pricePerShare: string;
}

interface PropertyInvestmentModalProps {
  property: Property;
  onClose: () => void;
  onSuccess: () => void;
}

export default function PropertyInvestmentModal({ property, onClose, onSuccess }: PropertyInvestmentModalProps) {
  const { account, isConnected } = useWallet();
  const [investmentAmount, setInvestmentAmount] = useState('30');
  const [paymentMethod, setPaymentMethod] = useState<'stripe' | 'bnb' | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [investorProfile, setInvestorProfile] = useState<any>(null);
  const [checkingProfile, setCheckingProfile] = useState(true);

  useEffect(() => {
    checkInvestorProfile();
  }, [account]);

  const checkInvestorProfile = async () => {
    if (!account) {
      setCheckingProfile(false);
      return;
    }

    try {
      const response = await fetch(`/api/investor/profile/${account}`);
      const data = await response.json();
      
      if (data.success && data.data) {
        setInvestorProfile(data.data);
        // Set default payment method from registration
        setPaymentMethod(data.data.paymentMethod || null);
      }
    } catch (err) {
      console.error('Failed to load investor profile:', err);
    } finally {
      setCheckingProfile(false);
    }
  };

  const calculateShares = () => {
    const amount = parseFloat(investmentAmount);
    const pricePerShare = parseFloat(formatEther(property.pricePerShare));
    const bnbPrice = 600; // Approximate BNB price in USD
    
    if (paymentMethod === 'stripe') {
      // For Stripe: USD amount / (BNB price * pricePerShare in BNB)
      return Math.floor(amount / (bnbPrice * pricePerShare));
    } else {
      // For BNB: Direct calculation
      const bnbAmount = amount / bnbPrice;
      return Math.floor(bnbAmount / pricePerShare);
    }
  };

  const handleStripeInvestment = async () => {
    setLoading(true);
    setError('');

    try {
      const shares = calculateShares();
      
      if (shares <= 0) {
        setError('Investment amount too small. Please increase your investment.');
        setLoading(false);
        return;
      }

      const usdAmount = parseFloat(investmentAmount);
      const bnbAmount = usdAmount / 600; // Convert USD to BNB equivalent for consistent storage

      // Step 1: Create payment intent
      const paymentResponse = await fetch('/api/investor/invest/create-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: usdAmount, // Stripe charges in USD
          propertyId: property.id,
          walletAddress: account
        })
      });

      const paymentData = await paymentResponse.json();
      
      if (!paymentData.success) {
        throw new Error(paymentData.error || 'Failed to create payment');
      }

      // Step 2: Process payment (using Stripe Payment Element)
      // For now, we'll simulate this - in production, use Stripe Elements
      const simulatedPaymentIntentId = paymentData.data.paymentIntentId;

      // Step 3: Complete investment (store BNB equivalent for consistent accounting)
      const completeResponse = await fetch('/api/investor/invest/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walletAddress: account,
          propertyId: property.id,
          amount: bnbAmount, // Store BNB equivalent, not USD
          paymentIntentId: simulatedPaymentIntentId,
          paymentMethod: 'stripe',
          shares: shares
        })
      });

      const completeData = await completeResponse.json();

      if (completeData.success) {
        onSuccess();
        setTimeout(() => onClose(), 2000);
      } else {
        setError(completeData.error || 'Investment failed');
      }
    } catch (err: any) {
      setError(err.message || 'Investment failed');
    } finally {
      setLoading(false);
    }
  };

  const handleBNBInvestment = async () => {
    setLoading(true);
    setError('');

    try {
      const shares = calculateShares();
      
      if (shares <= 0) {
        setError('Investment amount too small. Please increase your investment.');
        setLoading(false);
        return;
      }

      const bnbAmount = parseFloat(investmentAmount) / 600; // Convert USD to BNB
      
      const response = await fetch('/api/real-estate-investor/tx/invest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walletAddress: account,
          propertyId: property.id,
          amount: bnbAmount.toString()
        })
      });

      const data = await response.json();

      if (data.success) {
        // Record in database with BNB amount (not USD)
        await fetch('/api/investor/invest/complete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            walletAddress: account,
            propertyId: property.id,
            amount: bnbAmount, // Send BNB amount, not USD
            txHash: data.data.txHash,
            paymentMethod: 'bnb',
            shares: shares
          })
        });

        onSuccess();
        setTimeout(() => onClose(), 2000);
      } else {
        setError(data.error || 'Transaction failed');
      }
    } catch (err: any) {
      setError(err.message || 'Investment failed');
    } finally {
      setLoading(false);
    }
  };

  const handleInvest = () => {
    if (paymentMethod === 'stripe') {
      handleStripeInvestment();
    } else {
      handleBNBInvestment();
    }
  };

  if (checkingProfile) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-6 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading investor profile...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!investorProfile) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Registration Required</h3>
            <p className="text-gray-700 mb-6">
              You need to complete investor registration before you can invest in properties.
              This helps us ensure compliance and provide you with the best investment experience.
            </p>
            <div className="flex gap-3">
              <Button onClick={onClose} variant="outline" className="flex-1">
                Cancel
              </Button>
              <Button
                onClick={() => window.location.href = '/investor-register'}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
              >
                Register Now
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const shares = calculateShares();
  const availableShares = property.totalShares - property.sharesIssued;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <CardContent className="p-6">
          {/* Header */}
          <div className="flex justify-between items-start mb-6">
            <div>
              <h3 className="text-2xl font-bold text-gray-900">Invest in Property</h3>
              <p className="text-sm text-gray-600 mt-1">{property.propertyAddress}</p>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          {/* Property Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h4 className="font-semibold text-gray-900 mb-3">Property Details</h4>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-gray-600">Current Value:</span>
                <p className="font-medium">${parseFloat(formatEther(property.currentValue)).toFixed(0)}</p>
              </div>
              <div>
                <span className="text-gray-600">Monthly Rent:</span>
                <p className="font-medium">${parseFloat(formatEther(property.monthlyRent)).toFixed(0)}</p>
              </div>
              <div>
                <span className="text-gray-600">Total Shares:</span>
                <p className="font-medium">{property.totalShares.toLocaleString()}</p>
              </div>
              <div>
                <span className="text-gray-600">Available Shares:</span>
                <p className="font-medium text-green-600">{availableShares.toLocaleString()}</p>
              </div>
            </div>
          </div>

          {/* Investment Amount */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Investment Amount (USD)
            </label>
            <input
              type="number"
              min="30"
              step="10"
              value={investmentAmount}
              onChange={(e) => setInvestmentAmount(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Minimum $30"
            />
            <p className="text-xs text-gray-500 mt-1">
              Minimum investment: $30 USD
            </p>
          </div>

          {/* Share Calculation */}
          {investmentAmount && parseFloat(investmentAmount) >= 30 && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <h4 className="font-semibold text-gray-900 mb-2">You will receive</h4>
              <p className="text-3xl font-bold text-green-600">{shares} shares</p>
              <p className="text-sm text-gray-600 mt-1">
                Estimated monthly rental income: ${(shares * (parseFloat(formatEther(property.monthlyRent)) / property.totalShares)).toFixed(2)}
              </p>
            </div>
          )}

          {/* Payment Method Selection */}
          <div className="mb-6">
            <h4 className="font-semibold text-gray-900 mb-3">Payment Method</h4>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setPaymentMethod('stripe')}
                className={`p-4 border-2 rounded-lg transition ${
                  paymentMethod === 'stripe'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-blue-300'
                }`}
              >
                <div className="text-3xl mb-2">💳</div>
                <h5 className="font-semibold text-gray-900">Credit Card</h5>
                <p className="text-xs text-gray-600 mt-1">Visa, Mastercard, Amex</p>
                {investorProfile.paymentMethod === 'stripe' && (
                  <p className="text-xs text-blue-600 mt-1 font-medium">✓ Preferred</p>
                )}
              </button>

              <button
                onClick={() => setPaymentMethod('bnb')}
                className={`p-4 border-2 rounded-lg transition ${
                  paymentMethod === 'bnb'
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-200 hover:border-green-300'
                }`}
              >
                <div className="text-3xl mb-2">🪙</div>
                <h5 className="font-semibold text-gray-900">BNB Crypto</h5>
                <p className="text-xs text-gray-600 mt-1">From your wallet</p>
                {investorProfile.paymentMethod === 'bnb' && (
                  <p className="text-xs text-green-600 mt-1 font-medium">✓ Preferred</p>
                )}
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              onClick={onClose}
              variant="outline"
              className="flex-1"
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleInvest}
              disabled={!paymentMethod || !investmentAmount || parseFloat(investmentAmount) < 30 || loading || shares > availableShares}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold"
            >
              {loading ? '⏳ Processing...' : `Invest $${investmentAmount}`}
            </Button>
          </div>

          {shares > availableShares && (
            <p className="text-red-600 text-sm mt-2 text-center">
              Not enough shares available. Maximum investment: ${(availableShares * parseFloat(formatEther(property.pricePerShare)) * 600).toFixed(0)}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
