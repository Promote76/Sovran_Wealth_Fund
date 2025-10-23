# AXIOM: The Foundation of Sovereign Wealth

## Overview
AXIOM is a decentralized finance (DeFi) platform on BSC and Polygon, integrating token management, Proof of Contribution (PoC) staking, liquidity provision, NFT integration, and transparent governance. Its purpose is to establish a lawful digital economy where value is derived from participation and contribution, aiming to fuse ancient wisdom with modern cryptography to create a self-correcting network. AXIOM also features the KeyGrow Rent-to-Own program, allocating 20% of platform revenue to help renters achieve homeownership.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Core Infrastructure
The platform utilizes Node.js with Express.js for the backend, consolidating services into a unified server architecture. The frontend, built with React and TypeScript, serves static files and handles wallet/blockchain interactions.

### Blockchain Integration
AXIOM operates on BSC and Polygon Mainnets, with the AXM token deployed on both. Smart contracts include role-based ERC20 tokens, PoC staking engines, liquidity vaults, governance systems (Axiom Council with quadratic voting), and NFT contracts. The system supports dynamic APR adjustments and energy-based circulation mechanics. All smart contracts are security-enhanced with OpenZeppelin libraries.

### Frontend Architecture
The React/TypeScript frontend provides a comprehensive component library for wallet connectivity, navigation, and blockchain interactions, featuring a professional blue/white theme with sacred geometry elements. Key modules include unified wallet management and dedicated pages for staking, banking, investments, and NFT operations, plus educational content.

Smart Contract UI Pages (5 of 9 deployed contracts):
- **AdvancedStaking** (0x5eE9d1b28c261AE132B6d324b02452bC90750136): NFT staking with tiered APR (10-30%)
- **EnhancedNFTMarketplace** (0xEc973eD81082a1d539F380eF94f6215793410036): NFT listings, bidding, sales with 2.5% fees
- **KeyGrow/RealEstateAcquisitionFund** (0xd070776c3603138a1d4b93a2f668d604a4a99e34): Rent-to-own enrollment and tier management
- **BasketIndex** (0x06b88f3Faa07215F6f5fb0A10A3F058D3f25ecF6): Diversified crypto portfolio token with mint/burn
- **DynamicAPRController** (0x14dFA6b6785643850e5c09336F7Cd5971458e28d): Real-time APR dashboard, simulator, deposit impact curve, adjustment history

Each page includes comprehensive educational content, real-time blockchain data, transaction capabilities, and wallet integration.

### Database Layer
PostgreSQL is the primary database, utilizing Drizzle ORM for schema management. User authentication includes bcrypt hashing, and session management is handled via `connect-pg-simple`. The banking infrastructure supports high-yield savings, CDs, checking accounts, inter-account transfers, and detailed transaction histories with atomic, decimal-safe, and idempotent operations.

### Investment Platform
The platform includes an investment management system for 8 product types (Crypto, Stocks, ETFs, Retirement, REITs, Bonds, Commodities, Index Funds, plus Options Trading). It features a multi-provider market data service (CoinGecko, Alpha Vantage, FMP) with caching and rate limiting, an investment transaction engine for various order types, position management, P&L calculations, and 0.1% transaction fees. All financial calculations use `Decimal.js` for precision and are wrapped in SQL transactions for ACID compliance.

### Smart Contract System & Tokenomics
The AXM token has a finite supply of 10 billion, representing verified energy and contribution, with distribution across Treasury & Liquidity (40%), Community Growth Fund (30%), Founders (15%), Adoption Incentives (10%), and Institutional Liquidity Reserve (5%). The ecosystem includes the AXM token, PoC staking engines (10-30% dynamic APR), AxiomBasketVault, DynamicAPRController, and the Axiom Council governance system. PoC staking rewards time and impact, contributing to a slow-deflationary curve through partial fee burns and "energy locks."

Smart contracts deployed include: BasketIndex, AdvancedStaking, EnhancedNFTMarketplace, DynamicAPRController, LiquidityVault, GovernanceDividendPool, SWFVaultAdapter, RealEstateAcquisitionFund, and AXIOMRevenueRouter.

### KeyGrow Rent-to-Own Program
20% of all platform revenue is allocated to a Real Estate Acquisition Fund through the AXIOMRevenueRouter (80% Treasury, 20% KeyGrow). This fund assists renters with down payments and property acquisition based on tiered allocations and time-weighted multipliers.

### Real-time Blockchain Event Processing
The system includes a `ContractEventListener` service that monitors all contract systems for blockchain events, stores them in a `contract_events` PostgreSQL table, and broadcasts them via a WebSocket server for real-time frontend updates and notifications.

## External Dependencies

### Blockchain Services
- Binance Smart Chain (BSC)
- Polygon Mainnet
- MetaMask Integration
- Ethers.js

### Third-Party APIs
- Alchemy API
- BSCScan/Polygonscan
- SendGrid
- Stripe
- CoinGecko API
- Alpha Vantage API
- Financial Modeling Prep (FMP)

### Cloud Storage
- Google Cloud Storage
- Storacha (Web3 Storage)

### Database & Infrastructure
- PostgreSQL
- Neon Database
- MongoDB

### Development Tools
- Hardhat
- OpenZeppelin Contracts
- Drizzle Kit