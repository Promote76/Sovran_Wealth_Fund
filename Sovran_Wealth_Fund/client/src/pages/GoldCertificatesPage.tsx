import React, { useState, useEffect } from 'react';

interface GoldCertificate {
  id: number;
  serialNumber: string;
  goldWeight: string;
  purity: string;
  currentValue: string;
  purchaseDate: string;
  certificateType: 'Digital' | 'Physical';
  vaultLocation: string;
  status: 'Active' | 'Redeemed' | 'Transferred';
}

const GoldCertificatesPage: React.FC = () => {
  const [certificates, setCertificates] = useState<GoldCertificate[]>([]);
  const [selectedCertificate, setSelectedCertificate] = useState<GoldCertificate | null>(null);
  const [goldPrice, setGoldPrice] = useState('2,187.45');
  const [totalValue, setTotalValue] = useState('0');

  useEffect(() => {
    // Mock certificate data
    const mockCertificates: GoldCertificate[] = [
      {
        id: 1,
        serialNumber: 'KIN-AU-001234',
        goldWeight: '1.0 oz',
        purity: '99.99%',
        currentValue: '$2,187.45',
        purchaseDate: '2024-01-15',
        certificateType: 'Digital',
        vaultLocation: 'Singapore Vault A',
        status: 'Active'
      },
      {
        id: 2,
        serialNumber: 'KIN-AU-005678',
        goldWeight: '0.5 oz',
        purity: '99.99%',
        currentValue: '$1,093.73',
        purchaseDate: '2024-02-20',
        certificateType: 'Digital',
        vaultLocation: 'London Vault B',
        status: 'Active'
      },
      {
        id: 3,
        serialNumber: 'KIN-AU-009876',
        goldWeight: '2.0 oz',
        purity: '99.99%',
        currentValue: '$4,374.90',
        purchaseDate: '2024-03-01',
        certificateType: 'Physical',
        vaultLocation: 'Zurich Vault C',
        status: 'Active'
      }
    ];
    
    setCertificates(mockCertificates);
    
    // Calculate total value
    const total = mockCertificates.reduce((sum, cert) => {
      return sum + parseFloat(cert.currentValue.replace('$', '').replace(',', ''));
    }, 0);
    setTotalValue(total.toLocaleString());
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active': return 'bg-green-500';
      case 'Redeemed': return 'bg-blue-500';
      case 'Transferred': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="bg-gradient-to-br from-white via-blue-50 to-white min-h-screen">

      {/* Hero Section */}
      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-6 text-blue-800">
            Gold <span className="text-blue-600">Certificates</span>
          </h1>
          <p className="text-xl text-gray-700 max-w-3xl mx-auto">
            Access physical gold-backed digital certificates through Kinesis integration. 
            Secure vault storage, blockchain verification, and real-time valuation powered by precious metals expertise.
          </p>
        </div>

        {/* Portfolio Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          <div className="bg-gradient-to-br from-white to-blue-50 border-2 border-blue-300 rounded-xl p-6 text-center shadow-lg">
            <div className="text-2xl font-bold text-blue-600 mb-2">${totalValue}</div>
            <div className="text-gray-700">Total Portfolio Value</div>
          </div>
          <div className="bg-gradient-to-br from-white to-blue-50 border-2 border-blue-300 rounded-xl p-6 text-center shadow-lg">
            <div className="text-2xl font-bold text-blue-600 mb-2">{certificates.length}</div>
            <div className="text-gray-700">Active Certificates</div>
          </div>
          <div className="bg-gradient-to-br from-white to-blue-50 border-2 border-blue-300 rounded-xl p-6 text-center shadow-lg">
            <div className="text-2xl font-bold text-blue-600 mb-2">3.5 oz</div>
            <div className="text-gray-700">Total Gold Holdings</div>
          </div>
          <div className="bg-gradient-to-br from-white to-blue-50 border-2 border-blue-300 rounded-xl p-6 text-center shadow-lg">
            <div className="text-2xl font-bold text-blue-600 mb-2">+12.3%</div>
            <div className="text-gray-700">30-Day Performance</div>
          </div>
        </div>

        {/* Certificates Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {certificates.map((certificate) => (
            <div
              key={certificate.id}
              className="bg-gradient-to-br from-white to-blue-50 border-2 border-blue-300 rounded-xl p-6 cursor-pointer hover:border-blue-400 hover:shadow-xl transition-all duration-200 shadow-lg"
              onClick={() => setSelectedCertificate(certificate)}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-blue-800">Certificate #{certificate.serialNumber}</h3>
                <span className={`px-2 py-1 rounded text-xs font-medium text-white ${getStatusColor(certificate.status)}`}>
                  {certificate.status}
                </span>
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Weight:</span>
                  <span className="font-semibold text-blue-700">{certificate.goldWeight}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Purity:</span>
                  <span className="font-semibold text-blue-700">{certificate.purity}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Current Value:</span>
                  <span className="font-semibold text-blue-600">{certificate.currentValue}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Type:</span>
                  <span className="font-semibold text-blue-700">{certificate.certificateType}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Vault:</span>
                  <span className="font-semibold text-blue-700 text-xs">{certificate.vaultLocation}</span>
                </div>
              </div>
              
              <button className="w-full mt-4 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg shadow-lg transition-all duration-200">
                View Certificate
              </button>
            </div>
          ))}
        </div>

        {/* Purchase New Certificate */}
        <div className="bg-gradient-to-br from-white to-blue-50 border-2 border-blue-300 rounded-xl p-8 mb-12 shadow-lg">
          <h2 className="text-2xl font-bold mb-6 text-center text-blue-800">Purchase Gold Certificate</h2>
          
          <div className="max-w-2xl mx-auto space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Gold Weight (oz)
                </label>
                <input
                  type="number"
                  step="0.1"
                  placeholder="1.0"
                  className="w-full px-4 py-3 bg-white border-2 border-blue-300 rounded-lg text-gray-800 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Certificate Type
                </label>
                <select className="w-full px-4 py-3 bg-white border-2 border-blue-300 rounded-lg text-gray-800 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200">
                  <option value="digital">Digital Certificate</option>
                  <option value="physical">Physical Certificate</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Preferred Vault Location
              </label>
              <select className="w-full px-4 py-3 bg-white border-2 border-blue-300 rounded-lg text-gray-800 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200">
                <option value="singapore">Singapore Vault A</option>
                <option value="london">London Vault B</option>
                <option value="zurich">Zurich Vault C</option>
                <option value="toronto">Toronto Vault D</option>
              </select>
            </div>

            <div className="bg-blue-100 border-2 border-blue-200 rounded-lg p-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-600">Estimated Cost:</span>
                <span className="font-bold text-blue-600">$2,187.45</span>
              </div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-600">Storage Fee (Annual):</span>
                <span className="font-semibold text-blue-700">$25.00</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Insurance:</span>
                <span className="font-semibold text-blue-700">Included</span>
              </div>
            </div>

            <button className="w-full px-6 py-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold rounded-lg shadow-lg transition-all duration-200">
              Purchase Gold Certificate
            </button>
          </div>
        </div>

        {/* Kinesis Integration Features */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-100 border-2 border-blue-300 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🏦</span>
            </div>
            <h3 className="text-lg font-semibold mb-2 text-blue-800">Secure Vaults</h3>
            <p className="text-gray-600">Professional-grade storage facilities worldwide</p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-100 border-2 border-blue-300 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🔗</span>
            </div>
            <h3 className="text-lg font-semibold mb-2 text-blue-800">Blockchain Verified</h3>
            <p className="text-gray-600">Every certificate verified on the blockchain</p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-100 border-2 border-blue-300 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">📈</span>
            </div>
            <h3 className="text-lg font-semibold mb-2 text-blue-800">Real-time Pricing</h3>
            <p className="text-gray-600">Live gold market prices and valuations</p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-100 border-2 border-blue-300 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🔄</span>
            </div>
            <h3 className="text-lg font-semibold mb-2 text-blue-800">Easy Redemption</h3>
            <p className="text-gray-600">Convert digital certificates to physical gold</p>
          </div>
        </div>
      </div>

      {/* Certificate Detail Modal */}
      {selectedCertificate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-gradient-to-br from-white to-blue-50 border-2 border-blue-300 rounded-xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-blue-800">Certificate Details</h2>
              <button
                onClick={() => setSelectedCertificate(null)}
                className="text-gray-600 hover:text-blue-700 text-2xl transition-colors"
              >
                ×
              </button>
            </div>
            
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-gray-600">Serial Number:</span>
                  <div className="font-semibold text-blue-700">{selectedCertificate.serialNumber}</div>
                </div>
                <div>
                  <span className="text-gray-600">Status:</span>
                  <div className={`font-semibold ${
                    selectedCertificate.status === 'Active' ? 'text-blue-600' : 'text-gray-600'
                  }`}>
                    {selectedCertificate.status}
                  </div>
                </div>
                <div>
                  <span className="text-gray-600">Gold Weight:</span>
                  <div className="font-semibold text-blue-700">{selectedCertificate.goldWeight}</div>
                </div>
                <div>
                  <span className="text-gray-600">Purity:</span>
                  <div className="font-semibold text-blue-700">{selectedCertificate.purity}</div>
                </div>
                <div>
                  <span className="text-gray-600">Current Value:</span>
                  <div className="font-semibold text-blue-600">{selectedCertificate.currentValue}</div>
                </div>
                <div>
                  <span className="text-gray-600">Purchase Date:</span>
                  <div className="font-semibold text-blue-700">{selectedCertificate.purchaseDate}</div>
                </div>
                <div>
                  <span className="text-gray-600">Type:</span>
                  <div className="font-semibold text-blue-700">{selectedCertificate.certificateType}</div>
                </div>
                <div>
                  <span className="text-gray-600">Vault Location:</span>
                  <div className="font-semibold text-blue-700">{selectedCertificate.vaultLocation}</div>
                </div>
              </div>
              
              <div className="flex space-x-4">
                <button className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg shadow-lg transition-all duration-200">
                  Download Certificate
                </button>
                <button className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-lg shadow-lg transition-all duration-200">
                  Transfer Ownership
                </button>
                <button className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-400 to-blue-500 hover:from-blue-500 hover:to-blue-600 text-white rounded-lg shadow-lg transition-all duration-200">
                  Redeem Gold
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      </div>
  );
};

export default GoldCertificatesPage;