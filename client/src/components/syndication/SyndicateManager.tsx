import React, { useState, useEffect } from 'react';

interface Syndicate {
  id: number;
  syndicate_id: string;
  syndicate_name: string;
  syndicate_type: string;
  target_raise: string;
  current_raise: string;
  minimum_commitment: string;
  status: string;
  created_at: string;
}

const SyndicateManager: React.FC = () => {
  const [syndicates, setSyndicates] = useState<Syndicate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);

  useEffect(() => {
    fetchSyndicates();
  }, []);

  const fetchSyndicates = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/syndication/syndicates?limit=100');
      if (!response.ok) throw new Error('Failed to fetch syndicates');
      const data = await response.json();
      setSyndicates(data.syndicates || []);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const createSyndicate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    try {
      const response = await fetch('/api/syndication/syndicates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lead_investor_id: 1,
          syndicate_name: formData.get('name'),
          syndicate_type: formData.get('type'),
          target_raise: Number(formData.get('target')),
          minimum_commitment: Number(formData.get('minimum')),
          description: formData.get('description')
        })
      });

      if (!response.ok) throw new Error('Failed to create syndicate');
      
      setShowCreateForm(false);
      fetchSyndicates();
      e.currentTarget.reset();
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  const formatCurrency = (value: string | number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(Number(value));
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      fundraising: 'bg-blue-100 text-blue-800',
      active: 'bg-green-100 text-green-800',
      closed: 'bg-gray-100 text-gray-800',
      dissolved: 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">🤝 Syndicate Manager</h2>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          {showCreateForm ? 'Cancel' : '+ Create Syndicate'}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">Error: {error}</p>
        </div>
      )}

      {showCreateForm && (
        <form onSubmit={createSyndicate} className="bg-white rounded-lg shadow-lg p-6 space-y-4">
          <h3 className="text-lg font-semibold">Create New Syndicate</h3>
          <div className="grid grid-cols-2 gap-4">
            <input name="name" placeholder="Syndicate Name" required className="px-4 py-2 border rounded-lg" />
            <select name="type" required className="px-4 py-2 border rounded-lg">
              <option value="deal_specific">Deal Specific</option>
              <option value="blind_pool">Blind Pool</option>
              <option value="permanent">Permanent</option>
            </select>
            <input name="target" type="number" placeholder="Target Raise ($)" required className="px-4 py-2 border rounded-lg" />
            <input name="minimum" type="number" placeholder="Min Commitment ($)" required className="px-4 py-2 border rounded-lg" />
          </div>
          <textarea name="description" placeholder="Description" rows={3} className="w-full px-4 py-2 border rounded-lg" />
          <button type="submit" className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            Create Syndicate
          </button>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {syndicates.length === 0 ? (
          <div className="col-span-full text-center py-12 text-gray-500">
            No syndicates found. Create your first syndicate to get started!
          </div>
        ) : (
          syndicates.map(syndicate => (
            <div key={syndicate.id} className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">{syndicate.syndicate_name}</h3>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(syndicate.status)}`}>
                  {syndicate.status}
                </span>
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Type:</span>
                  <span className="font-medium capitalize">{syndicate.syndicate_type.replace(/_/g, ' ')}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Target Raise:</span>
                  <span className="font-medium text-blue-600">{formatCurrency(syndicate.target_raise)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Min Commitment:</span>
                  <span className="font-medium">{formatCurrency(syndicate.minimum_commitment || 0)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Created:</span>
                  <span>{new Date(syndicate.created_at).toLocaleDateString()}</span>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-200 flex gap-2">
                <button className="flex-1 px-3 py-2 text-sm bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100">
                  View Details
                </button>
                <button className="flex-1 px-3 py-2 text-sm bg-gray-50 text-gray-600 rounded-lg hover:bg-gray-100">
                  Manage
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default SyndicateManager;
