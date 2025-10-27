/**
 * Feature #2: Smart Compliance Orchestrator - Investor Self-Service
 * Investor KYC/AML status and accreditation management
 */

import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface ComplianceStatus {
  accreditationCount: number;
  latestAccreditationStatus: string;
  clearAmlChecks: number;
  flaggedAmlChecks: number;
  latestRiskLevel: string;
  openAlerts: number;
  currentTier: string;
  isAccredited: boolean;
  isCompliant: boolean;
  canInvest: boolean;
}

const InvestorCompliance: React.FC<{ investorId: number; walletAddress: string }> = ({ investorId, walletAddress }) => {
  const [status, setStatus] = useState<ComplianceStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadComplianceStatus();
    const interval = setInterval(loadComplianceStatus, 60000);
    return () => clearInterval(interval);
  }, [investorId, walletAddress]);

  const loadComplianceStatus = async () => {
    try {
      const res = await axios.get(`/api/compliance/status/${investorId}?walletAddress=${walletAddress}`);
      setStatus(res.data.status);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load compliance status');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitAccreditation = async () => {
    if (!confirm('Submit accreditation verification? You will need to provide supporting documentation.')) {
      return;
    }

    setSubmitting(true);
    try {
      await axios.post('/api/compliance/accreditation/submit', {
        investorId,
        walletAddress,
        verificationType: 'income',
        verificationMethod: 'document_upload',
        verificationData: {
          annualIncome: 200000,
          submittedAt: new Date().toISOString()
        },
        documents: []
      });
      alert('Accreditation verification submitted successfully! Our team will review within 2-3 business days.');
      loadComplianceStatus();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to submit accreditation');
    } finally {
      setSubmitting(false);
    }
  };

  const getComplianceBadge = () => {
    if (!status) return null;
    if (status.canInvest && status.isCompliant) {
      return <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-semibold">✅ Fully Compliant</span>;
    }
    if (status.flaggedAmlChecks > 0) {
      return <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-semibold">⚠️ AML Review Required</span>;
    }
    return <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-semibold">⏳ Verification Pending</span>;
  };

  const getRiskBadge = (risk: string) => {
    const colors: Record<string, string> = {
      low: 'bg-green-100 text-green-800',
      medium: 'bg-yellow-100 text-yellow-800',
      high: 'bg-orange-100 text-orange-800',
      critical: 'bg-red-100 text-red-800'
    };
    return colors[risk?.toLowerCase()] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">My Compliance Status</h1>
        <p className="text-gray-600">View your KYC/AML status and manage accreditation</p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
          {error}
        </div>
      )}

      {status && (
        <>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Overall Status</h2>
                <p className="text-sm text-gray-500 mt-1">Last updated: {new Date().toLocaleString()}</p>
              </div>
              {getComplianceBadge()}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <div className="text-sm text-gray-600 mb-1">Investor Tier</div>
                  <div className="text-lg font-semibold capitalize text-gray-900">
                    {status.currentTier || 'Retail'}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-600 mb-1">Accreditation Status</div>
                  <div className="text-lg font-semibold text-gray-900">
                    {status.isAccredited ? (
                      <span className="text-green-600">✓ Accredited Investor</span>
                    ) : (
                      <span className="text-gray-600">Not Accredited</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <div className="text-sm text-gray-600 mb-1">AML Checks</div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-semibold text-green-600">{status.clearAmlChecks} Clear</span>
                    {status.flaggedAmlChecks > 0 && (
                      <span className="text-lg font-semibold text-red-600">· {status.flaggedAmlChecks} Flagged</span>
                    )}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-600 mb-1">Risk Level</div>
                  <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getRiskBadge(status.latestRiskLevel)}`}>
                    {status.latestRiskLevel || 'Not Assessed'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {!status.isAccredited && status.canInvest && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
              <h3 className="text-lg font-semibold text-blue-900 mb-2">Become an Accredited Investor</h3>
              <p className="text-sm text-blue-800 mb-4">
                Access exclusive investment opportunities with higher limits. To qualify, you must meet one of the following:
              </p>
              <ul className="text-sm text-blue-800 space-y-2 mb-4 list-disc list-inside">
                <li>Annual income exceeding $200,000 (individual) or $300,000 (with spouse)</li>
                <li>Net worth exceeding $1 million (excluding primary residence)</li>
                <li>Professional certification (Series 7, 65, or 82 license)</li>
                <li>Entity with $5 million+ in assets</li>
              </ul>
              <button
                onClick={handleSubmitAccreditation}
                disabled={submitting || status.latestAccreditationStatus === 'pending'}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {submitting ? 'Submitting...' : status.latestAccreditationStatus === 'pending' ? 'Verification Pending' : 'Start Accreditation'}
              </button>
            </div>
          )}

          {status.openAlerts > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-6">
              <div className="flex items-start gap-3">
                <div className="text-yellow-600 text-2xl">⚠️</div>
                <div>
                  <h3 className="text-lg font-semibold text-yellow-900 mb-1">Action Required</h3>
                  <p className="text-sm text-yellow-800">
                    You have {status.openAlerts} open compliance {status.openAlerts === 1 ? 'alert' : 'alerts'} that require your attention.
                  </p>
                </div>
              </div>
            </div>
          )}

          {status.flaggedAmlChecks > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
              <div className="flex items-start gap-3">
                <div className="text-red-600 text-2xl">🚫</div>
                <div>
                  <h3 className="text-lg font-semibold text-red-900 mb-1">AML Review Required</h3>
                  <p className="text-sm text-red-800">
                    Your account has been flagged during AML screening. Our compliance team is reviewing your account. Please contact support for more information.
                  </p>
                </div>
              </div>
            </div>
          )}

          {status.canInvest && status.isCompliant && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
              <div className="flex items-start gap-3">
                <div className="text-green-600 text-2xl">✅</div>
                <div>
                  <h3 className="text-lg font-semibold text-green-900 mb-1">Ready to Invest</h3>
                  <p className="text-sm text-green-800">
                    Your account is fully compliant and you can proceed with investments up to your tier limits.
                  </p>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default InvestorCompliance;
