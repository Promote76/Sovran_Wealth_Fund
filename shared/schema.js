const { pgTable, serial, text, boolean, timestamp, varchar, decimal, integer, jsonb, index } = require('drizzle-orm/pg-core');

// User table - match the exact column names in the database
const users = pgTable('users', {
  id: serial('id').primaryKey(),
  firstName: varchar('first_name', { length: 255 }),
  lastName: varchar('last_name', { length: 255 }),
  email: varchar('email', { length: 255 }).notNull().unique(),
  username: varchar('username', { length: 255 }).notNull().unique(),
  password: varchar('password', { length: 255 }).notNull(),
  role: varchar('role', { length: 50 }).default('user'),
  accountStatus: varchar('account_status', { length: 50 }).default('active'),
  emailVerified: boolean('email_verified').default(false),
  walletAddress: varchar('wallet_address', { length: 42 }),
  swfTokenBalance: decimal('swf_token_balance', { precision: 18, scale: 8 }).default('0'),
  loginCount: integer('login_count').default(0),
  lastLoginAt: timestamp('last_login_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow()
});

// Registration Journey table
const registrationJourney = pgTable('registration_journey', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull(),
  currentStep: varchar('current_step', { length: 50 }),
  completedSteps: jsonb('completed_steps'),
  hasPersonalProfile: boolean('has_personal_profile').default(false),
  hasFinancialProfile: boolean('has_financial_profile').default(false),
  hasRiskProfile: boolean('has_risk_profile').default(false),
  hasKycVerification: boolean('has_kyc_verification').default(false),
  isActive: boolean('is_active').default(true),
  isCompleted: boolean('is_completed').default(false),
  completedAt: timestamp('completed_at'),
  abandonedAt: timestamp('abandoned_at'),
  totalTimeSpent: integer('total_time_spent').default(0),
  stepTransitions: jsonb('step_transitions'),
  startedAt: timestamp('started_at').defaultNow(),
  lastActivityAt: timestamp('last_activity_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow()
});

// Unified Personal Profiles table
const unifiedPersonalProfiles = pgTable('unified_personal_profiles', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().unique(),
  firstName: varchar('first_name', { length: 255 }),
  lastName: varchar('last_name', { length: 255 }),
  email: varchar('email', { length: 255 }),
  phone: varchar('phone', { length: 20 }),
  dateOfBirth: timestamp('date_of_birth'),
  country: varchar('country', { length: 100 }),
  state: varchar('state', { length: 50 }),
  city: varchar('city', { length: 100 }),
  zipCode: varchar('zip_code', { length: 10 }),
  address: text('address'),
  employmentStatus: varchar('employment_status', { length: 50 }),
  employmentYears: integer('employment_years'),
  employer: varchar('employer', { length: 255 }),
  occupation: varchar('occupation', { length: 100 }),
  isComplete: boolean('is_complete').default(false),
  completedAt: timestamp('completed_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow()
});

// Unified Financial Profiles table
const unifiedFinancialProfiles = pgTable('unified_financial_profiles', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().unique(),
  annualIncome: decimal('annual_income', { precision: 15, scale: 2 }),
  monthlyIncome: decimal('monthly_income', { precision: 15, scale: 2 }),
  incomeSource: text('income_source'),
  totalNetWorth: decimal('total_net_worth', { precision: 15, scale: 2 }),
  liquidAssets: decimal('liquid_assets', { precision: 15, scale: 2 }),
  realEstateValue: decimal('real_estate_value', { precision: 15, scale: 2 }),
  investmentValue: decimal('investment_value', { precision: 15, scale: 2 }),
  totalDebt: decimal('total_debt', { precision: 15, scale: 2 }),
  monthlyDebt: decimal('monthly_debt', { precision: 15, scale: 2 }),
  monthlyExpenses: decimal('monthly_expenses', { precision: 15, scale: 2 }),
  emergencyFund: decimal('emergency_fund', { precision: 15, scale: 2 }),
  currentSavings: decimal('current_savings', { precision: 15, scale: 2 }),
  monthlySavings: decimal('monthly_savings', { precision: 15, scale: 2 }),
  creditScore: integer('credit_score'),
  hasBankruptcy: boolean('has_bankruptcy').default(false),
  hasForeclosure: boolean('has_foreclosure').default(false),
  isComplete: boolean('is_complete').default(false),
  completedAt: timestamp('completed_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow()
});

// Unified Risk Profiles table
const unifiedRiskProfiles = pgTable('unified_risk_profiles', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().unique(),
  riskTolerance: varchar('risk_tolerance', { length: 20 }),
  investmentExperience: varchar('investment_experience', { length: 20 }),
  investmentHorizon: varchar('investment_horizon', { length: 50 }),
  liquidityNeeds: varchar('liquidity_needs', { length: 50 }),
  investmentKnowledge: varchar('investment_knowledge', { length: 50 }),
  hasRealEstateExperience: boolean('has_real_estate_experience').default(false),
  hasCryptoExperience: boolean('has_crypto_experience').default(false),
  hasStockExperience: boolean('has_stock_experience').default(false),
  portfolioDiversification: varchar('portfolio_diversification', { length: 50 }),
  comfortWithVolatility: varchar('comfort_with_volatility', { length: 50 }),
  lossComfort: varchar('loss_comfort', { length: 50 }),
  isComplete: boolean('is_complete').default(false),
  completedAt: timestamp('completed_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow()
});

// KYC Verifications table
const kycVerifications = pgTable('kyc_verifications', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().unique(),
  firstName: varchar('first_name', { length: 255 }),
  lastName: varchar('last_name', { length: 255 }),
  dateOfBirth: timestamp('date_of_birth'),
  nationality: varchar('nationality', { length: 100 }),
  address: text('address'),
  phoneNumber: varchar('phone_number', { length: 20 }),
  verificationStatus: varchar('verification_status', { length: 20 }).default('pending'),
  submittedAt: timestamp('submitted_at'),
  reviewedAt: timestamp('reviewed_at'),
  reviewedBy: integer('reviewed_by'),
  rejectionReason: text('rejection_reason'),
  riskLevel: varchar('risk_level', { length: 20 }),
  riskScore: integer('risk_score'),
  riskFactors: jsonb('risk_factors'),
  additionalData: jsonb('additional_data'),
  internalNotes: text('internal_notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow()
});

// Program Enrollments table
const programEnrollments = pgTable('program_enrollments', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull(),
  programType: varchar('program_type', { length: 50 }).notNull(),
  status: varchar('status', { length: 20 }).default('pending'),
  statusUpdatedAt: timestamp('status_updated_at'),
  investorProfileId: integer('investor_profile_id'),
  keygrowProgressId: integer('keygrow_progress_id'),
  kycVerificationId: integer('kyc_verification_id'),
  registrationData: jsonb('registration_data'),
  requiresPayment: boolean('requires_payment').default(false),
  paymentAmount: decimal('payment_amount', { precision: 15, scale: 2 }),
  paymentCurrency: varchar('payment_currency', { length: 10 }),
  paymentCompleted: boolean('payment_completed').default(false),
  paymentCompletedAt: timestamp('payment_completed_at'),
  isEligible: boolean('is_eligible').default(true),
  eligibilityReason: text('eligibility_reason'),
  enrolledAt: timestamp('enrolled_at').defaultNow(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow()
});

// Savings Accounts table - matching actual database structure
const savingsAccounts = pgTable('savings_accounts', {
  id: serial('id').primaryKey(),
  accountNumber: varchar('account_number', { length: 20 }),
  userId: integer('user_id'),
  walletAddress: varchar('wallet_address', { length: 42 }).notNull(),
  type: text('type').notNull(),
  status: text('status').notNull(),
  apy: decimal('apy').notNull(),
  principal: decimal('principal'),
  balance: decimal('balance').notNull(),
  accruedInterest: decimal('accrued_interest').default('0').notNull(),
  termMonths: integer('term_months'),
  maturityDate: timestamp('maturity_date'),
  earlyWithdrawalPenaltyRate: decimal('early_withdrawal_penalty_rate'),
  lastAccruedAt: timestamp('last_accrued_at'),
  metadata: jsonb('metadata'),
  openedAt: timestamp('opened_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});

// Savings Transactions table - matching actual database structure
const savingsTransactions = pgTable('savings_transactions', {
  id: serial('id').primaryKey(),
  savingsAccountId: integer('savings_account_id').notNull(),
  txType: text('tx_type').notNull(),
  amount: decimal('amount').notNull(),
  balanceAfter: decimal('balance_after').notNull(),
  txHash: varchar('tx_hash', { length: 66 }),
  source: varchar('source', { length: 20 }),
  note: text('note'),
  createdAt: timestamp('created_at').defaultNow().notNull()
});

// Savings Account Settings table - matching actual database structure
const savingsAccountSettings = pgTable('savings_account_settings', {
  id: serial('id').primaryKey(),
  savingsAccountId: integer('savings_account_id').notNull().unique(),
  roundUpEnabled: boolean('round_up_enabled').default(false).notNull(),
  autoTransferEnabled: boolean('auto_transfer_enabled').default(false).notNull(),
  autoTransferAmount: decimal('auto_transfer_amount'),
  autoTransferDay: integer('auto_transfer_day'),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});

// Savings Goals table
const savingsGoals = pgTable('savings_goals', {
  id: serial('id').primaryKey(),
  userId: integer('user_id'),
  walletAddress: varchar('wallet_address', { length: 42 }).notNull(),
  goalName: varchar('goal_name', { length: 255 }).notNull(),
  targetAmount: decimal('target_amount', { precision: 15, scale: 2 }).notNull(),
  currentAmount: decimal('current_amount', { precision: 15, scale: 2 }).default('0.00').notNull(),
  targetDate: timestamp('target_date').notNull(),
  monthlyContribution: decimal('monthly_contribution', { precision: 15, scale: 2 }).default('0.00'),
  status: varchar('status', { length: 20 }).default('active').notNull(), // active, achieved, cancelled
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow()
});

// Checking Accounts table
const checkingAccounts = pgTable('checking_accounts', {
  id: serial('id').primaryKey(),
  userId: integer('user_id'),
  walletAddress: varchar('wallet_address', { length: 42 }).notNull(),
  accountNumber: varchar('account_number', { length: 20 }).notNull().unique(),
  routingNumber: varchar('routing_number', { length: 9 }).default('021000021'),
  status: varchar('status', { length: 20 }).default('active').notNull(),
  ledgerBalance: decimal('ledger_balance', { precision: 15, scale: 2 }).default('0.00').notNull(),
  availableBalance: decimal('available_balance', { precision: 15, scale: 2 }).default('0.00').notNull(),
  overdraftEnabled: boolean('overdraft_enabled').default(false).notNull(),
  overdraftLimit: decimal('overdraft_limit', { precision: 15, scale: 2 }).default('0.00'),
  dailySpendCap: decimal('daily_spend_cap', { precision: 15, scale: 2 }),
  limits: jsonb('limits'),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});

// Checking Transactions table
const checkingTransactions = pgTable('checking_transactions', {
  id: serial('id').primaryKey(),
  accountId: integer('account_id').notNull(),
  transactionType: varchar('transaction_type', { length: 30 }).notNull(),
  amount: decimal('amount', { precision: 15, scale: 2 }).notNull(),
  currency: varchar('currency', { length: 3 }).default('SWF'),
  description: text('description'),
  merchantName: varchar('merchant_name', { length: 255 }),
  mcc: varchar('mcc', { length: 4 }),
  referenceId: varchar('reference_id', { length: 100 }),
  status: varchar('status', { length: 20 }).default('posted').notNull(),
  balanceAfter: decimal('balance_after', { precision: 15, scale: 2 }).notNull(),
  initiatedBy: varchar('initiated_by', { length: 42 }),
  relatedTransferId: integer('related_transfer_id'),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  postedAt: timestamp('posted_at').defaultNow()
});

// Transfers table
const transfers = pgTable('transfers', {
  id: serial('id').primaryKey(),
  fromAccountType: varchar('from_account_type', { length: 20 }).notNull(),
  fromAccountId: integer('from_account_id').notNull(),
  toAccountType: varchar('to_account_type', { length: 20 }).notNull(),
  toAccountId: integer('to_account_id').notNull(),
  amount: decimal('amount', { precision: 15, scale: 2 }).notNull(),
  currency: varchar('currency', { length: 3 }).default('SWF'),
  status: varchar('status', { length: 20 }).default('pending').notNull(),
  idempotencyKey: varchar('idempotency_key', { length: 100 }).unique(),
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  settledAt: timestamp('settled_at')
});

// Payees table
const payees = pgTable('payees', {
  id: serial('id').primaryKey(),
  userId: integer('user_id'),
  walletAddress: varchar('wallet_address', { length: 42 }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  payeeType: varchar('payee_type', { length: 20 }).notNull(),
  achRouting: varchar('ach_routing', { length: 9 }),
  achAccount: varchar('ach_account', { length: 20 }),
  walletPayeeAddress: varchar('wallet_payee_address', { length: 42 }),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').defaultNow().notNull()
});

// Scheduled Payments table
const scheduledPayments = pgTable('scheduled_payments', {
  id: serial('id').primaryKey(),
  userId: integer('user_id'),
  walletAddress: varchar('wallet_address', { length: 42 }).notNull(),
  fromAccountType: varchar('from_account_type', { length: 20 }).notNull(),
  fromAccountId: integer('from_account_id').notNull(),
  toPayeeId: integer('to_payee_id'),
  amount: decimal('amount', { precision: 15, scale: 2 }).notNull(),
  currency: varchar('currency', { length: 3 }).default('SWF'),
  frequency: varchar('frequency', { length: 50 }).notNull(),
  nextRunAt: timestamp('next_run_at').notNull(),
  status: varchar('status', { length: 20 }).default('active').notNull(),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow()
});

// Investment Accounts table
const investmentAccounts = pgTable('investment_accounts', {
  id: serial('id').primaryKey(),
  userId: integer('user_id'),
  walletAddress: varchar('wallet_address', { length: 42 }).notNull(),
  accountName: varchar('account_name', { length: 100 }),
  accountType: varchar('account_type', { length: 20 }).notNull(), // crypto, etf, retirement, reit, bonds, commodities, index, options
  accountNumber: varchar('account_number', { length: 20 }).notNull().unique(),
  cashBalance: decimal('cash_balance', { precision: 20, scale: 8 }).default('0').notNull(),
  totalValue: decimal('total_value', { precision: 20, scale: 8 }).default('0').notNull(),
  baseCurrency: varchar('base_currency', { length: 10 }).default('USD'),
  status: varchar('status', { length: 20 }).default('active').notNull(),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow()
});

// Instruments table (stocks, bonds, cryptos, ETFs, etc.)
const instruments = pgTable('instruments', {
  id: serial('id').primaryKey(),
  symbol: varchar('symbol', { length: 20 }).notNull().unique(),
  name: text('name').notNull(),
  type: varchar('type', { length: 20 }).notNull(), // crypto, stock, etf, bond, commodity, index, option, reit
  exchange: varchar('exchange', { length: 50 }),
  tickSize: decimal('tick_size', { precision: 10, scale: 6 }),
  lotSize: decimal('lot_size', { precision: 10, scale: 2 }),
  quoteSource: varchar('quote_source', { length: 50 }), // binance, polygon, iex, etc
  isActive: boolean('is_active').default(true),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').defaultNow().notNull()
});

// Options Contracts metadata
const optionsContracts = pgTable('options_contracts', {
  id: serial('id').primaryKey(),
  instrumentId: integer('instrument_id').notNull(),
  underlyingId: integer('underlying_id').notNull(),
  expirationDate: timestamp('expiration_date').notNull(),
  strikePrice: decimal('strike_price', { precision: 15, scale: 2 }).notNull(),
  optionRight: varchar('option_right', { length: 4 }).notNull(), // CALL or PUT
  multiplier: integer('multiplier').default(100),
  style: varchar('style', { length: 10 }).default('american'),
  createdAt: timestamp('created_at').defaultNow().notNull()
});

// Bonds metadata
const bondsMetadata = pgTable('bonds_metadata', {
  id: serial('id').primaryKey(),
  instrumentId: integer('instrument_id').notNull().unique(),
  issuer: varchar('issuer', { length: 255 }).notNull(),
  couponRate: decimal('coupon_rate', { precision: 6, scale: 4 }),
  maturityDate: timestamp('maturity_date').notNull(),
  faceValue: decimal('face_value', { precision: 15, scale: 2 }),
  rating: varchar('rating', { length: 10 }),
  duration: decimal('duration', { precision: 10, scale: 4 }),
  convexity: decimal('convexity', { precision: 10, scale: 4 }),
  createdAt: timestamp('created_at').defaultNow().notNull()
});

// REITs metadata
const reitsMetadata = pgTable('reits_metadata', {
  id: serial('id').primaryKey(),
  instrumentId: integer('instrument_id').notNull().unique(),
  payoutFrequency: varchar('payout_frequency', { length: 20 }), // monthly, quarterly
  dripAvailable: boolean('drip_available').default(true),
  documents: jsonb('documents'),
  createdAt: timestamp('created_at').defaultNow().notNull()
});

// Positions table
const positions = pgTable('positions', {
  id: serial('id').primaryKey(),
  accountId: integer('account_id').notNull(),
  instrumentId: integer('instrument_id').notNull(),
  quantity: decimal('quantity', { precision: 20, scale: 8 }).notNull(),
  avgCost: decimal('avg_cost', { precision: 15, scale: 6 }),
  realizedPnl: decimal('realized_pnl', { precision: 15, scale: 2 }).default('0'),
  unrealizedPnl: decimal('unrealized_pnl', { precision: 15, scale: 2 }).default('0'),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});

// Orders table
const orders = pgTable('orders', {
  id: serial('id').primaryKey(),
  accountId: integer('account_id').notNull(),
  instrumentId: integer('instrument_id').notNull(),
  side: varchar('side', { length: 4 }).notNull(), // BUY or SELL
  orderType: varchar('order_type', { length: 20 }).notNull(), // MARKET, LIMIT, STOP
  quantity: decimal('quantity', { precision: 20, scale: 8 }).notNull(),
  limitPrice: decimal('limit_price', { precision: 15, scale: 6 }),
  stopPrice: decimal('stop_price', { precision: 15, scale: 6 }),
  tif: varchar('tif', { length: 10 }).default('GTC'), // GTC, DAY, IOC
  status: varchar('status', { length: 20 }).default('pending').notNull(), // pending, filled, partial, cancelled
  filledQty: decimal('filled_qty', { precision: 20, scale: 8 }).default('0'),
  avgFillPrice: decimal('avg_fill_price', { precision: 15, scale: 6 }),
  createdBy: varchar('created_by', { length: 42 }).notNull(),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow()
});

// Executions table
const executions = pgTable('executions', {
  id: serial('id').primaryKey(),
  orderId: integer('order_id').notNull(),
  fillQty: decimal('fill_qty', { precision: 20, scale: 8 }).notNull(),
  fillPrice: decimal('fill_price', { precision: 15, scale: 6 }).notNull(),
  fees: decimal('fees', { precision: 15, scale: 6 }).default('0'),
  venue: varchar('venue', { length: 50 }),
  txHash: varchar('tx_hash', { length: 66 }),
  timestamp: timestamp('timestamp').defaultNow().notNull()
});

// Ledger table (all account movements)
const investmentLedger = pgTable('investment_ledger', {
  id: serial('id').primaryKey(),
  accountId: integer('account_id').notNull(),
  type: varchar('type', { length: 30 }).notNull(), // CONTRIBUTION, WITHDRAWAL, DIVIDEND, INTEREST, REBALANCE, EXERCISE, ASSIGNMENT
  amount: decimal('amount', { precision: 15, scale: 2 }).notNull(),
  instrumentId: integer('instrument_id'),
  refId: varchar('ref_id', { length: 100 }),
  description: text('description'),
  timestamp: timestamp('timestamp').defaultNow().notNull()
});

// Dividends/Distributions table
const dividendsDistributions = pgTable('dividends_distributions', {
  id: serial('id').primaryKey(),
  instrumentId: integer('instrument_id').notNull(),
  amountPerShare: decimal('amount_per_share', { precision: 15, scale: 6 }).notNull(),
  exDate: timestamp('ex_date').notNull(),
  payDate: timestamp('pay_date').notNull(),
  status: varchar('status', { length: 20 }).default('scheduled'),
  createdAt: timestamp('created_at').defaultNow().notNull()
});

// Performance Snapshots table
const performanceSnapshots = pgTable('performance_snapshots', {
  id: serial('id').primaryKey(),
  accountId: integer('account_id').notNull(),
  snapshotDate: timestamp('snapshot_date').notNull(),
  nav: decimal('nav', { precision: 15, scale: 2 }).notNull(), // Net Asset Value
  contributions: decimal('contributions', { precision: 15, scale: 2 }).default('0'),
  withdrawals: decimal('withdrawals', { precision: 15, scale: 2 }).default('0'),
  returnAmount: decimal('return_amount', { precision: 15, scale: 2 }),
  returnPercent: decimal('return_percent', { precision: 8, scale: 4 }),
  volatility: decimal('volatility', { precision: 8, scale: 4 }),
  sharpeRatio: decimal('sharpe_ratio', { precision: 8, scale: 4 }),
  createdAt: timestamp('created_at').defaultNow().notNull()
});

// Market Data Snapshots table
const marketDataSnapshots = pgTable('market_data_snapshots', {
  id: serial('id').primaryKey(),
  instrumentId: integer('instrument_id').notNull(),
  timestamp: timestamp('timestamp').defaultNow().notNull(),
  bid: decimal('bid', { precision: 15, scale: 6 }),
  ask: decimal('ask', { precision: 15, scale: 6 }),
  last: decimal('last', { precision: 15, scale: 6 }),
  volume: decimal('volume', { precision: 20, scale: 2 }),
  openInterest: decimal('open_interest', { precision: 20, scale: 2 }),
  impliedVolatility: decimal('implied_volatility', { precision: 8, scale: 4 })
});

// Market Quotes Cache table (for real-time quote caching with TTL)
const marketQuotes = pgTable('market_quotes', {
  id: serial('id').primaryKey(),
  symbol: varchar('symbol', { length: 20 }).notNull().unique(),
  name: text('name'),
  type: varchar('type', { length: 20 }).notNull(), // crypto, stock, etf, bond, commodity, index, option, reit
  price: decimal('price', { precision: 20, scale: 8 }).notNull(),
  change: decimal('change', { precision: 15, scale: 8 }),
  changePercent: decimal('change_percent', { precision: 10, scale: 4 }),
  volume: decimal('volume', { precision: 20, scale: 2 }),
  marketCap: decimal('market_cap', { precision: 20, scale: 2 }),
  high24h: decimal('high_24h', { precision: 20, scale: 8 }),
  low24h: decimal('low_24h', { precision: 20, scale: 8 }),
  open: decimal('open', { precision: 20, scale: 8 }),
  previousClose: decimal('previous_close', { precision: 20, scale: 8 }),
  exchange: varchar('exchange', { length: 50 }),
  currency: varchar('currency', { length: 10 }).default('USD'),
  provider: varchar('provider', { length: 30 }), // coingecko, alphavantage, fmp
  rawData: jsonb('raw_data'),
  lastUpdated: timestamp('last_updated').defaultNow().notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull()
}, (table) => ({
  symbolIdx: index('idx_market_quotes_symbol').on(table.symbol),
  typeIdx: index('idx_market_quotes_type').on(table.type),
  lastUpdatedIdx: index('idx_market_quotes_last_updated').on(table.lastUpdated)
}));

// User Investment Settings table
const userInvestingSettings = pgTable('user_investing_settings', {
  id: serial('id').primaryKey(),
  accountId: integer('account_id').notNull().unique(),
  autoInvest: jsonb('auto_invest'),
  riskProfile: varchar('risk_profile', { length: 20 }), // conservative, moderate, aggressive
  taxLotMethod: varchar('tax_lot_method', { length: 20 }).default('FIFO'), // FIFO, LIFO, HIFO
  updatedAt: timestamp('updated_at').defaultNow()
});

// Admin Controls table
const adminControls = pgTable('admin_controls', {
  id: serial('id').primaryKey(),
  key: varchar('key', { length: 100 }).notNull().unique(),
  value: jsonb('value').notNull(),
  description: text('description'),
  updatedAt: timestamp('updated_at').defaultNow()
});

// Compliance Audit table
const complianceAudit = pgTable('compliance_audit', {
  id: serial('id').primaryKey(),
  userId: integer('user_id'),
  walletAddress: varchar('wallet_address', { length: 42 }),
  event: varchar('event', { length: 100 }).notNull(),
  ipAddress: varchar('ip_address', { length: 45 }),
  details: jsonb('details'),
  timestamp: timestamp('timestamp').defaultNow().notNull()
});

// DeNet Storage Files table (matching existing database structure)
const deNetFiles = pgTable('denet_files', {
  id: serial('id').primaryKey(),
  fileId: varchar('file_id', { length: 255 }),
  filename: varchar('filename', { length: 255 }),
  originalName: varchar('original_name', { length: 255 }),
  fileSize: integer('file_size'),
  mimeType: varchar('mime_type', { length: 255 }),
  uploadDate: timestamp('upload_date').defaultNow(),
  userAddress: varchar('user_address', { length: 42 }),
  fileHash: varchar('file_hash', { length: 100 }),
  storagePath: text('storage_path'),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

// DeNet Node State table
const deNetNodeState = pgTable('denet_node_state', {
  id: serial('id').primaryKey(),
  running: boolean('running').default(false).notNull(),
  startTime: timestamp('start_time'),
  storageUsed: decimal('storage_used', { precision: 10, scale: 2 }).default('0.00').notNull(),
  storageAvailable: decimal('storage_available', { precision: 10, scale: 2 }).default('200.00').notNull(),
  activeTransactions: integer('active_transactions').default(0).notNull(),
  totalEarnings: decimal('total_earnings', { precision: 15, scale: 2 }).default('0.00').notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});

// ============================================
// KEYGROW RENT-TO-OWN PROGRAM TABLES
// ============================================

// KeyGrow Renters table
const keygrowRenters = pgTable('keygrow_renters', {
  id: serial('id').primaryKey(),
  walletAddress: varchar('wallet_address', { length: 42 }).notNull().unique(),
  registeredAt: timestamp('registered_at').defaultNow().notNull(),
  tier: varchar('tier', { length: 20 }),
  totalAllocated: decimal('total_allocated', { precision: 18, scale: 8 }).default('0').notNull(),
  totalClaimed: decimal('total_claimed', { precision: 18, scale: 8 }).default('0').notNull(),
  active: boolean('active').default(true).notNull(),
  lastClaimPeriod: integer('last_claim_period').default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow()
});

// KeyGrow Allocations table
const keygrowAllocations = pgTable('keygrow_allocations', {
  id: serial('id').primaryKey(),
  renterId: integer('renter_id').notNull(),
  periodNumber: integer('period_number').notNull(),
  amount: decimal('amount', { precision: 18, scale: 8 }).notNull(),
  claimed: boolean('claimed').default(false).notNull(),
  claimedAt: timestamp('claimed_at'),
  txHash: varchar('tx_hash', { length: 66 }),
  createdAt: timestamp('created_at').defaultNow().notNull()
});

// KeyGrow Properties table
const keygrowProperties = pgTable('keygrow_properties', {
  id: serial('id').primaryKey(),
  renterId: integer('renter_id').notNull(),
  propertyAddress: text('property_address').notNull(),
  targetPrice: decimal('target_price', { precision: 15, scale: 2 }).notNull(),
  accumulatedFunds: decimal('accumulated_funds', { precision: 15, scale: 2 }).default('0').notNull(),
  status: varchar('status', { length: 20 }).default('pending').notNull(),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow()
});

// ============================================
// NFT MARKETPLACE TABLES
// ============================================

// NFT Listings table
const nftListings = pgTable('nft_listings', {
  id: serial('id').primaryKey(),
  contractAddress: varchar('contract_address', { length: 42 }).notNull(),
  tokenId: varchar('token_id', { length: 78 }).notNull(),
  seller: varchar('seller', { length: 42 }).notNull(),
  price: decimal('price', { precision: 18, scale: 8 }).notNull(),
  currency: varchar('currency', { length: 10 }).default('BNB').notNull(),
  listingType: varchar('listing_type', { length: 20 }).default('fixed').notNull(),
  status: varchar('status', { length: 20 }).default('active').notNull(),
  auctionEndTime: timestamp('auction_end_time'),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow()
});

// NFT Bids table
const nftBids = pgTable('nft_bids', {
  id: serial('id').primaryKey(),
  listingId: integer('listing_id').notNull(),
  bidder: varchar('bidder', { length: 42 }).notNull(),
  amount: decimal('amount', { precision: 18, scale: 8 }).notNull(),
  txHash: varchar('tx_hash', { length: 66 }),
  status: varchar('status', { length: 20 }).default('active').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull()
});

// NFT Sales table
const nftSales = pgTable('nft_sales', {
  id: serial('id').primaryKey(),
  listingId: integer('listing_id').notNull(),
  buyer: varchar('buyer', { length: 42 }).notNull(),
  seller: varchar('seller', { length: 42 }).notNull(),
  price: decimal('price', { precision: 18, scale: 8 }).notNull(),
  txHash: varchar('tx_hash', { length: 66 }),
  royaltyAmount: decimal('royalty_amount', { precision: 18, scale: 8 }),
  platformFee: decimal('platform_fee', { precision: 18, scale: 8 }),
  createdAt: timestamp('created_at').defaultNow().notNull()
});

// ============================================
// ADVANCED STAKING TABLES
// ============================================

// Advanced Stakes table
const advancedStakes = pgTable('advanced_stakes', {
  id: serial('id').primaryKey(),
  walletAddress: varchar('wallet_address', { length: 42 }).notNull(),
  nftTokenId: varchar('nft_token_id', { length: 78 }).notNull(),
  stakeAmount: decimal('stake_amount', { precision: 18, scale: 8 }).notNull(),
  tier: varchar('tier', { length: 20 }),
  rewardsEarned: decimal('rewards_earned', { precision: 18, scale: 8 }).default('0').notNull(),
  stakeStartedAt: timestamp('stake_started_at').defaultNow().notNull(),
  stakeEndedAt: timestamp('stake_ended_at'),
  txHash: varchar('tx_hash', { length: 66 }),
  status: varchar('status', { length: 20 }).default('active').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull()
});

// Staking Rewards table
const stakingRewards = pgTable('staking_rewards', {
  id: serial('id').primaryKey(),
  stakeId: integer('stake_id').notNull(),
  amount: decimal('amount', { precision: 18, scale: 8 }).notNull(),
  claimed: boolean('claimed').default(false).notNull(),
  claimedAt: timestamp('claimed_at'),
  txHash: varchar('tx_hash', { length: 66 }),
  createdAt: timestamp('created_at').defaultNow().notNull()
});

// ============================================
// REVENUE ROUTER TRACKING TABLES
// ============================================

// Revenue Distributions table
const revenueDistributions = pgTable('revenue_distributions', {
  id: serial('id').primaryKey(),
  source: varchar('source', { length: 50 }).notNull(),
  totalAmount: decimal('total_amount', { precision: 18, scale: 8 }).notNull(),
  treasuryAmount: decimal('treasury_amount', { precision: 18, scale: 8 }).notNull(),
  keygrowAmount: decimal('keygrow_amount', { precision: 18, scale: 8 }).notNull(),
  txHash: varchar('tx_hash', { length: 66 }),
  createdAt: timestamp('created_at').defaultNow().notNull()
});

// ============================================
// CONTRACT EVENTS TABLE (PHASE 6)
// ============================================

// Contract Events table - stores all blockchain events from smart contracts
const contractEvents = pgTable('contract_events', {
  id: serial('id').primaryKey(),
  contractName: varchar('contract_name', { length: 50 }).notNull(),
  eventName: varchar('event_name', { length: 100 }).notNull(),
  eventData: jsonb('event_data').notNull(),
  blockNumber: integer('block_number').notNull(),
  transactionHash: varchar('transaction_hash', { length: 66 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull()
}, (table) => ({
  contractNameIdx: index('contract_events_contract_name_idx').on(table.contractName),
  eventNameIdx: index('contract_events_event_name_idx').on(table.eventName),
  txHashIdx: index('contract_events_tx_hash_idx').on(table.transactionHash),
  blockNumberIdx: index('contract_events_block_number_idx').on(table.blockNumber)
}));

module.exports = {
  users,
  registrationJourney,
  unifiedPersonalProfiles,
  unifiedFinancialProfiles,
  unifiedRiskProfiles,
  kycVerifications,
  programEnrollments,
  savingsAccounts,
  savingsTransactions,
  savingsAccountSettings,
  savingsGoals,
  checkingAccounts,
  checkingTransactions,
  transfers,
  payees,
  scheduledPayments,
  investmentAccounts,
  instruments,
  optionsContracts,
  bondsMetadata,
  reitsMetadata,
  positions,
  orders,
  executions,
  investmentLedger,
  dividendsDistributions,
  performanceSnapshots,
  marketDataSnapshots,
  marketQuotes,
  userInvestingSettings,
  adminControls,
  complianceAudit,
  deNetFiles,
  deNetNodeState,
  // KeyGrow tables
  keygrowRenters,
  keygrowAllocations,
  keygrowProperties,
  // NFT Marketplace tables
  nftListings,
  nftBids,
  nftSales,
  // Advanced Staking tables
  advancedStakes,
  stakingRewards,
  // Revenue Router tables
  revenueDistributions,
  // Contract Events
  contractEvents
};
