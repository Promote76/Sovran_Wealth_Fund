/**
 * Feature #7: Tax & Reporting Automation
 * Creates database tables for automated tax document generation
 */

require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function createTaxAutomationTables() {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    console.log('Creating tax_profiles table...');
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS tax_profiles (
        id SERIAL PRIMARY KEY,
        profile_id VARCHAR(36) NOT NULL UNIQUE,
        investor_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        wallet_address VARCHAR(42),
        tax_id_type VARCHAR(20) NOT NULL CHECK (tax_id_type IN ('ssn', 'ein', 'itin', 'foreign')),
        tax_id_encrypted TEXT NOT NULL,
        tax_country VARCHAR(10) DEFAULT 'US' NOT NULL,
        tax_state VARCHAR(3),
        entity_type VARCHAR(30) CHECK (entity_type IN (
          'individual', 'partnership', 'c_corp', 's_corp', 'llc', 'trust', 'estate', 'foreign'
        )),
        w9_status VARCHAR(20) DEFAULT 'pending' CHECK (w9_status IN ('pending', 'submitted', 'verified', 'expired')),
        w8_status VARCHAR(20) CHECK (w8_status IN ('not_required', 'pending', 'submitted', 'verified', 'expired')),
        backup_withholding BOOLEAN DEFAULT false NOT NULL,
        withholding_rate DECIMAL(5,2) DEFAULT 0,
        tax_treaty_country VARCHAR(10),
        treaty_benefits BOOLEAN DEFAULT false,
        verification_documents JSONB,
        verified_at TIMESTAMP,
        expires_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
        UNIQUE(investor_id)
      );
      
      CREATE INDEX IF NOT EXISTS tax_profiles_investor_idx ON tax_profiles(investor_id);
      CREATE INDEX IF NOT EXISTS tax_profiles_wallet_idx ON tax_profiles(wallet_address);
      CREATE INDEX IF NOT EXISTS tax_profiles_w9_status_idx ON tax_profiles(w9_status);
    `);
    
    console.log('Creating tax_documents table...');
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS tax_documents (
        id SERIAL PRIMARY KEY,
        document_id VARCHAR(36) NOT NULL UNIQUE,
        investor_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        tax_profile_id INTEGER REFERENCES tax_profiles(id) ON DELETE SET NULL,
        tax_year INTEGER NOT NULL,
        document_type VARCHAR(30) NOT NULL CHECK (document_type IN (
          '1099_div', '1099_misc', '1099_int', '1099_k', 'k1', 'annual_statement', 'consolidated'
        )),
        filing_requirement VARCHAR(20) CHECK (filing_requirement IN ('required', 'optional', 'informational')),
        total_income DECIMAL(15,2) DEFAULT 0,
        total_distributions DECIMAL(15,2) DEFAULT 0,
        total_capital_gains DECIMAL(15,2) DEFAULT 0,
        total_withheld DECIMAL(15,2) DEFAULT 0,
        document_data JSONB NOT NULL,
        pdf_url TEXT,
        pdf_generated_at TIMESTAMP,
        status VARCHAR(20) DEFAULT 'pending' NOT NULL CHECK (status IN (
          'pending', 'generated', 'reviewed', 'filed', 'corrected', 'voided'
        )),
        generated_by VARCHAR(50) DEFAULT 'system',
        reviewed_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
        filed_with_irs BOOLEAN DEFAULT false,
        filed_at TIMESTAMP,
        correction_of VARCHAR(36),
        investor_notified BOOLEAN DEFAULT false,
        notified_at TIMESTAMP,
        metadata JSONB,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        CHECK (tax_year >= 2020 AND tax_year <= 2100)
      );
      
      CREATE INDEX IF NOT EXISTS tax_documents_investor_idx ON tax_documents(investor_id);
      CREATE INDEX IF NOT EXISTS tax_documents_year_idx ON tax_documents(tax_year);
      CREATE INDEX IF NOT EXISTS tax_documents_type_idx ON tax_documents(document_type);
      CREATE INDEX IF NOT EXISTS tax_documents_status_idx ON tax_documents(status);
      CREATE UNIQUE INDEX IF NOT EXISTS tax_documents_unique_idx ON tax_documents(investor_id, tax_year, document_type) 
        WHERE status != 'voided';
    `);
    
    console.log('Creating tax_line_items table...');
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS tax_line_items (
        id SERIAL PRIMARY KEY,
        line_item_id VARCHAR(36) NOT NULL UNIQUE,
        tax_document_id INTEGER NOT NULL REFERENCES tax_documents(id) ON DELETE CASCADE,
        property_id INTEGER REFERENCES fractional_properties(id) ON DELETE SET NULL,
        item_type VARCHAR(30) NOT NULL CHECK (item_type IN (
          'rental_income', 'dividend', 'capital_gain_short', 'capital_gain_long',
          'interest', 'other_income', 'expense', 'withholding'
        )),
        description TEXT,
        amount DECIMAL(15,2) NOT NULL,
        transaction_date DATE,
        source_transaction_id VARCHAR(36),
        box_number VARCHAR(10),
        metadata JSONB,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      );
      
      CREATE INDEX IF NOT EXISTS tax_line_items_document_idx ON tax_line_items(tax_document_id);
      CREATE INDEX IF NOT EXISTS tax_line_items_property_idx ON tax_line_items(property_id);
      CREATE INDEX IF NOT EXISTS tax_line_items_type_idx ON tax_line_items(item_type);
    `);
    
    console.log('Creating investor_statements table...');
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS investor_statements (
        id SERIAL PRIMARY KEY,
        statement_id VARCHAR(36) NOT NULL UNIQUE,
        investor_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        statement_type VARCHAR(30) NOT NULL CHECK (statement_type IN (
          'monthly', 'quarterly', 'annual', 'year_end', 'custom'
        )),
        period_start DATE NOT NULL,
        period_end DATE NOT NULL,
        properties_count INTEGER DEFAULT 0,
        beginning_balance DECIMAL(15,2) DEFAULT 0,
        ending_balance DECIMAL(15,2) DEFAULT 0,
        total_contributions DECIMAL(15,2) DEFAULT 0,
        total_distributions DECIMAL(15,2) DEFAULT 0,
        total_income DECIMAL(15,2) DEFAULT 0,
        total_expenses DECIMAL(15,2) DEFAULT 0,
        unrealized_gains DECIMAL(15,2) DEFAULT 0,
        realized_gains DECIMAL(15,2) DEFAULT 0,
        transactions JSONB,
        portfolio_summary JSONB,
        performance_metrics JSONB,
        pdf_url TEXT,
        pdf_generated_at TIMESTAMP,
        status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'final', 'sent')),
        sent_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        UNIQUE(investor_id, period_start, period_end, statement_type)
      );
      
      CREATE INDEX IF NOT EXISTS investor_statements_investor_idx ON investor_statements(investor_id);
      CREATE INDEX IF NOT EXISTS investor_statements_period_idx ON investor_statements(period_start, period_end);
      CREATE INDEX IF NOT EXISTS investor_statements_type_idx ON investor_statements(statement_type);
    `);
    
    console.log('Creating tax_lot_tracking table...');
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS tax_lot_tracking (
        id SERIAL PRIMARY KEY,
        lot_id VARCHAR(36) NOT NULL UNIQUE,
        investor_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        property_id INTEGER NOT NULL REFERENCES fractional_properties(id) ON DELETE CASCADE,
        transaction_id VARCHAR(36),
        acquisition_date DATE NOT NULL,
        shares_acquired INTEGER NOT NULL,
        cost_basis DECIMAL(15,2) NOT NULL,
        cost_per_share DECIMAL(15,2) NOT NULL,
        shares_remaining INTEGER NOT NULL,
        status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'partial', 'closed')),
        holding_period_type VARCHAR(20) CHECK (holding_period_type IN ('short_term', 'long_term')),
        disposed_date DATE,
        disposal_method VARCHAR(30) CHECK (disposal_method IN ('sale', 'transfer', 'redemption', 'distribution')),
        realized_gain_loss DECIMAL(15,2),
        metadata JSONB,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        CHECK (shares_acquired > 0),
        CHECK (cost_basis > 0),
        CHECK (shares_remaining >= 0 AND shares_remaining <= shares_acquired)
      );
      
      CREATE INDEX IF NOT EXISTS tax_lot_investor_idx ON tax_lot_tracking(investor_id);
      CREATE INDEX IF NOT EXISTS tax_lot_property_idx ON tax_lot_tracking(property_id);
      CREATE INDEX IF NOT EXISTS tax_lot_status_idx ON tax_lot_tracking(status);
      CREATE INDEX IF NOT EXISTS tax_lot_acquisition_idx ON tax_lot_tracking(acquisition_date);
    `);
    
    console.log('Creating tax_provider_integrations table...');
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS tax_provider_integrations (
        id SERIAL PRIMARY KEY,
        integration_id VARCHAR(36) NOT NULL UNIQUE,
        provider_name VARCHAR(50) NOT NULL,
        api_environment VARCHAR(20) DEFAULT 'production' CHECK (api_environment IN ('sandbox', 'production')),
        is_active BOOLEAN DEFAULT true NOT NULL,
        configuration JSONB,
        last_sync_at TIMESTAMP,
        next_sync_at TIMESTAMP,
        sync_frequency VARCHAR(20),
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      );
    `);
    
    await client.query('COMMIT');
    console.log('✅ Tax Automation tables created successfully!');
    
    console.log('\n📊 Summary:');
    console.log('  1. tax_profiles - W9/W8 and tax identification');
    console.log('  2. tax_documents - 1099s, K-1s, annual statements');
    console.log('  3. tax_line_items - Document line item details');
    console.log('  4. investor_statements - Monthly/quarterly statements');
    console.log('  5. tax_lot_tracking - Cost basis and capital gains');
    console.log('  6. tax_provider_integrations - TaxBit/etc integration');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error creating tax automation tables:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

createTaxAutomationTables()
  .then(() => {
    console.log('\n🎉 Tax Automation migration completed!');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n💥 Migration failed:', error);
    process.exit(1);
  });
