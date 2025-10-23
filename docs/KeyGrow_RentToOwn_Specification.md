# KeyGrow Rent-to-Own Specification
## Real Estate Acquisition Fund - 20% Revenue Allocation

**Last Updated**: January 2026  
**Status**: Planned for Future Implementation

---

## Overview

KeyGrow is AXIOM's rent-to-own real estate program designed to help renters transition to homeownership using platform-generated revenue as an acquisition fund.

## Core Principle

**20% of ALL platform-generated fees and income** will automatically funnel into the Real Estate Acquisition Fund to help renters purchase properties.

---

## Revenue Sources (20% Allocation Each)

### 1. Banking Fees
- Overdraft fees
- Wire transfer fees  
- Account maintenance fees (if any)
- Early CD withdrawal penalties
- **Target**: ~2-5% of banking revenue

### 2. Investment Trading Fees
- 0.1% transaction fees on all trades
- Options trading premiums
- Crypto trading fees
- Stock/ETF trading commissions
- **Target**: Largest revenue source

### 3. Staking & DeFi Fees
- Early unstaking penalties
- Staking pool entry/exit fees
- Liquidity pool transaction fees
- **Target**: 5-10% of DeFi activity

### 4. NFT Marketplace Fees
- 2.5% marketplace fee on all NFT sales
- Auction house commissions
- Royalty enforcement fees
- **Target**: Variable based on NFT volume

### 5. Governance & Treasury
- Proposal submission fees (refundable)
- Treasury management performance fees
- **Target**: Minimal but consistent

### 6. Platform Subscriptions (Future)
- Premium features
- Enhanced analytics
- Priority support
- Institutional accounts
- **Target**: Recurring monthly revenue

---

## Smart Contract Architecture

### RealEstateAcquisitionFund.sol

```solidity
contract RealEstateAcquisitionFund {
    // 20% of all platform fees automatically routed here
    uint256 public constant ALLOCATION_PERCENTAGE = 2000; // 20% in basis points
    
    struct PropertyListing {
        address renter;
        string propertyAddress;
        uint256 targetPrice;
        uint256 accumulatedFunds;
        uint256 monthlyRent;
        uint256 rentMonthsApplied;
        bool approved;
        bool acquired;
    }
    
    mapping(address => PropertyListing[]) public renterProperties;
    
    // Automatic revenue distribution
    function receiveRevenue() external payable {
        // 20% allocation logic
        // Track by revenue source
        // Distribute to qualified renters
    }
    
    // Renter qualification
    function applyForRentToOwn(
        string memory propertyAddress,
        uint256 targetPrice,
        uint256 monthlyRent
    ) external {
        // Verify renter eligibility
        // Create property listing
        // Begin accumulation
    }
    
    // Property acquisition
    function acquireProperty(uint256 listingId) external {
        // Verify funds accumulated
        // Execute purchase
        // Transfer ownership to renter
    }
}
```

### Revenue Router Contract

```solidity
contract AXIOMRevenueRouter {
    address public realEstateAcquisitionFund;
    address public treasury;
    
    // Route 20% of fees to Real Estate Fund
    function distributeRevenue() external payable {
        uint256 realEstateCut = msg.value * 2000 / 10000; // 20%
        uint256 treasuryCut = msg.value - realEstateCut;   // 80%
        
        (bool success1,) = realEstateAcquisitionFund.call{value: realEstateCut}("");
        (bool success2,) = treasury.call{value: treasuryCut}("");
        
        require(success1 && success2, "Distribution failed");
    }
}
```

---

## Rent-to-Own Program Mechanics

### Eligibility Requirements

**Minimum Requirements**:
- Active AXIOM account for 6+ months
- Minimum 1,000 AXM staked
- Verified income documentation
- Clean payment history (on-platform)
- Credit score 580+ (or alternative verification)

**Participation Tiers**:
- **Bronze**: 6-month history, access to properties <$150K
- **Silver**: 12-month history, access to properties <$300K
- **Gold**: 24-month history, access to properties <$500K
- **Platinum**: 36-month history, access to any property

### How It Works

**1. Renter Application**
- Submit property of interest
- Provide income verification
- Platform reviews credit/history
- Approval or denial (transparent criteria)

**2. Fund Accumulation**
- 20% of platform revenue → Real Estate Fund
- Renter's portion calculated by:
  - Time in program
  - Staking tier
  - Monthly rent payments
  - Platform engagement (governance, trading volume)

**3. Purchase Execution**
- Once target price reached
- Platform facilitates property acquisition
- Legal transfer to renter's name
- Small service fee (1-2% of property value)

**4. Post-Purchase**
- Renter becomes homeowner
- Continues using AXIOM platform
- Can become landlord (future feature)
- Property deed recorded on-chain (future)

---

## Financial Model

### Example Scenario

**Platform Monthly Revenue**: $500,000  
**Real Estate Fund (20%)**: $100,000/month

**Qualified Renters**: 100  
**Average Allocation**: $1,000/month per renter

**Renter Profile**:
- Target property: $200,000 home
- Monthly rent: $1,500
- Platform allocation: $1,000/month
- Personal savings: $500/month

**Timeline to Ownership**:
- Total needed: $200,000
- Monthly accumulation: $1,500 ($1,000 fund + $500 personal)
- **Time to own**: ~11 years → **Accelerated to 6-8 years** with platform support

**Alternative Path**:
- Down payment (20%): $40,000 needed
- With platform support: Achieved in 27 months
- Then: Traditional mortgage for remaining $160,000
- **Much faster path to ownership**

---

## Integration Points

### Backend (unified-platform.js)

```javascript
// Add revenue tracking endpoint
app.post('/api/revenue/distribute', async (req, res) => {
  const { amount, source } = req.body;
  
  // Calculate 20% allocation
  const realEstateCut = amount * 0.20;
  const treasuryCut = amount * 0.80;
  
  // Update real estate fund
  await db.execute(`
    INSERT INTO real_estate_fund_deposits (amount, source, timestamp)
    VALUES (${realEstateCut}, '${source}', NOW())
  `);
  
  // Distribute to qualified renters
  await distributeToRenters(realEstateCut);
  
  res.json({ success: true });
});
```

### Database Schema

```javascript
const realEstateFund = pgTable('real_estate_fund', {
  id: serial('id').primaryKey(),
  totalBalance: decimal('total_balance').notNull(),
  monthlyInflow: decimal('monthly_inflow'),
  lastUpdated: timestamp('last_updated').defaultNow()
});

const renterApplications = pgTable('renter_applications', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull(),
  walletAddress: varchar('wallet_address', { length: 42 }).notNull(),
  propertyAddress: text('property_address').notNull(),
  targetPrice: decimal('target_price').notNull(),
  accumulatedFunds: decimal('accumulated_funds').default('0'),
  monthlyAllocation: decimal('monthly_allocation'),
  status: varchar('status', { length: 20 }), // pending, approved, funded, acquired
  appliedAt: timestamp('applied_at').defaultNow(),
  approvedAt: timestamp('approved_at')
});

const propertyAcquisitions = pgTable('property_acquisitions', {
  id: serial('id').primaryKey(),
  renterId: integer('renter_id').notNull(),
  propertyAddress: text('property_address').notNull(),
  purchasePrice: decimal('purchase_price').notNull(),
  platformContribution: decimal('platform_contribution').notNull(),
  renterContribution: decimal('renter_contribution').notNull(),
  acquisitionDate: timestamp('acquisition_date').notNull(),
  deedRecorded: boolean('deed_recorded').default(false),
  blockchainProof: varchar('blockchain_proof', { length: 66 })
});
```

### Frontend (New Page: KeyGrowPage.tsx)

```typescript
// KeyGrow Rent-to-Own Dashboard
- View real estate fund balance
- Track personal accumulation
- Browse available properties
- Submit application
- Track progress to ownership
- Community success stories
```

---

## Governance & Transparency

### Community Oversight

**Monthly Reports**:
- Total revenue generated
- 20% allocation amount
- Number of active renters
- Properties acquired this month
- Fund balance and projections

**Quadratic Voting on**:
- Property eligibility criteria
- Geographic expansion
- Allocation formula adjustments
- Partnership with real estate platforms

### Smart Contract Transparency

- All fund flows on-chain
- Public dashboard showing:
  - Real-time fund balance
  - Monthly inflows
  - Renter allocations (anonymized)
  - Property acquisitions
  
---

## Partnership Opportunities

**Real Estate Platforms**:
- Zillow, Redfin integration
- Property search APIs
- Valuation oracles

**Title Companies**:
- Automated title search
- Blockchain deed recording
- Smart escrow

**Mortgage Lenders**:
- Pre-qualification for renters
- Platform payment history as credit signal
- Down payment assistance programs

---

## Success Metrics

**Year 1 Goals**:
- 500 qualified renters in program
- $1.2M+ in Real Estate Fund
- 10-20 properties acquired
- Average time to down payment: 24 months

**Year 5 Vision**:
- 10,000+ renters → homeowners
- $50M+ Real Estate Fund
- 500+ properties/year acquired
- Expansion to international markets

---

## Legal & Compliance

**Regulatory Considerations**:
- Real estate licensing by state
- Fair housing compliance
- Anti-discrimination policies
- Transparent lending practices
- Consumer protection laws

**Risk Mitigation**:
- Property insurance requirements
- Escrow protection
- Legal review of all transactions
- Dispute resolution mechanisms

---

## Future Enhancements

1. **Fractional Ownership**: Multiple renters co-own property
2. **Property Staking**: Use owned property as collateral for AXM staking
3. **Landlord Network**: Homeowners rent to new renters, earning yield
4. **Global Expansion**: International properties (starting with Caribbean, Africa)
5. **Green Energy Incentives**: Solar-equipped homes get higher allocations
6. **DAO Land Trust**: Community-owned land for affordable housing

---

**This is the foundation of true wealth redistribution—using platform profits to create generational homeownership.**

*"Wealth is energy in circulation. When that energy helps renters become owners, civilization endures."*

—AXIOM Protocol, 2026
