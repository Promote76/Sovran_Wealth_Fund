/**
 * Feature #4: Automated Revenue & Distribution Engine
 * Creates database tables for unified transaction ledger and automated payouts
 */

require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function createRevenueEngineTables() {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    console.log('Creating unified_transaction_ledger table...');
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS unified_transaction_ledger (
        id SERIAL PRIMARY KEY,
        transaction_id VARCHAR(36) NOT NULL UNIQUE,
        transaction_type VARCHAR(30) NOT NULL CHECK (transaction_type IN (
          'rental_income', 'appreciation', 'platform_fee', 'management_fee',
          'performance_fee', 'distribution', 'refund', 'penalty', 'other'
        )),
        source VARCHAR(30) NOT NULL CHECK (source IN (
          'property_revenue', 'trading_fees', 'subscription', 'services', 'interest'
        )),
        property_id INTEGER REFERENCES fractional_properties(id) ON DELETE SET NULL,
        investor_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        wallet_address VARCHAR(42),
        amount DECIMAL(15,2) NOT NULL,
        currency VARCHAR(10) DEFAULT 'USD' NOT NULL,
        status VARCHAR(20) DEFAULT 'pending' NOT NULL CHECK (status IN (
          'pending', 'processing', 'completed', 'failed', 'refunded'
        )),
        stripe_transaction_id VARCHAR(100),
        blockchain_tx_hash VARCHAR(66),
        payment_method VARCHAR(30),
        fee_amount DECIMAL(15,2) DEFAULT 0,
        net_amount DECIMAL(15,2),
        distribution_policy_id INTEGER,
        metadata JSONB,
        processed_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        CHECK (amount != 0)
      );
      
      CREATE INDEX IF NOT EXISTS unified_ledger_tx_id_idx ON unified_transaction_ledger(transaction_id);
      CREATE INDEX IF NOT EXISTS unified_ledger_type_idx ON unified_transaction_ledger(transaction_type);
      CREATE INDEX IF NOT EXISTS unified_ledger_source_idx ON unified_transaction_ledger(source);
      CREATE INDEX IF NOT EXISTS unified_ledger_property_idx ON unified_transaction_ledger(property_id);
      CREATE INDEX IF NOT EXISTS unified_ledger_investor_idx ON unified_transaction_ledger(investor_id);
      CREATE INDEX IF NOT EXISTS unified_ledger_wallet_idx ON unified_transaction_ledger(wallet_address);
      CREATE INDEX IF NOT EXISTS unified_ledger_status_idx ON unified_transaction_ledger(status);
      CREATE INDEX IF NOT EXISTS unified_ledger_created_idx ON unified_transaction_ledger(created_at DESC);
    `);
    
    console.log('Creating distribution_policies table...');
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS distribution_policies (
        id SERIAL PRIMARY KEY,
        policy_id VARCHAR(36) NOT NULL UNIQUE,
        policy_name VARCHAR(100) NOT NULL,
        policy_type VARCHAR(30) NOT NULL CHECK (policy_type IN (
          'pro_rata', 'tiered_bonus', 'waterfall', 'hybrid', 'custom'
        )),
        property_id INTEGER REFERENCES fractional_properties(id) ON DELETE CASCADE,
        base_allocation_percent DECIMAL(5,2) DEFAULT 80 NOT NULL,
        tier_bonus_percent DECIMAL(5,2) DEFAULT 20 NOT NULL,
        reserve_fund_percent DECIMAL(5,2) DEFAULT 10 NOT NULL,
        management_fee_percent DECIMAL(5,2) DEFAULT 0,
        performance_fee_percent DECIMAL(5,2) DEFAULT 0,
        distribution_frequency VARCHAR(20) DEFAULT 'monthly' CHECK (distribution_frequency IN (
          'daily', 'weekly', 'monthly', 'quarterly', 'annual', 'on_demand'
        )),
        min_distribution_amount DECIMAL(15,2) DEFAULT 100,
        auto_distribute BOOLEAN DEFAULT true NOT NULL,
        rules JSONB,
        is_active BOOLEAN DEFAULT true NOT NULL,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
        CHECK (base_allocation_percent + tier_bonus_percent <= 100),
        CHECK (reserve_fund_percent >= 0 AND reserve_fund_percent <= 50)
      );
      
      CREATE INDEX IF NOT EXISTS distribution_policies_property_idx ON distribution_policies(property_id);
      CREATE INDEX IF NOT EXISTS distribution_policies_active_idx ON distribution_policies(is_active);
    `);
    
    console.log('Creating payout_batches table...');
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS payout_batches (
        id SERIAL PRIMARY KEY,
        batch_id VARCHAR(36) NOT NULL UNIQUE,
        batch_name VARCHAR(100),
        distribution_policy_id INTEGER REFERENCES distribution_policies(id) ON DELETE SET NULL,
        property_id INTEGER REFERENCES fractional_properties(id) ON DELETE SET NULL,
        batch_type VARCHAR(30) NOT NULL CHECK (batch_type IN (
          'rental_distribution', 'profit_sharing', 'dividend', 'refund', 'manual'
        )),
        total_amount DECIMAL(15,2) NOT NULL,
        total_recipients INTEGER NOT NULL,
        completed_recipients INTEGER DEFAULT 0 NOT NULL,
        failed_recipients INTEGER DEFAULT 0 NOT NULL,
        status VARCHAR(20) DEFAULT 'pending' NOT NULL CHECK (status IN (
          'pending', 'processing', 'completed', 'partially_completed', 'failed'
        )),
        payment_method VARCHAR(30) DEFAULT 'stripe_connect',
        stripe_payout_id VARCHAR(100),
        initiated_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
        initiated_at TIMESTAMP DEFAULT NOW() NOT NULL,
        completed_at TIMESTAMP,
        metadata JSONB
      );
      
      CREATE INDEX IF NOT EXISTS payout_batches_batch_id_idx ON payout_batches(batch_id);
      CREATE INDEX IF NOT EXISTS payout_batches_property_idx ON payout_batches(property_id);
      CREATE INDEX IF NOT EXISTS payout_batches_status_idx ON payout_batches(status);
    `);
    
    console.log('Creating payout_transactions table...');
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS payout_transactions (
        id SERIAL PRIMARY KEY,
        payout_id VARCHAR(36) NOT NULL UNIQUE,
        batch_id INTEGER NOT NULL REFERENCES payout_batches(id) ON DELETE CASCADE,
        investor_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        wallet_address VARCHAR(42) NOT NULL,
        amount DECIMAL(15,2) NOT NULL,
        currency VARCHAR(10) DEFAULT 'USD' NOT NULL,
        tier VARCHAR(20) REFERENCES investor_tiers(tier_name),
        base_amount DECIMAL(15,2),
        tier_bonus DECIMAL(15,2) DEFAULT 0,
        status VARCHAR(20) DEFAULT 'pending' NOT NULL CHECK (status IN (
          'pending', 'processing', 'completed', 'failed', 'refunded'
        )),
        payment_method VARCHAR(30),
        stripe_payout_id VARCHAR(100),
        stripe_transfer_id VARCHAR(100),
        blockchain_tx_hash VARCHAR(66),
        bank_account_last4 VARCHAR(4),
        failure_reason TEXT,
        retry_count INTEGER DEFAULT 0,
        completed_at TIMESTAMP,
        failed_at TIMESTAMP,
        metadata JSONB,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        CHECK (amount > 0)
      );
      
      CREATE INDEX IF NOT EXISTS payout_tx_payout_id_idx ON payout_transactions(payout_id);
      CREATE INDEX IF NOT EXISTS payout_tx_batch_idx ON payout_transactions(batch_id);
      CREATE INDEX IF NOT EXISTS payout_tx_investor_idx ON payout_transactions(investor_id);
      CREATE INDEX IF NOT EXISTS payout_tx_wallet_idx ON payout_transactions(wallet_address);
      CREATE INDEX IF NOT EXISTS payout_tx_status_idx ON payout_transactions(status);
    `);
    
    console.log('Creating stripe_connect_accounts table...');
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS stripe_connect_accounts (
        id SERIAL PRIMARY KEY,
        account_id VARCHAR(36) NOT NULL UNIQUE,
        investor_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        wallet_address VARCHAR(42),
        stripe_account_id VARCHAR(100) NOT NULL UNIQUE,
        account_type VARCHAR(20) DEFAULT 'express' CHECK (account_type IN ('express', 'custom', 'standard')),
        status VARCHAR(20) DEFAULT 'pending' NOT NULL CHECK (status IN (
          'pending', 'active', 'restricted', 'disabled', 'rejected'
        )),
        charges_enabled BOOLEAN DEFAULT false,
        payouts_enabled BOOLEAN DEFAULT false,
        default_currency VARCHAR(10) DEFAULT 'USD',
        country VARCHAR(10),
        bank_accounts JSONB,
        requirements JSONB,
        onboarding_completed BOOLEAN DEFAULT false,
        onboarding_url TEXT,
        last_verified_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
        UNIQUE(investor_id)
      );
      
      CREATE INDEX IF NOT EXISTS stripe_connect_investor_idx ON stripe_connect_accounts(investor_id);
      CREATE INDEX IF NOT EXISTS stripe_connect_stripe_id_idx ON stripe_connect_accounts(stripe_account_id);
      CREATE INDEX IF NOT EXISTS stripe_connect_status_idx ON stripe_connect_accounts(status);
    `);
    
    console.log('Creating revenue_analytics table...');
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS revenue_analytics (
        id SERIAL PRIMARY KEY,
        analytics_id VARCHAR(36) NOT NULL UNIQUE,
        period_start DATE NOT NULL,
        period_end DATE NOT NULL,
        property_id INTEGER REFERENCES fractional_properties(id) ON DELETE CASCADE,
        total_revenue DECIMAL(15,2) NOT NULL,
        rental_income DECIMAL(15,2) DEFAULT 0,
        platform_fees DECIMAL(15,2) DEFAULT 0,
        management_fees DECIMAL(15,2) DEFAULT 0,
        performance_fees DECIMAL(15,2) DEFAULT 0,
        other_revenue DECIMAL(15,2) DEFAULT 0,
        total_distributed DECIMAL(15,2) DEFAULT 0,
        reserve_fund_balance DECIMAL(15,2) DEFAULT 0,
        investors_count INTEGER,
        transactions_count INTEGER,
        average_payout DECIMAL(15,2),
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        UNIQUE(property_id, period_start, period_end)
      );
      
      CREATE INDEX IF NOT EXISTS revenue_analytics_property_idx ON revenue_analytics(property_id);
      CREATE INDEX IF NOT EXISTS revenue_analytics_period_idx ON revenue_analytics(period_start, period_end);
    `);
    
    await client.query('COMMIT');
    console.log('✅ Revenue Distribution Engine tables created successfully!');
    
    console.log('\n📊 Summary:');
    console.log('  1. unified_transaction_ledger - All revenue transactions');
    console.log('  2. distribution_policies - Payout rules and configurations');
    console.log('  3. payout_batches - Batch distribution tracking');
    console.log('  4. payout_transactions - Individual investor payouts');
    console.log('  5. stripe_connect_accounts - Stripe Connect integration');
    console.log('  6. revenue_analytics - Revenue reporting and analytics');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error creating revenue engine tables:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

createRevenueEngineTables()
  .then(() => {
    console.log('\n🎉 Revenue Distribution Engine migration completed!');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n💥 Migration failed:', error);
    process.exit(1);
  });
