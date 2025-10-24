import React, { useState, useEffect } from 'react';
import { useWallet } from '../contexts/WalletContext';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';

interface Property {
  id: number;
  propertyAddress: string;
  currentValue: string;
  targetRaise: string;
  currentRaise: string;
  isFunded: boolean;
  isActive: boolean;
  monthlyRent: string;
  totalShares: number;
  sharesIssued: number;
  pricePerShare: string;
}

interface Investment {
  propertyId: number;
  sharesOwned: number;
  investedAmount: string;
  currentValue: string;
  pendingRental: string;
  appreciation: string;
}

export default function RealEstateInvestorPage() {
  const { isConnected, account, connectWallet, isConnecting } = useWallet();
  const [properties, setProperties] = useState<Property[]>([]);
  const [portfolio, setPortfolio] = useState<Investment[]>([]);
  const [selectedProperty, setSelectedProperty] = useState<number | null>(null);
  const [investmentAmount, setInvestmentAmount] = useState('');
  const [loading, setLoading] = useState(true);
  const [txStatus, setTxStatus] = useState({ loading: false, success: false, error: '', txHash: '' });

  const [stats, setStats] = useState({
    totalInvested: '0',
    totalRentalEarned: '0',
    portfolioValue: '0',
    totalPendingRental: '0',
    propertyCount: 0
  });

  useEffect(() => {
    loadProperties();
    if (isConnected && account) {
      loadPortfolio();
    }
  }, [isConnected, account]);

  const loadProperties = async () => {
    try {
      const response = await fetch('/api/real-estate-investor/properties');
      const data = await response.json();
      if (data.success) {
        setProperties(data.data);
      }
    } catch (error) {
      console.error('Failed to load properties:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadPortfolio = async () => {
    if (!account) return;
    
    try {
      const response = await fetch(`/api/real-estate-investor/portfolio/${account}`);
      const data = await response.json();
      if (data.success) {
        setPortfolio(data.data.investments);
        setStats(data.data.stats);
      }
    } catch (error) {
      console.error('Failed to load portfolio:', error);
    }
  };

  const handleInvest = async () => {
    if (!selectedProperty || !investmentAmount) return;
    
    setTxStatus({ loading: true, success: false, error: '', txHash: '' });
    
    try {
      // Build transaction
      const response = await fetch('/api/real-estate-investor/tx/invest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walletAddress: account,
          propertyId: selectedProperty,
          amount: investmentAmount
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setTxStatus({ loading: false, success: true, error: '', txHash: data.data.txHash });
        setTimeout(() => {
          loadProperties();
          loadPortfolio();
          setSelectedProperty(null);
          setInvestmentAmount('');
        }, 2000);
      } else {
        setTxStatus({ loading: false, success: false, error: data.error, txHash: '' });
      }
    } catch (error: any) {
      setTxStatus({ loading: false, success: false, error: error.message, txHash: '' });
    }
  };

  const handleClaimRental = async (propertyId?: number) => {
    setTxStatus({ loading: true, success: false, error: '', txHash: '' });
    
    try {
      const response = await fetch('/api/real-estate-investor/tx/claim-rental', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walletAddress: account,
          propertyId: propertyId || 'all'
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setTxStatus({ loading: false, success: true, error: '', txHash: data.data.txHash });
        setTimeout(() => loadPortfolio(), 2000);
      } else {
        setTxStatus({ loading: false, success: false, error: data.error, txHash: '' });
      }
    } catch (error: any) {
      setTxStatus({ loading: false, success: false, error: error.message, txHash: '' });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-white p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-green-700 rounded-xl shadow-lg p-8 text-white">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-4xl font-bold mb-2">🏢 Real Estate Investor</h1>
              <p className="text-green-100 text-lg">
                Invest in fractional real estate - Earn from rent, appreciation & exits
              </p>
            </div>
            <div className="flex flex-col items-end space-y-2">
              {isConnected ? (
                <div className="bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2 border border-white/20">
                  <div className="text-xs text-green-100 mb-1">Connected</div>
                  <div className="font-mono text-sm font-semibold">
                    {account?.slice(0, 6)}...{account?.slice(-4)}
                  </div>
                </div>
              ) : (
                <Button 
                  onClick={connectWallet}
                  disabled={isConnecting}
                  className="bg-white text-green-600 hover:bg-green-50 font-semibold shadow-lg"
                >
                  {isConnecting ? '🔄 Connecting...' : '🔗 Connect to Invest'}
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Platform Stats */}
        <Card className="border-2 border-green-200">
          <CardContent className="p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">📊 Platform Overview</h2>
            <div className="grid md:grid-cols-4 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg border-2 border-blue-200">
                <div className="text-sm text-gray-600 mb-1">Available Properties</div>
                <div className="text-3xl font-bold text-blue-600">{properties.length}</div>
              </div>
              <div className="bg-green-50 p-4 rounded-lg border-2 border-green-200">
                <div className="text-sm text-gray-600 mb-1">Total Investment</div>
                <div className="text-3xl font-bold text-green-600">
                  ${(properties.reduce((sum, p) => sum + parseFloat(p.currentRaise), 0) * 600).toFixed(0)}
                </div>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg border-2 border-purple-200">
                <div className="text-sm text-gray-600 mb-1">Min Investment</div>
                <div className="text-3xl font-bold text-purple-600">0.05 BNB</div>
                <div className="text-xs text-gray-500">~$30 USD</div>
              </div>
              <div className="bg-orange-50 p-4 rounded-lg border-2 border-orange-200">
                <div className="text-sm text-gray-600 mb-1">Platform Fee</div>
                <div className="text-3xl font-bold text-orange-600">2.5%</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Your Portfolio - Only for connected wallets */}
        {isConnected && portfolio.length > 0 && (
          <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-white">
            <CardContent className="p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <span className="text-3xl">💼</span>
                Your Portfolio
              </h2>
              
              {/* Portfolio Stats */}
              <div className="grid md:grid-cols-4 gap-4 mb-6">
                <div className="bg-white p-4 rounded-lg border-2 border-blue-200">
                  <div className="text-sm text-gray-600 mb-1">Total Invested</div>
                  <div className="text-2xl font-bold text-blue-600">
                    {parseFloat(stats.totalInvested).toFixed(4)} BNB
                  </div>
                  <div className="text-xs text-gray-500">≈ ${(parseFloat(stats.totalInvested) * 600).toFixed(2)}</div>
                </div>
                <div className="bg-white p-4 rounded-lg border-2 border-green-200">
                  <div className="text-sm text-gray-600 mb-1">Portfolio Value</div>
                  <div className="text-2xl font-bold text-green-600">
                    ${stats.portfolioValue}
                  </div>
                  <div className="text-xs text-gray-500">{stats.propertyCount} properties</div>
                </div>
                <div className="bg-white p-4 rounded-lg border-2 border-purple-200">
                  <div className="text-sm text-gray-600 mb-1">Rental Earned</div>
                  <div className="text-2xl font-bold text-purple-600">
                    {parseFloat(stats.totalRentalEarned).toFixed(4)} BNB
                  </div>
                </div>
                <div className="bg-white p-4 rounded-lg border-2 border-orange-200">
                  <div className="text-sm text-gray-600 mb-1">Pending Rental</div>
                  <div className="text-2xl font-bold text-orange-600">
                    {parseFloat(stats.totalPendingRental).toFixed(4)} BNB
                  </div>
                  <Button
                    onClick={() => handleClaimRental()}
                    disabled={txStatus.loading || parseFloat(stats.totalPendingRental) === 0}
                    className="mt-2 w-full bg-orange-600 hover:bg-orange-700 text-sm"
                  >
                    💰 Claim All
                  </Button>
                </div>
              </div>

              {/* Individual Investments */}
              <div className="space-y-3">
                {portfolio.map((inv) => {
                  const property = properties.find(p => p.id === inv.propertyId);
                  if (!property) return null;

                  return (
                    <div key={inv.propertyId} className="bg-white p-4 rounded-lg border border-gray-200">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-semibold text-gray-900">{property.propertyAddress}</h4>
                          <div className="text-sm text-gray-600 mt-1">
                            Owns {inv.sharesOwned} shares ({((inv.sharesOwned / property.totalShares) * 100).toFixed(2)}%)
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-gray-600">Current Value</div>
                          <div className="font-bold text-green-600">${inv.currentValue}</div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-3 mt-3 text-sm">
                        <div>
                          <div className="text-gray-600">Invested</div>
                          <div className="font-semibold">{inv.investedAmount} BNB</div>
                        </div>
                        <div>
                          <div className="text-gray-600">Appreciation</div>
                          <div className="font-semibold text-green-600">${inv.appreciation}</div>
                        </div>
                        <div>
                          <div className="text-gray-600">Pending Rental</div>
                          <div className="font-semibold text-blue-600">{inv.pendingRental} BNB</div>
                        </div>
                      </div>
                      
                      {parseFloat(inv.pendingRental) > 0 && (
                        <Button
                          onClick={() => handleClaimRental(inv.propertyId)}
                          disabled={txStatus.loading}
                          className="mt-3 w-full bg-blue-600 hover:bg-blue-700 text-sm"
                        >
                          💸 Claim Rental Income
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Available Properties */}
        <Card className="border-2 border-green-200">
          <CardContent className="p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <span className="text-3xl">🏠</span>
              Available Investment Properties
            </h2>

            {loading ? (
              <div className="text-center py-12 text-gray-500">
                <div className="animate-spin text-4xl mb-4">⏳</div>
                <div>Loading properties...</div>
              </div>
            ) : properties.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <div className="text-4xl mb-3">🏗️</div>
                <p className="text-lg font-medium">No properties available yet</p>
                <p className="text-sm">Check back soon for new investment opportunities!</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-6">
                {properties.map((property) => (
                  <div key={property.id} className="bg-white border-2 border-gray-200 rounded-lg p-5 hover:shadow-lg transition-shadow">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">{property.propertyAddress}</h3>
                        <div className="text-sm text-gray-600 mt-1">
                          Property Value: <span className="font-semibold">${parseFloat(property.currentValue).toLocaleString()}</span>
                        </div>
                      </div>
                      <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                        property.isFunded 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {property.isFunded ? '✅ Funded' : '🔓 Open'}
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mb-4">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-600">Funding Progress</span>
                        <span className="font-semibold text-green-600">
                          {((parseFloat(property.currentRaise) / parseFloat(property.targetRaise)) * 100).toFixed(1)}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div
                          className="bg-gradient-to-r from-green-500 to-green-600 h-3 rounded-full transition-all"
                          style={{ width: `${Math.min((parseFloat(property.currentRaise) / parseFloat(property.targetRaise)) * 100, 100)}%` }}
                        ></div>
                      </div>
                      <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>{parseFloat(property.currentRaise).toFixed(2)} BNB raised</span>
                        <span>Target: {parseFloat(property.targetRaise).toFixed(2)} BNB</span>
                      </div>
                    </div>

                    {/* Property Details */}
                    <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
                      <div className="bg-blue-50 p-3 rounded">
                        <div className="text-gray-600">Monthly Rent</div>
                        <div className="font-bold text-blue-600">${property.monthlyRent}</div>
                      </div>
                      <div className="bg-green-50 p-3 rounded">
                        <div className="text-gray-600">Price per Share</div>
                        <div className="font-bold text-green-600">{property.pricePerShare} BNB</div>
                      </div>
                      <div className="bg-purple-50 p-3 rounded">
                        <div className="text-gray-600">Total Shares</div>
                        <div className="font-bold text-purple-600">{property.totalShares}</div>
                      </div>
                      <div className="bg-orange-50 p-3 rounded">
                        <div className="text-gray-600">Available</div>
                        <div className="font-bold text-orange-600">{property.totalShares - property.sharesIssued}</div>
                      </div>
                    </div>

                    {/* Investment Form */}
                    {!property.isFunded && isConnected && (
                      <div className="border-t pt-4">
                        <div className="mb-3">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Investment Amount (BNB)
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            min="0.05"
                            value={selectedProperty === property.id ? investmentAmount : ''}
                            onChange={(e) => {
                              setSelectedProperty(property.id);
                              setInvestmentAmount(e.target.value);
                            }}
                            placeholder="Min: 0.05 BNB"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                          />
                          <div className="text-xs text-gray-500 mt-1">
                            {investmentAmount && parseFloat(investmentAmount) > 0 && (
                              <>You'll receive ~{Math.floor(parseFloat(investmentAmount) / parseFloat(property.pricePerShare))} shares</>
                            )}
                          </div>
                        </div>
                        <Button
                          onClick={handleInvest}
                          disabled={
                            txStatus.loading || 
                            !investmentAmount || 
                            selectedProperty !== property.id ||
                            parseFloat(investmentAmount) < 0.05
                          }
                          className="w-full bg-green-600 hover:bg-green-700"
                        >
                          {txStatus.loading ? '⏳ Processing...' : '💰 Invest Now'}
                        </Button>
                      </div>
                    )}

                    {!isConnected && (
                      <Button
                        onClick={connectWallet}
                        className="w-full bg-blue-600 hover:bg-blue-700"
                      >
                        🔗 Connect to Invest
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Transaction Status */}
        {txStatus.success && txStatus.txHash && (
          <Card>
            <CardContent className="p-6 bg-green-50">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-green-800 mb-1">✅ Transaction Successful!</div>
                  <div className="text-sm text-green-600">
                    TX: {txStatus.txHash.slice(0, 10)}...{txStatus.txHash.slice(-8)}
                  </div>
                </div>
                <a
                  href={`https://bscscan.com/tx/${txStatus.txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline text-sm"
                >
                  View on BSCScan →
                </a>
              </div>
            </CardContent>
          </Card>
        )}

        {txStatus.error && (
          <Card>
            <CardContent className="p-6 bg-red-50">
              <div className="font-medium text-red-800 mb-1">❌ Transaction Failed</div>
              <div className="text-sm text-red-600">{txStatus.error}</div>
            </CardContent>
          </Card>
        )}

        {/* Educational Section */}
        <Card>
          <CardContent className="p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">💡 How It Works</h2>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="text-blue-600 font-bold text-lg mb-2">1️⃣ Browse Properties</div>
                <div className="text-gray-700 text-sm">
                  View available real estate investments. Each property is divided into shares, allowing you to own fractional pieces.
                </div>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="text-green-600 font-bold text-lg mb-2">2️⃣ Invest & Own</div>
                <div className="text-gray-700 text-sm">
                  Buy shares starting from 0.05 BNB. Your ownership is recorded on the blockchain - completely transparent and secure.
                </div>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <div className="text-purple-600 font-bold text-lg mb-2">3️⃣ Earn Monthly</div>
                <div className="text-gray-700 text-sm">
                  Receive your share of monthly rental income + property appreciation. Claim rewards anytime directly to your wallet.
                </div>
              </div>
            </div>
            
            <div className="mt-6 bg-gradient-to-r from-yellow-50 to-orange-50 p-6 rounded-lg border-2 border-yellow-300">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">🎯 5 Ways to Earn</h3>
              <ul className="space-y-2 text-gray-700">
                <li>✅ <strong>Rental Income:</strong> Monthly distributions from tenant rent payments</li>
                <li>✅ <strong>Property Appreciation:</strong> Value gains as property prices increase</li>
                <li>✅ <strong>Exit Profits:</strong> Share in profits when properties are sold</li>
                <li>✅ <strong>Low Entry Barrier:</strong> Start with just $30 (0.05 BNB)</li>
                <li>✅ <strong>Diversification:</strong> Invest in multiple properties to spread risk</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
