import React, { useState, useEffect } from 'react';
import { useWallet } from '../contexts/WalletContext';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Input } from '../components/ui/input';
import axios from 'axios';

interface APRDashboard {
  currentAPR: string;
  stakingContractAPR: string;
  minAPR: string;
  maxAPR: string;
  totalDeposited: string;
  lowDepositThreshold: string;
  highDepositThreshold: string;
  adjustmentIntervalHours: string;
  nextAdjustmentTime: number;
  timeUntilNextAdjustment: number;
  canAdjust: boolean;
  hasPermission: boolean;
  contractAddress: string;
}

interface APRHistory {
  oldAPR: string;
  newAPR: string;
  timestamp: number;
  blockNumber: number;
  txHash: string;
}

interface DepositImpact {
  currentDeposit: string;
  lowThreshold: string;
  highThreshold: string;
  minAPR: string;
  maxAPR: string;
  impactCurve: Array<{
    depositAmount: string;
    apr: string;
    isCurrent: boolean;
  }>;
}

export default function DynamicAPRPage() {
  const { isConnected, isLoggedIn, account, connectWallet, isConnecting, loginError } = useWallet();
  const [dashboard, setDashboard] = useState<APRDashboard | null>(null);
  const [history, setHistory] = useState<APRHistory[]>([]);
  const [depositImpact, setDepositImpact] = useState<DepositImpact | null>(null);
  const [loading, setLoading] = useState(true);
  const [simulateAmount, setSimulateAmount] = useState('');
  const [simulatedAPR, setSimulatedAPR] = useState<string | null>(null);

  useEffect(() => {
    loadDashboard();
    loadHistory();
    loadDepositImpact();
    
    const interval = setInterval(() => {
      loadDashboard();
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const loadDashboard = async () => {
    try {
      const response = await axios.get('/api/dynamic-apr/dashboard');
      if (response.data.success) {
        setDashboard(response.data.data);
      }
    } catch (error) {
      console.error('Failed to load dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadHistory = async () => {
    try {
      const response = await axios.get('/api/dynamic-apr/history');
      if (response.data.success) {
        setHistory(response.data.data);
      }
    } catch (error) {
      console.error('Failed to load history:', error);
    }
  };

  const loadDepositImpact = async () => {
    try {
      const response = await axios.get('/api/dynamic-apr/deposit-impact');
      if (response.data.success) {
        setDepositImpact(response.data.data);
      }
    } catch (error) {
      console.error('Failed to load deposit impact:', error);
    }
  };

  const handleSimulate = async () => {
    if (!simulateAmount || parseFloat(simulateAmount) < 0) return;

    try {
      const response = await axios.post('/api/dynamic-apr/simulate', {
        depositAmount: simulateAmount
      });
      if (response.data.success) {
        setSimulatedAPR(response.data.data.simulatedAPR);
      }
    } catch (error) {
      console.error('Failed to simulate APR:', error);
    }
  };

  const formatTimeRemaining = (seconds: number) => {
    if (seconds <= 0) return 'Ready to adjust';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleString();
  };

  const handleWalletConnect = async () => {
    try {
      await connectWallet();
    } catch (error: any) {
      console.error('❌ Wallet connection failed:', error);
    }
  };

  if (!isConnected || !isLoggedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-xl shadow-lg p-8 text-center">
            <h1 className="text-3xl font-bold text-gray-800 mb-4">
              ⚡ Dynamic APR Controller
            </h1>
            <p className="text-gray-600 mb-6">
              Please connect your wallet to access the APR dashboard
            </p>
            <Button 
              onClick={handleWalletConnect}
              disabled={isConnecting}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isConnecting ? '🔄 Connecting...' : '🔗 Connect Wallet'}
            </Button>
            {loginError && (
              <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="text-sm font-medium text-red-800 mb-2">Connection Error:</div>
                <div className="text-xs text-red-600">{loginError}</div>
              </div>
            )}

            {/* Educational Content for Non-Connected Users */}
            <div className="mt-12 text-left space-y-6">
              <Card className="border-2 border-blue-200">
                <CardContent className="p-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">
                    ⚡ What is Dynamic APR?
                  </h2>
                  <p className="text-gray-700 mb-4 leading-relaxed">
                    The Dynamic APR Controller is a <strong>smart contract that automatically adjusts staking rewards</strong> based on total platform deposits. When fewer people stake, APR increases to attract more stakers. When many people stake, APR decreases to maintain sustainability.
                  </p>
                  <p className="text-gray-700 leading-relaxed">
                    This creates a self-balancing system that optimizes rewards without manual intervention, ensuring fair compensation while protecting the platform's long-term health.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-2 border-green-200">
                <CardContent className="p-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">
                    🎯 How It Works
                  </h3>
                  <div className="space-y-4">
                    <div className="bg-green-50 p-4 rounded-lg">
                      <h4 className="font-semibold text-green-900 mb-2">📊 Automatic Adjustments</h4>
                      <p className="text-gray-700 text-sm">
                        The system checks total deposits every 24 hours. Based on two thresholds (low: 10,000 tokens, high: 100,000 tokens), it calculates the optimal APR between 10% and 30%.
                      </p>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg">
                      <h4 className="font-semibold text-green-900 mb-2">📈 Linear Scaling</h4>
                      <p className="text-gray-700 text-sm">
                        APR scales smoothly between min and max. Low deposits = high APR (up to 30%). High deposits = low APR (down to 10%). This balances incentives with sustainability.
                      </p>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg">
                      <h4 className="font-semibold text-green-900 mb-2">🔄 Real-Time Transparency</h4>
                      <p className="text-gray-700 text-sm">
                        All APR changes are recorded on-chain and publicly visible. You can see historical adjustments and simulate future rates based on deposit amounts.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-2 border-purple-200">
                <CardContent className="p-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">
                    ✨ Benefits for Stakers
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-start">
                      <span className="text-purple-600 font-bold mr-3">•</span>
                      <div>
                        <strong className="text-gray-900">Fair Rewards:</strong>
                        <span className="text-gray-700"> Early stakers earn higher APR when deposits are low</span>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <span className="text-purple-600 font-bold mr-3">•</span>
                      <div>
                        <strong className="text-gray-900">Predictable System:</strong>
                        <span className="text-gray-700"> Mathematical formula ensures consistent, transparent adjustments</span>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <span className="text-purple-600 font-bold mr-3">•</span>
                      <div>
                        <strong className="text-gray-900">No Rug Pulls:</strong>
                        <span className="text-gray-700"> APR changes are automated, not controlled by any individual</span>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <span className="text-purple-600 font-bold mr-3">•</span>
                      <div>
                        <strong className="text-gray-900">Sustainable Growth:</strong>
                        <span className="text-gray-700"> Balances high rewards with platform longevity</span>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <span className="text-purple-600 font-bold mr-3">•</span>
                      <div>
                        <strong className="text-gray-900">Market Responsiveness:</strong>
                        <span className="text-gray-700"> Automatically adapts to changing market conditions</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-2 border-yellow-200 bg-yellow-50">
                <CardContent className="p-6">
                  <h3 className="text-xl font-semibold text-yellow-900 mb-3">
                    📊 Example Scenarios
                  </h3>
                  <div className="space-y-3 text-gray-800">
                    <div className="bg-white p-3 rounded">
                      <strong>Scenario 1: Early Platform (5,000 tokens staked)</strong>
                      <div className="text-sm mt-1">APR: <span className="text-green-600 font-bold">30%</span> - Maximum rewards to attract initial stakers</div>
                    </div>
                    <div className="bg-white p-3 rounded">
                      <strong>Scenario 2: Growing Platform (55,000 tokens staked)</strong>
                      <div className="text-sm mt-1">APR: <span className="text-blue-600 font-bold">20%</span> - Balanced rewards as platform grows</div>
                    </div>
                    <div className="bg-white p-3 rounded">
                      <strong>Scenario 3: Mature Platform (150,000 tokens staked)</strong>
                      <div className="text-sm mt-1">APR: <span className="text-orange-600 font-bold">10%</span> - Sustainable long-term rate</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (loading || !dashboard) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading APR data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-blue-600 rounded-xl shadow-lg p-8 text-white">
          <h1 className="text-4xl font-bold mb-2">⚡ Dynamic APR Controller</h1>
          <p className="text-blue-100 text-lg">
            Real-time automatic APR adjustments based on platform deposits
          </p>
        </div>

        {/* Current APR Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="border-2 border-green-200 bg-gradient-to-br from-green-50 to-emerald-50">
            <CardContent className="p-6 text-center">
              <div className="text-sm text-gray-600 mb-2">Current APR</div>
              <div className="text-4xl font-bold text-green-600">{dashboard.currentAPR}%</div>
              <div className="text-xs text-gray-500 mt-2">Controller Rate</div>
            </CardContent>
          </Card>
          
          <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50">
            <CardContent className="p-6 text-center">
              <div className="text-sm text-gray-600 mb-2">Staking APR</div>
              <div className="text-4xl font-bold text-blue-600">{dashboard.stakingContractAPR}%</div>
              <div className="text-xs text-gray-500 mt-2">Active Rate</div>
            </CardContent>
          </Card>

          <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50">
            <CardContent className="p-6 text-center">
              <div className="text-sm text-gray-600 mb-2">Total Deposited</div>
              <div className="text-3xl font-bold text-purple-600">
                {parseFloat(dashboard.totalDeposited).toLocaleString(undefined, {maximumFractionDigits: 0})}
              </div>
              <div className="text-xs text-gray-500 mt-2">Tokens</div>
            </CardContent>
          </Card>

          <Card className="border-2 border-orange-200 bg-gradient-to-br from-orange-50 to-yellow-50">
            <CardContent className="p-6 text-center">
              <div className="text-sm text-gray-600 mb-2">Next Adjustment</div>
              <div className="text-2xl font-bold text-orange-600">
                {formatTimeRemaining(dashboard.timeUntilNextAdjustment)}
              </div>
              <div className="text-xs text-gray-500 mt-2">
                {dashboard.canAdjust ? 'Available Now' : `Every ${dashboard.adjustmentIntervalHours}h`}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* APR Range Info */}
        <Card className="border-2 border-indigo-200">
          <CardContent className="p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">APR Range & Thresholds</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold text-gray-800 mb-3">APR Limits</h3>
                <div className="space-y-2">
                  <div className="flex justify-between items-center bg-green-50 p-3 rounded">
                    <span className="text-gray-700">Maximum APR:</span>
                    <span className="font-bold text-green-600">{dashboard.maxAPR}%</span>
                  </div>
                  <div className="flex justify-between items-center bg-orange-50 p-3 rounded">
                    <span className="text-gray-700">Minimum APR:</span>
                    <span className="font-bold text-orange-600">{dashboard.minAPR}%</span>
                  </div>
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-gray-800 mb-3">Deposit Thresholds</h3>
                <div className="space-y-2">
                  <div className="flex justify-between items-center bg-blue-50 p-3 rounded">
                    <span className="text-gray-700">Low Threshold:</span>
                    <span className="font-bold text-blue-600">{parseFloat(dashboard.lowDepositThreshold).toLocaleString()} tokens</span>
                  </div>
                  <div className="flex justify-between items-center bg-purple-50 p-3 rounded">
                    <span className="text-gray-700">High Threshold:</span>
                    <span className="font-bold text-purple-600">{parseFloat(dashboard.highDepositThreshold).toLocaleString()} tokens</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* APR Simulator */}
        <Card className="border-2 border-green-200">
          <CardContent className="p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">🎯 APR Simulator</h2>
            <p className="text-gray-600 mb-4">
              See what the APR would be at different deposit levels
            </p>
            <div className="flex gap-4 items-end">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Simulated Deposit Amount (tokens)
                </label>
                <Input
                  type="number"
                  placeholder="Enter amount..."
                  value={simulateAmount}
                  onChange={(e) => setSimulateAmount(e.target.value)}
                  className="text-lg"
                />
              </div>
              <Button
                onClick={handleSimulate}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                Calculate APR
              </Button>
            </div>
            {simulatedAPR && (
              <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="text-center">
                  <div className="text-sm text-gray-600 mb-1">Simulated APR</div>
                  <div className="text-4xl font-bold text-green-600">{simulatedAPR}%</div>
                  <div className="text-xs text-gray-500 mt-2">
                    At {parseFloat(simulateAmount).toLocaleString()} tokens deposited
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Deposit Impact Curve */}
        {depositImpact && (
          <Card className="border-2 border-purple-200">
            <CardContent className="p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">📊 Deposit Impact Curve</h2>
              <p className="text-gray-600 mb-4">
                How total deposits affect APR
              </p>
              <div className="space-y-2">
                {depositImpact.impactCurve.map((point, index) => (
                  <div 
                    key={index}
                    className={`flex justify-between items-center p-3 rounded ${
                      point.isCurrent 
                        ? 'bg-blue-100 border-2 border-blue-400' 
                        : 'bg-gray-50'
                    }`}
                  >
                    <span className="font-medium text-gray-800">
                      {parseFloat(point.depositAmount).toLocaleString()} tokens
                      {point.isCurrent && <span className="ml-2 text-xs text-blue-600">(Current)</span>}
                    </span>
                    <span className="font-bold text-lg" style={{
                      color: parseFloat(point.apr) >= 25 ? '#10b981' : 
                             parseFloat(point.apr) >= 15 ? '#3b82f6' : '#f59e0b'
                    }}>
                      {point.apr}% APR
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* APR History */}
        {history.length > 0 && (
          <Card className="border-2 border-gray-200">
            <CardContent className="p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">📜 APR Adjustment History</h2>
              <div className="space-y-3">
                {history.slice(0, 10).map((event, index) => (
                  <div key={index} className="bg-gray-50 p-4 rounded-lg flex justify-between items-center">
                    <div>
                      <div className="font-medium text-gray-900">
                        {event.oldAPR}% → {event.newAPR}%
                      </div>
                      <div className="text-sm text-gray-500">
                        {formatDate(event.timestamp)}
                      </div>
                    </div>
                    <a
                      href={`https://bscscan.com/tx/${event.txHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-700 text-sm"
                    >
                      View TX →
                    </a>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Contract Info */}
        <Card className="border-2 border-gray-200 bg-gray-50">
          <CardContent className="p-6">
            <h3 className="font-semibold text-gray-900 mb-2">Contract Address</h3>
            <div className="font-mono text-sm text-gray-600 break-all">
              {dashboard.contractAddress}
            </div>
            <a
              href={`https://bscscan.com/address/${dashboard.contractAddress}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-700 text-sm mt-2 inline-block"
            >
              View on BSCScan →
            </a>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
