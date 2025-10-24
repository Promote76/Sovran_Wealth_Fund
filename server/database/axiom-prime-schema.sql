-- Axiom Prime Database Schema
-- Tables for Tier System, Points, and Referrals

-- ===========================================
-- AXIOM POINTS SYSTEM
-- ===========================================

-- Points balances for each user
CREATE TABLE IF NOT EXISTS axiom_points_balances (
  user_address VARCHAR(42) PRIMARY KEY,
  total_points BIGINT DEFAULT 0,              -- Lifetime points earned
  available_points BIGINT DEFAULT 0,          -- Current spendable balance
  lifetime_earned BIGINT DEFAULT 0,           -- Total ever earned
  lifetime_redeemed BIGINT DEFAULT 0,         -- Total ever spent
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Points earning transactions
CREATE TABLE IF NOT EXISTS axiom_points_transactions (
  id SERIAL PRIMARY KEY,
  user_address VARCHAR(42) NOT NULL,
  activity_type VARCHAR(50) NOT NULL,        -- REAL_ESTATE_INVEST, STAKING, REFERRAL, etc.
  points_earned INTEGER NOT NULL,
  amount_usd DECIMAL(20, 2),                  -- Amount in USD (if applicable)
  metadata JSONB,                             -- Additional context
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_points_tx_user ON axiom_points_transactions(user_address);
CREATE INDEX IF NOT EXISTS idx_points_tx_date ON axiom_points_transactions(created_at DESC);

-- Points redemptions
CREATE TABLE IF NOT EXISTS axiom_points_redemptions (
  id SERIAL PRIMARY KEY,
  user_address VARCHAR(42) NOT NULL,
  reward_type VARCHAR(50) NOT NULL,          -- FEE_CREDIT, APR_BOOST_30D, etc.
  points_spent INTEGER NOT NULL,
  quantity INTEGER DEFAULT 1,
  metadata JSONB,                             -- Reward details
  used BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP,                       -- When reward expires
  used_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_redemptions_user ON axiom_points_redemptions(user_address);
CREATE INDEX IF NOT EXISTS idx_redemptions_active ON axiom_points_redemptions(user_address, expires_at) 
  WHERE used = false AND expires_at > NOW();

-- ===========================================
-- REFERRAL SYSTEM
-- ===========================================

-- Referral codes and network structure
CREATE TABLE IF NOT EXISTS referral_codes (
  user_address VARCHAR(42) PRIMARY KEY,
  referral_code VARCHAR(20) UNIQUE NOT NULL,
  referred_by VARCHAR(42),                    -- Who referred this user
  level INTEGER DEFAULT 1,                    -- Depth in referral tree
  ancestor_chain VARCHAR(42)[],               -- Array of ancestor addresses [L1, L2, L3]
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_referral_referred_by ON referral_codes(referred_by);
CREATE INDEX IF NOT EXISTS idx_referral_code ON referral_codes(referral_code);

-- Referral conversions (when referred user makes first investment)
CREATE TABLE IF NOT EXISTS referral_conversions (
  id SERIAL PRIMARY KEY,
  referrer_address VARCHAR(42) NOT NULL,
  referred_address VARCHAR(42) NOT NULL,
  investment_amount_usd DECIMAL(20, 2) NOT NULL,
  conversion_date TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_conversions_referrer ON referral_conversions(referrer_address);
CREATE INDEX IF NOT EXISTS idx_conversions_referred ON referral_conversions(referred_address);

-- Referral commissions earned
CREATE TABLE IF NOT EXISTS referral_commissions (
  id SERIAL PRIMARY KEY,
  beneficiary_address VARCHAR(42) NOT NULL,  -- Who earns the commission
  payer_address VARCHAR(42) NOT NULL,        -- Who paid the fee
  level INTEGER NOT NULL,                     -- 1, 2, or 3
  amount_usd DECIMAL(20, 6) NOT NULL,
  fee_type VARCHAR(50) NOT NULL,              -- trading, realEstate, nft, staking
  earned_date TIMESTAMP DEFAULT NOW(),
  claimed BOOLEAN DEFAULT false,
  claimed_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_commissions_beneficiary ON referral_commissions(beneficiary_address);
CREATE INDEX IF NOT EXISTS idx_commissions_date ON referral_commissions(earned_date DESC);

-- ===========================================
-- USER TIER SYSTEM
-- ===========================================

-- Cached tier calculations (updated periodically)
CREATE TABLE IF NOT EXISTS user_tiers (
  user_address VARCHAR(42) PRIMARY KEY,
  current_tier VARCHAR(20) NOT NULL,          -- FREE, SILVER, GOLD, PLATINUM
  tvl_usd DECIMAL(20, 2) NOT NULL,
  tvl_breakdown JSONB,                        -- Detailed holdings breakdown
  multiplier DECIMAL(3, 2) DEFAULT 1.0,
  fee_discounts JSONB,                        -- Fee rates for this tier
  calculated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tiers_tier ON user_tiers(current_tier);
CREATE INDEX IF NOT EXISTS idx_tiers_tvl ON user_tiers(tvl_usd DESC);

-- ===========================================
-- EARLY ADOPTER PROGRAM
-- ===========================================

-- First 1,000 users get special benefits
CREATE TABLE IF NOT EXISTS early_adopters (
  user_address VARCHAR(42) PRIMARY KEY,
  registration_number INTEGER UNIQUE NOT NULL, -- 1-1000
  bonus_multiplier DECIMAL(3, 2) DEFAULT 0.2,  -- Permanent 0.2x bonus
  nft_badge_claimed BOOLEAN DEFAULT false,
  registered_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_adopters_number ON early_adopters(registration_number);

-- ===========================================
-- PROPERTY PARTNER PROGRAM
-- ===========================================

-- Property management partners
CREATE TABLE IF NOT EXISTS property_partners (
  id SERIAL PRIMARY KEY,
  company_name VARCHAR(255) NOT NULL,
  contact_name VARCHAR(255) NOT NULL,
  contact_email VARCHAR(255) UNIQUE NOT NULL,
  contact_phone VARCHAR(50),
  tier VARCHAR(20) DEFAULT 'TIER_1',          -- TIER_1, TIER_2, TIER_3
  revenue_share_rate DECIMAL(5, 4) DEFAULT 0.01, -- 1.0%, 1.25%, 1.5%
  properties_listed INTEGER DEFAULT 0,
  total_revenue_earned DECIMAL(20, 2) DEFAULT 0,
  white_label_enabled BOOLEAN DEFAULT false,
  analytics_access VARCHAR(20) DEFAULT 'BASIC', -- BASIC, PREMIUM
  status VARCHAR(20) DEFAULT 'ACTIVE',         -- ACTIVE, INACTIVE, SUSPENDED
  agreement_signed_date DATE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Properties submitted by partners
CREATE TABLE IF NOT EXISTS partner_properties (
  id SERIAL PRIMARY KEY,
  partner_id INTEGER REFERENCES property_partners(id),
  property_address TEXT NOT NULL,
  property_value_usd DECIMAL(20, 2) NOT NULL,
  monthly_rent_usd DECIMAL(10, 2) NOT NULL,
  approval_status VARCHAR(20) DEFAULT 'PENDING', -- PENDING, APPROVED, REJECTED
  listed_on_chain BOOLEAN DEFAULT false,
  contract_property_id INTEGER,                -- ID in RealEstateInvestor contract
  submitted_at TIMESTAMP DEFAULT NOW(),
  approved_at TIMESTAMP,
  metadata JSONB                                -- Photos, documents, details
);

CREATE INDEX IF NOT EXISTS idx_properties_partner ON partner_properties(partner_id);
CREATE INDEX IF NOT EXISTS idx_properties_status ON partner_properties(approval_status);

-- ===========================================
-- ANALYTICS & METRICS
-- ===========================================

-- Daily platform metrics
CREATE TABLE IF NOT EXISTS daily_metrics (
  metric_date DATE PRIMARY KEY,
  total_users INTEGER DEFAULT 0,
  active_users INTEGER DEFAULT 0,              -- Transacted in last 30 days
  new_users INTEGER DEFAULT 0,
  total_tvl_usd DECIMAL(20, 2) DEFAULT 0,
  daily_volume_usd DECIMAL(20, 2) DEFAULT 0,
  daily_fees_usd DECIMAL(20, 2) DEFAULT 0,
  tier_distribution JSONB,                     -- Count per tier
  referral_count INTEGER DEFAULT 0,
  points_awarded BIGINT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ===========================================
-- HELPER FUNCTIONS
-- ===========================================

-- Function to get user's current tier
CREATE OR REPLACE FUNCTION get_user_tier(user_addr VARCHAR(42))
RETURNS TABLE (
  tier VARCHAR(20),
  tvl_usd DECIMAL(20, 2),
  multiplier DECIMAL(3, 2)
) AS $$
BEGIN
  RETURN QUERY
  SELECT current_tier, user_tiers.tvl_usd, user_tiers.multiplier
  FROM user_tiers
  WHERE user_address = user_addr;
END;
$$ LANGUAGE plpgsql;

-- Function to get points balance
CREATE OR REPLACE FUNCTION get_points_balance(user_addr VARCHAR(42))
RETURNS TABLE (
  total_points BIGINT,
  available_points BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT axiom_points_balances.total_points, axiom_points_balances.available_points
  FROM axiom_points_balances
  WHERE user_address = user_addr;
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT 0::BIGINT, 0::BIGINT;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- ===========================================
-- SAMPLE DATA (for testing)
-- ===========================================

-- Insert sample early adopter (if table is empty)
INSERT INTO early_adopters (user_address, registration_number, registered_at)
SELECT '0x0000000000000000000000000000000000000001', 1, NOW()
WHERE NOT EXISTS (SELECT 1 FROM early_adopters LIMIT 1);

COMMENT ON TABLE axiom_points_balances IS 'User points balances for Axiom Prime loyalty program';
COMMENT ON TABLE referral_codes IS '3-level referral network tracking';
COMMENT ON TABLE user_tiers IS 'Cached tier calculations based on TVL';
COMMENT ON TABLE property_partners IS 'Property management company partners';
