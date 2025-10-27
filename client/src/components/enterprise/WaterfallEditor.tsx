import React, { useState } from 'react';

interface WaterfallTier {
  tier_id?: string;
  tier_name: string;
  distribution_priority: number;
  return_threshold: number;
  allocation_percentage: number;
  beneficiary_type: string;
}

export const WaterfallEditor: React.FC = () => {
  const [tiers, setTiers] = useState<WaterfallTier[]>([
    {
      tier_name: 'Return of Capital',
      distribution_priority: 1,
      return_threshold: 100,
      allocation_percentage: 100,
      beneficiary_type: 'all_investors'
    }
  ]);

  const [newTier, setNewTier] = useState<Partial<WaterfallTier>>({
    tier_name: '',
    distribution_priority: tiers.length + 1,
    return_threshold: 0,
    allocation_percentage: 0,
    beneficiary_type: 'all_investors'
  });

  const addTier = () => {
    if (newTier.tier_name && newTier.return_threshold !== undefined && newTier.allocation_percentage !== undefined) {
      setTiers([...tiers, newTier as WaterfallTier]);
      setNewTier({
        tier_name: '',
        distribution_priority: tiers.length + 2,
        return_threshold: 0,
        allocation_percentage: 0,
        beneficiary_type: 'all_investors'
      });
    }
  };

  const removeTier = (index: number) => {
    setTiers(tiers.filter((_, i) => i !== index));
  };

  const totalAllocation = tiers.reduce((sum, tier) => sum + tier.allocation_percentage, 0);

  // Template functions for common waterfall structures
  const loadTemplate = (templateName: string) => {
    let templateTiers: WaterfallTier[] = [];
    
    switch(templateName) {
      case 'preferred_return':
        templateTiers = [
          {
            tier_name: 'Return of Capital',
            distribution_priority: 1,
            return_threshold: 100,
            allocation_percentage: 100,
            beneficiary_type: 'all_investors'
          },
          {
            tier_name: 'Preferred Return (8%)',
            distribution_priority: 2,
            return_threshold: 8,
            allocation_percentage: 100,
            beneficiary_type: 'all_investors'
          },
          {
            tier_name: 'Profit Split (80/20)',
            distribution_priority: 3,
            return_threshold: 0,
            allocation_percentage: 80,
            beneficiary_type: 'all_investors'
          },
          {
            tier_name: 'Sponsor Carry (20%)',
            distribution_priority: 4,
            return_threshold: 0,
            allocation_percentage: 20,
            beneficiary_type: 'sponsors'
          }
        ];
        break;
        
      case 'catch_up':
        templateTiers = [
          {
            tier_name: 'Return of Capital',
            distribution_priority: 1,
            return_threshold: 100,
            allocation_percentage: 100,
            beneficiary_type: 'all_investors'
          },
          {
            tier_name: 'LP Preferred Return (8%)',
            distribution_priority: 2,
            return_threshold: 8,
            allocation_percentage: 100,
            beneficiary_type: 'all_investors'
          },
          {
            tier_name: 'GP Catch-Up (100%)',
            distribution_priority: 3,
            return_threshold: 0,
            allocation_percentage: 100,
            beneficiary_type: 'sponsors'
          },
          {
            tier_name: 'Final Split (80/20)',
            distribution_priority: 4,
            return_threshold: 0,
            allocation_percentage: 80,
            beneficiary_type: 'all_investors'
          },
          {
            tier_name: 'Final Carry (20%)',
            distribution_priority: 5,
            return_threshold: 0,
            allocation_percentage: 20,
            beneficiary_type: 'sponsors'
          }
        ];
        break;
        
      case 'tiered_carry':
        templateTiers = [
          {
            tier_name: 'Return of Capital',
            distribution_priority: 1,
            return_threshold: 100,
            allocation_percentage: 100,
            beneficiary_type: 'all_investors'
          },
          {
            tier_name: 'Tier 1 (0-8% IRR)',
            distribution_priority: 2,
            return_threshold: 8,
            allocation_percentage: 100,
            beneficiary_type: 'all_investors'
          },
          {
            tier_name: 'Tier 2 Investors (8-15% IRR)',
            distribution_priority: 3,
            return_threshold: 15,
            allocation_percentage: 75,
            beneficiary_type: 'all_investors'
          },
          {
            tier_name: 'Tier 2 Carry (20%)',
            distribution_priority: 4,
            return_threshold: 15,
            allocation_percentage: 20,
            beneficiary_type: 'sponsors'
          },
          {
            tier_name: 'Tier 3 Investors (15%+ IRR)',
            distribution_priority: 5,
            return_threshold: 0,
            allocation_percentage: 70,
            beneficiary_type: 'all_investors'
          },
          {
            tier_name: 'Tier 3 Carry (25%)',
            distribution_priority: 6,
            return_threshold: 0,
            allocation_percentage: 25,
            beneficiary_type: 'sponsors'
          }
        ];
        break;
        
      case 'european':
        templateTiers = [
          {
            tier_name: 'Fund-Level Return of Capital',
            distribution_priority: 1,
            return_threshold: 100,
            allocation_percentage: 100,
            beneficiary_type: 'pro_rata'
          },
          {
            tier_name: 'Fund-Level Preferred (8%)',
            distribution_priority: 2,
            return_threshold: 8,
            allocation_percentage: 100,
            beneficiary_type: 'pro_rata'
          },
          {
            tier_name: 'Remaining Profits (80%)',
            distribution_priority: 3,
            return_threshold: 0,
            allocation_percentage: 80,
            beneficiary_type: 'pro_rata'
          },
          {
            tier_name: 'GP Carry (20%)',
            distribution_priority: 4,
            return_threshold: 0,
            allocation_percentage: 20,
            beneficiary_type: 'sponsors'
          }
        ];
        break;
    }
    
    setTiers(templateTiers);
    alert(`✅ Loaded "${templateName.replace(/_/g, ' ')}" template with ${templateTiers.length} tiers`);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Waterfall Distribution Editor</h2>
        <p className="mt-1 text-sm text-gray-600">
          Configure custom waterfall distributions with preferred returns, carry, and catch-up provisions
        </p>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Distribution Tiers</h3>
        
        <div className="space-y-4">
          {tiers.map((tier, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h4 className="font-semibold text-gray-900">
                    Tier {tier.distribution_priority}: {tier.tier_name}
                  </h4>
                  <p className="text-sm text-gray-600 mt-1">
                    {tier.return_threshold}% return threshold
                  </p>
                </div>
                <button
                  onClick={() => removeTier(index)}
                  className="text-red-600 hover:text-red-700 text-sm"
                >
                  Remove
                </button>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500">Allocation</p>
                  <p className="text-sm font-medium text-gray-900">
                    {tier.allocation_percentage}%
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Beneficiary</p>
                  <p className="text-sm font-medium text-gray-900">
                    {tier.beneficiary_type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 pt-6 border-t border-gray-200">
          <h4 className="font-semibold text-gray-900 mb-4">Add New Tier</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tier Name
              </label>
              <input
                type="text"
                value={newTier.tier_name || ''}
                onChange={(e) => setNewTier({ ...newTier, tier_name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., Preferred Return"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Return Threshold (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={newTier.return_threshold || ''}
                onChange={(e) => setNewTier({ ...newTier, return_threshold: parseFloat(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="8.0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Allocation (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={newTier.allocation_percentage || ''}
                onChange={(e) => setNewTier({ ...newTier, allocation_percentage: parseFloat(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="20.0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Beneficiary Type
              </label>
              <select
                value={newTier.beneficiary_type || 'all_investors'}
                onChange={(e) => setNewTier({ ...newTier, beneficiary_type: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all_investors">All Investors</option>
                <option value="lead_investor">Lead Investor</option>
                <option value="sponsors">Sponsors</option>
                <option value="pro_rata">Pro-Rata Distribution</option>
              </select>
            </div>
          </div>

          <button
            onClick={addTier}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Add Tier
          </button>
        </div>

        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex justify-between items-center">
            <span className="font-medium text-gray-900">Total Allocation</span>
            <span className={`font-bold ${totalAllocation === 100 ? 'text-green-600' : 'text-red-600'}`}>
              {totalAllocation}%
            </span>
          </div>
          {totalAllocation !== 100 && (
            <p className="mt-2 text-sm text-red-600">
              Warning: Total allocation must equal 100%
            </p>
          )}
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Common Waterfall Structures</h3>
        <p className="text-sm text-gray-600 mb-4">
          Click any template below to automatically load pre-configured tiers
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div 
            onClick={() => loadTemplate('preferred_return')}
            className="border-2 border-gray-200 rounded-lg p-4 hover:border-blue-500 hover:bg-blue-50 cursor-pointer transition group"
          >
            <div className="flex items-start justify-between">
              <h4 className="font-semibold text-gray-900 group-hover:text-blue-600">Preferred Return (8%)</h4>
              <span className="text-blue-600 opacity-0 group-hover:opacity-100 transition">→</span>
            </div>
            <p className="text-sm text-gray-600 mt-1">
              100% to investors until 8% return, then 80/20 split
            </p>
            <div className="mt-2 text-xs text-blue-600 font-medium opacity-0 group-hover:opacity-100 transition">
              Click to load template
            </div>
          </div>

          <div 
            onClick={() => loadTemplate('catch_up')}
            className="border-2 border-gray-200 rounded-lg p-4 hover:border-blue-500 hover:bg-blue-50 cursor-pointer transition group"
          >
            <div className="flex items-start justify-between">
              <h4 className="font-semibold text-gray-900 group-hover:text-blue-600">Catch-Up (20%)</h4>
              <span className="text-blue-600 opacity-0 group-hover:opacity-100 transition">→</span>
            </div>
            <p className="text-sm text-gray-600 mt-1">
              100% to LP until pref, then 100% to GP until 20% carry, then 80/20
            </p>
            <div className="mt-2 text-xs text-blue-600 font-medium opacity-0 group-hover:opacity-100 transition">
              Click to load template
            </div>
          </div>

          <div 
            onClick={() => loadTemplate('tiered_carry')}
            className="border-2 border-gray-200 rounded-lg p-4 hover:border-blue-500 hover:bg-blue-50 cursor-pointer transition group"
          >
            <div className="flex items-start justify-between">
              <h4 className="font-semibold text-gray-900 group-hover:text-blue-600">Tiered Carry</h4>
              <span className="text-blue-600 opacity-0 group-hover:opacity-100 transition">→</span>
            </div>
            <p className="text-sm text-gray-600 mt-1">
              20% carry above 8% return, 25% carry above 15% return
            </p>
            <div className="mt-2 text-xs text-blue-600 font-medium opacity-0 group-hover:opacity-100 transition">
              Click to load template
            </div>
          </div>

          <div 
            onClick={() => loadTemplate('european')}
            className="border-2 border-gray-200 rounded-lg p-4 hover:border-blue-500 hover:bg-blue-50 cursor-pointer transition group"
          >
            <div className="flex items-start justify-between">
              <h4 className="font-semibold text-gray-900 group-hover:text-blue-600">European Waterfall</h4>
              <span className="text-blue-600 opacity-0 group-hover:opacity-100 transition">→</span>
            </div>
            <p className="text-sm text-gray-600 mt-1">
              Distributions calculated at fund level, not deal-by-deal
            </p>
            <div className="mt-2 text-xs text-blue-600 font-medium opacity-0 group-hover:opacity-100 transition">
              Click to load template
            </div>
          </div>
        </div>

        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800">
            <span className="font-semibold">Note:</span> Loading a template will replace your current tiers. Make sure to save any custom configurations first.
          </p>
        </div>
      </div>
    </div>
  );
};
