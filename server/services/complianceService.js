/**
 * Feature #2: Smart Compliance Orchestrator Service
 * Handles automated KYC/AML, accreditation, and regulatory compliance
 */

const { Pool } = require('pg');
const { v4: uuidv4 } = require('uuid');

class ComplianceService {
  constructor() {
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL,
    });
  }

  /**
   * Verify investor accreditation status
   */
  async verifyAccreditation(investorId, verificationType, verificationData) {
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');
      
      const verificationId = uuidv4();
      const expiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000); // 1 year
      
      // TODO: Integrate with Persona API or similar for automated verification
      // For now, store for manual review
      
      const result = await client.query(
        `INSERT INTO accreditation_verifications (
          verification_id, investor_id, verification_type, verification_method,
          status, verification_data, expires_at
        ) VALUES ($1, $2, $3, 'document_upload', 'pending', $4, $5)
        RETURNING *`,
        [verificationId, investorId, verificationType, JSON.stringify(verificationData), expiresAt]
      );
      
      await client.query('COMMIT');
      
      return {
        success: true,
        verification: result.rows[0],
        message: 'Accreditation verification submitted for review'
      };
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Run AML check on investor
   */
  async runAMLCheck(investorId, walletAddress, checkType = 'identity_verification') {
    const client = await this.pool.connect();
    
    try {
      const checkId = uuidv4();
      
      // TODO: Integrate with Chainalysis, Persona, or similar
      // For now, create placeholder check
      
      const result = await client.query(
        `INSERT INTO aml_checks (
          check_id, investor_id, wallet_address, check_type, 
          provider, status, risk_level
        ) VALUES ($1, $2, $3, $4, 'manual', 'pending', 'low')
        RETURNING *`,
        [checkId, investorId, walletAddress, checkType]
      );
      
      return {
        success: true,
        check: result.rows[0],
        message: 'AML check initiated'
      };
      
    } finally {
      client.release();
    }
  }

  /**
   * Create Form D filing for property offering
   */
  async createFormDFiling(propertyId, filingData) {
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');
      
      const filingId = uuidv4();
      const dueDate = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000); // 15 days
      
      const result = await client.query(
        `INSERT INTO regulatory_filings (
          filing_id, filing_type, property_id, jurisdiction,
          filing_status, filing_data, due_date
        ) VALUES ($1, 'form_d', $2, 'US', 'draft', $3, $4)
        RETURNING *`,
        [filingId, propertyId, JSON.stringify(filingData), dueDate]
      );
      
      await client.query('COMMIT');
      
      return {
        success: true,
        filing: result.rows[0],
        message: 'Form D filing created (draft)'
      };
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Check investor compliance for investment
   */
  async checkInvestmentCompliance(investorId, propertyId, investmentAmount) {
    const client = await this.pool.connect();
    
    try {
      // Check KYC status
      const kycResult = await client.query(
        `SELECT * FROM kyc_verifications WHERE user_id = $1`,
        [investorId]
      );
      
      if (!kycResult.rows[0] || kycResult.rows[0].verification_status !== 'approved') {
        return {
          compliant: false,
          reason: 'KYC verification required',
          requiredActions: ['complete_kyc']
        };
      }
      
      // Check AML status
      const amlResult = await client.query(
        `SELECT * FROM aml_checks 
         WHERE investor_id = $1 AND status IN ('clear', 'pending')
         ORDER BY checked_at DESC LIMIT 1`,
        [investorId]
      );
      
      if (!amlResult.rows[0]) {
        // Trigger AML check
        await this.runAMLCheck(investorId, null, 'investment_screening');
        
        return {
          compliant: false,
          reason: 'AML screening in progress',
          requiredActions: ['wait_for_aml']
        };
      }
      
      if (amlResult.rows[0].status === 'flagged') {
        return {
          compliant: false,
          reason: 'AML screening flagged - manual review required',
          requiredActions: ['contact_compliance']
        };
      }
      
      // Check accreditation if required
      if (investmentAmount > 50000) {
        const accreditationResult = await client.query(
          `SELECT * FROM accreditation_verifications
           WHERE investor_id = $1 AND status = 'approved' AND expires_at > NOW()
           ORDER BY approved_at DESC LIMIT 1`,
          [investorId]
        );
        
        if (!accreditationResult.rows[0]) {
          return {
            compliant: false,
            reason: 'Accredited investor verification required for investments over $50,000',
            requiredActions: ['verify_accreditation']
          };
        }
      }
      
      return {
        compliant: true,
        message: 'All compliance checks passed'
      };
      
    } finally {
      client.release();
    }
  }

  /**
   * Create compliance alert
   */
  async createAlert(alertType, severity, title, description, investorId = null, propertyId = null) {
    const client = await this.pool.connect();
    
    try {
      const alertId = uuidv4();
      
      const result = await client.query(
        `INSERT INTO compliance_alerts (
          alert_id, alert_type, severity, title, description,
          investor_id, property_id
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *`,
        [alertId, alertType, severity, title, description, investorId, propertyId]
      );
      
      return result.rows[0];
      
    } finally {
      client.release();
    }
  }

  /**
   * Get compliance dashboard metrics
   */
  async getComplianceMetrics() {
    const client = await this.pool.connect();
    
    try {
      const metrics = await client.query(`
        SELECT 
          (SELECT COUNT(*) FROM kyc_verifications WHERE verification_status = 'pending') as pending_kyc,
          (SELECT COUNT(*) FROM accreditation_verifications WHERE status = 'pending') as pending_accreditation,
          (SELECT COUNT(*) FROM aml_checks WHERE status = 'flagged') as flagged_aml,
          (SELECT COUNT(*) FROM regulatory_filings WHERE filing_status = 'pending_review') as pending_filings,
          (SELECT COUNT(*) FROM compliance_alerts WHERE status = 'open') as open_alerts
      `);
      
      return metrics.rows[0];
      
    } finally {
      client.release();
    }
  }
}

module.exports = new ComplianceService();
