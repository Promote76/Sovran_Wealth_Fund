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

#### Deployed Smart Contracts (BSC Mainnet)
**Deployment Date**: October 23, 2025  
**Deployer Wallet**: 0xE3059F3479AAC2846299664BABe1d5D95C18D1C7  
**Network**: BSC Mainnet (Chain ID 56)  
**Total Contracts Deployed**: 9 contracts

**Core Contracts:**
- **BasketIndex**: 0x06b88f3Faa07215F6f5fb0A10A3F058D3f25ecF6
  - AXIOM Basket Index token for diversified DeFi exposure
  - Symbol: AXM-BASKET
  
- **AdvancedStaking**: 0x5eE9d1b28c261AE132B6d324b02452bC90750136
  - Multi-tier NFT staking with governance integration
  - Daily Reward Rate: 100 AXM
  - Reward Token: AXM (0x83E17aeB148d9b4b7Be0Be7C87dd73531a5a5738)
  
- **EnhancedNFTMarketplace**: 0xEc973eD81082a1d539F380eF94f6215793410036
  - NFT marketplace with auctions, royalties, and batch operations
  - Verified on Sourcify
  
- **DynamicAPRController**: 0x14dFA6b6785643850e5c09336F7Cd5971458e28d
  - Automatic APR adjustment system (10-30% dynamic range)
  - Current APR: 15%
  - Connected to BasketIndex vault and existing staking engine

**CombinedStaking Contracts:**
- **LiquidityVault**: 0xd070776c3603138a1d4b93a2f668d604a4a99e34
  - LP token staking vault for AXM liquidity providers
  
- **GovernanceDividendPool**: 0x63df9De7F74c15dE702De7D2fC7eB8205bfAC0B8
  - AXM token staking with BNB rewards (0.01 BNB per 30 days)
  
- **SWFVaultAdapter**: 0xeAFF0dB435DABB6f142A934e17123bfa752dbbd5
  - Vault integration adapter for seamless token deposits

**KeyGrow Rent-to-Own Contracts:**
- **RealEstateAcquisitionFund**: 0xe097881D32D67ED1Dd9df8203F188CD186f345dc
  - Manages 20% of platform revenue for homeownership assistance
  - Tier-based renter allocations (Bronze/Silver/Gold/Platinum)
  - Time-weighted multipliers (1.0x - 2.0x)
  - Monthly distribution periods
  
- **AXIOMRevenueRouter**: 0xfFFb71e13c6cd5ce12612D1c7293BF0BAbcdab73
  - Auto-splits all platform revenue: 80% Treasury, 20% KeyGrow
  - Tracks revenue by source (NFT, Staking, Banking, Investments)
  - Supports BNB and ERC20 tokens

**Original Contracts:**
- **AXM Token**: 0x83E17aeB148d9b4b7Be0Be7C87dd73531a5a5738
- **Staking Engine**: 0x0165878A594ca255338adfa4d48449f69242Eb8F
- **Basket Vault**: 0x5FC8d32690cc91D4c39d9d3abcBD16989F875707

### KeyGrow Rent-to-Own Program
AXIOM includes the KeyGrow initiative, where **20% of all platform revenue** (including transaction fees, staking fees, and NFT marketplace fees) is allocated to a Real Estate Acquisition Fund. This fund helps renters transition to homeownership by providing down payment assistance and property acquisition support. Full specification available in `docs/KeyGrow_RentToOwn_Specification.md`.

### Contract Integration Status
**Phase 1: Foundation (COMPLETE - October 23, 2025)**
- ✅ ABIs extracted for all 9 deployed contracts
- ✅ ContractProvider service created (singleton pattern, retry logic, ethers.js v6)
- ✅ Database schema extended with 9 new tables:
  - KeyGrow: keygrow_renters, keygrow_allocations, keygrow_properties
  - NFT Marketplace: nft_listings, nft_bids, nft_sales
  - Advanced Staking: advanced_stakes, staking_rewards
  - Revenue: revenue_distributions
- ✅ API routers mounted at:
  - `/api/keygrow` - KeyGrow rent-to-own endpoints
  - `/api/nft-marketplace` - NFT marketplace endpoints
  - `/api/advanced-staking` - Advanced staking endpoints
  - `/api/revenue-router` - Revenue tracking endpoints
- ✅ All endpoints tested and operational
- ✅ Existing platform features verified intact

**Phase 2: Contract Read Operations (COMPLETE - October 23, 2025)**
- ✅ KeyGrowService: getRenterInfo, getPendingAllocations, getFundStats using real contract methods
- ✅ NFTMarketplaceService: getMarketplaceStats, getListingDetails with on-chain listings/auctions count
- ✅ AdvancedStakingService: getUserStakes, getPendingRewards, getStakingStats (100 AXM daily rewards)
- ✅ RevenueRouterService: getRouterStats (80/20 treasury/KeyGrow split), getDistributionHistory
- ✅ All 4 contract services integrated with BSC Mainnet and returning live blockchain data
- ✅ Error handling with graceful degradation for all contract calls
- ✅ Bug fixes: BigInt TypeError in rewards calculation, undefined stake count in API response
- ✅ 17+ API endpoints tested and verified working with real contract data

**Phase 3: Contract Write Operations (COMPLETE - October 23, 2025)**
- ✅ Transaction building infrastructure: ContractProvider.buildTransactionData using ethers.js v6 Interface.encodeFunctionData
- ✅ All write endpoints return unsigned transaction data {to, data, value, chainId} for frontend wallet signing
- ✅ KeyGrow write operations: registerAsRenter, claimAllocation, updateTier
- ✅ NFT Marketplace write operations: listItem, placeBid, buyItem, cancelListing
- ✅ Advanced Staking write operations: stakeNFT, unstakeNFT, claimRewards
- ✅ Database confirmation endpoints: POST /confirm-* routes for recording confirmed transactions
- ✅ ABI method verification: All contract calls use correct method names and parameter counts
- ✅ All 3 critical write flows tested and verified: registerAsRenter (0 params), stakeNFT (tokenId + tier), listItem (NFT params)
- ✅ Architect review passed: No blocking defects, transaction-ready for production use

**Next Phase**: Frontend wallet integration, automated testing, event listeners for real-time updates

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