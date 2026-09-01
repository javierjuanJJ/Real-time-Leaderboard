// backend/src/routes/score.routes.js
// Score submission routes - Feature 002

import { Router } from 'express';
import { requireAuth, userRateLimit } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { submitScore, getUserScores } from '../controllers/score.controller.js';
import { submitScoreSchema, getUserScoresSchema } from '../schemas/score.schema.js';

export const scoreRoutes = Router();

// POST /api/scores - Submit score (auth required)
scoreRoutes.post('/', requireAuth, userRateLimit(30, 60000), validate(submitScoreSchema), submitScore);

// GET /api/scores/:gameId - Get user's score history for a game (auth required)
scoreRoutes.get('/:gameId', requireAuth, validate(getUserScoresSchema), getUserScores);

export default scoreRoutes;