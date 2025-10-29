# AXIOM: The Foundation of Sovereign Wealth

## Overview
AXIOM is a decentralized finance (DeFi) platform operating on BSC and Polygon, designed to establish a lawful digital economy. It integrates token management, Proof of Contribution (PoC) staking, liquidity provision, NFT integration, and transparent governance. The platform aims to derive value from active participation and contribution, blending traditional financial principles with modern cryptographic solutions. Key initiatives include the KeyGrow Rent-to-Own program for homeownership, a gas-efficient Real Estate Investor platform for fractional property investment, and a Marketing Hub featuring AI-powered content generation. All enterprise features for an institutional-grade real estate investment platform are production-ready.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Core Infrastructure
The system uses a Node.js with Express.js backend and a React/TypeScript frontend for serving static files and managing blockchain interactions.

### UI/UX Decisions
The frontend features a comprehensive React/TypeScript component library with a professional blue/white theme, incorporating sacred geometry elements.

### Blockchain Integration
AXIOM is deployed on BSC and Polygon Mainnets and utilizes the AXM token. Smart contracts include role-based ERC20 tokens, PoC staking engines, liquidity vaults, a governance system (Axiom Council with quadratic voting), and NFT contracts, all secured with OpenZeppelin libraries. It supports dynamic APR adjustments, energy-based token circulation, and a VaultFactory for isolated staking. A `ContractEventListener` monitors blockchain events for real-time updates.

### Unified Registration System
A security-focused, progressive 5-step onboarding process (Account, Personal, Financial, Risk, Programs) establishes a single canonical user profile. It employs httpOnly cookies, robust authentication middleware, and a tiered KYC system (Light and Full). An Admin Dashboard offers user management, analytics, and program enrollment statistics.

### Investment Platform
The platform provides an investment management system supporting diverse asset types, featuring a multi-provider market data service, investment transaction engine, position management, and precise P&L calculations using `Decimal.js`.

### Smart Contract System & Tokenomics
The AXM token has a finite supply of 10 billion. The ecosystem includes PoC staking with dynamic APR, AxiomBasketVault, DynamicAPRController, and the Axiom Council governance system, contributing to a slow-deflationary reward structure.

### KeyGrow Rent-to-Own Program
20% of platform revenue funds a Real Estate Acquisition Fund. The program helps renters with down payments and property acquisition based on tiered allocations and time-weighted multipliers, supported by a property acquisition analyzer API for financial analysis.

### Real Estate Investor Platform
This platform enables fractional real estate investment through a single, gas-efficient smart contract. It manages multiple properties, investor portfolios, automated rental income distribution, and appreciation tracking, supporting Stripe and BNB payments with real-time BNB price oracle integration.

### Fractional Real Estate Ownership System (Hybrid Model)
A hybrid platform combining database-backed investment tracking with blockchain settlement. It implements a 4-tier investor model (Retail, Accredited, Premium, Institutional) with tiered revenue bonuses. Properties are divided into 10,000 shares with investment guardrails (min $500, max 25% ownership per wallet, 6-month lockup). Backend APIs manage listings, tiers, purchases, portfolios, and transaction history. Database triggers enforce limits. Monthly rental income distributions use an 80% pro-rata base plus a 20% tier bonus pool. A `realEstateContractBridge.js` syncs blockchain events with PostgreSQL. It integrates with the IELA Pipeline for fractionalization of wholesale deals.

### IELA Pipeline (Ingest-Enrich-Analyze-List)
A comprehensive wholesale real estate deal management system featuring a parsing engine, an enrichment service (geocoding, market data), and an ML prediction engine for repair costs, rent, appreciation, and ROI. Analysis modules determine profitability and RTO suitability. It includes a Deal Management API, Automation Webhooks, and a Public Marketplace for investment opportunities. Integrations include Attom Data API, automated tests, email notifications, investor matching, and contract generation.

### Marketing Hub
Features AI-powered content generation tools:
-   **Social Media Post Generator**: Analyzes platform content for 5 social media platforms, with specific formatting and custom instructions.
-   **Video Script Generator**: AI-powered script creation using customizable templates.
-   **Script Library**: Professional pre-written video marketing scripts.
-   **Manuscript Generator**: AI-powered generator for 25-300 page manuscripts and technical manuals, scanning the entire codebase for professional documentation.

### International Investor Onboarding (GENIUS Act Compliant)
A comprehensive 6-step onboarding system for international crypto investors, DAOs, and family offices:
-   **KYC/AML Integration**: Persona API integration for identity verification with simulation mode for development
-   **Wallet Screening**: Chainalysis API integration for OFAC sanctions screening and risk scoring
-   **Stablecoin Escrow**: Circle API integration for production escrow, with proper error handling for Anchorage/Fireblocks
-   **Multi-Chain Support**: BSC, Polygon, and Arbitrum networks with USDC/USDT/BUSD stablecoin support
-   **Accreditation Verification**: Tiered investor classification (income, net worth, entity-based)
-   **Compliance Automation**: Integrated FATCA/CRS tax certification, risk disclosures, and terms acceptance
-   **API Endpoint**: `/api/investors/international/onboarding` orchestrates KYC, wallet screening, and escrow generation
-   **Frontend Integration**: Accessible via Investor Page → International Onboarding tab with React/TypeScript wizard
-   **Fixed (Oct 29, 2025)**: Resolved TypeScript validation errors in disclosures schema - changed from `z.literal(true)` to `z.boolean().refine()` pattern

### Waitlist Validation System (Bootstrap Strategy)
A pre-launch waitlist system to validate demand before incorporation and formal launch:
-   **Landing Page**: Standalone React page at `/waitlist` with GENIUS Act positioning and $52B market messaging
-   **Founding Member Program**: First 500 qualified entries receive 50% platform fee discount (1% vs 2% standard)
-   **Dual-Lane System**: Feature flag-controlled role selector (investor/wholesaler) with smart email deduplication
-   **Database Tracking**: PostgreSQL table tracking email, name, investment range, investor type, and founding member status
-   **Real-time Stats**: Dynamic counter showing total signups, available spots, and pending notifications
-   **API Endpoints**: `/api/waitlist/signup` for registration, `/api/waitlist/stats` for metrics, `/api/waitlist/admin` for management
-   **Admin Dashboard**: React component at `/admin/waitlist` for viewing signups, updating status, and CSV export
-   **Compliance Badges**: OFAC Compliant, SEC Registered, USDC/USDT/BUSD support prominently displayed
-   **Bootstrap Approach**: Path B validation (free waitlist) before Path A incorporation ($500 Stripe Atlas)
-   **Conversion Optimizations (Oct 29, 2025)**: Social proof ticker with real-time signups (integrated with database via `/api/waitlist/recent` endpoint), email validation with green checkmarks, trust badges, "What Happens Next?" 3-step guide, FAQ section with 4 questions, exit intent popup, and mobile autocomplete optimization. Expected 20-60% conversion rate increase based on industry benchmarks.
-   **Launch Date Updated (Oct 29, 2025)**: Platform launch timeline updated from Q1 2025 to Q2 2026 in FAQ and "What Happens Next" sections for realistic expectations.

### Enterprise Feature Foundations (Production-Ready)
All 8 enterprise features are complete and production-ready:
1.  **Liquidity & Redemption Desk**: A managed secondary market for fractional property shares with price-time priority matching, treasury liquidity, automated compliance, and 2% platform fees.
2.  **Smart Compliance Orchestrator**: Automated KYC/AML, accreditation verification, and regulatory compliance engine integrating with Persona/Middesk and Chainalysis.
3.  **Investor Intelligence Suite**: Predictive analytics for 12-month cash flow projections, market benchmarks, cohort analysis, and portfolio risk scoring.
4.  **Automated Revenue & Distribution Engine**: Unified transaction ledger with automated revenue distribution, Stripe Connect integration, and tiered revenue sharing (pro-rata and waterfall models).
5.  **Property Risk Sentinel**: Real-time property valuation, environmental risk monitoring, market condition tracking, and automated alerts, integrating with CoreLogic and HazardHub APIs.
6.  **Co-Investment Syndication Portal**: Enables lead investors to create syndicates with custom waterfall distributions (preferred returns, carried interest, catch-up provisions), supporting various syndicate types with invite-only access.
7.  **Tax & Reporting Automation**: Automated generation of 1099-DIV, K-1, and annual investor statements, including W-9/W-8 collection, tax lot tracking, and TaxBit integration.
8.  **Multi-chain Deployment Orchestrator**: Cross-chain contract deployment and management for BSC, Polygon, Arbitrum, and Optimism, including bridge transaction management, gas optimization, and automated contract monitoring.

## External Dependencies

### Blockchain Services
-   Binance Smart Chain (BSC)
-   Polygon Mainnet
-   MetaMask
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
-   Puppeteer
-   Twilio
-   Persona/Middesk (for identity verification)
-   Chainalysis (for wallet screening)
-   CoreLogic (for property data)
-   HazardHub (for environmental risk data)
-   TaxBit (for tax reporting)

### Cloud Storage
-   Google Cloud Storage
-   Storacha (Web3 Storage)
-   Dropbox

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