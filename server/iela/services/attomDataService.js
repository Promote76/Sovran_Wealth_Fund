const axios = require('axios');

class AttomDataService {
  constructor() {
    this.baseUrl = 'https://api.gateway.attomdata.com';
    this.apiKey = process.env.ATTOM_API_KEY;
  }

  isConfigured() {
    return !!this.apiKey;
  }

  async makeRequest(endpoint, params = {}) {
    if (!this.isConfigured()) {
      return null;
    }

    try {
      const response = await axios.get(`${this.baseUrl}${endpoint}`, {
        params,
        headers: {
          'Accept': 'application/json',
          'apikey': this.apiKey
        }
      });

      return response.data;
    } catch (error) {
      console.error(`Attom Data API error (${endpoint}):`, error.response?.data || error.message);
      throw error;
    }
  }

  async getPropertyDetails(address, city, state, zip) {
    if (!this.isConfigured()) {
      return null;
    }

    try {
      const fullAddress = `${address}, ${city}, ${state} ${zip}`;
      
      const data = await this.makeRequest('/propertyapi/v1.0.0/property/detail', {
        address1: address,
        address2: `${city}, ${state} ${zip}`
      });

      if (data && data.property && data.property.length > 0) {
        return this.parsePropertyData(data.property[0]);
      }

      return null;
    } catch (error) {
      console.error('Failed to get property details from Attom:', error.message);
      return null;
    }
  }

  async getPropertyAVM(address, city, state, zip) {
    if (!this.isConfigured()) {
      return null;
    }

    try {
      const data = await this.makeRequest('/propertyapi/v1.0.0/avm/detail', {
        address1: address,
        address2: `${city}, ${state} ${zip}`
      });

      if (data && data.property && data.property.length > 0) {
        return this.parseAVMData(data.property[0]);
      }

      return null;
    } catch (error) {
      console.error('Failed to get AVM from Attom:', error.message);
      return null;
    }
  }

  parsePropertyData(property) {
    const building = property.building || {};
    const lot = property.lot || {};
    const summary = property.summary || {};

    return {
      bedrooms: building.rooms?.beds || null,
      bathrooms: building.rooms?.bathstotal || null,
      squareFeet: building.size?.bldgsize || null,
      lotSize: lot.lotsize2 || null,
      yearBuilt: building.summary?.yearbuilt || null,
      propertyType: summary.proptype || null,
      stories: building.construction?.stories || null,
      garage: building.parking?.prkgspaces > 0 || false,
      pool: building.amenities?.pool === 'Y' || false,
      condition: building.summary?.condition || 'Unknown',
      basement: building.basement?.bsmtsize > 0 || false,
      roofType: building.construction?.roofcover || null,
      exteriorWalls: building.construction?.walltype || null,
      heating: building.interior?.heattype || null,
      cooling: building.interior?.cooltype || null,
      source: 'attom_data',
      confidence: 'high',
      note: 'Official property data from Attom Data Solutions'
    };
  }

  parseAVMData(property) {
    const avm = property.avm || {};
    
    return {
      estimatedValue: avm.amount?.value || null,
      valueLow: avm.amount?.valueLow || null,
      valueHigh: avm.amount?.valueHigh || null,
      fsdCode: avm.eventChecks?.fsdCode || null,
      confidence: avm.confidence || 'medium',
      source: 'attom_avm',
      note: 'Automated Valuation Model from Attom Data'
    };
  }
}

module.exports = new AttomDataService();
