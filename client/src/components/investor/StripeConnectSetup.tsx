/**
 * Feature #4: Revenue Distribution Engine - Stripe Connect Setup
 * Onboarding UI for investors to set up Stripe Connect for payouts
 */

import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface StripeAccount {
  stripeAccountId: string;
  accountStatus: string;
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
  detailsSubmitted: boolean;
  createdAt: string;
}

interface SetupProps {
  investorId?: number;
  email?: string;
  firstName?: string;
  lastName?: string;
}

const StripeConnectSetup: React.FC<SetupProps> = ({
  investorId,
  email,
  firstName,
  lastName
}) => {
  const [account, setAccount] = useState<StripeAccount | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [settingUp, setSettingUp] = useState(false);

  useEffect(() => {
    checkAccountStatus();
  }, [investorId]);

  const checkAccountStatus = async () => {
    setLoading(true);
    setError(null);

    try {
      const params = investorId ? { investorId } : {};
      const response = await axios.get('/api/revenue/stripe/status', { params });
      
      if (response.data.hasAccount) {
        setAccount(response.data.account);
      } else {
        setAccount(null);
      }
    } catch (err: any) {
      if (err.response?.status !== 404) {
        setError(err.response?.data?.error || 'Failed to check account status');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSetupStripe = async () => {
    if (!email || !firstName || !lastName) {
      setError('Missing required user information. Please complete your profile first.');
      return;
    }

    setSettingUp(true);
    setError(null);

    try {
      const response = await axios.post('/api/revenue/stripe/setup', {
        investorId: investorId,
        email,
        firstName,
        lastName
      });

      if (response.data.success) {
        setAccount({
          stripeAccountId: response.data.stripeAccountId,
          accountStatus: 'incomplete',
          chargesEnabled: false,
          payoutsEnabled: false,
          detailsSubmitted: false,
          createdAt: new Date().toISOString()
        });
        
        await getOnboardingLink();
      } else {
        setError(response.data.error || 'Failed to create Stripe account');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to set up Stripe Connect');
    } finally {
      setSettingUp(false);
    }
  };

  const getOnboardingLink = async () => {
    try {
      const response = await axios.post('/api/revenue/stripe/onboarding', {
        investorId: investorId,
        returnUrl: window.location.origin + '/investor/payout-setup/complete',
        refreshUrl: window.location.origin + '/investor/payout-setup'
      });

      if (response.data.success) {
        window.location.href = response.data.onboardingUrl;
      } else {
        setError('Failed to get onboarding link');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to get onboarding link');
    }
  };

  const handleCompleteOnboarding = async () => {
    await getOnboardingLink();
  };

  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active':
        return <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-semibold">✓ Active</span>;
      case 'incomplete':
        return <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-semibold">⚠ Incomplete</span>;
      case 'pending':
        return <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-semibold">⏳ Pending</span>;
      default:
        return <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm font-semibold">{status}</span>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Payout Setup
        </h2>
        <p className="text-gray-600">
          Connect your bank account to receive rental income distributions
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {!account ? (
        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Set Up Payouts
            </h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              To receive your rental income distributions, you'll need to connect your bank account through Stripe. 
              This secure process takes just a few minutes.
            </p>
          </div>

          <div className="space-y-4 mb-6">
            <div className="flex items-start">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                <span className="text-blue-600 font-semibold">1</span>
              </div>
              <div>
                <h4 className="font-medium text-gray-900">Create Stripe Account</h4>
                <p className="text-sm text-gray-600">Connect your account with Stripe in seconds</p>
              </div>
            </div>

            <div className="flex items-start">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                <span className="text-blue-600 font-semibold">2</span>
              </div>
              <div>
                <h4 className="font-medium text-gray-900">Add Bank Details</h4>
                <p className="text-sm text-gray-600">Securely link your bank account for deposits</p>
              </div>
            </div>

            <div className="flex items-start">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                <span className="text-blue-600 font-semibold">3</span>
              </div>
              <div>
                <h4 className="font-medium text-gray-900">Receive Payouts</h4>
                <p className="text-sm text-gray-600">Get distributions deposited directly to your account</p>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-start">
              <svg className="w-5 h-5 text-blue-600 mt-0.5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <div className="text-sm text-blue-800">
                <strong>Secure & Private:</strong> Your banking information is encrypted and handled securely by Stripe, 
                a trusted payment processor used by millions worldwide.
              </div>
            </div>
          </div>

          <button
            onClick={handleSetupStripe}
            disabled={settingUp}
            className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
          >
            {settingUp ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Setting up...
              </>
            ) : (
              'Connect Bank Account'
            )}
          </button>

          <p className="text-xs text-gray-500 text-center mt-4">
            By connecting your account, you agree to Stripe's Terms of Service
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">
              Stripe Account Status
            </h3>
            {getStatusBadge(account.accountStatus)}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="border rounded-lg p-4">
              <div className="text-sm text-gray-500 mb-1">Account ID</div>
              <div className="font-mono text-sm font-medium break-all">
                {account.stripeAccountId}
              </div>
            </div>

            <div className="border rounded-lg p-4">
              <div className="text-sm text-gray-500 mb-1">Created</div>
              <div className="font-medium">
                {new Date(account.createdAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </div>
            </div>
          </div>

          <div className="space-y-3 mb-6">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm font-medium text-gray-700">Details Submitted</span>
              <span className={`text-sm font-semibold ${account.detailsSubmitted ? 'text-green-600' : 'text-yellow-600'}`}>
                {account.detailsSubmitted ? '✓ Complete' : '⚠ Incomplete'}
              </span>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm font-medium text-gray-700">Payouts Enabled</span>
              <span className={`text-sm font-semibold ${account.payoutsEnabled ? 'text-green-600' : 'text-yellow-600'}`}>
                {account.payoutsEnabled ? '✓ Enabled' : '⚠ Disabled'}
              </span>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-sm font-medium text-gray-700">Charges Enabled</span>
              <span className={`text-sm font-semibold ${account.chargesEnabled ? 'text-green-600' : 'text-yellow-600'}`}>
                {account.chargesEnabled ? '✓ Enabled' : '⚠ Disabled'}
              </span>
            </div>
          </div>

          {!account.detailsSubmitted || !account.payoutsEnabled ? (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
              <div className="flex items-start">
                <svg className="w-5 h-5 text-yellow-600 mt-0.5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <div className="text-sm text-yellow-800">
                  <strong>Action Required:</strong> Complete your Stripe onboarding to start receiving payouts. 
                  You'll need to provide some additional information and verify your bank account.
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
              <div className="flex items-start">
                <svg className="w-5 h-5 text-green-600 mt-0.5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <div className="text-sm text-green-800">
                  <strong>All Set!</strong> Your payout account is fully configured. Distributions will be automatically 
                  deposited to your linked bank account.
                </div>
              </div>
            </div>
          )}

          {!account.detailsSubmitted && (
            <button
              onClick={handleCompleteOnboarding}
              className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              Complete Onboarding
            </button>
          )}

          {account.detailsSubmitted && (
            <button
              onClick={checkAccountStatus}
              className="w-full bg-gray-100 text-gray-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
            >
              Refresh Status
            </button>
          )}
        </div>
      )}

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-semibold text-blue-900 mb-2">Need Help?</h4>
        <p className="text-sm text-blue-800 mb-2">
          If you're having trouble setting up your payout account or have questions about distributions:
        </p>
        <ul className="text-sm text-blue-800 list-disc list-inside space-y-1">
          <li>Contact support at support@axiom.com</li>
          <li>Check our FAQ for common setup questions</li>
          <li>Visit Stripe's Help Center for payment issues</li>
        </ul>
      </div>
    </div>
  );
};

export default StripeConnectSetup;
