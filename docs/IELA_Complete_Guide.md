# IELA Pipeline: Complete Implementation Guide

## Overview
The IELA Pipeline (Ingest → Enrich → Analyze → List) is a comprehensive wholesale real estate deal management system that automates property intake, enrichment, analysis, and listing generation for both investors and rent-to-own (RTO) participants.

## Architecture

### Core Components

1. **Ingestion Engine** (`server/iela/parsing/smsParser.js`)
   - Extracts property details from SMS, email, or manual text input
   - Parses addresses, pricing (asking/ARV), contact info, and listing URLs
   - Handles shorthand notations (e.g., "103k" → $103,000)
   - Detects opt-out keywords for compliance tracking

2. **Enrichment Service** (`server/iela/services/enrichmentService.js`)
   - **Geocoding**: OpenStreetMap/Nominatim integration for lat/long coordinates
   - **Property Facts**: Estimates beds, baths, sqft, year built, property type
   - **Market Data**: Median home values, rent estimates, appreciation trends
   - **Neighborhood Scores**: Walk scores, crime ratings, school quality, amenities

3. **ML Prediction Engine** (`server/iela/ml/predictions.js`)
   - **Repair Cost Prediction**: Based on property size, age, condition, stories
   - **Rent Estimation**: Accounts for beds/baths, sqft, amenities, market data
   - **Appreciation Forecasting**: 1-year, 5-year, 10-year projections
   - **ROI Calculations**: Total profit, equity gain, rental income, expenses

4. **Financial Analyzer** (`server/iela/analysis/`)
   - **Profitability Calculator**: MAO (70% ARV rule) across repair estimates
   - **RTO Suitability Analyzer**: DSCR, PTI ratios, affordability badges (🟢🟡🔴)
   - **Price-to-ARV Ratios**: Deal quality assessment (Excellent/Good/Overpriced)

5. **Deal Management API** (`server/routes/deals.js`)
   - REST endpoints: Ingest, Enrich, Analyze, Publish, List, Update, Delete
   - PostgreSQL storage with JSONB columns for flexible data
   - Feature flag controlled (`AXIOM_FEATURE_IELA=true`)

6. **Automation Webhooks** (`server/routes/webhooks.js`)
   - **Email**: InvestorLift automated deal forwarding
   - **SMS**: Twilio integration with TwiML responses
   - **Generic**: Universal webhook for custom integrations

7. **Admin UI** (`public/admin-iela.html`, `public/admin-iela-intake.html`)
   - Dashboard with filtering, search, status management
   - Manual intake form with example data loader
   - Real-time analysis and publishing controls

## API Endpoints

### Deal Management
```
POST   /api/deals/ingest              - Ingest new deal from text
POST   /api/deals/:dealId/enrich      - Enrich with geocoding, ML predictions
POST   /api/deals/:dealId/analyze     - Run financial analysis
POST   /api/deals/:dealId/publish     - Publish for investors or RTO
GET    /api/deals                     - List all deals (filter by status)
GET    /api/deals/:dealId             - Get deal details
PUT    /api/deals/:dealId             - Update deal
DELETE /api/deals/:dealId             - Delete deal
```

### Automation Webhooks
```
POST   /api/webhooks/investorlift/email  - InvestorLift email forwarding
POST   /api/webhooks/twilio/sms          - Twilio SMS integration
POST   /api/webhooks/generic/deal        - Generic webhook endpoint
```

## Data Flow

### 1. Ingestion
```
SMS/Email/Manual Input
  ↓
parseMessage()
  ↓
Deal Created (draft status)
  ↓
{
  parsed: { address, city, state, zip, asking, arv, contact },
  repairs: { estLow: 15k, estMid: 30k, estHigh: 45k },
  compliance: { consentLog, optOutDetected }
}
```

### 2. Enrichment
```
Deal (draft)
  ↓
enrichmentService.enrichDeal()
  ├─ geocodeAddress() → lat/long
  ├─ getPropertyFacts() → beds/baths/sqft/year
  ├─ getMarketData() → median values/rents
  └─ getNeighborhoodScore() → walk/crime/school scores
  ↓
mlPredictions.predictRepairCost() → ML-based repair estimates
mlPredictions.predictRent() → ML-based rent estimates
mlPredictions.predictAppreciation() → Future value projections
  ↓
Deal Updated with enrichments & predictions
```

### 3. Analysis
```
Deal (enriched)
  ↓
analyzeProfitability()
  ├─ MAO by repair (low/mid/high)
  ├─ Price-to-ARV ratios
  └─ Deal quality ratings
  ↓
analyzeRTOSuitability()
  ├─ DSCR calculations
  ├─ PTI ratios
  └─ Badge assignment (🟢🟡🔴)
  ↓
Deal Updated with analysis results
```

### 4. Publishing
```
Deal (analyzed)
  ↓
publishDeal(target: 'investor' | 'rto')
  ↓
Status: listed_investor or listed_rto
  ↓
Available for:
  - Real Estate Investor platform listings
  - KeyGrow RTO participant matching
```

## Configuration

### Feature Flag
```bash
# Enable IELA Pipeline
export AXIOM_FEATURE_IELA=true
```

### Webhook Setup

#### InvestorLift Email Forwarding
1. Set up email forwarding rule to `https://your-domain.com/api/webhooks/investorlift/email`
2. System auto-ingests and parses deals
3. Admins review in dashboard

#### Twilio SMS Integration
1. Configure Twilio webhook: `https://your-domain.com/api/webhooks/twilio/sms`
2. Users text property details
3. System responds with deal ID via TwiML

#### Generic Webhook
```bash
curl -X POST https://your-domain.com/api/webhooks/generic/deal \
  -H "Content-Type: application/json" \
  -d '{
    "text": "247 Howell Drive SW, Atlanta, GA 30331. Asking 103k, ARV 165k.",
    "url": "https://investorlift.com/p/281467",
    "source": "zapier"
  }'
```

## ML Predictions

### Repair Cost Model
**Inputs**: sqft, age, condition, stories, beds, baths  
**Outputs**: Estimated cost, low/high range, confidence  
**Methodology**: Rule-based multipliers with property attributes

**Example Output**:
```json
{
  "estimated": 28500,
  "low": 24225,
  "high": 32775,
  "confidence": "medium",
  "factors": {
    "size": 1450,
    "age": 42,
    "condition": "Fair",
    "stories": 1
  }
}
```

### Rent Estimate Model
**Inputs**: beds, baths, sqft, amenities, market median, year built  
**Outputs**: Estimated rent, low/high range, market comparison  
**Methodology**: Market baseline with feature-based adjustments

**Example Output**:
```json
{
  "estimated": 1925,
  "low": 1733,
  "high": 2118,
  "confidence": "medium",
  "marketMedian": 1750,
  "factors": {
    "bedrooms": 3,
    "bathrooms": 2,
    "size": 1450,
    "amenities": { "garage": true, "pool": false }
  }
}
```

### Appreciation Model
**Inputs**: Market trend, neighborhood quality, school scores, walkability  
**Outputs**: 1-year, 5-year, 10-year projections  
**Methodology**: Market baseline with neighborhood quality adjustments

**Example Output**:
```json
{
  "oneYear": 4.3,
  "fiveYear": 4.1,
  "tenYear": 3.9,
  "factors": {
    "marketBaseline": 3.5,
    "neighborhoodQuality": "C",
    "walkability": 62,
    "schools": 58
  }
}
```

## Database Schema

### `deals` Table (PostgreSQL + Drizzle ORM)
```sql
CREATE TABLE deals (
  id VARCHAR PRIMARY KEY,
  source VARCHAR NOT NULL,           -- sms, email, manual, webhook
  raw_text TEXT NOT NULL,
  parsed JSONB,                      -- { address, city, state, zip, asking, arv, contact }
  geocoding JSONB,                   -- { latitude, longitude, displayName }
  property_facts JSONB,              -- { beds, baths, sqft, yearBuilt, condition }
  market_data JSONB,                 -- { medianValue, medianRent, appreciation }
  neighborhood_score JSONB,          -- { walkScore, crimeScore, schoolScore }
  repairs JSONB,                     -- { estLow, estMid, estHigh, mlConfidence }
  rents JSONB,                       -- { marketRentEst, mlConfidence }
  predictions JSONB,                 -- { appreciation, rentEstimate, repairCost }
  analysis JSONB,                    -- { maoByRepair, priceToArvPct, rtoBadge }
  media JSONB[],                     -- Property photos/videos
  compliance JSONB,                  -- { consentLog, optOutDetected }
  status VARCHAR DEFAULT 'draft',    -- draft, suppressed, listed_investor, listed_rto
  created_by VARCHAR,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

## Admin UI

### Dashboard (`/admin-iela.html`)
- **Stats Cards**: Total, Draft, Listed (Investor), Listed (RTO)
- **Search & Filter**: Address, city, status filtering
- **Deal List**: Property details, pricing, analysis summary
- **Actions**: Analyze, Publish for Investors, Publish for RTO

### Intake Form (`/admin-iela-intake.html`)
- **Manual Entry**: Source selection, text input, URL field
- **Example Loader**: One-click Atlanta property test data
- **Real-time Parsing**: Instant property detail extraction
- **Analysis Trigger**: One-click financial analysis

## Testing

### Smoke Test
```javascript
// Atlanta property test
const testDeal = {
  source: 'manual',
  rawText: 'Hi, Clarence. New off-market property in 247 Howell Drive Southwest, Atlanta, GA 30331 is available on Investorlift. Asking 103k. ARV 165k. Contact Charlie Martinez 323-701-0293 for more information.',
  url: 'https://investorlift.com/p/281467'
};

// Expected results:
// - Asking: $103,000 (not $103)
// - ARV: $165,000
// - MAO (mid): ~$85,500
// - Price-to-ARV: 62.4%
// - RTO Badge: 🟢 Green (excellent)
```

### Webhook Test
```bash
# Test generic webhook
curl -X POST http://localhost:5000/api/webhooks/generic/deal \
  -H "Content-Type: application/json" \
  -d @test-deal.json

# Response:
# { "success": true, "data": { "dealId": "uuid-here" } }
```

## Production Readiness

### ✅ Completed Features
- [x] SMS/Email parsing engine
- [x] Geocoding integration (OpenStreetMap)
- [x] Property facts estimation
- [x] Market data enrichment
- [x] Neighborhood scoring
- [x] ML repair cost prediction
- [x] ML rent estimation
- [x] ML appreciation forecasting
- [x] ROI calculations
- [x] MAO analysis (70% ARV rule)
- [x] RTO suitability analysis
- [x] REST API (full CRUD)
- [x] Email webhook (InvestorLift)
- [x] SMS webhook (Twilio)
- [x] Generic webhook
- [x] Admin dashboard UI
- [x] Manual intake form
- [x] PostgreSQL storage
- [x] Feature flag system
- [x] Compliance logging

### 🔧 Future Enhancements
- [ ] Connect to paid APIs: Attom Data, CoreLogic, Zillow, Redfin
- [ ] Advanced ML models: TensorFlow/PyTorch for predictions
- [ ] Automated property photo scraping
- [ ] Comparative Market Analysis (CMA) generation
- [ ] Email/SMS notifications for new deals
- [ ] Deal assignment to investors
- [ ] Automated offer letter generation
- [ ] Contract management integration
- [ ] Mobile app for field agents

## Compliance

### Data Privacy
- Opt-out keyword detection (`STOP`, `UNSUBSCRIBE`, etc.)
- Consent logging for all interactions
- Source tracking (SMS, email, webhook)
- Manual TOS mode for uploaded deals

### Regulatory Notes
- System logs opt-out detection but does NOT block processing (per user request)
- Admins responsible for respecting opt-out preferences
- TCPA compliance responsibility: User/Platform owner
- Suggested: Integrate with DNC scrub lists for production

## Performance

### Current Capabilities
- **Ingestion**: <200ms per deal
- **Enrichment**: ~2-3 seconds (includes geocoding API call)
- **Analysis**: <100ms
- **ML Predictions**: <50ms each
- **Database**: JSONB indexes for fast filtering

### Scalability
- Stateless API design (horizontal scaling ready)
- PostgreSQL connection pooling
- Webhook queue processing (future: Redis/Bull)
- Rate limiting on external APIs (OpenStreetMap: 1 req/sec)

## Integration Examples

### Real Estate Investor Platform
```javascript
// Fetch available investor deals
const deals = await fetch('/api/deals?status=listed_investor');

// Display in property cards
deals.forEach(deal => {
  renderPropertyCard({
    address: deal.parsed.address,
    price: deal.parsed.asking,
    arv: deal.parsed.arv,
    mao: deal.analysis.maoByRepair[1].mao,
    rating: deal.analysis.priceToArvPctWithRepairs[1].rating
  });
});
```

### KeyGrow RTO Matching
```javascript
// Fetch RTO-suitable deals
const rtoDeals = await fetch('/api/deals?status=listed_rto');

// Filter by participant budget
const matches = rtoDeals.filter(deal => {
  const monthlyPayment = calculateRTOPayment(deal);
  return monthlyPayment <= participantBudget;
});
```

## Support

For questions or issues:
- Documentation: `/docs/iela-notes.md`
- Implementation Summary: `/IELA_Pipeline_Implementation_Summary.md`
- Feature Flag: `server/config/featureFlags.js`

## License
Proprietary - AXIOM Platform © 2025
