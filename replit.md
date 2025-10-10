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
The frontend uses vanilla JavaScript with modular components for wallet connectivity, navigation, and blockchain interactions. Key modules include `unified-metamask-connector.js` for wallet management, navigation systems with mobile optimization, and specialized dashboards for staking, banking, and NFT operations. The UI implements a professional gold/black theme with responsive design patterns.

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

### Smart Contract System
The smart contract ecosystem includes multiple interconnected contracts: the main SWF token with minting and burning capabilities, SoloMethodEngine for staking with dynamic APR (10-30%), SWFBasketVault for token deposits with 1:1 SWF-BASKET token minting, DynamicAPRController for automated reward adjustments, and governance systems with role-based permissions. Contracts support multiple liquidity pool integrations and automated reward distribution.

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