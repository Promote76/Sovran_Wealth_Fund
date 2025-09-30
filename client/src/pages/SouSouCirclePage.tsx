import React, { useState, useEffect } from 'react';

interface Circle {
  id: number;
  name: string;
  members: number;
  maxMembers: number;
  contributionAmount: string;
  frequency: string;
  status: 'Open' | 'Active' | 'Completed';
  nextPayout: string;
}

const SouSouCirclePage: React.FC = () => {
  const [circles, setCircles] = useState<Circle[]>([]);
  const [userCircles, setUserCircles] = useState<Circle[]>([]);
  const [activeTab, setActiveTab] = useState('discover');

  useEffect(() => {
    // Mock data
    const mockCircles: Circle[] = [
      {
        id: 1,
        name: 'Young Professionals Circle',
        members: 8,
        maxMembers: 12,
        contributionAmount: '$500',
        frequency: 'Monthly',
        status: 'Open',
        nextPayout: 'March 15, 2025'
      },
      {
        id: 2,
        name: 'Family Savings Group',
        members: 10,
        maxMembers: 10,
        contributionAmount: '$200',
        frequency: 'Weekly',
        status: 'Active',
        nextPayout: 'March 8, 2025'
      },
      {
        id: 3,
        name: 'Entrepreneur Network',
        members: 15,
        maxMembers: 20,
        contributionAmount: '$1,000',
        frequency: 'Monthly',
        status: 'Open',
        nextPayout: 'March 20, 2025'
      }
    ];
    
    setCircles(mockCircles);
    setUserCircles([mockCircles[1]]); // User is part of one circle
  }, []);

  return (
    <div className="bg-gradient-to-br from-white via-blue-50 to-white min-h-screen">
        {/* Hero Section */}
      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-6 text-blue-800">
            SouSou <span className="text-blue-600">Circle</span>
          </h1>
          <p className="text-xl text-gray-700 max-w-3xl mx-auto">
            Join community savings circles where members contribute regularly and take turns 
            receiving the collective pool. Traditional rotating credit associations powered by blockchain.
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex justify-center mb-8">
          <div className="bg-gradient-to-br from-white to-blue-50 border-2 border-blue-300 rounded-lg p-1 shadow-lg">
            {['discover', 'my-circles', 'create'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-3 rounded-lg capitalize font-medium transition-colors ${
                  activeTab === tab
                    ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg'
                    : 'text-gray-700 hover:text-blue-800 hover:bg-blue-100'
                }`}
              >
                {tab === 'my-circles' ? 'My Circles' : tab}
              </button>
            ))}
          </div>
        </div>

        {/* Discover Circles */}
        {activeTab === 'discover' && (
          <div className="space-y-8">
            <h2 className="text-2xl font-bold mb-6 text-blue-800">Available Circles</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {circles.filter(circle => circle.status === 'Open').map((circle) => (
                <div
                  key={circle.id}
                  className="bg-gradient-to-br from-white to-blue-50 border-2 border-blue-300 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-blue-800">{circle.name}</h3>
                    <span className="px-2 py-1 bg-green-500 text-white rounded text-xs font-medium">
                      {circle.status}
                    </span>
                  </div>
                  
                  <div className="space-y-3 mb-6">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Contribution:</span>
                      <span className="font-semibold text-blue-700">{circle.contributionAmount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Frequency:</span>
                      <span className="font-semibold text-blue-700">{circle.frequency}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Members:</span>
                      <span className="font-semibold text-blue-700">{circle.members}/{circle.maxMembers}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Next Payout:</span>
                      <span className="font-semibold text-blue-700">{circle.nextPayout}</span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-6">
                    <div className="flex justify-between text-sm mb-2 text-gray-600">
                      <span>Capacity</span>
                      <span>{Math.round((circle.members / circle.maxMembers) * 100)}%</span>
                    </div>
                    <div className="w-full bg-blue-200 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full"
                        style={{ width: `${(circle.members / circle.maxMembers) * 100}%` }}
                      ></div>
                    </div>
                  </div>

                  <button className="w-full px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg shadow-lg transition-all duration-200">
                    Join Circle
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* My Circles */}
        {activeTab === 'my-circles' && (
          <div className="space-y-8">
            <h2 className="text-2xl font-bold mb-6">My Active Circles</h2>
            {userCircles.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {userCircles.map((circle) => (
                  <div
                    key={circle.id}
                    className="bg-gradient-to-br from-white to-blue-50 border-2 border-blue-400 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-200"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-bold text-blue-800">{circle.name}</h3>
                      <span className="px-2 py-1 bg-blue-500 text-white rounded text-xs font-medium">
                        {circle.status}
                      </span>
                    </div>
                    
                    <div className="space-y-3 mb-6">
                      <div className="flex justify-between">
                        <span className="text-gray-600">My Position:</span>
                        <span className="font-semibold text-blue-700">3rd in rotation</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Next Contribution:</span>
                        <span className="font-semibold text-blue-700">{circle.contributionAmount}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Due Date:</span>
                        <span className="font-semibold text-blue-700">March 8, 2025</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Total Contributed:</span>
                        <span className="font-semibold text-blue-600">$1,400</span>
                      </div>
                    </div>

                    <div className="flex space-x-3">
                      <button className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg shadow-lg transition-all duration-200">
                        Make Payment
                      </button>
                      <button className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-400 to-blue-500 hover:from-blue-500 hover:to-blue-600 text-white rounded-lg shadow-lg transition-all duration-200">
                        View Details
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-600 text-lg mb-4">You're not part of any circles yet.</p>
                <button
                  onClick={() => setActiveTab('discover')}
                  className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg shadow-lg transition-all duration-200"
                >
                  Discover Circles
                </button>
              </div>
            )}
          </div>
        )}

        {/* Create Circle */}
        {activeTab === 'create' && (
          <div className="max-w-2xl mx-auto">
            <div className="bg-gradient-to-br from-white to-blue-50 border-2 border-blue-300 rounded-xl p-8 shadow-lg">
              <h2 className="text-2xl font-bold mb-6 text-center text-blue-800">Create New Circle</h2>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-blue-700 mb-2">
                    Circle Name
                  </label>
                  <input
                    type="text"
                    placeholder="Enter circle name"
                    className="w-full px-4 py-3 bg-white border-2 border-blue-300 rounded-lg text-gray-800 placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-blue-700 mb-2">
                      Contribution Amount
                    </label>
                    <input
                      type="number"
                      placeholder="500"
                      className="w-full px-4 py-3 bg-white border-2 border-blue-300 rounded-lg text-gray-800 placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-blue-700 mb-2">
                      Max Members
                    </label>
                    <input
                      type="number"
                      placeholder="12"
                      className="w-full px-4 py-3 bg-white border-2 border-blue-300 rounded-lg text-gray-800 placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-blue-700 mb-2">
                    Contribution Frequency
                  </label>
                  <select className="w-full px-4 py-3 bg-white border-2 border-blue-300 rounded-lg text-gray-800 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200">
                    <option value="weekly">Weekly</option>
                    <option value="biweekly">Bi-weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-blue-700 mb-2">
                    Description
                  </label>
                  <textarea
                    placeholder="Describe your circle's purpose and rules"
                    rows={4}
                    className="w-full px-4 py-3 bg-white border-2 border-blue-300 rounded-lg text-gray-800 placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                  ></textarea>
                </div>

                <button className="w-full px-6 py-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold rounded-lg shadow-lg transition-all duration-200">
                  Create Circle
                </button>
              </div>
            </div>
          </div>
        )}

        {/* How It Works */}
        <div className="mt-16">
          <h2 className="text-3xl font-bold text-center mb-12 text-blue-800">How SouSou Circles Work</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 border-2 border-blue-300 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">1️⃣</span>
              </div>
              <h3 className="text-lg font-semibold mb-2 text-blue-800">Join Circle</h3>
              <p className="text-gray-600">Find or create a circle that matches your savings goals</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 border-2 border-blue-300 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">2️⃣</span>
              </div>
              <h3 className="text-lg font-semibold mb-2 text-blue-800">Regular Contributions</h3>
              <p className="text-gray-600">Members contribute a fixed amount on schedule</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 border-2 border-blue-300 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">3️⃣</span>
              </div>
              <h3 className="text-lg font-semibold mb-2 text-blue-800">Rotating Payouts</h3>
              <p className="text-gray-600">Each member receives the full pool when it's their turn</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 border-2 border-blue-300 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">4️⃣</span>
              </div>
              <h3 className="text-lg font-semibold mb-2 text-blue-800">Build Community</h3>
              <p className="text-gray-600">Create lasting financial relationships and support networks</p>
            </div>
          </div>
        </div>
      </div>
      </div>
  );
};

export default SouSouCirclePage;