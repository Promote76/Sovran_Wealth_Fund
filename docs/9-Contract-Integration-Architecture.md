# AXIOM 9-Contract Integration Architecture

## Overview
Integration plan for 9 deployed BSC smart contracts into existing AXIOM platform without breaking current features (banking, investments, existing staking).

## 1. Architecture Principles

### 1.1 Modularity
- **Problem**: unified-platform.js is already 3,467 lines
- **Solution**: Create domain-specific routers and services
  ```
  server/
    routes/
      keygrow.js          # KeyGrow API routes
      nft-marketplace.js  # NFT marketplace routes
      advanced-staking.js # Staking routes
      vaults.js           # Basket/Liquidity vault routes
    services/
      contractProvider.js # Shared ethers.js provider
      keygrowService.js   # KeyGrow business logic
      nftService.js       # NFT business logic
      stakingService.js   # Staking business logic
  ```

### 1.2 Contract Access Layer
- **Shared Contract Provider** (`services/contractProvider.js`):
  ```javascript
  class ContractProvider {
    constructor(network = 'bsc-mainnet') {
      this.config = require('../contracts-config.json');
      this.provider = new ethers.JsonRpcProvider(this.config.rpc);
      this.contracts = {};
    }
    
    getContract(name, signerOrProvider) {
      if (!this.contracts[name]) {
        const abi = require(`../abis/${name}.json`);
        const address = this.config.contracts[name];
        this.contracts[name] = new ethers.Contract(address, abi, signerOrProvider);
      }
      return this.contracts[name];
    }
  }
  ```

- **Typed Wrappers** for each contract with retry logic
- **Environment Config**: testnet/mainnet separation

### 1.3 Database Migration Strategy

**SAFE APPROACH**: Incremental migrations, not `db:push`

```sql
-- Migration 001: KeyGrow Tables
CREATE TABLE keygrow_renters (
  id SERIAL PRIMARY KEY,
  wallet_address VARCHAR(42) NOT NULL UNIQUE,
  registered_at TIMESTAMP DEFAULT NOW(),
  tier VARCHAR(20),
  total_allocated DECIMAL(18, 2) DEFAULT 0,
  total_claimed DECIMAL(18, 2) DEFAULT 0,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE keygrow_allocations (
  id SERIAL PRIMARY KEY,
  renter_id INTEGER REFERENCES keygrow_renters(id),
  period_number INTEGER NOT NULL,
  amount DECIMAL(18, 2) NOT NULL,
  claimed BOOLEAN DEFAULT false,
  claimed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE keygrow_properties (
  id SERIAL PRIMARY KEY,
  renter_id INTEGER REFERENCES keygrow_renters(id),
  property_address TEXT NOT NULL,
  target_price DECIMAL(18, 2) NOT NULL,
  accumulated_funds DECIMAL(18, 2) DEFAULT 0,
  status VARCHAR(20) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Migration 002: NFT Marketplace Tables
CREATE TABLE nft_listings (
  id SERIAL PRIMARY KEY,
  contract_address VARCHAR(42) NOT NULL,
  token_id VARCHAR(78) NOT NULL,
  seller VARCHAR(42) NOT NULL,
  price DECIMAL(18, 8) NOT NULL,
  currency VARCHAR(10) DEFAULT 'BNB',
  listing_type VARCHAR(20) DEFAULT 'fixed', -- fixed, auction
  status VARCHAR(20) DEFAULT 'active',
  auction_end_time TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(contract_address, token_id)
);

CREATE TABLE nft_bids (
  id SERIAL PRIMARY KEY,
  listing_id INTEGER REFERENCES nft_listings(id),
  bidder VARCHAR(42) NOT NULL,
  amount DECIMAL(18, 8) NOT NULL,
  tx_hash VARCHAR(66),
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE nft_sales (
  id SERIAL PRIMARY KEY,
  listing_id INTEGER REFERENCES nft_listings(id),
  buyer VARCHAR(42) NOT NULL,
  seller VARCHAR(42) NOT NULL,
  price DECIMAL(18, 8) NOT NULL,
  tx_hash VARCHAR(66),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Migration 003: Advanced Staking Tables
CREATE TABLE advanced_stakes (
  id SERIAL PRIMARY KEY,
  wallet_address VARCHAR(42) NOT NULL,
  nft_token_id VARCHAR(78) NOT NULL,
  stake_amount DECIMAL(18, 8) NOT NULL,
  tier VARCHAR(20),
  rewards_earned DECIMAL(18, 8) DEFAULT 0,
  stake_started_at TIMESTAMP DEFAULT NOW(),
  stake_ended_at TIMESTAMP,
  tx_hash VARCHAR(66),
  status VARCHAR(20) DEFAULT 'active'
);

CREATE TABLE staking_rewards (
  id SERIAL PRIMARY KEY,
  stake_id INTEGER REFERENCES advanced_stakes(id),
  amount DECIMAL(18, 8) NOT NULL,
  claimed BOOLEAN DEFAULT false,
  claimed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Migration 004: Revenue Router Tracking
CREATE TABLE revenue_distributions (
  id SERIAL PRIMARY KEY,
  source VARCHAR(50) NOT NULL, -- NFTMarketplace, Staking, Banking, Investments
  total_amount DECIMAL(18, 2) NOT NULL,
  treasury_amount DECIMAL(18, 2) NOT NULL,
  keygrow_amount DECIMAL(18, 2) NOT NULL,
  tx_hash VARCHAR(66),
  created_at TIMESTAMP DEFAULT NOW()
);
```

**Rollback Plan**: Each migration has corresponding `DOWN` script

### 1.4 Revenue Routing Integration

**Flow**: Existing Features → Revenue Router → Treasury (80%) / KeyGrow (20%)

```javascript
// In unified-platform.js (existing banking/investment fee collection)
async function distributeRevenue(amount, source) {
  const revenueRouter = contractProvider.getContract('AXIOMRevenueRouter', signer);
  
  // Send fees to router
  const tx = await revenueRouter.distributeBNBRevenue(source, {
    value: ethers.parseEther(amount.toString())
  });
  
  await tx.wait();
  
  // Track in database
  await db.insert(revenueDistributions).values({
    source,
    totalAmount: amount,
    treasuryAmount: amount * 0.8,
    keygrowAmount: amount * 0.2,
    txHash: tx.hash
  });
}

// Hook into existing fee collection points:
// - After investment trades (0.1% fee)
// - After banking fees (overdraft, wire transfer)
// - After NFT marketplace sales (2.5% fee)
```

## 2. Implementation Phases

### Phase 1: Foundation (Days 1-2)
1. ✅ Create `contracts-config.json` with all addresses
2. Extract ABIs from artifacts to `client/src/abis/`
3. Build `ContractProvider` service
4. Write database migrations (001-004)
5. Create router skeletons

### Phase 2: KeyGrow Integration (Days 3-4)
1. Backend:
   - `routes/keygrow.js` - API endpoints
   - `services/keygrowService.js` - business logic
2. Database: Run migration 001
3. Frontend:
   - `KeyGrowPage.tsx` - full dashboard
   - Contract hooks for renter registration, claims
4. Testing: Integration tests with forked BSC

### Phase 3: NFT Marketplace (Days 5-6)
1. Backend:
   - `routes/nft-marketplace.js`
   - `services/nftService.js`
2. Database: Run migration 002
3. Frontend:
   - `NFTMarketplacePage.tsx`
   - Browse, list, buy, bid components
4. Event indexing for real-time updates

### Phase 4: Advanced Staking (Days 7-8)
1. Backend:
   - `routes/advanced-staking.js`
   - `services/stakingService.js`
2. Database: Run migration 003
3. Frontend:
   - `AdvancedStakingPage.tsx`
   - Tier display, stake/unstake, rewards
4. Tier calculation integration

### Phase 5: Vaults & Controllers (Days 9-10)
1. Backend:
   - `routes/vaults.js` (BasketIndex, LiquidityVault, etc.)
   - TVL calculations, APR updates
2. Frontend:
   - `BasketIndexPage.tsx`
   - `VaultsPage.tsx`
3. Dynamic APR monitoring

### Phase 6: Revenue Routing Integration (Days 11-12)
1. Database: Run migration 004
2. Hook revenue router into:
   - Investment fee collection
   - Banking fee collection
   - NFT marketplace fees
3. Dashboard tracking
4. Manual distribution UI for owner

### Phase 7: Testing & Rollout (Days 13-14)
1. Unit tests for all services
2. Integration tests on forked BSC network
3. End-to-end UI smoke tests
4. Feature flags for gradual rollout
5. Monitor logs and errors

## 3. Testing Strategy

### 3.1 Unit Tests
```javascript
// services/__tests__/keygrowService.test.js
describe('KeyGrowService', () => {
  it('should calculate tier correctly', async () => {
    const tier = await keygrowService.getUserTier(walletAddress);
    expect(tier).toBe('Gold');
  });
  
  it('should calculate allocation based on tier and time', () => {
    const allocation = keygrowService.calculateAllocation(renter);
    expect(allocation).toBeGreaterThan(0);
  });
});
```

### 3.2 Integration Tests (Forked Network)
```javascript
// tests/integration/keygrow.test.js
describe('KeyGrow Integration', () => {
  beforeAll(async () => {
    // Fork BSC mainnet at specific block
    await network.provider.request({
      method: "hardhat_reset",
      params: [{
        forking: {
          jsonRpcUrl: "https://bsc-dataseed.binance.org/",
          blockNumber: 43000000
        }
      }]
    });
  });
  
  it('should register renter on-chain and in database', async () => {
    // Test end-to-end flow
  });
});
```

### 3.3 Regression Tests
- Banking endpoints still functional
- Investment endpoints still functional
- Existing staking still works

### 3.4 Feature Flags
```javascript
// config/features.js
module.exports = {
  KEYGROW_ENABLED: process.env.KEYGROW_ENABLED === 'true',
  NFT_MARKETPLACE_ENABLED: process.env.NFT_MARKETPLACE_ENABLED === 'true',
  ADVANCED_STAKING_ENABLED: process.env.ADVANCED_STAKING_ENABLED === 'true'
};

// Wrap new routes:
if (features.KEYGROW_ENABLED) {
  app.use('/api/keygrow', keygrowRouter);
}
```

## 4. Rollout Plan

### 4.1 Pre-Deployment
- [ ] All migrations tested locally
- [ ] All integration tests passing
- [ ] Regression tests passing
- [ ] Code review complete

### 4.2 Staged Rollout
1. **Day 1**: Deploy with all feature flags OFF
2. **Day 2**: Enable KeyGrow (low risk, new feature)
3. **Day 3**: Enable Advanced Staking
4. **Day 4**: Enable NFT Marketplace
5. **Day 5**: Enable Revenue Routing (highest risk)
6. **Day 6-7**: Monitor, fix issues
7. **Day 8**: Enable all features for all users

### 4.3 Rollback Triggers
- Database errors > 5%
- API errors > 10%
- User complaints > 20
- Contract interaction failures

### 4.4 Monitoring
- Error rate dashboards
- Contract call success rates
- Gas usage monitoring
- Revenue routing accuracy

## 5. Security Considerations

### 5.1 Contract Interactions
- Never expose private keys
- Use env variables for sensitive config
- Rate limit contract calls
- Validate all user inputs

### 5.2 Database Security
- SQL injection prevention (parameterized queries)
- Wallet address validation
- Amount validation (prevent overflow)

### 5.3 Frontend Security
- XSS prevention
- CSRF tokens
- Wallet signature verification

## 6. File Structure

```
AXIOM/
├── server/
│   ├── routes/
│   │   ├── keygrow.js
│   │   ├── nft-marketplace.js
│   │   ├── advanced-staking.js
│   │   └── vaults.js
│   ├── services/
│   │   ├── contractProvider.js
│   │   ├── keygrowService.js
│   │   ├── nftService.js
│   │   └── stakingService.js
│   └── migrations/
│       ├── 001_keygrow_tables.sql
│       ├── 002_nft_marketplace_tables.sql
│       ├── 003_advanced_staking_tables.sql
│       └── 004_revenue_router_tracking.sql
├── client/src/
│   ├── abis/
│   │   ├── BasketIndex.json
│   │   ├── AdvancedStaking.json
│   │   ├── EnhancedNFTMarketplace.json
│   │   ├── DynamicAPRController.json
│   │   ├── LiquidityVault.json
│   │   ├── GovernanceDividendPool.json
│   │   ├── SWFVaultAdapter.json
│   │   ├── RealEstateAcquisitionFund.json
│   │   └── AXIOMRevenueRouter.json
│   ├── pages/
│   │   ├── KeyGrowPage.tsx
│   │   ├── NFTMarketplacePage.tsx
│   │   ├── AdvancedStakingPage.tsx
│   │   ├── BasketIndexPage.tsx
│   │   └── VaultsPage.tsx
│   ├── hooks/
│   │   ├── useKeyGrow.ts
│   │   ├── useNFTMarketplace.ts
│   │   ├── useAdvancedStaking.ts
│   │   └── useVaults.ts
│   └── services/
│       └── contractService.ts
├── contracts-config.json
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
└── docs/
    └── 9-Contract-Integration-Architecture.md (this file)
```

## 7. Success Criteria

✅ **Deployment Success**:
- All 9 contracts accessible via API
- All frontend pages functional
- No regressions in existing features
- Revenue routing working correctly

✅ **Performance**:
- API response time < 500ms
- Contract calls succeed > 95%
- Page load time < 2s

✅ **User Experience**:
- Seamless navigation between features
- Clear error messages
- Transaction status tracking
- Real-time updates

---

**Status**: Architecture defined, ready for implementation  
**Next Step**: Begin Phase 1 (Foundation)  
**Timeline**: 14 days for complete integration  
**Risk Level**: Medium (with proper testing and staged rollout)
