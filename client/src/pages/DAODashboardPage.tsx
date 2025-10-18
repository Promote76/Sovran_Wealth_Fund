import React, { useState, useEffect } from 'react';

interface Proposal {
  id: number;
  title: string;
  description: string;
  status: 'Active' | 'Passed' | 'Failed' | 'Pending';
  votesFor: number;
  votesAgainst: number;
  totalVotes: number;
  endDate: string;
  proposer: string;
}

const DAODashboardPage: React.FC = () => {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [treasuryBalance, setTreasuryBalance] = useState('2,847,392');
  const [totalMembers, setTotalMembers] = useState('1,247');
  const [activeTab, setActiveTab] = useState('proposals');

  useEffect(() => {
    // Mock proposal data
    const mockProposals: Proposal[] = [
      {
        id: 1,
        title: 'Increase Staking Rewards by 2%',
        description: 'Proposal to increase the base staking APY from 12% to 14% to attract more participants.',
        status: 'Active',
        votesFor: 847,
        votesAgainst: 123,
        totalVotes: 970,
        endDate: 'March 15, 2025',
        proposer: '0xABC...123'
      },
      {
        id: 2,
        title: 'Add New Real Estate Property to Portfolio',
        description: 'Proposal to acquire a commercial office building in Austin, TX for $5M.',
        status: 'Passed',
        votesFor: 1204,
        votesAgainst: 89,
        totalVotes: 1293,
        endDate: 'March 5, 2025',
        proposer: '0xDEF...456'
      },
      {
        id: 3,
        title: 'Launch AXIOM Mobile App',
        description: 'Allocate $250,000 from treasury for mobile app development and launch.',
        status: 'Active',
        votesFor: 654,
        votesAgainst: 234,
        totalVotes: 888,
        endDate: 'March 20, 2025',
        proposer: '0xGHI...789'
      }
    ];
    
    setProposals(mockProposals);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active': return 'bg-blue-500';
      case 'Passed': return 'bg-green-500';
      case 'Failed': return 'bg-red-500';
      case 'Pending': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="bg-gradient-to-br from-white via-blue-50 to-white min-h-screen">

      {/* Hero Section */}
      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-6 text-blue-800">
            DAO <span className="text-blue-600">Governance</span>
          </h1>
          <p className="text-xl text-gray-700 max-w-3xl mx-auto">
            Participate in decentralized governance of the AXIOM platform. 
            Vote on proposals, manage the treasury, and shape the future of the platform.
          </p>
        </div>

        {/* DAO Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          <div className="bg-gradient-to-br from-white to-blue-50 border-2 border-blue-300 rounded-xl p-6 text-center shadow-lg">
            <div className="text-2xl font-bold text-blue-600 mb-2">${treasuryBalance}</div>
            <div className="text-gray-700">Treasury Balance</div>
          </div>
          <div className="bg-gradient-to-br from-white to-blue-50 border-2 border-blue-300 rounded-xl p-6 text-center shadow-lg">
            <div className="text-2xl font-bold text-blue-600 mb-2">{totalMembers}</div>
            <div className="text-gray-700">DAO Members</div>
          </div>
          <div className="bg-gradient-to-br from-white to-blue-50 border-2 border-blue-300 rounded-xl p-6 text-center shadow-lg">
            <div className="text-2xl font-bold text-blue-600 mb-2">23</div>
            <div className="text-gray-700">Active Proposals</div>
          </div>
          <div className="bg-gradient-to-br from-white to-blue-50 border-2 border-blue-300 rounded-xl p-6 text-center shadow-lg">
            <div className="text-2xl font-bold text-blue-600 mb-2">89%</div>
            <div className="text-gray-700">Voter Participation</div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex justify-center mb-8">
          <div className="bg-gradient-to-br from-white to-blue-50 border-2 border-blue-300 rounded-lg p-1 shadow-lg">
            {['proposals', 'treasury', 'members', 'history'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-3 rounded-lg capitalize font-medium transition-colors ${
                  activeTab === tab
                    ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg'
                    : 'text-gray-700 hover:text-blue-800 hover:bg-blue-100'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Proposals Tab */}
        {activeTab === 'proposals' && (
          <div className="space-y-6">
            {proposals.map((proposal) => (
              <div
                key={proposal.id}
                className="bg-gradient-to-br from-white to-blue-50 border-2 border-blue-300 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-200"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-xl font-bold text-blue-800">{proposal.title}</h3>
                      <span className={`px-2 py-1 rounded text-xs font-medium text-white ${getStatusColor(proposal.status)}`}>
                        {proposal.status}
                      </span>
                    </div>
                    <p className="text-gray-700 mb-4">{proposal.description}</p>
                    <div className="text-sm text-gray-600">
                      Proposed by: {proposal.proposer} • Ends: {proposal.endDate}
                    </div>
                  </div>
                </div>

                {/* Voting Progress */}
                <div className="space-y-4">
                  <div className="flex justify-between text-sm text-gray-700">
                    <span>Votes: {proposal.totalVotes} total</span>
                    <span>{Math.round((proposal.votesFor / proposal.totalVotes) * 100)}% in favor</span>
                  </div>
                  
                  <div className="relative">
                    <div className="w-full bg-blue-200 rounded-full h-3">
                      <div
                        className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full"
                        style={{ width: `${(proposal.votesFor / proposal.totalVotes) * 100}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between text-xs text-gray-600 mt-1">
                      <span>For: {proposal.votesFor}</span>
                      <span>Against: {proposal.votesAgainst}</span>
                    </div>
                  </div>

                  {/* Voting Buttons */}
                  {proposal.status === 'Active' && (
                    <div className="flex space-x-4 pt-4">
                      <button className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg shadow-lg transition-all duration-200">
                        Vote For
                      </button>
                      <button className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-400 to-blue-500 hover:from-blue-500 hover:to-blue-600 text-white rounded-lg shadow-lg transition-all duration-200">
                        Vote Against
                      </button>
                      <button className="px-6 py-2 bg-gradient-to-r from-blue-300 to-blue-400 hover:from-blue-400 hover:to-blue-500 text-white rounded-lg shadow-lg transition-all duration-200">
                        Details
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Treasury Tab */}
        {activeTab === 'treasury' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-gradient-to-br from-white to-blue-50 border-2 border-blue-300 rounded-xl p-6 shadow-lg">
                <h3 className="text-lg font-semibold mb-4 text-blue-800">Treasury Overview</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Value:</span>
                    <span className="font-bold text-blue-600">${treasuryBalance}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">AXM Tokens:</span>
                    <span className="font-semibold text-blue-700">1,247,832</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">USDC:</span>
                    <span className="font-semibold text-blue-700">$892,445</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Real Estate:</span>
                    <span className="font-semibold text-blue-700">$1,450,000</span>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-white to-blue-50 border-2 border-blue-300 rounded-xl p-6 shadow-lg">
                <h3 className="text-lg font-semibold mb-4 text-blue-800">Monthly Activity</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Income:</span>
                    <span className="font-semibold text-blue-600">+$45,230</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Expenses:</span>
                    <span className="font-semibold text-blue-600">-$12,450</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Net Growth:</span>
                    <span className="font-semibold text-blue-600">+$32,780</span>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-white to-blue-50 border-2 border-blue-300 rounded-xl p-6 shadow-lg">
                <h3 className="text-lg font-semibold mb-4 text-blue-800">Allocation</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Operations:</span>
                    <span className="font-semibold text-blue-700">35%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Development:</span>
                    <span className="font-semibold text-blue-700">25%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Reserves:</span>
                    <span className="font-semibold text-blue-700">40%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Other tabs content would go here */}
        {(activeTab === 'members' || activeTab === 'history') && (
          <div className="bg-gradient-to-br from-white to-blue-50 border-2 border-blue-300 rounded-xl p-12 text-center shadow-lg">
            <h3 className="text-2xl font-bold mb-4 capitalize text-blue-800">{activeTab}</h3>
            <p className="text-gray-600 mb-6">
              This section is under development. Coming soon with full {activeTab} functionality.
            </p>
          </div>
        )}

        {/* Governance Features */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-100 border-2 border-blue-300 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🗳️</span>
            </div>
            <h3 className="text-lg font-semibold mb-2 text-blue-800">Democratic Voting</h3>
            <p className="text-gray-600">One token, one vote governance system</p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-100 border-2 border-blue-300 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">💰</span>
            </div>
            <h3 className="text-lg font-semibold mb-2 text-blue-800">Treasury Management</h3>
            <p className="text-gray-600">Transparent fund allocation and spending</p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-100 border-2 border-blue-300 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">📋</span>
            </div>
            <h3 className="text-lg font-semibold mb-2 text-blue-800">Proposal System</h3>
            <p className="text-gray-600">Community-driven feature development</p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-100 border-2 border-blue-300 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">⏰</span>
            </div>
            <h3 className="text-lg font-semibold mb-2 text-blue-800">Time-locked Execution</h3>
            <p className="text-gray-600">Secure implementation of approved proposals</p>
          </div>
        </div>
      </div>
      </div>
  );
};

export default DAODashboardPage;