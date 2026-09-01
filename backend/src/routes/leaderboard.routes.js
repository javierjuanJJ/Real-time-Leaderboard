// backend/src/routes/leaderboard.routes.js
// Global leaderboard routes - Feature 003

import { Router } from 'express';
import { optionalAuth } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { getLeaderboard } from '../controllers/leaderboard.controller.js';
import { getLeaderboardSchema } from '../schemas/leaderboard.schema.js';

export const leaderboardRoutes = Router();

// GET /api/leaderboard/:gameId - Global leaderboard
leaderboardRoutes.get('/:gameId', optionalAuth, validate(getLeaderboardSchema), getLeaderboard);

export default leaderboardRoutes;