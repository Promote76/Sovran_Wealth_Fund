# AXIOM: The Foundation of Sovereign Wealth

## Overview
AXIOM is a decentralized finance (DeFi) platform on BSC and Polygon, designed to create a lawful digital economy through token management, Proof of Contribution (PoC) staking, liquidity provision, NFT integration, and transparent governance. It aims to derive value from participation and contribution, blending ancient wisdom with modern cryptography for a self-correcting network.

**Key Programs:**
-   **KeyGrow Rent-to-Own**: Allocates 20% of platform revenue to facilitate homeownership for renters.
-   **Real Estate Investor**: A gas-efficient platform for fractional property investment offering multiple earning mechanisms like rental income, appreciation, and exit profits.
-   **Marketing Hub**: Professional video script library and AI-powered script generator for creating marketing content.

## User Preferences
Preferred communication style: Simple, everyday language.

## Recent Updates (October 26, 2025)

- **Property Listings Integration**: NEW - Live property cards embedded directly in KeyGrow and Real Estate Investor pages
  - **ROI Calculations**: Added proper ROI calculation to profitability analysis (ROI = (ARV - (Asking + Repairs)) / (Asking + Repairs) * 100)
  - **Deal Detail Pages**: Full property detail view at `/deals/:id` with images, property facts, investment analysis, pricing, and contact info
  - **KeyGrow Embedded Listings**: Shows top 3 RTO-ready properties (green badge) with asking price and estimated rent
  - **Investor Embedded Listings**: Shows top 3 investment opportunities sorted by ROI with asking, ARV, MAO, and ROI metrics
  - **Functional View Details**: Buttons now route to individual deal detail pages with complete property information
  - **React Router Integration**: Added `/deals/:id` route for individual property pages

- **IELA Pipeline (Ingest-Enrich-Analyze-List)**: ✅ PRODUCTION-READY - Complete wholesale real estate deal management system with 5 production deployment features
  - **Parsing Engine**: SMS/email text parser extracts property details (address, asking price, ARV, contact info)
  - **Enrichment Service**: 
    - Geocoding via OpenStreetMap (lat/long, display name, bounding box)
    - Property facts estimation (beds/baths, sqft, year built, condition, property type)
    - Market data (median home value, median rent, appreciation trends, days on market)
    - Neighborhood scoring (walk score, crime rating, school quality, amenities rating)
  - **ML Prediction Engine**: 
    - Repair cost prediction based on size, age, condition, stories
    - Rent estimation using beds/baths, sqft, amenities, market baseline
    - Appreciation forecasting (1-year, 5-year, 10-year projections)
    - ROI calculations with expense breakdown and profit projections
  - **Analysis Modules**: Profitability calculator (MAO, Price-to-ARV%) and RTO suitability analyzer (DSCR, PTI, badges)
  - **Deal Management API**: Full CRUD endpoints at `/api/deals` for ingest, enrich, analyze, publish
  - **Automation Webhooks**: `/api/webhooks` for InvestorLift email, Twilio SMS, and generic integrations
  - **Admin UI** (React Integration):
    - Dashboard at `/admin/iela/dashboard` with filtering, search, status management, and stats cards
    - Intake form at `/admin/iela/intake` with manual entry and example loader
    - Both pages integrated into React Router with admin authentication protection
    - Admin dashboard includes IELA Pipeline tab for easy access
    - Real-time analysis and publishing controls for investors and RTO participants
  - **Property Scraper**: Extracts images and property data from listing URLs
    - Supports InvestorLift, Zillow, Realtor.com, and generic property sites
    - Auto-scrapes during enrichment phase when URL is detected in deal text
    - Stores property images in media field for marketplace display
  - **Public Marketplace**: `/deals` - Investor and buyer-facing marketplace
    - Filter by deal type (investor opportunities, RTO-ready)
    - Search by location (city, state, ZIP)
    - Sort by price, ROI, or newest deals
    - Display property images, pricing, investment analysis, and ROI metrics
    - No login required - publicly accessible deal listings
  - **Database**: `deals` table with JSONB columns for parsed data, geocoding, property facts, market data, neighborhood scores, ML predictions, analysis results, compliance logs
  - **Feature Flagged**: Controlled by `AXIOM_FEATURE_IELA=true` environment variable (default: OFF)
  - **Tested**: Atlanta property smoke test validates parsing (103k→$103,000), MAO calculations, RTO badges, enrichment, and ML predictions
  - **Compliance**: Opt-out detection and consent logging for regulatory compliance
  - **Documentation**: Complete guide at `/docs/IELA_Complete_Guide.md`
  - **Production Features** (All 5 Complete):
    1. ✅ **Real API Integration**: Attom Data API service for official property facts (150M+ properties) with deterministic fallback
    2. ✅ **Automated Tests**: Regression test suite validates deterministic enrichment across all services
    3. ✅ **Email Notifications**: HTML email alerts to admins on new deals via configurable SMTP
    4. ✅ **Investor Matching**: Weighted scoring algorithm auto-matches deals to investor criteria with API endpoints
    5. ✅ **Contract Generation**: PDF offer letters and purchase agreements with professional templates via PDFKit

## Recent Updates (October 26, 2025 - Earlier)
- **KeyGrow Property Acquisition Analyzer**: NEW - External property listing analyzer for rent-to-own acquisition planning
  - **Property Analysis API**: `/api/keygrow/analyze-property` - Comprehensive financial analysis engine
  - **Web Crawler**: `/api/keygrow/crawl-property` - Automated InvestorLift property data extraction
  - **Acquisition Calculations**: Down payment needs, KeyGrow allocation, timeline projections, financing details
  - **Investment Metrics**: Cash flow analysis, ROI, cap rate, affordability ratings (DTI)
  - **Tier Optimization**: Shows how upgrading KeyGrow tier accelerates down payment timeline
  - **Current Savings Integration**: Properly accounts for existing savings in timeline calculations
  - **Smart Recommendations**: Personalized guidance based on credit score, DTI, equity potential
  - **Production Testing**: Validated with Atlanta property ($103K, 18-month timeline, 67.6% KeyGrow contribution)

- **Marketing Hub Enhancement** (October 25, 2025): Expanded with AI-powered Social Media Post Generator
  - **Video Scripts**: 5 professionally written video marketing scripts (Platform Overview, KeyGrow, Real Estate Investor, Staking, Testimonials)
  - **Script Generator**: AI-powered script generator with 6 customizable templates (Explainer, Testimonial, Social Media, Product Demo, Comparison, Platform Valuation)
  - **Social Media Generator**: Platform-aware social media post generator
    - Analyzes entire platform (contracts, components, pages) using recursive directory scanning
    - Supports 5 platforms: Twitter/X, LinkedIn, Facebook, Instagram, Telegram
    - Platform-specific formatting (character limits, style guides, hashtag/emoji preferences)
    - **Custom Instructions Field**: Large textarea for detailed AI direction with comprehensive input options
      - Allows users to specify exact details, statistics, target audience, and specific messaging
      - Priority field in AI prompt for maximum control over generated content
      - Supports multi-line detailed instructions for comprehensive, tailored responses
    - 5-minute response caching for performance optimization
    - Feature-specific posts for KeyGrow, Real Estate Investor, Staking, etc.
  - **Platform Analysis API**: `/api/marketing-scripts/platform-analysis` with recursive file scanning
  - Script library with download and copy features
  - Integrated into admin dashboard at `/admin` with 3-tab navigation

## System Architecture

### Core Infrastructure
The backend uses Node.js with Express.js, while the frontend is built with React and TypeScript, handling static file serving and blockchain interactions.

### Blockchain Integration
AXIOM operates on BSC and Polygon Mainnets, featuring the AXM token. Smart contracts include role-based ERC20 tokens, PoC staking engines, liquidity vaults, governance systems (Axiom Council with quadratic voting), and NFT contracts, all secured with OpenZeppelin libraries. The system supports dynamic APR adjustments and energy-based circulation mechanics.

### Frontend Architecture
The React/TypeScript frontend provides a comprehensive component library for wallet connectivity and navigation, designed with a professional blue/white theme incorporating sacred geometry elements. It includes modules for staking, banking, investments, NFT operations, and educational content.

### Unified Registration System
A progressive onboarding system uses a single canonical user profile to eliminate data duplication. It features a security-first approach with httpOnly cookies, a modular design for consistent UI, and a 5-step registration flow (Account, Personal, Financial, Risk, Programs). The system uses PostgreSQL with Drizzle ORM and robust authentication middleware for secure session management.

**Tiered KYC System:**
- **Light KYC**: Basic identity verification for low-risk activities
- **Full KYC**: Enhanced verification with SSN and government ID for full platform access
- Database schema supports both tiers with secure SSN hashing and document verification

**Admin Dashboard** (`/admin/unified-registration`):
- Complete user management with search, filter, and sort capabilities
- Individual user detail modals showing full profile and program enrollment data
- Analytics dashboard with registration funnel metrics and conversion rates
- Program enrollment statistics across KeyGrow and Real Estate Investor
- Admin-only access with role-based authentication (admin/super_admin)
- Manual step completion and account status management tools
- Real-time progress tracking for every user's registration journey

**API Endpoints** (`/api/unified-registration-admin`):
- `/analytics/funnel` - Registration funnel conversion metrics
- `/analytics/daily-signups` - Daily signup trends
- `/users` - Paginated user list with search/filter/sort
- `/users/:userId` - Detailed user information and profiles
- `/users/:userId/journey` - Update registration journey steps
- `/users/:userId/status` - Manage account status
- `/users/:userId/complete-step` - Manual step completion
- `/programs/stats` - Program enrollment statistics

**Data Migration**:
ETL script (`server/scripts/migrateRegistrationData.js`) migrates legacy onboarding data into the unified system with idempotent design.

### Investment Platform
The platform includes an investment management system supporting various asset types (Crypto, Stocks, ETFs, REITs, Bonds, etc.). It features a multi-provider market data service with caching, an investment transaction engine, position management, and P&L calculations. All financial calculations use `Decimal.js` for precision and are wrapped in SQL transactions.

### Smart Contract System & Tokenomics
The AXM token has a finite supply of 10 billion, distributed across Treasury & Liquidity, Community Growth Fund, Founders, Adoption Incentives, and Institutional Liquidity Reserve. The ecosystem incorporates PoC staking engines with dynamic APR, AxiomBasketVault, DynamicAPRController, and the Axiom Council governance system. Staking rewards contribute to a slow-deflationary curve.

### Multi-Vault Liquidity Staking System
A VaultFactory system allows for the deployment of isolated staking vaults for different LP token pairs, each with configurable reward rates and lock periods. A unified dashboard displays active vaults and portfolio overviews.

### KeyGrow Rent-to-Own Program
20% of platform revenue is allocated to a Real Estate Acquisition Fund. The program assists renters with down payments and property acquisition based on tiered allocations and time-weighted multipliers, featuring a dashboard for fund statistics and property management.

### Real Estate Investor Platform
This platform enables fractional real estate investment via a single gas-efficient smart contract. It manages multiple properties, investor portfolios, automated rental income distribution, and appreciation tracking. It supports both Stripe and BNB payments with real-time BNB price oracle integration.

### Real-time Blockchain Event Processing
A `ContractEventListener` service monitors blockchain events, stores them in PostgreSQL, and broadcasts them via a WebSocket server for real-time frontend updates.

## External Dependencies

### Blockchain Services
-   Binance Smart Chain (BSC)
-   Polygon Mainnet
-   MetaMask Integration
-   Ethers.js

### Third-Party APIs
-   Alchemy API
-   BSCScan/Polygonscan
-   SendGrid
-   Stripe
-   CoinGecko API
-   Alpha Vantage API
-   Financial Modeling Prep (FMP)

### Cloud Storage
-   Google Cloud Storage
-   Storacha (Web3 Storage)

### Database & Infrastructure
-   PostgreSQL
-   Neon Database
-   MongoDB

### Development Tools
-   Hardhat
-   OpenZeppelin Contracts
-   Drizzle Kit