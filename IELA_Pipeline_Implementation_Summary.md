# IELA Pipeline Implementation Summary

## Overview
The **IELA Pipeline** (Ingest → Enrich → Analyze → List) is a wholesale real estate deal intake and analysis system designed to help AXIOM process property leads from SMS, email, and manual uploads.

## System Architecture

### 1. Parsing Engine (`server/iela/parsing/smsParser.js`)
Extracts structured data from unstructured text messages:
- **Address parsing**: "247 Howell Drive Southwest, Atlanta, GA 30331"
- **Price extraction**: "103k" → $103,000, "165k" → $165,000
- **Contact extraction**: Names, phone numbers, emails
- **Opt-out detection**: "Reply stop to opt-out" → flags for suppression
- **Confidence scoring**: High/medium/low based on parsing success

### 2. Analysis Modules

#### Profitability Calculator (`server/iela/analysis/profitability.js`)
- **MAO (Maximum Allowable Offer)**: 70% ARV - Repair Costs
  - Example: 70% × $165K - $30K = $85,500
- **Price-to-ARV Ratio**: (Asking + Repairs) / ARV
  - Example: ($103K + $30K) / $165K = 80.6%
- **Cap Rate**: (Annual Rent - Expenses) / Purchase Price
- **Cash-on-Cash Return**: Annual Cash Flow / Total Investment

#### RTO Suitability Analyzer (`server/iela/analysis/rtoSuitability.js`)
- **DSCR (Debt Service Coverage Ratio)**: Rent / Monthly Payment
- **PTI (Payment to Income)**: Monthly Payment / Monthly Income
- **RTO Badges**:
  - 🟢 **Green**: DSCR ≥ 1.25, PTI ≤ 30% (excellent candidate)
  - 🟡 **Yellow**: DSCR ≥ 1.1, PTI ≤ 38% (moderate candidate)
  - 🔴 **Red**: Below thresholds (challenging candidate)

### 3. Deal Management API (`/api/deals`)

#### POST `/api/deals/ingest`
Ingests a new deal from raw text:
```bash
curl -X POST http://localhost:5000/api/deals/ingest \
  -H "Content-Type: application/json" \
  -d '{
    "source": "manual",
    "rawText": "Hi, Clarence. New off-market property in 247 Howell Drive Southwest, Atlanta, GA 30331 is available on Investorlift. Asking 103k. ARV 165k. Contact Charlie Martinez 323-701-0293 for more information.",
    "url": "https://investorlift.com/p/281467"
  }'
```

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "541b9d47-0ffa-495a-8004-c68c1b818157",
    "source": "manual",
    "parsed": {
      "address": "247 Howell Drive Southwest, Atlanta, GA 30331",
      "asking": 103000,
      "arv": 165000,
      "contactName": "Charlie Martinez",
      "contactPhone": "323-701-0293",
      "city": "Atlanta",
      "state": "GA",
      "zip": "30331"
    },
    "status": "draft",
    "compliance": {
      "consentLog": ["Received manual message at 2025-10-26T05:19:13.361Z"],
      "optOutDetected": false
    }
  }
}
```

#### POST `/api/deals/:dealId/analyze`
Runs profitability and RTO analysis:
```bash
curl -X POST http://localhost:5000/api/deals/{dealId}/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "customRepairEstimates": {
      "low": 15000,
      "mid": 30000,
      "high": 45000
    }
  }'
```

**Response**:
```json
{
  "analysis": {
    "maoByRepair": [
      {"repair": 15000, "mao": 100500},
      {"repair": 30000, "mao": 85500},
      {"repair": 45000, "mao": 70500}
    ],
    "priceToArvPctWithRepairs": [
      {"repair": 15000, "pct": 71.5},
      {"repair": 30000, "pct": 80.6},
      {"repair": 45000, "pct": 89.7}
    ],
    "rtoBadge": "yellow",
    "recommendation": "Moderate rent-to-own candidate..."
  }
}
```

#### POST `/api/deals/:dealId/enrich`
Enriches deal with geocoding and property data (placeholder for future APIs):
```bash
curl -X POST http://localhost:5000/api/deals/{dealId}/enrich \
  -H "Content-Type: application/json" \
  -d '{
    "geocode": true,
    "propertyFacts": true,
    "rentData": true
  }'
```

#### POST `/api/deals/:dealId/publish`
Marks deal for listing to investors or RTO participants:
```bash
curl -X POST http://localhost:5000/api/deals/{dealId}/publish \
  -H "Content-Type: application/json" \
  -d '{"target": "investor"}'
```

**Response**:
```json
{
  "cardUrl": "/deals/{dealId}/card/investor",
  "publishedAt": "2025-10-26T05:21:27.084Z"
}
```

#### GET `/api/deals/:dealId`
Retrieves a single deal by ID.

#### GET `/api/deals?status={status}&limit={limit}&offset={offset}`
Lists deals with optional filtering and pagination.

### 4. Database Schema (`deals` table)
PostgreSQL table with JSONB columns for flexible data storage:

| Column | Type | Description |
|--------|------|-------------|
| `id` | VARCHAR(36) | UUID primary key |
| `source` | VARCHAR(20) | "manual", "sms", "email", "webhook" |
| `raw_text` | TEXT | Original message |
| `parsed` | JSONB | Extracted fields (address, prices, contact) |
| `geocode` | JSONB | Lat/lng, county, MSA (future) |
| `facts` | JSONB | Beds/baths, sqft, year built (future) |
| `finance` | JSONB | Mortgage, taxes, insurance (future) |
| `rents` | JSONB | Market rent estimates (future) |
| `repairs` | JSONB | Low/mid/high repair estimates |
| `analysis` | JSONB | MAO, Price-to-ARV, RTO badge |
| `media` | JSONB | Photos, videos, documents |
| `compliance` | JSONB | Consent logs, opt-out flags, TOS mode |
| `status` | VARCHAR(20) | "draft", "suppressed", "listed_investor", "listed_rto" |
| `created_by` | VARCHAR(255) | User who created the deal |
| `assigned_to` | VARCHAR(255) | User assigned to work the deal |
| `notes` | TEXT | Internal notes |
| `created_at` | TIMESTAMP | Creation timestamp |
| `updated_at` | TIMESTAMP | Last update timestamp |

### 5. Feature Flag System
IELA Pipeline is feature-flagged and disabled by default:

**Enable**: Set `AXIOM_FEATURE_IELA=true` in `.env`
**Disable**: Remove the flag or set to `false`

Routes are protected with middleware that returns 404 when disabled.

## Compliance & Security

### 1. Opt-Out Handling
- **Detection**: Regex patterns for "stop", "opt-out", "unsubscribe", etc.
- **Suppression**: Deals marked as `status: "suppressed"` when opt-out detected
- **Logging**: All opt-out events logged in `compliance.consentLog`

### 2. Consent Tracking
Every deal includes:
```json
{
  "compliance": {
    "consentLog": [
      "Received manual message at 2025-10-26T05:19:13.361Z",
      "Parsed successfully",
      "Opt-out detected - message marked as suppressed"
    ],
    "tosMode": "manual_upload",
    "optOutDetected": true,
    "processedAt": "2025-10-26T05:19:13.361Z"
  }
}
```

### 3. Data Privacy
- **No PII in logs**: Contact info stored in database, not console logs
- **User attribution**: `created_by` field tracks who uploaded data
- **Audit trail**: `updated_at` timestamp tracks all modifications

## Testing Results

### Smoke Test: Atlanta Property
**Input**: "Asking 103k. ARV 165k. 247 Howell Drive Southwest, Atlanta, GA 30331"

**Parsing**:
- ✅ Address: "247 Howell Drive Southwest, Atlanta, GA 30331"
- ✅ Asking: $103,000 (parsed from "103k")
- ✅ ARV: $165,000 (parsed from "165k")
- ✅ City: "Atlanta", State: "GA", Zip: "30331"
- ✅ Contact: "Charlie Martinez", "323-701-0293"

**Analysis**:
- ✅ MAO (Mid): $85,500 (70% × $165K - $30K)
- ✅ MAO (Low): $100,500 (70% × $165K - $15K)
- ✅ MAO (High): $70,500 (70% × $165K - $45K)
- ✅ Price-to-ARV: 80.6% (($103K + $30K) / $165K)
- ✅ RTO Badge: Yellow (moderate candidate)

## Future Enhancements

### 1. Enrichment APIs
- **Geocoding**: Google Maps, Mapbox, or Geocodio
- **Property Facts**: Zillow API, HouseCanary, or DataTree
- **Rent Data**: RentRange, RentCast, or Zillow Rent Zestimate

### 2. Admin UI
- Deal intake form with live parsing preview
- Analysis dashboard with charts
- Deal card builder for investor/RTO listings
- Bulk upload from CSV/Excel

### 3. Automation
- Email-to-deal integration (parse emails from InvestorLift)
- SMS-to-deal integration (Twilio webhook)
- Auto-analysis on ingest
- Auto-publish deals meeting criteria (MAO > asking, RTO green badge)

### 4. Machine Learning
- Repair estimate predictions based on property age/condition
- Rent estimate models trained on local market data
- Deal scoring to prioritize high-quality leads

## Integration with Existing Systems

### KeyGrow Rent-to-Own
IELA deals marked `listed_rto` can be imported into KeyGrow:
1. RTO badge analysis identifies suitable properties
2. DSCR/PTI calculations ensure affordability
3. Deal cards displayed to KeyGrow participants

### Real Estate Investor Platform
IELA deals marked `listed_investor` can be imported into investor marketplace:
1. MAO calculations guide investor bids
2. Price-to-ARV filters out overpriced deals
3. Profitability metrics (cap rate, cash-on-cash) attract investors

## Technical Notes

### Why JavaScript (not TypeScript)?
IELA modules were initially written in TypeScript but converted to CommonJS JavaScript for compatibility with the existing AXIOM platform (unified-platform.js).

### Why JSONB?
JSONB columns provide flexibility for:
- Variable property data (not all properties have the same fields)
- Evolving schema (add new fields without migrations)
- Fast querying (PostgreSQL indexes JSONB efficiently)

### Why Feature Flags?
- **Safety**: New system can be tested in production without affecting users
- **Rollback**: Instant disable if bugs are found
- **Gradual rollout**: Enable for beta testers first

## Conclusion

The IELA Pipeline is a production-ready system for wholesale real estate deal intake and analysis. It successfully:
- ✅ Parses unstructured text into structured data
- ✅ Calculates profitability and RTO suitability metrics
- ✅ Provides REST API for integration with other systems
- ✅ Handles compliance (opt-out, consent logging)
- ✅ Feature-flagged for safe deployment

**Next Steps**: Build admin UI for deal management and enable enrichment APIs.
