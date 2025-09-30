import React, { useState, useEffect } from 'react';

interface Property {
  id: number;
  name: string;
  type: string;
  location: string;
  price: string;
  tokenPrice: string;
  totalTokens: number;
  soldTokens: number;
  apy: string;
  status: 'Available' | 'Funding' | 'Fully Funded';
}

const RealEstatePage: React.FC = () => {
  const [properties, setProperties] = useState<Property[]>([]);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [filterType, setFilterType] = useState('all');

  useEffect(() => {
    // Mock data - in real app, fetch from API
    const mockProperties: Property[] = [
      {
        id: 1,
        name: 'Downtown Office Complex',
        type: 'Commercial',
        location: 'Miami, FL',
        price: '$2,500,000',
        tokenPrice: '$100',
        totalTokens: 25000,
        soldTokens: 18750,
        apy: '8.5%',
        status: 'Funding'
      },
      {
        id: 2,
        name: 'Luxury Residential Tower',
        type: 'Residential',
        location: 'Austin, TX',
        price: '$5,000,000',
        tokenPrice: '$200',
        totalTokens: 25000,
        soldTokens: 25000,
        apy: '7.2%',
        status: 'Fully Funded'
      },
      {
        id: 3,
        name: 'Shopping Center Plaza',
        type: 'Mixed-Use',
        location: 'Phoenix, AZ',
        price: '$3,200,000',
        tokenPrice: '$80',
        totalTokens: 40000,
        soldTokens: 0,
        apy: '9.1%',
        status: 'Available'
      }
    ];
    setProperties(mockProperties);
  }, []);

  const filteredProperties = properties.filter(property => 
    filterType === 'all' || property.type.toLowerCase() === filterType
  );

  return (
    <div className="bg-gradient-to-br from-white via-blue-50 to-white min-h-screen">
        {/* Hero Section */}
      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-6 text-blue-800">
            Real Estate <span className="text-blue-600">Tokenization</span>
          </h1>
          <p className="text-xl text-gray-700 max-w-3xl mx-auto">
            Invest in tokenized real estate through blockchain technology. 
            Access commercial, residential, and mixed-use properties with fractional ownership.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          <div className="bg-gradient-to-br from-white to-blue-50 border-2 border-blue-300 rounded-xl p-6 text-center shadow-lg">
            <div className="text-2xl font-bold text-blue-600 mb-2">$12.5M</div>
            <div className="text-gray-700">Total Property Value</div>
          </div>
          <div className="bg-gradient-to-br from-white to-blue-50 border-2 border-blue-300 rounded-xl p-6 text-center shadow-lg">
            <div className="text-2xl font-bold text-blue-600 mb-2">125</div>
            <div className="text-gray-700">Active Properties</div>
          </div>
          <div className="bg-gradient-to-br from-white to-blue-50 border-2 border-blue-300 rounded-xl p-6 text-center shadow-lg">
            <div className="text-2xl font-bold text-blue-600 mb-2">8.3%</div>
            <div className="text-gray-700">Average APY</div>
          </div>
          <div className="bg-gradient-to-br from-white to-blue-50 border-2 border-blue-300 rounded-xl p-6 text-center shadow-lg">
            <div className="text-2xl font-bold text-blue-600 mb-2">2,847</div>
            <div className="text-gray-700">Token Holders</div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex justify-center mb-8">
          <div className="bg-gradient-to-br from-white to-blue-50 border-2 border-blue-300 rounded-lg p-1 shadow-lg">
            {['all', 'commercial', 'residential', 'mixed-use'].map((type) => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={`px-6 py-3 rounded-lg capitalize font-medium transition-colors ${
                  filterType === type
                    ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-md'
                    : 'text-gray-700 hover:text-blue-800 hover:bg-blue-100'
                }`}
              >
                {type === 'mixed-use' ? 'Mixed Use' : type}
              </button>
            ))}
          </div>
        </div>

        {/* Property Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredProperties.map((property) => (
            <div
              key={property.id}
              className="bg-gradient-to-br from-white to-blue-50 border-2 border-blue-300 rounded-xl overflow-hidden hover:border-blue-500 hover:shadow-xl transition-all duration-300 cursor-pointer transform hover:scale-105"
              onClick={() => setSelectedProperty(property)}
            >
              {/* Property Image Placeholder */}
              <div className="h-48 bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center">
                <span className="text-4xl">🏢</span>
              </div>
              
              <div className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-bold text-blue-800">{property.name}</h3>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    property.status === 'Available' ? 'bg-blue-500' :
                    property.status === 'Funding' ? 'bg-yellow-500 text-black' :
                    'bg-green-500'
                  }`}>
                    {property.status}
                  </span>
                </div>
                
                <div className="text-gray-600 text-sm mb-4">
                  {property.type} • {property.location}
                </div>
                
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Value:</span>
                    <span className="font-semibold text-blue-800">{property.price}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Token Price:</span>
                    <span className="font-semibold text-blue-800">{property.tokenPrice}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Expected APY:</span>
                    <span className="font-semibold text-blue-600">{property.apy}</span>
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-700">Funding Progress</span>
                      <span>{Math.round((property.soldTokens / property.totalTokens) * 100)}%</span>
                    </div>
                    <div className="w-full bg-gray-300 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${(property.soldTokens / property.totalTokens) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
                
                <button className="w-full mt-4 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg font-semibold transition-all duration-200 transform hover:scale-105 shadow-md">
                  View Details
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* How It Works */}
        <div className="mt-16">
          <h2 className="text-3xl font-bold text-center mb-12 text-blue-800">How Real Estate Tokenization Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-500 bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">1️⃣</span>
              </div>
              <h3 className="text-lg font-semibold mb-2 text-blue-800">Property Selection</h3>
              <p className="text-gray-600">Professional team identifies high-quality real estate opportunities</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-500 bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">2️⃣</span>
              </div>
              <h3 className="text-lg font-semibold mb-2 text-blue-800">Tokenization</h3>
              <p className="text-gray-600">Property is tokenized into tradeable digital shares on blockchain</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-500 bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">3️⃣</span>
              </div>
              <h3 className="text-lg font-semibold mb-2 text-blue-800">Investment</h3>
              <p className="text-gray-600">Investors purchase tokens representing fractional ownership</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-500 bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">4️⃣</span>
              </div>
              <h3 className="text-lg font-semibold mb-2 text-blue-800">Returns</h3>
              <p className="text-gray-600">Receive rental income and potential appreciation automatically</p>
            </div>
          </div>
        </div>
      </div>

      {/* Property Detail Modal */}
      {selectedProperty && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-gradient-to-br from-white to-blue-50 border-2 border-blue-300 rounded-xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-blue-800">{selectedProperty.name}</h2>
              <button
                onClick={() => setSelectedProperty(null)}
                className="text-gray-500 hover:text-blue-800 text-2xl font-bold"
              >
                ×
              </button>
            </div>
            
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-gray-600">Type:</span>
                  <div className="font-semibold text-blue-800">{selectedProperty.type}</div>
                </div>
                <div>
                  <span className="text-gray-600">Location:</span>
                  <div className="font-semibold text-blue-800">{selectedProperty.location}</div>
                </div>
                <div>
                  <span className="text-gray-600">Total Value:</span>
                  <div className="font-semibold text-blue-800">{selectedProperty.price}</div>
                </div>
                <div>
                  <span className="text-gray-600">Expected APY:</span>
                  <div className="font-semibold text-blue-600">{selectedProperty.apy}</div>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Number of Tokens to Purchase
                  </label>
                  <input
                    type="number"
                    placeholder="Enter amount"
                    className="w-full px-4 py-3 bg-white border-2 border-blue-300 rounded-lg text-blue-800 placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                  />
                  <div className="text-sm text-gray-600 mt-1">
                    Token Price: {selectedProperty.tokenPrice} each
                  </div>
                </div>
                
                <button className="w-full px-6 py-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold rounded-lg transition-all duration-200 transform hover:scale-105 shadow-lg">
                  Purchase Tokens
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      </div>
  );
};

export default RealEstatePage;