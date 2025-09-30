"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupDatabaseIntegration = setupDatabaseIntegration;
exports.initializeDatabase = initializeDatabase;
// Database integration module for server.js
const auth_1 = require("./server/auth");
const registration_routes_1 = __importDefault(require("./server/registration-routes"));
// Function to set up database integration
function setupDatabaseIntegration(app) {
    // Setup authentication
    (0, auth_1.setupAuth)(app);
    // Use registration routes
    app.use(registration_routes_1.default);
    console.log('[Database] Integration initialized successfully');
}
// Function to initialize database if needed
async function initializeDatabase() {
    try {
        // Check database connection
        const { pool } = await Promise.resolve().then(() => __importStar(require('./server/db')));
        await pool.query('SELECT NOW()');
        console.log('[Database] Connected successfully');
        // Set up database schema if needed
        // In a production environment, you might want to use a migration tool
        // This is handled by Drizzle ORM when we create tables
        console.log('[Database] Initialization complete');
    }
    catch (error) {
        console.error('[Database] Initialization failed:', error);
        throw error;
    }
}
//# sourceMappingURL=server-db-integration.js.map