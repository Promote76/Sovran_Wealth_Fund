const axios = require('axios');

class EnrichmentService {
  async geocodeAddress(address, city, state, zip) {
    const fullAddress = `${address}, ${city}, ${state} ${zip}`;
    
    try {
      const response = await axios.get('https://nominatim.openstreetmap.org/search', {
        params: {
          q: fullAddress,
          format: 'json',
          limit: 1,
          countrycodes: 'us'
        },
        headers: {
          'User-Agent': 'AXIOM-IELA/1.0'
        }
      });

      if (response.data && response.data.length > 0) {
        const result = response.data[0];
        return {
          latitude: parseFloat(result.lat),
          longitude: parseFloat(result.lon),
          displayName: result.display_name,
          boundingBox: result.boundingbox,
          type: result.type,
          importance: result.importance
        };
      }

      return null;
    } catch (error) {
      console.error('Geocoding error:', error.message);
      return null;
    }
  }

  async getPropertyFacts(address, city, state, zip) {
    try {
      const addressSeed = this.hashAddress(address, city, state);
      
      const estimatedFacts = {
        bedrooms: this.estimateBedrooms(addressSeed),
        bathrooms: this.estimateBathrooms(addressSeed),
        squareFeet: this.estimateSquareFeet(addressSeed),
        lotSize: this.estimateLotSize(addressSeed),
        yearBuilt: this.estimateYearBuilt(addressSeed),
        propertyType: this.estimatePropertyType(addressSeed),
        stories: 1,
        garage: true,
        pool: false,
        condition: 'Fair',
        source: 'estimated',
        confidence: 'low',
        note: 'Property facts estimated using deterministic heuristics. Connect to Attom Data, CoreLogic, or Zillow API for accurate data.'
      };

      return estimatedFacts;
    } catch (error) {
      console.error('Property facts error:', error.message);
      return null;
    }
  }

  async getMarketData(city, state, zip) {
    try {
      const marketData = {
        medianHomeValue: this.estimateMedianValue(state),
        medianRent: this.estimateMedianRent(state),
        appreciation: 3.5,
        daysOnMarket: 45,
        inventoryLevel: 'moderate',
        marketTrend: 'stable',
        competitionLevel: 'moderate',
        source: 'state_baseline',
        confidence: 'low',
        note: 'Market data based on state averages. Connect to Zillow, Redfin, or Realtor.com API for accurate local data.'
      };

      return marketData;
    } catch (error) {
      console.error('Market data error:', error.message);
      return null;
    }
  }

  async getNeighborhoodScore(latitude, longitude) {
    try {
      const locationSeed = this.hashLocation(latitude, longitude);
      
      const scores = {
        walkScore: this.generateScore(locationSeed, 30, 70),
        crimeScore: this.generateScore(locationSeed + 1, 50, 80),
        schoolScore: this.generateScore(locationSeed + 2, 50, 80),
        amenitiesScore: this.generateScore(locationSeed + 3, 50, 80),
        overall: 'C',
        source: 'estimated',
        confidence: 'low',
        note: 'Neighborhood scores estimated using location-based heuristics. Connect to WalkScore, CrimeReports, or GreatSchools API for accurate data.'
      };

      scores.overall = this.calculateOverallGrade([
        scores.walkScore,
        scores.crimeScore,
        scores.schoolScore,
        scores.amenitiesScore
      ]);

      return scores;
    } catch (error) {
      console.error('Neighborhood score error:', error.message);
      return null;
    }
  }

  hashAddress(address, city, state) {
    const str = `${address}${city}${state}`.toLowerCase().replace(/\s/g, '');
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      hash = hash & hash;
    }
    return Math.abs(hash);
  }

  hashLocation(latitude, longitude) {
    const str = `${latitude.toFixed(4)}${longitude.toFixed(4)}`;
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      hash = hash & hash;
    }
    return Math.abs(hash);
  }

  generateScore(seed, min, max) {
    const normalized = (seed % 100) / 100;
    return Math.floor(min + normalized * (max - min));
  }

  estimateBedrooms(seed) {
    const val = seed % 100;
    if (val < 30) return 2;
    if (val < 70) return 3;
    return 4;
  }

  estimateBathrooms(seed) {
    const val = seed % 100;
    if (val < 40) return 1;
    if (val < 70) return 1.5;
    if (val < 90) return 2;
    return 2.5;
  }

  estimateSquareFeet(seed) {
    return 1200 + (seed % 1000);
  }

  estimateLotSize(seed) {
    return 5000 + (seed % 5000);
  }

  estimateYearBuilt(seed) {
    return 1950 + (seed % 70);
  }

  estimatePropertyType(seed) {
    const types = ['Single Family', 'Townhouse', 'Condo', 'Multi-Family'];
    return types[seed % types.length];
  }

  estimateMedianValue(state) {
    const stateValues = {
      'GA': 295000,
      'FL': 385000,
      'TX': 315000,
      'CA': 725000,
      'NY': 445000,
      'default': 350000
    };
    return stateValues[state] || stateValues.default;
  }

  estimateMedianRent(state) {
    const stateRents = {
      'GA': 1750,
      'FL': 2100,
      'TX': 1850,
      'CA': 2900,
      'NY': 2500,
      'default': 1800
    };
    return stateRents[state] || stateRents.default;
  }

  calculateOverallGrade(scores) {
    const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
    if (avg >= 80) return 'A';
    if (avg >= 70) return 'B';
    if (avg >= 60) return 'C';
    if (avg >= 50) return 'D';
    return 'F';
  }

  async enrichDeal(dealData) {
    const enrichments = {};

    if (dealData.parsed?.address && dealData.parsed?.city && dealData.parsed?.state) {
      const geocoding = await this.geocodeAddress(
        dealData.parsed.address,
        dealData.parsed.city,
        dealData.parsed.state,
        dealData.parsed.zip
      );

      if (geocoding) {
        enrichments.geocoding = geocoding;

        const neighborhoodScore = await this.getNeighborhoodScore(
          geocoding.latitude,
          geocoding.longitude
        );
        enrichments.neighborhoodScore = neighborhoodScore;
      }

      const propertyFacts = await this.getPropertyFacts(
        dealData.parsed.address,
        dealData.parsed.city,
        dealData.parsed.state,
        dealData.parsed.zip
      );
      enrichments.propertyFacts = propertyFacts;

      const marketData = await this.getMarketData(
        dealData.parsed.city,
        dealData.parsed.state,
        dealData.parsed.zip
      );
      enrichments.marketData = marketData;
    }

    enrichments.enrichedAt = new Date().toISOString();

    return enrichments;
  }
}

module.exports = new EnrichmentService();
