"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reportMonths = exports.learningAnalytics = exports.certificates = exports.learningStreaks = exports.userAchievements = exports.achievementDefinitions = exports.userLearningPaths = exports.learningPaths = exports.courseProgress = exports.quizAttempts = exports.quizQuestions = exports.enhancedLessons = exports.courseModules = exports.courses = exports.courseCategories = exports.badges = exports.lessonProgress = exports.lessons = exports.circleContributions = exports.circleMemberships = exports.circles = exports.contributionPlans = exports.contributionPlanStatusEnum = exports.kycAuditLogs = exports.kycVerificationSteps = exports.kycDocuments = exports.kycVerifications = exports.kycStepStatusEnum = exports.kycStepEnum = exports.kycDocumentStatusEnum = exports.kycDocumentTypeEnum = exports.kycTierEnum = exports.kycRiskLevelEnum = exports.kycStatusEnum = exports.platformSettings = exports.adminLogs = exports.userNotifications = exports.userInvestmentPreferences = exports.userGoals = exports.userOnboarding = exports.userTransactions = exports.userWallets = exports.userSessions = exports.users = exports.sessions = exports.savingsTransactionTypeEnum = exports.savingsAccountStatusEnum = exports.savingsAccountTypeEnum = exports.accountStatusEnum = exports.userRoleEnum = void 0;
exports.registrationJourney = exports.unifiedPaymentIntents = exports.programEnrollments = exports.unifiedRiskProfiles = exports.unifiedFinancialProfiles = exports.unifiedPersonalProfiles = exports.paymentStatusEnum = exports.enrollmentStatusEnum = exports.programTypeEnum = exports.rentalDistributions = exports.shareAllocations = exports.investmentOrders = exports.paymentMethodEnum = exports.investmentOrderStatusEnum = exports.investorPreferences = exports.investorRiskAssessments = exports.investorFinancialProfiles = exports.investorProfiles = exports.riskToleranceEnum = exports.investmentExperienceEnum = exports.investorStatusEnum = exports.propertySubmissions = exports.propertySubmissionStatusEnum = exports.savingsAccountSettings = exports.savingsTransactions = exports.savingsAccounts = exports.storageUploads = exports.storageAnalytics = exports.storageNodes = exports.storageFiles = exports.fileTypeEnum = exports.storageNodeStatusEnum = exports.storageFileStatusEnum = exports.walletAuthAttempts = exports.walletAuthNonces = exports.prequalificationCache = exports.propertyViewing = exports.propertyWatchlist = exports.properties = exports.keygrowProgress = exports.propertyTypeEnum = exports.propertyStatusEnum = exports.keygrowStepEnum = exports.keygrowStatusEnum = exports.pollResponses = void 0;
const pg_core_1 = require("drizzle-orm/pg-core");
// User roles enum
exports.userRoleEnum = (0, pg_core_1.pgEnum)('user_role', [
    'user',
    'premium',
    'admin',
    'super_admin',
    'moderator'
]);
// Account status enum
exports.accountStatusEnum = (0, pg_core_1.pgEnum)('account_status', [
    'active',
    'suspended',
    'pending_verification',
    'deactivated'
]);
// Savings account enums
exports.savingsAccountTypeEnum = (0, pg_core_1.pgEnum)('savings_account_type', [
    'hysa',
    'cd'
]);
exports.savingsAccountStatusEnum = (0, pg_core_1.pgEnum)('savings_account_status', [
    'open',
    'locked',
    'matured',
    'closed'
]);
exports.savingsTransactionTypeEnum = (0, pg_core_1.pgEnum)('savings_transaction_type', [
    'deposit',
    'withdrawal',
    'interest',
    'penalty',
    'adjustment'
]);
// Session storage table for authentication
exports.sessions = (0, pg_core_1.pgTable)("sessions", {
    sid: (0, pg_core_1.varchar)("sid").primaryKey(),
    sess: (0, pg_core_1.jsonb)("sess").notNull(),
    expire: (0, pg_core_1.timestamp)("expire").notNull(),
}, (table) => ({
    expireIdx: (0, pg_core_1.index)("IDX_session_expire").on(table.expire),
}));
// Core users table with comprehensive profile management
exports.users = (0, pg_core_1.pgTable)("users", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    email: (0, pg_core_1.varchar)("email").unique().notNull(),
    username: (0, pg_core_1.varchar)("username", { length: 50 }).unique(),
    password: (0, pg_core_1.varchar)("password"), // Hashed password for traditional login
    firstName: (0, pg_core_1.varchar)("first_name", { length: 100 }),
    lastName: (0, pg_core_1.varchar)("last_name", { length: 100 }),
    profileImageUrl: (0, pg_core_1.varchar)("profile_image_url"),
    // Wallet and blockchain data
    walletAddress: (0, pg_core_1.varchar)("wallet_address", { length: 42 }),
    swfTokenBalance: (0, pg_core_1.decimal)("swf_token_balance", { precision: 18, scale: 8 }).default('0'),
    totalStaked: (0, pg_core_1.decimal)("total_staked", { precision: 18, scale: 8 }).default('0'),
    // Account management
    role: (0, exports.userRoleEnum)("role").default('user'),
    accountStatus: (0, exports.accountStatusEnum)("account_status").default('active'),
    emailVerified: (0, pg_core_1.boolean)("email_verified").default(false),
    twoFactorEnabled: (0, pg_core_1.boolean)("two_factor_enabled").default(false),
    // Profile and preferences
    bio: (0, pg_core_1.text)("bio"),
    location: (0, pg_core_1.varchar)("location", { length: 100 }),
    website: (0, pg_core_1.varchar)("website"),
    socialLinks: (0, pg_core_1.jsonb)("social_links"), // Twitter, LinkedIn, etc.
    // Platform engagement
    lastLoginAt: (0, pg_core_1.timestamp)("last_login_at"),
    loginCount: (0, pg_core_1.integer)("login_count").default(0),
    premiumExpiresAt: (0, pg_core_1.timestamp)("premium_expires_at"),
    // Timestamps
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)("updated_at").defaultNow(),
});
// User sessions for tracking multiple device logins
exports.userSessions = (0, pg_core_1.pgTable)("user_sessions", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    userId: (0, pg_core_1.integer)("user_id").references(() => exports.users.id).notNull(),
    sessionToken: (0, pg_core_1.varchar)("session_token").unique().notNull(),
    deviceInfo: (0, pg_core_1.text)("device_info"),
    ipAddress: (0, pg_core_1.varchar)("ip_address", { length: 45 }),
    location: (0, pg_core_1.varchar)("location"),
    isActive: (0, pg_core_1.boolean)("is_active").default(true),
    expiresAt: (0, pg_core_1.timestamp)("expires_at").notNull(),
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow(),
});
// User wallet connections and transaction history
exports.userWallets = (0, pg_core_1.pgTable)("user_wallets", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    userId: (0, pg_core_1.integer)("user_id").references(() => exports.users.id).notNull(),
    walletAddress: (0, pg_core_1.varchar)("wallet_address", { length: 42 }).notNull(),
    walletType: (0, pg_core_1.varchar)("wallet_type", { length: 50 }), // MetaMask, WalletConnect, etc.
    isDefault: (0, pg_core_1.boolean)("is_default").default(false),
    lastConnectedAt: (0, pg_core_1.timestamp)("last_connected_at").defaultNow(),
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow(),
});
// User transactions and activity log
exports.userTransactions = (0, pg_core_1.pgTable)("user_transactions", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    userId: (0, pg_core_1.integer)("user_id").references(() => exports.users.id).notNull(),
    transactionHash: (0, pg_core_1.varchar)("transaction_hash", { length: 66 }),
    transactionType: (0, pg_core_1.varchar)("transaction_type", { length: 50 }), // stake, unstake, transfer, etc.
    amount: (0, pg_core_1.decimal)("amount", { precision: 18, scale: 8 }),
    tokenSymbol: (0, pg_core_1.varchar)("token_symbol", { length: 10 }),
    status: (0, pg_core_1.varchar)("status", { length: 20 }), // pending, confirmed, failed
    blockNumber: (0, pg_core_1.integer)("block_number"),
    gasUsed: (0, pg_core_1.integer)("gas_used"),
    gasPrice: (0, pg_core_1.decimal)("gas_price", { precision: 18, scale: 0 }),
    metadata: (0, pg_core_1.jsonb)("metadata"), // Additional transaction details
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow(),
});
// User onboarding data and progress tracking
exports.userOnboarding = (0, pg_core_1.pgTable)("user_onboarding", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    userId: (0, pg_core_1.integer)("user_id").references(() => exports.users.id).notNull(),
    onboardingData: (0, pg_core_1.jsonb)("onboarding_data"), // Complete onboarding form data
    currentStep: (0, pg_core_1.integer)("current_step").default(1),
    completedSteps: (0, pg_core_1.jsonb)("completed_steps"), // Array of completed step IDs
    selectedPath: (0, pg_core_1.varchar)("selected_path", { length: 50 }), // beginner, investment, property, etc.
    selectedGoal: (0, pg_core_1.jsonb)("selected_goal"), // Goal details
    monthlyContribution: (0, pg_core_1.decimal)("monthly_contribution", { precision: 10, scale: 2 }),
    isCompleted: (0, pg_core_1.boolean)("is_completed").default(false),
    completedAt: (0, pg_core_1.timestamp)("completed_at"),
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)("updated_at").defaultNow(),
});
// User financial goals from onboarding and goal setting
exports.userGoals = (0, pg_core_1.pgTable)("user_goals", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    userId: (0, pg_core_1.integer)("user_id").references(() => exports.users.id).notNull(),
    category: (0, pg_core_1.varchar)("category", { length: 50 }), // retirement, education, home, etc.
    title: (0, pg_core_1.varchar)("title", { length: 200 }).notNull(),
    description: (0, pg_core_1.text)("description"),
    targetAmount: (0, pg_core_1.decimal)("target_amount", { precision: 15, scale: 2 }).notNull(),
    currentAmount: (0, pg_core_1.decimal)("current_amount", { precision: 15, scale: 2 }).default('0'),
    targetDate: (0, pg_core_1.timestamp)("target_date"),
    priority: (0, pg_core_1.varchar)("priority", { length: 20 }), // high, medium, low
    timeHorizon: (0, pg_core_1.integer)("time_horizon"), // years
    importance: (0, pg_core_1.integer)("importance"), // 1-10 scale
    monthlyContribution: (0, pg_core_1.decimal)("monthly_contribution", { precision: 10, scale: 2 }),
    isActive: (0, pg_core_1.boolean)("is_active").default(true),
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)("updated_at").defaultNow(),
});
// User investment preferences from advanced onboarding
exports.userInvestmentPreferences = (0, pg_core_1.pgTable)("user_investment_preferences", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    userId: (0, pg_core_1.integer)("user_id").references(() => exports.users.id).notNull(),
    riskTolerance: (0, pg_core_1.varchar)("risk_tolerance", { length: 50 }), // conservative, moderate, aggressive
    investmentExperience: (0, pg_core_1.varchar)("investment_experience", { length: 50 }),
    assetClassPreferences: (0, pg_core_1.jsonb)("asset_class_preferences"),
    geographicPreferences: (0, pg_core_1.jsonb)("geographic_preferences"),
    esgPreferences: (0, pg_core_1.jsonb)("esg_preferences"),
    managementPreferences: (0, pg_core_1.jsonb)("management_preferences"),
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)("updated_at").defaultNow(),
});
// User notifications system
exports.userNotifications = (0, pg_core_1.pgTable)("user_notifications", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    userId: (0, pg_core_1.integer)("user_id").references(() => exports.users.id).notNull(),
    title: (0, pg_core_1.varchar)("title", { length: 200 }).notNull(),
    message: (0, pg_core_1.text)("message").notNull(),
    type: (0, pg_core_1.varchar)("type", { length: 50 }), // info, warning, success, error
    isRead: (0, pg_core_1.boolean)("is_read").default(false),
    actionUrl: (0, pg_core_1.varchar)("action_url"),
    expiresAt: (0, pg_core_1.timestamp)("expires_at"),
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow(),
});
// Admin activity logs
exports.adminLogs = (0, pg_core_1.pgTable)("admin_logs", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    adminId: (0, pg_core_1.integer)("admin_id").references(() => exports.users.id).notNull(),
    action: (0, pg_core_1.varchar)("action", { length: 100 }).notNull(),
    targetType: (0, pg_core_1.varchar)("target_type", { length: 50 }), // user, transaction, system
    targetId: (0, pg_core_1.varchar)("target_id"),
    details: (0, pg_core_1.jsonb)("details"),
    ipAddress: (0, pg_core_1.varchar)("ip_address", { length: 45 }),
    userAgent: (0, pg_core_1.text)("user_agent"),
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow(),
});
// Platform settings and configuration
exports.platformSettings = (0, pg_core_1.pgTable)("platform_settings", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    key: (0, pg_core_1.varchar)("key", { length: 100 }).unique().notNull(),
    value: (0, pg_core_1.text)("value"),
    type: (0, pg_core_1.varchar)("type", { length: 20 }), // string, number, boolean, json
    description: (0, pg_core_1.text)("description"),
    isPublic: (0, pg_core_1.boolean)("is_public").default(false),
    updatedBy: (0, pg_core_1.integer)("updated_by").references(() => exports.users.id),
    updatedAt: (0, pg_core_1.timestamp)("updated_at").defaultNow(),
});
// ==== KYC (KNOW YOUR CUSTOMER) COMPLIANCE SYSTEM ====
// KYC verification status enum
exports.kycStatusEnum = (0, pg_core_1.pgEnum)('kyc_status', [
    'pending',
    'under_review',
    'approved',
    'rejected'
]);
// KYC risk level enum
exports.kycRiskLevelEnum = (0, pg_core_1.pgEnum)('kyc_risk_level', [
    'low',
    'medium',
    'high'
]);
// KYC tier level enum - Light KYC vs Full KYC
exports.kycTierEnum = (0, pg_core_1.pgEnum)('kyc_tier', [
    'light', // Basic verification - name, email, phone
    'full' // Full verification - SSN, ID documents, proof of address
]);
// KYC document type enum
exports.kycDocumentTypeEnum = (0, pg_core_1.pgEnum)('kyc_document_type', [
    'identity_front',
    'identity_back',
    'proof_of_address',
    'selfie_verification',
    'ssn_document'
]);
// KYC document verification status enum
exports.kycDocumentStatusEnum = (0, pg_core_1.pgEnum)('kyc_document_status', [
    'pending',
    'approved',
    'rejected'
]);
// KYC verification step enum
exports.kycStepEnum = (0, pg_core_1.pgEnum)('kyc_step', [
    'personal_info',
    'document_upload',
    'review_submission'
]);
// KYC step status enum
exports.kycStepStatusEnum = (0, pg_core_1.pgEnum)('kyc_step_status', [
    'not_started',
    'in_progress',
    'completed'
]);
// Main KYC verifications table
exports.kycVerifications = (0, pg_core_1.pgTable)("kyc_verifications", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    userId: (0, pg_core_1.integer)("user_id").references(() => exports.users.id).notNull(),
    // KYC Tier Level
    kycTier: (0, exports.kycTierEnum)("kyc_tier").default('light').notNull(),
    // Personal Information
    firstName: (0, pg_core_1.varchar)("first_name", { length: 100 }).notNull(),
    lastName: (0, pg_core_1.varchar)("last_name", { length: 100 }).notNull(),
    dateOfBirth: (0, pg_core_1.timestamp)("date_of_birth").notNull(),
    nationality: (0, pg_core_1.varchar)("nationality", { length: 100 }).notNull(),
    address: (0, pg_core_1.text)("address").notNull(),
    phoneNumber: (0, pg_core_1.varchar)("phone_number", { length: 20 }).notNull(),
    // Full KYC Only - SSN/Tax ID (encrypted)
    ssnLast4: (0, pg_core_1.varchar)("ssn_last_4", { length: 4 }), // Last 4 digits for display
    ssnHash: (0, pg_core_1.varchar)("ssn_hash", { length: 128 }), // Hashed full SSN for verification
    governmentIdNumber: (0, pg_core_1.varchar)("government_id_number"), // Encrypted ID number
    // Verification Status and Workflow
    verificationStatus: (0, exports.kycStatusEnum)("verification_status").default('pending'),
    submittedAt: (0, pg_core_1.timestamp)("submitted_at"),
    reviewedAt: (0, pg_core_1.timestamp)("reviewed_at"),
    reviewedBy: (0, pg_core_1.integer)("reviewed_by").references(() => exports.users.id), // Admin who reviewed
    rejectionReason: (0, pg_core_1.text)("rejection_reason"),
    // Risk Assessment
    riskLevel: (0, exports.kycRiskLevelEnum)("risk_level"),
    complianceNotes: (0, pg_core_1.text)("compliance_notes"),
    // Additional verification data
    ipAddress: (0, pg_core_1.varchar)("ip_address", { length: 45 }),
    userAgent: (0, pg_core_1.text)("user_agent"),
    deviceFingerprint: (0, pg_core_1.varchar)("device_fingerprint", { length: 100 }),
    // Compliance tracking
    lastUpdatedBy: (0, pg_core_1.integer)("last_updated_by").references(() => exports.users.id),
    expiresAt: (0, pg_core_1.timestamp)("expires_at"), // KYC verification expiry
    // Timestamps
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)("updated_at").defaultNow(),
}, (table) => ({
    // Indexes for efficient queries
    userIdIdx: (0, pg_core_1.index)("kyc_verifications_user_id_idx").on(table.userId),
    statusIdx: (0, pg_core_1.index)("kyc_verifications_status_idx").on(table.verificationStatus),
    reviewedByIdx: (0, pg_core_1.index)("kyc_verifications_reviewed_by_idx").on(table.reviewedBy),
    submittedAtIdx: (0, pg_core_1.index)("kyc_verifications_submitted_at_idx").on(table.submittedAt),
}));
// KYC documents table for file uploads
exports.kycDocuments = (0, pg_core_1.pgTable)("kyc_documents", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    kycId: (0, pg_core_1.integer)("kyc_id").references(() => exports.kycVerifications.id).notNull(),
    // Document Information
    documentType: (0, exports.kycDocumentTypeEnum)("document_type").notNull(),
    fileName: (0, pg_core_1.varchar)("file_name", { length: 255 }).notNull(),
    fileUrl: (0, pg_core_1.varchar)("file_url", { length: 500 }).notNull(),
    fileSize: (0, pg_core_1.integer)("file_size"), // Size in bytes
    fileMimeType: (0, pg_core_1.varchar)("file_mime_type", { length: 100 }),
    fileHash: (0, pg_core_1.varchar)("file_hash", { length: 128 }), // SHA-256 hash for integrity
    // Verification Status
    verificationStatus: (0, exports.kycDocumentStatusEnum)("verification_status").default('pending'),
    verifiedAt: (0, pg_core_1.timestamp)("verified_at"),
    verifiedBy: (0, pg_core_1.integer)("verified_by").references(() => exports.users.id), // Admin who verified
    rejectionReason: (0, pg_core_1.text)("rejection_reason"),
    // Document Analysis Results
    ocrData: (0, pg_core_1.jsonb)("ocr_data"), // Extracted text and data from document
    confidenceScore: (0, pg_core_1.decimal)("confidence_score", { precision: 5, scale: 2 }), // AI confidence 0-100
    analysisResults: (0, pg_core_1.jsonb)("analysis_results"), // Detailed analysis results
    // Security and compliance
    isEncrypted: (0, pg_core_1.boolean)("is_encrypted").default(true),
    uploadIpAddress: (0, pg_core_1.varchar)("upload_ip_address", { length: 45 }),
    // Timestamps
    uploadedAt: (0, pg_core_1.timestamp)("uploaded_at").defaultNow(),
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)("updated_at").defaultNow(),
}, (table) => ({
    // Indexes for efficient queries
    kycIdIdx: (0, pg_core_1.index)("kyc_documents_kyc_id_idx").on(table.kycId),
    documentTypeIdx: (0, pg_core_1.index)("kyc_documents_document_type_idx").on(table.documentType),
    statusIdx: (0, pg_core_1.index)("kyc_documents_status_idx").on(table.verificationStatus),
    verifiedByIdx: (0, pg_core_1.index)("kyc_documents_verified_by_idx").on(table.verifiedBy),
}));
// KYC verification steps for progress tracking
exports.kycVerificationSteps = (0, pg_core_1.pgTable)("kyc_verification_steps", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    kycId: (0, pg_core_1.integer)("kyc_id").references(() => exports.kycVerifications.id).notNull(),
    // Step Information
    stepName: (0, exports.kycStepEnum)("step_name").notNull(),
    stepStatus: (0, exports.kycStepStatusEnum)("step_status").default('not_started'),
    stepOrder: (0, pg_core_1.integer)("step_order").notNull(), // Order of steps (1, 2, 3, etc.)
    // Step completion data
    completedAt: (0, pg_core_1.timestamp)("completed_at"),
    completedBy: (0, pg_core_1.integer)("completed_by").references(() => exports.users.id), // User or admin who completed
    stepData: (0, pg_core_1.jsonb)("step_data"), // Step-specific data and responses
    // Progress tracking
    attemptCount: (0, pg_core_1.integer)("attempt_count").default(0),
    lastAttemptAt: (0, pg_core_1.timestamp)("last_attempt_at"),
    // Validation and errors
    validationErrors: (0, pg_core_1.jsonb)("validation_errors"), // Field-specific validation errors
    notes: (0, pg_core_1.text)("notes"), // Additional notes for the step
    // Timestamps
    startedAt: (0, pg_core_1.timestamp)("started_at"),
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)("updated_at").defaultNow(),
}, (table) => ({
    // Indexes for efficient queries
    kycIdIdx: (0, pg_core_1.index)("kyc_verification_steps_kyc_id_idx").on(table.kycId),
    stepNameIdx: (0, pg_core_1.index)("kyc_verification_steps_step_name_idx").on(table.stepName),
    statusIdx: (0, pg_core_1.index)("kyc_verification_steps_status_idx").on(table.stepStatus),
    orderIdx: (0, pg_core_1.index)("kyc_verification_steps_order_idx").on(table.stepOrder),
    // Composite index for finding steps by KYC ID and order
    kycOrderIdx: (0, pg_core_1.index)("kyc_verification_steps_kyc_order_idx").on(table.kycId, table.stepOrder),
}));
// KYC audit trail for compliance tracking
exports.kycAuditLogs = (0, pg_core_1.pgTable)("kyc_audit_logs", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    kycId: (0, pg_core_1.integer)("kyc_id").references(() => exports.kycVerifications.id).notNull(),
    // Audit Information
    action: (0, pg_core_1.varchar)("action", { length: 100 }).notNull(), // 'created', 'updated', 'approved', 'rejected', etc.
    actionBy: (0, pg_core_1.integer)("action_by").references(() => exports.users.id).notNull(), // User who performed action
    targetType: (0, pg_core_1.varchar)("target_type", { length: 50 }), // 'verification', 'document', 'step'
    targetId: (0, pg_core_1.integer)("target_id"), // ID of the target entity
    // Change tracking
    oldValues: (0, pg_core_1.jsonb)("old_values"), // Previous state
    newValues: (0, pg_core_1.jsonb)("new_values"), // New state
    changesSummary: (0, pg_core_1.text)("changes_summary"), // Human-readable summary
    // Context and metadata
    ipAddress: (0, pg_core_1.varchar)("ip_address", { length: 45 }),
    userAgent: (0, pg_core_1.text)("user_agent"),
    reason: (0, pg_core_1.text)("reason"), // Reason for the change
    // Timestamps
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow(),
}, (table) => ({
    // Indexes for audit queries
    kycIdIdx: (0, pg_core_1.index)("kyc_audit_logs_kyc_id_idx").on(table.kycId),
    actionByIdx: (0, pg_core_1.index)("kyc_audit_logs_action_by_idx").on(table.actionBy),
    actionIdx: (0, pg_core_1.index)("kyc_audit_logs_action_idx").on(table.action),
    createdAtIdx: (0, pg_core_1.index)("kyc_audit_logs_created_at_idx").on(table.createdAt),
}));
// ==== WEALTH-BUILDING FEATURES ====
// Contribution plan status enum
exports.contributionPlanStatusEnum = (0, pg_core_1.pgEnum)('contribution_plan_status', [
    'active',
    'paused',
    'completed',
    'cancelled'
]);
// User contribution plans for wealth building
exports.contributionPlans = (0, pg_core_1.pgTable)("contribution_plans", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    userId: (0, pg_core_1.integer)("user_id").references(() => exports.users.id).notNull(),
    goalName: (0, pg_core_1.varchar)("goal_name", { length: 100 }).notNull(),
    targetAmount: (0, pg_core_1.decimal)("target_amount", { precision: 18, scale: 2 }).notNull(),
    currentAmount: (0, pg_core_1.decimal)("current_amount", { precision: 18, scale: 2 }).default('0'),
    monthlyContribution: (0, pg_core_1.decimal)("monthly_contribution", { precision: 18, scale: 2 }).notNull(),
    autoContribute: (0, pg_core_1.boolean)("auto_contribute").default(true),
    expectedCompletionDate: (0, pg_core_1.timestamp)("expected_completion_date"),
    status: (0, exports.contributionPlanStatusEnum)("status").default('active'),
    pathType: (0, pg_core_1.varchar)("path_type", { length: 50 }), // 'beginner', 'yield', 'property', 'group'
    streakDays: (0, pg_core_1.integer)("streak_days").default(0),
    lastContributionAt: (0, pg_core_1.timestamp)("last_contribution_at"),
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)("updated_at").defaultNow(),
});
// Community circles for group savings
exports.circles = (0, pg_core_1.pgTable)("circles", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    name: (0, pg_core_1.varchar)("name", { length: 100 }).notNull(),
    description: (0, pg_core_1.text)("description"),
    goalAmount: (0, pg_core_1.decimal)("goal_amount", { precision: 18, scale: 2 }),
    currentAmount: (0, pg_core_1.decimal)("current_amount", { precision: 18, scale: 2 }).default('0'),
    memberLimit: (0, pg_core_1.integer)("member_limit").default(50),
    currentMembers: (0, pg_core_1.integer)("current_members").default(0),
    isPublic: (0, pg_core_1.boolean)("is_public").default(true),
    inviteCode: (0, pg_core_1.varchar)("invite_code", { length: 20 }).unique(),
    createdBy: (0, pg_core_1.integer)("created_by").references(() => exports.users.id).notNull(),
    circleImageUrl: (0, pg_core_1.varchar)("circle_image_url"),
    tags: (0, pg_core_1.jsonb)("tags"), // Array of interest tags
    activityLevel: (0, pg_core_1.varchar)("activity_level", { length: 20 }).default('active'), // active, quiet, archived
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)("updated_at").defaultNow(),
});
// Circle memberships
exports.circleMemberships = (0, pg_core_1.pgTable)("circle_memberships", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    circleId: (0, pg_core_1.integer)("circle_id").references(() => exports.circles.id).notNull(),
    userId: (0, pg_core_1.integer)("user_id").references(() => exports.users.id).notNull(),
    role: (0, pg_core_1.varchar)("role", { length: 20 }).default('member'), // member, admin, moderator
    joinedAt: (0, pg_core_1.timestamp)("joined_at").defaultNow(),
    totalContributed: (0, pg_core_1.decimal)("total_contributed", { precision: 18, scale: 2 }).default('0'),
    isActive: (0, pg_core_1.boolean)("is_active").default(true),
});
// Individual contributions to circles
exports.circleContributions = (0, pg_core_1.pgTable)("circle_contributions", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    circleId: (0, pg_core_1.integer)("circle_id").references(() => exports.circles.id).notNull(),
    userId: (0, pg_core_1.integer)("user_id").references(() => exports.users.id).notNull(),
    amount: (0, pg_core_1.decimal)("amount", { precision: 18, scale: 2 }).notNull(),
    contributionType: (0, pg_core_1.varchar)("contribution_type", { length: 30 }).default('manual'), // manual, automatic, bonus
    message: (0, pg_core_1.text)("message"),
    transactionHash: (0, pg_core_1.varchar)("transaction_hash", { length: 66 }),
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow(),
});
// Educational lessons
exports.lessons = (0, pg_core_1.pgTable)("lessons", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    title: (0, pg_core_1.varchar)("title", { length: 200 }).notNull(),
    description: (0, pg_core_1.text)("description"),
    content: (0, pg_core_1.text)("content").notNull(), // HTML or markdown content
    moduleId: (0, pg_core_1.varchar)("module_id", { length: 50 }).notNull(), // e.g., 'money-basics', 'risk-101'
    orderIndex: (0, pg_core_1.integer)("order_index").notNull(),
    estimatedMinutes: (0, pg_core_1.integer)("estimated_minutes").default(5),
    difficultyLevel: (0, pg_core_1.varchar)("difficulty_level", { length: 20 }).default('beginner'), // beginner, intermediate, advanced
    tags: (0, pg_core_1.jsonb)("tags"),
    isPublished: (0, pg_core_1.boolean)("is_published").default(true),
    createdBy: (0, pg_core_1.integer)("created_by").references(() => exports.users.id),
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)("updated_at").defaultNow(),
});
// User progress tracking for lessons
exports.lessonProgress = (0, pg_core_1.pgTable)("lesson_progress", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    userId: (0, pg_core_1.integer)("user_id").references(() => exports.users.id).notNull(),
    lessonId: (0, pg_core_1.integer)("lesson_id").references(() => exports.lessons.id).notNull(),
    isCompleted: (0, pg_core_1.boolean)("is_completed").default(false),
    quizScore: (0, pg_core_1.integer)("quiz_score"), // 0-100
    timeSpentMinutes: (0, pg_core_1.integer)("time_spent_minutes").default(0),
    completedAt: (0, pg_core_1.timestamp)("completed_at"),
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)("updated_at").defaultNow(),
});
// User badges and achievements
exports.badges = (0, pg_core_1.pgTable)("badges", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    userId: (0, pg_core_1.integer)("user_id").references(() => exports.users.id).notNull(),
    badgeType: (0, pg_core_1.varchar)("badge_type", { length: 50 }).notNull(), // lesson-complete, streak-7, first-contribution
    badgeName: (0, pg_core_1.varchar)("badge_name", { length: 100 }).notNull(),
    description: (0, pg_core_1.text)("description"),
    iconUrl: (0, pg_core_1.varchar)("icon_url"),
    relatedId: (0, pg_core_1.varchar)("related_id"), // lesson_id, circle_id, etc.
    earnedAt: (0, pg_core_1.timestamp)("earned_at").defaultNow(),
});
// ==== COMPREHENSIVE EDUCATIONAL SYSTEM ====
// Course categories and modules
exports.courseCategories = (0, pg_core_1.pgTable)("course_categories", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    name: (0, pg_core_1.varchar)("name", { length: 100 }).notNull(),
    description: (0, pg_core_1.text)("description"),
    icon: (0, pg_core_1.varchar)("icon", { length: 50 }), // emoji or icon name
    color: (0, pg_core_1.varchar)("color", { length: 20 }).default('#3B82F6'), // hex color code
    orderIndex: (0, pg_core_1.integer)("order_index").notNull(),
    isActive: (0, pg_core_1.boolean)("is_active").default(true),
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)("updated_at").defaultNow(),
});
// Individual courses within categories
exports.courses = (0, pg_core_1.pgTable)("courses", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    categoryId: (0, pg_core_1.integer)("category_id").references(() => exports.courseCategories.id).notNull(),
    title: (0, pg_core_1.varchar)("title", { length: 200 }).notNull(),
    description: (0, pg_core_1.text)("description"),
    longDescription: (0, pg_core_1.text)("long_description"),
    thumbnail: (0, pg_core_1.varchar)("thumbnail", { length: 500 }),
    orderIndex: (0, pg_core_1.integer)("order_index").notNull(),
    estimatedHours: (0, pg_core_1.decimal)("estimated_hours", { precision: 4, scale: 2 }).default('1.0'),
    difficultyLevel: (0, pg_core_1.varchar)("difficulty_level", { length: 20 }).default('beginner'), // beginner, intermediate, advanced
    prerequisites: (0, pg_core_1.jsonb)("prerequisites"), // Array of course IDs required before this course
    tags: (0, pg_core_1.jsonb)("tags"), // Array of tags for filtering
    isPublished: (0, pg_core_1.boolean)("is_published").default(true),
    isFeatured: (0, pg_core_1.boolean)("is_featured").default(false),
    createdBy: (0, pg_core_1.integer)("created_by").references(() => exports.users.id),
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)("updated_at").defaultNow(),
});
// Enhanced lessons now belong to courses
exports.courseModules = (0, pg_core_1.pgTable)("course_modules", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    courseId: (0, pg_core_1.integer)("course_id").references(() => exports.courses.id).notNull(),
    title: (0, pg_core_1.varchar)("title", { length: 200 }).notNull(),
    description: (0, pg_core_1.text)("description"),
    orderIndex: (0, pg_core_1.integer)("order_index").notNull(),
    isOptional: (0, pg_core_1.boolean)("is_optional").default(false),
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow(),
});
// Update existing lessons to link to modules instead of just moduleId string
exports.enhancedLessons = (0, pg_core_1.pgTable)("enhanced_lessons", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    moduleId: (0, pg_core_1.integer)("module_id").references(() => exports.courseModules.id).notNull(),
    title: (0, pg_core_1.varchar)("title", { length: 200 }).notNull(),
    description: (0, pg_core_1.text)("description"),
    content: (0, pg_core_1.text)("content").notNull(), // HTML or markdown content
    contentType: (0, pg_core_1.varchar)("content_type", { length: 20 }).default('markdown'), // markdown, html, video, interactive
    videoUrl: (0, pg_core_1.varchar)("video_url", { length: 500 }),
    audioUrl: (0, pg_core_1.varchar)("audio_url", { length: 500 }),
    orderIndex: (0, pg_core_1.integer)("order_index").notNull(),
    estimatedMinutes: (0, pg_core_1.integer)("estimated_minutes").default(5),
    hasQuiz: (0, pg_core_1.boolean)("has_quiz").default(false),
    isRequired: (0, pg_core_1.boolean)("is_required").default(true),
    passScore: (0, pg_core_1.integer)("pass_score").default(70), // Minimum score to pass if has quiz
    maxAttempts: (0, pg_core_1.integer)("max_attempts").default(3),
    tags: (0, pg_core_1.jsonb)("tags"),
    isPublished: (0, pg_core_1.boolean)("is_published").default(true),
    createdBy: (0, pg_core_1.integer)("created_by").references(() => exports.users.id),
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)("updated_at").defaultNow(),
});
// Quiz questions for lessons
exports.quizQuestions = (0, pg_core_1.pgTable)("quiz_questions", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    lessonId: (0, pg_core_1.integer)("lesson_id").references(() => exports.enhancedLessons.id).notNull(),
    questionText: (0, pg_core_1.text)("question_text").notNull(),
    questionType: (0, pg_core_1.varchar)("question_type", { length: 20 }).default('multiple_choice'), // multiple_choice, true_false, fill_blank, essay
    options: (0, pg_core_1.jsonb)("options"), // Array of answer options for multiple choice
    correctAnswers: (0, pg_core_1.jsonb)("correct_answers"), // Array of correct answers
    explanation: (0, pg_core_1.text)("explanation"), // Explanation shown after answering
    points: (0, pg_core_1.integer)("points").default(1),
    orderIndex: (0, pg_core_1.integer)("order_index").notNull(),
    isActive: (0, pg_core_1.boolean)("is_active").default(true),
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow(),
});
// User quiz attempts and scores
exports.quizAttempts = (0, pg_core_1.pgTable)("quiz_attempts", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    userId: (0, pg_core_1.integer)("user_id").references(() => exports.users.id).notNull(),
    lessonId: (0, pg_core_1.integer)("lesson_id").references(() => exports.enhancedLessons.id).notNull(),
    attemptNumber: (0, pg_core_1.integer)("attempt_number").default(1),
    score: (0, pg_core_1.integer)("score").default(0), // Percentage score 0-100
    totalQuestions: (0, pg_core_1.integer)("total_questions"),
    correctAnswers: (0, pg_core_1.integer)("correct_answers"),
    answers: (0, pg_core_1.jsonb)("answers"), // User's answers mapped by question ID
    timeSpentMinutes: (0, pg_core_1.integer)("time_spent_minutes").default(0),
    passed: (0, pg_core_1.boolean)("passed").default(false),
    completedAt: (0, pg_core_1.timestamp)("completed_at").defaultNow(),
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow(),
});
// Enhanced user progress tracking
exports.courseProgress = (0, pg_core_1.pgTable)("course_progress", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    userId: (0, pg_core_1.integer)("user_id").references(() => exports.users.id).notNull(),
    courseId: (0, pg_core_1.integer)("course_id").references(() => exports.courses.id).notNull(),
    lessonsCompleted: (0, pg_core_1.integer)("lessons_completed").default(0),
    totalLessons: (0, pg_core_1.integer)("total_lessons"),
    progressPercentage: (0, pg_core_1.decimal)("progress_percentage", { precision: 5, scale: 2 }).default('0'),
    currentModuleId: (0, pg_core_1.integer)("current_module_id").references(() => exports.courseModules.id),
    currentLessonId: (0, pg_core_1.integer)("current_lesson_id").references(() => exports.enhancedLessons.id),
    averageQuizScore: (0, pg_core_1.decimal)("average_quiz_score", { precision: 5, scale: 2 }),
    totalTimeSpent: (0, pg_core_1.integer)("total_time_spent").default(0), // in minutes
    isCompleted: (0, pg_core_1.boolean)("is_completed").default(false),
    certificateEarned: (0, pg_core_1.boolean)("certificate_earned").default(false),
    certificateId: (0, pg_core_1.varchar)("certificate_id", { length: 50 }),
    enrolledAt: (0, pg_core_1.timestamp)("enrolled_at").defaultNow(),
    lastAccessedAt: (0, pg_core_1.timestamp)("last_accessed_at").defaultNow(),
    completedAt: (0, pg_core_1.timestamp)("completed_at"),
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)("updated_at").defaultNow(),
});
// Learning path definitions
exports.learningPaths = (0, pg_core_1.pgTable)("learning_paths", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    title: (0, pg_core_1.varchar)("title", { length: 200 }).notNull(),
    description: (0, pg_core_1.text)("description"),
    pathType: (0, pg_core_1.varchar)("path_type", { length: 50 }), // 'beginner', 'wealth-builder', 'crypto-defi', 'real-estate'
    targetAudience: (0, pg_core_1.varchar)("target_audience", { length: 100 }),
    estimatedWeeks: (0, pg_core_1.integer)("estimated_weeks").default(4),
    difficultyLevel: (0, pg_core_1.varchar)("difficulty_level", { length: 20 }).default('beginner'),
    courseOrder: (0, pg_core_1.jsonb)("course_order"), // Array of course IDs in learning order
    prerequisites: (0, pg_core_1.jsonb)("prerequisites"),
    outcomes: (0, pg_core_1.jsonb)("outcomes"), // Array of learning outcomes
    icon: (0, pg_core_1.varchar)("icon", { length: 50 }),
    color: (0, pg_core_1.varchar)("color", { length: 20 }),
    isPublished: (0, pg_core_1.boolean)("is_published").default(true),
    isFeatured: (0, pg_core_1.boolean)("is_featured").default(false),
    createdBy: (0, pg_core_1.integer)("created_by").references(() => exports.users.id),
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)("updated_at").defaultNow(),
});
// User learning path enrollment and progress
exports.userLearningPaths = (0, pg_core_1.pgTable)("user_learning_paths", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    userId: (0, pg_core_1.integer)("user_id").references(() => exports.users.id).notNull(),
    pathId: (0, pg_core_1.integer)("path_id").references(() => exports.learningPaths.id).notNull(),
    currentCourseIndex: (0, pg_core_1.integer)("current_course_index").default(0),
    coursesCompleted: (0, pg_core_1.integer)("courses_completed").default(0),
    totalCourses: (0, pg_core_1.integer)("total_courses"),
    progressPercentage: (0, pg_core_1.decimal)("progress_percentage", { precision: 5, scale: 2 }).default('0'),
    isCompleted: (0, pg_core_1.boolean)("is_completed").default(false),
    certificateEarned: (0, pg_core_1.boolean)("certificate_earned").default(false),
    certificateId: (0, pg_core_1.varchar)("certificate_id", { length: 50 }),
    enrolledAt: (0, pg_core_1.timestamp)("enrolled_at").defaultNow(),
    lastAccessedAt: (0, pg_core_1.timestamp)("last_accessed_at").defaultNow(),
    completedAt: (0, pg_core_1.timestamp)("completed_at"),
    targetCompletionDate: (0, pg_core_1.timestamp)("target_completion_date"),
});
// Enhanced achievement system
exports.achievementDefinitions = (0, pg_core_1.pgTable)("achievement_definitions", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    name: (0, pg_core_1.varchar)("name", { length: 100 }).notNull(),
    description: (0, pg_core_1.text)("description").notNull(),
    achievementType: (0, pg_core_1.varchar)("achievement_type", { length: 30 }).notNull(), // course_complete, streak, assessment, engagement
    criteria: (0, pg_core_1.jsonb)("criteria"), // Specific requirements to unlock
    points: (0, pg_core_1.integer)("points").default(10),
    badgeIcon: (0, pg_core_1.varchar)("badge_icon", { length: 100 }),
    badgeColor: (0, pg_core_1.varchar)("badge_color", { length: 20 }),
    rarity: (0, pg_core_1.varchar)("rarity", { length: 20 }).default('common'), // common, rare, epic, legendary
    isActive: (0, pg_core_1.boolean)("is_active").default(true),
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow(),
});
// User achievements tracking
exports.userAchievements = (0, pg_core_1.pgTable)("user_achievements", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    userId: (0, pg_core_1.integer)("user_id").references(() => exports.users.id).notNull(),
    achievementId: (0, pg_core_1.integer)("achievement_id").references(() => exports.achievementDefinitions.id).notNull(),
    progress: (0, pg_core_1.integer)("progress").default(0), // Current progress toward achievement
    maxProgress: (0, pg_core_1.integer)("max_progress").default(1), // Target progress to unlock
    isUnlocked: (0, pg_core_1.boolean)("is_unlocked").default(false),
    unlockedAt: (0, pg_core_1.timestamp)("unlocked_at"),
    notificationSent: (0, pg_core_1.boolean)("notification_sent").default(false),
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow(),
});
// User learning streaks and engagement
exports.learningStreaks = (0, pg_core_1.pgTable)("learning_streaks", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    userId: (0, pg_core_1.integer)("user_id").references(() => exports.users.id).notNull(),
    currentStreak: (0, pg_core_1.integer)("current_streak").default(0),
    longestStreak: (0, pg_core_1.integer)("longest_streak").default(0),
    lastActivityDate: (0, pg_core_1.timestamp)("last_activity_date"),
    streakStartDate: (0, pg_core_1.timestamp)("streak_start_date"),
    weeklyGoal: (0, pg_core_1.integer)("weekly_goal").default(3), // lessons per week
    monthlyGoal: (0, pg_core_1.integer)("monthly_goal").default(12),
    totalLessonsCompleted: (0, pg_core_1.integer)("total_lessons_completed").default(0),
    totalTimeSpent: (0, pg_core_1.integer)("total_time_spent").default(0), // in minutes
    averageSessionTime: (0, pg_core_1.decimal)("average_session_time", { precision: 5, scale: 2 }), // in minutes
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)("updated_at").defaultNow(),
});
// Course certificates
exports.certificates = (0, pg_core_1.pgTable)("certificates", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    userId: (0, pg_core_1.integer)("user_id").references(() => exports.users.id).notNull(),
    courseId: (0, pg_core_1.integer)("course_id").references(() => exports.courses.id),
    learningPathId: (0, pg_core_1.integer)("learning_path_id").references(() => exports.learningPaths.id),
    certificateId: (0, pg_core_1.varchar)("certificate_id", { length: 50 }).unique().notNull(),
    certificateType: (0, pg_core_1.varchar)("certificate_type", { length: 30 }), // course, learning_path, achievement
    title: (0, pg_core_1.varchar)("title", { length: 200 }).notNull(),
    description: (0, pg_core_1.text)("description"),
    issuedDate: (0, pg_core_1.timestamp)("issued_date").defaultNow(),
    isVerified: (0, pg_core_1.boolean)("is_verified").default(true),
    verificationHash: (0, pg_core_1.varchar)("verification_hash", { length: 100 }),
    templateUrl: (0, pg_core_1.varchar)("template_url", { length: 500 }),
    shareUrl: (0, pg_core_1.varchar)("share_url", { length: 500 }),
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow(),
});
// Learning analytics and insights
exports.learningAnalytics = (0, pg_core_1.pgTable)("learning_analytics", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    userId: (0, pg_core_1.integer)("user_id").references(() => exports.users.id).notNull(),
    date: (0, pg_core_1.timestamp)("date").notNull(),
    lessonsCompleted: (0, pg_core_1.integer)("lessons_completed").default(0),
    timeSpent: (0, pg_core_1.integer)("time_spent").default(0), // in minutes
    quizzesTaken: (0, pg_core_1.integer)("quizzes_taken").default(0),
    averageScore: (0, pg_core_1.decimal)("average_score", { precision: 5, scale: 2 }),
    coursesStarted: (0, pg_core_1.integer)("courses_started").default(0),
    coursesCompleted: (0, pg_core_1.integer)("courses_completed").default(0),
    achievementsUnlocked: (0, pg_core_1.integer)("achievements_unlocked").default(0),
    streakMaintained: (0, pg_core_1.boolean)("streak_maintained").default(false),
    preferredLearningTime: (0, pg_core_1.varchar)("preferred_learning_time", { length: 20 }), // morning, afternoon, evening
    deviceType: (0, pg_core_1.varchar)("device_type", { length: 20 }), // mobile, tablet, desktop
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow(),
}, (table) => ({
    userDateIdx: (0, pg_core_1.index)("learning_analytics_user_date_idx").on(table.userId, table.date),
}));
// Monthly transparency reports
exports.reportMonths = (0, pg_core_1.pgTable)("report_months", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    year: (0, pg_core_1.integer)("year").notNull(),
    month: (0, pg_core_1.integer)("month").notNull(), // 1-12
    totalUsers: (0, pg_core_1.integer)("total_users").default(0),
    totalContributions: (0, pg_core_1.decimal)("total_contributions", { precision: 18, scale: 2 }).default('0'),
    totalCircles: (0, pg_core_1.integer)("total_circles").default(0),
    averageContribution: (0, pg_core_1.decimal)("average_contribution", { precision: 18, scale: 2 }).default('0'),
    topPerformingPath: (0, pg_core_1.varchar)("top_performing_path", { length: 50 }),
    keyMetrics: (0, pg_core_1.jsonb)("key_metrics"), // Additional metrics as JSON
    reportSummary: (0, pg_core_1.text)("report_summary"),
    isPublished: (0, pg_core_1.boolean)("is_published").default(false),
    publishedBy: (0, pg_core_1.integer)("published_by").references(() => exports.users.id),
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow(),
    publishedAt: (0, pg_core_1.timestamp)("published_at"),
});
// User poll responses for feedback
exports.pollResponses = (0, pg_core_1.pgTable)("poll_responses", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    userId: (0, pg_core_1.integer)("user_id").references(() => exports.users.id).notNull(),
    pollId: (0, pg_core_1.varchar)("poll_id", { length: 100 }).notNull(), // Identifier for different polls
    questionId: (0, pg_core_1.varchar)("question_id", { length: 100 }).notNull(),
    response: (0, pg_core_1.text)("response").notNull(),
    responseType: (0, pg_core_1.varchar)("response_type", { length: 20 }).default('text'), // text, rating, multiple_choice
    metadata: (0, pg_core_1.jsonb)("metadata"), // Additional response data
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow(),
});
// ==== KEYGROW RENT-TO-OWN PATHWAY SYSTEM ====
// KeyGrow progress status enum
exports.keygrowStatusEnum = (0, pg_core_1.pgEnum)('keygrow_status', [
    'in_progress',
    'completed',
    'paused',
    'cancelled'
]);
// KeyGrow pathway step enum
exports.keygrowStepEnum = (0, pg_core_1.pgEnum)('keygrow_step', [
    'readiness_assessment',
    'market_education',
    'savings_calculator',
    'financial_preparation',
    'property_search',
    'pathway_selection'
]);
// Property status enum
exports.propertyStatusEnum = (0, pg_core_1.pgEnum)('property_status', [
    'available',
    'pending',
    'rented',
    'sold',
    'removed'
]);
// Property type enum  
exports.propertyTypeEnum = (0, pg_core_1.pgEnum)('property_type', [
    'house',
    'condo',
    'townhouse',
    'duplex',
    'apartment'
]);
// KeyGrow user progress tracking
exports.keygrowProgress = (0, pg_core_1.pgTable)("keygrow_progress", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    userId: (0, pg_core_1.integer)("user_id").references(() => exports.users.id).notNull(),
    status: (0, exports.keygrowStatusEnum)("status").default('in_progress'),
    currentStep: (0, exports.keygrowStepEnum)("current_step").default('readiness_assessment'),
    stepNumber: (0, pg_core_1.integer)("step_number").default(1),
    // Readiness Assessment Data
    creditScore: (0, pg_core_1.integer)("credit_score"),
    monthlyIncome: (0, pg_core_1.decimal)("monthly_income", { precision: 12, scale: 2 }),
    monthlyDebt: (0, pg_core_1.decimal)("monthly_debt", { precision: 12, scale: 2 }),
    emergencyFund: (0, pg_core_1.decimal)("emergency_fund", { precision: 12, scale: 2 }),
    monthlyExpenses: (0, pg_core_1.decimal)("monthly_expenses", { precision: 12, scale: 2 }),
    savingsRate: (0, pg_core_1.decimal)("savings_rate", { precision: 5, scale: 2 }), // Percentage
    isFirstTimeBuyer: (0, pg_core_1.boolean)("is_first_time_buyer").default(true),
    hasStableEmployment: (0, pg_core_1.boolean)("has_stable_employment").default(false),
    // Market Analysis Data
    targetZipCode: (0, pg_core_1.varchar)("target_zip_code", { length: 10 }),
    targetHomePrice: (0, pg_core_1.decimal)("target_home_price", { precision: 12, scale: 2 }),
    averageRent: (0, pg_core_1.decimal)("average_rent", { precision: 12, scale: 2 }),
    appreciationRate: (0, pg_core_1.decimal)("appreciation_rate", { precision: 5, scale: 2 }), // Percentage
    downPaymentPercent: (0, pg_core_1.decimal)("down_payment_percent", { precision: 5, scale: 2 }).default('20.00'),
    loanType: (0, pg_core_1.varchar)("loan_type", { length: 20 }).default('conventional'), // conventional, fha, va, usda
    // Savings Target Data
    downPaymentAmount: (0, pg_core_1.decimal)("down_payment_amount", { precision: 12, scale: 2 }),
    closingCosts: (0, pg_core_1.decimal)("closing_costs", { precision: 12, scale: 2 }),
    movingCosts: (0, pg_core_1.decimal)("moving_costs", { precision: 12, scale: 2 }),
    totalNeeded: (0, pg_core_1.decimal)("total_needed", { precision: 12, scale: 2 }),
    currentSavings: (0, pg_core_1.decimal)("current_savings", { precision: 12, scale: 2 }),
    monthlySavings: (0, pg_core_1.decimal)("monthly_savings", { precision: 12, scale: 2 }),
    monthsToGoal: (0, pg_core_1.integer)("months_to_goal"),
    // Property Search Preferences
    preferredLocation: (0, pg_core_1.varchar)("preferred_location", { length: 100 }),
    priceRangeMin: (0, pg_core_1.decimal)("price_range_min", { precision: 12, scale: 2 }),
    priceRangeMax: (0, pg_core_1.decimal)("price_range_max", { precision: 12, scale: 2 }),
    bedrooms: (0, pg_core_1.integer)("bedrooms").default(2),
    bathrooms: (0, pg_core_1.decimal)("bathrooms", { precision: 3, scale: 1 }).default('2.0'),
    preferredPropertyType: (0, exports.propertyTypeEnum)("preferred_property_type").default('house'),
    // Calculated Scores
    readinessScore: (0, pg_core_1.integer)("readiness_score").default(0), // 0-100
    affordabilityScore: (0, pg_core_1.integer)("affordability_score").default(0), // 0-100
    // Selected Pathways
    selectedPathways: (0, pg_core_1.jsonb)("selected_pathways"), // Array of selected rent-to-own options
    // Goal Integration from Onboarding
    onboardingGoalAmount: (0, pg_core_1.decimal)("onboarding_goal_amount", { precision: 12, scale: 2 }),
    onboardingTimeframe: (0, pg_core_1.varchar)("onboarding_timeframe", { length: 50 }),
    onboardingPathType: (0, pg_core_1.varchar)("onboarding_path_type", { length: 50 }),
    // Completion Data
    completedAt: (0, pg_core_1.timestamp)("completed_at"),
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)("updated_at").defaultNow(),
});
// Mock property catalog for deterministic results
exports.properties = (0, pg_core_1.pgTable)("properties", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    address: (0, pg_core_1.varchar)("address", { length: 200 }).notNull(),
    city: (0, pg_core_1.varchar)("city", { length: 100 }).notNull(),
    state: (0, pg_core_1.varchar)("state", { length: 2 }).notNull(),
    zipCode: (0, pg_core_1.varchar)("zip_code", { length: 10 }).notNull(),
    price: (0, pg_core_1.decimal)("price", { precision: 12, scale: 2 }).notNull(),
    bedrooms: (0, pg_core_1.integer)("bedrooms").notNull(),
    bathrooms: (0, pg_core_1.decimal)("bathrooms", { precision: 3, scale: 1 }).notNull(),
    squareFeet: (0, pg_core_1.integer)("square_feet"),
    propertyType: (0, exports.propertyTypeEnum)("property_type").notNull(),
    description: (0, pg_core_1.text)("description"),
    images: (0, pg_core_1.jsonb)("images"), // Array of image URLs
    amenities: (0, pg_core_1.jsonb)("amenities"), // Array of amenities
    // Rent-to-own specific data
    monthlyRent: (0, pg_core_1.decimal)("monthly_rent", { precision: 8, scale: 2 }).notNull(),
    equityBuildupRate: (0, pg_core_1.decimal)("equity_buildup_rate", { precision: 5, scale: 2 }).default('25.00'), // Percentage
    optionFee: (0, pg_core_1.decimal)("option_fee", { precision: 8, scale: 2 }),
    optionPeriodMonths: (0, pg_core_1.integer)("option_period_months").default(24), // Typical 2-year option
    // Status and availability
    status: (0, exports.propertyStatusEnum)("status").default('available'),
    isRentToOwnEligible: (0, pg_core_1.boolean)("is_rent_to_own_eligible").default(true),
    listingDate: (0, pg_core_1.timestamp)("listing_date").defaultNow(),
    // Location data for matching
    latitude: (0, pg_core_1.decimal)("latitude", { precision: 10, scale: 7 }),
    longitude: (0, pg_core_1.decimal)("longitude", { precision: 10, scale: 7 }),
    neighborhood: (0, pg_core_1.varchar)("neighborhood", { length: 100 }),
    schoolDistrict: (0, pg_core_1.varchar)("school_district", { length: 100 }),
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)("updated_at").defaultNow(),
});
// User property watchlist
exports.propertyWatchlist = (0, pg_core_1.pgTable)("property_watchlist", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    userId: (0, pg_core_1.integer)("user_id").references(() => exports.users.id).notNull(),
    propertyId: (0, pg_core_1.integer)("property_id").references(() => exports.properties.id).notNull(),
    notes: (0, pg_core_1.text)("notes"),
    addedAt: (0, pg_core_1.timestamp)("added_at").defaultNow(),
}, (table) => ({
    // Ensure user can only watchlist each property once
    uniqueUserProperty: (0, pg_core_1.index)("unique_user_property").on(table.userId, table.propertyId),
}));
// Property viewing requests
exports.propertyViewing = (0, pg_core_1.pgTable)("property_viewing", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    userId: (0, pg_core_1.integer)("user_id").references(() => exports.users.id).notNull(),
    propertyId: (0, pg_core_1.integer)("property_id").references(() => exports.properties.id).notNull(),
    requestedDate: (0, pg_core_1.timestamp)("requested_date"),
    contactEmail: (0, pg_core_1.varchar)("contact_email", { length: 100 }),
    contactPhone: (0, pg_core_1.varchar)("contact_phone", { length: 20 }),
    message: (0, pg_core_1.text)("message"),
    status: (0, pg_core_1.varchar)("status", { length: 20 }).default('requested'), // requested, scheduled, completed, cancelled
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow(),
});
// Pre-qualification calculations cache
exports.prequalificationCache = (0, pg_core_1.pgTable)("prequalification_cache", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    userId: (0, pg_core_1.integer)("user_id").references(() => exports.users.id).notNull(),
    creditScore: (0, pg_core_1.integer)("credit_score").notNull(),
    monthlyIncome: (0, pg_core_1.decimal)("monthly_income", { precision: 12, scale: 2 }).notNull(),
    monthlyDebt: (0, pg_core_1.decimal)("monthly_debt", { precision: 12, scale: 2 }).notNull(),
    downPaymentPercent: (0, pg_core_1.decimal)("down_payment_percent", { precision: 5, scale: 2 }).notNull(),
    loanType: (0, pg_core_1.varchar)("loan_type", { length: 20 }).notNull(),
    // Calculated results
    maxLoanAmount: (0, pg_core_1.decimal)("max_loan_amount", { precision: 12, scale: 2 }),
    maxHomePrice: (0, pg_core_1.decimal)("max_home_price", { precision: 12, scale: 2 }),
    estimatedMonthlyPayment: (0, pg_core_1.decimal)("estimated_monthly_payment", { precision: 8, scale: 2 }),
    debtToIncomeRatio: (0, pg_core_1.decimal)("debt_to_income_ratio", { precision: 5, scale: 2 }),
    isPrequalified: (0, pg_core_1.boolean)("is_prequalified").default(false),
    // Cache metadata
    calculatedAt: (0, pg_core_1.timestamp)("calculated_at").defaultNow(),
    expiresAt: (0, pg_core_1.timestamp)("expires_at"), // Cache for 24 hours
});
// ==== SECURE WALLET AUTHENTICATION SYSTEM ====
// Wallet authentication nonce storage for secure signing
exports.walletAuthNonces = (0, pg_core_1.pgTable)("wallet_auth_nonces", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    nonce: (0, pg_core_1.varchar)("nonce", { length: 64 }).unique().notNull(), // Random hex string
    walletAddress: (0, pg_core_1.varchar)("wallet_address", { length: 42 }).notNull(), // Ethereum address format
    challengeMessage: (0, pg_core_1.text)("challenge_message").notNull(), // EIP-4361 formatted message
    isUsed: (0, pg_core_1.boolean)("is_used").default(false),
    ipAddress: (0, pg_core_1.varchar)("ip_address", { length: 45 }),
    userAgent: (0, pg_core_1.text)("user_agent"),
    expiresAt: (0, pg_core_1.timestamp)("expires_at").notNull(), // Nonces expire in 15 minutes
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow(),
}, (table) => ({
    // Index for quick lookups by nonce and wallet address
    nonceIdx: (0, pg_core_1.index)("wallet_auth_nonces_nonce_idx").on(table.nonce),
    walletNonceIdx: (0, pg_core_1.index)("wallet_auth_nonces_wallet_idx").on(table.walletAddress),
    expiresIdx: (0, pg_core_1.index)("wallet_auth_nonces_expires_idx").on(table.expiresAt),
}));
// Wallet authentication attempts tracking for rate limiting
exports.walletAuthAttempts = (0, pg_core_1.pgTable)("wallet_auth_attempts", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    walletAddress: (0, pg_core_1.varchar)("wallet_address", { length: 42 }).notNull(),
    ipAddress: (0, pg_core_1.varchar)("ip_address", { length: 45 }).notNull(),
    attemptType: (0, pg_core_1.varchar)("attempt_type", { length: 20 }).notNull(), // 'challenge', 'verify'
    success: (0, pg_core_1.boolean)("success").default(false),
    errorReason: (0, pg_core_1.varchar)("error_reason", { length: 100 }),
    userAgent: (0, pg_core_1.text)("user_agent"),
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow(),
}, (table) => ({
    // Indexes for rate limiting queries
    walletIpIdx: (0, pg_core_1.index)("wallet_auth_attempts_wallet_ip_idx").on(table.walletAddress, table.ipAddress),
    ipTimeIdx: (0, pg_core_1.index)("wallet_auth_attempts_ip_time_idx").on(table.ipAddress, table.createdAt),
    walletTimeIdx: (0, pg_core_1.index)("wallet_auth_attempts_wallet_time_idx").on(table.walletAddress, table.createdAt),
}));
// ==== DENET STORAGE SYSTEM ====
// Storage file status enum
exports.storageFileStatusEnum = (0, pg_core_1.pgEnum)('storage_file_status', [
    'uploading',
    'stored',
    'failed',
    'deleted',
    'archived'
]);
// Storage node status enum
exports.storageNodeStatusEnum = (0, pg_core_1.pgEnum)('storage_node_status', [
    'online',
    'offline',
    'maintenance',
    'error'
]);
// File type enum for categorization
exports.fileTypeEnum = (0, pg_core_1.pgEnum)('file_type', [
    'document',
    'image',
    'video',
    'audio',
    'archive',
    'other'
]);
// Storage files metadata tracking
exports.storageFiles = (0, pg_core_1.pgTable)("storage_files", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    userId: (0, pg_core_1.integer)("user_id").references(() => exports.users.id).notNull(),
    // File Information
    fileName: (0, pg_core_1.varchar)("file_name", { length: 255 }).notNull(),
    originalName: (0, pg_core_1.varchar)("original_name", { length: 255 }).notNull(),
    fileType: (0, exports.fileTypeEnum)("file_type").notNull(),
    mimeType: (0, pg_core_1.varchar)("mime_type", { length: 100 }),
    fileSize: (0, pg_core_1.integer)("file_size").notNull(), // Size in bytes
    fileHash: (0, pg_core_1.varchar)("file_hash", { length: 128 }), // SHA-256 hash for integrity
    // DeNet Storage Metadata
    deNetFileId: (0, pg_core_1.varchar)("denet_file_id", { length: 100 }), // DeNet unique file identifier
    nodeId: (0, pg_core_1.varchar)("node_id", { length: 100 }), // DeNet node storing the file
    storageProof: (0, pg_core_1.text)("storage_proof"), // Cryptographic proof of storage
    replicationFactor: (0, pg_core_1.integer)("replication_factor").default(3), // Number of copies
    // File Status and Processing
    status: (0, exports.storageFileStatusEnum)("status").default('uploading'),
    uploadProgress: (0, pg_core_1.integer)("upload_progress").default(0), // 0-100 percentage
    errorMessage: (0, pg_core_1.text)("error_message"),
    // Access and Security
    isPublic: (0, pg_core_1.boolean)("is_public").default(false),
    accessToken: (0, pg_core_1.varchar)("access_token", { length: 64 }), // For private file access
    encryptionKey: (0, pg_core_1.varchar)("encryption_key", { length: 128 }), // File encryption key
    // Storage Analytics
    downloadCount: (0, pg_core_1.integer)("download_count").default(0),
    lastAccessedAt: (0, pg_core_1.timestamp)("last_accessed_at"),
    bandwidth_used: (0, pg_core_1.integer)("bandwidth_used").default(0), // Total bandwidth in KB
    // Storage Costs and Billing
    storageRate: (0, pg_core_1.decimal)("storage_rate", { precision: 10, scale: 6 }), // Cost per GB per month
    totalStorageCost: (0, pg_core_1.decimal)("total_storage_cost", { precision: 18, scale: 8 }).default('0'),
    // File Lifecycle
    expiresAt: (0, pg_core_1.timestamp)("expires_at"), // Optional expiration date
    lastBackupAt: (0, pg_core_1.timestamp)("last_backup_at"),
    // Timestamps
    uploadedAt: (0, pg_core_1.timestamp)("uploaded_at").defaultNow(),
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)("updated_at").defaultNow(),
}, (table) => ({
    // Indexes for efficient queries
    userIdIdx: (0, pg_core_1.index)("storage_files_user_id_idx").on(table.userId),
    statusIdx: (0, pg_core_1.index)("storage_files_status_idx").on(table.status),
    fileTypeIdx: (0, pg_core_1.index)("storage_files_file_type_idx").on(table.fileType),
    nodeIdIdx: (0, pg_core_1.index)("storage_files_node_id_idx").on(table.nodeId),
    deNetFileIdIdx: (0, pg_core_1.index)("storage_files_denet_file_id_idx").on(table.deNetFileId),
    uploadedAtIdx: (0, pg_core_1.index)("storage_files_uploaded_at_idx").on(table.uploadedAt),
}));
// DeNet storage nodes tracking and management
exports.storageNodes = (0, pg_core_1.pgTable)("storage_nodes", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    // Node Identification
    nodeId: (0, pg_core_1.varchar)("node_id", { length: 100 }).unique().notNull(),
    nodeName: (0, pg_core_1.varchar)("node_name", { length: 100 }),
    nodeAddress: (0, pg_core_1.varchar)("node_address", { length: 200 }).notNull(), // Network address
    // Node Status and Health
    status: (0, exports.storageNodeStatusEnum)("status").default('offline'),
    isActive: (0, pg_core_1.boolean)("is_active").default(true),
    healthScore: (0, pg_core_1.decimal)("health_score", { precision: 5, scale: 2 }).default('100'), // 0-100 health score
    // Storage Capacity
    totalCapacity: (0, pg_core_1.integer)("total_capacity").notNull(), // Total capacity in GB
    usedCapacity: (0, pg_core_1.integer)("used_capacity").default(0), // Used capacity in GB
    availableCapacity: (0, pg_core_1.integer)("available_capacity").notNull(), // Available capacity in GB
    // Performance Metrics
    uptime: (0, pg_core_1.decimal)("uptime", { precision: 5, scale: 2 }).default('0'), // Uptime percentage
    responseTime: (0, pg_core_1.integer)("response_time").default(0), // Average response time in ms
    bandwidth: (0, pg_core_1.integer)("bandwidth").default(0), // Available bandwidth in Mbps
    // Storage Economics
    pricePerGB: (0, pg_core_1.decimal)("price_per_gb", { precision: 10, scale: 6 }).default('0'), // Price per GB per month
    payoutAddress: (0, pg_core_1.varchar)("payout_address", { length: 42 }), // Ethereum address for payments
    // Geographic and Network Info
    location: (0, pg_core_1.varchar)("location", { length: 100 }),
    country: (0, pg_core_1.varchar)("country", { length: 50 }),
    networkProvider: (0, pg_core_1.varchar)("network_provider", { length: 100 }),
    // Node Statistics
    totalFilesStored: (0, pg_core_1.integer)("total_files_stored").default(0),
    totalBandwidthUsed: (0, pg_core_1.integer)("total_bandwidth_used").default(0), // In TB
    totalEarnings: (0, pg_core_1.decimal)("total_earnings", { precision: 18, scale: 8 }).default('0'),
    // Monitoring Data
    lastPingAt: (0, pg_core_1.timestamp)("last_ping_at"),
    lastHeartbeat: (0, pg_core_1.timestamp)("last_heartbeat"),
    // Timestamps
    registeredAt: (0, pg_core_1.timestamp)("registered_at").defaultNow(),
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)("updated_at").defaultNow(),
}, (table) => ({
    // Indexes for efficient queries
    nodeIdIdx: (0, pg_core_1.index)("storage_nodes_node_id_idx").on(table.nodeId),
    statusIdx: (0, pg_core_1.index)("storage_nodes_status_idx").on(table.status),
    isActiveIdx: (0, pg_core_1.index)("storage_nodes_is_active_idx").on(table.isActive),
    locationIdx: (0, pg_core_1.index)("storage_nodes_location_idx").on(table.location),
    lastPingIdx: (0, pg_core_1.index)("storage_nodes_last_ping_idx").on(table.lastPingAt),
}));
// Storage analytics and usage tracking
exports.storageAnalytics = (0, pg_core_1.pgTable)("storage_analytics", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    userId: (0, pg_core_1.integer)("user_id").references(() => exports.users.id),
    // Analytics Period
    periodType: (0, pg_core_1.varchar)("period_type", { length: 20 }).notNull(), // 'daily', 'weekly', 'monthly'
    periodDate: (0, pg_core_1.timestamp)("period_date").notNull(), // Start of the period
    // Storage Usage Metrics
    totalFiles: (0, pg_core_1.integer)("total_files").default(0),
    totalStorageUsed: (0, pg_core_1.integer)("total_storage_used").default(0), // In bytes
    totalBandwidthUsed: (0, pg_core_1.integer)("total_bandwidth_used").default(0), // In bytes
    totalDownloads: (0, pg_core_1.integer)("total_downloads").default(0),
    // Cost Analysis
    totalStorageCost: (0, pg_core_1.decimal)("total_storage_cost", { precision: 18, scale: 8 }).default('0'),
    averageCostPerGB: (0, pg_core_1.decimal)("average_cost_per_gb", { precision: 10, scale: 6 }).default('0'),
    // Performance Metrics
    averageUploadSpeed: (0, pg_core_1.decimal)("average_upload_speed", { precision: 10, scale: 2 }).default('0'), // MB/s
    averageDownloadSpeed: (0, pg_core_1.decimal)("average_download_speed", { precision: 10, scale: 2 }).default('0'), // MB/s
    averageResponseTime: (0, pg_core_1.integer)("average_response_time").default(0), // Milliseconds
    // File Type Distribution
    documentsCount: (0, pg_core_1.integer)("documents_count").default(0),
    imagesCount: (0, pg_core_1.integer)("images_count").default(0),
    videosCount: (0, pg_core_1.integer)("videos_count").default(0),
    audiosCount: (0, pg_core_1.integer)("audios_count").default(0),
    archivesCount: (0, pg_core_1.integer)("archives_count").default(0),
    othersCount: (0, pg_core_1.integer)("others_count").default(0),
    // Node Performance
    activeNodes: (0, pg_core_1.integer)("active_nodes").default(0),
    nodeUptimeAverage: (0, pg_core_1.decimal)("node_uptime_average", { precision: 5, scale: 2 }).default('0'), // Percentage
    // Timestamps
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow(),
}, (table) => ({
    // Indexes for analytics queries
    userIdIdx: (0, pg_core_1.index)("storage_analytics_user_id_idx").on(table.userId),
    periodTypeIdx: (0, pg_core_1.index)("storage_analytics_period_type_idx").on(table.periodType),
    periodDateIdx: (0, pg_core_1.index)("storage_analytics_period_date_idx").on(table.periodDate),
    // Composite index for user analytics by period
    userPeriodIdx: (0, pg_core_1.index)("storage_analytics_user_period_idx").on(table.userId, table.periodType, table.periodDate),
}));
// Storage upload sessions for tracking multi-part uploads
exports.storageUploads = (0, pg_core_1.pgTable)("storage_uploads", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    userId: (0, pg_core_1.integer)("user_id").references(() => exports.users.id).notNull(),
    // Upload Session Info
    uploadId: (0, pg_core_1.varchar)("upload_id", { length: 64 }).unique().notNull(),
    fileName: (0, pg_core_1.varchar)("file_name", { length: 255 }).notNull(),
    fileSize: (0, pg_core_1.integer)("file_size").notNull(),
    fileHash: (0, pg_core_1.varchar)("file_hash", { length: 128 }),
    // Upload Progress
    status: (0, pg_core_1.varchar)("status", { length: 20 }).default('initiated'), // initiated, uploading, completed, failed
    bytesUploaded: (0, pg_core_1.integer)("bytes_uploaded").default(0),
    uploadProgress: (0, pg_core_1.integer)("upload_progress").default(0), // 0-100 percentage
    // Chunked Upload Management
    totalChunks: (0, pg_core_1.integer)("total_chunks").default(1),
    completedChunks: (0, pg_core_1.integer)("completed_chunks").default(0),
    chunkSize: (0, pg_core_1.integer)("chunk_size").default(1048576), // 1MB default chunk size
    // Node Assignment
    assignedNodeId: (0, pg_core_1.varchar)("assigned_node_id", { length: 100 }),
    // Error Handling
    errorMessage: (0, pg_core_1.text)("error_message"),
    retryCount: (0, pg_core_1.integer)("retry_count").default(0),
    maxRetries: (0, pg_core_1.integer)("max_retries").default(3),
    // Timing and Expiration
    expiresAt: (0, pg_core_1.timestamp)("expires_at").notNull(), // Upload session expiry
    completedAt: (0, pg_core_1.timestamp)("completed_at"),
    // Timestamps
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)("updated_at").defaultNow(),
}, (table) => ({
    // Indexes for upload management
    uploadIdIdx: (0, pg_core_1.index)("storage_uploads_upload_id_idx").on(table.uploadId),
    userIdIdx: (0, pg_core_1.index)("storage_uploads_user_id_idx").on(table.userId),
    statusIdx: (0, pg_core_1.index)("storage_uploads_status_idx").on(table.status),
    assignedNodeIdx: (0, pg_core_1.index)("storage_uploads_assigned_node_idx").on(table.assignedNodeId),
    expiresAtIdx: (0, pg_core_1.index)("storage_uploads_expires_at_idx").on(table.expiresAt),
}));
// Savings Accounts System
exports.savingsAccounts = (0, pg_core_1.pgTable)("savings_accounts", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    accountNumber: (0, pg_core_1.varchar)("account_number", { length: 20 }).unique().notNull(),
    userId: (0, pg_core_1.integer)("user_id"),
    walletAddress: (0, pg_core_1.varchar)("wallet_address", { length: 42 }).notNull(),
    // Account type and status
    type: (0, exports.savingsAccountTypeEnum)("type").notNull(),
    status: (0, exports.savingsAccountStatusEnum)("status").default('open').notNull(),
    // Financial data
    apy: (0, pg_core_1.decimal)("apy", { precision: 5, scale: 2 }).notNull(),
    principal: (0, pg_core_1.decimal)("principal", { precision: 18, scale: 8 }).default('0').notNull(),
    balance: (0, pg_core_1.decimal)("balance", { precision: 18, scale: 8 }).default('0').notNull(),
    accruedInterest: (0, pg_core_1.decimal)("accrued_interest", { precision: 18, scale: 8 }).default('0').notNull(),
    // CD-specific fields
    termMonths: (0, pg_core_1.integer)("term_months"),
    maturityDate: (0, pg_core_1.timestamp)("maturity_date"),
    earlyWithdrawalPenaltyRate: (0, pg_core_1.decimal)("early_withdrawal_penalty_rate", { precision: 5, scale: 2 }),
    // Interest accrual tracking
    lastAccruedAt: (0, pg_core_1.timestamp)("last_accrued_at"),
    // Metadata
    metadata: (0, pg_core_1.jsonb)("metadata"),
    // Timestamps
    openedAt: (0, pg_core_1.timestamp)("opened_at").defaultNow().notNull(),
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow().notNull(),
    updatedAt: (0, pg_core_1.timestamp)("updated_at").defaultNow().notNull(),
}, (table) => ({
    walletAddressIdx: (0, pg_core_1.index)("savings_accounts_wallet_address_idx").on(table.walletAddress),
    accountNumberIdx: (0, pg_core_1.index)("savings_accounts_account_number_idx").on(table.accountNumber),
    typeStatusIdx: (0, pg_core_1.index)("savings_accounts_type_status_idx").on(table.type, table.status),
    userIdIdx: (0, pg_core_1.index)("savings_accounts_user_id_idx").on(table.userId),
}));
exports.savingsTransactions = (0, pg_core_1.pgTable)("savings_transactions", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    savingsAccountId: (0, pg_core_1.integer)("savings_account_id").notNull(),
    // Transaction details
    txType: (0, exports.savingsTransactionTypeEnum)("tx_type").notNull(),
    amount: (0, pg_core_1.decimal)("amount", { precision: 18, scale: 8 }).notNull(),
    balanceAfter: (0, pg_core_1.decimal)("balance_after", { precision: 18, scale: 8 }).notNull(),
    // On-chain reference
    txHash: (0, pg_core_1.varchar)("tx_hash", { length: 66 }),
    source: (0, pg_core_1.varchar)("source", { length: 20 }).default('offchain'),
    // Description
    note: (0, pg_core_1.text)("note"),
    // Timestamp
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow().notNull(),
}, (table) => ({
    accountIdIdx: (0, pg_core_1.index)("savings_transactions_account_id_idx").on(table.savingsAccountId),
    createdAtIdx: (0, pg_core_1.index)("savings_transactions_created_at_idx").on(table.createdAt),
    txHashIdx: (0, pg_core_1.index)("savings_transactions_tx_hash_idx").on(table.txHash),
}));
exports.savingsAccountSettings = (0, pg_core_1.pgTable)("savings_account_settings", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    savingsAccountId: (0, pg_core_1.integer)("savings_account_id").notNull().unique(),
    // Round-up savings
    roundUpEnabled: (0, pg_core_1.boolean)("round_up_enabled").default(false),
    // Auto-transfer settings
    autoTransferEnabled: (0, pg_core_1.boolean)("auto_transfer_enabled").default(false),
    autoTransferAmount: (0, pg_core_1.decimal)("auto_transfer_amount", { precision: 18, scale: 8 }),
    autoTransferDay: (0, pg_core_1.integer)("auto_transfer_day"),
    // Timestamp
    updatedAt: (0, pg_core_1.timestamp)("updated_at").defaultNow().notNull(),
}, (table) => ({
    accountIdIdx: (0, pg_core_1.index)("savings_account_settings_account_id_idx").on(table.savingsAccountId),
}));
// ==== REAL ESTATE INVESTOR PLATFORM ====
// Property submission status enum
exports.propertySubmissionStatusEnum = (0, pg_core_1.pgEnum)('property_submission_status', [
    'pending',
    'under_review',
    'approved',
    'rejected',
    'listed'
]);
// Real Estate Investor property submissions
exports.propertySubmissions = (0, pg_core_1.pgTable)("property_submissions", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    // Sponsor/Submitter Information
    submitterWalletAddress: (0, pg_core_1.varchar)("submitter_wallet_address", { length: 42 }).notNull(),
    submitterName: (0, pg_core_1.varchar)("submitter_name", { length: 200 }),
    submitterEmail: (0, pg_core_1.varchar)("submitter_email", { length: 200 }),
    submitterPhone: (0, pg_core_1.varchar)("submitter_phone", { length: 20 }),
    // Property Information (matching smart contract fields)
    propertyName: (0, pg_core_1.varchar)("property_name", { length: 200 }).notNull(),
    propertyAddress: (0, pg_core_1.text)("property_address").notNull(),
    city: (0, pg_core_1.varchar)("city", { length: 100 }).notNull(),
    state: (0, pg_core_1.varchar)("state", { length: 50 }).notNull(),
    zipCode: (0, pg_core_1.varchar)("zip_code", { length: 10 }).notNull(),
    country: (0, pg_core_1.varchar)("country", { length: 100 }).default('United States'),
    // Property Details
    propertyDescription: (0, pg_core_1.text)("property_description"),
    propertyType: (0, pg_core_1.varchar)("property_type", { length: 50 }), // residential, commercial, mixed-use
    bedrooms: (0, pg_core_1.integer)("bedrooms"),
    bathrooms: (0, pg_core_1.decimal)("bathrooms", { precision: 3, scale: 1 }),
    squareFeet: (0, pg_core_1.integer)("square_feet"),
    lotSize: (0, pg_core_1.varchar)("lot_size", { length: 50 }),
    yearBuilt: (0, pg_core_1.integer)("year_built"),
    // Financial Data (Smart Contract Required Fields)
    purchasePrice: (0, pg_core_1.decimal)("purchase_price", { precision: 18, scale: 8 }).notNull(), // In BNB
    monthlyRent: (0, pg_core_1.decimal)("monthly_rent", { precision: 18, scale: 8 }).notNull(), // In BNB
    totalShares: (0, pg_core_1.integer)("total_shares").notNull(),
    pricePerShare: (0, pg_core_1.decimal)("price_per_share", { precision: 18, scale: 8 }).notNull(), // In BNB
    // Investment Metrics
    estimatedAnnualRent: (0, pg_core_1.decimal)("estimated_annual_rent", { precision: 18, scale: 8 }),
    estimatedAppreciation: (0, pg_core_1.decimal)("estimated_appreciation", { precision: 5, scale: 2 }), // Percentage
    estimatedROI: (0, pg_core_1.decimal)("estimated_roi", { precision: 5, scale: 2 }), // Percentage
    rentalYield: (0, pg_core_1.decimal)("rental_yield", { precision: 5, scale: 2 }), // Percentage
    occupancyRate: (0, pg_core_1.decimal)("occupancy_rate", { precision: 5, scale: 2 }).default('100.00'), // Percentage
    // Property Management
    managementCompany: (0, pg_core_1.varchar)("management_company", { length: 200 }),
    propertyManager: (0, pg_core_1.varchar)("property_manager", { length: 200 }),
    currentTenant: (0, pg_core_1.boolean)("current_tenant").default(false),
    leaseEndDate: (0, pg_core_1.timestamp)("lease_end_date"),
    // Media and Documents
    images: (0, pg_core_1.jsonb)("images"), // Array of image URLs/IPFS hashes
    documents: (0, pg_core_1.jsonb)("documents"), // Array of document URLs (title deeds, inspection reports, etc.)
    virtualTourUrl: (0, pg_core_1.varchar)("virtual_tour_url", { length: 500 }),
    metadataURI: (0, pg_core_1.varchar)("metadata_uri", { length: 500 }), // IPFS URI for smart contract
    // Submission Workflow
    status: (0, exports.propertySubmissionStatusEnum)("status").default('pending'),
    submittedAt: (0, pg_core_1.timestamp)("submitted_at").defaultNow(),
    reviewedAt: (0, pg_core_1.timestamp)("reviewed_at"),
    reviewedBy: (0, pg_core_1.integer)("reviewed_by").references(() => exports.users.id),
    approvalNotes: (0, pg_core_1.text)("approval_notes"),
    rejectionReason: (0, pg_core_1.text)("rejection_reason"),
    // Smart Contract Integration
    onChainPropertyId: (0, pg_core_1.integer)("on_chain_property_id"), // Property ID from smart contract after listing
    listingTxHash: (0, pg_core_1.varchar)("listing_tx_hash", { length: 66 }), // Transaction hash of listProperty call
    listedAt: (0, pg_core_1.timestamp)("listed_at"),
    // Validation Flags
    financialsValidated: (0, pg_core_1.boolean)("financials_validated").default(false),
    documentsValidated: (0, pg_core_1.boolean)("documents_validated").default(false),
    legalReviewComplete: (0, pg_core_1.boolean)("legal_review_complete").default(false),
    // Audit Trail
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)("updated_at").defaultNow(),
}, (table) => ({
    submitterIdx: (0, pg_core_1.index)("property_submissions_submitter_idx").on(table.submitterWalletAddress),
    statusIdx: (0, pg_core_1.index)("property_submissions_status_idx").on(table.status),
    submittedAtIdx: (0, pg_core_1.index)("property_submissions_submitted_at_idx").on(table.submittedAt),
}));
// ==== INVESTOR REGISTRATION SYSTEM ====
// Investor registration status enum
exports.investorStatusEnum = (0, pg_core_1.pgEnum)('investor_status', [
    'pending',
    'active',
    'suspended',
    'inactive'
]);
// Investment experience enum
exports.investmentExperienceEnum = (0, pg_core_1.pgEnum)('investment_experience', [
    'none',
    'beginner',
    'intermediate',
    'advanced'
]);
// Risk tolerance enum
exports.riskToleranceEnum = (0, pg_core_1.pgEnum)('risk_tolerance', [
    'conservative',
    'moderate',
    'aggressive'
]);
// Investor profiles - Personal information and accreditation
exports.investorProfiles = (0, pg_core_1.pgTable)("investor_profiles", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    // Personal Information
    walletAddress: (0, pg_core_1.varchar)("wallet_address", { length: 42 }).notNull().unique(),
    firstName: (0, pg_core_1.varchar)("first_name", { length: 100 }).notNull(),
    lastName: (0, pg_core_1.varchar)("last_name", { length: 100 }).notNull(),
    email: (0, pg_core_1.varchar)("email", { length: 200 }).notNull(),
    phone: (0, pg_core_1.varchar)("phone", { length: 20 }),
    dateOfBirth: (0, pg_core_1.timestamp)("date_of_birth"),
    country: (0, pg_core_1.varchar)("country", { length: 100 }).default('United States'),
    // Accreditation
    isAccreditedInvestor: (0, pg_core_1.boolean)("is_accredited_investor").default(false),
    accreditationVerifiedAt: (0, pg_core_1.timestamp)("accreditation_verified_at"),
    // Account Status
    status: (0, exports.investorStatusEnum)("status").default('active'),
    // Timestamps
    registeredAt: (0, pg_core_1.timestamp)("registered_at").defaultNow(),
    lastUpdated: (0, pg_core_1.timestamp)("last_updated").defaultNow(),
}, (table) => ({
    walletIdx: (0, pg_core_1.index)("investor_profiles_wallet_idx").on(table.walletAddress),
    emailIdx: (0, pg_core_1.index)("investor_profiles_email_idx").on(table.email),
    statusIdx: (0, pg_core_1.index)("investor_profiles_status_idx").on(table.status),
}));
// Investor financial profiles - Financial data
exports.investorFinancialProfiles = (0, pg_core_1.pgTable)("investor_financial_profiles", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    investorId: (0, pg_core_1.integer)("investor_id").notNull().references(() => exports.investorProfiles.id),
    // Financial Information
    annualIncome: (0, pg_core_1.integer)("annual_income"), // Stored as range midpoint
    netWorth: (0, pg_core_1.integer)("net_worth"),
    liquidAssets: (0, pg_core_1.integer)("liquid_assets"),
    investmentExperience: (0, exports.investmentExperienceEnum)("investment_experience").default('beginner'),
    investmentKnowledge: (0, pg_core_1.jsonb)("investment_knowledge"), // Array of asset classes
    // Portfolio Information
    totalInvested: (0, pg_core_1.decimal)("total_invested", { precision: 18, scale: 8 }).default('0'),
    totalShares: (0, pg_core_1.integer)("total_shares").default(0),
    totalRentalEarned: (0, pg_core_1.decimal)("total_rental_earned", { precision: 18, scale: 8 }).default('0'),
    // Timestamps
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)("updated_at").defaultNow(),
}, (table) => ({
    investorIdx: (0, pg_core_1.index)("investor_financial_profiles_investor_idx").on(table.investorId),
}));
// Investor risk assessments - Risk tolerance and investment objectives
exports.investorRiskAssessments = (0, pg_core_1.pgTable)("investor_risk_assessments", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    investorId: (0, pg_core_1.integer)("investor_id").notNull().references(() => exports.investorProfiles.id),
    // Risk Profile
    riskTolerance: (0, exports.riskToleranceEnum)("risk_tolerance").default('moderate'),
    investmentHorizon: (0, pg_core_1.varchar)("investment_horizon", { length: 10 }), // '1-3', '3-5', '5-10', '10+'
    liquidityNeeds: (0, pg_core_1.varchar)("liquidity_needs", { length: 20 }), // 'high', 'medium', 'low'
    portfolioDiversification: (0, pg_core_1.integer)("portfolio_diversification"), // Percentage for RE
    // Timestamps
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)("updated_at").defaultNow(),
}, (table) => ({
    investorIdx: (0, pg_core_1.index)("investor_risk_assessments_investor_idx").on(table.investorId),
}));
// Investor preferences - Property types, locations, returns
exports.investorPreferences = (0, pg_core_1.pgTable)("investor_preferences", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    investorId: (0, pg_core_1.integer)("investor_id").notNull().references(() => exports.investorProfiles.id),
    // Investment Preferences
    preferredPropertyTypes: (0, pg_core_1.jsonb)("preferred_property_types"), // Array of property types
    preferredLocations: (0, pg_core_1.jsonb)("preferred_locations"), // Array of locations
    targetAnnualReturn: (0, pg_core_1.decimal)("target_annual_return", { precision: 5, scale: 2 }), // Percentage
    minimumInvestment: (0, pg_core_1.decimal)("minimum_investment", { precision: 18, scale: 2 }).default('30.00'), // USD
    maxPropertyAllocation: (0, pg_core_1.decimal)("max_property_allocation", { precision: 5, scale: 2 }), // Percentage
    reinvestDividends: (0, pg_core_1.boolean)("reinvest_dividends").default(true),
    // Timestamps
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)("updated_at").defaultNow(),
}, (table) => ({
    investorIdx: (0, pg_core_1.index)("investor_preferences_investor_idx").on(table.investorId),
}));
// Investment orders - Track share purchases
exports.investmentOrderStatusEnum = (0, pg_core_1.pgEnum)('investment_order_status', [
    'pending',
    'processing',
    'completed',
    'failed',
    'cancelled'
]);
exports.paymentMethodEnum = (0, pg_core_1.pgEnum)('payment_method', [
    'stripe',
    'bnb',
    'credit_card',
    'crypto'
]);
exports.investmentOrders = (0, pg_core_1.pgTable)("investment_orders", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    investorId: (0, pg_core_1.integer)("investor_id").notNull().references(() => exports.investorProfiles.id),
    // Order Details
    propertyId: (0, pg_core_1.integer)("property_id"), // Reference to on-chain property ID
    propertyName: (0, pg_core_1.varchar)("property_name", { length: 200 }),
    propertyAddress: (0, pg_core_1.text)("property_address"),
    // Investment Amount
    numberOfShares: (0, pg_core_1.integer)("number_of_shares").notNull(),
    pricePerShare: (0, pg_core_1.decimal)("price_per_share", { precision: 18, scale: 8 }).notNull(),
    totalAmount: (0, pg_core_1.decimal)("total_amount", { precision: 18, scale: 8 }).notNull(), // In USD or BNB
    platformFee: (0, pg_core_1.decimal)("platform_fee", { precision: 18, scale: 8 }), // 2.5%
    // Payment Information
    paymentMethod: (0, exports.paymentMethodEnum)("payment_method").notNull(),
    paymentIntentId: (0, pg_core_1.varchar)("payment_intent_id", { length: 200 }), // Stripe PaymentIntent ID
    transactionHash: (0, pg_core_1.varchar)("transaction_hash", { length: 66 }), // Blockchain tx hash for BNB
    // Order Status
    status: (0, exports.investmentOrderStatusEnum)("status").default('pending'),
    // Share Allocation
    sharesAllocated: (0, pg_core_1.boolean)("shares_allocated").default(false),
    allocationTxHash: (0, pg_core_1.varchar)("allocation_tx_hash", { length: 66 }), // On-chain allocation tx
    // Timestamps
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow(),
    completedAt: (0, pg_core_1.timestamp)("completed_at"),
    updatedAt: (0, pg_core_1.timestamp)("updated_at").defaultNow(),
}, (table) => ({
    investorIdx: (0, pg_core_1.index)("investment_orders_investor_idx").on(table.investorId),
    propertyIdx: (0, pg_core_1.index)("investment_orders_property_idx").on(table.propertyId),
    statusIdx: (0, pg_core_1.index)("investment_orders_status_idx").on(table.status),
    createdAtIdx: (0, pg_core_1.index)("investment_orders_created_at_idx").on(table.createdAt),
}));
// Share allocations - Track investor ownership
exports.shareAllocations = (0, pg_core_1.pgTable)("share_allocations", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    investorId: (0, pg_core_1.integer)("investor_id").notNull().references(() => exports.investorProfiles.id),
    orderId: (0, pg_core_1.integer)("order_id").notNull().references(() => exports.investmentOrders.id),
    // Property Details
    propertyId: (0, pg_core_1.integer)("property_id").notNull(),
    propertyName: (0, pg_core_1.varchar)("property_name", { length: 200 }),
    // Share Ownership
    sharesOwned: (0, pg_core_1.integer)("shares_owned").notNull(),
    purchasePrice: (0, pg_core_1.decimal)("purchase_price", { precision: 18, scale: 8 }).notNull(),
    currentValue: (0, pg_core_1.decimal)("current_value", { precision: 18, scale: 8 }),
    // Rental Income Tracking
    totalRentalEarned: (0, pg_core_1.decimal)("total_rental_earned", { precision: 18, scale: 8 }).default('0'),
    pendingRental: (0, pg_core_1.decimal)("pending_rental", { precision: 18, scale: 8 }).default('0'),
    lastRentalClaim: (0, pg_core_1.timestamp)("last_rental_claim"),
    // Timestamps
    allocatedAt: (0, pg_core_1.timestamp)("allocated_at").defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)("updated_at").defaultNow(),
}, (table) => ({
    investorIdx: (0, pg_core_1.index)("share_allocations_investor_idx").on(table.investorId),
    propertyIdx: (0, pg_core_1.index)("share_allocations_property_idx").on(table.propertyId),
    orderIdx: (0, pg_core_1.index)("share_allocations_order_idx").on(table.orderId),
}));
// Rental distribution history
exports.rentalDistributions = (0, pg_core_1.pgTable)("rental_distributions", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    allocationId: (0, pg_core_1.integer)("allocation_id").notNull().references(() => exports.shareAllocations.id),
    investorId: (0, pg_core_1.integer)("investor_id").notNull().references(() => exports.investorProfiles.id),
    // Distribution Details
    propertyId: (0, pg_core_1.integer)("property_id").notNull(),
    amount: (0, pg_core_1.decimal)("amount", { precision: 18, scale: 8 }).notNull(),
    distributionDate: (0, pg_core_1.timestamp)("distribution_date").defaultNow(),
    transactionHash: (0, pg_core_1.varchar)("transaction_hash", { length: 66 }),
    // Timestamps
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow(),
}, (table) => ({
    allocationIdx: (0, pg_core_1.index)("rental_distributions_allocation_idx").on(table.allocationId),
    investorIdx: (0, pg_core_1.index)("rental_distributions_investor_idx").on(table.investorId),
    propertyIdx: (0, pg_core_1.index)("rental_distributions_property_idx").on(table.propertyId),
    distributionDateIdx: (0, pg_core_1.index)("rental_distributions_date_idx").on(table.distributionDate),
}));
// ==== UNIFIED REGISTRATION SYSTEM ====
// Program type enum
exports.programTypeEnum = (0, pg_core_1.pgEnum)('program_type', [
    'real_estate_investor',
    'keygrow_rent_to_own',
    'property_owner',
    'banking',
    'staking',
    'nft_marketplace',
    'governance'
]);
// Program enrollment status enum
exports.enrollmentStatusEnum = (0, pg_core_1.pgEnum)('enrollment_status', [
    'browsing',
    'profile_started',
    'profile_completed',
    'kyc_pending',
    'kyc_verified',
    'payment_pending',
    'enrolled',
    'suspended',
    'cancelled'
]);
// Payment status enum
exports.paymentStatusEnum = (0, pg_core_1.pgEnum)('payment_status', [
    'pending',
    'processing',
    'succeeded',
    'failed',
    'refunded',
    'cancelled'
]);
// Unified personal profiles - Canonical source for shared personal data
exports.unifiedPersonalProfiles = (0, pg_core_1.pgTable)("unified_personal_profiles", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    userId: (0, pg_core_1.integer)("user_id").notNull().references(() => exports.users.id),
    // Personal Information (shared across all programs)
    firstName: (0, pg_core_1.varchar)("first_name", { length: 100 }).notNull(),
    lastName: (0, pg_core_1.varchar)("last_name", { length: 100 }).notNull(),
    email: (0, pg_core_1.varchar)("email", { length: 255 }).notNull(),
    phone: (0, pg_core_1.varchar)("phone", { length: 20 }),
    dateOfBirth: (0, pg_core_1.timestamp)("date_of_birth"),
    country: (0, pg_core_1.varchar)("country", { length: 100 }),
    state: (0, pg_core_1.varchar)("state", { length: 100 }),
    city: (0, pg_core_1.varchar)("city", { length: 100 }),
    zipCode: (0, pg_core_1.varchar)("zip_code", { length: 20 }),
    address: (0, pg_core_1.text)("address"),
    // Employment Status
    employmentStatus: (0, pg_core_1.varchar)("employment_status", { length: 50 }), // employed, self-employed, unemployed, retired
    employmentYears: (0, pg_core_1.integer)("employment_years"),
    employer: (0, pg_core_1.varchar)("employer", { length: 200 }),
    occupation: (0, pg_core_1.varchar)("occupation", { length: 100 }),
    // Completion tracking
    isComplete: (0, pg_core_1.boolean)("is_complete").default(false),
    completedAt: (0, pg_core_1.timestamp)("completed_at"),
    // Timestamps
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)("updated_at").defaultNow(),
}, (table) => ({
    userIdx: (0, pg_core_1.index)("unified_personal_profiles_user_idx").on(table.userId),
    emailIdx: (0, pg_core_1.index)("unified_personal_profiles_email_idx").on(table.email),
}));
// Unified financial profiles - Shared financial data across programs
exports.unifiedFinancialProfiles = (0, pg_core_1.pgTable)("unified_financial_profiles", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    userId: (0, pg_core_1.integer)("user_id").notNull().references(() => exports.users.id),
    // Income Data
    annualIncome: (0, pg_core_1.decimal)("annual_income", { precision: 15, scale: 2 }),
    monthlyIncome: (0, pg_core_1.decimal)("monthly_income", { precision: 15, scale: 2 }),
    incomeSource: (0, pg_core_1.varchar)("income_source", { length: 100 }), // salary, business, investments, etc.
    // Assets & Liabilities
    totalNetWorth: (0, pg_core_1.decimal)("total_net_worth", { precision: 18, scale: 2 }),
    liquidAssets: (0, pg_core_1.decimal)("liquid_assets", { precision: 18, scale: 2 }),
    realEstateValue: (0, pg_core_1.decimal)("real_estate_value", { precision: 18, scale: 2 }),
    investmentValue: (0, pg_core_1.decimal)("investment_value", { precision: 18, scale: 2 }),
    totalDebt: (0, pg_core_1.decimal)("total_debt", { precision: 18, scale: 2 }),
    monthlyDebt: (0, pg_core_1.decimal)("monthly_debt", { precision: 15, scale: 2 }),
    monthlyExpenses: (0, pg_core_1.decimal)("monthly_expenses", { precision: 15, scale: 2 }),
    // Savings & Emergency Fund
    emergencyFund: (0, pg_core_1.decimal)("emergency_fund", { precision: 15, scale: 2 }),
    currentSavings: (0, pg_core_1.decimal)("current_savings", { precision: 15, scale: 2 }),
    monthlySavings: (0, pg_core_1.decimal)("monthly_savings", { precision: 15, scale: 2 }),
    // Credit Information
    creditScore: (0, pg_core_1.integer)("credit_score"), // 300-850
    hasBankruptcy: (0, pg_core_1.boolean)("has_bankruptcy").default(false),
    hasForeclosure: (0, pg_core_1.boolean)("has_foreclosure").default(false),
    // Completion tracking
    isComplete: (0, pg_core_1.boolean)("is_complete").default(false),
    completedAt: (0, pg_core_1.timestamp)("completed_at"),
    // Timestamps
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)("updated_at").defaultNow(),
}, (table) => ({
    userIdx: (0, pg_core_1.index)("unified_financial_profiles_user_idx").on(table.userId),
}));
// Unified risk profiles - Shared risk assessment across programs
exports.unifiedRiskProfiles = (0, pg_core_1.pgTable)("unified_risk_profiles", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    userId: (0, pg_core_1.integer)("user_id").notNull().references(() => exports.users.id),
    // Risk Tolerance
    riskTolerance: (0, pg_core_1.varchar)("risk_tolerance", { length: 50 }), // conservative, moderate, aggressive
    investmentExperience: (0, pg_core_1.varchar)("investment_experience", { length: 50 }), // none, beginner, intermediate, advanced
    investmentHorizon: (0, pg_core_1.varchar)("investment_horizon", { length: 20 }), // 1-3, 3-5, 5-10, 10+ years
    liquidityNeeds: (0, pg_core_1.varchar)("liquidity_needs", { length: 20 }), // high, medium, low
    // Investment Knowledge
    investmentKnowledge: (0, pg_core_1.jsonb)("investment_knowledge"), // Array of asset classes user understands
    hasRealEstateExperience: (0, pg_core_1.boolean)("has_real_estate_experience").default(false),
    hasCryptoExperience: (0, pg_core_1.boolean)("has_crypto_experience").default(false),
    hasStockExperience: (0, pg_core_1.boolean)("has_stock_experience").default(false),
    // Portfolio Preferences
    portfolioDiversification: (0, pg_core_1.integer)("portfolio_diversification"), // % allocated to real estate
    comfortWithVolatility: (0, pg_core_1.integer)("comfort_with_volatility"), // 1-10 scale
    lossComfort: (0, pg_core_1.decimal)("loss_comfort", { precision: 5, scale: 2 }), // Max % loss they can handle
    // Completion tracking
    isComplete: (0, pg_core_1.boolean)("is_complete").default(false),
    completedAt: (0, pg_core_1.timestamp)("completed_at"),
    // Timestamps
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)("updated_at").defaultNow(),
}, (table) => ({
    userIdx: (0, pg_core_1.index)("unified_risk_profiles_user_idx").on(table.userId),
}));
// Program enrollments - Track which programs users have enrolled in
exports.programEnrollments = (0, pg_core_1.pgTable)("program_enrollments", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    userId: (0, pg_core_1.integer)("user_id").notNull().references(() => exports.users.id),
    programType: (0, exports.programTypeEnum)("program_type").notNull(),
    // Enrollment Status
    status: (0, exports.enrollmentStatusEnum)("status").default('browsing'),
    statusUpdatedAt: (0, pg_core_1.timestamp)("status_updated_at").defaultNow(),
    // Program-Specific References
    investorProfileId: (0, pg_core_1.integer)("investor_profile_id").references(() => exports.investorProfiles.id),
    keygrowProgressId: (0, pg_core_1.integer)("keygrow_progress_id").references(() => exports.keygrowProgress.id),
    kycVerificationId: (0, pg_core_1.integer)("kyc_verification_id").references(() => exports.kycVerifications.id),
    // Registration Data
    registrationData: (0, pg_core_1.jsonb)("registration_data"), // Program-specific fields
    requiresPayment: (0, pg_core_1.boolean)("requires_payment").default(false),
    paymentAmount: (0, pg_core_1.decimal)("payment_amount", { precision: 15, scale: 2 }),
    paymentCurrency: (0, pg_core_1.varchar)("payment_currency", { length: 10 }), // USD, BNB, etc.
    paymentCompleted: (0, pg_core_1.boolean)("payment_completed").default(false),
    paymentCompletedAt: (0, pg_core_1.timestamp)("payment_completed_at"),
    // Eligibility
    isEligible: (0, pg_core_1.boolean)("is_eligible").default(true),
    eligibilityReason: (0, pg_core_1.text)("eligibility_reason"),
    // Timestamps
    enrolledAt: (0, pg_core_1.timestamp)("enrolled_at"),
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)("updated_at").defaultNow(),
}, (table) => ({
    userIdx: (0, pg_core_1.index)("program_enrollments_user_idx").on(table.userId),
    programIdx: (0, pg_core_1.index)("program_enrollments_program_idx").on(table.programType),
    statusIdx: (0, pg_core_1.index)("program_enrollments_status_idx").on(table.status),
    userProgramIdx: (0, pg_core_1.index)("program_enrollments_user_program_idx").on(table.userId, table.programType),
}));
// Unified payment intents - Track all payments across programs
exports.unifiedPaymentIntents = (0, pg_core_1.pgTable)("unified_payment_intents", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    userId: (0, pg_core_1.integer)("user_id").notNull().references(() => exports.users.id),
    enrollmentId: (0, pg_core_1.integer)("enrollment_id").references(() => exports.programEnrollments.id),
    // Payment Details
    amount: (0, pg_core_1.decimal)("amount", { precision: 18, scale: 8 }).notNull(),
    currency: (0, pg_core_1.varchar)("currency", { length: 10 }).notNull(), // USD, BNB
    paymentMethod: (0, exports.paymentMethodEnum)("payment_method").notNull(),
    status: (0, exports.paymentStatusEnum)("status").default('pending'),
    // Provider-Specific Data
    stripePaymentIntentId: (0, pg_core_1.varchar)("stripe_payment_intent_id", { length: 255 }),
    stripeClientSecret: (0, pg_core_1.varchar)("stripe_client_secret", { length: 255 }),
    cryptoTransactionHash: (0, pg_core_1.varchar)("crypto_transaction_hash", { length: 66 }),
    cryptoWalletAddress: (0, pg_core_1.varchar)("crypto_wallet_address", { length: 42 }),
    // Purpose
    programType: (0, exports.programTypeEnum)("program_type"),
    purposeDescription: (0, pg_core_1.text)("purpose_description"), // "KeyGrow Registration Fee", "Property Share Purchase", etc.
    metadata: (0, pg_core_1.jsonb)("metadata"), // Additional payment context
    // Processing
    processedAt: (0, pg_core_1.timestamp)("processed_at"),
    failureReason: (0, pg_core_1.text)("failure_reason"),
    refundedAt: (0, pg_core_1.timestamp)("refunded_at"),
    refundAmount: (0, pg_core_1.decimal)("refund_amount", { precision: 18, scale: 8 }),
    // Timestamps
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)("updated_at").defaultNow(),
}, (table) => ({
    userIdx: (0, pg_core_1.index)("unified_payment_intents_user_idx").on(table.userId),
    enrollmentIdx: (0, pg_core_1.index)("unified_payment_intents_enrollment_idx").on(table.enrollmentId),
    statusIdx: (0, pg_core_1.index)("unified_payment_intents_status_idx").on(table.status),
    stripeIdx: (0, pg_core_1.index)("unified_payment_intents_stripe_idx").on(table.stripePaymentIntentId),
}));
// Registration journey - Track user progress through unified onboarding
exports.registrationJourney = (0, pg_core_1.pgTable)("registration_journey", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    userId: (0, pg_core_1.integer)("user_id").notNull().references(() => exports.users.id),
    // Journey Progress
    currentStep: (0, pg_core_1.varchar)("current_step", { length: 50 }).default('account_creation'), // account_creation, personal_profile, financial_profile, risk_profile, program_selection, program_enrollment
    completedSteps: (0, pg_core_1.jsonb)("completed_steps").default('[]'), // Array of completed step names
    // Profile Completion Status
    hasPersonalProfile: (0, pg_core_1.boolean)("has_personal_profile").default(false),
    hasFinancialProfile: (0, pg_core_1.boolean)("has_financial_profile").default(false),
    hasRiskProfile: (0, pg_core_1.boolean)("has_risk_profile").default(false),
    hasKycVerification: (0, pg_core_1.boolean)("has_kyc_verification").default(false),
    // Journey State
    isActive: (0, pg_core_1.boolean)("is_active").default(true),
    isCompleted: (0, pg_core_1.boolean)("is_completed").default(false),
    completedAt: (0, pg_core_1.timestamp)("completed_at"),
    abandonedAt: (0, pg_core_1.timestamp)("abandoned_at"),
    // Analytics
    totalTimeSpent: (0, pg_core_1.integer)("total_time_spent"), // seconds
    stepTransitions: (0, pg_core_1.jsonb)("step_transitions"), // Array of { from, to, timestamp }
    // Timestamps
    startedAt: (0, pg_core_1.timestamp)("started_at").defaultNow(),
    lastActivityAt: (0, pg_core_1.timestamp)("last_activity_at").defaultNow(),
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)("updated_at").defaultNow(),
}, (table) => ({
    userIdx: (0, pg_core_1.index)("registration_journey_user_idx").on(table.userId),
    currentStepIdx: (0, pg_core_1.index)("registration_journey_current_step_idx").on(table.currentStep),
    isActiveIdx: (0, pg_core_1.index)("registration_journey_is_active_idx").on(table.isActive),
}));
