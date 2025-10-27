/**
 * Feature #6: Co-Investment Syndication Portal
 * Creates database tables for investor syndicates and waterfalls
 */

require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function createSyndicationTables() {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    console.log('Creating syndicates table...');
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS syndicates (
        id SERIAL PRIMARY KEY,
        syndicate_id VARCHAR(36) NOT NULL UNIQUE,
        syndicate_name VARCHAR(200) NOT NULL,
        lead_investor_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        lead_wallet_address VARCHAR(42) NOT NULL,
        property_id INTEGER REFERENCES fractional_properties(id) ON DELETE SET NULL,
        syndicate_type VARCHAR(30) DEFAULT 'deal_specific' CHECK (syndicate_type IN (
          'deal_specific', 'blind_pool', 'permanent', 'series'
        )),
        target_raise DECIMAL(15,2) NOT NULL,
        minimum_commitment DECIMAL(15,2) DEFAULT 5000 NOT NULL,
        maximum_commitment DECIMAL(15,2),
        total_committed DECIMAL(15,2) DEFAULT 0 NOT NULL,
        total_members INTEGER DEFAULT 1 NOT NULL,
        status VARCHAR(20) DEFAULT 'fundraising' NOT NULL CHECK (status IN (
          'draft', 'fundraising', 'fully_funded', 'deployed', 'closed', 'dissolved'
        )),
        visibility VARCHAR(20) DEFAULT 'private' CHECK (visibility IN ('public', 'private', 'invite_only')),
        waterfall_structure VARCHAR(30) NOT NULL CHECK (waterfall_structure IN (
          'pro_rata', 'preferred_return', 'tiered', 'carried_interest', 'custom'
        )),
        preferred_return_percent DECIMAL(5,2) DEFAULT 0,
        carried_interest_percent DECIMAL(5,2) DEFAULT 0,
        management_fee_percent DECIMAL(5,2) DEFAULT 0,
        distribution_frequency VARCHAR(20) DEFAULT 'quarterly',
        fundraising_deadline TIMESTAMP,
        fully_funded_at TIMESTAMP,
        deployed_at TIMESTAMP,
        closed_at TIMESTAMP,
        description TEXT,
        terms_url TEXT,
        metadata JSONB,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
        CHECK (target_raise > 0),
        CHECK (minimum_commitment >= 1000),
        CHECK (total_committed >= 0 AND total_committed <= target_raise)
      );
      
      CREATE INDEX IF NOT EXISTS syndicates_syndicate_id_idx ON syndicates(syndicate_id);
      CREATE INDEX IF NOT EXISTS syndicates_lead_idx ON syndicates(lead_investor_id);
      CREATE INDEX IF NOT EXISTS syndicates_property_idx ON syndicates(property_id);
      CREATE INDEX IF NOT EXISTS syndicates_status_idx ON syndicates(status);
      CREATE INDEX IF NOT EXISTS syndicates_visibility_idx ON syndicates(visibility);
    `);
    
    console.log('Creating syndicate_members table...');
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS syndicate_members (
        id SERIAL PRIMARY KEY,
        member_id VARCHAR(36) NOT NULL UNIQUE,
        syndicate_id INTEGER NOT NULL REFERENCES syndicates(id) ON DELETE CASCADE,
        investor_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        wallet_address VARCHAR(42) NOT NULL,
        member_role VARCHAR(20) DEFAULT 'member' CHECK (member_role IN ('lead', 'co_lead', 'member', 'advisor')),
        commitment_amount DECIMAL(15,2) NOT NULL,
        funded_amount DECIMAL(15,2) DEFAULT 0 NOT NULL,
        ownership_percent DECIMAL(5,2),
        status VARCHAR(20) DEFAULT 'pending' NOT NULL CHECK (status IN (
          'invited', 'pending', 'accepted', 'funded', 'exited'
        )),
        invited_at TIMESTAMP DEFAULT NOW() NOT NULL,
        accepted_at TIMESTAMP,
        funded_at TIMESTAMP,
        exited_at TIMESTAMP,
        exit_reason TEXT,
        fee_override JSONB,
        special_terms JSONB,
        metadata JSONB,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        CHECK (commitment_amount > 0),
        CHECK (funded_amount >= 0 AND funded_amount <= commitment_amount),
        UNIQUE(syndicate_id, investor_id)
      );
      
      CREATE INDEX IF NOT EXISTS syndicate_members_syndicate_idx ON syndicate_members(syndicate_id);
      CREATE INDEX IF NOT EXISTS syndicate_members_investor_idx ON syndicate_members(investor_id);
      CREATE INDEX IF NOT EXISTS syndicate_members_wallet_idx ON syndicate_members(wallet_address);
      CREATE INDEX IF NOT EXISTS syndicate_members_status_idx ON syndicate_members(status);
    `);
    
    console.log('Creating waterfall_tiers table...');
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS waterfall_tiers (
        id SERIAL PRIMARY KEY,
        tier_id VARCHAR(36) NOT NULL UNIQUE,
        syndicate_id INTEGER NOT NULL REFERENCES syndicates(id) ON DELETE CASCADE,
        tier_order INTEGER NOT NULL,
        tier_name VARCHAR(100) NOT NULL,
        tier_type VARCHAR(30) NOT NULL CHECK (tier_type IN (
          'return_of_capital', 'preferred_return', 'catch_up', 'carried_interest', 'pro_rata'
        )),
        allocation_percent DECIMAL(5,2) NOT NULL,
        min_return_percent DECIMAL(5,2),
        max_return_percent DECIMAL(5,2),
        recipient_role VARCHAR(20) CHECK (recipient_role IN ('all_members', 'lead_only', 'specific_members')),
        split_rules JSONB NOT NULL,
        description TEXT,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        CHECK (tier_order > 0),
        CHECK (allocation_percent > 0 AND allocation_percent <= 100),
        UNIQUE(syndicate_id, tier_order)
      );
      
      CREATE INDEX IF NOT EXISTS waterfall_tiers_syndicate_idx ON waterfall_tiers(syndicate_id);
      CREATE INDEX IF NOT EXISTS waterfall_tiers_order_idx ON waterfall_tiers(tier_order);
    `);
    
    console.log('Creating syndicate_distributions table...');
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS syndicate_distributions (
        id SERIAL PRIMARY KEY,
        distribution_id VARCHAR(36) NOT NULL UNIQUE,
        syndicate_id INTEGER NOT NULL REFERENCES syndicates(id) ON DELETE CASCADE,
        distribution_date DATE NOT NULL,
        distribution_type VARCHAR(30) NOT NULL CHECK (distribution_type IN (
          'rental_income', 'capital_gain', 'refinance', 'sale', 'return_of_capital'
        )),
        total_amount DECIMAL(15,2) NOT NULL,
        waterfall_applied BOOLEAN DEFAULT true NOT NULL,
        tier_allocations JSONB NOT NULL,
        member_distributions JSONB NOT NULL,
        status VARCHAR(20) DEFAULT 'pending' NOT NULL CHECK (status IN (
          'pending', 'calculated', 'processing', 'completed', 'failed'
        )),
        processed_at TIMESTAMP,
        notes TEXT,
        metadata JSONB,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        CHECK (total_amount > 0)
      );
      
      CREATE INDEX IF NOT EXISTS syndicate_distributions_syndicate_idx ON syndicate_distributions(syndicate_id);
      CREATE INDEX IF NOT EXISTS syndicate_distributions_date_idx ON syndicate_distributions(distribution_date DESC);
      CREATE INDEX IF NOT EXISTS syndicate_distributions_status_idx ON syndicate_distributions(status);
    `);
    
    console.log('Creating syndicate_invitations table...');
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS syndicate_invitations (
        id SERIAL PRIMARY KEY,
        invitation_id VARCHAR(36) NOT NULL UNIQUE,
        syndicate_id INTEGER NOT NULL REFERENCES syndicates(id) ON DELETE CASCADE,
        invited_by INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        invitee_email VARCHAR(255),
        invitee_wallet VARCHAR(42),
        proposed_commitment DECIMAL(15,2),
        custom_message TEXT,
        status VARCHAR(20) DEFAULT 'pending' NOT NULL CHECK (status IN (
          'pending', 'accepted', 'declined', 'expired', 'cancelled'
        )),
        invitation_code VARCHAR(100) UNIQUE,
        invited_at TIMESTAMP DEFAULT NOW() NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        responded_at TIMESTAMP,
        metadata JSONB
      );
      
      CREATE INDEX IF NOT EXISTS syndicate_invitations_syndicate_idx ON syndicate_invitations(syndicate_id);
      CREATE INDEX IF NOT EXISTS syndicate_invitations_code_idx ON syndicate_invitations(invitation_code);
      CREATE INDEX IF NOT EXISTS syndicate_invitations_status_idx ON syndicate_invitations(status);
    `);
    
    console.log('Creating syndicate_fees table...');
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS syndicate_fees (
        id SERIAL PRIMARY KEY,
        fee_id VARCHAR(36) NOT NULL UNIQUE,
        syndicate_id INTEGER NOT NULL REFERENCES syndicates(id) ON DELETE CASCADE,
        distribution_id INTEGER REFERENCES syndicate_distributions(id) ON DELETE SET NULL,
        fee_type VARCHAR(30) NOT NULL CHECK (fee_type IN (
          'management_fee', 'performance_fee', 'carried_interest', 'platform_fee', 'setup_fee'
        )),
        fee_amount DECIMAL(15,2) NOT NULL,
        fee_percentage DECIMAL(5,2),
        basis_amount DECIMAL(15,2),
        recipient_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'collected', 'distributed', 'refunded')),
        collected_at TIMESTAMP,
        metadata JSONB,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        CHECK (fee_amount >= 0)
      );
      
      CREATE INDEX IF NOT EXISTS syndicate_fees_syndicate_idx ON syndicate_fees(syndicate_id);
      CREATE INDEX IF NOT EXISTS syndicate_fees_distribution_idx ON syndicate_fees(distribution_id);
      CREATE INDEX IF NOT EXISTS syndicate_fees_type_idx ON syndicate_fees(fee_type);
    `);
    
    await client.query('COMMIT');
    console.log('✅ Syndication Portal tables created successfully!');
    
    console.log('\n📊 Summary:');
    console.log('  1. syndicates - Syndicate creation and management');
    console.log('  2. syndicate_members - Member commitments and ownership');
    console.log('  3. waterfall_tiers - Tiered distribution structures');
    console.log('  4. syndicate_distributions - Distribution calculations');
    console.log('  5. syndicate_invitations - Invite-only access control');
    console.log('  6. syndicate_fees - Fee tracking and distribution');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error creating syndication tables:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

createSyndicationTables()
  .then(() => {
    console.log('\n🎉 Syndication Portal migration completed!');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n💥 Migration failed:', error);
    process.exit(1);
  });
