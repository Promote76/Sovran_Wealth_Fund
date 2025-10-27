/**
 * Feature #2: Smart Compliance Orchestrator - Admin Monitor
 * KYC/AML queue management and compliance oversight
 */

import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface ComplianceMetrics {
  pendingKyc: number;
  pendingAccreditation: number;
  flaggedAml: number;
  pendingFilings: number;
  openAlerts: number;
}

interface Accreditation {
  verificationId: string;
  investorId: number;
  walletAddress: string;
  verificationType: string;
  verificationMethod: string;
  status: string;
  submittedAt: string;
  reviewedAt: string | null;
  expiresAt: string;
}

interface AMLCheck {
  checkId: string;
  investorId: number;
  walletAddress: string;
  checkType: string;
  provider: string;
  status: string;
  riskLevel: string;
  checkedAt: string;
}

const ComplianceMonitor: React.FC = () => {
  const [metrics, setMetrics] = useState<ComplianceMetrics | null>(null);
  const [accreditations, setAccreditations] = useState<Accreditation[]>([]);
  const [amlChecks, setAMLChecks] = useState<AMLCheck[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'accreditation' | 'aml' | 'alerts'>('accreditation');
  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const [reviewData, setReviewData] = useState({ approved: false, reason: '', riskLevel: 'low' });

  useEffect(() => {
    loadDashboardData();
    const interval = setInterval(loadDashboardData, 30000);
    return () => clearInterval(interval);
  }, [activeTab]);

  const loadDashboardData = async () => {
    try {
      const [metricsRes, accreditationsRes, amlRes] = await Promise.all([
        axios.get('/api/compliance/metrics'),
        axios.get('/api/compliance/accreditation/list?status=pending&limit=50'),
        axios.get('/api/compliance/aml/list?status=flagged&limit=50')
      ]);

      setMetrics(metricsRes.data.metrics);
      setAccreditations(accreditationsRes.data.verifications || []);
      setAMLChecks(amlRes.data.checks || []);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load compliance data');
    } finally {
      setLoading(false);
    }
  };

  const handleAccreditationReview = async (verificationId: string, approved: boolean, reason: string = '') => {
    try {
      await axios.post(`/api/compliance/accreditation/${verificationId}/review`, {
        reviewerId: 1,
        approved,
        rejectionReason: approved ? null : reason
      });
      alert(`Accreditation ${approved ? 'approved' : 'rejected'} successfully`);
      setReviewingId(null);
      loadDashboardData();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to review accreditation');
    }
  };

  const handleAMLReview = async (checkId: string, status: string, riskLevel: string) => {
    try {
      await axios.post(`/api/compliance/aml/${checkId}/review`, {
        reviewerId: 1,
        status,
        riskLevel,
        findings: {},
        actionTaken: status === 'flagged' ? 'Manual review required' : 'Cleared for investment'
      });
      alert(`AML check updated to ${status}`);
      setReviewingId(null);
      loadDashboardData();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to review AML check');
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      flagged: 'bg-red-100 text-red-800',
      clear: 'bg-green-100 text-green-800'
    };
    return colors[status?.toLowerCase()] || 'bg-gray-100 text-gray-800';
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
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Compliance Monitor</h1>
        <p className="text-gray-600">Manage KYC/AML verification, accreditation, and regulatory compliance</p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
          {error}
        </div>
      )}

      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="text-sm text-gray-600 mb-1">Pending KYC</div>
            <div className="text-3xl font-bold text-gray-900">{metrics.pendingKyc}</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="text-sm text-gray-600 mb-1">Pending Accreditation</div>
            <div className="text-3xl font-bold text-blue-600">{metrics.pendingAccreditation}</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="text-sm text-gray-600 mb-1">Flagged AML</div>
            <div className="text-3xl font-bold text-red-600">{metrics.flaggedAml}</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="text-sm text-gray-600 mb-1">Pending Filings</div>
            <div className="text-3xl font-bold text-orange-600">{metrics.pendingFilings}</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="text-sm text-gray-600 mb-1">Open Alerts</div>
            <div className="text-3xl font-bold text-purple-600">{metrics.openAlerts}</div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            <button
              onClick={() => setActiveTab('accreditation')}
              className={`px-6 py-4 text-sm font-medium border-b-2 ${
                activeTab === 'accreditation'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-800'
              }`}
            >
              Accreditation Queue ({accreditations.length})
            </button>
            <button
              onClick={() => setActiveTab('aml')}
              className={`px-6 py-4 text-sm font-medium border-b-2 ${
                activeTab === 'aml'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-800'
              }`}
            >
              AML Checks ({amlChecks.length})
            </button>
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'accreditation' && (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Investor</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Method</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Submitted</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {accreditations.map((accreditation) => (
                    <tr key={accreditation.verificationId} className="hover:bg-gray-50">
                      <td className="px-4 py-4 text-sm">
                        <div>ID: {accreditation.investorId}</div>
                        <div className="text-xs text-gray-500">
                          {accreditation.walletAddress ? `${accreditation.walletAddress.slice(0, 6)}...${accreditation.walletAddress.slice(-4)}` : 'N/A'}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-sm capitalize">{accreditation.verificationType.replace('_', ' ')}</td>
                      <td className="px-4 py-4 text-sm capitalize">{accreditation.verificationMethod.replace('_', ' ')}</td>
                      <td className="px-4 py-4 text-sm">{formatDate(accreditation.submittedAt)}</td>
                      <td className="px-4 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusBadge(accreditation.status)}`}>
                          {accreditation.status}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-sm">
                        {accreditation.status === 'pending' && (
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleAccreditationReview(accreditation.verificationId, true)}
                              className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-xs"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => {
                                const reason = prompt('Rejection reason:');
                                if (reason) handleAccreditationReview(accreditation.verificationId, false, reason);
                              }}
                              className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-xs"
                            >
                              Reject
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {accreditations.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  No pending accreditations
                </div>
              )}
            </div>
          )}

          {activeTab === 'aml' && (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Investor</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Check Type</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Provider</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Risk Level</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Checked At</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {amlChecks.map((check) => (
                    <tr key={check.checkId} className="hover:bg-gray-50">
                      <td className="px-4 py-4 text-sm">
                        <div>ID: {check.investorId}</div>
                        <div className="text-xs text-gray-500">
                          {check.walletAddress ? `${check.walletAddress.slice(0, 6)}...${check.walletAddress.slice(-4)}` : 'N/A'}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-sm capitalize">{check.checkType.replace('_', ' ')}</td>
                      <td className="px-4 py-4 text-sm capitalize">{check.provider}</td>
                      <td className="px-4 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getRiskBadge(check.riskLevel)}`}>
                          {check.riskLevel || 'N/A'}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusBadge(check.status)}`}>
                          {check.status}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-sm">{formatDate(check.checkedAt)}</td>
                      <td className="px-4 py-4 text-sm">
                        {check.status === 'flagged' && (
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleAMLReview(check.checkId, 'clear', 'low')}
                              className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-xs"
                            >
                              Clear
                            </button>
                            <button
                              onClick={() => handleAMLReview(check.checkId, 'rejected', 'critical')}
                              className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-xs"
                            >
                              Reject
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {amlChecks.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  No flagged AML checks
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ComplianceMonitor;
