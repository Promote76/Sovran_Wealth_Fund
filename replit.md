# AXIOM: The Foundation of Sovereign Wealth

## Overview
AXIOM is a decentralized finance (DeFi) platform on BSC and Polygon, designed to create a lawful digital economy through token management, Proof of Contribution (PoC) staking, liquidity provision, NFT integration, and transparent governance. It aims to derive value from participation and contribution, blending ancient wisdom with modern cryptography for a self-correcting network.

**Key Programs:**
-   **KeyGrow Rent-to-Own**: Allocates 20% of platform revenue to facilitate homeownership for renters.
-   **Real Estate Investor**: A gas-efficient platform for fractional property investment offering multiple earning mechanisms like rental income, appreciation, and exit profits.
-   **Marketing Hub**: Professional video script library and AI-powered script generator for creating marketing content.

## User Preferences
Preferred communication style: Simple, everyday language.

## Recent Updates (October 25, 2025)
- **Marketing Hub Enhancement**: Expanded with AI-powered Social Media Post Generator
  - **Video Scripts**: 5 professionally written video marketing scripts (Platform Overview, KeyGrow, Real Estate Investor, Staking, Testimonials)
  - **Script Generator**: AI-powered script generator with 5 customizable templates (Explainer, Testimonial, Social Media, Product Demo, Comparison)
  - **Social Media Generator**: NEW - Platform-aware social media post generator
    - Analyzes entire platform (contracts, components, pages) using recursive directory scanning
    - Supports 5 platforms: Twitter/X, LinkedIn, Facebook, Instagram, Telegram
    - Platform-specific formatting (character limits, style guides, hashtag/emoji preferences)
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