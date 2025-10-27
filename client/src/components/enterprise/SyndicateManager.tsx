import React, { useState, useEffect } from 'react';

interface Syndicate {
  syndicate_id: string;
  lead_investor_id: string;
  syndicate_name: string;
  syndicate_type: string;
  target_raise: number;
  minimum_commitment: number;
  maximum_commitment: number;
  waterfall_structure: string;
  description: string;
  access_type: string;
  status: string;
  created_at: string;
  total_committed?: number;
  member_count?: number;
}

export const SyndicateManager: React.FC = () => {
  const [syndicates, setSyndicates] = useState<Syndicate[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);

  const [formData, setFormData] = useState({
    lead_investor_id: 'INV-' + Math.random().toString(36).substr(2, 9),
    syndicate_name: '',
    syndicate_type: 'deal_specific',
    target_raise: '',
    minimum_commitment: '',
    maximum_commitment: '',
    waterfall_structure: 'tiered',
    description: '',
    access_type: 'invite_only'
  });

  useEffect(() => {
    fetchSyndicates();
  }, []);

  const fetchSyndicates = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/syndication/syndicates');
      const data = await response.json();
      
      if (data.success) {
        setSyndicates(data.syndicates || []);
      } else {
        setError(data.error || 'Failed to load syndicates');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to connect to server');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSyndicate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/syndication/syndicates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          target_raise: parseFloat(formData.target_raise),
          minimum_commitment: parseFloat(formData.minimum_commitment) || 0,
          maximum_commitment: parseFloat(formData.maximum_commitment) || null
        })
      });

      const data = await response.json();

      if (data.success) {
        setShowCreateForm(false);
        setFormData({
          lead_investor_id: 'INV-' + Math.random().toString(36).substr(2, 9),
          syndicate_name: '',
          syndicate_type: 'deal_specific',
          target_raise: '',
          minimum_commitment: '',
          maximum_commitment: '',
          waterfall_structure: 'tiered',
          description: '',
          access_type: 'invite_only'
        });
        fetchSyndicates();
      } else {
        setError(data.error || 'Failed to create syndicate');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to create syndicate');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusColors: Record<string, string> = {
      fundraising: 'bg-blue-100 text-blue-800',
      active: 'bg-green-100 text-green-800',
      closed: 'bg-gray-100 text-gray-800',
      dissolved: 'bg-red-100 text-red-800'
    };
    return statusColors[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Co-Investment Syndicates</h2>
          <p className="mt-1 text-sm text-gray-600">
            Create and manage investment syndicates with custom waterfall distributions
          </p>
        </div>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          {showCreateForm ? 'Cancel' : '+ Create Syndicate'}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {showCreateForm && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Create New Syndicate</h3>
          <form onSubmit={handleCreateSyndicate} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Syndicate Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.syndicate_name}
                  onChange={(e) => setFormData({ ...formData, syndicate_name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., Prime Downtown Portfolio"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Syndicate Type *
                </label>
                <select
                  value={formData.syndicate_type}
                  onChange={(e) => setFormData({ ...formData, syndicate_type: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="deal_specific">Deal Specific</option>
                  <option value="blind_pool">Blind Pool</option>
                  <option value="permanent">Permanent Fund</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Target Raise ($) *
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  value={formData.target_raise}
                  onChange={(e) => setFormData({ ...formData, target_raise: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="1000000"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Minimum Commitment ($)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.minimum_commitment}
                  onChange={(e) => setFormData({ ...formData, minimum_commitment: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="10000"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Maximum Commitment ($)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.maximum_commitment}
                  onChange={(e) => setFormData({ ...formData, maximum_commitment: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="250000"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Waterfall Structure *
                </label>
                <select
                  value={formData.waterfall_structure}
                  onChange={(e) => setFormData({ ...formData, waterfall_structure: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="tiered">Tiered Distribution</option>
                  <option value="preferred_return">Preferred Return</option>
                  <option value="carried_interest">Carried Interest</option>
                  <option value="catch_up">Catch-Up Provision</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Access Type *
                </label>
                <select
                  value={formData.access_type}
                  onChange={(e) => setFormData({ ...formData, access_type: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="invite_only">Invite Only</option>
                  <option value="open">Open Access</option>
                  <option value="whitelist">Whitelist</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Describe the investment strategy and terms..."
              />
            </div>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
              >
                {loading ? 'Creating...' : 'Create Syndicate'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h3 className="text-lg font-semibold text-gray-900">Active Syndicates</h3>
        </div>

        {loading && !syndicates.length ? (
          <div className="p-8 text-center text-gray-500">
            Loading syndicates...
          </div>
        ) : syndicates.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No syndicates created yet. Click "Create Syndicate" to get started.
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {syndicates.map((syndicate) => (
              <div key={syndicate.syndicate_id} className="p-6 hover:bg-gray-50 transition">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h4 className="text-lg font-semibold text-gray-900">
                        {syndicate.syndicate_name}
                      </h4>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(syndicate.status)}`}>
                        {syndicate.status.charAt(0).toUpperCase() + syndicate.status.slice(1)}
                      </span>
                    </div>
                    {syndicate.description && (
                      <p className="mt-2 text-sm text-gray-600">{syndicate.description}</p>
                    )}
                    <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <p className="text-xs text-gray-500">Type</p>
                        <p className="text-sm font-medium text-gray-900">
                          {syndicate.syndicate_type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Target Raise</p>
                        <p className="text-sm font-medium text-gray-900">
                          ${syndicate.target_raise.toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Min Commitment</p>
                        <p className="text-sm font-medium text-gray-900">
                          ${syndicate.minimum_commitment.toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Access</p>
                        <p className="text-sm font-medium text-gray-900">
                          {syndicate.access_type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </p>
                      </div>
                    </div>
                  </div>
                  <button className="ml-4 px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition">
                    Manage
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
