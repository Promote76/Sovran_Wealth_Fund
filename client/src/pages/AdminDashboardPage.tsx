import React, { useState, useEffect } from 'react';
import { KYCComprehensiveAdminDashboard } from '../components/kyc/KYCComprehensiveAdminDashboard';
import AdminLoginForm from '../components/AdminLoginForm';
import { useAuth } from '../hooks/useAuth';
import MarketingHubPage from './MarketingHubPage';

const AdminDashboardPage: React.FC = () => {
  const { user, loading, error, login, logout, isAdmin, isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState<'kyc' | 'marketing' | 'iela' | 'fractional'>('kyc');

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
              <button
                onClick={() => setActiveTab('fractional')}
                className={`px-8 py-4 text-lg font-medium border-b-2 transition-colors ${
                  activeTab === 'fractional'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="flex items-center gap-2">
                  <span>🏢</span>
                  <span>Fractional RE</span>
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
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                <h3 className="text-xl font-bold text-gray-800 mb-2">Wholesale Deal (SMS)</h3>
                <p className="text-gray-600 mb-4">
                  Add new wholesale deals via SMS/text submission. Includes automated property data enrichment and analysis.
                </p>
                <div className="flex items-center text-green-600 font-medium">
                  <span>Create Deal</span>
                  <span className="ml-2">→</span>
                </div>
              </a>

              <a
                href="/admin/land/submit"
                className="block bg-gradient-to-br from-amber-50 to-yellow-50 rounded-lg p-6 hover:shadow-lg transition-shadow border-2 border-amber-200 hover:border-amber-400"
              >
                <div className="text-4xl mb-3">🌾</div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">Land Listing</h3>
                <p className="text-gray-600 mb-4">
                  Submit agricultural, recreational, or timber land with CRP income, acreage, and investment analysis.
                </p>
                <div className="flex items-center text-amber-600 font-medium">
                  <span>Submit Land</span>
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
        {activeTab === 'fractional' && <FractionalAdminPanel />}
      </div>
    </div>
  );
};

const FractionalAdminPanel: React.FC = () => {
  const [deals, setDeals] = useState<any[]>([]);
  const [fractionalProperties, setFractionalProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [selectedDeal, setSelectedDeal] = useState<any>(null);
  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [dealsRes, propertiesRes] = await Promise.all([
        fetch('/api/deals?status=published'),
        fetch('/api/fractional/properties')
      ]);

      if (dealsRes.ok) {
        const dealsData = await dealsRes.json();
        setDeals(dealsData.data || dealsData.deals || []);
      }

      if (propertiesRes.ok) {
        const propertiesData = await propertiesRes.json();
        setFractionalProperties(propertiesData.properties || []);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFractionalize = async (deal: any) => {
    setCreating(true);
    setMessage(null);

    try {
      const response = await fetch('/api/fractional/create-offering', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          dealId: deal.id,
          totalShares: 10000,
          sharePrice: Math.ceil((deal.parsed?.asking || 100000) / 10000),
          monthlyRent: deal.predictions?.rent || 0,
          monthlyExpenses: (deal.parsed?.asking || 100000) * 0.01 / 12,
          reserveFundPercent: 10,
          lockupMonths: 6
        })
      });

      const data = await response.json();

      if (data.success) {
        setMessage({type: 'success', text: `✅ Successfully created fractional offering for ${deal.parsed?.address}`});
        loadData();
        setSelectedDeal(null);
      } else {
        setMessage({type: 'error', text: `❌ ${data.error}`});
      }
    } catch (error: any) {
      setMessage({type: 'error', text: `❌ ${error.message}`});
    } finally {
      setCreating(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(value);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">
          🏢 Fractional Real Estate Management
        </h2>
        <p className="text-gray-600">
          Convert IELA deals into fractional investment offerings with 4-tier investor model and automated revenue distribution.
        </p>
      </div>

      {message && (
        <div className={`p-4 rounded-lg ${message.type === 'success' ? 'bg-green-50 border border-green-200 text-green-800' : 'bg-red-50 border border-red-200 text-red-800'}`}>
          {message.text}
        </div>
      )}

      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-4">📊 Existing Fractional Properties</h3>
        
        {fractionalProperties.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No fractional properties yet. Convert an IELA deal below to get started.
          </div>
        ) : (
          <div className="grid gap-4">
            {fractionalProperties.map((prop) => (
              <div key={prop.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-semibold text-gray-900">{prop.deal?.address || `Property #${prop.id}`}</h4>
                    <div className="text-sm text-gray-600 mt-1">
                      {(prop.sharesSold || 0).toLocaleString()} / {(prop.totalShares || 0).toLocaleString()} shares sold
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-600">Property Value</div>
                    <div className="font-bold text-green-600">{formatCurrency(parseFloat(prop.propertyValue || 0))}</div>
                  </div>
                </div>
                
                <div className="grid grid-cols-4 gap-3 mt-4 text-sm">
                  <div>
                    <div className="text-gray-600">Share Price</div>
                    <div className="font-semibold">{formatCurrency(parseFloat(prop.sharePrice || 0))}</div>
                  </div>
                  <div>
                    <div className="text-gray-600">Monthly Rent</div>
                    <div className="font-semibold">{formatCurrency(parseFloat(prop.monthlyRent || 0))}</div>
                  </div>
                  <div>
                    <div className="text-gray-600">Status</div>
                    <div className={`font-semibold ${prop.status === 'active' ? 'text-green-600' : 'text-gray-600'}`}>
                      {prop.status}
                    </div>
                  </div>
                  <div>
                    <div className="text-gray-600">Investors</div>
                    <div className="font-semibold">{prop.investor_count || 0}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-4">🔄 Convert IELA Deals to Fractional</h3>
        
        {deals.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No published IELA deals available. Publish deals from the IELA Dashboard first.
          </div>
        ) : (
          <div className="grid gap-4">
            {deals.map((deal) => {
              const alreadyFractionalized = fractionalProperties.some(
                (fp) => fp.deal_id === deal.id
              );

              return (
                <div key={deal.id} className={`border rounded-lg p-4 ${alreadyFractionalized ? 'bg-gray-50 border-gray-300' : 'border-blue-200 bg-blue-50'}`}>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900">{deal.parsed?.address}</h4>
                      <div className="text-sm text-gray-600 mt-1">
                        {deal.parsed?.city}, {deal.parsed?.state} {deal.parsed?.zip}
                      </div>
                      <div className="mt-2 text-sm">
                        <span className="text-gray-600">Asking:</span> <span className="font-semibold">{formatCurrency(deal.parsed?.asking || 0)}</span>
                        {deal.predictions?.rent && (
                          <>
                            <span className="ml-4 text-gray-600">Est. Rent:</span> <span className="font-semibold">{formatCurrency(deal.predictions.rent)}/mo</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div>
                      {alreadyFractionalized ? (
                        <div className="px-4 py-2 bg-gray-300 text-gray-600 rounded-lg text-sm font-medium">
                          ✓ Fractionalized
                        </div>
                      ) : (
                        <button
                          onClick={() => setSelectedDeal(deal)}
                          disabled={creating}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                        >
                          🏢 Fractionalize
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {selectedDeal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              Create Fractional Offering
            </h3>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <h4 className="font-semibold text-gray-900 mb-2">{selectedDeal.parsed?.address}</h4>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <div className="text-gray-600">Property Value</div>
                  <div className="font-semibold">{formatCurrency(selectedDeal.parsed?.asking || 0)}</div>
                </div>
                <div>
                  <div className="text-gray-600">Est. Monthly Rent</div>
                  <div className="font-semibold">{formatCurrency(selectedDeal.predictions?.rent || 0)}</div>
                </div>
              </div>
            </div>

            <div className="space-y-3 mb-6">
              <div className="bg-gray-50 p-3 rounded">
                <div className="flex justify-between">
                  <span className="text-gray-700">Total Shares:</span>
                  <span className="font-semibold">10,000</span>
                </div>
              </div>
              <div className="bg-gray-50 p-3 rounded">
                <div className="flex justify-between">
                  <span className="text-gray-700">Price per Share:</span>
                  <span className="font-semibold">{formatCurrency(Math.ceil((selectedDeal.parsed?.asking || 100000) / 10000))}</span>
                </div>
              </div>
              <div className="bg-gray-50 p-3 rounded">
                <div className="flex justify-between">
                  <span className="text-gray-700">Min Investment:</span>
                  <span className="font-semibold">$500</span>
                </div>
              </div>
              <div className="bg-gray-50 p-3 rounded">
                <div className="flex justify-between">
                  <span className="text-gray-700">Max Ownership:</span>
                  <span className="font-semibold">25%</span>
                </div>
              </div>
              <div className="bg-gray-50 p-3 rounded">
                <div className="flex justify-between">
                  <span className="text-gray-700">Lockup Period:</span>
                  <span className="font-semibold">6 months</span>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setSelectedDeal(null)}
                disabled={creating}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleFractionalize(selectedDeal)}
                disabled={creating}
                className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-50"
              >
                {creating ? '🔄 Creating...' : '✓ Create Offering'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboardPage;