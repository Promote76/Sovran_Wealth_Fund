import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface Deal {
  id: string;
  parsed: any;
  repairs: any;
  analysis: any;
  rents: any;
  media: any[];
  status: string;
  createdAt: string;
  predictions: any;
}

const DealMarketplacePage: React.FC = () => {
  const navigate = useNavigate();
  const [deals, setDeals] = useState<Deal[]>([]);
  const [filteredDeals, setFilteredDeals] = useState<Deal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterType, setFilterType] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('newest');

  useEffect(() => {
    loadDeals();
  }, []);

  useEffect(() => {
    filterAndSortDeals();
  }, [deals, filterType, searchTerm, sortBy]);

  const loadDeals = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/deals?status=published');
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

  const filterAndSortDeals = () => {
    let filtered = deals;

    if (filterType === 'rto') {
      filtered = filtered.filter(d => d.analysis?.rtoBadge === 'green');
    } else if (filterType === 'investor') {
      filtered = filtered.filter(d => d.analysis?.maoByRepair);
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(d =>
        d.parsed?.address?.toLowerCase().includes(term) ||
        d.parsed?.city?.toLowerCase().includes(term) ||
        d.parsed?.state?.toLowerCase().includes(term) ||
        d.parsed?.zip?.toLowerCase().includes(term)
      );
    }

    filtered.sort((a, b) => {
      if (sortBy === 'newest') {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      } else if (sortBy === 'price-low') {
        return (a.parsed?.asking || 0) - (b.parsed?.asking || 0);
      } else if (sortBy === 'price-high') {
        return (b.parsed?.asking || 0) - (a.parsed?.asking || 0);
      } else if (sortBy === 'roi') {
        return (b.analysis?.maoByRepair?.[1]?.roi || 0) - (a.analysis?.maoByRepair?.[1]?.roi || 0);
      }
      return 0;
    });

    setFilteredDeals(filtered);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(value);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      <div className="container mx-auto p-4 max-w-7xl">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            🏘️ Investment Property Marketplace
          </h1>
          <p className="text-gray-600">
            Pre-analyzed wholesale real estate deals - ready for investors and rent-to-own participants
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search Location
              </label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="City, state, or ZIP..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Deal Type
              </label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Deals</option>
                <option value="investor">Investor Opportunities</option>
                <option value="rto">Rent-to-Own Ready</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sort By
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="newest">Newest First</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="roi">Best ROI</option>
              </select>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-md p-4">
            <div className="text-3xl font-bold text-blue-600">{filteredDeals.length}</div>
            <div className="text-sm text-gray-600">Available Deals</div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4">
            <div className="text-3xl font-bold text-green-600">
              {filteredDeals.filter(d => d.analysis?.rtoBadge === 'green').length}
            </div>
            <div className="text-sm text-gray-600">RTO-Ready Properties</div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4">
            <div className="text-3xl font-bold text-purple-600">
              {formatCurrency(
                filteredDeals.reduce((sum, d) => sum + (d.parsed?.asking || 0), 0) /
                  (filteredDeals.length || 1)
              )}
            </div>
            <div className="text-sm text-gray-600">Average Price</div>
          </div>
        </div>

        {/* Deals Grid */}
        {isLoading ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading investment opportunities...</p>
          </div>
        ) : filteredDeals.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">No Deals Found</h3>
            <p className="text-gray-600">
              Try adjusting your filters or check back later for new opportunities.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDeals.map((deal) => (
              <div
                key={deal.id}
                className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow"
              >
                {/* Property Image */}
                <div className="relative h-48 bg-gradient-to-br from-gray-200 to-gray-300">
                  {deal.media && deal.media.length > 0 ? (
                    <img
                      src={deal.media[0]}
                      alt="Property"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300"><rect fill="%23ddd" width="400" height="300"/><text x="50%" y="50%" text-anchor="middle" fill="%23999" font-size="20">No Image</text></svg>';
                      }}
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <span className="text-6xl">🏠</span>
                    </div>
                  )}
                  {deal.analysis?.rtoBadge === 'green' && (
                    <div className="absolute top-2 right-2 bg-green-500 text-white px-3 py-1 rounded-full text-xs font-semibold">
                      RTO Ready
                    </div>
                  )}
                </div>

                {/* Property Details */}
                <div className="p-4">
                  <h3 className="text-lg font-bold text-gray-800 mb-1">
                    {deal.parsed?.address}
                  </h3>
                  <p className="text-sm text-gray-600 mb-3">
                    {deal.parsed?.city}, {deal.parsed?.state} {deal.parsed?.zip}
                  </p>

                  <div className="grid grid-cols-2 gap-2 mb-3">
                    <div className="text-center bg-blue-50 rounded p-2">
                      <div className="text-xl font-bold text-blue-600">
                        {formatCurrency(deal.parsed?.asking || 0)}
                      </div>
                      <div className="text-xs text-gray-600">Asking Price</div>
                    </div>
                    <div className="text-center bg-purple-50 rounded p-2">
                      <div className="text-xl font-bold text-purple-600">
                        {formatCurrency(deal.parsed?.arv || 0)}
                      </div>
                      <div className="text-xs text-gray-600">ARV</div>
                    </div>
                  </div>

                  {deal.analysis?.maoByRepair && (
                    <div className="mb-3">
                      <div className="text-sm font-semibold text-gray-700 mb-1">
                        Investment Analysis:
                      </div>
                      <div className="bg-green-50 rounded p-2">
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-600">MAO (Mid Repairs):</span>
                          <span className="font-semibold text-green-700">
                            {formatCurrency(deal.analysis.maoByRepair[1]?.mao || 0)}
                          </span>
                        </div>
                        <div className="flex justify-between text-xs mt-1">
                          <span className="text-gray-600">Potential ROI:</span>
                          <span className="font-semibold text-green-700">
                            {deal.analysis.maoByRepair[1]?.roi || 0}%
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {deal.rents && (
                    <div className="mb-3 text-sm">
                      <span className="text-gray-600">Estimated Rent:</span>
                      <span className="ml-2 font-semibold text-gray-800">
                        {formatCurrency(deal.rents.marketRentEst || 0)}/mo
                      </span>
                    </div>
                  )}

                  <button 
                    onClick={() => navigate(`/deals/${deal.id}`)}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-medium transition-colors"
                  >
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DealMarketplacePage;
