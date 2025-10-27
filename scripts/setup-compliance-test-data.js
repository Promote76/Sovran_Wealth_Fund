/**
 * Feature #2: Smart Compliance Orchestrator - Test Data Setup
 * Creates deterministic test data for compliance testing
 */

require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const TEST_USER_EMAIL = 'compliance_test@axiom.dev';
const TEST_WALLET = '0x1234567890abcdef1234567890abcdef12345678';

async function setupTestData() {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    console.log('Setting up compliance test data...');
    
    console.log('Creating test user...');
    const userResult = await client.query(`
      INSERT INTO users (email, first_name, last_name, password, role, email_verified)
      VALUES ($1, 'Compliance', 'Test', 'hashedpassword', 'investor', true)
      ON CONFLICT (email) 
      DO UPDATE SET first_name = 'Compliance', last_name = 'Test'
      RETURNING id
    `, [TEST_USER_EMAIL]);
    
    const testUserId = userResult.rows[0].id;
    console.log(`Test user ID: ${testUserId}`);
    
    console.log('Creating test investor tier...');
    await client.query(`
      INSERT INTO investor_tiers (tier_name, revenue_share_bonus, min_investment, max_investment, description)
      VALUES ('retail', 0, 500, 50000, 'Retail investor tier')
      ON CONFLICT (tier_name) DO NOTHING
    `);
    
    console.log('Cleaning up existing test data...');
    await client.query(`
      DELETE FROM compliance_alerts WHERE investor_id = $1
    `, [testUserId]);
    
    await client.query(`
      DELETE FROM regulatory_filings WHERE filed_by = $1
    `, [testUserId]);
    
    await client.query(`
      DELETE FROM aml_checks WHERE investor_id = $1
    `, [testUserId]);
    
    await client.query(`
      DELETE FROM accreditation_verifications WHERE investor_id = $1
    `, [testUserId]);
    
    await client.query('COMMIT');
    console.log('✅ Test data setup complete!');
    console.log(`   User ID: ${testUserId}`);
    console.log(`   Email: ${TEST_USER_EMAIL}`);
    console.log(`   Wallet: ${TEST_WALLET}`);
    
    return { testUserId, testEmail: TEST_USER_EMAIL, testWallet: TEST_WALLET };
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error setting up test data:', error);
    throw error;
  } finally {
    client.release();
  }
}

if (require.main === module) {
  setupTestData()
    .then(() => {
      console.log('\n🎉 Compliance test data setup completed!');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n💥 Setup failed:', error);
      process.exit(1);
    });
}

module.exports = { setupTestData, TEST_USER_EMAIL, TEST_WALLET };
