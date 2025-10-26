/**
 * Create fractional real estate ownership tables
 * Run this script to create the necessary tables in the database
 */

require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function createFractionalTables() {
  try {
    console.log('Creating fractional_properties table...');
    
    await pool.query(`
      CREATE TABLE IF NOT EXISTS fractional_properties (
        id SERIAL PRIMARY KEY,
        deal_id VARCHAR(36) NOT NULL UNIQUE,
        total_shares INTEGER DEFAULT 10000 NOT NULL,
        share_price DECIMAL(15,2) NOT NULL,
        property_value DECIMAL(15,2) NOT NULL,
        shares_sold INTEGER DEFAULT 0 NOT NULL,
        shares_available INTEGER NOT NULL,
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
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      );
      
      CREATE INDEX IF NOT EXISTS fractional_properties_deal_id_idx ON fractional_properties(deal_id);
      CREATE INDEX IF NOT EXISTS fractional_properties_status_idx ON fractional_properties(status);
    `);
    
    console.log('Creating investor_shares table...');
    
    await pool.query(`
      CREATE TABLE IF NOT EXISTS investor_shares (
        id SERIAL PRIMARY KEY,
        property_id INTEGER NOT NULL,
        investor_id INTEGER,
        wallet_address VARCHAR(42) NOT NULL,
        shares_owned INTEGER NOT NULL,
        ownership_percent DECIMAL(5,2) NOT NULL,
        purchase_price DECIMAL(15,2) NOT NULL,
        total_invested DECIMAL(15,2) NOT NULL,
        tier VARCHAR(20) NOT NULL,
        lockup_ends_at TIMESTAMP NOT NULL,
        total_revenue_earned DECIMAL(15,2) DEFAULT 0 NOT NULL,
        last_distribution_at TIMESTAMP,
        status VARCHAR(20) DEFAULT 'active' NOT NULL,
        nft_token_id VARCHAR(78),
        metadata JSONB,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      );
      
      CREATE INDEX IF NOT EXISTS investor_shares_property_id_idx ON investor_shares(property_id);
      CREATE INDEX IF NOT EXISTS investor_shares_wallet_address_idx ON investor_shares(wallet_address);
      CREATE INDEX IF NOT EXISTS investor_shares_investor_id_idx ON investor_shares(investor_id);
    `);
    
    console.log('Creating share_transactions table...');
    
    await pool.query(`
      CREATE TABLE IF NOT EXISTS share_transactions (
        id SERIAL PRIMARY KEY,
        property_id INTEGER NOT NULL,
        from_wallet VARCHAR(42),
        to_wallet VARCHAR(42) NOT NULL,
        shares_amount INTEGER NOT NULL,
        price_per_share DECIMAL(15,2) NOT NULL,
        total_amount DECIMAL(15,2) NOT NULL,
        transaction_type VARCHAR(20) NOT NULL,
        payment_method VARCHAR(20) NOT NULL,
        tier VARCHAR(20),
        tx_hash VARCHAR(66),
        stripe_payment_id VARCHAR(100),
        status VARCHAR(20) DEFAULT 'completed' NOT NULL,
        metadata JSONB,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      );
      
      CREATE INDEX IF NOT EXISTS share_transactions_property_id_idx ON share_transactions(property_id);
      CREATE INDEX IF NOT EXISTS share_transactions_to_wallet_idx ON share_transactions(to_wallet);
      CREATE INDEX IF NOT EXISTS share_transactions_type_idx ON share_transactions(transaction_type);
    `);
    
    console.log('Creating property_revenue_distributions table...');
    
    await pool.query(`
      CREATE TABLE IF NOT EXISTS property_revenue_distributions (
        id SERIAL PRIMARY KEY,
        property_id INTEGER NOT NULL,
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
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      );
      
      CREATE INDEX IF NOT EXISTS property_revenue_property_id_idx ON property_revenue_distributions(property_id);
      CREATE INDEX IF NOT EXISTS property_revenue_month_idx ON property_revenue_distributions(distribution_month);
      CREATE INDEX IF NOT EXISTS property_revenue_status_idx ON property_revenue_distributions(status);
    `);
    
    console.log('Creating investor_revenue_payments table...');
    
    await pool.query(`
      CREATE TABLE IF NOT EXISTS investor_revenue_payments (
        id SERIAL PRIMARY KEY,
        distribution_id INTEGER NOT NULL,
        share_record_id INTEGER NOT NULL,
        investor_id INTEGER,
        wallet_address VARCHAR(42) NOT NULL,
        shares_owned INTEGER NOT NULL,
        ownership_percent DECIMAL(5,2) NOT NULL,
        tier VARCHAR(20) NOT NULL,
        base_amount DECIMAL(15,2) NOT NULL,
        tier_bonus DECIMAL(15,2) DEFAULT 0 NOT NULL,
        total_amount DECIMAL(15,2) NOT NULL,
        status VARCHAR(20) DEFAULT 'pending' NOT NULL,
        paid_at TIMESTAMP,
        tx_hash VARCHAR(66),
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      );
      
      CREATE INDEX IF NOT EXISTS investor_revenue_distribution_id_idx ON investor_revenue_payments(distribution_id);
      CREATE INDEX IF NOT EXISTS investor_revenue_share_record_id_idx ON investor_revenue_payments(share_record_id);
      CREATE INDEX IF NOT EXISTS investor_revenue_wallet_idx ON investor_revenue_payments(wallet_address);
    `);
    
    console.log('All fractional ownership tables created successfully!');
  } catch (error) {
    console.error('Error creating fractional ownership tables:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

createFractionalTables()
  .then(() => {
    console.log('Database tables created successfully!');
    process.exit(0);
  })
  .catch(error => {
    console.error('Failed to create database tables:', error);
    process.exit(1);
  });
