# AXIOM: The Foundation of Sovereign Wealth

## Overview
AXIOM is a decentralized finance (DeFi) platform on BSC and Polygon, designed to create a lawful digital economy through token management, Proof of Contribution (PoC) staking, liquidity provision, NFT integration, and transparent governance. It aims to derive value from participation and contribution, blending ancient wisdom with modern cryptography for a self-correcting network. Key programs include KeyGrow Rent-to-Own for facilitating homeownership, a gas-efficient Real Estate Investor platform for fractional property investment, and a Marketing Hub with AI-powered content generation.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Core Infrastructure
The backend uses Node.js with Express.js, while the frontend is built with React and TypeScript, handling static file serving and blockchain interactions.

### UI/UX Decisions
The React/TypeScript frontend provides a comprehensive component library, designed with a professional blue/white theme incorporating sacred geometry elements.

### Blockchain Integration
AXIOM operates on BSC and Polygon Mainnets, featuring the AXM token. Smart contracts include role-based ERC20 tokens, PoC staking engines, liquidity vaults, governance systems (Axiom Council with quadratic voting), and NFT contracts, all secured with OpenZeppelin libraries. The system supports dynamic APR adjustments and energy-based circulation mechanics. A VaultFactory system allows for the deployment of isolated staking vaults for different LP token pairs. A `ContractEventListener` service monitors blockchain events for real-time frontend updates.

### Unified Registration System
A progressive onboarding system uses a single canonical user profile with a 5-step registration flow (Account, Personal, Financial, Risk, Programs). It features a security-first approach with httpOnly cookies and robust authentication middleware. A tiered KYC system supports Light KYC and Full KYC. An Admin Dashboard provides user management, analytics, and program enrollment statistics.

### Investment Platform
The platform includes an investment management system supporting various asset types. It features a multi-provider market data service, an investment transaction engine, position management, and P&L calculations, all utilizing `Decimal.js` for precision.

### Smart Contract System & Tokenomics
The AXM token has a finite supply of 10 billion. The ecosystem incorporates PoC staking engines with dynamic APR, AxiomBasketVault, DynamicAPRController, and the Axiom Council governance system. Staking rewards contribute to a slow-deflationary curve.

### KeyGrow Rent-to-Own Program
20% of platform revenue is allocated to a Real Estate Acquisition Fund. The program assists renters with down payments and property acquisition based on tiered allocations and time-weighted multipliers. It includes a property acquisition analyzer API for financial analysis and investment metrics.

### Real Estate Investor Platform
This platform enables fractional real estate investment via a single gas-efficient smart contract. It manages multiple properties, investor portfolios, automated rental income distribution, and appreciation tracking. It supports both Stripe and BNB payments with real-time BNB price oracle integration.

### Fractional Real Estate Ownership System (Hybrid Model)
A comprehensive fractional ownership platform that combines database-backed investment tracking with blockchain settlement. The system implements a 4-tier investor model (Retail, Accredited, Premium, Institutional) with tiered revenue bonuses. Each property is divided into 10,000 shares with enforced guardrails: minimum $500 investment, maximum 25% ownership per wallet, and 6-month lockup periods. The backend API (`/api/fractional/*`) provides property listings, tier calculations, purchase flows, portfolio tracking, and transaction history. Database triggers enforce ownership limits and tier-based investment constraints. Monthly rental income distributions use a pro-rata base (80%) plus tier bonus pool (20%) model. A bridge service (`realEstateContractBridge.js`) syncs blockchain events (PropertyListed, InvestmentMade, RentalIncomeDistributed) with the PostgreSQL database for unified data access. The system integrates with the IELA Pipeline to fractionalize wholesale deals into investment offerings.

### IELA Pipeline (Ingest-Enrich-Analyze-List)
A complete wholesale real estate deal management system. It includes a parsing engine for property details, an enrichment service (geocoding, property facts, market data, neighborhood scoring), and an ML prediction engine for repair costs, rent, appreciation, and ROI. Analysis modules provide profitability and RTO suitability. A Deal Management API and Automation Webhooks are provided. A Public Marketplace (`/deals`) allows filtering and searching of investment opportunities and RTO-ready properties. This system integrates Attom Data API, automated tests, email notifications, investor matching, and contract generation.

### Marketing Hub
Expanded with an AI-powered Social Media Post Generator that analyzes the entire platform and supports 5 social media platforms with platform-specific formatting. It includes a custom instructions field for detailed AI direction. The hub also contains professional video scripts and an AI-powered script generator with customizable templates.

### Enterprise Feature Foundations (2025 Roadmap)
**Status**: 4 of 8 features complete (50%) - Features #1, #2, #3, #4 are production-ready

AXIOM has completed the foundational infrastructure for 8 major enterprise features that will transform the platform into an institutional-grade real estate investment platform:

#### Feature #1: Liquidity & Redemption Desk ✅ 100% COMPLETE
**Status**: PRODUCTION-READY (October 27, 2025)
A managed secondary market system enabling investors to trade fractional property shares before the 6-month lockup expires. Features price-time priority matching, treasury liquidity pool, automated compliance checks, and 2% platform fees. 7 database tables: `liquidity_orders`, `order_matches`, `treasury_ledger`, `compliance_holds`, `fee_ledger`, `liquidity_pool_config`, `liquidity_transactions`.
**Implementation**: 
- REST API with 12 endpoints and comprehensive input validation
- 3 production-ready React/TypeScript UI components (LiquidityTrading, LiquidityDashboard, OrderBook)
- Comprehensive test suite (8/8 tests passing at 100%)
- Deterministic test fixtures for reliable CI/CD integration

#### Feature #2: Smart Compliance Orchestrator ✅ 100% COMPLETE
**Status**: PRODUCTION-READY (October 27, 2025)
Automated KYC/AML, accreditation verification, and regulatory compliance engine. Integrates with Persona/Middesk for automated identity verification, Chainalysis for wallet screening, and handles Form D/Form C SEC filings. 6 database tables: `compliance_rules`, `accreditation_verifications`, `aml_checks`, `regulatory_filings`, `compliance_alerts`, `jurisdiction_rules`.
**Implementation**:
- REST API with 14 endpoints and comprehensive input validation
- 3 production-ready React/TypeScript UI components (ComplianceMonitor, InvestorCompliance, ComplianceAlerts)
- Comprehensive test suite (10/10 tests passing at 100%)
- Deterministic test fixtures for reliable CI/CD integration

#### Feature #3: Investor Intelligence Suite ✅ 100% COMPLETE
**Status**: PRODUCTION-READY (October 27, 2025)
Predictive analytics engine with 12-month cash flow projections, REIT/market benchmarks, cohort analysis, and portfolio risk scoring. Provides investors with professional-grade insights and recommendations. 5 database tables: `cash_flow_projections`, `performance_benchmarks`, `investor_cohorts`, `portfolio_analytics`, `risk_assessments`.
**Implementation**:
- REST API with 18 endpoints (12 original + 6 simplified UI-friendly routes) and comprehensive input validation
- Enhanced IntelligenceService with 7 additional methods (projections, benchmarks, cohorts, risk assessments, dashboard)
- 3 production-ready React/TypeScript UI components (IntelligenceDashboard, CashFlowProjections, PortfolioAnalytics)
- Comprehensive test suite (6/6 API endpoints passing at 100%)
- API routes registered and server-ready at /api/intelligence/*
- **UI Integration**: Intelligence Suite integrated into InvestorPage (`/investors`) with dedicated "Intelligence Suite" tab featuring sub-tabs for Portfolio Dashboard, Cash Flow Projections, and Portfolio Analytics. Accessible at `/investors` route with brain icon (🧠)

#### Feature #4: Automated Revenue & Distribution Engine ✅ 100% COMPLETE
**Status**: PRODUCTION-READY (October 27, 2025)
Unified transaction ledger with automated revenue distribution, Stripe Connect integration for instant payouts, and tiered revenue sharing (0%/2%/5%/8% bonuses). Supports pro-rata and waterfall distribution models. 6 database tables: `unified_transaction_ledger`, `distribution_policies`, `payout_batches`, `payout_transactions`, `stripe_connect_accounts`, `revenue_analytics`.
**Implementation**:
- REST API with comprehensive endpoints for distribution policies, payouts, and analytics
- Stripe Connect integration for instant payouts
- Automated revenue distribution engine with pro-rata and waterfall models
- Complete backend service with transaction tracking and reporting

#### Feature #5: Property Risk Sentinel
**Status**: Database schema + Core service complete
Real-time property valuation using AVMs, environmental risk monitoring (flood/fire/earthquake), market condition tracking, and automated alert system. Integrates with CoreLogic and HazardHub APIs. 6 database tables: `property_valuations`, `risk_monitoring_events`, `market_conditions`, `property_alerts`, `environmental_risks`, `monitoring_schedules`.

#### Feature #6: Co-Investment Syndication Portal
**Status**: Database schema + Core service complete
Enables lead investors to create syndicates with custom waterfall distributions (preferred returns, carried interest, catch-up provisions). Supports blind pools, deal-specific, and permanent syndicates with invite-only access control. 6 database tables: `syndicates`, `syndicate_members`, `waterfall_tiers`, `syndicate_distributions`, `syndicate_invitations`, `syndicate_fees`.

#### Feature #7: Tax & Reporting Automation
**Status**: Database schema + Core service complete
Automated generation of 1099-DIV, K-1, and annual investor statements. W-9/W-8 collection, tax lot tracking for capital gains, and TaxBit integration for simplified tax reporting. 6 database tables: `tax_profiles`, `tax_documents`, `tax_line_items`, `investor_statements`, `tax_lot_tracking`, `tax_provider_integrations`.

#### Feature #8: Multi-chain Deployment Orchestrator
**Status**: Database schema + Core service complete
Cross-chain contract deployment supporting BSC, Polygon, Arbitrum, and Optimism. Bridge transaction management, gas optimization, and automated contract monitoring across all chains. Pre-seeded with 4 supported chains. 7 database tables: `supported_chains`, `deployed_contracts`, `cross_chain_bridges`, `bridge_transactions`, `deployment_templates`, `chain_monitoring`, `gas_price_history`.

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
-   OpenStreetMap
-   Attom Data API
-   Puppeteer (for property scraping)
-   Twilio (for SMS webhooks)

### Cloud Storage
-   Google Cloud Storage
-   Storacha (Web3 Storage)
-   Dropbox (for image integration)

### Database & Infrastructure
-   PostgreSQL
-   Neon Database
-   MongoDB

### Development Tools
-   Hardhat
-   OpenZeppelin Contracts
-   Drizzle Kit
-   Cheerio
-   PDFKit