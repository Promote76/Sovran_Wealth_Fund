/**
 * Feature #3: Investor Intelligence Suite
 * Creates database tables for predictive analytics and investor insights
 */

require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function createIntelligenceTables() {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    console.log('Creating cash_flow_projections table...');
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS cash_flow_projections (
        id SERIAL PRIMARY KEY,
        projection_id VARCHAR(36) NOT NULL UNIQUE,
        property_id INTEGER NOT NULL REFERENCES fractional_properties(id) ON DELETE CASCADE,
        investor_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        wallet_address VARCHAR(42),
        projection_months INTEGER DEFAULT 12 NOT NULL,
        monthly_projections JSONB NOT NULL,
        total_projected_income DECIMAL(15,2) NOT NULL,
        total_projected_expenses DECIMAL(15,2) NOT NULL,
        net_projected_cash_flow DECIMAL(15,2) NOT NULL,
        confidence_score DECIMAL(5,2),
        model_version VARCHAR(20),
        assumptions JSONB,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        expires_at TIMESTAMP,
        CHECK (projection_months > 0 AND projection_months <= 60)
      );
      
      CREATE INDEX IF NOT EXISTS cash_flow_property_idx ON cash_flow_projections(property_id);
      CREATE INDEX IF NOT EXISTS cash_flow_investor_idx ON cash_flow_projections(investor_id);
      CREATE INDEX IF NOT EXISTS cash_flow_wallet_idx ON cash_flow_projections(wallet_address);
    `);
    
    console.log('Creating performance_benchmarks table...');
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS performance_benchmarks (
        id SERIAL PRIMARY KEY,
        benchmark_id VARCHAR(36) NOT NULL UNIQUE,
        benchmark_type VARCHAR(30) NOT NULL CHECK (benchmark_type IN (
          'reit_index', 'property_type', 'geographic', 'tier_cohort', 'platform_average'
        )),
        benchmark_name VARCHAR(100) NOT NULL,
        period_start DATE NOT NULL,
        period_end DATE NOT NULL,
        average_roi DECIMAL(5,2),
        average_cash_yield DECIMAL(5,2),
        average_appreciation DECIMAL(5,2),
        median_roi DECIMAL(5,2),
        total_properties INTEGER,
        total_investors INTEGER,
        total_volume DECIMAL(15,2),
        metadata JSONB,
        data_source VARCHAR(50),
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      );
      
      CREATE INDEX IF NOT EXISTS benchmarks_type_idx ON performance_benchmarks(benchmark_type);
      CREATE INDEX IF NOT EXISTS benchmarks_period_idx ON performance_benchmarks(period_start, period_end);
    `);
    
    console.log('Creating investor_cohorts table...');
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS investor_cohorts (
        id SERIAL PRIMARY KEY,
        cohort_id VARCHAR(36) NOT NULL UNIQUE,
        cohort_name VARCHAR(100) NOT NULL,
        cohort_type VARCHAR(30) NOT NULL CHECK (cohort_type IN (
          'tier_based', 'time_based', 'volume_based', 'behavior_based', 'custom'
        )),
        criteria JSONB NOT NULL,
        member_count INTEGER DEFAULT 0 NOT NULL,
        average_portfolio_value DECIMAL(15,2),
        average_roi DECIMAL(5,2),
        average_hold_period_days INTEGER,
        total_invested DECIMAL(15,2),
        is_active BOOLEAN DEFAULT true NOT NULL,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      );
    `);
    
    console.log('Creating portfolio_analytics table...');
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS portfolio_analytics (
        id SERIAL PRIMARY KEY,
        analytics_id VARCHAR(36) NOT NULL UNIQUE,
        investor_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        wallet_address VARCHAR(42) NOT NULL,
        snapshot_date DATE NOT NULL,
        total_portfolio_value DECIMAL(15,2) NOT NULL,
        total_invested DECIMAL(15,2) NOT NULL,
        total_returns DECIMAL(15,2) NOT NULL,
        roi_percent DECIMAL(5,2) NOT NULL,
        properties_count INTEGER NOT NULL,
        diversification_score DECIMAL(5,2),
        risk_score DECIMAL(5,2),
        performance_vs_benchmark DECIMAL(5,2),
        cohort_ranking INTEGER,
        total_cohort_size INTEGER,
        predicted_12mo_return DECIMAL(15,2),
        prediction_confidence DECIMAL(5,2),
        insights JSONB,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        UNIQUE(investor_id, snapshot_date)
      );
      
      CREATE INDEX IF NOT EXISTS portfolio_analytics_investor_idx ON portfolio_analytics(investor_id);
      CREATE INDEX IF NOT EXISTS portfolio_analytics_wallet_idx ON portfolio_analytics(wallet_address);
      CREATE INDEX IF NOT EXISTS portfolio_analytics_date_idx ON portfolio_analytics(snapshot_date DESC);
    `);
    
    console.log('Creating risk_assessments table...');
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS risk_assessments (
        id SERIAL PRIMARY KEY,
        assessment_id VARCHAR(36) NOT NULL UNIQUE,
        property_id INTEGER REFERENCES fractional_properties(id) ON DELETE CASCADE,
        investor_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        assessment_type VARCHAR(30) NOT NULL CHECK (assessment_type IN (
          'property_risk', 'portfolio_risk', 'market_risk', 'liquidity_risk'
        )),
        risk_level VARCHAR(20) NOT NULL CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
        risk_score DECIMAL(5,2) NOT NULL,
        risk_factors JSONB NOT NULL,
        mitigation_strategies JSONB,
        assessed_at TIMESTAMP DEFAULT NOW() NOT NULL,
        valid_until TIMESTAMP,
        created_by VARCHAR(50) DEFAULT 'system'
      );
      
      CREATE INDEX IF NOT EXISTS risk_assessments_property_idx ON risk_assessments(property_id);
      CREATE INDEX IF NOT EXISTS risk_assessments_investor_idx ON risk_assessments(investor_id);
      CREATE INDEX IF NOT EXISTS risk_assessments_level_idx ON risk_assessments(risk_level);
    `);
    
    await client.query('COMMIT');
    console.log('✅ Investor Intelligence tables created successfully!');
    
    console.log('\n📊 Summary:');
    console.log('  1. cash_flow_projections - 12-month cash flow predictions');
    console.log('  2. performance_benchmarks - REIT and market benchmarks');
    console.log('  3. investor_cohorts - Cohort analysis and rankings');
    console.log('  4. portfolio_analytics - Daily portfolio snapshots');
    console.log('  5. risk_assessments - Risk scoring and factors');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error creating intelligence tables:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

createIntelligenceTables()
  .then(() => {
    console.log('\n🎉 Investor Intelligence migration completed!');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n💥 Migration failed:', error);
    process.exit(1);
  });
