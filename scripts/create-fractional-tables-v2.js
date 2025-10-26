/**
 * Create fractional real estate ownership tables with proper constraints
 * Run this script to create the necessary tables in the database
 */

require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function createFractionalTables() {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    console.log('Creating investor_tiers table...');
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS investor_tiers (
        id SERIAL PRIMARY KEY,
        tier_name VARCHAR(20) NOT NULL UNIQUE,
        min_investment DECIMAL(15,2) NOT NULL,
        max_investment DECIMAL(15,2),
        max_ownership_percent DECIMAL(5,2),
        revenue_share_bonus DECIMAL(5,2) DEFAULT 0 NOT NULL,
        benefits JSONB,
        description TEXT,
        is_active BOOLEAN DEFAULT true NOT NULL,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        CHECK (min_investment >= 0),
        CHECK (max_investment IS NULL OR max_investment >= min_investment),
        CHECK (max_ownership_percent IS NULL OR (max_ownership_percent > 0 AND max_ownership_percent <= 100)),
        CHECK (revenue_share_bonus >= 0 AND revenue_share_bonus <= 100)
      );
    `);
    
    // Seed the 4-tier system
    console.log('Seeding investor tiers...');
    
    await client.query(`
      INSERT INTO investor_tiers (tier_name, min_investment, max_investment, max_ownership_percent, revenue_share_bonus, description, benefits)
      VALUES 
        ('retail', 500, 10000, 5, 0, 'Entry-level investors with standard revenue share', 
         '{"early_access": false, "governance_voting": false, "priority_distributions": false}'::jsonb),
        ('accredited', 10000, 100000, 15, 2, 'Accredited investors with enhanced revenue share and early deal access',
         '{"early_access": true, "governance_voting": false, "priority_distributions": true}'::jsonb),
        ('premium', 100000, 500000, 25, 5, 'Premium investors with priority distributions and governance rights',
         '{"early_access": true, "governance_voting": true, "priority_distributions": true}'::jsonb),
        ('institutional', 500000, NULL, 25, 8, 'Institutional investors with maximum benefits and exclusive deal access',
         '{"early_access": true, "governance_voting": true, "priority_distributions": true, "exclusive_deals": true}'::jsonb)
      ON CONFLICT (tier_name) DO UPDATE SET
        min_investment = EXCLUDED.min_investment,
        max_investment = EXCLUDED.max_investment,
        max_ownership_percent = EXCLUDED.max_ownership_percent,
        revenue_share_bonus = EXCLUDED.revenue_share_bonus,
        description = EXCLUDED.description,
        benefits = EXCLUDED.benefits;
    `);
    
    console.log('Creating fractional_properties table...');
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS fractional_properties (
        id SERIAL PRIMARY KEY,
        deal_id VARCHAR(36) NOT NULL UNIQUE REFERENCES deals(id) ON DELETE CASCADE,
        total_shares INTEGER DEFAULT 10000 NOT NULL,
        share_price DECIMAL(15,2) NOT NULL,
        property_value DECIMAL(15,2) NOT NULL,
        shares_sold INTEGER DEFAULT 0 NOT NULL,
        shares_available INTEGER GENERATED ALWAYS AS (total_shares - shares_sold) STORED,
        min_investment DECIMAL(15,2) DEFAULT 500 NOT NULL,
        max_ownership_percent DECIMAL(5,2) DEFAULT 25 NOT NULL,
        lockup_months INTEGER DEFAULT 6 NOT NULL,
        monthly_rent DECIMAL(15,2),
        monthly_expenses DECIMAL(15,2),
        net_monthly_income DECIMAL(15,2),
        reserve_fund_percent DECIMAL(5,2) DEFAULT 10 NOT NULL,
        contract_address VARCHAR(42),
        token_id VARCHAR(78),
        status VARCHAR(20) DEFAULT 'active' NOT NULL,
        funding_deadline TIMESTAMP,
        fully_funded_at TIMESTAMP,
        metadata JSONB,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
        CHECK (total_shares > 0),
        CHECK (share_price > 0),
        CHECK (property_value > 0),
        CHECK (shares_sold >= 0 AND shares_sold <= total_shares),
        CHECK (min_investment >= 500),
        CHECK (max_ownership_percent > 0 AND max_ownership_percent <= 100),
        CHECK (lockup_months >= 0),
        CHECK (reserve_fund_percent >= 0 AND reserve_fund_percent <= 100)
      );
      
      CREATE INDEX IF NOT EXISTS fractional_properties_deal_id_idx ON fractional_properties(deal_id);
      CREATE INDEX IF NOT EXISTS fractional_properties_status_idx ON fractional_properties(status);
    `);
    
    console.log('Creating investor_shares table...');
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS investor_shares (
        id SERIAL PRIMARY KEY,
        property_id INTEGER NOT NULL REFERENCES fractional_properties(id) ON DELETE CASCADE,
        investor_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        wallet_address VARCHAR(42) NOT NULL,
        shares_owned INTEGER NOT NULL,
        ownership_percent DECIMAL(5,2) NOT NULL,
        purchase_price DECIMAL(15,2) NOT NULL,
        total_invested DECIMAL(15,2) NOT NULL,
        tier VARCHAR(20) NOT NULL REFERENCES investor_tiers(tier_name),
        lockup_ends_at TIMESTAMP NOT NULL,
        total_revenue_earned DECIMAL(15,2) DEFAULT 0 NOT NULL,
        last_distribution_at TIMESTAMP,
        status VARCHAR(20) DEFAULT 'active' NOT NULL,
        nft_token_id VARCHAR(78),
        metadata JSONB,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
        CHECK (shares_owned > 0),
        CHECK (ownership_percent > 0 AND ownership_percent <= 100),
        CHECK (purchase_price > 0),
        CHECK (total_invested >= 500),
        CHECK (total_revenue_earned >= 0),
        UNIQUE(property_id, wallet_address)
      );
      
      CREATE INDEX IF NOT EXISTS investor_shares_property_id_idx ON investor_shares(property_id);
      CREATE INDEX IF NOT EXISTS investor_shares_wallet_address_idx ON investor_shares(wallet_address);
      CREATE INDEX IF NOT EXISTS investor_shares_investor_id_idx ON investor_shares(investor_id);
      CREATE INDEX IF NOT EXISTS investor_shares_tier_idx ON investor_shares(tier);
    `);
    
    console.log('Creating share_transactions table...');
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS share_transactions (
        id SERIAL PRIMARY KEY,
        property_id INTEGER NOT NULL REFERENCES fractional_properties(id) ON DELETE CASCADE,
        from_wallet VARCHAR(42),
        to_wallet VARCHAR(42) NOT NULL,
        shares_amount INTEGER NOT NULL,
        price_per_share DECIMAL(15,2) NOT NULL,
        total_amount DECIMAL(15,2) NOT NULL,
        transaction_type VARCHAR(20) NOT NULL,
        payment_method VARCHAR(20) NOT NULL,
        tier VARCHAR(20) REFERENCES investor_tiers(tier_name),
        tx_hash VARCHAR(66),
        stripe_payment_id VARCHAR(100),
        status VARCHAR(20) DEFAULT 'completed' NOT NULL,
        metadata JSONB,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        CHECK (shares_amount > 0),
        CHECK (price_per_share > 0),
        CHECK (total_amount >= 500),
        CHECK (transaction_type IN ('purchase', 'transfer', 'sale', 'withdrawal'))
      );
      
      CREATE INDEX IF NOT EXISTS share_transactions_property_id_idx ON share_transactions(property_id);
      CREATE INDEX IF NOT EXISTS share_transactions_to_wallet_idx ON share_transactions(to_wallet);
      CREATE INDEX IF NOT EXISTS share_transactions_type_idx ON share_transactions(transaction_type);
    `);
    
    console.log('Creating property_revenue_distributions table...');
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS property_revenue_distributions (
        id SERIAL PRIMARY KEY,
        property_id INTEGER NOT NULL REFERENCES fractional_properties(id) ON DELETE CASCADE,
        distribution_month VARCHAR(7) NOT NULL,
        total_revenue DECIMAL(15,2) NOT NULL,
        total_expenses DECIMAL(15,2) NOT NULL,
        reserve_fund DECIMAL(15,2) NOT NULL,
        net_distributable DECIMAL(15,2) NOT NULL,
        base_distribution DECIMAL(15,2) NOT NULL,
        tier_bonus_pool DECIMAL(15,2) NOT NULL,
        total_distributed DECIMAL(15,2) DEFAULT 0 NOT NULL,
        investors_paid INTEGER DEFAULT 0 NOT NULL,
        status VARCHAR(20) DEFAULT 'pending' NOT NULL,
        distributed_at TIMESTAMP,
        tx_hash VARCHAR(66),
        metadata JSONB,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        CHECK (total_revenue >= 0),
        CHECK (total_expenses >= 0),
        CHECK (reserve_fund >= 0),
        CHECK (net_distributable >= 0),
        CHECK (total_distributed >= 0),
        CHECK (investors_paid >= 0),
        UNIQUE(property_id, distribution_month)
      );
      
      CREATE INDEX IF NOT EXISTS property_revenue_property_id_idx ON property_revenue_distributions(property_id);
      CREATE INDEX IF NOT EXISTS property_revenue_month_idx ON property_revenue_distributions(distribution_month);
      CREATE INDEX IF NOT EXISTS property_revenue_status_idx ON property_revenue_distributions(status);
    `);
    
    console.log('Creating investor_revenue_payments table...');
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS investor_revenue_payments (
        id SERIAL PRIMARY KEY,
        distribution_id INTEGER NOT NULL REFERENCES property_revenue_distributions(id) ON DELETE CASCADE,
        share_record_id INTEGER NOT NULL REFERENCES investor_shares(id) ON DELETE CASCADE,
        investor_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        wallet_address VARCHAR(42) NOT NULL,
        shares_owned INTEGER NOT NULL,
        ownership_percent DECIMAL(5,2) NOT NULL,
        tier VARCHAR(20) NOT NULL REFERENCES investor_tiers(tier_name),
        base_amount DECIMAL(15,2) NOT NULL,
        tier_bonus DECIMAL(15,2) DEFAULT 0 NOT NULL,
        total_amount DECIMAL(15,2) NOT NULL,
        status VARCHAR(20) DEFAULT 'pending' NOT NULL,
        paid_at TIMESTAMP,
        tx_hash VARCHAR(66),
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        CHECK (shares_owned > 0),
        CHECK (ownership_percent > 0),
        CHECK (base_amount >= 0),
        CHECK (tier_bonus >= 0),
        CHECK (total_amount >= 0)
      );
      
      CREATE INDEX IF NOT EXISTS investor_revenue_distribution_id_idx ON investor_revenue_payments(distribution_id);
      CREATE INDEX IF NOT EXISTS investor_revenue_share_record_id_idx ON investor_revenue_payments(share_record_id);
      CREATE INDEX IF NOT EXISTS investor_revenue_wallet_idx ON investor_revenue_payments(wallet_address);
    `);
    
    console.log('Creating trigger to update fractional_properties updated_at...');
    
    await client.query(`
      CREATE OR REPLACE FUNCTION update_fractional_properties_updated_at()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
      
      DROP TRIGGER IF EXISTS fractional_properties_updated_at_trigger ON fractional_properties;
      
      CREATE TRIGGER fractional_properties_updated_at_trigger
      BEFORE UPDATE ON fractional_properties
      FOR EACH ROW
      EXECUTE FUNCTION update_fractional_properties_updated_at();
    `);
    
    await client.query('COMMIT');
    console.log('All fractional ownership tables created successfully with proper constraints!');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating fractional ownership tables:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

createFractionalTables()
  .then(() => {
    console.log('Database migration completed successfully!');
    process.exit(0);
  })
  .catch(error => {
    console.error('Failed to create database tables:', error);
    process.exit(1);
  });
