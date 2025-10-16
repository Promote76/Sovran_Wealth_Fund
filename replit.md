# Sovran Wealth Fund (SWF) - Complete DeFi Platform

## Overview

The Sovran Wealth Fund (SWF) is a comprehensive decentralized finance (DeFi) platform built on multiple blockchain networks, primarily BSC and Polygon. The platform combines token management, staking mechanisms, liquidity provision, NFT integration, and administrative tools to create a sovereign wealth management ecosystem for Indigenous communities. The system emphasizes self-determination and economic independence through advanced blockchain technology.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Core Infrastructure
The platform is built on Node.js with Express.js serving as the primary backend framework. The application uses a unified server architecture (`unified-platform.js`) that consolidates multiple services including authentication, token management, staking operations, and administrative functions. The frontend is served as static files with JavaScript modules handling wallet connectivity and blockchain interactions.

### Blockchain Integration
The system operates across multiple blockchain networks with the main SWF token deployed on both BSC Mainnet (`0x83E17aeB148d9b4b7Be0Be7C87dd73531a5a5738`) and Polygon Mainnet (`0x15AD65Fb62CD9147Aa4443dA89828A693228b5F7`). Smart contracts include role-based ERC20 tokens, staking engines (SoloMethodEngine), liquidity vaults, governance systems, and NFT contracts. The architecture supports dynamic APR adjustments based on vault deposits and implements a 16-wallet distribution system for token management.

### Frontend Architecture
The frontend uses React with TypeScript, featuring a comprehensive component library for wallet connectivity, navigation, and blockchain interactions. Key modules include unified wallet management via WalletContext, responsive navigation with mobile optimization, and specialized pages for staking, banking, investments, and NFT operations. The UI implements a professional blue/white theme with responsive design patterns.

#### User Guide System (October 2025)
The platform includes a comprehensive User Guide page (`/user-guide`) designed to help users earn an extra $500/month:
- **Navigation**: Prominently positioned second in main navigation (after Home)
- **Content Sections**: Getting Started, $500/Month Income Strategy, Banking Features, Investment Platform, Advanced Features
- **Income Breakdown**: Detailed strategies combining savings interest (4.25-6.25% APY), strategic investments (8-20% annual returns), and staking rewards (10-30% APR)
- **Interactive Elements**: Smooth scrolling navigation sidebar, clickable section links, direct routing to platform features
- **Educational Focus**: Step-by-step instructions, beginner-friendly explanations, portfolio recommendations, success stories
- **Mobile Responsive**: Fully optimized for desktop, tablet, and mobile viewing

### Database Layer
The system uses PostgreSQL as the primary database with Drizzle ORM for database operations. Database schemas are defined in `shared/schema.js` with configurations in `drizzle.config.ts`. Session management is handled through connect-pg-simple for PostgreSQL-backed sessions, and the system includes user authentication with bcrypt password hashing.

#### Banking Infrastructure (September 2025)
The platform now includes a comprehensive digital banking system with:
- **Savings Accounts**: High-Yield Savings Account (4.25% APY) and Certificate of Deposit (6.25% APY) with automatic interest accrual
- **Checking Accounts**: Full-featured checking accounts with ledger/available balance tracking, overdraft protection, and daily spending caps
- **Inter-Account Transfers**: Transfer system between checking and savings accounts with idempotency support and status tracking
- **Transaction History**: Complete audit trail for all deposits, withdrawals, and transfers across all account types
- **Database Tables**: 
  - `savings_accounts`, `savings_transactions`, `savings_account_settings` (existing)
  - `checking_accounts`, `checking_transactions`, `transfers`, `payees`, `scheduled_payments` (new)
- **Production-Ready Features** (September 30, 2025):
  - ✅ **Neon WebSocket Driver**: Full SQL transaction support with ACID guarantees
  - ✅ **Decimal.js Arithmetic**: Decimal-safe financial calculations eliminating floating-point errors
  - ✅ **Atomic Transactions**: All balance updates wrapped in SQL transactions (all succeed or all fail)
  - ✅ **Compare-and-Swap Updates**: Race condition prevention with conditional WHERE clauses
  - ✅ **Idempotency Keys**: Duplicate transfer prevention with unique transaction identifiers

#### Investment Platform Infrastructure (October 2025)
The platform now includes a comprehensive investment management system supporting 8 investment product types:

- **Investment Products Supported**:
  1. **Crypto Trading**: Bitcoin, Ethereum, and other cryptocurrencies via CoinGecko API
  2. **Stock Trading**: Individual stocks (AAPL, TSLA, etc.) via Alpha Vantage/FMP APIs
  3. **ETF Portfolios**: Exchange-traded funds with index/sector classification
  4. **Retirement Accounts**: IRA/401k support using stock market proxies
  5. **REITs**: Real estate investment trusts (VNQ, IYR, etc.) with dedicated type detection
  6. **Bonds**: Corporate and government bonds (TLT, AGG, etc.) with intelligent classification
  7. **Commodities**: Gold, silver, oil, etc. (GLD, SLV, USO) with symbol-based detection
  8. **Index Funds**: Market indexes (SPY, QQQ, DIA) with automatic type identification
  9. **Options Trading**: Options contracts using underlying stock quotes as proxy

- **Market Data Provider** (services/marketDataService.js):
  - ✅ **Multi-Provider Architecture**: CoinGecko (crypto), Alpha Vantage (stocks), FMP (fallback)
  - ✅ **Intelligent Type Detection**: Symbol-based classification for bonds, commodities, REITs, indexes
  - ✅ **Database Caching**: 5-minute TTL with automatic stale entry cleanup via market_quotes table
  - ✅ **Rate Limit Protection**: Per-provider throttling (CoinGecko: 30/min, Alpha Vantage: 5/min, FMP: 250/day)
  - ✅ **Decimal Precision**: Decimal.js for accurate financial calculations
  - ✅ **Real-time Quotes**: Live market data for all 8 investment product categories

- **Investment Database Tables**:
  - `investment_accounts`: Master account records with type, balance, and status tracking
  - `investment_transactions`: Buy/sell/dividend transactions with audit trail
  - `investment_holdings`: Current positions with cost basis and quantity
  - `investment_performance`: Historical performance metrics and returns
  - `market_quotes`: Real-time price data with provider tracking and caching

- **Investment Transaction Engine** (services/investmentService.js):
  - ✅ **Market Orders**: Instant execution at current market price for buy/sell operations
  - ✅ **Limit Orders**: Price-triggered orders with proper pending/filled workflow
    - Buy limits: Execute when market price ≤ limit price
    - Sell limits: Execute when market price ≥ limit price
    - Pending orders stored in database until conditions met
  - ✅ **Position Management**: Automatic cost basis tracking with FIFO/weighted average
  - ✅ **P&L Calculations**: Real-time realized and unrealized gains/losses
  - ✅ **Fee Handling**: 0.1% transaction fees on all trades
  - ✅ **SQL Transaction Safety**: All operations wrapped in database transactions (ACID compliance)
  - ✅ **Decimal Precision**: Decimal.js for accurate financial calculations
  - ✅ **Cash Balance Protection**: Insufficient funds validation before execution

- **API Endpoints**:
  - Investment Management: `/api/investments/*` (accounts, transactions, holdings, performance, analytics, reports)
  - Market Data: `/api/market/*` (quote, quotes batch, search, clear-cache)
  - Transaction Execution: `/api/investments/buy`, `/api/investments/sell` with market/limit order support

- **Investment Platform UI** (client/src/pages/InvestmentsPage.tsx):
  - ✅ **Comprehensive Overview Tab**: 8 asset classes with detailed descriptions, examples, and educational content
  - ✅ **Professional Trading Interface**: Real-time quotes, market/limit orders, estimated totals, popular assets sidebar
  - ✅ **Portfolio Dashboard**: Holdings table with P&L tracking, return percentages, portfolio summary metrics
  - ✅ **Transaction History**: Complete audit trail view with order details and execution data
  - ✅ **Educational Resources**: Investment basics, pro tips, fee transparency, safety features explained
  - ✅ **User-Friendly Design**: Step-by-step guidance, clear labels, visual feedback, responsive layout

### Smart Contract System
The smart contract ecosystem includes multiple interconnected contracts: the main SWF token with minting and burning capabilities, SoloMethodEngine for staking with dynamic APR (10-30%), SWFBasketVault for token deposits with 1:1 SWF-BASKET token minting, DynamicAPRController for automated reward adjustments, and governance systems with role-based permissions. Contracts support multiple liquidity pool integrations and automated reward distribution.

#### BSC Smart Contract Deployment Infrastructure (October 16, 2025)
The platform now includes comprehensive deployment infrastructure for 5 production-ready smart contracts:

- **Deployment-Ready Contracts** (contracts/ directory):
  1. **AdvancedStaking.sol** (484 lines): NFT staking with multi-tier rewards (10-50% APR), ERC721Holder for NFT reception, SafeERC20 for secure transfers
  2. **BasketIndex.sol** (177 lines): Weighted basket token for asset portfolios with SafeERC20 protection
  3. **CombinedStakingContracts.sol** (131 lines): Three-contract system (LiquidityVault, GovernanceDividendPool, SWFVaultAdapter) for LP/governance staking
  4. **DynamicAPRController.sol** (255 lines): Automated APR adjustment (10-30%) based on vault deposits
  5. **EnhancedNFTMarketplace.sol** (429 lines): NFT marketplace with batch auctions and 2.5% platform fees

- **Security Enhancements Applied**:
  - ✅ **ERC721Holder**: AdvancedStaking can now receive NFTs via safeTransferFrom (CRITICAL FIX)
  - ✅ **SafeERC20**: All ERC20 operations use safe wrappers preventing token transfer failures
  - ✅ **ReentrancyGuard**: All state-changing functions protected against reentrancy attacks
  - ✅ **Role-Based Access**: Admin functions restricted with AccessControl
  - ✅ **OpenZeppelin v5**: All contracts migrated to latest security-audited libraries

- **Deployment Tooling** (scripts/ directory):
  - `deploy-all-5-contracts.js`: Comprehensive deployment script with parameter validation and JSON export
  - `verify-all-5-contracts.js`: BSCScan verification automation for all deployed contracts
  - `DEPLOYMENT_SUMMARY.md`: Complete deployment guide with prerequisites, gas estimates, and post-deployment checklist

- **Hardhat Configuration** (hardhat.config.js):
  - ✅ **BSC Mainnet**: Configured with Alchemy RPC (https://bnb-mainnet.g.alchemy.com/v2/...)
  - ✅ **Deployer Wallet**: 0xEcDdb7dFF2f61E1caC7AC767337A38E1aD851eD6
  - ✅ **BSCScan API**: Ready for contract verification with API key integration
  - ✅ **Compilation**: Clean build confirmed (all artifacts generated Oct 16 23:15)

- **Deployment Status**: 
  - ⏳ READY - All contracts compiled and security-enhanced
  - ⏳ READY - Deployment scripts created and validated
  - ⏳ AWAITING USER - Required addresses (NFT contract, LP token, vault addresses)
  - ⏳ AWAITING USER - 0.05-0.1 BNB for deployment gas

## External Dependencies

### Blockchain Services
- **Binance Smart Chain**: Primary network for SWF token operations with PancakeSwap integration for liquidity pools
- **Polygon Mainnet**: Secondary deployment for expanded DeFi ecosystem access
- **MetaMask Integration**: Primary wallet connection through MetaMask SDK and delegation toolkit
- **Ethers.js**: Blockchain interaction library for smart contract communication

### Third-Party APIs
- **Alchemy API**: Blockchain RPC provider for reliable network connectivity
- **BSCScan/Polygonscan**: Contract verification and blockchain data APIs
- **SendGrid**: Email service integration for notifications and communications
- **Stripe**: Payment processing for fiat onramps and premium features
- **CoinGecko API**: Real-time cryptocurrency market data for crypto trading products
- **Alpha Vantage API**: Stock market data for equities, ETFs, and other securities
- **Financial Modeling Prep (FMP)**: Fallback market data provider for comprehensive coverage

### Cloud Storage
- **Google Cloud Storage**: Document and asset storage with IPFS integration
- **Storacha (Web3 Storage)**: Decentralized storage for NFT metadata and documents

### Database & Infrastructure
- **PostgreSQL**: Primary database for user data, session management, and application state
- **Neon Database**: Serverless PostgreSQL provider for scalable database operations
- **MongoDB**: Used in specific components for referral tracking and analytics

### Development Tools
- **Hardhat**: Smart contract development and deployment framework
- **OpenZeppelin Contracts**: Security-audited smart contract libraries for ERC20, access control, and governance
- **Drizzle Kit**: Database migration and schema management tools