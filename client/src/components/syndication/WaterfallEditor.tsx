import React, { useState, useEffect } from 'react';

interface WaterfallTier {
  id: number;
  tier_name: string;
  tier_order: number;
  tier_type: string;
  allocation_percentage: string;
  hurdle_rate: string;
  preferred_return: string;
  carry_percentage: string;
}

interface Props {
  syndicateId: string;
}

const WaterfallEditor: React.FC<Props> = ({ syndicateId }) => {
  const [tiers, setTiers] = useState<WaterfallTier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  useEffect(() => {
    if (syndicateId) fetchTiers();
  }, [syndicateId]);

  const fetchTiers = async () => {
    try {
      const response = await fetch(`/api/syndication/syndicates/${syndicateId}/waterfall`);
      if (!response.ok) throw new Error('Failed to fetch waterfall tiers');
      const data = await response.json();
      setTiers(data.tiers || []);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const addTier = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    try {
      const response = await fetch(`/api/syndication/syndicates/${syndicateId}/waterfall`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tier_name: formData.get('name'),
          tier_order: tiers.length,
          tier_type: formData.get('type'),
          allocation_percentage: Number(formData.get('allocation')),
          hurdle_rate: Number(formData.get('hurdle')) || null,
          preferred_return: Number(formData.get('preferred')) || null,
          carry_percentage: Number(formData.get('carry')) || null
        })
      });

      if (!response.ok) throw new Error('Failed to add tier');
      
      setShowAddForm(false);
      fetchTiers();
      e.currentTarget.reset();
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  const deleteTier = async (tierId: number) => {
    if (!confirm('Delete this tier?')) return;
    
    try {
      const response = await fetch(`/api/syndication/waterfall/${tierId}`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error('Failed to delete tier');
      fetchTiers();
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading waterfall structure...</div>;
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <p className="text-red-800">Error: {error}</p>
        <button 
          onClick={fetchTiers}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-bold">💧 Waterfall Distribution</h3>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
        >
          {showAddForm ? 'Cancel' : '+ Add Tier'}
        </button>
      </div>

      {showAddForm && (
        <form onSubmit={addTier} className="bg-white border border-gray-300 rounded-lg p-6 space-y-4">
          <h4 className="font-semibold">Create New Tier</h4>
          <div className="grid grid-cols-2 gap-4">
            <input name="name" placeholder="Tier Name" required className="px-4 py-2 border rounded-lg" />
            <select name="type" required className="px-4 py-2 border rounded-lg">
              <option value="pro_rata">Pro Rata</option>
              <option value="preferred_return">Preferred Return</option>
              <option value="catch_up">Catch Up</option>
              <option value="carried_interest">Carried Interest</option>
            </select>
            <input name="allocation" type="number" step="0.01" placeholder="Allocation %" className="px-4 py-2 border rounded-lg" />
            <input name="hurdle" type="number" step="0.01" placeholder="Hurdle Rate %" className="px-4 py-2 border rounded-lg" />
            <input name="preferred" type="number" step="0.01" placeholder="Preferred Return %" className="px-4 py-2 border rounded-lg" />
            <input name="carry" type="number" step="0.01" placeholder="Carry %" className="px-4 py-2 border rounded-lg" />
          </div>
          <button type="submit" className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            Add Tier
          </button>
        </form>
      )}

      <div className="space-y-3">
        {tiers.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg text-gray-500">
            No waterfall tiers configured. Add tiers to define distribution logic.
          </div>
        ) : (
          tiers.map((tier, index) => (
            <div key={tier.id} className="bg-white border-2 border-blue-200 rounded-lg p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <span className="text-2xl font-bold text-blue-600">#{index + 1}</span>
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900">{tier.tier_name}</h4>
                    <span className="text-sm text-gray-600 capitalize">{tier.tier_type.replace(/_/g, ' ')}</span>
                  </div>
                </div>
                <button
                  onClick={() => deleteTier(tier.id)}
                  className="px-3 py-1 text-sm bg-red-50 text-red-600 rounded-lg hover:bg-red-100"
                >
                  Delete
                </button>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {tier.allocation_percentage && (
                  <div>
                    <p className="text-xs text-gray-500">Allocation</p>
                    <p className="text-lg font-semibold text-gray-900">{tier.allocation_percentage}%</p>
                  </div>
                )}
                {tier.hurdle_rate && (
                  <div>
                    <p className="text-xs text-gray-500">Hurdle Rate</p>
                    <p className="text-lg font-semibold text-gray-900">{tier.hurdle_rate}%</p>
                  </div>
                )}
                {tier.preferred_return && (
                  <div>
                    <p className="text-xs text-gray-500">Preferred Return</p>
                    <p className="text-lg font-semibold text-gray-900">{tier.preferred_return}%</p>
                  </div>
                )}
                {tier.carry_percentage && (
                  <div>
                    <p className="text-xs text-gray-500">Carry</p>
                    <p className="text-lg font-semibold text-gray-900">{tier.carry_percentage}%</p>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h4 className="font-semibold text-blue-900 mb-2">About Waterfall Distributions</h4>
        <p className="text-blue-800 text-sm">
          Waterfall structures define how profits are distributed among investors. Tiers are processed in order, 
          with earlier tiers taking priority. Common structures include preferred returns, catch-up provisions, 
          and carried interest for lead investors.
        </p>
      </div>
    </div>
  );
};

export default WaterfallEditor;
