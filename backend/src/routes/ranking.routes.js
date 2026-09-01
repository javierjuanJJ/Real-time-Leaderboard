// backend/src/routes/ranking.routes.js
// User ranking routes - Feature 004

import { Router } from 'express';
import { requireAuth, optionalAuth } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { getMyRank, getUserRank } from '../controllers/ranking.controller.js';
import { getMyRankSchema, getUserRankSchema } from '../schemas/ranking.schema.js';

export const rankingRoutes = Router();

// GET /api/rankings/me/:gameId - Current user's rank (auth required)
rankingRoutes.get('/me/:gameId', requireAuth, validate(getMyRankSchema), getMyRank);

// GET /api/rankings/:userId/:gameId - Any user's rank (public)
rankingRoutes.get('/:userId/:gameId', optionalAuth, validate(getUserRankSchema), getUserRank);

export default rankingRoutes;