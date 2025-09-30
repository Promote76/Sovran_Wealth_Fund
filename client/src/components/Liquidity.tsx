import React, { useEffect, useState } from 'react';
import { getUserLPPositions, getIncomeProjections, formatCurrency, formatPercentage } from '../api/liquidity-data-api';
import Chart from './Chart';
import { registerLiquidityAddition } from '../utils/userJourney';

interface LiquidityProps {
  walletAddress?: string;
}

// Type definitions for LP positions
interface LPPosition {
  pairName: string;
  tokens: string;
  percentOfPool: number;
  valueUSD: number;
  address: string;
  timestamp: number;
}

interface LPPositions {
  [key: string]: LPPosition;
}

// Type definitions for income projections
interface IncomeProjection {
  currentMonthlyIncome: number;
  targetMonthlyIncome: number;
  percentComplete: number;
  weeksToTarget: number;
  monthsToTarget: number;
  projectedTotalInvestment: number;
}

const Liquidity: React.FC<LiquidityProps> = ({ walletAddress }) => {
  const [positions, setPositions] = useState<LPPositions>({});
  const [projections, setProjections] = useState<IncomeProjection | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [totalValue, setTotalValue] = useState<number>(0);
  
  // Function to fetch user's LP positions
  const fetchLPPositions = async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (!walletAddress) {
        setPositions({});
        return;
      }
      
      // Get user's LP positions
      const response = await getUserLPPositions(walletAddress);
      
      if (response) {
        setPositions(response);
        
        // Calculate total value
        const total = Object.values(response).reduce(
          (sum, position) => {
            // Add type checking to ensure position is a valid LPPosition
            const lpPosition = position as LPPosition;
            return sum + (lpPosition.valueUSD || 0);
          }, 
          0
        );
        setTotalValue(total);
      } else {
        throw new Error('Failed to fetch LP positions');
      }
    } catch (err) {
      console.error('Error fetching LP positions:', err);
      setError('Failed to load LP positions. Please try again later.');
    } finally {
      setLoading(false);
    }
  };
  
  // Function to fetch income projections
  const fetchIncomeProjections = async () => {
    try {
      const data = await getIncomeProjections();
      if (data) {
        setProjections(data);
      }
    } catch (err) {
      console.error('Error fetching income projections:', err);
      // Don't set error state, as this is a secondary feature
    }
  };
  
  // Handle adding liquidity (external link)
  const handleAddLiquidity = () => {
    // Register this action with the user journey system
    registerLiquidityAddition();
    
    // Open PancakeSwap in a new window
    window.open(
      `https://pancakeswap.finance/add/BNB/0x7e243288B287BEe84A7D40E8520444f47af88335`,
      '_blank'
    );
  };
  
  // Fetch data when wallet address changes
  useEffect(() => {
    fetchLPPositions();
    fetchIncomeProjections();
    
    // Refresh every 30 seconds
    const intervalId = setInterval(() => {
      fetchLPPositions();
      fetchIncomeProjections();
    }, 30000);
    
    return () => clearInterval(intervalId);
  }, [walletAddress]);
  
  return (
    <div className="liquidity-container mt-6">
      <h2 className="text-2xl font-bold mb-4 text-gray-800">Liquidity Positions</h2>
      
      {/* LP Positions Section */}
      <div className="positions-container mb-6 bg-white rounded-lg shadow-md p-4">
        <h3 className="text-xl font-semibold mb-3 text-gray-700">Your LP Positions</h3>
        
        {loading ? (
          <div className="flex justify-center items-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : error ? (
          <div className="text-red-500 p-4 text-center">{error}</div>
        ) : (
          <>
            <div className="flex justify-between items-center mb-3">
              <span className="text-gray-600">Total Value:</span>
              <span className="font-bold text-green-600">{formatCurrency(totalValue)}</span>
            </div>
            
            <div className="overflow-x-auto mb-4">
              <table className="min-w-full bg-white border border-gray-200">
                <thead>
                  <tr>
                    <th className="py-2 px-4 border-b">Pool</th>
                    <th className="py-2 px-4 border-b">Tokens</th>
                    <th className="py-2 px-4 border-b">% of Pool</th>
                    <th className="py-2 px-4 border-b">Value</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.values(positions).length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-4 px-4 border-b text-center text-gray-500">
                        No LP positions found for your wallet
                      </td>
                    </tr>
                  ) : (
                    Object.values(positions).map(position => (
                      <tr key={position.address} className="hover:bg-gray-50">
                        <td className="py-2 px-4 border-b">{position.pairName}</td>
                        <td className="py-2 px-4 border-b">{parseFloat(position.tokens).toFixed(6)}</td>
                        <td className="py-2 px-4 border-b">{formatPercentage(position.percentOfPool)}</td>
                        <td className="py-2 px-4 border-b">{formatCurrency(position.valueUSD)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            
            <div className="flex justify-center">
              <button
                onClick={handleAddLiquidity}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md transition-colors duration-200 flex items-center space-x-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
                <span>Add Liquidity</span>
              </button>
            </div>
          </>
        )}
      </div>
      
      {/* LP Growth Chart */}
      <div className="chart-section mb-6">
        <Chart title="Liquidity Growth Over Time" refreshInterval={60000} />
      </div>
      
      {/* Income Projections */}
      {projections && (
        <div className="income-projections bg-white rounded-lg shadow-md p-4">
          <h3 className="text-xl font-semibold mb-3 text-gray-700">Income Projections</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="projection-card p-3 bg-blue-50 rounded-lg">
              <span className="text-sm text-gray-600">Current Monthly Income:</span>
              <div className="text-lg font-bold text-blue-600">
                {formatCurrency(projections.currentMonthlyIncome)}
              </div>
            </div>
            
            <div className="projection-card p-3 bg-green-50 rounded-lg">
              <span className="text-sm text-gray-600">Target Monthly Income:</span>
              <div className="text-lg font-bold text-green-600">
                {formatCurrency(projections.targetMonthlyIncome)}
              </div>
            </div>
            
            <div className="projection-card p-3 bg-purple-50 rounded-lg">
              <span className="text-sm text-gray-600">Progress to Target:</span>
              <div className="text-lg font-bold text-purple-600">
                {formatPercentage(projections.percentComplete)}
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
                <div 
                  className="bg-purple-600 h-2.5 rounded-full" 
                  style={{ width: `${Math.min(100, projections.percentComplete)}%` }}
                ></div>
              </div>
            </div>
            
            <div className="projection-card p-3 bg-amber-50 rounded-lg">
              <span className="text-sm text-gray-600">Time to Target:</span>
              <div className="text-lg font-bold text-amber-600">
                {projections.monthsToTarget} months
              </div>
              <div className="text-xs text-gray-500">
                ({projections.weeksToTarget} weeks)
              </div>
            </div>
            
            <div className="projection-card p-3 bg-indigo-50 rounded-lg md:col-span-2">
              <span className="text-sm text-gray-600">Projected Total Investment Needed:</span>
              <div className="text-lg font-bold text-indigo-600">
                {formatCurrency(projections.projectedTotalInvestment)}
              </div>
            </div>
          </div>
          
          <div className="text-xs text-gray-500 mt-2 text-right">
            Based on weekly $50 deposits and current yield rates
          </div>
        </div>
      )}
    </div>
  );
};

export default Liquidity;