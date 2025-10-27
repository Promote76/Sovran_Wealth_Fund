/**
 * Feature #2: Smart Compliance Orchestrator
 * Creates database tables for automated KYC/AML and regulatory compliance
 */

require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function createComplianceTables() {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    console.log('Creating compliance_rules table...');
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS compliance_rules (
        id SERIAL PRIMARY KEY,
        rule_id VARCHAR(36) NOT NULL UNIQUE,
        rule_name VARCHAR(100) NOT NULL,
        rule_type VARCHAR(30) NOT NULL CHECK (rule_type IN (
          'kyc_requirement', 'aml_check', 'accreditation', 
          'jurisdiction', 'investment_limit', 'regulatory'
        )),
        jurisdiction VARCHAR(10) DEFAULT 'US',
        investor_tier VARCHAR(20) REFERENCES investor_tiers(tier_name),
        conditions JSONB NOT NULL,
        actions JSONB NOT NULL,
        priority INTEGER DEFAULT 100 NOT NULL,
        is_active BOOLEAN DEFAULT true NOT NULL,
        description TEXT,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      );
      
      CREATE INDEX IF NOT EXISTS compliance_rules_type_idx ON compliance_rules(rule_type);
      CREATE INDEX IF NOT EXISTS compliance_rules_jurisdiction_idx ON compliance_rules(jurisdiction);
      CREATE INDEX IF NOT EXISTS compliance_rules_tier_idx ON compliance_rules(investor_tier);
    `);
    
    console.log('Creating accreditation_verifications table...');
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS accreditation_verifications (
        id SERIAL PRIMARY KEY,
        verification_id VARCHAR(36) NOT NULL UNIQUE,
        investor_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        wallet_address VARCHAR(42),
        verification_type VARCHAR(30) NOT NULL CHECK (verification_type IN (
          'income', 'net_worth', 'professional', 'entity'
        )),
        verification_method VARCHAR(30) CHECK (verification_method IN (
          'document_upload', 'third_party_api', 'manual_review', 'self_certification'
        )),
        status VARCHAR(20) DEFAULT 'pending' NOT NULL CHECK (status IN (
          'pending', 'approved', 'rejected', 'expired', 'under_review'
        )),
        submitted_at TIMESTAMP DEFAULT NOW() NOT NULL,
        reviewed_at TIMESTAMP,
        approved_at TIMESTAMP,
        expires_at TIMESTAMP,
        reviewed_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
        verification_data JSONB,
        documents JSONB,
        third_party_response JSONB,
        rejection_reason TEXT,
        notes TEXT,
        auto_renewal_enabled BOOLEAN DEFAULT true,
        renewal_reminder_sent BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      );
      
      CREATE INDEX IF NOT EXISTS accreditation_investor_idx ON accreditation_verifications(investor_id);
      CREATE INDEX IF NOT EXISTS accreditation_wallet_idx ON accreditation_verifications(wallet_address);
      CREATE INDEX IF NOT EXISTS accreditation_status_idx ON accreditation_verifications(status);
      CREATE INDEX IF NOT EXISTS accreditation_expires_idx ON accreditation_verifications(expires_at);
    `);
    
    console.log('Creating aml_checks table...');
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS aml_checks (
        id SERIAL PRIMARY KEY,
        check_id VARCHAR(36) NOT NULL UNIQUE,
        investor_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        wallet_address VARCHAR(42),
        check_type VARCHAR(30) NOT NULL CHECK (check_type IN (
          'identity_verification', 'sanctions_screening', 'pep_screening',
          'adverse_media', 'source_of_funds', 'ongoing_monitoring'
        )),
        provider VARCHAR(30) CHECK (provider IN ('persona', 'middesk', 'chainalysis', 'manual')),
        status VARCHAR(20) DEFAULT 'pending' NOT NULL CHECK (status IN (
          'pending', 'clear', 'flagged', 'rejected', 'needs_review'
        )),
        risk_score INTEGER,
        risk_level VARCHAR(20) CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
        findings JSONB,
        provider_response JSONB,
        match_details JSONB,
        requires_action BOOLEAN DEFAULT false,
        action_taken TEXT,
        checked_at TIMESTAMP DEFAULT NOW() NOT NULL,
        reviewed_at TIMESTAMP,
        reviewed_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
        next_check_at TIMESTAMP,
        metadata JSONB
      );
      
      CREATE INDEX IF NOT EXISTS aml_checks_investor_idx ON aml_checks(investor_id);
      CREATE INDEX IF NOT EXISTS aml_checks_wallet_idx ON aml_checks(wallet_address);
      CREATE INDEX IF NOT EXISTS aml_checks_status_idx ON aml_checks(status);
      CREATE INDEX IF NOT EXISTS aml_checks_risk_idx ON aml_checks(risk_level);
      CREATE INDEX IF NOT EXISTS aml_checks_next_check_idx ON aml_checks(next_check_at);
    `);
    
    console.log('Creating regulatory_filings table...');
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS regulatory_filings (
        id SERIAL PRIMARY KEY,
        filing_id VARCHAR(36) NOT NULL UNIQUE,
        filing_type VARCHAR(30) NOT NULL CHECK (filing_type IN (
          'form_d', 'form_c', 'blue_sky', 'annual_report', 'amendment'
        )),
        property_id INTEGER REFERENCES fractional_properties(id) ON DELETE SET NULL,
        jurisdiction VARCHAR(10) NOT NULL,
        filing_status VARCHAR(20) DEFAULT 'draft' NOT NULL CHECK (filing_status IN (
          'draft', 'pending_review', 'filed', 'accepted', 'rejected', 'amended'
        )),
        filing_data JSONB NOT NULL,
        filing_number VARCHAR(50),
        filed_at TIMESTAMP,
        accepted_at TIMESTAMP,
        due_date TIMESTAMP,
        renewal_date TIMESTAMP,
        filing_url TEXT,
        confirmation_number VARCHAR(100),
        filed_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
        reviewed_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
        rejection_reason TEXT,
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      );
      
      CREATE INDEX IF NOT EXISTS regulatory_filings_type_idx ON regulatory_filings(filing_type);
      CREATE INDEX IF NOT EXISTS regulatory_filings_property_idx ON regulatory_filings(property_id);
      CREATE INDEX IF NOT EXISTS regulatory_filings_status_idx ON regulatory_filings(filing_status);
      CREATE INDEX IF NOT EXISTS regulatory_filings_jurisdiction_idx ON regulatory_filings(jurisdiction);
      CREATE INDEX IF NOT EXISTS regulatory_filings_due_date_idx ON regulatory_filings(due_date);
    `);
    
    console.log('Creating compliance_alerts table...');
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS compliance_alerts (
        id SERIAL PRIMARY KEY,
        alert_id VARCHAR(36) NOT NULL UNIQUE,
        alert_type VARCHAR(30) NOT NULL CHECK (alert_type IN (
          'kyc_expiring', 'accreditation_expiring', 'aml_flagged',
          'filing_due', 'rule_violation', 'suspicious_activity', 'manual'
        )),
        severity VARCHAR(20) NOT NULL CHECK (severity IN ('info', 'warning', 'critical', 'urgent')),
        investor_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        property_id INTEGER REFERENCES fractional_properties(id) ON DELETE SET NULL,
        title VARCHAR(200) NOT NULL,
        description TEXT NOT NULL,
        action_required BOOLEAN DEFAULT false NOT NULL,
        action_deadline TIMESTAMP,
        status VARCHAR(20) DEFAULT 'open' NOT NULL CHECK (status IN ('open', 'acknowledged', 'resolved', 'dismissed')),
        assigned_to INTEGER REFERENCES users(id) ON DELETE SET NULL,
        resolved_at TIMESTAMP,
        resolved_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
        resolution_notes TEXT,
        metadata JSONB,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      );
      
      CREATE INDEX IF NOT EXISTS compliance_alerts_type_idx ON compliance_alerts(alert_type);
      CREATE INDEX IF NOT EXISTS compliance_alerts_severity_idx ON compliance_alerts(severity);
      CREATE INDEX IF NOT EXISTS compliance_alerts_status_idx ON compliance_alerts(status);
      CREATE INDEX IF NOT EXISTS compliance_alerts_investor_idx ON compliance_alerts(investor_id);
      CREATE INDEX IF NOT EXISTS compliance_alerts_deadline_idx ON compliance_alerts(action_deadline);
    `);
    
    console.log('Creating jurisdiction_rules table...');
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS jurisdiction_rules (
        id SERIAL PRIMARY KEY,
        jurisdiction VARCHAR(10) NOT NULL UNIQUE,
        jurisdiction_name VARCHAR(100) NOT NULL,
        country_code VARCHAR(3) NOT NULL,
        state_code VARCHAR(3),
        kyc_required BOOLEAN DEFAULT true NOT NULL,
        aml_required BOOLEAN DEFAULT true NOT NULL,
        accreditation_required BOOLEAN DEFAULT false NOT NULL,
        max_investors INTEGER,
        max_unaccredited_investors INTEGER,
        min_investment_amount DECIMAL(15,2),
        max_investment_amount DECIMAL(15,2),
        requires_registration BOOLEAN DEFAULT false NOT NULL,
        registration_type VARCHAR(50),
        additional_requirements JSONB,
        is_active BOOLEAN DEFAULT true NOT NULL,
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      );
      
      -- Seed US federal rules
      INSERT INTO jurisdiction_rules (
        jurisdiction, jurisdiction_name, country_code,
        kyc_required, aml_required, accreditation_required,
        max_unaccredited_investors, min_investment_amount
      ) VALUES (
        'US', 'United States (Federal)', 'USA',
        true, true, false, 2000, 500
      ) ON CONFLICT (jurisdiction) DO NOTHING;
    `);
    
    await client.query('COMMIT');
    console.log('✅ Compliance Orchestrator tables created successfully!');
    
    console.log('\n📊 Summary:');
    console.log('  1. compliance_rules - Automated compliance rule engine');
    console.log('  2. accreditation_verifications - Investor accreditation tracking');
    console.log('  3. aml_checks - Anti-money laundering checks');
    console.log('  4. regulatory_filings - Form D, Form C, etc.');
    console.log('  5. compliance_alerts - Alert and notification system');
    console.log('  6. jurisdiction_rules - State/country-specific requirements');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error creating compliance tables:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

createComplianceTables()
  .then(() => {
    console.log('\n🎉 Compliance Orchestrator migration completed!');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n💥 Migration failed:', error);
    process.exit(1);
  });
