"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registrations = exports.users = void 0;
const pg_core_1 = require("drizzle-orm/pg-core");
// Users table for admin authentication
exports.users = (0, pg_core_1.pgTable)('users', {
    id: (0, pg_core_1.serial)('id').primaryKey(),
    address: (0, pg_core_1.text)('address').notNull(),
    username: (0, pg_core_1.text)('username'),
    password: (0, pg_core_1.text)('password').notNull(),
    email: (0, pg_core_1.text)('email'),
    role: (0, pg_core_1.text)('role'),
    isAdmin: (0, pg_core_1.boolean)('is_admin').default(false),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow()
});
// Registration records from landing page form submissions
exports.registrations = (0, pg_core_1.pgTable)('registrations', {
    id: (0, pg_core_1.serial)('id').primaryKey(),
    name: (0, pg_core_1.text)('name').notNull(),
    email: (0, pg_core_1.text)('email').notNull().unique(),
    walletAddress: (0, pg_core_1.text)('wallet_address'),
    investmentInterest: (0, pg_core_1.text)('investment_interest'),
    country: (0, pg_core_1.text)('country'),
    hearAboutUs: (0, pg_core_1.text)('hear_about_us'),
    additionalInfo: (0, pg_core_1.text)('additional_info'),
    agreeToTerms: (0, pg_core_1.boolean)('agree_to_terms').default(false),
    subscribeToNewsletter: (0, pg_core_1.boolean)('subscribe_to_newsletter').default(false),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow(),
    status: (0, pg_core_1.text)('status').default('pending')
});
//# sourceMappingURL=schema.js.map