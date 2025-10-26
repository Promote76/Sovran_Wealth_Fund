const axios = require('axios');

class GordianApiService {
  constructor() {
    this.baseUrl = 'https://dataapi-sb.gordian.com';
    this.apiKey = process.env.GORDIAN_API_KEY;
    this.clientId = process.env.GORDIAN_CLIENT_ID;
    this.clientSecret = process.env.GORDIAN_CLIENT_SECRET;
    this.accessToken = null;
    this.tokenExpiry = null;
  }

  isConfigured() {
    return !!(this.apiKey || (this.clientId && this.clientSecret));
  }

  async authenticate() {
    if (!this.isConfigured()) {
      throw new Error('Gordian API credentials not configured');
    }

    if (this.accessToken && this.tokenExpiry && Date.now() < this.tokenExpiry) {
      return this.accessToken;
    }

    if (this.apiKey) {
      this.accessToken = this.apiKey;
      this.tokenExpiry = Date.now() + (24 * 60 * 60 * 1000);
      return this.accessToken;
    }

    console.log('🔐 Authenticating with Gordian API...');
    return this.accessToken;
  }

  async makeRequest(endpoint, params = {}) {
    try {
      await this.authenticate();

      const response = await axios.get(`${this.baseUrl}${endpoint}`, {
        params,
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      return response.data;
    } catch (error) {
      console.error(`Gordian API error (${endpoint}):`, error.response?.data || error.message);
      throw error;
    }
  }

  async getRepairCostEstimate(propertyType, squareFeet, yearBuilt, condition, locationId = 'us-us-national') {
    if (!this.isConfigured()) {
      return null;
    }

    try {
      const currentYear = new Date().getFullYear();
      const age = currentYear - yearBuilt;

      const renovationLevel = this.determineRenovationLevel(age, condition);
      
      const modelId = this.getModelIdForPropertyType(propertyType);

      const costData = await this.makeRequest(
        `/v1/squarefootmodel/commercial/constructconnect/cost/${modelId}`,
        {
          area: squareFeet,
          renovationLevel,
          locationId,
          laborType: 'std'
        }
      );

      return this.parseRepairCostData(costData, squareFeet);
    } catch (error) {
      console.error('Failed to get repair cost from Gordian:', error.message);
      return null;
    }
  }

  async getUnitCostData(searchTerm, locationId = 'us-us-national', laborType = 'std') {
    if (!this.isConfigured()) {
      return null;
    }

    try {
      const data = await this.makeRequest('/v1/costdata/unit/catalogs', {
        searchTerm,
        locationId,
        laborType,
        measurementSystem: 'imp'
      });

      return data;
    } catch (error) {
      console.error('Failed to get unit cost data:', error.message);
      return null;
    }
  }

  async getLocationFactors(zipCode) {
    if (!this.isConfigured()) {
      return null;
    }

    try {
      const locationId = zipCode.substring(0, 3);
      
      const data = await this.makeRequest('/v1/costdata/unit/costfactors', {
        locationId
      });

      return data;
    } catch (error) {
      console.error('Failed to get location factors:', error.message);
      return null;
    }
  }

  determineRenovationLevel(age, condition) {
    if (age < 10 && condition === 'Excellent') return '01';
    if (age < 20 && condition === 'Good') return '02';
    if (age < 30 && condition === 'Fair') return '03';
    if (age < 50 || condition === 'Poor') return '04';
    return '05';
  }

  getModelIdForPropertyType(propertyType) {
    const currentYear = new Date().getFullYear();
    
    const modelMap = {
      'Single Family': `${currentYear}-001`,
      'Townhouse': `${currentYear}-002`,
      'Condo': `${currentYear}-003`,
      'Multi-Family': `${currentYear}-004`
    };

    return modelMap[propertyType] || `${currentYear}-001`;
  }

  parseRepairCostData(costData, squareFeet) {
    if (!costData || !costData.cost) {
      return null;
    }

    const totalCost = costData.cost.total || 0;
    const costPerSqFt = squareFeet > 0 ? totalCost / squareFeet : 0;

    const variance = 0.15;
    const low = Math.round(totalCost * (1 - variance));
    const high = Math.round(totalCost * (1 + variance));

    return {
      estimated: Math.round(totalCost),
      low,
      high,
      costPerSquareFoot: Math.round(costPerSqFt * 100) / 100,
      confidence: 'high',
      source: 'gordian_rsmeans',
      methodology: 'RSMeans construction cost database',
      breakdown: {
        labor: costData.cost?.labor || 0,
        material: costData.cost?.material || 0,
        equipment: costData.cost?.equipment || 0
      },
      note: 'Professional construction cost estimate from RSMeans data'
    };
  }

  zipToLocationId(zip) {
    if (!zip) return 'us-us-national';
    return zip.substring(0, 3);
  }
}

module.exports = new GordianApiService();
