const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET;
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  path: '/'
};

function generateSecureToken(userId, userEmail, userRole) {
  return jwt.sign(
    { userId, email: userEmail, role: userRole },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

function verifySecureToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

function secureAuthMiddleware(req, res, next) {
  const token = req.cookies?.auth_token;

  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required',
      message: 'No authentication token found'
    });
  }

  const decoded = verifySecureToken(token);

  if (!decoded) {
    res.clearCookie('auth_token', COOKIE_OPTIONS);
    return res.status(401).json({
      success: false,
      error: 'Invalid or expired token',
      message: 'Please log in again'
    });
  }

  req.user = {
    id: decoded.userId,
    email: decoded.email,
    role: decoded.role
  };

  next();
}

function optionalAuthMiddleware(req, res, next) {
  const token = req.cookies?.auth_token;

  if (token) {
    const decoded = verifySecureToken(token);
    if (decoded) {
      req.user = {
        id: decoded.userId,
        email: decoded.email,
        role: decoded.role
      };
    }
  }

  next();
}

module.exports = {
  generateSecureToken,
  verifySecureToken,
  secureAuthMiddleware,
  optionalAuthMiddleware,
  COOKIE_OPTIONS
};
