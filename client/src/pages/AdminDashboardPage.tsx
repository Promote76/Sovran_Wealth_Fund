import React, { useState } from 'react';
import { KYCComprehensiveAdminDashboard } from '../components/kyc/KYCComprehensiveAdminDashboard';
import AdminLoginForm from '../components/AdminLoginForm';
import { useAuth } from '../hooks/useAuth';
import MarketingHubPage from './MarketingHubPage';

const AdminDashboardPage: React.FC = () => {
  const { user, loading, error, login, logout, isAdmin, isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState<'kyc' | 'marketing' | 'iela'>('kyc');

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Verifying authentication...</p>
        </div>
      </div>
    );
  }

  // Show login form if not authenticated
  if (!isAuthenticated()) {
    return <AdminLoginForm onLogin={login} loading={loading} error={error} />;
  }

  // Show access denied if authenticated but not admin
  if (!isAdmin()) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <div className="text-6xl mb-4">🚫</div>
          <h1 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h1>
          <p className="text-gray-600 mb-6">
            You don't have permission to access the admin dashboard.
            <br />
            Admin privileges are required.
          </p>
          <div className="space-y-3">
            <p className="text-sm text-gray-500">
              Current Role: <span className="font-medium">{user?.role}</span>
            </p>
            <button
              onClick={logout}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
            >
              🔓 Logout
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Show admin dashboard if authenticated and authorized
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white">
      <div className="container mx-auto p-4">
        {/* Admin Header with User Info */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-blue-800 mb-2">
                🏛️ AXIOM Admin Dashboard
              </h1>
              <p className="text-gray-600">
                Comprehensive platform administration, KYC management, and marketing tools
              </p>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-600">
                Logged in as: <span className="font-medium">{user?.firstName} {user?.lastName}</span>
              </div>
              <div className="text-xs text-gray-500 mb-2">
                Role: <span className="font-medium text-green-600">{user?.role}</span>
              </div>
              <button
                onClick={logout}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                🔓 Logout
              </button>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white rounded-lg shadow-md mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              <button
                onClick={() => setActiveTab('kyc')}
                className={`px-8 py-4 text-lg font-medium border-b-2 transition-colors ${
                  activeTab === 'kyc'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="flex items-center gap-2">
                  <span>🔐</span>
                  <span>KYC Admin</span>
                </span>
              </button>
              <button
                onClick={() => setActiveTab('marketing')}
                className={`px-8 py-4 text-lg font-medium border-b-2 transition-colors ${
                  activeTab === 'marketing'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="flex items-center gap-2">
                  <span>🎬</span>
                  <span>Marketing Hub</span>
                </span>
              </button>
              <button
                onClick={() => setActiveTab('iela')}
                className={`px-8 py-4 text-lg font-medium border-b-2 transition-colors ${
                  activeTab === 'iela'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="flex items-center gap-2">
                  <span>🏘️</span>
                  <span>IELA Pipeline</span>
                </span>
              </button>
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'kyc' && <KYCComprehensiveAdminDashboard />}
        {activeTab === 'marketing' && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <MarketingHubPage standalone={false} />
          </div>
        )}
        {activeTab === 'iela' && (
          <div className="bg-white rounded-lg shadow-md p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              🏘️ IELA Pipeline - Wholesale Real Estate
            </h2>
            <p className="text-gray-600 mb-8">
              Manage wholesale real estate deals with automated enrichment, analysis, and investor matching.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <a
                href="/admin/iela/dashboard"
                className="block bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg p-6 hover:shadow-lg transition-shadow border-2 border-blue-200 hover:border-blue-400"
              >
                <div className="text-4xl mb-3">📊</div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">Deal Dashboard</h3>
                <p className="text-gray-600 mb-4">
                  View and manage all wholesale real estate deals. Filter by status, search properties, and publish deals to investors.
                </p>
                <div className="flex items-center text-blue-600 font-medium">
                  <span>Open Dashboard</span>
                  <span className="ml-2">→</span>
                </div>
              </a>

              <a
                href="/admin/iela/intake"
                className="block bg-gradient-to-br from-green-50 to-teal-50 rounded-lg p-6 hover:shadow-lg transition-shadow border-2 border-green-200 hover:border-green-400"
              >
                <div className="text-4xl mb-3">📝</div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">Create New Deal</h3>
                <p className="text-gray-600 mb-4">
                  Add new wholesale deals manually or load examples. Includes automated enrichment with property data and financial analysis.
                </p>
                <div className="flex items-center text-green-600 font-medium">
                  <span>Create Deal</span>
                  <span className="ml-2">→</span>
                </div>
              </a>
            </div>

            <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <h4 className="font-semibold text-yellow-800 mb-2">📋 Features:</h4>
              <ul className="text-sm text-yellow-700 space-y-1">
                <li>✅ Automated property enrichment with Attom Data API</li>
                <li>✅ ML-powered repair estimates and rent predictions</li>
                <li>✅ Profitability analysis (MAO, ROI, cap rate)</li>
                <li>✅ Rent-to-Own suitability scoring</li>
                <li>✅ Automated investor matching</li>
                <li>✅ PDF contract generation</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboardPage;