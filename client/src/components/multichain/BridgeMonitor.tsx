import React, { useState, useEffect } from 'react';

interface Transaction {
  id: number;
  transaction_id: string;
  sender_address: string;
  recipient_address: string;
  amount: string;
  status: string;
  created_at: string;
  completed_at: string;
}

const BridgeMonitor: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/multichain/bridge-transactions?limit=50');
      if (!response.ok) throw new Error('Failed to fetch transactions');
      const data = await response.json();
      setTransactions(data.transactions || []);
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
      completed: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  if (loading) return <div className="flex items-center justify-center py-12"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>;

  if (error) return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-6">
      <p className="text-red-800">Error: {error}</p>
      <button onClick={fetchTransactions} className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">Retry</button>
    </div>
  );

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">🌉 Bridge Monitor</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {['pending', 'completed', 'failed'].map(status => {
          const count = transactions.filter(t => t.status === status).length;
          return (
            <div key={status} className={`rounded-lg shadow p-4 ${getStatusColor(status)}`}>
              <h3 className="text-sm font-medium uppercase">{status}</h3>
              <p className="text-3xl font-bold mt-2">{count}</p>
            </div>
          );
        })}
      </div>

      <div className="bg-white rounded-lg shadow-lg">
        <div className="p-6 border-b">
          <h3 className="text-lg font-semibold">Bridge Transactions ({transactions.length})</h3>
        </div>
        <div className="divide-y">
          {transactions.length === 0 ? (
            <div className="p-12 text-center text-gray-500">No bridge transactions found</div>
          ) : (
            transactions.map(tx => (
              <div key={tx.id} className="p-6 hover:bg-gray-50">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className={`px-3 py-1 rounded-full text-xs ${getStatusColor(tx.status)}`}>{tx.status}</span>
                      <span className="text-sm text-gray-500">{new Date(tx.created_at).toLocaleString()}</span>
                    </div>
                    <p className="text-sm text-gray-700 mb-1">
                      <span className="font-medium">From:</span> {tx.sender_address.slice(0, 10)}...{tx.sender_address.slice(-8)}
                    </p>
                    <p className="text-sm text-gray-700 mb-1">
                      <span className="font-medium">To:</span> {tx.recipient_address.slice(0, 10)}...{tx.recipient_address.slice(-8)}
                    </p>
                    <p className="text-lg font-semibold text-blue-600 mt-2">{Number(tx.amount).toLocaleString()} tokens</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default BridgeMonitor;
