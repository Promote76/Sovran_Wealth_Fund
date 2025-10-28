// Wallet Screening Service
// Production-ready integration with Chainalysis (or similar screening provider)
// Handles OFAC sanctions screening, risk scoring, and AML compliance

class WalletScreeningService {
  constructor() {
    this.apiKey = process.env.CHAINALYSIS_API_KEY || process.env.WALLET_SCREENING_API_KEY;
    this.apiUrl = process.env.CHAINALYSIS_API_URL || 'https://api.chainalysis.com/api/kyt/v2';
    this.enabled = !!this.apiKey;
    
    if (!this.enabled) {
      console.warn('⚠️  Wallet Screening: No API key found. Using simulation mode.');
    } else {
      console.log('✅ Wallet Screening Service initialized with Chainalysis API');
    }
  }

  /**
   * Screen a wallet address for sanctions and risk
   * @param {Object} walletData - Wallet information
   * @returns {Promise<Object>} Screening results
   */
  async screenWallet(walletData) {
    const { address, chain, onboardingId } = walletData;

    try {
      if (!this.enabled) {
        return this._simulateScreening(walletData);
      }

      // Production: Call Chainalysis KYT API
      const response = await fetch(`${this.apiUrl}/users/${onboardingId}/transfers`, {
        method: 'POST',
        headers: {
          'Token': this.apiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          network: this._getNetworkName(chain),
          asset: 'native',
          transferReference: `screen_${onboardingId}_${Date.now()}`,
          direction: 'received',
          address: address
        })
      });

      if (!response.ok) {
        throw new Error(`Chainalysis API error: ${response.status}`);
      }

      const data = await response.json();
      
      return {
        success: true,
        screeningId: data.transferId,
        address,
        chain,
        riskScore: data.rating,
        sanctioned: data.alerts?.some(alert => alert.alertLevel === 'SEVERE') || false,
        riskFactors: data.alerts?.map(alert => ({
          type: alert.alertAmount,
          severity: alert.alertLevel,
          category: alert.category
        })) || [],
        approved: data.rating !== 'high' && !data.alerts?.some(alert => alert.alertLevel === 'SEVERE'),
        screenedAt: new Date().toISOString()
      };

    } catch (error) {
      console.error('❌ Wallet Screening: Failed:', error);
      throw error;
    }
  }

  /**
   * Get detailed risk assessment for a wallet
   * @param {string} address - Wallet address
   * @param {string} chain - Blockchain network
   * @returns {Promise<Object>} Risk assessment
   */
  async getRiskAssessment(address, chain) {
    try {
      if (!this.enabled) {
        return this._simulateRiskAssessment(address, chain);
      }

      const response = await fetch(`${this.apiUrl}/addresses/${address}`, {
        headers: {
          'Token': this.apiKey
        }
      });

      if (!response.ok) {
        throw new Error(`Chainalysis API error: ${response.status}`);
      }

      const data = await response.json();
      
      return {
        success: true,
        address,
        chain,
        riskScore: data.risk,
        exposures: data.exposures || [],
        clusterInfo: data.cluster,
        lastActivityAt: data.lastSeen
      };

    } catch (error) {
      console.error('❌ Wallet Risk Assessment: Failed:', error);
      throw error;
    }
  }

  /**
   * Monitor ongoing wallet activity (post-onboarding)
   * @param {string} address - Wallet address
   * @param {string} userId - Internal user ID
   * @returns {Promise<Object>} Monitoring status
   */
  async registerForMonitoring(address, userId) {
    try {
      if (!this.enabled) {
        return {
          success: true,
          monitoring: true,
          address,
          userId,
          simulation: true
        };
      }

      const response = await fetch(`${this.apiUrl}/users/${userId}`, {
        method: 'POST',
        headers: {
          'Token': this.apiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          address,
          monitoringEnabled: true
        })
      });

      if (!response.ok) {
        throw new Error(`Chainalysis API error: ${response.status}`);
      }

      return {
        success: true,
        monitoring: true,
        address,
        userId
      };

    } catch (error) {
      console.error('❌ Wallet Monitoring Registration: Failed:', error);
      throw error;
    }
  }

  // ========================================
  // SIMULATION MODE (Development/Testing)
  // ========================================

  _simulateScreening(walletData) {
    const { address, chain, onboardingId } = walletData;
    
    // Simulate a clean wallet (low risk, not sanctioned)
    const screening = {
      success: true,
      screeningId: `scr_sim_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      address,
      chain,
      riskScore: 'low',
      sanctioned: false,
      riskFactors: [],
      approved: true,
      screenedAt: new Date().toISOString(),
      simulation: true
    };

    console.log('🧪 Wallet Screening (SIMULATION): Wallet approved', {
      address: address.substring(0, 10) + '...',
      chain,
      riskScore: screening.riskScore
    });

    return screening;
  }

  _simulateRiskAssessment(address, chain) {
    return {
      success: true,
      address,
      chain,
      riskScore: 'low',
      exposures: [],
      clusterInfo: {
        category: 'unknown',
        name: null
      },
      lastActivityAt: new Date().toISOString(),
      simulation: true
    };
  }

  _getNetworkName(chain) {
    const networkMap = {
      'bsc': 'Binance Smart Chain',
      'polygon': 'Polygon',
      'arbitrum': 'Arbitrum',
      'ethereum': 'Ethereum'
    };
    return networkMap[chain] || chain;
  }
}

module.exports = new WalletScreeningService();
