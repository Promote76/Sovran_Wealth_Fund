-- Add trigger to enforce max ownership percent per wallet per property

CREATE OR REPLACE FUNCTION check_max_ownership_percent()
RETURNS TRIGGER AS $$
DECLARE
  prop_max_ownership DECIMAL(5,2);
  current_total_ownership DECIMAL(5,2);
  new_total_ownership DECIMAL(5,2);
BEGIN
  -- Get the property's max ownership percent
  SELECT max_ownership_percent INTO prop_max_ownership
  FROM fractional_properties
  WHERE id = NEW.property_id;
  
  -- Calculate current total ownership for this wallet on this property
  SELECT COALESCE(SUM(ownership_percent), 0) INTO current_total_ownership
  FROM investor_shares
  WHERE property_id = NEW.property_id 
    AND wallet_address = NEW.wallet_address
    AND status = 'active'
    AND id != COALESCE(NEW.id, -1); -- Exclude current record on UPDATE
  
  -- Calculate what the new total would be
  new_total_ownership := current_total_ownership + NEW.ownership_percent;
  
  -- Check if it exceeds the max
  IF new_total_ownership > prop_max_ownership THEN
    RAISE EXCEPTION 'Ownership limit exceeded: wallet % would own %.2f%% of property %, max allowed is %.2f%%',
      NEW.wallet_address, new_total_ownership, NEW.property_id, prop_max_ownership;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS enforce_max_ownership_trigger ON investor_shares;

CREATE TRIGGER enforce_max_ownership_trigger
BEFORE INSERT OR UPDATE ON investor_shares
FOR EACH ROW
EXECUTE FUNCTION check_max_ownership_percent();

-- Add trigger to validate share transaction amounts meet tier requirements

CREATE OR REPLACE FUNCTION check_tier_investment_limits()
RETURNS TRIGGER AS $$
DECLARE
  tier_min DECIMAL(15,2);
  tier_max DECIMAL(15,2);
BEGIN
  -- Only check for purchase transactions
  IF NEW.transaction_type = 'purchase' AND NEW.tier IS NOT NULL THEN
    -- Get the tier's min and max investment
    SELECT min_investment, max_investment INTO tier_min, tier_max
    FROM investor_tiers
    WHERE tier_name = NEW.tier;
    
    -- Check minimum
    IF NEW.total_amount < tier_min THEN
      RAISE EXCEPTION 'Investment amount $% is below minimum $% for tier %',
        NEW.total_amount, tier_min, NEW.tier;
    END IF;
    
    -- Check maximum (if set)
    IF tier_max IS NOT NULL AND NEW.total_amount > tier_max THEN
      RAISE EXCEPTION 'Investment amount $% exceeds maximum $% for tier %',
        NEW.total_amount, tier_max, NEW.tier;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS check_tier_limits_trigger ON share_transactions;

CREATE TRIGGER check_tier_limits_trigger
BEFORE INSERT ON share_transactions
FOR EACH ROW
EXECUTE FUNCTION check_tier_investment_limits();
