# IELA Pipeline Documentation
## Ingest → Enrich → Analyze → List for Wholesale Real Estate Deals

**Version:** 1.0.0  
**Date:** October 26, 2025  
**Status:** Feature-Flagged (Default: OFF)

---

## Stack Discovery

### Backend
- **Runtime:** Node.js with Express.js
- **Server File:** `unified-platform.js` (legacy mode, currently active)
- **Package Manager:** npm
- **Database:** PostgreSQL (Neon-hosted)
- **ORM:** Drizzle (`shared/schema.js`)
- **Session:** connect-pg-simple + express-session
- **Auth:** Passport.js + JWT

### Frontend
- **Framework:** React 18 + TypeScript
- **Build System:** Next.js 14 (also supports legacy Express-served static build)
- **UI Library:** Tailwind CSS + custom components
- **Router:** React Router DOM
- **State:** React Context

### Existing Domain Layers
- **Property:** Real Estate Investor platform (`server/routes/realEstateInvestor.js`)
- **KeyGrow:** Rent-to-Own program (`server/routes/keygrow.js`, `server/services/keygrowService.js`)
- **Wallet:** Advanced wallet auth system
- **KYC:** Unified registration with tiered KYC
- **Admin:** Admin dashboard at `/admin`

### Project Structure
```
server/
  routes/          # API endpoints
  services/        # Business logic
  middleware/      # Auth, validation
  schemas/         # Drizzle migrations
  
client/src/
  pages/          # React page components
  components/     # Reusable UI components
  services/       # Frontend API clients
  types/          # TypeScript definitions
  
shared/
  schema.js       # Drizzle database schema
```

---

## Configuration

### Feature Flag
Add to environment:
```bash
AXIOM_FEATURE_IELA=true
```

File: Create `server/config/featureFlags.js`
```javascript
module.exports = {
  IELA_ENABLED: process.env.AXIOM_FEATURE_IELA === 'true'
};
```

### Environment Variables

```bash
# Core Feature
AXIOM_FEATURE_IELA=false              # Master toggle

# Twilio Integration (Optional)
TWILIO_WEBHOOK_SECRET=your_secret     # If using SMS intake

# Geocoding
GEOCODER_PROVIDER=mapbox              # mapbox | google
GEOCODER_API_KEY=your_key             # Required for enrichment

# Property Data (Optional)
PROPERTY_DATA_PROVIDER=attom          # attom | estated
PROPERTY_DATA_API_KEY=your_key        # If using property facts

# Rent Data (Optional)
RENT_DATA_PROVIDERS=rentometer,zillow # Comma-separated list

# Media Storage
OBJECT_STORE_BUCKET=axiom-deals       # For property images/docs

# Publishing Control
ALLOW_PUBLISH=false                   # Prevent accidental public listing
```

---

## Architecture

### Data Flow
```
SMS/Email/Manual → Parse → Enrich → Analyze → Publish
     ↓               ↓        ↓         ↓          ↓
  Raw Text      Address   Geocode   Profit   Cards
                Fields    Facts     RTO
```

### Module Structure
```
server/
  iela/
    models/
      Deal.ts            # Core Deal type
      types.ts           # Supporting types
    parsing/
      smsParser.ts       # Extract fields from text
      amountNormalizer.ts # Handle 103k → 103000
    enrichment/
      geocoder.ts        # Address → lat/lng
      propertyFacts.ts   # Beds, baths, sqft
      rentEstimator.ts   # Market rent data
    analysis/
      profitability.ts   # MAO, price-to-ARV, cap rate
      rtoSuitability.ts  # DTI, DSCR, badges
    services/
      dealService.ts     # CRUD operations
      mediaStore.ts      # Upload/signed URLs
      consentLog.ts      # Opt-out tracking
      publisher.ts       # Generate cards
  routes/
    deals.ts             # API endpoints
    
client/src/
  pages/
    admin/
      DealsIntakePage.tsx  # Main intake UI
      DealViewPage.tsx     # Individual deal view
  components/
    iela/
      InvestorCard.tsx     # Investor-focused card
      KeyGrowRTOCard.tsx   # Rent-to-own card
      ParsedFieldsEditor.tsx # Inline field editing
```

### Database Schema
New table: `deals`
- Uses Drizzle ORM
- Migration via `npm run db:push`
- Stored in `shared/schema.js`

---

## API Endpoints

### 1. POST /api/deals/ingest
Receive and parse wholesale deal messages.

**Request:**
```json
{
  "source": "sms" | "email" | "manual",
  "rawText": "string",
  "url": "string (optional)",
  "twilioSignature": "string (optional)"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "deal-uuid",
    "parsed": {
      "address": "247 Howell Drive Southwest",
      "city": "Atlanta",
      "state": "GA",
      "zip": "30331",
      "asking": 103000,
      "arv": 165000,
      "url": "https://...",
      "contactName": "Charlie Martinez",
      "contactPhone": "323-701-0293",
      "optOut": false
    },
    "status": "draft"
  }
}
```

### 2. POST /api/deals/:dealId/enrich
Geocode address and fetch property data.

**Request:**
```json
{
  "geocode": true,
  "propertyFacts": true,
  "rentData": true
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "geocode": { "lat": 33.7, "lng": -84.4, "placeId": "..." },
    "facts": { "beds": 3, "baths": 1, "sqft": 1054 },
    "rents": { "marketRentEst": 2734, "sources": ["zillow"] }
  }
}
```

### 3. POST /api/deals/:dealId/analyze
Run profitability and RTO calculations.

**Response:**
```json
{
  "success": true,
  "data": {
    "maoByRepair": [
      { "repair": 15000, "mao": 100500 },
      { "repair": 30000, "mao": 85500 },
      { "repair": 45000, "mao": 70500 }
    ],
    "priceToArvPctWithRepairs": [
      { "repair": 15000, "pct": 71.5 },
      { "repair": 30000, "pct": 80.6 },
      { "repair": 45000, "pct": 89.7 }
    ],
    "capRate": 8.5,
    "rtoBadge": "yellow"
  }
}
```

### 4. POST /api/deals/:dealId/publish
Generate investor or RTO card.

**Request:**
```json
{
  "target": "investor" | "rto"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "cardUrl": "/deals/card/abc123",
    "publicUrl": "https://...",
    "publishedAt": "2025-10-26T..."
  }
}
```

---

## Analysis Logic

### 70% MAO Rule
```typescript
MAO = (ARV × 0.70) - Repair Costs
```

Example:
- ARV: $165,000
- Repair: $30,000
- MAO: ($165,000 × 0.70) - $30,000 = **$85,500**

### Price-to-ARV with Repairs
```typescript
Percentage = (Asking + Repair) / ARV × 100
```

Example:
- Asking: $103,000
- Repair: $30,000
- ARV: $165,000
- Result: ($103,000 + $30,000) / $165,000 = **80.6%**

### RTO Badge Logic
```typescript
function rtoBadge(dscr, pti):
  if dscr >= 1.25 && pti <= 30: return "green"
  if dscr >= 1.1 && pti <= 38: return "yellow"
  return "red"
```

Where:
- **DSCR** = Net Operating Income / Total Debt Service
- **PTI** = (Principal + Taxes + Insurance + HOA) / Monthly Income

---

## Compliance & Privacy

### Opt-Out Handling
- Detect phrases: "STOP", "opt out", "unsubscribe", "remove me"
- Mark `optOut: true` in parsed fields
- Do not process further if opt-out detected
- Log all consent events

### Contact Privacy
- **Never expose** phone numbers in public cards
- Contact fields only visible to authenticated admins
- Public cards show: "Contact via platform" button
- SMS/email forwarded through platform

### Terms of Service
- InvestorLift: No API, no scraping per TOS
- Solution: Request secure upload link from wholesaler
- All media uploaded directly by property owner

---

## Testing

### Unit Tests
Location: `server/iela/__tests__/`

Tests required:
- `smsParser.test.ts` - Field extraction
- `amountNormalizer.test.ts` - "103k" → 103000
- `profitability.test.ts` - MAO calculations
- `rtoSuitability.test.ts` - Badge logic

### Smoke Test
See "Smoke Test" section below.

---

## Scripts

Add to `package.json`:
```json
{
  "scripts": {
    "dev:iela": "AXIOM_FEATURE_IELA=true npm run legacy-dev",
    "test:iela": "jest server/iela",
    "lint:iela": "eslint server/iela client/src/pages/admin/deals"
  }
}
```

---

## Integration Checklist

- [ ] Feature flag configured
- [ ] Database schema added
- [ ] API routes mounted
- [ ] Admin UI accessible
- [ ] Parser tested with sample
- [ ] Enrichment working (geocode)
- [ ] Analysis functions validated
- [ ] Cards rendering correctly
- [ ] Compliance logging active
- [ ] Unit tests passing
- [ ] Smoke test completed

---

## Smoke Test

1. Enable feature:
   ```bash
   export AXIOM_FEATURE_IELA=true
   ```

2. Navigate to: `http://localhost:5000/admin/deals/intake`

3. Paste sample message:
   ```
   Hi, Clarence. New off-market property in 247 Howell Drive Southwest, 
   Atlanta, GA 30331 is available on Investorlift. Asking 103k. ARV 165k. 
   https://investorlift.com/marketplace/s/mtgi-52970-616j view photos and info. 
   Contact Charlie Martinez 323-701-0293 for more information. Reply stop to opt-out
   ```

4. Verify parsing:
   - Address: "247 Howell Drive Southwest, Atlanta, GA 30331"
   - Asking: $103,000
   - ARV: $165,000
   - Contact: "Charlie Martinez"
   - Phone: "323-701-0293"
   - Opt-out: true (detected "stop")

5. Click "Analyze" - Verify:
   - MAO Low: $100,500 (165k × 0.7 - 15k)
   - MAO Mid: $85,500 (165k × 0.7 - 30k)
   - MAO High: $70,500 (165k × 0.7 - 45k)
   - Price/ARV ratios: ~71.5%, 80.6%, 89.7%
   - RTO Badge: "yellow" (pending rent data)

6. Click "Publish to Investors" → Verify card renders
7. Click "Publish to KeyGrow" → Verify RTO card renders
8. Confirm no phone number visible in public view

---

## Future Enhancements

- [ ] AI-powered parsing fallback (OpenAI integration)
- [ ] Twilio SMS webhook integration
- [ ] Attom/Estated property data API
- [ ] Automated rent estimation (Rentometer)
- [ ] Deal pipeline status tracking
- [ ] Bulk import from CSV
- [ ] Email notifications to investors
- [ ] Deal comparison tool

---

## Support

For questions or issues:
- Check `/docs/iela-notes.md`
- Review unit tests for examples
- Contact platform team

---

*Document Version 1.0 - October 26, 2025*
