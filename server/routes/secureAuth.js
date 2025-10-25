const express = require('express');
const bcrypt = require('bcrypt');
const { db } = require('../db');
const { users } = require('../../shared/schema');
const { eq } = require('drizzle-orm');
const { 
  generateSecureToken, 
  verifySecureToken,
  secureAuthMiddleware,
  COOKIE_OPTIONS 
} = require('../middleware/secureAuth');

const router = express.Router();

router.post('/register', async (req, res) => {
  try {
    const { firstName, lastName, email, password } = req.body;

    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({
        success: false,
        error: 'All fields are required'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'Password must be at least 6 characters'
      });
    }

    const existingUsers = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existingUsers.length > 0) {
      return res.status(409).json({
        success: false,
        error: 'Email already registered'
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const [newUser] = await db
      .insert(users)
      .values({
        firstName,
        lastName,
        email,
        password: hashedPassword,
        role: 'user',
        accountStatus: 'active',
        emailVerified: false
      })
      .returning({
        id: users.id,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        role: users.role
      });

    const token = generateSecureToken(newUser.id, newUser.email, newUser.role);

    res.cookie('auth_token', token, COOKIE_OPTIONS);

    return res.status(201).json({
      success: true,
      message: 'Registration successful',
      user: {
        id: newUser.id,
        email: newUser.email,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        role: newUser.role
      }
    });
  } catch (error) {
    console.error('❌ Secure registration error:', error);
    return res.status(500).json({
      success: false,
      error: 'Registration failed',
      message: 'An error occurred during registration'
    });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email/username and password are required'
      });
    }

    // Try to find user by email or username
    const { or } = require('drizzle-orm');
    const [user] = await db
      .select()
      .from(users)
      .where(or(
        eq(users.email, email),
        eq(users.username, email)
      ))
      .limit(1);

    if (!user || !user.password) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }

    if (user.accountStatus !== 'active') {
      return res.status(403).json({
        success: false,
        error: 'Account is not active',
        status: user.accountStatus
      });
    }

    await db
      .update(users)
      .set({
        lastLoginAt: new Date(),
        loginCount: (user.loginCount || 0) + 1
      })
      .where(eq(users.id, user.id));

    const token = generateSecureToken(user.id, user.email, user.role);

    res.cookie('auth_token', token, COOKIE_OPTIONS);

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        accountStatus: user.accountStatus
      }
    });
  } catch (error) {
    console.error('❌ Secure login error:', error);
    return res.status(500).json({
      success: false,
      error: 'Login failed',
      message: 'An error occurred during login'
    });
  }
});

router.post('/logout', (req, res) => {
  res.clearCookie('auth_token', COOKIE_OPTIONS);
  return res.status(200).json({
    success: true,
    message: 'Logged out successfully'
  });
});

router.get('/verify', secureAuthMiddleware, async (req, res) => {
  try {
    const [user] = await db
      .select({
        id: users.id,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        role: users.role,
        accountStatus: users.accountStatus
      })
      .from(users)
      .where(eq(users.id, req.user.id))
      .limit(1);

    if (!user) {
      res.clearCookie('auth_token', COOKIE_OPTIONS);
      return res.status(401).json({
        success: false,
        error: 'User not found'
      });
    }

    return res.status(200).json({
      success: true,
      user
    });
  } catch (error) {
    console.error('❌ Token verification error:', error);
    return res.status(500).json({
      success: false,
      error: 'Verification failed'
    });
  }
});

router.get('/session', secureAuthMiddleware, (req, res) => {
  return res.status(200).json({
    success: true,
    authenticated: true,
    user: req.user
  });
});

module.exports = router;
