import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import AdminLoginForm from '../components/AdminLoginForm';

interface Deal {
  id: string;
  parsed: any;
  repairs: any;
  analysis: any;
  status: string;
  createdAt: string;
}

const IELADashboardPage: React.FC = () => {
  const { user, loading, error, login, logout, isAdmin, isAuthenticated } = useAuth();
  const [deals, setDeals] = useState<Deal[]>([]);
  const [filteredDeals, setFilteredDeals] = useState<Deal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Define functions and effects first (before early returns)
  const loadDeals = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/deals');
      const data = await response.json();
      if (data.success) {
        setDeals(data.data);
      }
    } catch (err) {
      console.error('Failed to load deals:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const filterDeals = () => {
    let filtered = deals;

    if (statusFilter !== 'all') {
      filtered = filtered.filter(d => d.status === statusFilter);
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(d =>
        d.parsed?.address?.toLowerCase().includes(term) ||
        d.parsed?.city?.toLowerCase().includes(term) ||
        d.parsed?.state?.toLowerCase().includes(term)
      );
    }

    setFilteredDeals(filtered);
  };

  useEffect(() => {
    if (!loading && isAuthenticated() && isAdmin()) {
      loadDeals();
    }
  }, [loading, user]);

  useEffect(() => {
    filterDeals();
  }, [deals, statusFilter, searchTerm]);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Verifying authentication...</p>
        </div>
      </div>
    );
  }

  // Not authenticated
  if (!isAuthenticated()) {
    return <AdminLoginForm onLogin={login} loading={loading} error={error} />;
  }

  // Not admin
  if (!isAdmin()) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-white flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <div className="text-6xl mb-4">🚫</div>
          <h1 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h1>
          <p className="text-gray-600 mb-6">
            Admin privileges required to access IELA Dashboard.
          </p>
          <button
            onClick={logout}
            className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg font-medium"
          >
            🔓 Logout
          </button>
        </div>
      </div>
    );
  }

  const handlePublish = async (dealId: string) => {
    const deal = deals.find(d => d.id === dealId);
    
    if (!deal?.analysis) {
      alert('Deal must be analyzed before publishing');
      return;
    }

    // Ask user which marketplace to target
    const target = window.confirm(
      'Publish this deal:\n\n' +
      'OK = Investors (wholesale buyers)\n' +
      'Cancel = Tenant Buyers (rent-to-own)'
    ) ? 'investor' : 'rto';

    try {
      const response = await fetch(`/api/deals/${dealId}/publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target })
      });

      const data = await response.json();

      if (data.success) {
        alert(`✅ Deal published to marketplace for ${target === 'investor' ? 'Investors' : 'Tenant Buyers'}!`);
        loadDeals();
      } else {
        alert(`Failed to publish: ${data.error}`);
      }
    } catch (err) {
      console.error('Failed to publish deal:', err);
      alert('Failed to publish deal. Check console for details.');
    }
  };

  const handleDelete = async (dealId: string) => {
    const deal = deals.find(d => d.id === dealId);
    
    const confirmMsg = `⚠️ DELETE THIS DEAL?\n\n` +
      `${deal?.parsed?.address || 'Unknown property'}\n` +
      `${deal?.parsed?.city}, ${deal?.parsed?.state}\n\n` +
      `This action CANNOT be undone.\n\n` +
      `Click OK to permanently delete.`;

    if (!window.confirm(confirmMsg)) {
      return;
    }

    try {
      const response = await fetch(`/api/deals/${dealId}`, {
        method: 'DELETE'
      });

      const data = await response.json();

      if (data.success) {
        alert('✅ Deal deleted successfully');
        loadDeals();
      } else {
        alert(`Failed to delete: ${data.error}`);
      }
    } catch (err) {
      console.error('Failed to delete deal:', err);
      alert('Failed to delete deal. Check console for details.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-white">
      <div className="container mx-auto p-4 max-w-7xl">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-purple-800 mb-2">
                📊 IELA Deal Dashboard
              </h1>
              <p className="text-gray-600">
                Manage all wholesale real estate deals
              </p>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-600">
                Admin: <span className="font-medium">{user?.firstName} {user?.lastName}</span>
              </div>
              <div className="flex gap-2 mt-2">
                <a
                  href="/admin/iela/intake"
                  className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm"
                >
                  ➕ New Deal
                </a>
                <button
                  onClick={logout}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm"
                >
                  🔓 Logout
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search by Address
              </label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search city, state, or address..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filter by Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
              >
                <option value="all">All Statuses</option>
                <option value="draft">Draft</option>
                <option value="enriched">Enriched</option>
                <option value="analyzed">Analyzed</option>
                <option value="published">Published</option>
              </select>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-md p-4">
            <div className="text-3xl font-bold text-purple-600">{deals.length}</div>
            <div className="text-sm text-gray-600">Total Deals</div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4">
            <div className="text-3xl font-bold text-blue-600">
              {deals.filter(d => d.status === 'draft').length}
            </div>
            <div className="text-sm text-gray-600">Draft</div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4">
            <div className="text-3xl font-bold text-green-600">
              {deals.filter(d => d.status === 'published').length}
            </div>
            <div className="text-sm text-gray-600">Published</div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4">
            <div className="text-3xl font-bold text-yellow-600">
              {deals.filter(d => d.analysis?.rtoBadge === 'green').length}
            </div>
            <div className="text-sm text-gray-600">RTO-Ready</div>
          </div>
        </div>

        {/* Deals Table */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            {isLoading ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading deals...</p>
              </div>
            ) : filteredDeals.length === 0 ? (
              <div className="p-8 text-center">
                <div className="text-6xl mb-4">📭</div>
                <p className="text-gray-600 mb-4">No deals found</p>
                <a
                  href="/admin/iela/intake"
                  className="inline-block bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg"
                >
                  Create Your First Deal
                </a>
              </div>
            ) : (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Property</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Seller Contact</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Asking</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ARV</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">MAO</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">RTO</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredDeals.map((deal) => (
                    <tr key={deal.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">{deal.parsed?.address}</div>
                        <div className="text-sm text-gray-500">
                          {deal.parsed?.city}, {deal.parsed?.state} {deal.parsed?.zip}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {deal.parsed?.sellerName ? (
                          <div className="text-sm">
                            <div className="font-medium text-gray-900">{deal.parsed.sellerName}</div>
                            {deal.parsed.sellerCompany && (
                              <div className="text-xs text-gray-600">{deal.parsed.sellerCompany}</div>
                            )}
                            {deal.parsed.sellerPhone && (
                              <a 
                                href={`tel:${deal.parsed.sellerPhone}`}
                                className="text-blue-600 hover:text-blue-800 text-xs font-medium flex items-center gap-1 mt-1"
                              >
                                📞 {deal.parsed.sellerPhone}
                              </a>
                            )}
                            {deal.parsed.sellerEmail && (
                              <a 
                                href={`mailto:${deal.parsed.sellerEmail}`}
                                className="text-blue-600 hover:text-blue-800 text-xs flex items-center gap-1"
                              >
                                ✉️ Email
                              </a>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">No contact info</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        ${deal.parsed?.asking?.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        ${deal.parsed?.arv?.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        ${deal.analysis?.maoByRepair?.[1]?.mao?.toLocaleString() || 'N/A'}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2 text-xs font-semibold rounded-full ${
                          deal.analysis?.rtoBadge === 'green' ? 'bg-green-100 text-green-800' :
                          deal.analysis?.rtoBadge === 'yellow' ? 'bg-yellow-100 text-yellow-800' :
                          deal.analysis?.rtoBadge === 'red' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {deal.analysis?.rtoBadge?.toUpperCase() || 'N/A'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2 text-xs font-semibold rounded-full ${
                          deal.status === 'published' ? 'bg-green-100 text-green-800' :
                          deal.status === 'analyzed' ? 'bg-blue-100 text-blue-800' :
                          deal.status === 'enriched' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {deal.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <div className="flex gap-2">
                          {deal.status === 'published' ? (
                            <span className="text-green-600 font-medium">✅ Live</span>
                          ) : deal.analysis ? (
                            <button
                              onClick={() => handlePublish(deal.id)}
                              className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                            >
                              📤 Publish
                            </button>
                          ) : (
                            <span className="text-gray-400">Needs Analysis</span>
                          )}
                          <button
                            onClick={() => handleDelete(deal.id)}
                            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                            title="Delete deal permanently"
                          >
                            🗑️ Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default IELADashboardPage;
