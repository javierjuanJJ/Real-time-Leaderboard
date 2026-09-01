// backend/src/middleware/auth.middleware.js
// Authentication middleware using Better-Auth

import { betterAuth } from '../lib/auth.js';
import { UnauthorizedError } from './error.middleware.js';

// Middleware to require authentication
export async function requireAuth(req, res, next) {
  try {
    // Get token from Authorization header or cookie
    const authHeader = req.headers.authorization;
    let token = null;
    
    if (authHeader?.startsWith('Bearer ')) {
      token = authHeader.slice(7);
    } else if (req.cookies?.access_token) {
      token = req.cookies.access_token;
    }
    
    if (!token) {
      throw new UnauthorizedError('No authentication token provided');
    }
    
    // Verify token with Better-Auth
    const session = await betterAuth.api.getSession({
      headers: { authorization: `Bearer ${token}` }
    });
    
    if (!session?.user) {
      throw new UnauthorizedError('Invalid or expired token');
    }
    
    // Attach user to request
    req.user = session.user;
    req.session = session.session;
    next();
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      return res.status(401).json({ error: err.message, code: err.code });
    }
    return res.status(401).json({ error: 'Authentication failed', code: 'UNAUTHORIZED' });
  }
}

// Optional auth - attaches user if token present but doesn't require it
export async function optionalAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    let token = null;
    
    if (authHeader?.startsWith('Bearer ')) {
      token = authHeader.slice(7);
    } else if (req.cookies?.access_token) {
      token = req.cookies.access_token;
    }
    
    if (token) {
      const session = await betterAuth.api.getSession({
        headers: { authorization: `Bearer ${token}` }
      });
      if (session?.user) {
        req.user = session.user;
        req.session = session.session;
      }
    }
    next();
  } catch {
    // Ignore auth errors for optional auth
    next();
  }
}

// Rate limiting per user
const userRateLimits = new Map();

export function userRateLimit(maxRequests = 30, windowMs = 60000) {
  return (req, res, next) => {
    if (!req.user?.id) return next();
    
    const key = `ratelimit:${req.user.id}`;
    const now = Date.now();
    const windowStart = now - windowMs;
    
    if (!userRateLimits.has(key)) {
      userRateLimits.set(key, []);
    }
    
    const requests = userRateLimits.get(key).filter(t => t > windowStart);
    requests.push(now);
    userRateLimits.set(key, requests);
    
    if (requests.length > maxRequests) {
      return res.status(429).json({
        error: 'Rate limit exceeded',
        code: 'RATE_LIMIT_EXCEEDED',
        retryAfter: Math.ceil((requests[0] + windowMs - now) / 1000)
      });
    }
    
    res.setHeader('X-RateLimit-Remaining', maxRequests - requests.length);
    next();
  };
}