import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';

interface Deal {
  id: string;
  parsed: any;
  repairs: any;
  analysis: any;
  rents: any;
  media: any[];
  status: string;
  createdAt: string;
  predictions: any;
  geocoding: any;
  propertyFacts: any;
  marketData: any;
  neighborhoodScores: any;
}

const DealDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [deal, setDeal] = useState<Deal | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);

  useEffect(() => {
    loadDeal();
  }, [id]);

  const loadDeal = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/deals/${id}`);
      const data = await response.json();
      if (data.success) {
        setDeal(data.data);
      }
    } catch (err) {
      console.error('Failed to load deal:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(value);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading property details...</p>
        </div>
      </div>
    );
  }

  if (!deal) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🏚️</div>
          <p className="text-gray-600 mb-4">Property not found</p>
          <Button onClick={() => navigate('/deals')} className="bg-blue-600 hover:bg-blue-700">
            Back to Marketplace
          </Button>
        </div>
      </div>
    );
  }

  const isRTOReady = deal.analysis?.rtoBadge === 'green';
  const midRepairAnalysis = deal.analysis?.maoByRepair?.[1];
  
  // Calculate profit margin if not present (for old deals)
  const profitMargin = midRepairAnalysis?.profitMargin ?? 
    (deal.parsed?.arv && deal.parsed?.asking && deal.repairs?.estMid ? 
      deal.parsed.arv - (deal.parsed.asking + deal.repairs.estMid) : 0);
  
  // Extract property facts from predictions or repairs notes if propertyFacts is null
  const getPropertyDetails = () => {
    if (deal.propertyFacts) return deal.propertyFacts;
    
    // Try to parse from repairs notes
    const notesStr = deal.repairs?.notes?.join(' ') || '';
    const sqftMatch = notesStr.match(/(\d+)\s*sqft/i);
    const ageMatch = notesStr.match(/(\d+)\s*years?\s*old/i);
    const conditionMatch = notesStr.match(/(Good|Fair|Poor|Excellent)\s*condition/i);
    
    return {
      sqft: sqftMatch ? parseInt(sqftMatch[1]) : null,
      yearBuilt: ageMatch ? new Date().getFullYear() - parseInt(ageMatch[1]) : null,
      condition: conditionMatch ? conditionMatch[1] : null,
      beds: deal.predictions?.beds || null,
      baths: deal.predictions?.baths || null,
      propertyType: deal.predictions?.propertyType || 'Single Family'
    };
  };
  
  const propertyDetails = getPropertyDetails();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      <div className="container mx-auto p-4 max-w-6xl">
        {/* Back Button */}
        <Button
          onClick={() => navigate('/deals')}
          variant="outline"
          className="mb-4"
        >
          ← Back to Marketplace
        </Button>

        {/* Property Header */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  {deal.parsed?.address}
                </h1>
                <p className="text-xl text-gray-600">
                  {deal.parsed?.city}, {deal.parsed?.state} {deal.parsed?.zip}
                </p>
              </div>
              <div className="flex gap-2">
                {isRTOReady && (
                  <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-semibold">
                    ✅ RTO-READY
                  </span>
                )}
                <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-semibold">
                  💎 INVESTOR DEAL
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column - Images & Gallery */}
          <div className="lg:col-span-2 space-y-6">
            {/* Main Image */}
            <Card>
              <CardContent className="p-0">
                {deal.media && deal.media.length > 0 ? (
                  <>
                    <img
                      src={deal.media[selectedImage]}
                      alt={`Property ${selectedImage + 1}`}
                      className="w-full h-96 object-cover rounded-t-lg"
                    />
                    {deal.media.length > 1 && (
                      <div className="p-4 grid grid-cols-4 gap-2">
                        {deal.media.map((img, idx) => (
                          <img
                            key={idx}
                            src={img}
                            alt={`Thumbnail ${idx + 1}`}
                            className={`h-20 object-cover rounded cursor-pointer border-2 ${
                              idx === selectedImage ? 'border-blue-600' : 'border-gray-300'
                            }`}
                            onClick={() => setSelectedImage(idx)}
                          />
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="w-full h-96 bg-gray-200 flex items-center justify-center rounded-t-lg">
                    <div className="text-8xl">🏠</div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Property Details */}
            <Card>
              <CardContent className="p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Property Details</h2>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="text-sm text-gray-500">Bedrooms</div>
                    <div className="text-lg font-bold">{propertyDetails?.beds || 'N/A'}</div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="text-sm text-gray-500">Bathrooms</div>
                    <div className="text-lg font-bold">{propertyDetails?.baths || 'N/A'}</div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="text-sm text-gray-500">Square Feet</div>
                    <div className="text-lg font-bold">{propertyDetails?.sqft?.toLocaleString() || 'N/A'}</div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="text-sm text-gray-500">Year Built</div>
                    <div className="text-lg font-bold">{propertyDetails?.yearBuilt || 'N/A'}</div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="text-sm text-gray-500">Property Type</div>
                    <div className="text-lg font-bold">{propertyDetails?.propertyType || 'N/A'}</div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="text-sm text-gray-500">Condition</div>
                    <div className="text-lg font-bold">{propertyDetails?.condition || 'N/A'}</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Investment Analysis */}
            <Card>
              <CardContent className="p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Investment Analysis</h2>
                
                {/* Repair Scenarios */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-3">Maximum Allowable Offer (MAO) by Repair Level</h3>
                  <div className="space-y-2">
                    {deal.analysis?.maoByRepair?.map((scenario: any, idx: number) => {
                      const scenarioProfit = scenario.profitMargin ?? 
                        (deal.parsed?.arv && deal.parsed?.asking && scenario.repair ? 
                          deal.parsed.arv - (deal.parsed.asking + scenario.repair) : 0);
                      
                      return (
                        <div key={idx} className="bg-gray-50 p-4 rounded-lg">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <div className="font-semibold text-gray-700">
                                {['Light', 'Medium', 'Heavy'][idx]} Repairs
                              </div>
                              <div className="text-sm text-gray-500">
                                Est. Cost: {formatCurrency(scenario.repair)}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-lg font-bold text-purple-600">
                                MAO: {formatCurrency(scenario.mao)}
                              </div>
                              <div className="text-sm font-semibold text-orange-600">
                                ROI: {scenario.roi?.toFixed(1)}%
                              </div>
                            </div>
                          </div>
                          <div className="pt-2 border-t border-gray-200 flex justify-between items-center">
                            <span className="text-sm text-gray-600">Profit Margin:</span>
                            <span className="text-lg font-bold text-yellow-600">
                              {formatCurrency(scenarioProfit)}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Rental Analysis */}
                {deal.rents && (
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Rental Income Potential</h3>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="bg-green-50 p-4 rounded-lg border-2 border-green-200">
                        <div className="text-sm text-gray-600">Market Rent Estimate</div>
                        <div className="text-2xl font-bold text-green-600">
                          {formatCurrency(deal.rents.marketRentEst)}/mo
                        </div>
                      </div>
                      <div className="bg-blue-50 p-4 rounded-lg border-2 border-blue-200">
                        <div className="text-sm text-gray-600">Annual Income</div>
                        <div className="text-2xl font-bold text-blue-600">
                          {formatCurrency(deal.rents.marketRentEst * 12)}/yr
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Pricing & Actions */}
          <div className="space-y-6">
            {/* Pricing Summary */}
            <Card className="border-2 border-blue-200">
              <CardContent className="p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Pricing</h2>
                <div className="space-y-4">
                  <div>
                    <div className="text-sm text-gray-500">Asking Price</div>
                    <div className="text-3xl font-bold text-blue-600">
                      {formatCurrency(deal.parsed?.asking)}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">After Repair Value (ARV)</div>
                    <div className="text-2xl font-bold text-green-600">
                      {formatCurrency(deal.parsed?.arv)}
                    </div>
                  </div>
                  <div className="pt-4 border-t">
                    <div className="text-sm text-gray-500">Estimated Repairs</div>
                    <div className="text-xl font-bold text-gray-700">
                      {formatCurrency(deal.repairs?.estMid || 0)}
                    </div>
                  </div>
                  <div className="bg-yellow-50 p-3 rounded-lg border-2 border-yellow-200">
                    <div className="text-sm text-gray-600 font-semibold">💰 Profit Margin</div>
                    <div className="text-2xl font-bold text-yellow-600">
                      {formatCurrency(profitMargin)}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      ARV - (Asking + Repairs)
                    </div>
                  </div>
                  <div className="pt-4 border-t">
                    <div className="text-sm text-gray-500">Recommended MAO (Mid Repairs)</div>
                    <div className="text-2xl font-bold text-purple-600">
                      {formatCurrency(midRepairAnalysis?.mao || 0)}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Potential ROI</div>
                    <div className="text-2xl font-bold text-orange-600">
                      {midRepairAnalysis?.roi?.toFixed(1) || 0}%
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Contact Info */}
            {deal.parsed?.contact && (
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-4">Contact Seller</h2>
                  {deal.parsed.contact.name && (
                    <p className="text-gray-700 mb-2">
                      <strong>Name:</strong> {deal.parsed.contact.name}
                    </p>
                  )}
                  {deal.parsed.contact.phone && (
                    <p className="text-gray-700 mb-2">
                      <strong>Phone:</strong> {deal.parsed.contact.phone}
                    </p>
                  )}
                  {deal.parsed.contact.email && (
                    <p className="text-gray-700">
                      <strong>Email:</strong> {deal.parsed.contact.email}
                    </p>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Neighborhood Scores */}
            {deal.neighborhoodScores && (
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-4">Neighborhood</h2>
                  <div className="space-y-3">
                    {deal.neighborhoodScores.walkScore && (
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Walk Score</span>
                        <span className="font-bold">{deal.neighborhoodScores.walkScore}/100</span>
                      </div>
                    )}
                    {deal.neighborhoodScores.crimeRating && (
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Crime Rating</span>
                        <span className="font-bold">{deal.neighborhoodScores.crimeRating}/10</span>
                      </div>
                    )}
                    {deal.neighborhoodScores.schoolQuality && (
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">School Quality</span>
                        <span className="font-bold">{deal.neighborhoodScores.schoolQuality}/10</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Action Buttons */}
            <Card className="bg-gradient-to-r from-blue-500 to-blue-600">
              <CardContent className="p-6 text-center">
                <h3 className="text-white text-xl font-bold mb-4">Interested in this property?</h3>
                <Button
                  onClick={() => navigate('/investor-register')}
                  className="w-full bg-white hover:bg-blue-50 text-blue-600 font-bold mb-3"
                >
                  🚀 Become an Investor
                </Button>
                {isRTOReady && (
                  <Button
                    onClick={() => navigate('/keygrow')}
                    className="w-full bg-green-600 hover:bg-green-700 text-white font-bold"
                  >
                    🏡 Apply for Rent-to-Own
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DealDetailPage;
