/**
 * Feature #1: Automated Liquidity & Redemption Desk
 * Creates database tables for secondary market trading
 */

require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function createLiquidityDeskTables() {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    console.log('Creating liquidity_orders table...');
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS liquidity_orders (
        id SERIAL PRIMARY KEY,
        order_id VARCHAR(36) NOT NULL UNIQUE,
        order_type VARCHAR(10) NOT NULL CHECK (order_type IN ('sell', 'buy')),
        property_id INTEGER NOT NULL REFERENCES fractional_properties(id) ON DELETE CASCADE,
        investor_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        wallet_address VARCHAR(42) NOT NULL,
        shares_amount INTEGER NOT NULL,
        price_per_share DECIMAL(15,2) NOT NULL,
        total_value DECIMAL(15,2) NOT NULL,
        shares_filled INTEGER DEFAULT 0 NOT NULL,
        shares_remaining INTEGER GENERATED ALWAYS AS (shares_amount - shares_filled) STORED,
        status VARCHAR(20) DEFAULT 'open' NOT NULL CHECK (status IN ('open', 'partial', 'filled', 'cancelled', 'expired')),
        priority_score DECIMAL(10,2) GENERATED ALWAYS AS (
          CASE 
            WHEN order_type = 'sell' THEN price_per_share
            ELSE -price_per_share
          END
        ) STORED,
        expires_at TIMESTAMP,
        lockup_status VARCHAR(20) DEFAULT 'pending' NOT NULL CHECK (lockup_status IN ('eligible', 'locked', 'pending')),
        lockup_ends_at TIMESTAMP,
        compliance_checked BOOLEAN DEFAULT false NOT NULL,
        compliance_notes TEXT,
        metadata JSONB,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
        filled_at TIMESTAMP,
        cancelled_at TIMESTAMP,
        CHECK (shares_amount > 0),
        CHECK (price_per_share > 0),
        CHECK (total_value > 0),
        CHECK (shares_filled >= 0 AND shares_filled <= shares_amount)
      );
      
      CREATE INDEX IF NOT EXISTS liquidity_orders_order_id_idx ON liquidity_orders(order_id);
      CREATE INDEX IF NOT EXISTS liquidity_orders_property_id_idx ON liquidity_orders(property_id);
      CREATE INDEX IF NOT EXISTS liquidity_orders_wallet_idx ON liquidity_orders(wallet_address);
      CREATE INDEX IF NOT EXISTS liquidity_orders_status_idx ON liquidity_orders(status);
      CREATE INDEX IF NOT EXISTS liquidity_orders_type_idx ON liquidity_orders(order_type);
      CREATE INDEX IF NOT EXISTS liquidity_orders_priority_idx ON liquidity_orders(priority_score DESC);
      CREATE INDEX IF NOT EXISTS liquidity_orders_created_idx ON liquidity_orders(created_at DESC);
    `);
    
    console.log('Creating order_matches table...');
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS order_matches (
        id SERIAL PRIMARY KEY,
        match_id VARCHAR(36) NOT NULL UNIQUE,
        sell_order_id INTEGER NOT NULL REFERENCES liquidity_orders(id) ON DELETE CASCADE,
        buy_order_id INTEGER,
        property_id INTEGER NOT NULL REFERENCES fractional_properties(id) ON DELETE CASCADE,
        seller_wallet VARCHAR(42) NOT NULL,
        buyer_wallet VARCHAR(42) NOT NULL,
        shares_matched INTEGER NOT NULL,
        price_per_share DECIMAL(15,2) NOT NULL,
        total_amount DECIMAL(15,2) NOT NULL,
        platform_fee DECIMAL(15,2) NOT NULL,
        seller_receives DECIMAL(15,2) NOT NULL,
        buyer_pays DECIMAL(15,2) NOT NULL,
        match_source VARCHAR(20) NOT NULL CHECK (match_source IN ('treasury', 'investor', 'queue')),
        status VARCHAR(20) DEFAULT 'pending' NOT NULL CHECK (status IN ('pending', 'settling', 'completed', 'failed', 'cancelled')),
        settlement_method VARCHAR(20) CHECK (settlement_method IN ('stripe', 'blockchain', 'ach')),
        stripe_payment_id VARCHAR(100),
        tx_hash VARCHAR(66),
        cost_basis DECIMAL(15,2),
        seller_tier VARCHAR(20) REFERENCES investor_tiers(tier_name),
        buyer_tier VARCHAR(20) REFERENCES investor_tiers(tier_name),
        metadata JSONB,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        settled_at TIMESTAMP,
        failed_at TIMESTAMP,
        failure_reason TEXT,
        CHECK (shares_matched > 0),
        CHECK (price_per_share > 0),
        CHECK (total_amount > 0),
        CHECK (platform_fee >= 0),
        CHECK (seller_receives >= 0),
        CHECK (buyer_pays >= 0)
      );
      
      CREATE INDEX IF NOT EXISTS order_matches_match_id_idx ON order_matches(match_id);
      CREATE INDEX IF NOT EXISTS order_matches_sell_order_idx ON order_matches(sell_order_id);
      CREATE INDEX IF NOT EXISTS order_matches_property_id_idx ON order_matches(property_id);
      CREATE INDEX IF NOT EXISTS order_matches_seller_idx ON order_matches(seller_wallet);
      CREATE INDEX IF NOT EXISTS order_matches_buyer_idx ON order_matches(buyer_wallet);
      CREATE INDEX IF NOT EXISTS order_matches_status_idx ON order_matches(status);
      CREATE INDEX IF NOT EXISTS order_matches_source_idx ON order_matches(match_source);
    `);
    
    console.log('Creating treasury_ledger table...');
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS treasury_ledger (
        id SERIAL PRIMARY KEY,
        transaction_id VARCHAR(36) NOT NULL UNIQUE,
        property_id INTEGER REFERENCES fractional_properties(id) ON DELETE SET NULL,
        transaction_type VARCHAR(30) NOT NULL CHECK (transaction_type IN (
          'buy_shares', 'sell_shares', 'deposit', 'withdrawal', 
          'fee_revenue', 'rebalance', 'reserve'
        )),
        shares_amount INTEGER,
        price_per_share DECIMAL(15,2),
        cash_amount DECIMAL(15,2) NOT NULL,
        cash_balance_before DECIMAL(15,2) NOT NULL,
        cash_balance_after DECIMAL(15,2) NOT NULL,
        shares_balance_change INTEGER DEFAULT 0,
        match_id INTEGER REFERENCES order_matches(id) ON DELETE SET NULL,
        authorized_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
        notes TEXT,
        metadata JSONB,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        CHECK (cash_amount != 0 OR shares_amount IS NOT NULL),
        CHECK (cash_balance_before >= 0),
        CHECK (cash_balance_after >= 0)
      );
      
      CREATE INDEX IF NOT EXISTS treasury_ledger_tx_id_idx ON treasury_ledger(transaction_id);
      CREATE INDEX IF NOT EXISTS treasury_ledger_property_idx ON treasury_ledger(property_id);
      CREATE INDEX IF NOT EXISTS treasury_ledger_type_idx ON treasury_ledger(transaction_type);
      CREATE INDEX IF NOT EXISTS treasury_ledger_created_idx ON treasury_ledger(created_at DESC);
      CREATE INDEX IF NOT EXISTS treasury_ledger_match_idx ON treasury_ledger(match_id);
    `);
    
    console.log('Creating compliance_holds table...');
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS compliance_holds (
        id SERIAL PRIMARY KEY,
        hold_id VARCHAR(36) NOT NULL UNIQUE,
        investor_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        wallet_address VARCHAR(42) NOT NULL,
        property_id INTEGER REFERENCES fractional_properties(id) ON DELETE CASCADE,
        share_record_id INTEGER REFERENCES investor_shares(id) ON DELETE CASCADE,
        hold_type VARCHAR(30) NOT NULL CHECK (hold_type IN (
          'lockup_period', 'kyc_pending', 'aml_review', 
          'ownership_limit', 'manual_hold', 'regulatory'
        )),
        hold_reason TEXT NOT NULL,
        shares_held INTEGER NOT NULL,
        can_trade_after TIMESTAMP,
        status VARCHAR(20) DEFAULT 'active' NOT NULL CHECK (status IN ('active', 'released', 'expired')),
        placed_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
        released_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
        placed_at TIMESTAMP DEFAULT NOW() NOT NULL,
        released_at TIMESTAMP,
        admin_notes TEXT,
        metadata JSONB,
        CHECK (shares_held > 0)
      );
      
      CREATE INDEX IF NOT EXISTS compliance_holds_hold_id_idx ON compliance_holds(hold_id);
      CREATE INDEX IF NOT EXISTS compliance_holds_wallet_idx ON compliance_holds(wallet_address);
      CREATE INDEX IF NOT EXISTS compliance_holds_property_idx ON compliance_holds(property_id);
      CREATE INDEX IF NOT EXISTS compliance_holds_status_idx ON compliance_holds(status);
      CREATE INDEX IF NOT EXISTS compliance_holds_type_idx ON compliance_holds(hold_type);
      CREATE INDEX IF NOT EXISTS compliance_holds_share_record_idx ON compliance_holds(share_record_id);
    `);
    
    console.log('Creating fee_ledger table...');
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS fee_ledger (
        id SERIAL PRIMARY KEY,
        fee_id VARCHAR(36) NOT NULL UNIQUE,
        fee_type VARCHAR(30) NOT NULL CHECK (fee_type IN (
          'market_making', 'platform_fee', 'transaction_fee', 
          'spread', 'listing_fee', 'withdrawal_fee'
        )),
        match_id INTEGER REFERENCES order_matches(id) ON DELETE SET NULL,
        property_id INTEGER REFERENCES fractional_properties(id) ON DELETE SET NULL,
        payer_wallet VARCHAR(42),
        fee_amount DECIMAL(15,2) NOT NULL,
        fee_percentage DECIMAL(5,2),
        basis_amount DECIMAL(15,2),
        revenue_category VARCHAR(30) DEFAULT 'trading_fees',
        status VARCHAR(20) DEFAULT 'collected' NOT NULL CHECK (status IN ('pending', 'collected', 'refunded')),
        stripe_fee_id VARCHAR(100),
        distributed_to_treasury BOOLEAN DEFAULT false NOT NULL,
        distributed_at TIMESTAMP,
        metadata JSONB,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        CHECK (fee_amount >= 0),
        CHECK (fee_percentage IS NULL OR (fee_percentage >= 0 AND fee_percentage <= 100))
      );
      
      CREATE INDEX IF NOT EXISTS fee_ledger_fee_id_idx ON fee_ledger(fee_id);
      CREATE INDEX IF NOT EXISTS fee_ledger_type_idx ON fee_ledger(fee_type);
      CREATE INDEX IF NOT EXISTS fee_ledger_match_idx ON fee_ledger(match_id);
      CREATE INDEX IF NOT EXISTS fee_ledger_property_idx ON fee_ledger(property_id);
      CREATE INDEX IF NOT EXISTS fee_ledger_status_idx ON fee_ledger(status);
      CREATE INDEX IF NOT EXISTS fee_ledger_created_idx ON fee_ledger(created_at DESC);
    `);
    
    console.log('Creating liquidity_pool_config table...');
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS liquidity_pool_config (
        id SERIAL PRIMARY KEY,
        config_name VARCHAR(50) NOT NULL UNIQUE,
        total_cash_balance DECIMAL(15,2) DEFAULT 0 NOT NULL,
        reserved_cash DECIMAL(15,2) DEFAULT 0 NOT NULL,
        available_cash DECIMAL(15,2) GENERATED ALWAYS AS (total_cash_balance - reserved_cash) STORED,
        min_cash_threshold DECIMAL(15,2) DEFAULT 10000 NOT NULL,
        max_position_size DECIMAL(15,2) DEFAULT 100000 NOT NULL,
        default_spread_percent DECIMAL(5,2) DEFAULT 2.0 NOT NULL,
        max_ownership_per_property DECIMAL(5,2) DEFAULT 10.0 NOT NULL,
        auto_rebalance_enabled BOOLEAN DEFAULT true NOT NULL,
        rebalance_threshold DECIMAL(5,2) DEFAULT 20.0 NOT NULL,
        low_liquidity_alert_threshold DECIMAL(15,2) DEFAULT 25000 NOT NULL,
        is_active BOOLEAN DEFAULT true NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
        CHECK (total_cash_balance >= 0),
        CHECK (reserved_cash >= 0 AND reserved_cash <= total_cash_balance),
        CHECK (min_cash_threshold >= 0),
        CHECK (max_position_size >= min_cash_threshold),
        CHECK (default_spread_percent >= 0 AND default_spread_percent <= 100),
        CHECK (max_ownership_per_property > 0 AND max_ownership_per_property <= 100),
        CHECK (rebalance_threshold >= 0 AND rebalance_threshold <= 100),
        CHECK (low_liquidity_alert_threshold >= 0)
      );
      
      -- Seed default config
      INSERT INTO liquidity_pool_config (config_name, total_cash_balance, min_cash_threshold, max_position_size)
      VALUES ('default', 100000, 25000, 100000)
      ON CONFLICT (config_name) DO NOTHING;
    `);
    
    console.log('Creating triggers for updated_at columns...');
    
    await client.query(`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
      
      DROP TRIGGER IF EXISTS liquidity_orders_updated_at_trigger ON liquidity_orders;
      CREATE TRIGGER liquidity_orders_updated_at_trigger
      BEFORE UPDATE ON liquidity_orders
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
      
      DROP TRIGGER IF EXISTS liquidity_pool_config_updated_at_trigger ON liquidity_pool_config;
      CREATE TRIGGER liquidity_pool_config_updated_at_trigger
      BEFORE UPDATE ON liquidity_pool_config
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
    `);
    
    console.log('Creating view for eligible sell orders...');
    
    await client.query(`
      CREATE OR REPLACE VIEW eligible_sell_orders AS
      SELECT 
        lo.*,
        ist.lockup_ends_at as investor_lockup_ends,
        fp.lockup_months,
        CASE 
          WHEN lo.lockup_ends_at <= NOW() THEN 'eligible'
          ELSE 'locked'
        END as computed_lockup_status
      FROM liquidity_orders lo
      LEFT JOIN investor_shares ist ON lo.property_id = ist.property_id 
        AND lo.wallet_address = ist.wallet_address
      LEFT JOIN fractional_properties fp ON lo.property_id = fp.id
      WHERE lo.status = 'open' 
        AND lo.order_type = 'sell'
        AND lo.compliance_checked = true;
    `);
    
    await client.query('COMMIT');
    console.log('✅ Liquidity & Redemption Desk tables created successfully!');
    
    // Print summary
    console.log('\n📊 Summary of tables created:');
    console.log('  1. liquidity_orders - Order book for buy/sell orders');
    console.log('  2. order_matches - Matched orders and settlements');
    console.log('  3. treasury_ledger - Treasury operations and balances');
    console.log('  4. compliance_holds - Lockup and compliance tracking');
    console.log('  5. fee_ledger - Fee collection and revenue tracking');
    console.log('  6. liquidity_pool_config - Treasury configuration');
    console.log('  7. eligible_sell_orders (view) - Compliance-ready orders');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error creating liquidity desk tables:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

createLiquidityDeskTables()
  .then(() => {
    console.log('\n🎉 Liquidity & Redemption Desk migration completed!');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n💥 Migration failed:', error);
    process.exit(1);
  });
