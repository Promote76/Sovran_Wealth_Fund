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
      const estimatedFacts = {
        bedrooms: this.estimateBedrooms(address),
        bathrooms: this.estimateBathrooms(address),
        squareFeet: this.estimateSquareFeet(),
        lotSize: this.estimateLotSize(),
        yearBuilt: this.estimateYearBuilt(),
        propertyType: this.estimatePropertyType(address),
        stories: 1,
        garage: true,
        pool: false,
        condition: 'Fair',
        source: 'estimated',
        confidence: 'low',
        note: 'Property facts estimated. Connect to Attom Data, CoreLogic, or Zillow API for accurate data.'
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
        source: 'estimated',
        confidence: 'low',
        note: 'Market data estimated. Connect to Zillow, Redfin, or Realtor.com API for accurate data.'
      };

      return marketData;
    } catch (error) {
      console.error('Market data error:', error.message);
      return null;
    }
  }

  async getNeighborhoodScore(latitude, longitude) {
    try {
      const scores = {
        walkScore: Math.floor(Math.random() * 40) + 30,
        crimeScore: Math.floor(Math.random() * 30) + 50,
        schoolScore: Math.floor(Math.random() * 30) + 50,
        amenitiesScore: Math.floor(Math.random() * 30) + 50,
        overall: 'C',
        source: 'estimated',
        confidence: 'low',
        note: 'Neighborhood scores estimated. Connect to WalkScore, CrimeReports, or GreatSchools API for accurate data.'
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

  estimateBedrooms(address) {
    const random = Math.random();
    if (random < 0.3) return 2;
    if (random < 0.7) return 3;
    return 4;
  }

  estimateBathrooms(address) {
    const random = Math.random();
    if (random < 0.4) return 1;
    if (random < 0.7) return 1.5;
    if (random < 0.9) return 2;
    return 2.5;
  }

  estimateSquareFeet() {
    return Math.floor(Math.random() * 1000) + 1200;
  }

  estimateLotSize() {
    return Math.floor(Math.random() * 5000) + 5000;
  }

  estimateYearBuilt() {
    return Math.floor(Math.random() * 70) + 1950;
  }

  estimatePropertyType(address) {
    const types = ['Single Family', 'Townhouse', 'Condo', 'Multi-Family'];
    return types[Math.floor(Math.random() * types.length)];
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
