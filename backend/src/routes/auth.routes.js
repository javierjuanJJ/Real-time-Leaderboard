// backend/src/routes/auth.routes.js
// Authentication routes

import { Router } from 'express';
import { register, login, logout, refresh, me } from '../controllers/auth.controller.js';
import { validate } from '../middleware/validate.middleware.js';
import { registerSchema, loginSchema, refreshSchema, logoutSchema, meSchema } from '../schemas/auth.schema.js';
import { userRateLimit } from '../middleware/auth.middleware.js';

export const authRoutes = Router();

// Rate limit auth endpoints
const authLimiter = userRateLimit(5, 60000); // 5 req/min

// POST /api/auth/register
authRoutes.post('/register', authLimiter, validate(registerSchema), register);

// POST /api/auth/login
authRoutes.post('/login', authLimiter, validate(loginSchema), login);

// POST /api/auth/logout
authRoutes.post('/logout', validate(logoutSchema), logout);

// POST /api/auth/refresh
authRoutes.post('/refresh', validate(refreshSchema), refresh);

// GET /api/auth/me
authRoutes.get('/me', validate(meSchema), me);

export default authRoutes;