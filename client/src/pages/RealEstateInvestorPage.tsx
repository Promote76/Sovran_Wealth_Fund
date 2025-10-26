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

interface FractionalProperty {
  id: number;
  dealId: string;
  totalShares: number;
  sharePrice: string;
  propertyValue: string;
  sharesSold: number;
  sharesAvailable: number;
  fundingProgress: number;
  minInvestment: string;
  maxOwnershipPercent: string;
  lockupMonths: number;
  monthlyRent: string;
  monthlyExpenses: string;
  netMonthlyIncome: string;
  annualYield: number;
  reserveFundPercent: string;
  status: string;
  fundingDeadline: string | null;
  fullyFundedAt: string | null;
  createdAt: string;
  deal: {
    address: string;
    city: string;
    state: string;
    beds: number;
    baths: number;
    squareFeet: number;
    propertyType: string;
    yearBuilt: number;
    condition: string;
    media: any[];
    geocode: any;
  };
}

interface FractionalInvestment {
  shareId: number;
  propertyId: number;
  sharesOwned: number;
  ownershipPercent: number;
  totalInvested: string;
  tier: string;
  tierBonus: number;
  totalRevenueEarned: string;
  monthlyRevenueEstimate: number;
  lockupEndsAt: string;
  property: {
    address: string;
    city: string;
    state: string;
    beds: number;
    baths: number;
    squareFeet: number;
    totalShares: number;
    sharePrice: string;
    propertyValue: string;
    sharesSold: number;
    sharesAvailable: number;
    monthlyRent: string;
    netMonthlyIncome: string;
    status: string;
    media: any[];
  };
}

const TIER_INFO = {
  retail: { min: 500, max: 10000, bonus: 0, color: 'blue', label: 'Retail' },
  accredited: { min: 10000, max: 100000, bonus: 2, color: 'purple', label: 'Accredited' },
  premium: { min: 100000, max: 500000, bonus: 5, color: 'orange', label: 'Premium' },
  institutional: { min: 500000, max: Infinity, bonus: 8, color: 'red', label: 'Institutional' }
};

export default function RealEstateInvestorPage() {
  const navigate = useNavigate();
  const { isConnected, account, connectWallet, isConnecting } = useWallet();
  
  // Blockchain Properties & Portfolio
  const [properties, setProperties] = useState<Property[]>([]);
  const [portfolio, setPortfolio] = useState<Investment[]>([]);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [txStatus, setTxStatus] = useState({ loading: false, success: false, error: '', txHash: '' });
  const [stats, setStats] = useState({
    totalInvested: '0',
    totalRentalEarned: '0',
    portfolioValue: '0',
    totalPendingRental: '0',
    propertyCount: 0
  });

  // Fractional Properties & Portfolio
  const [fractionalProperties, setFractionalProperties] = useState<FractionalProperty[]>([]);
  const [fractionalPortfolio, setFractionalPortfolio] = useState<FractionalInvestment[]>([]);
  const [fractionalStats, setFractionalStats] = useState<any>(null);
  const [selectedFractional, setSelectedFractional] = useState<FractionalProperty | null>(null);
  const [investmentAmount, setInvestmentAmount] = useState('500');
  const [loading, setLoading] = useState(true);

  // Available deals
  const [availableDeals, setAvailableDeals] = useState<any[]>([]);
  const [dealsLoading, setDealsLoading] = useState(true);

  useEffect(() => {
    loadAllData();
  }, [isConnected, account]);

  const loadAllData = async () => {
    setLoading(true);
    await Promise.all([
      loadBlockchainProperties(),
      loadFractionalProperties(),
      loadAvailableDeals()
    ]);
    if (isConnected && account) {
      await Promise.all([
        loadBlockchainPortfolio(),
        loadFractionalPortfolio()
      ]);
    }
    setLoading(false);
  };

  const loadBlockchainProperties = async () => {
    try {
      const response = await fetch('/api/real-estate-investor/properties');
      const data = await response.json();
      if (data.success) {
        setProperties(data.data);
      }
    } catch (error) {
      console.error('Failed to load blockchain properties:', error);
    }
  };

  const loadFractionalProperties = async () => {
    try {
      const response = await fetch('/api/fractional/properties');
      const data = await response.json();
      if (data.success) {
        setFractionalProperties(data.properties || []);
      }
    } catch (error) {
      console.error('Failed to load fractional properties:', error);
    }
  };

  const loadBlockchainPortfolio = async () => {
    if (!account) return;
    try {
      const response = await fetch(`/api/real-estate-investor/portfolio/${account}`);
      const data = await response.json();
      if (data.success) {
        setPortfolio(data.data.investments);
        setStats(data.data.stats);
      }
    } catch (error) {
      console.error('Failed to load blockchain portfolio:', error);
    }
  };

  const loadFractionalPortfolio = async () => {
    if (!account) return;
    try {
      const response = await fetch(`/api/fractional/portfolio?walletAddress=${account}`, {
        headers: {
          'x-wallet-address': account
        }
      });
      const data = await response.json();
      if (data.success) {
        setFractionalPortfolio(data.portfolio || []);
        setFractionalStats(data.totals);
      }
    } catch (error) {
      console.error('Failed to load fractional portfolio:', error);
    }
  };

  const loadAvailableDeals = async () => {
    setDealsLoading(true);
    try {
      const response = await fetch('/api/deals?status=published');
      const data = await response.json();
      if (data.success) {
        const sorted = data.data.sort((a: any, b: any) => {
          const roiA = a.analysis?.maoByRepair?.[1]?.roi || 0;
          const roiB = b.analysis?.maoByRepair?.[1]?.roi || 0;
          return roiB - roiA;
        });
        setAvailableDeals(sorted.slice(0, 3));
      }
    } catch (error) {
      console.error('Failed to load deals:', error);
    } finally {
      setDealsLoading(false);
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
        setTimeout(() => loadBlockchainPortfolio(), 2000);
      } else {
        setTxStatus({ loading: false, success: false, error: data.error, txHash: '' });
      }
    } catch (error: any) {
      setTxStatus({ loading: false, success: false, error: error.message, txHash: '' });
    }
  };

  const calculateTier = (amount: number) => {
    if (amount >= TIER_INFO.institutional.min) return 'institutional';
    if (amount >= TIER_INFO.premium.min) return 'premium';
    if (amount >= TIER_INFO.accredited.min) return 'accredited';
    return 'retail';
  };

  const getTierInfo = (tier: string) => TIER_INFO[tier as keyof typeof TIER_INFO] || TIER_INFO.retail;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(value);
  };

  const totalPortfolioValue = fractionalStats 
    ? fractionalStats.totalInvested + parseFloat(stats.portfolioValue || '0') 
    : parseFloat(stats.portfolioValue || '0');

  const totalRevenue = fractionalStats
    ? fractionalStats.totalRevenueEarned + parseFloat(stats.totalRentalEarned || '0') * 600
    : parseFloat(stats.totalRentalEarned || '0') * 600;

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
                <div className="text-3xl font-bold text-blue-600">
                  {properties.length + fractionalProperties.length}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {fractionalProperties.length} fractional
                </div>
              </div>
              <div className="bg-green-50 p-4 rounded-lg border-2 border-green-200">
                <div className="text-sm text-gray-600 mb-1">Total Investment</div>
                <div className="text-3xl font-bold text-green-600">
                  {formatCurrency(
                    fractionalProperties.reduce((sum, p) => sum + (p.shares_sold * p.share_price), 0) +
                    (properties.reduce((sum, p) => sum + parseFloat(p.currentRaise), 0) * 600)
                  )}
                </div>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg border-2 border-purple-200">
                <div className="text-sm text-gray-600 mb-1">Min Investment</div>
                <div className="text-3xl font-bold text-purple-600">$500</div>
                <div className="text-xs text-gray-500">Fractional shares</div>
              </div>
              <div className="bg-orange-50 p-4 rounded-lg border-2 border-orange-200">
                <div className="text-sm text-gray-600 mb-1">Investor Tiers</div>
                <div className="text-3xl font-bold text-orange-600">4</div>
                <div className="text-xs text-gray-500">Up to 8% bonus</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Combined Portfolio Dashboard */}
        {isConnected && (fractionalPortfolio.length > 0 || portfolio.length > 0) && (
          <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-white">
            <CardContent className="p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <span className="text-3xl">💼</span>
                Your Investment Portfolio
              </h2>
              
              {/* Portfolio Stats */}
              <div className="grid md:grid-cols-4 gap-4 mb-6">
                <div className="bg-white p-4 rounded-lg border-2 border-blue-200">
                  <div className="text-sm text-gray-600 mb-1">Total Invested</div>
                  <div className="text-2xl font-bold text-blue-600">
                    {formatCurrency(totalPortfolioValue)}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {fractionalPortfolio.length + portfolio.length} properties
                  </div>
                </div>
                <div className="bg-white p-4 rounded-lg border-2 border-green-200">
                  <div className="text-sm text-gray-600 mb-1">Current Value</div>
                  <div className="text-2xl font-bold text-green-600">
                    {formatCurrency(totalPortfolioValue * 1.05)}
                  </div>
                  <div className="text-xs text-gray-500">+5% appreciation</div>
                </div>
                <div className="bg-white p-4 rounded-lg border-2 border-purple-200">
                  <div className="text-sm text-gray-600 mb-1">Revenue Earned</div>
                  <div className="text-2xl font-bold text-purple-600">
                    {formatCurrency(totalRevenue)}
                  </div>
                  <div className="text-xs text-gray-500">All-time</div>
                </div>
                <div className="bg-white p-4 rounded-lg border-2 border-orange-200">
                  <div className="text-sm text-gray-600 mb-1">Your Tier</div>
                  <div className="text-2xl font-bold text-orange-600">
                    {fractionalStats?.currentTier ? getTierInfo(fractionalStats.currentTier).label : 'Retail'}
                  </div>
                  <div className="text-xs text-gray-500">
                    +{fractionalStats?.currentTier ? getTierInfo(fractionalStats.currentTier).bonus : 0}% revenue bonus
                  </div>
                </div>
              </div>

              {/* Fractional Investments */}
              {fractionalPortfolio.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-bold text-gray-800 mb-3">🏢 Fractional Holdings</h3>
                  <div className="space-y-3">
                    {fractionalPortfolio.map((inv) => {
                      const tierInfo = getTierInfo(inv.tier);
                      return (
                        <div key={inv.property_id} className="bg-white p-4 rounded-lg border border-gray-200">
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex-1">
                              <h4 className="font-semibold text-gray-900">
                                {inv.property.metadata?.address || `Property #${inv.property_id}`}
                              </h4>
                              <div className="flex items-center gap-2 mt-1">
                                <span className={`text-xs px-2 py-1 rounded-full bg-${tierInfo.color}-100 text-${tierInfo.color}-800 font-semibold`}>
                                  {tierInfo.label} +{tierInfo.bonus}%
                                </span>
                                <span className="text-sm text-gray-600">
                                  {(inv.sharesOwned || 0).toLocaleString()} shares ({(inv.ownershipPercent || 0).toFixed(2)}%)
                                </span>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-sm text-gray-600">Invested</div>
                              <div className="font-bold text-green-600">{formatCurrency(inv.total_invested)}</div>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-3 gap-3 mt-3 text-sm">
                            <div>
                              <div className="text-gray-600">Monthly Income</div>
                              <div className="font-semibold">
                                {formatCurrency(inv.property.net_monthly_income * (inv.ownership_percent / 100))}
                              </div>
                            </div>
                            <div>
                              <div className="text-gray-600">Revenue Earned</div>
                              <div className="font-semibold text-green-600">{formatCurrency(inv.revenue_earned || 0)}</div>
                            </div>
                            <div>
                              <div className="text-gray-600">Property Value</div>
                              <div className="font-semibold">{formatCurrency(inv.property.property_value)}</div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Blockchain Investments */}
              {portfolio.length > 0 && (
                <div>
                  <h3 className="text-lg font-bold text-gray-800 mb-3">⛓️ Blockchain Holdings</h3>
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
                                {inv.sharesOwned} shares ({((inv.sharesOwned / property.totalShares) * 100).toFixed(2)}%)
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
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Fractional Properties */}
        {fractionalProperties.length > 0 && (
          <Card className="border-2 border-purple-200">
            <CardContent className="p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <span className="text-3xl">🏢</span>
                Fractional Real Estate
              </h2>
              <p className="text-gray-600 mb-6">
                Invest starting from $500 • 4-tier system with up to 8% revenue bonus
              </p>

              <div className="grid md:grid-cols-2 gap-6">
                {fractionalProperties.map((property) => {
                  const fundingPercent = (property.sharesSold / property.totalShares) * 100;
                  const minTierInfo = getTierInfo('retail');
                  
                  return (
                    <div key={property.id} className="bg-white border-2 border-purple-200 rounded-lg p-5 hover:shadow-lg transition-shadow">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="text-xl font-bold text-gray-900">
                            {property.deal?.address || `Property #${property.id}`}
                          </h3>
                          <div className="text-sm text-gray-600 mt-1">
                            {property.deal?.city}, {property.deal?.state}
                          </div>
                        </div>
                        <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                          property.status === 'active' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {property.status === 'active' ? '🟢 Active' : '⚪ Inactive'}
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="mb-4">
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-600">Funding Progress</span>
                          <span className="font-semibold text-purple-600">
                            {fundingPercent.toFixed(1)}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3">
                          <div
                            className="bg-gradient-to-r from-purple-500 to-purple-600 h-3 rounded-full transition-all"
                            style={{ width: `${Math.min(fundingPercent, 100)}%` }}
                          ></div>
                        </div>
                        <div className="flex justify-between text-xs text-gray-500 mt-1">
                          <span>{(property.sharesSold || 0).toLocaleString()} / {(property.totalShares || 0).toLocaleString()} shares</span>
                          <span>{(property.sharesAvailable || 0).toLocaleString()} available</span>
                        </div>
                      </div>

                      {/* Property Details */}
                      <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
                        <div className="bg-blue-50 p-3 rounded">
                          <div className="text-gray-600">Property Value</div>
                          <div className="font-bold text-blue-600">{formatCurrency(parseFloat(property.propertyValue))}</div>
                        </div>
                        <div className="bg-green-50 p-3 rounded">
                          <div className="text-gray-600">Share Price</div>
                          <div className="font-bold text-green-600">{formatCurrency(parseFloat(property.sharePrice))}</div>
                        </div>
                        <div className="bg-purple-50 p-3 rounded">
                          <div className="text-gray-600">Monthly Income</div>
                          <div className="font-bold text-purple-600">{formatCurrency(parseFloat(property.netMonthlyIncome))}</div>
                        </div>
                        <div className="bg-orange-50 p-3 rounded">
                          <div className="text-gray-600">Annual Yield</div>
                          <div className="font-bold text-orange-600">
                            {property.annualYield.toFixed(1)}%
                          </div>
                        </div>
                      </div>

                      {/* Tier Badges */}
                      <div className="mb-4">
                        <div className="text-xs text-gray-600 mb-2">Investment Tiers:</div>
                        <div className="flex flex-wrap gap-2">
                          {Object.entries(TIER_INFO).map(([key, tier]) => (
                            <span
                              key={key}
                              className={`text-xs px-2 py-1 rounded-full bg-${tier.color}-100 text-${tier.color}-800`}
                            >
                              {tier.label} +{tier.bonus}%
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Investment Button */}
                      {property.status === 'active' && property.sharesAvailable > 0 && (
                        <Button
                          onClick={() => isConnected ? setSelectedFractional(property) : connectWallet()}
                          className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold"
                        >
                          {isConnected ? '🏢 Invest Now' : '🔗 Connect Wallet to Invest'}
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Blockchain Properties */}
        {properties.length > 0 && (
          <Card className="border-2 border-green-200">
            <CardContent className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                  <span className="text-3xl">⛓️</span>
                  Blockchain Properties
                </h2>
                <div className="flex gap-2">
                  <Button
                    onClick={() => navigate('/investor-register')}
                    className="bg-blue-500 hover:bg-blue-600 text-white font-semibold px-3 py-2 text-sm"
                  >
                    🚀 Register
                  </Button>
                  <Button
                    onClick={() => navigate('/real-estate-investor/submit')}
                    className="bg-yellow-500 hover:bg-yellow-600 text-gray-900 font-semibold px-3 py-2 text-sm"
                  >
                    📤 Submit
                  </Button>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                {properties.map((property) => (
                  <div key={property.id} className="bg-white border-2 border-gray-200 rounded-lg p-5 hover:shadow-lg transition-shadow">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">{property.propertyAddress}</h3>
                        <div className="text-sm text-gray-600 mt-1">
                          Value: <span className="font-semibold">${parseFloat(property.currentValue).toLocaleString()}</span>
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
                    </div>

                    {/* Property Details */}
                    <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
                      <div className="bg-blue-50 p-3 rounded">
                        <div className="text-gray-600">Monthly Rent</div>
                        <div className="font-bold text-blue-600">${property.monthlyRent}</div>
                      </div>
                      <div className="bg-green-50 p-3 rounded">
                        <div className="text-gray-600">Price/Share</div>
                        <div className="font-bold text-green-600">{property.pricePerShare} BNB</div>
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
              </div>
            </CardContent>
          </Card>
        )}

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

        {/* How It Works */}
        <Card>
          <CardContent className="p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">💡 How It Works</h2>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="text-blue-600 font-bold text-lg mb-2">1️⃣ Browse Properties</div>
                <div className="text-gray-700 text-sm">
                  View available real estate investments. Each property is divided into 10,000 shares for fractional ownership.
                </div>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="text-green-600 font-bold text-lg mb-2">2️⃣ Invest & Own</div>
                <div className="text-gray-700 text-sm">
                  Buy shares starting from $500. Your tier determines revenue bonuses (0-8%).
                </div>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <div className="text-purple-600 font-bold text-lg mb-2">3️⃣ Earn Monthly</div>
                <div className="text-gray-700 text-sm">
                  Receive monthly rental income + property appreciation + tier bonuses.
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Investment Modals */}
      {selectedProperty && (
        <PropertyInvestmentModal
          property={selectedProperty}
          onClose={() => setSelectedProperty(null)}
          onSuccess={() => {
            loadBlockchainProperties();
            loadBlockchainPortfolio();
          }}
        />
      )}

      {selectedFractional && (
        <FractionalInvestmentModal
          property={selectedFractional}
          walletAddress={account}
          onClose={() => setSelectedFractional(null)}
          onSuccess={() => {
            loadFractionalProperties();
            loadFractionalPortfolio();
          }}
        />
      )}
    </div>
  );
}

// Fractional Investment Modal Component
function FractionalInvestmentModal({ property, walletAddress, onClose, onSuccess }: any) {
  const [amount, setAmount] = useState('500');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const shares = Math.floor(parseFloat(amount) / property.share_price);
  const tier = parseFloat(amount) >= 500000 ? 'institutional' 
    : parseFloat(amount) >= 100000 ? 'premium'
    : parseFloat(amount) >= 10000 ? 'accredited' 
    : 'retail';
  const tierInfo = TIER_INFO[tier as keyof typeof TIER_INFO];
  const monthlyIncome = (shares / property.total_shares) * property.net_monthly_income;
  const annualIncome = monthlyIncome * 12;
  const tierBonus = annualIncome * (tierInfo.bonus / 100);

  const handleInvest = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/fractional/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          propertyId: property.id,
          investmentAmount: parseFloat(amount),
          walletAddress,
          paymentMethod: 'crypto'
        })
      });

      const data = await response.json();

      if (data.success) {
        onSuccess();
        onClose();
      } else {
        setError(data.error || 'Investment failed');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6">
        <h3 className="text-2xl font-bold text-gray-900 mb-4">
          Invest in Fractional Real Estate
        </h3>
        
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-6">
          <h4 className="font-semibold text-gray-900 mb-2">
            {property.metadata?.address || `Property #${property.id}`}
          </h4>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <div className="text-gray-600">Property Value</div>
              <div className="font-semibold">{formatCurrency(property.property_value)}</div>
            </div>
            <div>
              <div className="text-gray-600">Share Price</div>
              <div className="font-semibold">{formatCurrency(property.share_price)}</div>
            </div>
          </div>
        </div>

        {/* Investment Amount */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Investment Amount (USD)
          </label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            min="500"
            step="100"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
          />
        </div>

        {/* Investment Details */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6 space-y-3">
          <div className="flex justify-between">
            <span className="text-gray-700">Shares Purchased:</span>
            <span className="font-semibold">{shares.toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-700">Ownership:</span>
            <span className="font-semibold">{((shares / property.total_shares) * 100).toFixed(2)}%</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-700">Your Tier:</span>
            <span className={`px-3 py-1 rounded-full text-sm font-semibold bg-${tierInfo.color}-100 text-${tierInfo.color}-800`}>
              {tierInfo.label} +{tierInfo.bonus}%
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-700">Monthly Income:</span>
            <span className="font-semibold text-green-600">{formatCurrency(monthlyIncome)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-700">Tier Bonus (Annual):</span>
            <span className="font-semibold text-orange-600">+{formatCurrency(tierBonus)}</span>
          </div>
          <div className="border-t pt-3 flex justify-between">
            <span className="text-gray-900 font-medium">Annual Income:</span>
            <span className="font-bold text-green-600">{formatCurrency(annualIncome + tierBonus)}</span>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
            {error}
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleInvest}
            disabled={loading || shares === 0}
            className="flex-1 px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition-colors disabled:opacity-50"
          >
            {loading ? '🔄 Processing...' : `💳 Invest ${formatCurrency(parseFloat(amount))}`}
          </button>
        </div>
      </div>
    </div>
  );
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0
  }).format(value);
}
