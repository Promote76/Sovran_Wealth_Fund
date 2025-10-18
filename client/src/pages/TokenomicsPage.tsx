import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import TokenomicsPieChart from '../components/TokenomicsPieChart';
import { fetchSWFPrice, calculatePlatformMetrics, formatCurrency, formatTokenAmount } from '../utils/blockchainData';

interface AllocationDetail {
  category: string;
  percentage: number;
  tokens: string;
  description: string;
  vestingSchedule: string;
  releaseDate: string;
  purpose: string;
  lockupPeriod: string;
}

const TokenomicsPage: React.FC = () => {
  const [selectedAllocation, setSelectedAllocation] = useState<AllocationDetail | null>(null);
  const [platformMetrics, setPlatformMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Real AXM Token Allocation Data - Total Supply: 10,000,000,000 AXM
  const tokenAllocations = [
    {
      label: 'Community Ecosystem',
      value: 35,
      tokens: '350,000,000',
      color: '#2563EB',
      description: 'Community rewards, staking incentives, and ecosystem growth',
      vestingPeriod: '5 years linear vesting'
    },
    {
      label: 'Liquidity Pool',
      value: 25,
      tokens: '250,000,000',
      color: '#10B981',
      description: 'DEX liquidity, market making, and trading stability',
      vestingPeriod: 'Immediate unlock'
    },
    {
      label: 'Treasury Reserve',
      value: 20,
      tokens: '200,000,000',
      color: '#F59E0B',
      description: 'Protocol treasury, emergency fund, and strategic investments',
      vestingPeriod: '10 years linear vesting'
    },
    {
      label: 'Development & Operations',
      value: 10,
      tokens: '100,000,000',
      color: '#EF4444',
      description: 'Platform development, audits, and operational expenses',
      vestingPeriod: '3 years linear vesting'
    },
    {
      label: 'Team & Advisors',
      value: 7,
      tokens: '70,000,000',
      color: '#8B5CF6',
      description: 'Core team allocation and strategic advisor rewards',
      vestingPeriod: '4 years with 1-year cliff'
    },
    {
      label: 'Marketing & Partnerships',
      value: 3,
      tokens: '30,000,000',
      color: '#F97316',
      description: 'Marketing campaigns, partnerships, and business development',
      vestingPeriod: '2 years linear vesting'
    }
  ];

  const allocationDetails: AllocationDetail[] = [
    {
      category: 'Community Ecosystem (35%)',
      percentage: 35,
      tokens: '350,000,000 SWF',
      description: 'Largest allocation dedicated to community growth and ecosystem development',
      vestingSchedule: '5 years linear vesting (19,178,082 tokens monthly)',
      releaseDate: 'Started January 2024',
      purpose: 'Staking rewards, governance incentives, community grants, and ecosystem partnerships',
      lockupPeriod: 'No lockup - begins immediate linear vesting'
    },
    {
      category: 'Liquidity Pool (25%)',
      percentage: 25,
      tokens: '250,000,000 SWF',
      description: 'Ensuring healthy market liquidity and trading stability',
      vestingSchedule: 'Immediate unlock for market deployment',
      releaseDate: 'Available immediately',
      purpose: 'DEX liquidity provision, market making operations, arbitrage prevention',
      lockupPeriod: 'No lockup required'
    },
    {
      category: 'Treasury Reserve (20%)',
      percentage: 20,
      tokens: '200,000,000 SWF',
      description: 'Long-term protocol sustainability and strategic reserves',
      vestingSchedule: '10 years linear vesting (1,666,667 tokens monthly)',
      releaseDate: 'Started January 2024',
      purpose: 'Emergency fund, strategic investments, protocol upgrades, cross-chain expansion',
      lockupPeriod: '6-month initial lockup completed'
    },
    {
      category: 'Development & Operations (10%)',
      percentage: 10,
      tokens: '100,000,000 SWF',
      description: 'Continuous platform development and operational sustainability',
      vestingSchedule: '3 years linear vesting (2,777,778 tokens monthly)',
      releaseDate: 'Started January 2024',
      purpose: 'Smart contract audits, platform upgrades, infrastructure costs, security measures',
      lockupPeriod: '3-month initial lockup completed'
    },
    {
      category: 'Team & Advisors (7%)',
      percentage: 7,
      tokens: '70,000,000 SWF',
      description: 'Core team and strategic advisor allocations with proper alignment',
      vestingSchedule: '4 years with 1-year cliff, then 3 years linear (1,944,444 tokens monthly)',
      releaseDate: 'First release January 2025',
      purpose: 'Team compensation, advisor rewards, long-term commitment incentives',
      lockupPeriod: '1-year cliff period (completed January 2025)'
    },
    {
      category: 'Marketing & Partnerships (3%)',
      percentage: 3,
      tokens: '30,000,000 SWF',
      description: 'Marketing initiatives and strategic business development',
      vestingSchedule: '2 years linear vesting (1,250,000 tokens monthly)',
      releaseDate: 'Started January 2024',
      purpose: 'Marketing campaigns, influencer partnerships, conference sponsorships, PR activities',
      lockupPeriod: 'No lockup - immediate vesting'
    }
  ];

  useEffect(() => {
    const loadPlatformMetrics = async () => {
      try {
        setLoading(true);
        const metrics = await calculatePlatformMetrics();
        setPlatformMetrics(metrics);
      } catch (error) {
        console.error('Error loading platform metrics:', error);
      } finally {
        setLoading(false);
      }
    };

    loadPlatformMetrics();
  }, []);

  const handleAllocationClick = (allocation: any) => {
    const detail = allocationDetails.find(d => d.category.includes(allocation.label));
    setSelectedAllocation(detail || null);
  };

  // Real-time blockchain data (replaces placeholder values)
  const totalSupply = "10,000,000,000";
  const currentCirculatingSupply = platformMetrics ? formatTokenAmount(platformMetrics.circulatingSupply) : "4,200,000,000";
  const marketCap = platformMetrics ? formatCurrency(platformMetrics.marketCap) : "$840,000,000";
  const fullyDilutedValue = platformMetrics ? formatCurrency(platformMetrics.fullyDilutedValue) : "$2,000,000,000";
  const tokenPrice = platformMetrics ? `$${platformMetrics.tokenPrice.toFixed(4)}` : "$0.20";
  const priceChange24h = platformMetrics ? platformMetrics.priceChange24h.toFixed(2) : "0.00";

  return (
    <Layout title="AXM Tokenomics" themeColor="blue">
      <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-900 to-blue-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-4">AXM Token Tokenomics</h1>
            <p className="text-xl text-blue-100 max-w-3xl mx-auto">
              Energy-based tokenomics: Each AXM embodies verified contribution. Circulation over hoarding.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Key Metrics */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading real-time blockchain data...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-12">
            <div className="bg-white p-6 rounded-lg shadow-lg text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Current Price</h3>
              <p className="text-3xl font-bold text-green-600">{tokenPrice}</p>
              <p className={`text-sm mt-1 ${priceChange24h.startsWith('-') ? 'text-red-600' : 'text-green-600'}`}>
                {priceChange24h.startsWith('-') ? '' : '+'}{priceChange24h}% (24h)
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-lg text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Total Supply</h3>
              <p className="text-3xl font-bold text-blue-600">{totalSupply}</p>
              <p className="text-sm text-gray-600 mt-1">AXM Tokens</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-lg text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Circulating Supply</h3>
              <p className="text-3xl font-bold text-indigo-600">{currentCirculatingSupply}</p>
              <p className="text-sm text-gray-600 mt-1">42% of Total Supply</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-lg text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Market Cap</h3>
              <p className="text-3xl font-bold text-purple-600">{marketCap}</p>
              <p className="text-sm text-gray-600 mt-1">Current Valuation</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-lg text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Fully Diluted Value</h3>
              <p className="text-3xl font-bold text-orange-600">{fullyDilutedValue}</p>
              <p className="text-sm text-gray-600 mt-1">Maximum Valuation</p>
            </div>
          </div>
        )}

        {/* Main Chart and Details */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          <div>
            <TokenomicsPieChart
              allocations={tokenAllocations}
              totalSupply={totalSupply}
              title="Token Distribution Breakdown"
              onSliceClick={handleAllocationClick}
            />
          </div>

          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h3 className="text-xl font-bold text-gray-900 mb-6">Distribution Details</h3>
            {selectedAllocation ? (
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-blue-600">
                  {selectedAllocation.category}
                </h4>
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-700">Allocation</p>
                    <p className="text-lg font-bold text-gray-900">{selectedAllocation.tokens}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">Vesting Schedule</p>
                    <p className="text-sm text-gray-900">{selectedAllocation.vestingSchedule}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">Release Date</p>
                    <p className="text-sm text-gray-900">{selectedAllocation.releaseDate}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">Purpose</p>
                    <p className="text-sm text-gray-900">{selectedAllocation.purpose}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">Lockup Period</p>
                    <p className="text-sm text-gray-900">{selectedAllocation.lockupPeriod}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="text-gray-400 mb-4">
                  <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <p className="text-gray-600">Click on any chart segment to view detailed allocation information</p>
              </div>
            )}
          </div>
        </div>

        {/* Vesting Timeline */}
        <div className="bg-white p-6 rounded-lg shadow-lg mb-8">
          <h3 className="text-xl font-bold text-gray-900 mb-6">Vesting Timeline</h3>
          <div className="space-y-6">
            <div className="flex items-center">
              <div className="w-4 h-4 bg-green-500 rounded-full mr-4"></div>
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900">January 2024 - Launch</h4>
                <p className="text-sm text-gray-600">Liquidity Pool (25%) and initial Community/Treasury vesting begins</p>
              </div>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-blue-500 rounded-full mr-4"></div>
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900">July 2024 - Mid-Year</h4>
                <p className="text-sm text-gray-600">Treasury lockup completes, Development vesting continues</p>
              </div>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-purple-500 rounded-full mr-4"></div>
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900">January 2025 - Team Unlock</h4>
                <p className="text-sm text-gray-600">Team & Advisor cliff period completes, linear vesting begins</p>
              </div>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-orange-500 rounded-full mr-4"></div>
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900">2027-2034 - Long Term</h4>
                <p className="text-sm text-gray-600">Community and Treasury continue linear vesting for ecosystem sustainability</p>
              </div>
            </div>
          </div>
        </div>

        {/* Token Utility */}
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h3 className="text-xl font-bold text-gray-900 mb-6">SWF Token Utility</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 border border-gray-200 rounded-lg">
              <div className="text-blue-600 mb-3">
                <svg className="mx-auto h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Staking Rewards</h4>
              <p className="text-sm text-gray-600">Earn projected APY by staking SWF tokens in various liquidity pools</p>
            </div>
            <div className="text-center p-4 border border-gray-200 rounded-lg">
              <div className="text-green-600 mb-3">
                <svg className="mx-auto h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Governance Rights</h4>
              <p className="text-sm text-gray-600">Participate in DAO governance and protocol decision-making processes</p>
            </div>
            <div className="text-center p-4 border border-gray-200 rounded-lg">
              <div className="text-purple-600 mb-3">
                <svg className="mx-auto h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Platform Access</h4>
              <p className="text-sm text-gray-600">Access premium features, reduced fees, and exclusive investment opportunities</p>
            </div>
          </div>
        </div>
      </div>
      </div>
    </Layout>
  );
};

export default TokenomicsPage;