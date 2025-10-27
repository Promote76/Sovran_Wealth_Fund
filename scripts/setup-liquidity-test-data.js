/**
 * Setup deterministic test data for Feature #1 Liquidity Desk Tests
 */

const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

const TEST_WALLET = '0x1234567890abcdef1234567890abcdef12345678';
const TEST_WALLET_2 = '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd';

async function setupTestData() {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    console.log('Creating test deal...');
    await client.query(`
      INSERT INTO deals (
        id, source, raw_text, parsed, geocode, analysis, repairs, compliance, status
      ) VALUES (
        'LIQ_TEST_001',
        'test',
        'Test property for liquidity tests',
        '{"address": "123 Test St, Test City, ST 12345", "price": 100000, "bedrooms": 3, "bathrooms": 2}',
        '{"location": {"city": "Test City", "state": "ST", "lat": 40.7128, "lng": -74.0060}}',
        '{"roi_analysis": {"monthly_cash_flow": 500, "total_roi": 12.5}}',
        '{"estimated_repairs": 10000, "items": []}',
        '{"status": "approved", "checks_completed": true}',
        'listed'
      )
      ON CONFLICT (id) DO UPDATE 
      SET status = 'listed'
    `);
    
    console.log('Creating test fractional property...');
    const propertyResult = await client.query(`
      INSERT INTO fractional_properties (
        deal_id, total_shares, share_price, 
        property_value, lockup_months, max_ownership_percent, status
      ) 
      SELECT 
        id, 10000, 50.00, 500000, 6, 25.0, 'active'
      FROM deals WHERE id = 'LIQ_TEST_001'
      ON CONFLICT (deal_id) DO UPDATE 
      SET status = 'active'
      RETURNING id
    `);
    
    const propertyId = propertyResult.rows[0]?.id || (await client.query(`
      SELECT id FROM fractional_properties WHERE deal_id = (SELECT id FROM deals WHERE id = 'LIQ_TEST_001')
    `)).rows[0].id;
    
    console.log(`Test property ID: ${propertyId}`);
    
    console.log('Creating test users...');
    await client.query(`
      INSERT INTO users (email, wallet_address, first_name, last_name, password)
      VALUES ($1, $2, 'Test', 'User', 'testpassword123')
      ON CONFLICT (email) DO UPDATE SET wallet_address = EXCLUDED.wallet_address
    `, ['liqtest@axiom.com', TEST_WALLET]);
    
    await client.query(`
      INSERT INTO users (email, wallet_address, first_name, last_name, password)
      VALUES ($1, $2, 'Test', 'User 2', 'testpassword123')
      ON CONFLICT (email) DO UPDATE SET wallet_address = EXCLUDED.wallet_address
    `, ['liqtest2@axiom.com', TEST_WALLET_2]);
    
    console.log('Ensuring investor tier exists...');
    await client.query(`
      INSERT INTO investor_tiers (tier_name, min_investment, revenue_share_bonus, description)
      VALUES ('retail', 0, 0, 'Retail investor')
      ON CONFLICT (tier_name) DO NOTHING
    `);
    
    console.log('Creating test investor shares...');
    await client.query(`
      DELETE FROM investor_shares 
      WHERE property_id = $1 AND wallet_address IN ($2, $3)
    `, [propertyId, TEST_WALLET, TEST_WALLET_2]);
    
    await client.query(`
      INSERT INTO investor_shares (
        property_id, wallet_address, shares_owned, ownership_percent, 
        purchase_price, total_invested, tier, lockup_ends_at, status
      ) VALUES (
        $1, $2, 1000, 10.0, 50.00, 50000, 'retail',
        NOW() - INTERVAL '1 day', 'active'
      )
    `, [propertyId, TEST_WALLET]);
    
    await client.query(`
      INSERT INTO investor_shares (
        property_id, wallet_address, shares_owned, ownership_percent,
        purchase_price, total_invested, tier, lockup_ends_at, status
      ) VALUES (
        $1, $2, 500, 5.0, 50.00, 25000, 'retail',
        NOW() - INTERVAL '1 day', 'active'
      )
    `, [propertyId, TEST_WALLET_2]);
    
    await client.query('COMMIT');
    console.log('✅ Test data setup complete!');
    console.log(`   Property ID: ${propertyId}`);
    console.log(`   Wallet 1: ${TEST_WALLET} (1000 shares)`);
    console.log(`   Wallet 2: ${TEST_WALLET_2} (500 shares)`);
    console.log(`   Both wallets have unlocked shares ready for trading`);
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Setup failed:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

setupTestData()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
