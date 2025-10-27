/**
 * Feature #3: Investor Intelligence Suite - Test Data Setup
 * Creates deterministic test data for running intelligence tests
 */

require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function setupIntelligenceTestData() {
  const client = await pool.connect();
  
  try {
    console.log('Setting up intelligence test data...');
    
    console.log('Creating test user...');
    const userResult = await client.query(`
      INSERT INTO users (email, first_name, last_name, wallet_address, role, account_status, password)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (email) DO UPDATE SET
        first_name = EXCLUDED.first_name,
        last_name = EXCLUDED.last_name,
        wallet_address = EXCLUDED.wallet_address
      RETURNING id
    `, ['intelligence_test@axiom.dev', 'Intelligence', 'Tester', '0xabcd1234abcd1234abcd1234abcd1234abcd1234', 'admin', 'active', 'test_password']);
    
    const testUserId = userResult.rows[0].id;
    console.log(`Test user ID: ${testUserId}`);
    
    console.log('Finding or creating test property...');
    let propertyId;
    
    const existingProperty = await client.query(
      `SELECT id FROM fractional_properties LIMIT 1`
    );
    
    if (existingProperty.rows.length > 0) {
      propertyId = existingProperty.rows[0].id;
      console.log(`Using existing property ID: ${propertyId}`);
    } else {
      const propertyResult = await client.query(`
        INSERT INTO fractional_properties (
          name, total_shares, share_price, monthly_rent, monthly_expenses
        ) VALUES ($1, $2, $3, $4, $5)
        RETURNING id
      `, ['Intelligence Test Property', 10000, 50, 2000, 800]);
      propertyId = propertyResult.rows[0].id;
      console.log(`Created new property ID: ${propertyId}`);
    }
    
    console.log(`Test property ID: ${propertyId}`);
    
    console.log('Creating test investor shares...');
    const existingShares = await client.query(`
      SELECT id FROM investor_shares 
      WHERE investor_id = $1 AND property_id = $2
    `, [testUserId, propertyId]);
    
    if (existingShares.rows.length === 0) {
      await client.query(`
        INSERT INTO investor_shares (
          investor_id, property_id, wallet_address, shares_owned, total_invested, 
          total_revenue_earned, tier, status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `, [testUserId, propertyId, '0xabcd1234abcd1234abcd1234abcd1234abcd1234', 200, 10000, 500, 'retail', 'active']);
    } else {
      await client.query(`
        UPDATE investor_shares 
        SET shares_owned = $3, total_invested = $4, total_revenue_earned = $5
        WHERE investor_id = $1 AND property_id = $2
      `, [testUserId, propertyId, 200, 10000, 500]);
    }
    
    console.log('Cleaning up existing test data...');
    await client.query(`
      DELETE FROM cash_flow_projections WHERE investor_id = $1
    `, [testUserId]);
    
    await client.query(`
      DELETE FROM portfolio_analytics WHERE investor_id = $1
    `, [testUserId]);
    
    await client.query(`
      DELETE FROM risk_assessments WHERE investor_id = $1
    `, [testUserId]);
    
    await client.query(`
      DELETE FROM performance_benchmarks WHERE benchmark_name = 'Test Platform Average'
    `);
    
    console.log('✅ Test data setup complete!');
    console.log(`   User ID: ${testUserId}`);
    console.log(`   Email: intelligence_test@axiom.dev`);
    console.log(`   Property ID: ${propertyId}`);
    console.log(`   Wallet: 0xabcd1234abcd1234abcd1234abcd1234abcd1234`);
    
    return {
      testUserId,
      propertyId
    };
    
  } catch (error) {
    console.error('Error setting up test data:', error);
    throw error;
  } finally {
    client.release();
  }
}

async function cleanupIntelligenceTestData(testUserId) {
  const client = await pool.connect();
  
  try {
    console.log('\n🧹 Cleaning up test data...');
    
    await client.query(`DELETE FROM cash_flow_projections WHERE investor_id = $1`, [testUserId]);
    await client.query(`DELETE FROM portfolio_analytics WHERE investor_id = $1`, [testUserId]);
    await client.query(`DELETE FROM risk_assessments WHERE investor_id = $1`, [testUserId]);
    await client.query(`DELETE FROM performance_benchmarks WHERE benchmark_name = 'Test Platform Average'`);
    
    console.log('✅ Test data cleaned');
    
  } catch (error) {
    console.error('Error cleaning up test data:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

module.exports = {
  setupIntelligenceTestData,
  cleanupIntelligenceTestData
};

if (require.main === module) {
  setupIntelligenceTestData()
    .then(() => {
      console.log('\n✅ Setup complete! Run tests with: node tests/intelligence-suite-test.js');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n❌ Setup failed:', error);
      process.exit(1);
    });
}
