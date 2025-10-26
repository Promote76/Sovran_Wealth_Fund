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

### IELA Pipeline (Ingest-Enrich-Analyze-List)
A complete wholesale real estate deal management system. It includes a parsing engine for property details, an enrichment service (geocoding, property facts, market data, neighborhood scoring), and an ML prediction engine for repair costs, rent, appreciation, and ROI. Analysis modules provide profitability and RTO suitability. A Deal Management API and Automation Webhooks are provided. A Public Marketplace (`/deals`) allows filtering and searching of investment opportunities and RTO-ready properties. This system integrates Attom Data API, automated tests, email notifications, investor matching, and contract generation.

### Marketing Hub
Expanded with an AI-powered Social Media Post Generator that analyzes the entire platform and supports 5 social media platforms with platform-specific formatting. It includes a custom instructions field for detailed AI direction. The hub also contains professional video scripts and an AI-powered script generator with customizable templates.

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