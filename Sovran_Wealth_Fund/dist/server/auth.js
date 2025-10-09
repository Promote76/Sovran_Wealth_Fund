"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupAuth = setupAuth;
// Authentication module for SWF platform
const passport_1 = __importDefault(require("passport"));
const passport_local_1 = require("passport-local");
const crypto_1 = require("crypto");
const util_1 = require("util");
const storage_1 = require("./storage");
// Convert callback-based scrypt to Promise-based
const scryptAsync = (0, util_1.promisify)(crypto_1.scrypt);
/**
 * Hash a password for storage
 * @param password Plain text password
 * @returns Hashed password with salt
 */
async function hashPassword(password) {
    const salt = (0, crypto_1.randomBytes)(16).toString('hex');
    const buf = await scryptAsync(password, salt, 64);
    return `${buf.toString('hex')}.${salt}`;
}
/**
 * Compare a password with a stored hash
 * @param supplied Plain text password
 * @param stored Stored hashed password
 * @returns True if passwords match
 */
async function comparePasswords(supplied, stored) {
    const [hashed, salt] = stored.split('.');
    const hashedBuf = Buffer.from(hashed, 'hex');
    const suppliedBuf = await scryptAsync(supplied, salt, 64);
    return (0, crypto_1.timingSafeEqual)(hashedBuf, suppliedBuf);
}
/**
 * Set up authentication middleware and routes
 * @param app Express application
 */
function setupAuth(app) {
    // Skip setting up a new session middleware since server.js already has one
    // Just set up passport
    app.use(passport_1.default.initialize());
    app.use(passport_1.default.session());
    // Configure Passport local strategy
    passport_1.default.use(new passport_local_1.Strategy(async (username, password, done) => {
        try {
            const user = await storage_1.storage.getUserByUsername(username);
            if (!user || !(await comparePasswords(password, user.password))) {
                return done(null, false);
            }
            return done(null, user);
        }
        catch (error) {
            return done(error);
        }
    }));
    // Configure user serialization for sessions
    passport_1.default.serializeUser((user, done) => {
        done(null, user.id);
    });
    passport_1.default.deserializeUser(async (id, done) => {
        try {
            const user = await storage_1.storage.getUser(id);
            done(null, user);
        }
        catch (error) {
            done(error);
        }
    });
    // Add authentication routes
    app.post('/api/register', async (req, res, next) => {
        try {
            const existingUser = await storage_1.storage.getUserByUsername(req.body.username);
            if (existingUser) {
                return res.status(400).json({ error: 'Username already exists' });
            }
            // Ensure we have required fields for user creation
            const { username, password, email, address = '0x0000000000000000000000000000000000000000' } = req.body;
            const user = await storage_1.storage.createUser({
                username,
                password: await hashPassword(password),
                email,
                address,
                role: 'user'
            });
            req.login(user, (err) => {
                if (err)
                    return next(err);
                // Return user without password
                const { password, ...userWithoutPassword } = user;
                return res.status(201).json(userWithoutPassword);
            });
        }
        catch (error) {
            next(error);
        }
    });
    app.post('/api/login', (req, res, next) => {
        passport_1.default.authenticate('local', (err, user) => {
            if (err)
                return next(err);
            if (!user)
                return res.status(401).json({ error: 'Invalid credentials' });
            req.login(user, (loginErr) => {
                if (loginErr)
                    return next(loginErr);
                // Return user without password
                const { password, ...userWithoutPassword } = user;
                return res.status(200).json(userWithoutPassword);
            });
        })(req, res, next);
    });
    app.post('/api/logout', (req, res, next) => {
        req.logout((err) => {
            if (err)
                return next(err);
            res.status(200).json({ message: 'Logged out successfully' });
        });
    });
    app.get('/api/user', (req, res) => {
        if (!req.isAuthenticated()) {
            return res.status(401).json({ error: 'Not authenticated' });
        }
        // Return user without password
        const { password, ...userWithoutPassword } = req.user;
        return res.json(userWithoutPassword);
    });
}
//# sourceMappingURL=auth.js.map