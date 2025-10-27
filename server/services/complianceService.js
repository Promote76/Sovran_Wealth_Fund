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

  async reviewAccreditationVerification(verificationId, reviewerId, approved, rejectionReason = null) {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      const status = approved ? 'approved' : 'rejected';
      const now = new Date();
      
      const result = await client.query(`
        UPDATE accreditation_verifications
        SET status = $1, reviewed_at = $2, reviewed_by = $3,
            approved_at = $4, rejection_reason = $5
        WHERE verification_id = $6
        RETURNING *
      `, [status, now, reviewerId, approved ? now : null, rejectionReason, verificationId]);

      if (result.rows.length === 0) {
        throw new Error('Verification not found');
      }

      const verification = result.rows[0];

      if (approved && verification.wallet_address) {
        await client.query(`
          UPDATE investor_shares
          SET tier = 'accredited'
          WHERE wallet_address = $1
        `, [verification.wallet_address]);
      }

      await this.createAlert(
        'manual',
        approved ? 'info' : 'warning',
        `Accreditation ${approved ? 'Approved' : 'Rejected'}`,
        approved 
          ? 'Your accreditation verification has been approved.'
          : `Rejected: ${rejectionReason}`,
        verification.investor_id
      );

      await client.query('COMMIT');
      return { success: true, verification: result.rows[0] };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async reviewAMLCheck(checkId, reviewerId, status, riskLevel, findings, actionTaken = null) {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      const riskScores = { low: 10, medium: 50, high: 80, critical: 95 };
      const riskScore = riskScores[riskLevel] || 0;

      const result = await client.query(`
        UPDATE aml_checks
        SET status = $1, risk_level = $2, risk_score = $3,
            findings = $4, reviewed_at = $5, reviewed_by = $6,
            action_taken = $7, requires_action = $8
        WHERE check_id = $9
        RETURNING *
      `, [
        status, riskLevel, riskScore, JSON.stringify(findings),
        new Date(), reviewerId, actionTaken,
        status === 'flagged' || status === 'rejected',
        checkId
      ]);

      if (result.rows.length === 0) {
        throw new Error('AML check not found');
      }

      await client.query('COMMIT');
      return { success: true, amlCheck: result.rows[0] };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async getComplianceAlerts(filters = {}) {
    const {
      investorId,
      severity,
      status = 'open',
      limit = 50
    } = filters;

    const conditions = ['1=1'];
    const params = [];
    let paramCount = 1;

    if (investorId) {
      conditions.push(`ca.investor_id = $${paramCount++}`);
      params.push(investorId);
    }

    if (severity) {
      conditions.push(`ca.severity = $${paramCount++}`);
      params.push(severity);
    }

    if (status) {
      conditions.push(`ca.status = $${paramCount++}`);
      params.push(status);
    }

    params.push(limit);

    const result = await this.pool.query(`
      SELECT ca.*, u.email as investor_email, u.full_name as investor_name
      FROM compliance_alerts ca
      LEFT JOIN users u ON ca.investor_id = u.id
      WHERE ${conditions.join(' AND ')}
      ORDER BY 
        CASE ca.severity
          WHEN 'urgent' THEN 1
          WHEN 'critical' THEN 2
          WHEN 'warning' THEN 3
          ELSE 4
        END,
        ca.created_at DESC
      LIMIT $${paramCount}
    `, params);

    return { success: true, alerts: result.rows };
  }

  async resolveAlert(alertId, resolvedBy, resolutionNotes) {
    const result = await this.pool.query(`
      UPDATE compliance_alerts
      SET status = 'resolved', resolved_at = NOW(),
          resolved_by = $1, resolution_notes = $2
      WHERE alert_id = $3
      RETURNING *
    `, [resolvedBy, resolutionNotes, alertId]);

    if (result.rows.length === 0) {
      throw new Error('Alert not found');
    }

    return { success: true, alert: result.rows[0] };
  }

  async getInvestorComplianceStatus(investorId, walletAddress) {
    const result = await this.pool.query(`
      SELECT 
        (SELECT COUNT(*) FROM accreditation_verifications 
         WHERE investor_id = $1 AND status = 'approved' 
         AND (expires_at IS NULL OR expires_at > NOW())) as accreditation_count,
        (SELECT status FROM accreditation_verifications 
         WHERE investor_id = $1 
         ORDER BY created_at DESC LIMIT 1) as latest_accreditation_status,
        (SELECT COUNT(*) FROM aml_checks 
         WHERE investor_id = $1 AND status = 'clear') as clear_aml_checks,
        (SELECT COUNT(*) FROM aml_checks 
         WHERE investor_id = $1 AND status = 'flagged') as flagged_aml_checks,
        (SELECT risk_level FROM aml_checks 
         WHERE investor_id = $1 
         ORDER BY checked_at DESC LIMIT 1) as latest_risk_level,
        (SELECT COUNT(*) FROM compliance_alerts 
         WHERE investor_id = $1 AND status = 'open') as open_alerts,
        (SELECT tier FROM investor_shares 
         WHERE wallet_address = $2 LIMIT 1) as current_tier
    `, [investorId, walletAddress]);

    const status = result.rows[0];
    
    const isAccredited = parseInt(status.accreditation_count) > 0;
    const isCompliant = parseInt(status.flagged_aml_checks) === 0 && parseInt(status.open_alerts) === 0;
    const canInvest = isCompliant && (status.latest_risk_level !== 'critical');

    return {
      success: true,
      status: {
        ...status,
        isAccredited,
        isCompliant,
        canInvest
      }
    };
  }

  async updateFilingStatus(filingId, status, updates = {}) {
    const client = await this.pool.connect();
    try {
      const {
        filingNumber,
        confirmationNumber,
        filingUrl,
        rejectionReason,
        reviewedBy
      } = updates;

      const now = new Date();
      const filedAt = ['filed', 'accepted'].includes(status) ? now : null;
      const acceptedAt = status === 'accepted' ? now : null;

      const result = await client.query(`
        UPDATE regulatory_filings
        SET filing_status = $1, updated_at = $2,
            filing_number = COALESCE($3, filing_number),
            confirmation_number = COALESCE($4, confirmation_number),
            filing_url = COALESCE($5, filing_url),
            rejection_reason = $6,
            reviewed_by = COALESCE($7, reviewed_by),
            filed_at = COALESCE($8, filed_at),
            accepted_at = COALESCE($9, accepted_at)
        WHERE filing_id = $10
        RETURNING *
      `, [
        status, now, filingNumber, confirmationNumber, filingUrl,
        rejectionReason, reviewedBy, filedAt, acceptedAt, filingId
      ]);

      if (result.rows.length === 0) {
        throw new Error('Filing not found');
      }

      return { success: true, filing: result.rows[0] };
    } catch (error) {
      throw error;
    } finally {
      client.release();
    }
  }

  async getAccreditationVerifications(filters = {}) {
    const { investorId, status, limit = 50 } = filters;
    const conditions = ['1=1'];
    const params = [];
    let paramCount = 1;

    if (investorId) {
      conditions.push(`investor_id = $${paramCount++}`);
      params.push(investorId);
    }

    if (status) {
      conditions.push(`status = $${paramCount++}`);
      params.push(status);
    }

    params.push(limit);

    const result = await this.pool.query(`
      SELECT * FROM accreditation_verifications
      WHERE ${conditions.join(' AND ')}
      ORDER BY created_at DESC
      LIMIT $${paramCount}
    `, params);

    return { success: true, verifications: result.rows };
  }

  async getAMLChecks(filters = {}) {
    const { investorId, status, limit = 50 } = filters;
    const conditions = ['1=1'];
    const params = [];
    let paramCount = 1;

    if (investorId) {
      conditions.push(`investor_id = $${paramCount++}`);
      params.push(investorId);
    }

    if (status) {
      conditions.push(`status = $${paramCount++}`);
      params.push(status);
    }

    params.push(limit);

    const result = await this.pool.query(`
      SELECT * FROM aml_checks
      WHERE ${conditions.join(' AND ')}
      ORDER BY checked_at DESC
      LIMIT $${paramCount}
    `, params);

    return { success: true, checks: result.rows };
  }

  async getRegulatoryFilings(filters = {}) {
    const { propertyId, status, limit = 50 } = filters;
    const conditions = ['1=1'];
    const params = [];
    let paramCount = 1;

    if (propertyId) {
      conditions.push(`property_id = $${paramCount++}`);
      params.push(propertyId);
    }

    if (status) {
      conditions.push(`filing_status = $${paramCount++}`);
      params.push(status);
    }

    params.push(limit);

    const result = await this.pool.query(`
      SELECT * FROM regulatory_filings
      WHERE ${conditions.join(' AND ')}
      ORDER BY created_at DESC
      LIMIT $${paramCount}
    `, params);

    return { success: true, filings: result.rows };
  }
}

module.exports = new ComplianceService();
