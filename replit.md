# AXIOM: The Foundation of Sovereign Wealth

## Overview
AXIOM is a decentralized finance (DeFi) platform built on multiple blockchain networks (BSC, Polygon) that integrates token management, Proof of Contribution (PoC) staking, liquidity provision, NFT integration, and transparent governance. Its purpose is to create a lawful digital economy where value is derived from participation and contribution, embodying the principle that "wealth is energy in circulation." The project aims to fuse ancient wisdom with modern cryptography, establishing a self-correcting network where integrity creates value, reflecting natural law.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Core Infrastructure
The platform uses Node.js with Express.js for the backend, consolidating services like authentication, token management, staking, and administration into a unified server architecture. The frontend serves static files with JavaScript modules for wallet and blockchain interactions.

### Blockchain Integration
AXIOM operates on BSC Mainnet and Polygon Mainnet, with the AXM token deployed on both. Smart contracts include role-based ERC20 tokens, Proof of Contribution staking engines, liquidity vaults, governance systems (Axiom Council with quadratic voting), and NFT contracts. The system supports dynamic APR adjustments and energy-based circulation mechanics.

### Frontend Architecture
The frontend is built with React and TypeScript, offering a comprehensive component library for wallet connectivity, navigation, and blockchain interactions. It features a professional blue/white theme with sacred geometry design elements. Key modules include unified wallet management and dedicated pages for staking, banking, investments, and NFT operations. A User Guide provides educational content on wealth building, banking, investments, and PoC staking, optimized for various devices.

### Database Layer
PostgreSQL is the primary database, utilizing Drizzle ORM. Session management is handled via `connect-pg-simple`, and user authentication includes bcrypt hashing. The banking infrastructure supports high-yield savings (4.25% APY), CDs (6.25% APY), checking accounts, inter-account transfers, and detailed transaction histories, featuring atomic transactions, decimal-safe calculations, and idempotency.

### Investment Platform Infrastructure
The platform includes a comprehensive investment management system supporting 8 product types: Crypto Trading, Stock Trading, ETF Portfolios, Retirement Accounts, REITs, Bonds, Commodities, and Index Funds, with an additional feature for Options Trading. It features a multi-provider market data service (CoinGecko, Alpha Vantage, FMP) with caching and rate limit protection, an investment transaction engine for market and limit orders, position management, P&L calculations, and fee handling (0.1% transaction fees). All financial calculations use `Decimal.js` for precision and operations are wrapped in SQL transactions for ACID compliance. The UI provides a comprehensive overview, a professional trading interface, a portfolio dashboard, and educational resources.

### Smart Contract System & Tokenomics
The AXM token has a finite supply of 10 billion, representing verified energy and contribution. Distribution is allocated across Treasury & Liquidity (40%), Community Growth Fund (30%), Founders (15%), Adoption Incentives (10%), and Institutional Liquidity Reserve (5%). The smart contract ecosystem includes the AXM token, Proof of Contribution (PoC) staking engines (10-30% dynamic APR), AxiomBasketVault, DynamicAPRController, and the Axiom Council governance system using quadratic voting. PoC staking rewards time and impact, with partial fee burns and "energy locks" contributing to a slow-deflationary curve.

Smart contracts for deployment (AdvancedStaking, BasketIndex, CombinedStakingContracts, DynamicAPRController, EnhancedNFTMarketplace) are security-enhanced with ERC721Holder, SafeERC20, ReentrancyGuard, and OpenZeppelin v5 libraries. Deployment tooling for BSC is configured using Hardhat, including scripts for deployment and verification.

## External Dependencies

### Blockchain Services
- **Binance Smart Chain (BSC)**: Primary network, PancakeSwap integration.
- **Polygon Mainnet**: Secondary network.
- **MetaMask Integration**: Wallet connection.
- **Ethers.js**: Blockchain interaction.

### Third-Party APIs
- **Alchemy API**: Blockchain RPC.
- **BSCScan/Polygonscan**: Contract verification and data.
- **SendGrid**: Email notifications.
- **Stripe**: Payment processing.
- **CoinGecko API**: Cryptocurrency market data.
- **Alpha Vantage API**: Stock market data.
- **Financial Modeling Prep (FMP)**: Fallback market data.

### Cloud Storage
- **Google Cloud Storage**: Document and asset storage.
- **Storacha (Web3 Storage)**: Decentralized storage for NFT metadata.

### Database & Infrastructure
- **PostgreSQL**: Primary database.
- **Neon Database**: Serverless PostgreSQL.
- **MongoDB**: Referral tracking and analytics.

### Development Tools
- **Hardhat**: Smart contract development.
- **OpenZeppelin Contracts**: Security-audited smart contract libraries.
- **Drizzle Kit**: Database migration and schema management.