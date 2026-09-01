// backend/src/routes/score.routes.js
// Score submission routes - placeholder for feature 002

import { Router } from 'express';
import { requireAuth, userRateLimit } from '../middleware/auth.middleware.js';

export const scoreRoutes = Router();

// POST /api/scores - Submit score (auth required)
scoreRoutes.post('/', requireAuth, userRateLimit(30, 60000), (req, res) => {
  res.status(501).json({ error: 'Not implemented', feature: '002-score-submission' });
});

export default scoreRoutes;