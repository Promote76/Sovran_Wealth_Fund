import React, { useState, useEffect } from 'react';

interface GasPrice {
  id: number;
  chain_id: string;
  gas_price_gwei: string;
  recorded_at: string;
}

const GasOptimizer: React.FC = () => {
  const [gasPrices, setGasPrices] = useState<Record<string, GasPrice[]>>({});
  const [chains, setChains] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const chainsRes = await fetch('/api/multichain/chains');
      if (!chainsRes.ok) throw new Error('Failed to fetch chains');
      const chainsData = await chainsRes.json();
      setChains(chainsData.chains || []);

      const prices: Record<string, GasPrice[]> = {};
      for (const chain of chainsData.chains || []) {
        const gasRes = await fetch(`/api/multichain/gas-prices/${chain.chain_id}?hours=24&limit=100`);
        if (gasRes.ok) {
          const gasData = await gasRes.json();
          prices[chain.chain_id] = gasData.gas_prices || [];
        }
      }
      setGasPrices(prices);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getAverageGasPrice = (chainId: string) => {
    const prices = gasPrices[chainId] || [];
    if (prices.length === 0) return 0;
    const sum = prices.reduce((acc, p) => acc + parseFloat(p.gas_price_gwei), 0);
    return (sum / prices.length).toFixed(2);
  };

  if (loading) return <div className="flex items-center justify-center py-12"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>;

  if (error) return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-6">
      <p className="text-red-800">Error: {error}</p>
      <button onClick={fetchData} className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">Retry</button>
    </div>
  );

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">⛽ Gas Optimizer</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {chains.map(chain => {
          const avgGas = getAverageGasPrice(chain.chain_id);
          return (
            <div key={chain.id} className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-sm font-medium text-gray-600 mb-2">{chain.chain_name}</h3>
              <p className="text-3xl font-bold text-blue-600">{avgGas}</p>
              <p className="text-xs text-gray-500 mt-1">Avg Gwei (24h)</p>
              <div className="mt-4 pt-4 border-t">
                <p className="text-xs text-gray-600">Network: {chain.network_type}</p>
                <p className="text-xs text-gray-600">ID: {chain.chain_id}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h4 className="font-semibold text-blue-900 mb-2">💡 Gas Optimization Tips</h4>
        <ul className="text-blue-800 text-sm space-y-1">
          <li>• Deploy during off-peak hours for lower gas prices</li>
          <li>• Monitor 24h trends to identify optimal deployment windows</li>
          <li>• Use gas-efficient contract patterns (batch operations, minimal storage)</li>
          <li>• Consider L2 solutions for high-frequency operations</li>
        </ul>
      </div>
    </div>
  );
};

export default GasOptimizer;
