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
  facts: any;
  propertyFacts: any;
  marketData: any;
  neighborhoodScores: any;
  highlights?: string;
}

const DealDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [deal, setDeal] = useState<Deal | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [fractionalProperty, setFractionalProperty] = useState<any>(null);
  const [fractionalLoading, setFractionalLoading] = useState(false);

  useEffect(() => {
    loadDeal();
  }, [id]);

  useEffect(() => {
    if (deal) {
      checkFractionalization();
    }
  }, [deal]);

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

  const checkFractionalization = async () => {
    setFractionalLoading(true);
    try {
      const response = await fetch('/api/fractional/properties');
      const data = await response.json();
      if (data.success) {
        const fractional = (data.properties || []).find((p: any) => p.deal_id === id);
        setFractionalProperty(fractional);
      }
    } catch (err) {
      console.error('Failed to check fractionalization:', err);
    } finally {
      setFractionalLoading(false);
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
  
  // Extract property facts from parsed (parser output) or facts field (enrichment) or propertyFacts (legacy)
  const getPropertyDetails = () => {
    // Priority 1: Check parsed data from parser (most reliable for user-pasted data)
    if (deal.parsed) {
      return {
        beds: deal.parsed.beds || null,
        baths: deal.parsed.baths || null,
        sqft: deal.parsed.squareFeet || null,
        yearBuilt: deal.parsed.yearBuilt || null,
        condition: deal.parsed.condition || null,
        propertyType: deal.parsed.propertyType || null,
        lotSize: deal.parsed.lotSize || null,
        garage: deal.parsed.garage || null,
        parking: deal.parsed.parking || null,
        hasPool: deal.parsed.hasPool || null,
        hasBasement: deal.parsed.hasBasement || null,
        hasFireplace: deal.parsed.hasFireplace || null,
        stories: deal.parsed.stories || null,
        monthlyRent: deal.parsed.monthlyRent || null,
        occupancy: deal.parsed.occupancy || null,
        hoaFees: deal.parsed.hoaFees || null,
        propertyTax: deal.parsed.propertyTax || null,
        daysOnMarket: deal.parsed.daysOnMarket || null
      };
    }
    
    // Priority 2: Check enriched facts
    if (deal.facts) {
      return {
        beds: deal.facts.bedrooms,
        baths: deal.facts.bathrooms,
        sqft: deal.facts.squareFeet,
        yearBuilt: deal.facts.yearBuilt,
        condition: deal.facts.condition,
        propertyType: deal.facts.propertyType
      };
    }
    
    // Priority 3: Legacy propertyFacts
    if (deal.propertyFacts) {
      return {
        beds: deal.propertyFacts.bedrooms,
        baths: deal.propertyFacts.bathrooms,
        sqft: deal.propertyFacts.squareFeet,
        yearBuilt: deal.propertyFacts.yearBuilt,
        condition: deal.propertyFacts.condition,
        propertyType: deal.propertyFacts.propertyType
      };
    }
    
    // Priority 4: Try to parse from repairs notes
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

        {/* Fractional Investment Status */}
        {!fractionalLoading && fractionalProperty && (
          <Card className="mb-6 border-2 border-purple-500 bg-gradient-to-br from-purple-50 to-white">
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-2xl font-bold text-purple-900 mb-2">
                    🏢 Fractional Investment Available
                  </h2>
                  <p className="text-gray-600">
                    This property is available for fractional ownership with as little as $500
                  </p>
                </div>
                <span className="bg-purple-100 text-purple-800 px-4 py-2 rounded-full text-sm font-semibold">
                  ✅ FRACTIONALIZED
                </span>
              </div>

              <div className="grid md:grid-cols-4 gap-4 mb-4">
                <div className="bg-white p-4 rounded-lg border border-purple-200">
                  <div className="text-sm text-gray-600 mb-1">Share Price</div>
                  <div className="text-2xl font-bold text-purple-600">
                    {formatCurrency(fractionalProperty.share_price)}
                  </div>
                </div>
                <div className="bg-white p-4 rounded-lg border border-purple-200">
                  <div className="text-sm text-gray-600 mb-1">Shares Available</div>
                  <div className="text-2xl font-bold text-blue-600">
                    {fractionalProperty.shares_available?.toLocaleString() || 0}
                  </div>
                  <div className="text-xs text-gray-500">of {fractionalProperty.total_shares?.toLocaleString()}</div>
                </div>
                <div className="bg-white p-4 rounded-lg border border-purple-200">
                  <div className="text-sm text-gray-600 mb-1">Monthly Income</div>
                  <div className="text-2xl font-bold text-green-600">
                    {formatCurrency(fractionalProperty.net_monthly_income || 0)}
                  </div>
                </div>
                <div className="bg-white p-4 rounded-lg border border-purple-200">
                  <div className="text-sm text-gray-600 mb-1">Annual Yield</div>
                  <div className="text-2xl font-bold text-orange-600">
                    {((fractionalProperty.net_monthly_income * 12 / fractionalProperty.property_value) * 100).toFixed(1)}%
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={() => navigate('/real-estate-investor')}
                  className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-bold text-lg py-6"
                >
                  🏢 Invest in Fractional Shares
                </Button>
                <Button
                  onClick={() => navigate('/real-estate-investor')}
                  variant="outline"
                  className="px-6 border-purple-300 text-purple-700 hover:bg-purple-50"
                >
                  View All Properties
                </Button>
              </div>

              <div className="mt-4 grid grid-cols-4 gap-2 text-xs">
                <div className="bg-blue-50 px-3 py-2 rounded text-center">
                  <div className="font-semibold text-blue-800">Retail +0%</div>
                  <div className="text-gray-600">$500-$10K</div>
                </div>
                <div className="bg-purple-50 px-3 py-2 rounded text-center">
                  <div className="font-semibold text-purple-800">Accredited +2%</div>
                  <div className="text-gray-600">$10K-$100K</div>
                </div>
                <div className="bg-orange-50 px-3 py-2 rounded text-center">
                  <div className="font-semibold text-orange-800">Premium +5%</div>
                  <div className="text-gray-600">$100K-$500K</div>
                </div>
                <div className="bg-red-50 px-3 py-2 rounded text-center">
                  <div className="font-semibold text-red-800">Institutional +8%</div>
                  <div className="text-gray-600">$500K+</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column - Images & Gallery */}
          <div className="lg:col-span-2 space-y-6">
            {/* Main Image */}
            <Card>
              <CardContent className="p-0">
                {deal.media && deal.media.length > 0 ? (
                  <>
                    <img
                      src={deal.media[selectedImage]?.url || deal.media[selectedImage]}
                      alt={`Property ${selectedImage + 1}`}
                      className="w-full h-96 object-cover rounded-t-lg"
                    />
                    {deal.media.length > 1 && (
                      <div className="p-4 grid grid-cols-4 gap-2">
                        {deal.media.map((img, idx) => (
                          <img
                            key={idx}
                            src={img?.url || img}
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
                  {propertyDetails?.lotSize && (
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="text-sm text-gray-500">Lot Size</div>
                      <div className="text-lg font-bold">
                        {propertyDetails.lotSize.value} {propertyDetails.lotSize.unit}
                      </div>
                    </div>
                  )}
                  {propertyDetails?.occupancy && (
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="text-sm text-gray-500">Occupancy</div>
                      <div className="text-lg font-bold">{propertyDetails.occupancy}</div>
                    </div>
                  )}
                  {propertyDetails?.garage && (
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="text-sm text-gray-500">Garage</div>
                      <div className="text-lg font-bold">{propertyDetails.garage} car</div>
                    </div>
                  )}
                  {propertyDetails?.parking && (
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="text-sm text-gray-500">Parking</div>
                      <div className="text-lg font-bold">{propertyDetails.parking} spaces</div>
                    </div>
                  )}
                  {propertyDetails?.stories && (
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="text-sm text-gray-500">Stories</div>
                      <div className="text-lg font-bold">{propertyDetails.stories}</div>
                    </div>
                  )}
                  {propertyDetails?.monthlyRent && (
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="text-sm text-gray-500">Monthly Rent</div>
                      <div className="text-lg font-bold">{formatCurrency(propertyDetails.monthlyRent)}/mo</div>
                    </div>
                  )}
                  {propertyDetails?.hoaFees !== null && propertyDetails?.hoaFees !== undefined && (
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="text-sm text-gray-500">HOA Fees</div>
                      <div className="text-lg font-bold">
                        {propertyDetails.hoaFees === 0 ? 'None' : `${formatCurrency(propertyDetails.hoaFees)}/mo`}
                      </div>
                    </div>
                  )}
                  {propertyDetails?.propertyTax && (
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="text-sm text-gray-500">Property Tax</div>
                      <div className="text-lg font-bold">{formatCurrency(propertyDetails.propertyTax)}/yr</div>
                    </div>
                  )}
                  {propertyDetails?.daysOnMarket && (
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="text-sm text-gray-500">Days on Market</div>
                      <div className="text-lg font-bold">{propertyDetails.daysOnMarket} days</div>
                    </div>
                  )}
                </div>
                
                {/* Property Features */}
                {(propertyDetails?.hasPool || propertyDetails?.hasBasement || propertyDetails?.hasFireplace) && (
                  <div className="mt-6">
                    <h3 className="text-lg font-semibold mb-3">Features</h3>
                    <div className="flex flex-wrap gap-2">
                      {propertyDetails.hasPool && (
                        <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-semibold">
                          🏊 Pool
                        </span>
                      )}
                      {propertyDetails.hasBasement && (
                        <span className="bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-sm font-semibold">
                          🏠 Basement {typeof propertyDetails.hasBasement === 'string' ? `(${propertyDetails.hasBasement})` : ''}
                        </span>
                      )}
                      {propertyDetails.hasFireplace && (
                        <span className="bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-sm font-semibold">
                          🔥 Fireplace
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Property Highlights */}
            {deal.parsed?.highlights && (
              <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-white">
                <CardContent className="p-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <span className="text-2xl">✨</span>
                    Property Highlights
                  </h2>
                  <div className="prose prose-blue max-w-none">
                    <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                      {deal.parsed.highlights}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

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
