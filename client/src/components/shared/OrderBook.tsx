/**
 * Feature #1: Liquidity & Redemption Desk - Order Book Component
 * Real-time display of buy and sell orders for a property
 */

import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface Order {
  orderId: string;
  walletAddress: string;
  sharesAmount: number;
  sharesFilled: number;
  sharesRemaining: number;
  pricePerShare: number;
  totalValue: number;
  status: string;
  createdAt: string;
  expiresAt: string;
}

interface Spread {
  bestBid: number;
  bestAsk: number;
  spread: number;
  spreadPercent: string;
}

interface OrderBookProps {
  propertyId: number;
  refreshInterval?: number;
}

const OrderBook: React.FC<OrderBookProps> = ({ propertyId, refreshInterval = 10000 }) => {
  const [sellOrders, setSellOrders] = useState<Order[]>([]);
  const [buyOrders, setBuyOrders] = useState<Order[]>([]);
  const [spread, setSpread] = useState<Spread | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  useEffect(() => {
    loadOrderBook();
    const interval = setInterval(loadOrderBook, refreshInterval);
    return () => clearInterval(interval);
  }, [propertyId, refreshInterval]);

  const loadOrderBook = async () => {
    try {
      const response = await axios.get(`/api/liquidity/orderbook/${propertyId}`);
      
      setSellOrders(response.data.sellOrders || []);
      setBuyOrders(response.data.buyOrders || []);
      setSpread(response.data.spread || null);
      setLastUpdate(new Date());
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load order book');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatWallet = (wallet: string) => {
    return `${wallet.slice(0, 6)}...${wallet.slice(-4)}`;
  };

  const getDepthPercentage = (shares: number, maxShares: number) => {
    return Math.min((shares / maxShares) * 100, 100);
  };

  const maxSellShares = sellOrders.length > 0 
    ? Math.max(...sellOrders.map(o => o.sharesRemaining)) 
    : 1;
  const maxBuyShares = buyOrders.length > 0 
    ? Math.max(...buyOrders.map(o => o.sharesRemaining)) 
    : 1;

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-semibold text-gray-900">
          Order Book
        </h3>
        <div className="text-xs text-gray-500">
          Updated: {lastUpdate.toLocaleTimeString()}
        </div>
      </div>

      {spread && (
        <div className="mb-6 grid grid-cols-3 gap-4">
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <div className="text-xs text-green-600 mb-1">Best Bid</div>
            <div className="text-lg font-bold text-green-900">
              {formatCurrency(spread.bestBid)}
            </div>
          </div>
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
            <div className="text-xs text-gray-600 mb-1">Spread</div>
            <div className="text-lg font-bold text-gray-900">
              {formatCurrency(spread.spread)}
            </div>
            <div className="text-xs text-gray-500">
              {spread.spreadPercent}%
            </div>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <div className="text-xs text-red-600 mb-1">Best Ask</div>
            <div className="text-lg font-bold text-red-900">
              {formatCurrency(spread.bestAsk)}
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold text-red-600">SELL ORDERS ({sellOrders.length})</h4>
            <div className="text-xs text-gray-500">Price (Low → High)</div>
          </div>

          {sellOrders.length === 0 ? (
            <div className="text-center py-8 bg-gray-50 rounded-lg">
              <p className="text-gray-500 text-sm">No sell orders</p>
            </div>
          ) : (
            <div className="space-y-2">
              {sellOrders.slice(0, 10).map((order) => {
                const depthPercentage = getDepthPercentage(order.sharesRemaining, maxSellShares);
                
                return (
                  <div
                    key={order.orderId}
                    className="relative border border-red-100 rounded-lg p-3 hover:shadow-md transition-shadow overflow-hidden"
                  >
                    <div
                      className="absolute top-0 right-0 bottom-0 bg-red-50 opacity-50"
                      style={{ width: `${depthPercentage}%` }}
                    />
                    
                    <div className="relative z-10">
                      <div className="grid grid-cols-3 gap-2 text-sm">
                        <div>
                          <div className="text-xs text-gray-500">Price</div>
                          <div className="font-bold text-red-600">
                            {formatCurrency(parseFloat(order.pricePerShare.toString()))}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500">Shares</div>
                          <div className="font-medium text-gray-900">
                            {order.sharesRemaining.toLocaleString()}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500">Total</div>
                          <div className="font-medium text-gray-900">
                            {formatCurrency(parseFloat(order.pricePerShare.toString()) * order.sharesRemaining)}
                          </div>
                        </div>
                      </div>
                      <div className="mt-2 text-xs text-gray-500 font-mono">
                        {formatWallet(order.walletAddress)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold text-green-600">BUY ORDERS ({buyOrders.length})</h4>
            <div className="text-xs text-gray-500">Price (High → Low)</div>
          </div>

          {buyOrders.length === 0 ? (
            <div className="text-center py-8 bg-gray-50 rounded-lg">
              <p className="text-gray-500 text-sm">No buy orders</p>
            </div>
          ) : (
            <div className="space-y-2">
              {buyOrders.slice(0, 10).map((order) => {
                const depthPercentage = getDepthPercentage(order.sharesRemaining, maxBuyShares);
                
                return (
                  <div
                    key={order.orderId}
                    className="relative border border-green-100 rounded-lg p-3 hover:shadow-md transition-shadow overflow-hidden"
                  >
                    <div
                      className="absolute top-0 right-0 bottom-0 bg-green-50 opacity-50"
                      style={{ width: `${depthPercentage}%` }}
                    />
                    
                    <div className="relative z-10">
                      <div className="grid grid-cols-3 gap-2 text-sm">
                        <div>
                          <div className="text-xs text-gray-500">Price</div>
                          <div className="font-bold text-green-600">
                            {formatCurrency(parseFloat(order.pricePerShare.toString()))}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500">Shares</div>
                          <div className="font-medium text-gray-900">
                            {order.sharesRemaining.toLocaleString()}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500">Total</div>
                          <div className="font-medium text-gray-900">
                            {formatCurrency(parseFloat(order.pricePerShare.toString()) * order.sharesRemaining)}
                          </div>
                        </div>
                      </div>
                      <div className="mt-2 text-xs text-gray-500 font-mono">
                        {formatWallet(order.walletAddress)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-3">
        <div className="text-xs text-blue-800">
          <strong>Order Book Legend:</strong> Orders are sorted by price-time priority. 
          Best prices at the top. Depth bars show relative order size. 
          Auto-refreshes every {refreshInterval / 1000} seconds.
        </div>
      </div>

      <button
        onClick={loadOrderBook}
        className="mt-4 w-full bg-gray-100 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-200 transition-colors"
      >
        🔄 Refresh Now
      </button>
    </div>
  );
};

export default OrderBook;
