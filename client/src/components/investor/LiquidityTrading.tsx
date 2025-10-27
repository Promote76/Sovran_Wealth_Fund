/**
 * Feature #1: Liquidity & Redemption Desk - Trading Interface
 * Secondary market trading UI for buying and selling property shares
 */

import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface Property {
  id: number;
  address: string;
  totalShares: number;
  yourShares: number;
  lockupEnds: string;
}

interface Order {
  orderId: string;
  orderType: string;
  propertyAddress: string;
  sharesAmount: number;
  sharesFilled: number;
  sharesRemaining: number;
  pricePerShare: number;
  totalValue: number;
  status: string;
  createdAt: string;
  expiresAt: string;
}

const LiquidityTrading: React.FC<{ walletAddress?: string }> = ({ walletAddress }) => {
  const [properties, setProperties] = useState<Property[]>([]);
  const [selectedProperty, setSelectedProperty] = useState<number | null>(null);
  const [orderType, setOrderType] = useState<'buy' | 'sell'>('sell');
  const [shares, setShares] = useState<string>('');
  const [pricePerShare, setPricePerShare] = useState<string>('');
  const [myOrders, setMyOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (walletAddress) {
      loadUserProperties();
      loadMyOrders();
    }
  }, [walletAddress]);

  const loadUserProperties = async () => {
    try {
      const response = await axios.get(`/api/fractional/investor/${walletAddress}/portfolio`);
      setProperties(response.data.properties || []);
    } catch (err) {
      console.error('Failed to load properties:', err);
    }
  };

  const loadMyOrders = async () => {
    if (!walletAddress) return;
    
    try {
      const response = await axios.get(`/api/liquidity/orders/${walletAddress}`);
      setMyOrders(response.data.orders || []);
    } catch (err) {
      console.error('Failed to load orders:', err);
    }
  };

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedProperty || !shares || !pricePerShare || !walletAddress) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const endpoint = orderType === 'sell' 
        ? '/api/liquidity/orders/sell' 
        : '/api/liquidity/orders/buy';
      
      const payload = orderType === 'sell'
        ? {
            walletAddress,
            propertyId: selectedProperty,
            shares: parseFloat(shares),
            pricePerShare: parseFloat(pricePerShare),
            expiresIn: 30
          }
        : {
            walletAddress,
            propertyId: selectedProperty,
            shares: parseFloat(shares),
            maxPricePerShare: parseFloat(pricePerShare)
          };

      const response = await axios.post(endpoint, payload);

      if (response.data.success) {
        setSuccess(response.data.message || `${orderType.toUpperCase()} order created successfully!`);
        setShares('');
        setPricePerShare('');
        loadMyOrders();
        if (orderType === 'sell') {
          loadUserProperties();
        }
      } else {
        setError(response.data.error || 'Order creation failed');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create order');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelOrder = async (orderId: string) => {
    if (!confirm('Cancel this order?')) return;

    try {
      const response = await axios.post(`/api/liquidity/orders/${orderId}/cancel`, {
        walletAddress
      });

      if (response.data.success) {
        setSuccess('Order cancelled successfully');
        loadMyOrders();
        loadUserProperties();
      } else {
        setError(response.data.error || 'Failed to cancel order');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to cancel order');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'filled': return 'bg-green-100 text-green-800';
      case 'partial': return 'bg-blue-100 text-blue-800';
      case 'open': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-gray-100 text-gray-800';
      case 'expired': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const selectedPropertyData = properties.find(p => p.id === selectedProperty);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Secondary Market Trading
        </h2>
        <p className="text-gray-600">
          Buy and sell property shares before the 6-month lockup period expires
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">
            Create Order
          </h3>

          <div className="mb-4 flex gap-2">
            <button
              onClick={() => setOrderType('sell')}
              className={`flex-1 px-4 py-2 rounded-lg font-semibold transition-colors ${
                orderType === 'sell'
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Sell Shares
            </button>
            <button
              onClick={() => setOrderType('buy')}
              className={`flex-1 px-4 py-2 rounded-lg font-semibold transition-colors ${
                orderType === 'buy'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Buy Shares
            </button>
          </div>

          <form onSubmit={handleSubmitOrder} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Property
              </label>
              <select
                value={selectedProperty || ''}
                onChange={(e) => setSelectedProperty(Number(e.target.value))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="">Select property...</option>
                {properties.map((property) => (
                  <option key={property.id} value={property.id}>
                    {property.address} ({property.yourShares.toLocaleString()} shares)
                  </option>
                ))}
              </select>
            </div>

            {selectedPropertyData && orderType === 'sell' && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm">
                <div className="font-medium text-blue-900">Your Holdings:</div>
                <div className="text-blue-800">
                  {selectedPropertyData.yourShares.toLocaleString()} shares available
                </div>
                <div className="text-blue-600 text-xs mt-1">
                  Lockup ends: {formatDate(selectedPropertyData.lockupEnds)}
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Number of Shares
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={shares}
                onChange={(e) => setShares(e.target.value)}
                placeholder="100"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {orderType === 'sell' ? 'Price Per Share ($)' : 'Max Price Per Share ($)'}
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={pricePerShare}
                onChange={(e) => setPricePerShare(e.target.value)}
                placeholder="50.00"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            {shares && pricePerShare && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                <div className="text-sm text-gray-600 mb-1">Total Value</div>
                <div className="text-2xl font-bold text-gray-900">
                  {formatCurrency(parseFloat(shares) * parseFloat(pricePerShare))}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  + 2% platform fee ({formatCurrency((parseFloat(shares) * parseFloat(pricePerShare)) * 0.02)})
                </div>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            {success && (
              <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg text-sm">
                {success}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className={`w-full px-6 py-3 rounded-lg font-semibold text-white transition-colors ${
                orderType === 'sell'
                  ? 'bg-red-600 hover:bg-red-700 disabled:bg-gray-400'
                  : 'bg-green-600 hover:bg-green-700 disabled:bg-gray-400'
              } disabled:cursor-not-allowed`}
            >
              {loading ? 'Creating Order...' : `Create ${orderType.toUpperCase()} Order`}
            </button>
          </form>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">
            My Orders
          </h3>

          {myOrders.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 text-5xl mb-4">📊</div>
              <p className="text-gray-500">No orders yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {myOrders.slice(0, 10).map((order) => (
                <div
                  key={order.orderId}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div className="font-medium text-gray-900">
                        {order.orderType.toUpperCase()} {order.sharesAmount.toLocaleString()} shares
                      </div>
                      <div className="text-sm text-gray-600">{order.propertyAddress}</div>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusBadgeColor(order.status)}`}>
                      {order.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                    <div>
                      <div className="text-gray-500">Price/Share</div>
                      <div className="font-medium">{formatCurrency(order.pricePerShare)}</div>
                    </div>
                    <div>
                      <div className="text-gray-500">Total Value</div>
                      <div className="font-medium">{formatCurrency(order.totalValue)}</div>
                    </div>
                    <div>
                      <div className="text-gray-500">Filled</div>
                      <div className="font-medium">
                        {order.sharesFilled} / {order.sharesAmount}
                      </div>
                    </div>
                    <div>
                      <div className="text-gray-500">Created</div>
                      <div className="font-medium">{formatDate(order.createdAt)}</div>
                    </div>
                  </div>

                  {(order.status === 'open' || order.status === 'partial') && (
                    <button
                      onClick={() => handleCancelOrder(order.orderId)}
                      className="w-full bg-gray-100 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
                    >
                      Cancel Order
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-semibold text-blue-900 mb-2">How It Works</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• <strong>Sell shares:</strong> List your shares for sale at your desired price. 2% platform fee applies.</li>
          <li>• <strong>Buy shares:</strong> Place a buy order at your maximum price. Orders match automatically.</li>
          <li>• <strong>Instant matching:</strong> Orders are matched using price-time priority algorithm.</li>
          <li>• <strong>Treasury liquidity:</strong> If no investors match, the treasury may provide liquidity.</li>
          <li>• <strong>6-month lockup:</strong> Shares must pass the lockup period before selling.</li>
        </ul>
      </div>
    </div>
  );
};

export default LiquidityTrading;
