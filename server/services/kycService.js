// KYC/Identity Verification Service
// Production-ready integration with Persona (or similar KYC provider)
// Handles identity verification, document upload, and compliance checks

const crypto = require('crypto');

class KYCService {
  constructor() {
    this.apiKey = process.env.PERSONA_API_KEY || process.env.KYC_API_KEY;
    this.apiUrl = process.env.PERSONA_API_URL || 'https://withpersona.com/api/v1';
    this.templateId = process.env.PERSONA_TEMPLATE_ID || 'tmpl_international_investor';
    this.enabled = !!this.apiKey;
    
    if (!this.enabled) {
      console.warn('⚠️  KYC Service: No API key found. Using simulation mode.');
    } else {
      console.log('✅ KYC Service initialized with Persona API');
    }
  }

  /**
   * Create a KYC verification inquiry for an investor
   * @param {Object} investorData - Investor information
   * @returns {Promise<Object>} Inquiry details with session URL
   */
  async createInquiry(investorData) {
    const { 
      onboardingId, 
      fullName, 
      email, 
      nationality, 
      country,
      referenceId 
    } = investorData;

    try {
      if (!this.enabled) {
        // Simulation mode for development/testing
        return this._simulateInquiry(investorData);
      }

      // Production: Call Persona API
      const response = await fetch(`${this.apiUrl}/inquiries`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'Persona-Version': '2023-01-05'
        },
        body: JSON.stringify({
          data: {
            type: 'inquiry',
            attributes: {
              'inquiry-template-id': this.templateId,
              'reference-id': referenceId || onboardingId,
              'name-first': fullName.split(' ')[0],
              'name-last': fullName.split(' ').slice(1).join(' '),
              'email-address': email,
              'fields': {
                'nationality': nationality,
                'country-code': this._getCountryCode(country)
              }
            }
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Persona API error: ${response.status}`);
      }

      const data = await response.json();
      
      return {
        success: true,
        inquiryId: data.data.id,
        sessionUrl: data.data.attributes['session-url'],
        status: data.data.attributes.status,
        referenceId: data.data.attributes['reference-id']
      };

    } catch (error) {
      console.error('❌ KYC Service: Inquiry creation failed:', error);
      throw error;
    }
  }

  /**
   * Check the status of a KYC inquiry
   * @param {string} inquiryId - Persona inquiry ID
   * @returns {Promise<Object>} Current inquiry status
   */
  async checkStatus(inquiryId) {
    try {
      if (!this.enabled) {
        return this._simulateStatusCheck(inquiryId);
      }

      const response = await fetch(`${this.apiUrl}/inquiries/${inquiryId}`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Persona-Version': '2023-01-05'
        }
      });

      if (!response.ok) {
        throw new Error(`Persona API error: ${response.status}`);
      }

      const data = await response.json();
      
      return {
        success: true,
        inquiryId: data.data.id,
        status: data.data.attributes.status,
        completedAt: data.data.attributes['completed-at'],
        decisionedAt: data.data.attributes['decisioned-at'],
        decision: data.data.attributes.decision,
        tags: data.data.attributes.tags
      };

    } catch (error) {
      console.error('❌ KYC Service: Status check failed:', error);
      throw error;
    }
  }

  /**
   * Verify webhook signature from Persona
   * @param {string} signature - Webhook signature header
   * @param {string} body - Raw webhook body
   * @returns {boolean} Signature valid
   */
  verifyWebhookSignature(signature, body) {
    if (!this.enabled) return true; // Skip in simulation mode

    const secret = process.env.PERSONA_WEBHOOK_SECRET;
    if (!secret) {
      console.warn('⚠️  No webhook secret configured');
      return false;
    }

    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(body)
      .digest('hex');

    return signature === expectedSignature;
  }

  // ========================================
  // SIMULATION MODE (Development/Testing)
  // ========================================

  _simulateInquiry(investorData) {
    const inquiryId = `inq_sim_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    console.log('🧪 KYC Service (SIMULATION): Created inquiry', {
      inquiryId,
      email: investorData.email,
      country: investorData.country
    });

    return {
      success: true,
      inquiryId,
      sessionUrl: `https://withpersona.com/verify?inquiry-id=${inquiryId}`,
      status: 'pending',
      referenceId: investorData.onboardingId,
      simulation: true
    };
  }

  _simulateStatusCheck(inquiryId) {
    // Simulate instant approval for testing
    return {
      success: true,
      inquiryId,
      status: 'completed',
      completedAt: new Date().toISOString(),
      decisionedAt: new Date().toISOString(),
      decision: 'approved',
      tags: ['international-investor', 'low-risk'],
      simulation: true
    };
  }

  _getCountryCode(country) {
    const countryMap = {
      'United Arab Emirates': 'AE',
      'Singapore': 'SG',
      'Brazil': 'BR',
      'Nigeria': 'NG',
      'United Kingdom': 'GB',
      'Switzerland': 'CH',
      'Turkey': 'TR',
      'Saudi Arabia': 'SA',
      'Qatar': 'QA',
      'India': 'IN',
      'Hong Kong': 'HK'
    };
    return countryMap[country] || 'XX';
  }
}

module.exports = new KYCService();
