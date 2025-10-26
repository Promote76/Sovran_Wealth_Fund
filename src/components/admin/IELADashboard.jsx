import React, { useState, useEffect } from 'react';

const IELADashboard = () => {
  const [deals, setDeals] = useState([]);
  const [selectedDeal, setSelectedDeal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchDeals();
  }, [statusFilter]);

  const fetchDeals = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.append('status', statusFilter);
      
      const response = await fetch(`/api/deals?${params}`);
      const data = await response.json();
      
      if (data.success) {
        setDeals(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch deals:', error);
    } finally {
      setLoading(false);
    }
  };

  const analyzeDeal = async (dealId) => {
    try {
      const response = await fetch(`/api/deals/${dealId}/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });
      
      const data = await response.json();
      if (data.success) {
        await fetchDeals();
        if (selectedDeal?.id === dealId) {
          setSelectedDeal(data.data);
        }
      }
    } catch (error) {
      console.error('Failed to analyze deal:', error);
    }
  };

  const publishDeal = async (dealId, target) => {
    try {
      const response = await fetch(`/api/deals/${dealId}/publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target })
      });
      
      const data = await response.json();
      if (data.success) {
        alert(`Deal published for ${target}s!`);
        await fetchDeals();
      }
    } catch (error) {
      console.error('Failed to publish deal:', error);
    }
  };

  const filteredDeals = deals.filter(deal => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      deal.parsed?.address?.toLowerCase().includes(search) ||
      deal.parsed?.city?.toLowerCase().includes(search) ||
      deal.parsed?.state?.toLowerCase().includes(search) ||
      deal.id.toLowerCase().includes(search)
    );
  });

  const getStatusBadge = (status) => {
    const colors = {
      draft: 'bg-gray-100 text-gray-800',
      suppressed: 'bg-red-100 text-red-800',
      listed_investor: 'bg-green-100 text-green-800',
      listed_rto: 'bg-blue-100 text-blue-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getRTOBadge = (badge) => {
    const colors = {
      green: 'bg-green-500 text-white',
      yellow: 'bg-yellow-500 text-white',
      red: 'bg-red-500 text-white'
    };
    const labels = {
      green: '🟢 Excellent',
      yellow: '🟡 Moderate',
      red: '🔴 Challenging'
    };
    return { color: colors[badge] || 'bg-gray-500 text-white', label: labels[badge] || badge };
  };

  const formatCurrency = (value) => {
    if (!value) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(value);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">IELA Pipeline Dashboard</h1>
          <p className="text-gray-600">Ingest → Enrich → Analyze → List</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Panel - Deal List */}
          <div className="lg:col-span-1 bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Deals</h2>
              
              <input
                type="text"
                placeholder="Search address, city..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md mb-3"
              />

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="all">All Statuses</option>
                <option value="draft">Draft</option>
                <option value="suppressed">Suppressed</option>
                <option value="listed_investor">Listed (Investor)</option>
                <option value="listed_rto">Listed (RTO)</option>
              </select>
            </div>

            <div className="overflow-y-auto" style={{ maxHeight: 'calc(100vh - 300px)' }}>
              {loading ? (
                <div className="p-8 text-center text-gray-500">Loading...</div>
              ) : filteredDeals.length === 0 ? (
                <div className="p-8 text-center text-gray-500">No deals found</div>
              ) : (
                filteredDeals.map(deal => (
                  <div
                    key={deal.id}
                    onClick={() => setSelectedDeal(deal)}
                    className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
                      selectedDeal?.id === deal.id ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 text-sm leading-tight">
                          {deal.parsed?.address || 'No address'}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {deal.parsed?.city}, {deal.parsed?.state} {deal.parsed?.zip}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex gap-2 text-xs">
                        <span className="font-semibold text-green-600">
                          {formatCurrency(deal.parsed?.asking)}
                        </span>
                        <span className="text-gray-400">•</span>
                        <span className="text-gray-600">
                          ARV: {formatCurrency(deal.parsed?.arv)}
                        </span>
                      </div>
                    </div>

                    <div className="mt-2">
                      <span className={`inline-block px-2 py-1 text-xs font-medium rounded ${getStatusBadge(deal.status)}`}>
                        {deal.status}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Right Panel - Deal Details */}
          <div className="lg:col-span-2">
            {selectedDeal ? (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">
                        {selectedDeal.parsed?.address || 'No address'}
                      </h2>
                      <p className="text-gray-600 mt-1">
                        {selectedDeal.parsed?.city}, {selectedDeal.parsed?.state} {selectedDeal.parsed?.zip}
                      </p>
                    </div>
                    <span className={`px-3 py-1 text-sm font-medium rounded ${getStatusBadge(selectedDeal.status)}`}>
                      {selectedDeal.status}
                    </span>
                  </div>

                  <div className="flex gap-3">
                    {!selectedDeal.analysis && (
                      <button
                        onClick={() => analyzeDeal(selectedDeal.id)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                      >
                        Run Analysis
                      </button>
                    )}
                    {selectedDeal.analysis && selectedDeal.status === 'draft' && (
                      <>
                        <button
                          onClick={() => publishDeal(selectedDeal.id, 'investor')}
                          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                        >
                          Publish for Investors
                        </button>
                        <button
                          onClick={() => publishDeal(selectedDeal.id, 'rto')}
                          className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
                        >
                          Publish for RTO
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Property Details */}
                <div className="p-6 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Property Details</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Asking Price</p>
                      <p className="text-2xl font-bold text-gray-900">{formatCurrency(selectedDeal.parsed?.asking)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">ARV</p>
                      <p className="text-2xl font-bold text-gray-900">{formatCurrency(selectedDeal.parsed?.arv)}</p>
                    </div>
                    {selectedDeal.parsed?.contactName && (
                      <div>
                        <p className="text-sm text-gray-600">Contact</p>
                        <p className="text-base font-medium text-gray-900">{selectedDeal.parsed.contactName}</p>
                        <p className="text-sm text-gray-600">{selectedDeal.parsed.contactPhone}</p>
                      </div>
                    )}
                    {selectedDeal.parsed?.url && (
                      <div>
                        <p className="text-sm text-gray-600">Listing URL</p>
                        <a
                          href={selectedDeal.parsed.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:underline"
                        >
                          View Listing →
                        </a>
                      </div>
                    )}
                  </div>
                </div>

                {/* Analysis Results */}
                {selectedDeal.analysis && (
                  <div className="p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Analysis Results</h3>
                    
                    {/* MAO Table */}
                    <div className="mb-6">
                      <h4 className="text-sm font-medium text-gray-700 mb-3">Maximum Allowable Offer (70% ARV Rule)</h4>
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-2 text-left text-gray-700">Repair Estimate</th>
                            <th className="px-4 py-2 text-left text-gray-700">MAO</th>
                            <th className="px-4 py-2 text-left text-gray-700">vs. Asking</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedDeal.analysis.maoByRepair?.map((item, index) => {
                            const spread = item.mao - selectedDeal.parsed.asking;
                            const isGoodDeal = spread > 0;
                            return (
                              <tr key={index} className="border-t border-gray-100">
                                <td className="px-4 py-2">{formatCurrency(item.repair)}</td>
                                <td className="px-4 py-2 font-semibold">{formatCurrency(item.mao)}</td>
                                <td className={`px-4 py-2 font-medium ${isGoodDeal ? 'text-green-600' : 'text-red-600'}`}>
                                  {isGoodDeal ? '+' : ''}{formatCurrency(spread)}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    {/* Price to ARV */}
                    <div className="mb-6">
                      <h4 className="text-sm font-medium text-gray-700 mb-3">Price to ARV Ratio</h4>
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-2 text-left text-gray-700">Repair Estimate</th>
                            <th className="px-4 py-2 text-left text-gray-700">Ratio</th>
                            <th className="px-4 py-2 text-left text-gray-700">Rating</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedDeal.analysis.priceToArvPctWithRepairs?.map((item, index) => {
                            const isGood = item.pct <= 70;
                            const isOk = item.pct <= 85;
                            return (
                              <tr key={index} className="border-t border-gray-100">
                                <td className="px-4 py-2">{formatCurrency(item.repair)}</td>
                                <td className="px-4 py-2 font-semibold">{item.pct.toFixed(1)}%</td>
                                <td className="px-4 py-2">
                                  <span className={`inline-block px-2 py-1 text-xs font-medium rounded ${
                                    isGood ? 'bg-green-100 text-green-800' : isOk ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
                                  }`}>
                                    {isGood ? 'Excellent' : isOk ? 'Good' : 'Overpriced'}
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    {/* RTO Suitability */}
                    {selectedDeal.analysis.rtoBadge && (
                      <div className="mb-6">
                        <h4 className="text-sm font-medium text-gray-700 mb-3">Rent-to-Own Suitability</h4>
                        <div className="bg-gray-50 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-sm font-medium text-gray-700">Rating</span>
                            <span className={`px-3 py-1 text-sm font-medium rounded ${getRTOBadge(selectedDeal.analysis.rtoBadge).color}`}>
                              {getRTOBadge(selectedDeal.analysis.rtoBadge).label}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600">{selectedDeal.analysis.recommendation}</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Compliance Info */}
                {selectedDeal.compliance && (
                  <div className="p-6 border-t border-gray-200 bg-gray-50">
                    <h3 className="text-sm font-semibold text-gray-900 mb-2">Compliance Log</h3>
                    <div className="space-y-1">
                      {selectedDeal.compliance.consentLog?.map((log, index) => (
                        <p key={index} className="text-xs text-gray-600">• {log}</p>
                      ))}
                    </div>
                    {selectedDeal.compliance.optOutDetected && (
                      <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded">
                        <p className="text-xs text-yellow-800">⚠️ Opt-out keyword detected in message</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
                <div className="text-gray-400 mb-4">
                  <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <p className="text-gray-600 text-lg">Select a deal to view details</p>
                <p className="text-gray-400 text-sm mt-2">Choose from the list on the left to see analysis and options</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default IELADashboard;
