# AXIOM: The Foundation of Sovereign Wealth

## Overview
AXIOM is a decentralized finance (DeFi) platform on BSC and Polygon, integrating token management, Proof of Contribution (PoC) staking, liquidity provision, NFT integration, and transparent governance. Its purpose is to establish a lawful digital economy where value is derived from participation and contribution, aiming to fuse ancient wisdom with modern cryptography to create a self-correcting network. 

**Real Estate Programs:**
- **KeyGrow Rent-to-Own**: Allocates 20% of platform revenue to help renters achieve homeownership through monthly allocations
- **Real Estate Investor**: Gas-efficient platform for fractional property investment with 5 earning mechanisms (rental income, appreciation, exit profits, low entry barrier, portfolio diversification)

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Core Infrastructure
The platform utilizes Node.js with Express.js for the backend, consolidating services into a unified server architecture. The frontend, built with React and TypeScript, serves static files and handles wallet/blockchain interactions.

### Blockchain Integration
AXIOM operates on BSC and Polygon Mainnets, with the AXM token deployed on both. Smart contracts include role-based ERC20 tokens, PoC staking engines, liquidity vaults, governance systems (Axiom Council with quadratic voting), and NFT contracts. The system supports dynamic APR adjustments and energy-based circulation mechanics. All smart contracts are security-enhanced with OpenZeppelin libraries.

### Frontend Architecture
The React/TypeScript frontend provides a comprehensive component library for wallet connectivity, navigation, and blockchain interactions, featuring a professional blue/white theme with sacred geometry elements. Key modules include unified wallet management and dedicated pages for staking, banking, investments, and NFT operations, plus educational content.

Smart Contract UI Pages (9 of 9 deployed contracts - COMPLETE):
- **AdvancedStaking** (0x5eE9d1b28c261AE132B6d324b02452bC90750136): NFT staking with tiered APR (10-30%)
- **EnhancedNFTMarketplace** (0xEc973eD81082a1d539F380eF94f6215793410036): NFT listings, bidding, sales with 2.5% fees
- **KeyGrow/RealEstateAcquisitionFund** (0xd070776c3603138a1d4b93a2f668d604a4a99e34): Rent-to-own enrollment and tier management
- **BasketIndex** (0x06b88f3Faa07215F6f5fb0A10A3F058D3f25ecF6): Diversified crypto portfolio token with mint/burn
- **DynamicAPRController** (0x14dFA6b6785643850e5c09336F7Cd5971458e28d): Real-time APR dashboard, simulator, deposit impact curve, adjustment history
- **LiquidityVault** (0xd070776c3603138a1d4b93a2f668d604a4a99e34): LP token staking vault with stake/unstake interface, rewards tracking, staking history, and **integrated PancakeSwap liquidity provision** for AXM/BNB and AXM/BUSD pairs with automatic quote calculation, token approvals, slippage protection, and seamless LP token staking workflow
- **GovernanceDividendPool** (0x63df9De7F74c15dE702De7D2fC7eB8205bfAC0B8): Governance token staking with dividend claims, rewards tracking, staking history, and APR display
- **SWFVaultAdapter** (0xeAFF0dB435DABB6f142A934e17123bfa752dbbd5): Unified vault interface for deposits, withdrawals, balance tracking, and yield analytics
- **AXIOMRevenueRouter** (0xd070776c3603138a1d4b93a2f668d604a4a99e34): Automated revenue distribution system showing 80/20 split between Treasury and KeyGrow Fund, revenue sources breakdown, distribution history, and transparent on-chain tracking

Each page includes comprehensive educational content, real-time blockchain data, transaction capabilities, and wallet integration.

### PancakeSwap DEX Integration
The LiquidityVault page now features a fully integrated "Provide Liquidity" component that connects directly to PancakeSwap V2 on BSC. Users can:
- Select trading pairs (SWF/BNB or SWF/BUSD)
- View real-time pool ratios and reserves
- Add liquidity with automatic quote calculation
- Approve tokens with one-click approval flow
- Configure slippage tolerance (0.1-5%) and transaction deadlines
- Track LP token balances
- Seamlessly transition from liquidity provision to LP token staking

**Active Liquidity Pools:**
- **SWF-WBNB V2 Pool**: `0x3aA970cD91f792427CF28Bc687B4713Ee26e2090` (Created via PancakeSwap V2 addLiquidityETH)

The backend caches PancakeSwap pair data for improved performance, and the frontend handles all wallet interactions using ethers.js v5 with proper error handling and security measures.

### Database Layer
PostgreSQL is the primary database, utilizing Drizzle ORM for schema management. User authentication includes bcrypt hashing, and session management is handled via `connect-pg-simple`. The banking infrastructure supports high-yield savings, CDs, checking accounts, inter-account transfers, and detailed transaction histories with atomic, decimal-safe, and idempotent operations.

### Investment Platform
The platform includes an investment management system for 8 product types (Crypto, Stocks, ETFs, Retirement, REITs, Bonds, Commodities, Index Funds, plus Options Trading). It features a multi-provider market data service (CoinGecko, Alpha Vantage, FMP) with caching and rate limiting, an investment transaction engine for various order types, position management, P&L calculations, and 0.1% transaction fees. All financial calculations use `Decimal.js` for precision and are wrapped in SQL transactions for ACID compliance.

### Smart Contract System & Tokenomics
The AXM token has a finite supply of 10 billion, representing verified energy and contribution, with distribution across Treasury & Liquidity (40%), Community Growth Fund (30%), Founders (15%), Adoption Incentives (10%), and Institutional Liquidity Reserve (5%). The ecosystem includes the AXM token, PoC staking engines (10-30% dynamic APR), AxiomBasketVault, DynamicAPRController, and the Axiom Council governance system. PoC staking rewards time and impact, contributing to a slow-deflationary curve through partial fee burns and "energy locks."

Smart contracts deployed include: BasketIndex, AdvancedStaking, EnhancedNFTMarketplace, DynamicAPRController, LiquidityVault, GovernanceDividendPool, SWFVaultAdapter, RealEstateAcquisitionFund, AXIOMRevenueRouter, VaultFactory, and LiquidityRewardsVault.

### Multi-Vault Liquidity Staking System
The platform features a VaultFactory system (deployed 2025-10-24) that enables deployment of isolated staking vaults for different LP token pairs. Each vault operates independently with configurable reward rates, lock periods, and minimum stakes.

**VaultFactory** (`0x45214E837caf29974b900Fcd5537Bc04E8809926`):
- Factory pattern for deploying unlimited LP staking vaults
- Vault registry and discovery system
- Default reward token: SWF (0x83E17aeB148d9b4b7Be0BE7C87dd73531a5a5738)

**Active Vaults:**
- **SWF-WBNB Vault** (`0xB67Ed87ef71b3db567d829736E9Aa714640FFd9f`): 7-day lock period, 0.1 LP minimum stake, verified on Sourcify

The LiquidityVaultPage provides a unified dashboard displaying all active vaults with vault selection grid, portfolio overview across all vaults, individual vault statistics, and seamless switching between different LP pairs.

### KeyGrow Rent-to-Own Program
20% of all platform revenue is allocated to a Real Estate Acquisition Fund through the AXIOMRevenueRouter (80% Treasury, 20% KeyGrow). This fund assists renters with down payments and property acquisition based on tiered allocations and time-weighted multipliers.

**Features (Deployed 2025-10-24):**
- Browse-first UX - View program details before wallet connection
- Fund Statistics Dashboard - Live balance, active renters, total distributions, monthly revenue
- Property Management - Add target properties, track down payment progress, compare rent vs mortgage
- Tier System - Bronze (1.0x), Silver (1.25x), Gold (1.5x), Platinum (2.0x) multipliers
- Monthly Allocation Claims - Transparent on-chain distributions
- Real-time Event Streaming - WebSocket notifications for registrations and claims
- Cross-Promotion with RE Investor - Integrated dashboard promoting dual income strategy

### Real Estate Investor Platform
Unified smart contract system enabling fractional real estate investment with minimal gas fees. Single contract manages multiple properties, investor portfolios, rental income distribution, and appreciation tracking.

**Contract: RealEstateInvestor.sol** (✅ DEPLOYED: 0x2BA77A06c41b14649597d162018ca98DE8851272)
- All-in-one gas-efficient design (no separate token deployments per property)
- Fractional ownership tracking with share-based accounting
- Property listing and funding management
- Automated rental income distribution with proportional calculations
- Real-time property value updates for appreciation tracking
- Portfolio analytics across multiple properties
- Platform fee: 2.5%, Minimum investment: 0.05 BNB (~$30)

**5 Earning Mechanisms:**
1. **Rental Income** - Monthly distributions from tenant payments, claimable anytime
2. **Property Appreciation** - Real-time tracking of value increases
3. **Investment Portfolio** - Multi-property diversification
4. **Exit Profits** - Share in proceeds when properties sell
5. **Low Barrier Entry** - Start with just 0.05 BNB ($30)

**Frontend Features:**
- Comprehensive investment dashboard with property browsing
- Portfolio tracking showing shares owned, current value, appreciation, pending rentals
- Individual and bulk rental income claiming
- Real-time property funding progress bars
- Platform statistics (total properties, investors, BNB invested, rental distributed)
- Educational content explaining earning mechanisms
- Cross-promotion on KeyGrow dashboard ("Double Your Income" strategy)

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