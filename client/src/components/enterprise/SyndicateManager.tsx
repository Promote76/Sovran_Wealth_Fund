import React, { useState, useEffect } from 'react';

interface Syndicate {
  syndicate_id: string;
  lead_investor_id: number;
  lead_wallet_address: string;
  syndicate_name: string;
  syndicate_type: string;
  target_raise: number;
  minimum_commitment: number;
  maximum_commitment: number;
  waterfall_structure: string;
  description: string;
  visibility: string;
  status: string;
  created_at: string;
  total_committed?: number;
  total_members?: number;
}

export const SyndicateManager: React.FC = () => {
  const [syndicates, setSyndicates] = useState<Syndicate[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);

  const [formData, setFormData] = useState({
    lead_investor_id: '9',
    lead_wallet_address: '0x0000000000000000000000000000000000000000',
    syndicate_name: '',
    syndicate_type: 'deal_specific',
    target_raise: '',
    minimum_commitment: '',
    maximum_commitment: '',
    waterfall_structure: 'tiered',
    description: '',
    visibility: 'private'
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
          lead_investor_id: '9',
          lead_wallet_address: '0x0000000000000000000000000000000000000000',
          syndicate_name: '',
          syndicate_type: 'deal_specific',
          target_raise: '',
          minimum_commitment: '',
          maximum_commitment: '',
          waterfall_structure: 'tiered',
          description: '',
          visibility: 'private'
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
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Create New Syndicate</h3>
          <p className="text-sm text-gray-600 mb-6">
            Fill out the form below to create a new co-investment syndicate. All fields marked with * are required.
            <a href="#" onClick={(e) => { e.preventDefault(); }} className="text-blue-600 hover:text-blue-700 ml-1">
              Need help? See the Info & Guide tab →
            </a>
          </p>
          <form onSubmit={handleCreateSyndicate} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Syndicate Name *
                  <span className="text-gray-500 font-normal ml-1" title="A descriptive name for your syndicate">ⓘ</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.syndicate_name}
                  onChange={(e) => setFormData({ ...formData, syndicate_name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., Prime Downtown Portfolio, Sun Belt Multifamily Fund"
                />
                <p className="mt-1 text-xs text-gray-500">Choose a clear, professional name that describes the investment focus</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Syndicate Type *
                  <span className="text-gray-500 font-normal ml-1" title="Type of investment structure">ⓘ</span>
                </label>
                <select
                  value={formData.syndicate_type}
                  onChange={(e) => setFormData({ ...formData, syndicate_type: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="deal_specific">Deal Specific (Single Property)</option>
                  <option value="blind_pool">Blind Pool (Multiple Opportunities)</option>
                  <option value="permanent">Permanent Fund (Evergreen)</option>
                </select>
                <p className="mt-1 text-xs text-gray-500">
                  {formData.syndicate_type === 'deal_specific' && 'Raise capital for a specific property with a defined exit'}
                  {formData.syndicate_type === 'blind_pool' && 'Deploy across multiple deals based on investment criteria'}
                  {formData.syndicate_type === 'permanent' && 'Continuous fund with ongoing capital deployment'}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Target Raise ($) *
                  <span className="text-gray-500 font-normal ml-1" title="Total capital you aim to raise">ⓘ</span>
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
                <p className="mt-1 text-xs text-gray-500">Total amount of equity capital to raise from all investors</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Minimum Commitment ($)
                  <span className="text-gray-500 font-normal ml-1" title="Smallest investment per investor">ⓘ</span>
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
                <p className="mt-1 text-xs text-gray-500">Default: $5,000. Common range: $10,000-$50,000</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Maximum Commitment ($)
                  <span className="text-gray-500 font-normal ml-1" title="Largest investment per investor (optional)">ⓘ</span>
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
                <p className="mt-1 text-xs text-gray-500">Optional. Helps ensure diversified ownership (typically 10-25% of raise)</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Waterfall Structure *
                  <span className="text-gray-500 font-normal ml-1" title="How profits are distributed">ⓘ</span>
                </label>
                <select
                  value={formData.waterfall_structure}
                  onChange={(e) => setFormData({ ...formData, waterfall_structure: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="tiered">Tiered Distribution (Multi-level splits)</option>
                  <option value="preferred_return">Preferred Return (8% pref + carry)</option>
                  <option value="carried_interest">Carried Interest (Performance fee)</option>
                  <option value="catch_up">Catch-Up Provision (Accelerated sponsor comp)</option>
                </select>
                <p className="mt-1 text-xs text-gray-500">
                  {formData.waterfall_structure === 'preferred_return' && 'Most common: Investors get 8% return first, then 80/20 split'}
                  {formData.waterfall_structure === 'tiered' && 'Different splits at different return thresholds'}
                  {formData.waterfall_structure === 'carried_interest' && 'Sponsor earns % of profits above preferred return'}
                  {formData.waterfall_structure === 'catch_up' && '100% to sponsor until reaching target carry %'}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Visibility *
                  <span className="text-gray-500 font-normal ml-1" title="Who can see and join this syndicate">ⓘ</span>
                </label>
                <select
                  value={formData.visibility}
                  onChange={(e) => setFormData({ ...formData, visibility: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="private">Private (Invite Only - Recommended)</option>
                  <option value="public">Public (Anyone Can View & Request)</option>
                </select>
                <p className="mt-1 text-xs text-gray-500">
                  {formData.visibility === 'private' ? 'Only invited investors can see and join. Ensures compliance.' : 'Visible to all users. Requires robust compliance screening.'}
                </p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
                <span className="text-gray-500 font-normal ml-1" title="Detailed information about the investment">ⓘ</span>
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Describe the investment strategy, target properties, expected returns, timeline, and key terms. Include property type, location, value-add strategy, and exit plan."
              />
              <p className="mt-1 text-xs text-gray-500">
                Include: investment thesis, property details, target returns (IRR/equity multiple), hold period, and exit strategy
              </p>
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
                        <p className="text-xs text-gray-500">Visibility</p>
                        <p className="text-sm font-medium text-gray-900">
                          {syndicate.visibility ? syndicate.visibility.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'Private'}
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
