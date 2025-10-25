import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';

interface UserDetails {
  user: {
    id: number;
    email: string;
    firstName: string | null;
    lastName: string | null;
    role: string;
    accountStatus: string;
    emailVerified: boolean;
    createdAt: string;
    lastLoginAt: string | null;
  };
  journey: {
    currentStep: string;
    completedSteps: string[];
    hasPersonalProfile: boolean;
    hasFinancialProfile: boolean;
    hasRiskProfile: boolean;
    hasKycVerification: boolean;
    isCompleted: boolean;
    totalTimeSpent: number | null;
  } | null;
  personalProfile: any;
  financialProfile: any;
  riskProfile: any;
  enrollments: Array<{
    programType: string;
    status: string;
    enrolledAt: string;
  }>;
  kycVerification: any;
}

interface UserDetailModalProps {
  userId: number;
  onClose: () => void;
}

export const UserDetailModal: React.FC<UserDetailModalProps> = ({ userId, onClose }) => {
  const [loading, setLoading] = useState(true);
  const [details, setDetails] = useState<UserDetails | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<'overview' | 'profiles' | 'programs'>('overview');

  useEffect(() => {
    fetchUserDetails();
  }, [userId]);

  const fetchUserDetails = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/unified-registration-admin/users/${userId}`, {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to fetch user details');
      }

      const data = await response.json();
      setDetails(data);
    } catch (err: any) {
      console.error('Error fetching user details:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteStep = async (stepName: string) => {
    try {
      const response = await fetch(`/api/unified-registration-admin/users/${userId}/complete-step`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ stepName })
      });

      if (!response.ok) {
        throw new Error('Failed to complete step');
      }

      await fetchUserDetails(); // Refresh data
      alert(`Step "${stepName}" marked as complete!`);
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  const handleUpdateStatus = async (newStatus: string) => {
    try {
      const reason = prompt('Enter reason for status change:');
      if (!reason) return;

      const response = await fetch(`/api/unified-registration-admin/users/${userId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ accountStatus: newStatus, reason })
      });

      if (!response.ok) {
        throw new Error('Failed to update status');
      }

      await fetchUserDetails(); // Refresh data
      alert('User status updated successfully!');
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
            <p className="text-gray-600">Loading user details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !details) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 max-w-md">
          <h3 className="text-xl font-bold text-red-600 mb-4">Error</h3>
          <p className="text-gray-600 mb-6">{error || 'User not found'}</p>
          <Button onClick={onClose}>Close</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-lg max-w-5xl w-full my-8">
        {/* Header */}
        <div className="bg-blue-600 text-white px-6 py-4 rounded-t-lg">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold">
                {details.user.firstName && details.user.lastName
                  ? `${details.user.firstName} ${details.user.lastName}`
                  : details.user.email}
              </h2>
              <p className="text-blue-100 text-sm mt-1">{details.user.email}</p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 text-2xl"
            >
              ×
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 bg-gray-50 px-6">
          <nav className="flex space-x-8" aria-label="Tabs">
            <button
              onClick={() => setActiveSection('overview')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeSection === 'overview'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveSection('profiles')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeSection === 'profiles'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Profiles
            </button>
            <button
              onClick={() => setActiveSection('programs')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeSection === 'programs'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Programs
            </button>
          </nav>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[600px] overflow-y-auto">
          {activeSection === 'overview' && (
            <div className="space-y-6">
              {/* Account Info */}
              <Card>
                <CardHeader>
                  <CardTitle>Account Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">User ID</p>
                      <p className="font-medium">{details.user.id}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Role</p>
                      <p className="font-medium">{details.user.role}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Account Status</p>
                      <p className="font-medium">{details.user.accountStatus}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Email Verified</p>
                      <p className="font-medium">{details.user.emailVerified ? 'Yes' : 'No'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Created</p>
                      <p className="font-medium">{new Date(details.user.createdAt).toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Last Login</p>
                      <p className="font-medium">
                        {details.user.lastLoginAt
                          ? new Date(details.user.lastLoginAt).toLocaleString()
                          : 'Never'}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 flex gap-2">
                    <Button
                      onClick={() => handleUpdateStatus('active')}
                      className="bg-green-600 hover:bg-green-700 text-white text-sm"
                    >
                      Activate
                    </Button>
                    <Button
                      onClick={() => handleUpdateStatus('suspended')}
                      className="bg-red-600 hover:bg-red-700 text-white text-sm"
                    >
                      Suspend
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Registration Progress */}
              {details.journey && (
                <Card>
                  <CardHeader>
                    <CardTitle>Registration Progress</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Current Step:</span>
                        <span className="text-sm bg-blue-100 text-blue-800 px-3 py-1 rounded-full">
                          {details.journey.currentStep.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3 mt-4">
                        <div className="flex items-center gap-2">
                          <div className={`w-4 h-4 rounded-full ${details.journey.hasPersonalProfile ? 'bg-green-500' : 'bg-gray-300'}`} />
                          <span className="text-sm">Personal Profile</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className={`w-4 h-4 rounded-full ${details.journey.hasFinancialProfile ? 'bg-green-500' : 'bg-gray-300'}`} />
                          <span className="text-sm">Financial Profile</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className={`w-4 h-4 rounded-full ${details.journey.hasRiskProfile ? 'bg-green-500' : 'bg-gray-300'}`} />
                          <span className="text-sm">Risk Profile</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className={`w-4 h-4 rounded-full ${details.journey.hasKycVerification ? 'bg-green-500' : 'bg-gray-300'}`} />
                          <span className="text-sm">KYC Verification</span>
                        </div>
                      </div>

                      <div className="mt-4 pt-4 border-t">
                        <p className="text-sm text-gray-600 mb-2">Manual Step Completion</p>
                        <div className="flex gap-2 flex-wrap">
                          <Button
                            onClick={() => handleCompleteStep('personal_profile')}
                            disabled={details.journey.hasPersonalProfile}
                            className="text-xs"
                            variant="outline"
                          >
                            Complete Personal
                          </Button>
                          <Button
                            onClick={() => handleCompleteStep('financial_profile')}
                            disabled={details.journey.hasFinancialProfile}
                            className="text-xs"
                            variant="outline"
                          >
                            Complete Financial
                          </Button>
                          <Button
                            onClick={() => handleCompleteStep('risk_profile')}
                            disabled={details.journey.hasRiskProfile}
                            className="text-xs"
                            variant="outline"
                          >
                            Complete Risk
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {activeSection === 'profiles' && (
            <div className="space-y-6">
              {details.personalProfile ? (
                <Card>
                  <CardHeader>
                    <CardTitle>Personal Profile</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div><strong>Name:</strong> {details.personalProfile.firstName} {details.personalProfile.lastName}</div>
                      <div><strong>Phone:</strong> {details.personalProfile.phoneNumber}</div>
                      <div><strong>Address:</strong> {details.personalProfile.address}</div>
                      <div><strong>City:</strong> {details.personalProfile.city}</div>
                      <div><strong>State:</strong> {details.personalProfile.state}</div>
                      <div><strong>ZIP:</strong> {details.personalProfile.zipCode}</div>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <p className="text-gray-500">No personal profile data</p>
              )}

              {details.financialProfile ? (
                <Card>
                  <CardHeader>
                    <CardTitle>Financial Profile</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div><strong>Annual Income:</strong> ${details.financialProfile.annualIncome}</div>
                      <div><strong>Employment:</strong> {details.financialProfile.employmentStatus}</div>
                      <div><strong>Net Worth:</strong> ${details.financialProfile.netWorth}</div>
                      <div><strong>Credit Score:</strong> {details.financialProfile.creditScoreRange}</div>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <p className="text-gray-500">No financial profile data</p>
              )}

              {details.riskProfile ? (
                <Card>
                  <CardHeader>
                    <CardTitle>Risk Profile</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div><strong>Risk Tolerance:</strong> {details.riskProfile.riskTolerance}/10</div>
                      <div><strong>Investment Goals:</strong> {details.riskProfile.investmentGoals?.join(', ')}</div>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <p className="text-gray-500">No risk profile data</p>
              )}
            </div>
          )}

          {activeSection === 'programs' && (
            <div className="space-y-4">
              {details.enrollments.length > 0 ? (
                details.enrollments.map((enrollment, idx) => (
                  <Card key={idx}>
                    <CardContent className="pt-6">
                      <div className="flex justify-between items-center">
                        <div>
                          <h3 className="font-bold">{enrollment.programType}</h3>
                          <p className="text-sm text-gray-600">
                            Enrolled: {new Date(enrollment.enrolledAt).toLocaleDateString()}
                          </p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-sm ${
                          enrollment.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {enrollment.status}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <p className="text-gray-500">No program enrollments</p>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t px-6 py-4 bg-gray-50 rounded-b-lg">
          <div className="flex justify-end">
            <Button onClick={onClose} variant="outline">
              Close
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
