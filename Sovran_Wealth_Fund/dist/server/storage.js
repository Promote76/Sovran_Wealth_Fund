"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.storage = exports.DatabaseStorage = void 0;
// Storage layer for SWF platform
const db_1 = require("./db");
const schema_1 = require("../shared/schema");
const drizzle_orm_1 = require("drizzle-orm");
const connect_pg_simple_1 = __importDefault(require("connect-pg-simple"));
const express_session_1 = __importDefault(require("express-session"));
// Database storage implementation
class DatabaseStorage {
    constructor() {
        const PostgresSessionStore = (0, connect_pg_simple_1.default)(express_session_1.default);
        this.sessionStore = new PostgresSessionStore({
            pool: db_1.pool,
            createTableIfMissing: true
        });
    }
    // User methods
    async getUser(id) {
        const [user] = await db_1.db.select().from(schema_1.users).where((0, drizzle_orm_1.eq)(schema_1.users.id, id));
        return user;
    }
    async getUserByUsername(username) {
        const [user] = await db_1.db.select().from(schema_1.users).where((0, drizzle_orm_1.eq)(schema_1.users.username, username));
        return user;
    }
    async createUser(user) {
        const [newUser] = await db_1.db.insert(schema_1.users).values(user).returning();
        return newUser;
    }
    // Registration methods
    async getRegistration(id) {
        const [registration] = await db_1.db.select().from(schema_1.registrations).where((0, drizzle_orm_1.eq)(schema_1.registrations.id, id));
        return registration;
    }
    async getRegistrationByEmail(email) {
        const [registration] = await db_1.db.select().from(schema_1.registrations).where((0, drizzle_orm_1.eq)(schema_1.registrations.email, email));
        return registration;
    }
    async createRegistration(registration) {
        const [newRegistration] = await db_1.db.insert(schema_1.registrations).values(registration).returning();
        return newRegistration;
    }
    async getAllRegistrations(limit = 100) {
        return db_1.db.select().from(schema_1.registrations).limit(limit);
    }
    async updateRegistration(id, updates) {
        const [updatedRegistration] = await db_1.db
            .update(schema_1.registrations)
            .set(updates)
            .where((0, drizzle_orm_1.eq)(schema_1.registrations.id, id))
            .returning();
        return updatedRegistration;
    }
}
exports.DatabaseStorage = DatabaseStorage;
// Export a singleton instance of the storage class
exports.storage = new DatabaseStorage();
//# sourceMappingURL=storage.js.map