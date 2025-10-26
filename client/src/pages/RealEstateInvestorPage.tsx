import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '../contexts/WalletContext';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import PropertyInvestmentModal from '../components/PropertyInvestmentModal';

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
  const navigate = useNavigate();
  const { isConnected, account, connectWallet, isConnecting } = useWallet();
  const [properties, setProperties] = useState<Property[]>([]);
  const [portfolio, setPortfolio] = useState<Investment[]>([]);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [txStatus, setTxStatus] = useState({ loading: false, success: false, error: '', txHash: '' });

  const [stats, setStats] = useState({
    totalInvested: '0',
    totalRentalEarned: '0',
    portfolioValue: '0',
    totalPendingRental: '0',
    propertyCount: 0
  });

  // Available investment deals from marketplace
  const [availableDeals, setAvailableDeals] = useState<any[]>([]);
  const [dealsLoading, setDealsLoading] = useState(true);

  useEffect(() => {
    loadProperties();
    if (isConnected && account) {
      loadPortfolio();
    }
  }, [isConnected, account]);

  // Load available investor deals
  useEffect(() => {
    const loadAvailableDeals = async () => {
      setDealsLoading(true);
      try {
        const response = await fetch('/api/deals?status=published');
        const data = await response.json();
        if (data.success) {
          // Show all published deals, sorted by ROI
          const sorted = data.data.sort((a: any, b: any) => {
            const roiA = a.analysis?.maoByRepair?.[1]?.roi || 0;
            const roiB = b.analysis?.maoByRepair?.[1]?.roi || 0;
            return roiB - roiA;
          });
          setAvailableDeals(sorted.slice(0, 3)); // Show top 3
        }
      } catch (error) {
        console.error('Failed to load deals:', error);
      } finally {
        setDealsLoading(false);
      }
    };
    
    loadAvailableDeals();
  }, []);

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
          <div className="flex justify-between items-start gap-4">
            <div className="flex-1">
              <h1 className="text-4xl font-bold mb-2">🏢 Real Estate Investor</h1>
              <p className="text-green-100 text-lg">
                Invest in fractional real estate - Earn from rent, appreciation & exits
              </p>
            </div>
            <div>
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
          <CardContent className="p-4 md:p-6">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-6">
              <h2 className="text-xl md:text-2xl font-bold text-gray-900 flex items-center gap-2">
                <span className="text-2xl md:text-3xl">🏠</span>
                Available Properties
              </h2>
              <div className="flex gap-2">
                <Button
                  onClick={() => navigate('/investor-register')}
                  className="bg-blue-500 hover:bg-blue-600 text-white font-semibold px-3 py-2 text-xs md:text-sm"
                >
                  🚀 Register
                </Button>
                <Button
                  onClick={() => navigate('/real-estate-investor/submit')}
                  className="bg-yellow-500 hover:bg-yellow-600 text-gray-900 font-semibold px-3 py-2 text-xs md:text-sm"
                >
                  📤 Submit
                </Button>
              </div>
            </div>

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

                    {/* Investment Button */}
                    {!property.isFunded && (
                      <Button
                        onClick={() => isConnected ? setSelectedProperty(property) : connectWallet()}
                        className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold"
                      >
                        {isConnected ? '🏠 Invest Now' : '🔗 Connect Wallet to Invest'}
                      </Button>
                    )}
                  </div>
                ))}

                {/* Submit Property Card - Mobile Friendly */}
                <div className="bg-gradient-to-br from-yellow-50 to-orange-50 border-2 border-yellow-300 rounded-lg p-4 md:p-5 hover:shadow-lg transition-shadow flex flex-col justify-center items-center min-h-[300px] md:min-h-[400px]">
                  <div className="text-4xl md:text-6xl mb-3 md:mb-4">🏗️</div>
                  <h3 className="text-lg md:text-2xl font-bold text-gray-900 mb-2 md:mb-3 text-center">Own a Property?</h3>
                  <p className="text-sm md:text-base text-gray-700 text-center mb-4 md:mb-6 max-w-sm px-2">
                    List your property for fractional investment and get funded faster.
                  </p>
                  <Button
                    onClick={() => navigate('/real-estate-investor/submit')}
                    className="bg-yellow-500 hover:bg-yellow-600 text-gray-900 font-bold shadow-lg border-2 border-yellow-400 px-4 py-2 md:px-6 md:py-3 text-sm md:text-base w-full md:w-auto"
                  >
                    📤 Submit Property
                  </Button>
                  <div className="mt-3 md:mt-4 text-xs md:text-sm text-gray-600 text-center">
                    Fast approval • Low fees
                  </div>
                </div>
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

            {/* Call-to-Action - Become an Investor - Mobile Friendly */}
            <div className="mt-6 bg-gradient-to-r from-blue-500 to-blue-600 p-4 md:p-8 rounded-lg text-white text-center">
              <h3 className="text-lg md:text-2xl font-bold mb-2 md:mb-3">Ready to Start Building Wealth?</h3>
              <p className="text-blue-100 mb-4 md:mb-6 text-sm md:text-lg px-2">
                Register as an investor and get access to exclusive opportunities starting at just $30!
              </p>
              <Button
                onClick={() => navigate('/investor-register')}
                className="bg-white hover:bg-blue-50 text-blue-600 font-bold shadow-xl border-2 border-blue-200 px-6 py-3 md:px-8 md:py-4 text-sm md:text-base w-full md:w-auto"
              >
                🚀 Become an Investor
              </Button>
              <div className="mt-3 md:mt-4 text-xs md:text-sm text-blue-100">
                Free registration • No fees
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Available Investment Opportunities */}
        <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-white">
          <CardContent className="p-6">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">💰 Investment Opportunities</h2>
                <p className="text-gray-600">High ROI wholesale properties ready for investment</p>
              </div>
              <Button
                onClick={() => navigate('/deals')}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                View All Deals
              </Button>
            </div>

            {dealsLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading opportunities...</p>
              </div>
            ) : availableDeals.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-6xl mb-4">📊</div>
                <p className="text-gray-600">No investment opportunities available at the moment</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-3 gap-6">
                {availableDeals.map((deal) => (
                  <div key={deal.id} className="bg-white rounded-lg shadow-md border-2 border-blue-200 overflow-hidden hover:shadow-lg transition-shadow">
                    {deal.media?.[0] ? (
                      <img
                        src={deal.media[0]}
                        alt={deal.parsed?.address}
                        className="w-full h-48 object-cover"
                      />
                    ) : (
                      <div className="w-full h-48 bg-gray-200 flex items-center justify-center text-6xl">
                        🏢
                      </div>
                    )}
                    <div className="p-4">
                      <h3 className="font-bold text-lg mb-2">{deal.parsed?.address}</h3>
                      <p className="text-gray-600 text-sm mb-3">
                        {deal.parsed?.city}, {deal.parsed?.state} {deal.parsed?.zip}
                      </p>
                      
                      <div className="grid grid-cols-2 gap-2 mb-3">
                        <div>
                          <div className="text-xs text-gray-500">Asking Price</div>
                          <div className="font-bold text-blue-600">
                            ${deal.parsed?.asking?.toLocaleString()}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500">ARV</div>
                          <div className="font-bold text-green-600">
                            ${deal.parsed?.arv?.toLocaleString()}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500">MAO</div>
                          <div className="font-bold text-purple-600">
                            ${deal.analysis?.maoByRepair?.[1]?.mao?.toLocaleString()}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500">Est. ROI</div>
                          <div className="font-bold text-orange-600">
                            {deal.analysis?.maoByRepair?.[1]?.roi?.toFixed(0)}%
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2 py-1 rounded-full">
                          💎 INVESTOR DEAL
                        </span>
                        <Button
                          onClick={() => navigate(`/deals/${deal.id}`)}
                          size="sm"
                          className="bg-blue-600 hover:bg-blue-700 text-white text-xs"
                        >
                          View Details
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Investment Modal */}
      {selectedProperty && (
        <PropertyInvestmentModal
          property={selectedProperty}
          onClose={() => setSelectedProperty(null)}
          onSuccess={() => {
            loadProperties();
            loadPortfolio();
          }}
        />
      )}
    </div>
  );
}
