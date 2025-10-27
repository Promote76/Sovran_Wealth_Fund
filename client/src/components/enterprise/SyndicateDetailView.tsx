import React, { useState, useEffect } from 'react';

interface SyndicateDetailViewProps {
  syndicateId: string;
  onClose: () => void;
}

interface Syndicate {
  syndicate_id: string;
  syndicate_name: string;
  syndicate_type: string;
  target_raise: string;
  minimum_commitment: string;
  maximum_commitment: string;
  visibility: string;
  lead_investor_id: number;
  created_at: string;
  status?: string;
}

interface WaterfallTier {
  tier_id: string;
  tier_name: string;
  distribution_priority: number;
  return_threshold: number;
  allocation_percentage: number;
  beneficiary_type: string;
}

interface Investor {
  invitation_id: string;
  invitee_email: string;
  proposed_commitment: string;
  status: string;
  invited_at: string;
}

export const SyndicateDetailView: React.FC<SyndicateDetailViewProps> = ({ syndicateId, onClose }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'investors' | 'waterfall' | 'distributions' | 'performance' | 'settings'>('overview');
  const [syndicate, setSyndicate] = useState<Syndicate | null>(null);
  const [waterfallTiers, setWaterfallTiers] = useState<WaterfallTier[]>([]);
  const [investors, setInvestors] = useState<Investor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSyndicateData();
  }, [syndicateId]);

  const loadSyndicateData = async () => {
    setLoading(true);
    try {
      // Load syndicate details
      const syndicateResponse = await fetch(`/api/syndication/syndicates/${syndicateId}`);
      if (syndicateResponse.ok) {
        const data = await syndicateResponse.json();
        setSyndicate(data.syndicate);
      }

      // Load waterfall tiers
      const waterfallResponse = await fetch(`/api/syndication/syndicates/${syndicateId}/waterfall`);
      if (waterfallResponse.ok) {
        const data = await waterfallResponse.json();
        // Map API response to expected format
        const mappedTiers = (data.tiers || []).map((tier: any) => ({
          tier_id: tier.id?.toString() || tier.tier_id,
          tier_name: tier.tier_name,
          distribution_priority: tier.tier_order || tier.distribution_priority,
          return_threshold: tier.hurdle_rate || tier.return_threshold || 0,
          allocation_percentage: tier.allocation_percentage,
          beneficiary_type: tier.tier_type || tier.beneficiary_type || 'all_investors'
        }));
        setWaterfallTiers(mappedTiers);
      }

      // Load investors
      const investorsResponse = await fetch(`/api/syndication/syndicates/${syndicateId}/invitations`);
      if (investorsResponse.ok) {
        const data = await investorsResponse.json();
        setInvestors(data.invitations || []);
      }
    } catch (error) {
      console.error('Error loading syndicate data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateMetrics = () => {
    const totalCommitments = investors
      .filter(inv => inv.status === 'accepted')
      .reduce((sum, inv) => sum + parseFloat(inv.proposed_commitment || '0'), 0);
    
    const targetRaise = parseFloat(syndicate?.target_raise || '0');
    const percentRaised = targetRaise > 0 ? (totalCommitments / targetRaise) * 100 : 0;
    
    return {
      totalCommitments,
      targetRaise,
      percentRaised,
      activeInvestors: investors.filter(inv => inv.status === 'accepted').length,
      pendingInvitations: investors.filter(inv => inv.status === 'pending').length
    };
  };

  if (loading || !syndicate) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading syndicate details...</p>
        </div>
      </div>
    );
  }

  const metrics = calculateMetrics();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 rounded-t-lg">
          <div className="flex justify-between items-start">
            <div className="flex-1 pr-4">
              <h2 className="text-2xl font-bold break-words">{syndicate.syndicate_name}</h2>
              <p className="text-blue-100 mt-1 text-sm break-all">Syndicate ID: {syndicate.syndicate_id}</p>
              <div className="flex flex-wrap gap-2 mt-3">
                <span className="px-3 py-1 bg-blue-500 bg-opacity-50 rounded-full text-xs font-medium">
                  {syndicate.syndicate_type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </span>
                <span className="px-3 py-1 bg-green-500 bg-opacity-50 rounded-full text-xs font-medium">
                  {syndicate.visibility === 'private' ? '🔒 Private' : '🌐 Public'}
                </span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 text-2xl font-bold flex-shrink-0 w-8 h-8 flex items-center justify-center"
              aria-label="Close"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 bg-gray-50">
          <nav className="flex overflow-x-auto px-6 scrollbar-hide" aria-label="Tabs">
            {[
              { id: 'overview', label: '📊 Overview' },
              { id: 'investors', label: '👥 Investors' },
              { id: 'waterfall', label: '💧 Waterfall' },
              { id: 'distributions', label: '💰 Distributions' },
              { id: 'performance', label: '📈 Performance' },
              { id: 'settings', label: '⚙️ Settings' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-4 px-3 border-b-2 font-medium text-sm transition whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="p-4 md:p-6">
          {activeTab === 'overview' && (
            <OverviewTab syndicate={syndicate} metrics={metrics} investors={investors} />
          )}
          {activeTab === 'investors' && (
            <InvestorsTab investors={investors} syndicateId={syndicateId} onRefresh={loadSyndicateData} />
          )}
          {activeTab === 'waterfall' && (
            <WaterfallTab tiers={waterfallTiers} syndicateId={syndicateId} />
          )}
          {activeTab === 'distributions' && (
            <DistributionsTab syndicateId={syndicateId} />
          )}
          {activeTab === 'performance' && (
            <PerformanceTab syndicate={syndicate} metrics={metrics} />
          )}
          {activeTab === 'settings' && (
            <SettingsTab syndicate={syndicate} onRefresh={loadSyndicateData} />
          )}
        </div>
      </div>
    </div>
  );
};

// Overview Tab Component
const OverviewTab: React.FC<{ syndicate: Syndicate; metrics: any; investors: Investor[] }> = ({ syndicate, metrics, investors }) => {
  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <MetricCard
          title="Target Raise"
          value={`$${parseFloat(syndicate.target_raise).toLocaleString()}`}
          icon="🎯"
          color="blue"
        />
        <MetricCard
          title="Total Committed"
          value={`$${metrics.totalCommitments.toLocaleString()}`}
          icon="💰"
          color="green"
          subtitle={`${metrics.percentRaised.toFixed(1)}% of target`}
        />
        <MetricCard
          title="Active Investors"
          value={metrics.activeInvestors.toString()}
          icon="👥"
          color="purple"
        />
        <MetricCard
          title="Pending Invitations"
          value={metrics.pendingInvitations.toString()}
          icon="✉️"
          color="orange"
        />
      </div>

      {/* Progress Bar */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-lg font-semibold text-gray-900">Fundraising Progress</h3>
          <span className="text-2xl font-bold text-blue-600">{metrics.percentRaised.toFixed(1)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-6">
          <div
            className="bg-gradient-to-r from-blue-500 to-blue-600 h-6 rounded-full transition-all duration-500 flex items-center justify-end px-2"
            style={{ width: `${Math.min(metrics.percentRaised, 100)}%` }}
          >
            {metrics.percentRaised > 10 && (
              <span className="text-white text-xs font-bold">
                ${metrics.totalCommitments.toLocaleString()}
              </span>
            )}
          </div>
        </div>
        <div className="flex justify-between mt-2 text-sm text-gray-600">
          <span>$0</span>
          <span>${parseFloat(syndicate.target_raise).toLocaleString()} target</span>
        </div>
      </div>

      {/* Syndicate Details */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Syndicate Details</h3>
        <div className="grid grid-cols-2 gap-4">
          <DetailRow label="Type" value={syndicate.syndicate_type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} />
          <DetailRow label="Visibility" value={syndicate.visibility === 'private' ? '🔒 Private' : '🌐 Public'} />
          <DetailRow label="Min Commitment" value={`$${parseFloat(syndicate.minimum_commitment).toLocaleString()}`} />
          <DetailRow label="Max Commitment" value={`$${parseFloat(syndicate.maximum_commitment).toLocaleString()}`} />
          <DetailRow label="Created" value={new Date(syndicate.created_at).toLocaleDateString()} />
          <DetailRow label="Lead Investor ID" value={syndicate.lead_investor_id.toString()} />
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Investor Activity</h3>
        <div className="space-y-3">
          {investors.slice(0, 5).map((investor, idx) => (
            <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white ${
                  investor.status === 'accepted' ? 'bg-green-500' :
                  investor.status === 'pending' ? 'bg-yellow-500' : 'bg-gray-500'
                }`}>
                  {investor.invitee_email.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-medium text-gray-900">{investor.invitee_email}</p>
                  <p className="text-sm text-gray-500">{new Date(investor.invited_at).toLocaleDateString()}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-semibold text-gray-900">${parseFloat(investor.proposed_commitment).toLocaleString()}</p>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  investor.status === 'accepted' ? 'bg-green-100 text-green-700' :
                  investor.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-red-100 text-red-700'
                }`}>
                  {investor.status.charAt(0).toUpperCase() + investor.status.slice(1)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Investors Tab Component
const InvestorsTab: React.FC<{ investors: Investor[]; syndicateId: string; onRefresh: () => void }> = ({ investors, syndicateId, onRefresh }) => {
  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <h3 className="text-lg font-semibold text-gray-900">Investor Management</h3>
        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition whitespace-nowrap">
          + Invite New Investor
        </button>
      </div>

      {investors.length === 0 ? (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-8 text-center">
          <p className="text-blue-800 font-medium">No investors yet</p>
          <p className="text-sm text-blue-600 mt-2">Send invitations to get started building your syndicate</p>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Investor</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Commitment</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Invited Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {investors.map((investor) => (
              <tr key={investor.invitation_id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold">
                      {investor.invitee_email.charAt(0).toUpperCase()}
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">{investor.invitee_email}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold">
                  ${parseFloat(investor.proposed_commitment).toLocaleString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    investor.status === 'accepted' ? 'bg-green-100 text-green-800' :
                    investor.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {investor.status.charAt(0).toUpperCase() + investor.status.slice(1)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(investor.invited_at).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button className="text-blue-600 hover:text-blue-900 mr-3">View</button>
                  <button className="text-red-600 hover:text-red-900">Remove</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      )}
    </div>
  );
};

// Waterfall Tab Component
const WaterfallTab: React.FC<{ tiers: WaterfallTier[]; syndicateId: string }> = ({ tiers }) => {
  const totalAllocation = tiers.reduce((sum, tier) => sum + tier.allocation_percentage, 0);
  
  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <h3 className="text-lg font-semibold text-gray-900">Waterfall Distribution Structure</h3>
        <div className={`px-4 py-2 rounded-lg font-semibold text-sm ${
          totalAllocation === 100 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
        }`}>
          Total: {totalAllocation}%
        </div>
      </div>

      {tiers.length === 0 ? (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
          <p className="text-yellow-800 font-medium">No waterfall tiers configured</p>
          <p className="text-sm text-yellow-600 mt-2">Add waterfall tiers to define distribution priority</p>
        </div>
      ) : (
        <div className="space-y-3">
          {tiers.map((tier, index) => (
            <div key={tier.tier_id} className="bg-white border-2 border-gray-200 rounded-lg p-4">
              <div className="flex flex-col sm:flex-row items-start justify-between gap-3 mb-3">
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-3 py-1 bg-blue-600 text-white rounded-full text-xs font-bold">
                      Tier {tier.distribution_priority}
                    </span>
                    <h4 className="text-base sm:text-lg font-semibold text-gray-900 break-words">{tier.tier_name}</h4>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    Return threshold: {tier.return_threshold}%
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-2xl font-bold text-blue-600">{tier.allocation_percentage}%</p>
                  <p className="text-xs text-gray-500">Allocation</p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs">
                  {tier.beneficiary_type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Distributions Tab Component
const DistributionsTab: React.FC<{ syndicateId: string }> = () => {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">Distribution History</h3>
      
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
        <p className="text-blue-800 font-medium">💰 No distributions made yet</p>
        <p className="text-sm text-blue-600 mt-2">Distributions will appear here once deals close and profits are distributed</p>
        <button className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
          Create Distribution
        </button>
      </div>
    </div>
  );
};

// Performance Tab Component
const PerformanceTab: React.FC<{ syndicate: Syndicate; metrics: any }> = ({ metrics }) => {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">Performance Metrics</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <MetricCard title="Total IRR" value="N/A" icon="📈" color="green" subtitle="No deals closed yet" />
        <MetricCard title="Cash-on-Cash" value="N/A" icon="💵" color="blue" subtitle="No deals closed yet" />
        <MetricCard title="Total Deployed" value={`$${metrics.totalCommitments.toLocaleString()}`} icon="💼" color="purple" />
      </div>

      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
        <p className="text-gray-600">Performance tracking will be available once the syndicate deploys capital</p>
      </div>
    </div>
  );
};

// Settings Tab Component
const SettingsTab: React.FC<{ syndicate: Syndicate; onRefresh: () => void }> = ({ syndicate }) => {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">Syndicate Settings</h3>
      
      <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Syndicate Name</label>
          <input
            type="text"
            defaultValue={syndicate.syndicate_name}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Minimum Commitment</label>
            <input
              type="number"
              defaultValue={syndicate.minimum_commitment}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Maximum Commitment</label>
            <input
              type="number"
              defaultValue={syndicate.maximum_commitment}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Visibility</label>
          <select
            defaultValue={syndicate.visibility}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="private">Private - Invite Only</option>
            <option value="public">Public - Open to All</option>
          </select>
        </div>

        <div className="flex gap-3 pt-4">
          <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
            Save Changes
          </button>
          <button className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition">
            Delete Syndicate
          </button>
        </div>
      </div>
    </div>
  );
};

// Helper Components
const MetricCard: React.FC<{ title: string; value: string; icon: string; color: string; subtitle?: string }> = 
  ({ title, value, icon, color, subtitle }) => {
  const colorClasses = {
    blue: 'from-blue-500 to-blue-600',
    green: 'from-green-500 to-green-600',
    purple: 'from-purple-500 to-purple-600',
    orange: 'from-orange-500 to-orange-600'
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
      <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${colorClasses[color]} flex items-center justify-center text-2xl mb-3`}>
        {icon}
      </div>
      <h4 className="text-sm text-gray-600 font-medium">{title}</h4>
      <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
      {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
    </div>
  );
};

const DetailRow: React.FC<{ label: string; value: string }> = ({ label, value }) => {
  return (
    <div>
      <p className="text-sm text-gray-500">{label}</p>
      <p className="text-base font-medium text-gray-900 mt-1">{value}</p>
    </div>
  );
};
