/**
 * Feature #5: Property Risk Sentinel
 * Creates database tables for real-time property valuation and risk monitoring
 */

require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function createRiskSentinelTables() {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    console.log('Creating property_valuations table...');
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS property_valuations (
        id SERIAL PRIMARY KEY,
        valuation_id VARCHAR(36) NOT NULL UNIQUE,
        property_id INTEGER NOT NULL REFERENCES fractional_properties(id) ON DELETE CASCADE,
        valuation_date DATE NOT NULL,
        valuation_type VARCHAR(30) NOT NULL CHECK (valuation_type IN (
          'avm', 'comparative_market', 'appraisal', 'broker_opinion', 'tax_assessment'
        )),
        estimated_value DECIMAL(15,2) NOT NULL,
        value_low DECIMAL(15,2),
        value_high DECIMAL(15,2),
        confidence_score DECIMAL(5,2),
        data_source VARCHAR(50),
        provider_response JSONB,
        comparable_properties JSONB,
        valuation_factors JSONB,
        previous_valuation_id INTEGER,
        value_change_amount DECIMAL(15,2),
        value_change_percent DECIMAL(5,2),
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        CHECK (estimated_value > 0)
      );
      
      CREATE INDEX IF NOT EXISTS property_valuations_property_idx ON property_valuations(property_id);
      CREATE INDEX IF NOT EXISTS property_valuations_date_idx ON property_valuations(valuation_date DESC);
      CREATE INDEX IF NOT EXISTS property_valuations_type_idx ON property_valuations(valuation_type);
    `);
    
    console.log('Creating risk_monitoring_events table...');
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS risk_monitoring_events (
        id SERIAL PRIMARY KEY,
        event_id VARCHAR(36) NOT NULL UNIQUE,
        property_id INTEGER NOT NULL REFERENCES fractional_properties(id) ON DELETE CASCADE,
        event_type VARCHAR(30) NOT NULL CHECK (event_type IN (
          'flood_risk', 'fire_risk', 'earthquake_risk', 'hurricane_risk',
          'market_decline', 'vacancy', 'delinquency', 'regulatory_change',
          'environmental', 'structural', 'neighborhood_change'
        )),
        severity VARCHAR(20) NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
        risk_score DECIMAL(5,2),
        description TEXT NOT NULL,
        detected_at TIMESTAMP DEFAULT NOW() NOT NULL,
        source VARCHAR(50),
        source_data JSONB,
        impact_assessment TEXT,
        recommended_actions JSONB,
        status VARCHAR(20) DEFAULT 'active' NOT NULL CHECK (status IN (
          'active', 'monitoring', 'mitigated', 'resolved', 'false_alarm'
        )),
        resolved_at TIMESTAMP,
        resolution_notes TEXT,
        alert_sent BOOLEAN DEFAULT false,
        alert_sent_at TIMESTAMP
      );
      
      CREATE INDEX IF NOT EXISTS risk_events_property_idx ON risk_monitoring_events(property_id);
      CREATE INDEX IF NOT EXISTS risk_events_type_idx ON risk_monitoring_events(event_type);
      CREATE INDEX IF NOT EXISTS risk_events_severity_idx ON risk_monitoring_events(severity);
      CREATE INDEX IF NOT EXISTS risk_events_status_idx ON risk_monitoring_events(status);
      CREATE INDEX IF NOT EXISTS risk_events_detected_idx ON risk_monitoring_events(detected_at DESC);
    `);
    
    console.log('Creating market_conditions table...');
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS market_conditions (
        id SERIAL PRIMARY KEY,
        condition_id VARCHAR(36) NOT NULL UNIQUE,
        geographic_area VARCHAR(100) NOT NULL,
        property_type VARCHAR(50),
        period_start DATE NOT NULL,
        period_end DATE NOT NULL,
        median_sale_price DECIMAL(15,2),
        median_rent DECIMAL(15,2),
        inventory_count INTEGER,
        days_on_market INTEGER,
        sale_to_list_ratio DECIMAL(5,2),
        price_trend VARCHAR(20) CHECK (price_trend IN ('rising', 'stable', 'declining', 'volatile')),
        price_change_percent DECIMAL(5,2),
        rent_yield_percent DECIMAL(5,2),
        vacancy_rate DECIMAL(5,2),
        absorption_rate DECIMAL(5,2),
        market_temperature VARCHAR(20) CHECK (market_temperature IN ('hot', 'warm', 'balanced', 'cool', 'cold')),
        data_source VARCHAR(50),
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      );
      
      CREATE INDEX IF NOT EXISTS market_conditions_area_idx ON market_conditions(geographic_area);
      CREATE INDEX IF NOT EXISTS market_conditions_period_idx ON market_conditions(period_start, period_end);
      CREATE INDEX IF NOT EXISTS market_conditions_trend_idx ON market_conditions(price_trend);
    `);
    
    console.log('Creating property_alerts table...');
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS property_alerts (
        id SERIAL PRIMARY KEY,
        alert_id VARCHAR(36) NOT NULL UNIQUE,
        property_id INTEGER NOT NULL REFERENCES fractional_properties(id) ON DELETE CASCADE,
        alert_type VARCHAR(30) NOT NULL CHECK (alert_type IN (
          'value_drop', 'value_spike', 'risk_increase', 'market_change',
          'maintenance_needed', 'insurance_claim', 'tenant_issue', 'compliance'
        )),
        severity VARCHAR(20) NOT NULL CHECK (severity IN ('info', 'warning', 'critical', 'urgent')),
        title VARCHAR(200) NOT NULL,
        message TEXT NOT NULL,
        current_value DECIMAL(15,2),
        threshold_value DECIMAL(15,2),
        recommended_action TEXT,
        status VARCHAR(20) DEFAULT 'new' NOT NULL CHECK (status IN (
          'new', 'sent', 'acknowledged', 'resolved', 'dismissed'
        )),
        sent_to JSONB,
        sent_at TIMESTAMP,
        acknowledged_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
        acknowledged_at TIMESTAMP,
        resolved_at TIMESTAMP,
        metadata JSONB,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      );
      
      CREATE INDEX IF NOT EXISTS property_alerts_property_idx ON property_alerts(property_id);
      CREATE INDEX IF NOT EXISTS property_alerts_type_idx ON property_alerts(alert_type);
      CREATE INDEX IF NOT EXISTS property_alerts_severity_idx ON property_alerts(severity);
      CREATE INDEX IF NOT EXISTS property_alerts_status_idx ON property_alerts(status);
    `);
    
    console.log('Creating environmental_risks table...');
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS environmental_risks (
        id SERIAL PRIMARY KEY,
        risk_id VARCHAR(36) NOT NULL UNIQUE,
        property_id INTEGER NOT NULL REFERENCES fractional_properties(id) ON DELETE CASCADE,
        risk_category VARCHAR(30) NOT NULL CHECK (risk_category IN (
          'flood', 'wildfire', 'earthquake', 'hurricane', 'tornado',
          'hail', 'landslide', 'air_quality', 'soil_contamination'
        )),
        risk_level VARCHAR(20) NOT NULL CHECK (risk_level IN ('minimal', 'low', 'moderate', 'high', 'extreme')),
        probability_score DECIMAL(5,2),
        impact_score DECIMAL(5,2),
        fema_zone VARCHAR(10),
        insurance_required BOOLEAN,
        estimated_annual_loss DECIMAL(15,2),
        mitigation_measures JSONB,
        data_provider VARCHAR(50),
        last_assessed_at TIMESTAMP DEFAULT NOW() NOT NULL,
        next_assessment_at TIMESTAMP,
        metadata JSONB
      );
      
      CREATE INDEX IF NOT EXISTS environmental_risks_property_idx ON environmental_risks(property_id);
      CREATE INDEX IF NOT EXISTS environmental_risks_category_idx ON environmental_risks(risk_category);
      CREATE INDEX IF NOT EXISTS environmental_risks_level_idx ON environmental_risks(risk_level);
    `);
    
    console.log('Creating monitoring_schedules table...');
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS monitoring_schedules (
        id SERIAL PRIMARY KEY,
        schedule_id VARCHAR(36) NOT NULL UNIQUE,
        property_id INTEGER REFERENCES fractional_properties(id) ON DELETE CASCADE,
        monitor_type VARCHAR(30) NOT NULL CHECK (monitor_type IN (
          'valuation', 'risk_scan', 'market_check', 'environmental', 'compliance'
        )),
        frequency VARCHAR(20) NOT NULL CHECK (frequency IN (
          'daily', 'weekly', 'monthly', 'quarterly', 'annual'
        )),
        last_run_at TIMESTAMP,
        next_run_at TIMESTAMP NOT NULL,
        is_active BOOLEAN DEFAULT true NOT NULL,
        configuration JSONB,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      );
      
      CREATE INDEX IF NOT EXISTS monitoring_schedules_property_idx ON monitoring_schedules(property_id);
      CREATE INDEX IF NOT EXISTS monitoring_schedules_next_run_idx ON monitoring_schedules(next_run_at);
      CREATE INDEX IF NOT EXISTS monitoring_schedules_active_idx ON monitoring_schedules(is_active);
    `);
    
    await client.query('COMMIT');
    console.log('✅ Property Risk Sentinel tables created successfully!');
    
    console.log('\n📊 Summary:');
    console.log('  1. property_valuations - Automated valuation models');
    console.log('  2. risk_monitoring_events - Risk detection and tracking');
    console.log('  3. market_conditions - Market data and trends');
    console.log('  4. property_alerts - Alert and notification system');
    console.log('  5. environmental_risks - Environmental hazard tracking');
    console.log('  6. monitoring_schedules - Automated monitoring jobs');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error creating risk sentinel tables:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

createRiskSentinelTables()
  .then(() => {
    console.log('\n🎉 Property Risk Sentinel migration completed!');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n💥 Migration failed:', error);
    process.exit(1);
  });
