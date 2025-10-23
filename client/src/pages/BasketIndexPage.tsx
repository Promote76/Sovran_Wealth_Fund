import React, { useState, useEffect } from 'react';
import { useWallet } from '../contexts/WalletContext';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Input } from '../components/ui/input';
import axios from 'axios';

interface BasketComposition {
  address: string;
  weight: string;
  percentage: string;
}

interface BasketInfo {
  name: string;
  symbol: string;
  totalSupply: string;
  contractAddress: string;
  composition: BasketComposition[];
}

export default function BasketIndexPage() {
  const { isConnected, isLoggedIn, account, connectWallet, isConnecting, loginError } = useWallet();
  const [basketInfo, setBasketInfo] = useState<BasketInfo | null>(null);
  const [userBalance, setUserBalance] = useState('0');
  const [loading, setLoading] = useState(true);
  const [mintAmount, setMintAmount] = useState('');
  const [burnAmount, setBurnAmount] = useState('');
  const [requiredAssets, setRequiredAssets] = useState<any[]>([]);
  const [txLoading, setTxLoading] = useState(false);

  useEffect(() => {
    loadBasketInfo();
  }, []);

  useEffect(() => {
    if (isConnected && account) {
      loadUserBalance();
    }
  }, [isConnected, account]);

  const loadBasketInfo = async () => {
    try {
      const response = await axios.get('/api/basket-index/info');
      if (response.data.success) {
        setBasketInfo(response.data.data);
      }
    } catch (error) {
      console.error('Failed to load basket info:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUserBalance = async () => {
    if (!account) return;
    try {
      const response = await axios.get(`/api/basket-index/balance/${account}`);
      if (response.data.success) {
        setUserBalance(response.data.data.balance);
      }
    } catch (error) {
      console.error('Failed to load balance:', error);
    }
  };

  const estimateRequiredAssets = async (amount: string) => {
    if (!amount || parseFloat(amount) <= 0) {
      setRequiredAssets([]);
      return;
    }

    try {
      const response = await axios.post('/api/basket-index/estimate', { amount });
      if (response.data.success) {
        setRequiredAssets(response.data.data);
      }
    } catch (error) {
      console.error('Failed to estimate assets:', error);
    }
  };

  const handleMintAmountChange = (value: string) => {
    setMintAmount(value);
    estimateRequiredAssets(value);
  };

  const handleMint = async () => {
    if (!mintAmount || parseFloat(mintAmount) <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    setTxLoading(true);
    try {
      const response = await axios.post('/api/basket-index/tx/mint', { amount: mintAmount });
      if (response.data.success) {
        alert('Mint transaction prepared. Please approve in your wallet.');
        // Transaction would be sent via wallet here
      }
    } catch (error: any) {
      alert('Mint failed: ' + (error.response?.data?.error || error.message));
    } finally {
      setTxLoading(false);
    }
  };

  const handleBurn = async () => {
    if (!burnAmount || parseFloat(burnAmount) <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    if (parseFloat(burnAmount) > parseFloat(userBalance)) {
      alert('Insufficient balance');
      return;
    }

    setTxLoading(true);
    try {
      const response = await axios.post('/api/basket-index/tx/burn', { amount: burnAmount });
      if (response.data.success) {
        alert('Burn transaction prepared. Please approve in your wallet.');
        // Transaction would be sent via wallet here
      }
    } catch (error: any) {
      alert('Burn failed: ' + (error.response?.data?.error || error.message));
    } finally {
      setTxLoading(false);
    }
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
              📊 AXIOM Basket Index
            </h1>
            <p className="text-gray-600 mb-6">
              Please connect your wallet to access the Basket Index
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
                    📊 What is the Basket Index?
                  </h2>
                  <p className="text-gray-700 mb-4 leading-relaxed">
                    The AXIOM Basket Index is a <strong>diversified crypto portfolio token</strong> that represents ownership of multiple underlying crypto assets in weighted proportions. Think of it as an ETF for cryptocurrency - one token that gives you exposure to a carefully balanced basket of digital assets.
                  </p>
                  <p className="text-gray-700 leading-relaxed">
                    Instead of buying and managing multiple tokens separately, you can mint a single Basket Index token that automatically allocates your investment across all underlying assets according to their predefined weights.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-2 border-green-200">
                <CardContent className="p-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">
                    ✨ Key Benefits
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-start">
                      <span className="text-green-600 font-bold mr-3">•</span>
                      <div>
                        <strong className="text-gray-900">Instant Diversification:</strong>
                        <span className="text-gray-700"> Get exposure to multiple assets with a single transaction</span>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <span className="text-green-600 font-bold mr-3">•</span>
                      <div>
                        <strong className="text-gray-900">Professional Allocation:</strong>
                        <span className="text-gray-700"> Assets are weighted by experts to optimize risk and returns</span>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <span className="text-green-600 font-bold mr-3">•</span>
                      <div>
                        <strong className="text-gray-900">Lower Gas Fees:</strong>
                        <span className="text-gray-700"> One transaction instead of multiple purchases</span>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <span className="text-green-600 font-bold mr-3">•</span>
                      <div>
                        <strong className="text-gray-900">Easy Rebalancing:</strong>
                        <span className="text-gray-700"> Basket automatically maintains target allocations</span>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <span className="text-green-600 font-bold mr-3">•</span>
                      <div>
                        <strong className="text-gray-900">Full Redemption:</strong>
                        <span className="text-gray-700"> Burn your basket tokens anytime to receive underlying assets</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-2 border-purple-200">
                <CardContent className="p-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">
                    💡 How It Works
                  </h3>
                  <div className="space-y-4">
                    <div className="bg-purple-50 p-4 rounded-lg">
                      <h4 className="font-semibold text-purple-900 mb-2">1. Minting (Creating) Basket Tokens</h4>
                      <p className="text-gray-700 text-sm">
                        Deposit the required amounts of each underlying asset → Receive Basket Index tokens that represent your proportional ownership
                      </p>
                    </div>
                    <div className="bg-purple-50 p-4 rounded-lg">
                      <h4 className="font-semibold text-purple-900 mb-2">2. Holding & Trading</h4>
                      <p className="text-gray-700 text-sm">
                        Your Basket Index tokens are tradeable ERC20 tokens → Transfer, trade, or use in DeFi protocols just like any other token
                      </p>
                    </div>
                    <div className="bg-purple-50 p-4 rounded-lg">
                      <h4 className="font-semibold text-purple-900 mb-2">3. Burning (Redeeming)</h4>
                      <p className="text-gray-700 text-sm">
                        Burn your Basket Index tokens → Receive back the underlying assets in exact proportions based on current weights
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-2 border-yellow-200 bg-yellow-50">
                <CardContent className="p-6">
                  <h3 className="text-xl font-semibold text-yellow-900 mb-3">
                    🎯 Perfect For
                  </h3>
                  <ul className="space-y-2 text-gray-800">
                    <li>• Investors seeking <strong>automatic diversification</strong></li>
                    <li>• Long-term holders who want <strong>broad market exposure</strong></li>
                    <li>• DeFi users looking to <strong>simplify portfolio management</strong></li>
                    <li>• Anyone wanting to <strong>reduce risk</strong> through asset allocation</li>
                    <li>• Traders who prefer <strong>one-click investment strategies</strong></li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl shadow-lg p-8 text-white">
          <h1 className="text-4xl font-bold mb-2">📊 AXIOM Basket Index</h1>
          <p className="text-blue-100 text-lg">
            Diversified crypto portfolio in a single token
          </p>
        </div>

        {/* Basket Info */}
        {basketInfo && (
          <Card className="border-2 border-blue-200">
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-4 rounded-lg">
                  <div className="text-sm text-gray-600 mb-1">Basket Name</div>
                  <div className="text-2xl font-bold text-gray-900">{basketInfo.name}</div>
                  <div className="text-sm text-gray-500">{basketInfo.symbol}</div>
                </div>
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-4 rounded-lg">
                  <div className="text-sm text-gray-600 mb-1">Total Supply</div>
                  <div className="text-2xl font-bold text-gray-900">
                    {parseFloat(basketInfo.totalSupply).toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-500">{basketInfo.symbol} tokens</div>
                </div>
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-4 rounded-lg">
                  <div className="text-sm text-gray-600 mb-1">Your Balance</div>
                  <div className="text-2xl font-bold text-gray-900">
                    {parseFloat(userBalance).toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-500">{basketInfo.symbol}</div>
                </div>
              </div>

              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Basket Composition</h3>
                <div className="space-y-3">
                  {basketInfo.composition.map((asset, index) => (
                    <div key={index} className="flex items-center justify-between bg-gray-50 p-4 rounded-lg">
                      <div className="flex-1">
                        <div className="text-sm font-mono text-gray-600">{asset.address}</div>
                        <div className="text-xs text-gray-500 mt-1">Weight: {asset.weight} basis points</div>
                      </div>
                      <div className="ml-4">
                        <div className="text-2xl font-bold text-blue-600">{asset.percentage}%</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Mint Section */}
        <Card className="border-2 border-green-200">
          <CardContent className="p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">🌱 Mint Basket Tokens</h2>
            <p className="text-gray-600 mb-6">
              Deposit underlying assets to mint new basket tokens
            </p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Amount to Mint
                </label>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={mintAmount}
                  onChange={(e) => handleMintAmountChange(e.target.value)}
                  className="text-lg"
                />
              </div>

              {requiredAssets.length > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h4 className="font-semibold text-yellow-900 mb-2">Required Assets:</h4>
                  <div className="space-y-2">
                    {requiredAssets.map((asset, index) => (
                      <div key={index} className="text-sm text-gray-700">
                        • {parseFloat(asset.amount).toFixed(6)} tokens at {asset.address}
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-yellow-700 mt-2">
                    ⚠️ Make sure you have approved all required tokens before minting
                  </p>
                </div>
              )}

              <Button
                onClick={handleMint}
                disabled={txLoading || !mintAmount}
                className="w-full bg-green-600 hover:bg-green-700 text-white"
              >
                {txLoading ? '⏳ Processing...' : '🌱 Mint Basket Tokens'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Burn Section */}
        <Card className="border-2 border-orange-200">
          <CardContent className="p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">🔥 Burn Basket Tokens</h2>
            <p className="text-gray-600 mb-6">
              Redeem your basket tokens to receive underlying assets
            </p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Amount to Burn
                </label>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={burnAmount}
                  onChange={(e) => setBurnAmount(e.target.value)}
                  className="text-lg"
                />
                <div className="text-sm text-gray-500 mt-1">
                  Available: {parseFloat(userBalance).toLocaleString()} {basketInfo?.symbol}
                </div>
              </div>

              <Button
                onClick={handleBurn}
                disabled={txLoading || !burnAmount}
                className="w-full bg-orange-600 hover:bg-orange-700 text-white"
              >
                {txLoading ? '⏳ Processing...' : '🔥 Burn Basket Tokens'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Contract Info */}
        <Card className="border-2 border-gray-200 bg-gray-50">
          <CardContent className="p-6">
            <h3 className="font-semibold text-gray-900 mb-2">Contract Address</h3>
            <div className="font-mono text-sm text-gray-600 break-all">
              {basketInfo?.contractAddress}
            </div>
            <a
              href={`https://bscscan.com/address/${basketInfo?.contractAddress}`}
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
