import React, { useState, useEffect } from 'react';
import { useWallet } from '../contexts/WalletContext';
import { useContractTransactions } from '../hooks/useContractTransactions';
import { useNFTMarketplaceEvents, ContractEvent } from '../hooks/useContractEvents';
import { EventToast } from '../components/EventToast';
import { nftMarketplaceService, type NFTListing } from '../services/contracts';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Input } from '../components/ui/input';

export default function NFTMarketplacePage() {
  const { isConnected, isLoggedIn, account, connectWallet, isConnecting, loginError } = useWallet();
  const {
    createNFTListing,
    buyNFT,
    placeBidOnNFT,
    cancelNFTListing,
    txStatus,
    resetStatus,
    isReady
  } = useContractTransactions();

  const [activeTab, setActiveTab] = useState<'browse' | 'create'>('browse');
  const [listings, setListings] = useState<NFTListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [toastEvents, setToastEvents] = useState<ContractEvent[]>([]);

  // Real-time event listener
  const { isConnected: eventStreamConnected } = useNFTMarketplaceEvents({
    onEvent: (event) => {
      console.log('[NFTMarketplace] Real-time event received:', event);
      setToastEvents(prev => [...prev, event]);
      
      // Auto-refresh listings on marketplace events
      if (['ItemListed', 'ItemSold', 'BidPlaced'].includes(event.eventName)) {
        setTimeout(() => loadListings(), 1000);
      }
    }
  });
  
  // Create listing form state
  const [nftContract, setNftContract] = useState('');
  const [tokenId, setTokenId] = useState('');
  const [price, setPrice] = useState('');

  // Bid state
  const [selectedListing, setSelectedListing] = useState<string | null>(null);
  const [bidAmount, setBidAmount] = useState('');

  // Load listings
  useEffect(() => {
    loadListings();
  }, []);

  // Refresh after successful transaction
  useEffect(() => {
    if (txStatus.success && txStatus.txHash) {
      setTimeout(() => {
        loadListings();
        resetStatus();
        // Reset form
        setNftContract('');
        setTokenId('');
        setPrice('');
        setBidAmount('');
        setActiveTab('browse');
      }, 2000);
    }
  }, [txStatus.success]);

  const loadListings = async () => {
    setLoading(true);
    try {
      const data = await nftMarketplaceService.getActiveListings();
      setListings(data);
    } catch (error) {
      console.error('Failed to load listings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateListing = async () => {
    if (!nftContract || !tokenId || !price) {
      alert('Please fill in all fields');
      return;
    }
    await createNFTListing(nftContract, tokenId, price);
  };

  const handleBuyNFT = async (listingId: string) => {
    await buyNFT(listingId);
  };

  const handlePlaceBid = async () => {
    if (!selectedListing || !bidAmount) {
      alert('Please enter a bid amount');
      return;
    }
    await placeBidOnNFT(selectedListing, bidAmount);
    setSelectedListing(null);
    setBidAmount('');
  };

  const handleCancelListing = async (listingId: string) => {
    if (confirm('Are you sure you want to cancel this listing?')) {
      await cancelNFTListing(listingId);
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
              🎨 AXIOM NFT Marketplace
            </h1>
            <p className="text-gray-600 mb-6">
              Please connect your wallet to access the NFT marketplace
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
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl shadow-lg p-8 text-white">
          <h1 className="text-4xl font-bold mb-2">🎨 NFT Marketplace</h1>
          <p className="text-purple-100 text-lg">
            Discover, collect, and trade unique digital assets on BSC
          </p>
        </div>

        {/* Information Section */}
        <Card className="border-2 border-purple-200">
          <CardContent className="p-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-6 text-center">
              🎨 Your Gateway to Digital Art & Collectibles
            </h2>
            
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-6 rounded-lg mb-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                What are NFTs?
              </h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                NFTs (Non-Fungible Tokens) are <strong>unique digital items you truly own</strong> - like art, collectibles, 
                or virtual real estate. Unlike screenshots or copies, NFTs are verified on the blockchain, proving YOU are 
                the real owner. Think of it like owning an original painting vs. a poster.
              </p>
              <p className="text-gray-700 leading-relaxed">
                On AXIOM's marketplace, you can buy, sell, and trade NFTs with <strong>lower fees than OpenSea</strong> 
                and instant transactions on Binance Smart Chain. Every sale supports the community - 20% of fees go to KeyGrow!
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6 mb-6">
              <div className="bg-blue-50 p-5 rounded-lg border-2 border-blue-200">
                <div className="text-blue-600 font-bold text-lg mb-2">💰 2.5% Marketplace Fee</div>
                <div className="text-gray-700 text-sm leading-relaxed">
                  We charge just <strong>2.5% on sales</strong> (vs. OpenSea's 2.5% + gas fees). 20% of this fee goes to KeyGrow, 
                  80% to platform treasury. Buyers pay ZERO fees - only sellers pay the 2.5% when their NFT sells.
                </div>
              </div>
              <div className="bg-green-50 p-5 rounded-lg border-2 border-green-200">
                <div className="text-green-600 font-bold text-lg mb-2">⚡ Fast & Cheap</div>
                <div className="text-gray-700 text-sm leading-relaxed">
                  Built on Binance Smart Chain for <strong>instant transactions</strong> and low gas fees (cents, not dollars). 
                  No waiting hours for your NFT to transfer - it happens in seconds!
                </div>
              </div>
              <div className="bg-purple-50 p-5 rounded-lg border-2 border-purple-200">
                <div className="text-purple-600 font-bold text-lg mb-2">🔒 100% Secure</div>
                <div className="text-gray-700 text-sm leading-relaxed">
                  All transactions happen through <strong>audited smart contracts</strong>. Your NFT stays in YOUR wallet 
                  until sold - we never hold custody. You control your assets completely.
                </div>
              </div>
            </div>

            {/* How It Works */}
            <div className="mb-6">
              <h3 className="text-2xl font-bold text-gray-900 mb-4 text-center">
                🚀 How to Buy, Sell, & Bid on NFTs
              </h3>
              <div className="space-y-4">
                <div className="flex gap-4 items-start">
                  <div className="bg-purple-600 text-white rounded-full w-10 h-10 flex items-center justify-center font-bold flex-shrink-0">
                    🛍️
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Buying an NFT (Fixed Price)</h4>
                    <p className="text-gray-700 text-sm">
                      Browse listings, click "Buy Now" on any NFT you like, confirm the transaction in your wallet, 
                      and it's yours! The NFT transfers instantly to your wallet. No bidding, no waiting - simple as online shopping.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4 items-start">
                  <div className="bg-pink-600 text-white rounded-full w-10 h-10 flex items-center justify-center font-bold flex-shrink-0">
                    📝
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Selling Your NFT</h4>
                    <p className="text-gray-700 text-sm">
                      Click "Create Listing", paste your NFT contract address & token ID, set your price in BNB, 
                      and list it! When someone buys it, you receive 97.5% of the sale (2.5% marketplace fee). 
                      You can cancel anytime if it doesn't sell.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4 items-start">
                  <div className="bg-blue-600 text-white rounded-full w-10 h-10 flex items-center justify-center font-bold flex-shrink-0">
                    🏆
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Bidding on NFTs (Auction Style)</h4>
                    <p className="text-gray-700 text-sm">
                      See an NFT you want but price too high? Place a bid! Seller gets notified and can accept or 
                      reject. If accepted, you pay your bid amount. If rejected, no harm - your funds stay safe in your wallet.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4 items-start">
                  <div className="bg-green-600 text-white rounded-full w-10 h-10 flex items-center justify-center font-bold flex-shrink-0">
                    ⚡
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Stake NFTs for Rewards</h4>
                    <p className="text-gray-700 text-sm">
                      Certain NFTs can be staked in our <strong>Advanced Staking</strong> page to earn AXM tokens! 
                      Check the NFT Market tab for "Stakeable" badges. Stake rare NFTs = higher APR rewards.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Fee Breakdown */}
            <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-6 mb-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-3 flex items-center">
                <span className="text-2xl mr-2">💸</span>
                Marketplace Fees Explained (2.5% Total)
              </h3>
              <div className="text-gray-700 leading-relaxed space-y-2">
                <p>
                  <strong>Sellers pay 2.5% when NFT sells:</strong>
                </p>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li>Sell for 10 BNB → You receive <strong>9.75 BNB</strong> (97.5%)</li>
                  <li>0.25 BNB (2.5%) goes to: 80% platform treasury, 20% KeyGrow fund</li>
                </ul>
                <p className="mt-3">
                  <strong>Buyers pay ZERO fees:</strong> The listed price is the exact price you pay. 
                  Just add small gas fees (usually $0.10-$0.50 on BSC).
                </p>
                <p className="mt-3 text-sm text-gray-600">
                  Compare to OpenSea: 2.5% marketplace fee + $20-$100 Ethereum gas fees. 
                  AXIOM saves you HUNDREDS on every transaction!
                </p>
              </div>
            </div>

            {/* NFT Categories */}
            <div className="grid md:grid-cols-4 gap-4 mb-6">
              <div className="bg-gradient-to-br from-red-50 to-orange-50 p-4 rounded-lg border border-red-200 text-center">
                <div className="text-3xl mb-2">🖼️</div>
                <div className="font-semibold text-gray-900">Digital Art</div>
                <div className="text-xs text-gray-600 mt-1">
                  Rare artwork, generative pieces, 1/1 collections
                </div>
              </div>
              <div className="bg-gradient-to-br from-green-50 to-teal-50 p-4 rounded-lg border border-green-200 text-center">
                <div className="text-3xl mb-2">🎮</div>
                <div className="font-semibold text-gray-900">Gaming NFTs</div>
                <div className="text-xs text-gray-600 mt-1">
                  Characters, weapons, virtual land, items
                </div>
              </div>
              <div className="bg-gradient-to-br from-blue-50 to-purple-50 p-4 rounded-lg border border-blue-200 text-center">
                <div className="text-3xl mb-2">🎵</div>
                <div className="font-semibold text-gray-900">Music & Media</div>
                <div className="text-xs text-gray-600 mt-1">
                  Audio NFTs, exclusive tracks, video clips
                </div>
              </div>
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-4 rounded-lg border border-purple-200 text-center">
                <div className="text-3xl mb-2">💎</div>
                <div className="font-semibold text-gray-900">Collectibles</div>
                <div className="text-xs text-gray-600 mt-1">
                  PFPs, limited editions, utility NFTs
                </div>
              </div>
            </div>

            {/* Real Example */}
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-6 rounded-lg border-2 border-purple-300">
              <h3 className="text-xl font-semibold text-gray-900 mb-4 text-center">
                💡 Example: Buying & Selling NFTs on AXIOM
              </h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Scenario: You Buy an NFT</h4>
                  <ul className="text-sm text-gray-700 space-y-1">
                    <li>• See a cool digital art piece listed for <strong>5 BNB</strong></li>
                    <li>• Click "Buy Now", confirm in wallet</li>
                    <li>• Pay: 5 BNB + ~$0.20 gas fee</li>
                    <li>• NFT appears in your wallet instantly! ✅</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Scenario: You Sell Your NFT</h4>
                  <ul className="text-sm text-gray-700 space-y-1">
                    <li>• List your NFT for <strong>5 BNB</strong></li>
                    <li>• Buyer purchases it</li>
                    <li>• You receive: <strong className="text-green-600">4.875 BNB</strong> (97.5%)</li>
                    <li>• 0.125 BNB (2.5%) goes to fees (supports KeyGrow!)</li>
                  </ul>
                </div>
              </div>
              <p className="text-center text-gray-700 mt-4 font-medium">
                Trade NFTs with confidence - transparent fees, instant transfers, community-powered!
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <div className="flex gap-4">
          <button
            onClick={() => setActiveTab('browse')}
            className={`px-6 py-3 rounded-lg font-semibold transition-all ${
              activeTab === 'browse'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            🛍️ Browse Listings ({listings.length})
          </button>
          <button
            onClick={() => setActiveTab('create')}
            className={`px-6 py-3 rounded-lg font-semibold transition-all ${
              activeTab === 'create'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            ➕ Create Listing
          </button>
        </div>

        {/* Transaction Status */}
        {txStatus.loading && (
          <Card>
            <CardContent className="p-6 bg-blue-50">
              <div className="flex items-center gap-3">
                <span className="animate-spin text-2xl">⏳</span>
                <div>
                  <div className="font-medium text-blue-800">Transaction in progress...</div>
                  <div className="text-sm text-blue-600">Please sign the transaction in your wallet</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

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
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-red-800 mb-1">❌ Transaction Failed</div>
                  <div className="text-sm text-red-600">{txStatus.error}</div>
                </div>
                <Button onClick={resetStatus} variant="outline" size="sm">
                  Dismiss
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Browse Listings Tab */}
        {activeTab === 'browse' && (
          <>
            {loading ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <div className="animate-spin text-4xl mb-4">⏳</div>
                  <div className="text-gray-600">Loading NFT listings...</div>
                </CardContent>
              </Card>
            ) : listings.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <div className="text-6xl mb-4">🎨</div>
                  <h3 className="text-2xl font-semibold text-gray-800 mb-2">
                    No Active Listings
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Be the first to list an NFT on the marketplace!
                  </p>
                  <Button
                    onClick={() => setActiveTab('create')}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    Create Listing
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {listings.map((listing) => (
                  <Card key={listing.id} className="overflow-hidden hover:shadow-xl transition-shadow">
                    <div className="bg-gradient-to-br from-purple-100 to-pink-100 h-48 flex items-center justify-center">
                      <div className="text-6xl">🖼️</div>
                    </div>
                    <CardContent className="p-4">
                      <div className="space-y-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="text-xs text-gray-500">NFT #{listing.tokenId}</div>
                            <div className="text-xs text-gray-400 truncate max-w-[150px]">
                              {listing.nftContract}
                            </div>
                          </div>
                          {listing.active && (
                            <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                              Active
                            </span>
                          )}
                        </div>
                        
                        <div className="border-t pt-2">
                          <div className="text-sm text-gray-600">Price</div>
                          <div className="text-2xl font-bold text-purple-600">
                            {parseFloat(listing.price).toFixed(4)} BNB
                          </div>
                          <div className="text-xs text-gray-500">
                            ≈ ${(parseFloat(listing.price) * 600).toFixed(2)} USD
                          </div>
                        </div>

                        <div className="border-t pt-2">
                          <div className="text-xs text-gray-600">Seller</div>
                          <div className="text-xs font-mono text-gray-700">
                            {listing.seller.slice(0, 6)}...{listing.seller.slice(-4)}
                          </div>
                        </div>

                        {account && listing.seller.toLowerCase() === account.toLowerCase() ? (
                          <Button
                            onClick={() => handleCancelListing(listing.id.toString())}
                            disabled={!isReady || txStatus.loading}
                            variant="outline"
                            className="w-full mt-2 border-red-300 text-red-600 hover:bg-red-50"
                          >
                            Cancel Listing
                          </Button>
                        ) : (
                          <div className="flex gap-2 mt-2">
                            <Button
                              onClick={() => handleBuyNFT(listing.id.toString())}
                              disabled={!isReady || txStatus.loading}
                              className="flex-1 bg-purple-600 hover:bg-purple-700"
                            >
                              Buy Now
                            </Button>
                            <Button
                              onClick={() => {
                                setSelectedListing(listing.id.toString());
                                setBidAmount('');
                              }}
                              disabled={!isReady || txStatus.loading}
                              variant="outline"
                              className="flex-1"
                            >
                              Place Bid
                            </Button>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Bid Modal */}
            {selectedListing && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <Card className="max-w-md w-full mx-4">
                  <CardContent className="p-6">
                    <h3 className="text-xl font-semibold text-gray-800 mb-4">
                      Place Bid on NFT #{listings.find(l => l.id.toString() === selectedListing)?.tokenId}
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Bid Amount (BNB)
                        </label>
                        <Input
                          type="number"
                          step="0.0001"
                          placeholder="0.1"
                          value={bidAmount}
                          onChange={(e) => setBidAmount(e.target.value)}
                          className="w-full"
                        />
                        {bidAmount && (
                          <div className="text-sm text-gray-500 mt-1">
                            ≈ ${(parseFloat(bidAmount) * 600).toFixed(2)} USD
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={handlePlaceBid}
                          disabled={!isReady || txStatus.loading || !bidAmount}
                          className="flex-1 bg-purple-600 hover:bg-purple-700"
                        >
                          Submit Bid
                        </Button>
                        <Button
                          onClick={() => {
                            setSelectedListing(null);
                            setBidAmount('');
                          }}
                          variant="outline"
                          className="flex-1"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </>
        )}

        {/* Create Listing Tab */}
        {activeTab === 'create' && (
          <Card>
            <CardContent className="p-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-2">
                List Your NFT for Sale
              </h2>
              <p className="text-gray-600 mb-6">
                Fill in the details below to list your NFT on the marketplace
              </p>

              <div className="space-y-4 max-w-2xl">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    NFT Contract Address
                  </label>
                  <Input
                    type="text"
                    placeholder="0x..."
                    value={nftContract}
                    onChange={(e) => setNftContract(e.target.value)}
                    className="w-full"
                  />
                  <div className="text-xs text-gray-500 mt-1">
                    The smart contract address of your NFT collection
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Token ID
                  </label>
                  <Input
                    type="text"
                    placeholder="1"
                    value={tokenId}
                    onChange={(e) => setTokenId(e.target.value)}
                    className="w-full"
                  />
                  <div className="text-xs text-gray-500 mt-1">
                    The unique identifier of your NFT
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Price (BNB)
                  </label>
                  <Input
                    type="number"
                    step="0.0001"
                    placeholder="0.1"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="w-full"
                  />
                  {price && (
                    <div className="text-sm text-gray-600 mt-1">
                      ≈ ${(parseFloat(price) * 600).toFixed(2)} USD
                    </div>
                  )}
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="text-sm text-yellow-800">
                    <strong>⚠️ Important:</strong> Make sure you have approved the marketplace contract
                    to transfer your NFT before creating a listing.
                  </div>
                </div>

                <Button
                  onClick={handleCreateListing}
                  disabled={!isReady || txStatus.loading || !nftContract || !tokenId || !price}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-lg py-6"
                >
                  {txStatus.loading ? (
                    <>
                      <span className="animate-spin mr-2">⏳</span>
                      Creating Listing...
                    </>
                  ) : (
                    '🎨 Create Listing'
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Marketplace Info */}
        <Card>
          <CardContent className="p-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">
              Marketplace Features
            </h3>
            <div className="grid md:grid-cols-3 gap-4 text-sm">
              <div className="bg-purple-50 p-4 rounded-lg">
                <div className="text-purple-600 font-bold mb-2">💎 Low Fees</div>
                <div className="text-gray-700">
                  Minimal marketplace fees with transparent pricing
                </div>
              </div>
              <div className="bg-pink-50 p-4 rounded-lg">
                <div className="text-pink-600 font-bold mb-2">🔒 Secure Trading</div>
                <div className="text-gray-700">
                  Smart contract-based escrow ensures safe transactions
                </div>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="text-blue-600 font-bold mb-2">⚡ Instant Transfers</div>
                <div className="text-gray-700">
                  NFTs transferred immediately upon purchase completion
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Event Toast Notifications */}
        {toastEvents.map((event, index) => (
          <EventToast
            key={`${event.timestamp}-${index}`}
            event={event}
            onClose={() => setToastEvents(prev => prev.filter((_, i) => i !== index))}
          />
        ))}

        {/* Event Stream Status */}
        {eventStreamConnected && (
          <div className="fixed bottom-4 right-4 bg-green-100 border border-green-300 rounded-full px-3 py-1 text-xs text-green-700 flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            Live Updates Active
          </div>
        )}
      </div>
    </div>
  );
}
