import React, { useState, useEffect } from 'react';

interface Contract {
  id: number;
  deployment_id: string;
  contract_name: string;
  contract_type: string;
  chain_id: string;
  contract_address: string;
  verification_status: string;
  deployed_at: string;
}

const DeploymentManager: React.FC = () => {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [chains, setChains] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [contractsRes, chainsRes] = await Promise.all([
        fetch('/api/multichain/contracts?limit=100'),
        fetch('/api/multichain/chains')
      ]);
      
      if (!contractsRes.ok || !chainsRes.ok) throw new Error('Failed to fetch data');
      
      const contractsData = await contractsRes.json();
      const chainsData = await chainsRes.json();
      
      setContracts(contractsData.contracts || []);
      setChains(chainsData.chains || []);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      verified: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
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
      <h2 className="text-2xl font-bold">🚀 Deployment Manager</h2>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {chains.map(chain => (
          <div key={chain.id} className="bg-white rounded-lg shadow p-4">
            <h3 className="text-sm text-gray-600">{chain.chain_name}</h3>
            <p className="text-2xl font-bold mt-2">{contracts.filter(c => c.chain_id === chain.chain_id).length}</p>
            <p className="text-xs text-gray-500 mt-1">contracts</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-lg shadow-lg">
        <div className="p-6 border-b">
          <h3 className="text-lg font-semibold">Deployed Contracts ({contracts.length})</h3>
        </div>
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contract</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Chain</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Address</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {contracts.length === 0 ? (
              <tr><td colSpan={5} className="px-6 py-12 text-center text-gray-500">No deployed contracts</td></tr>
            ) : (
              contracts.map(contract => (
                <tr key={contract.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium">{contract.contract_name}</td>
                  <td className="px-6 py-4 text-sm">{contract.contract_type}</td>
                  <td className="px-6 py-4 text-sm">{contract.chain_id}</td>
                  <td className="px-6 py-4 text-sm font-mono text-xs">{contract.contract_address.slice(0, 10)}...</td>
                  <td className="px-6 py-4"><span className={`px-3 py-1 rounded-full text-xs ${getStatusColor(contract.verification_status)}`}>{contract.verification_status}</span></td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DeploymentManager;
