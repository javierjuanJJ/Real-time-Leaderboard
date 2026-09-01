// backend/src/routes/ranking.routes.js
// User ranking routes - placeholder for feature 004

import { Router } from 'express';
import { requireAuth, optionalAuth } from '../middleware/auth.middleware.js';

export const rankingRoutes = Router();

// GET /api/rankings/me/:gameId - Current user's rank (auth required)
rankingRoutes.get('/me/:gameId', requireAuth, (req, res) => {
  res.status(501).json({ error: 'Not implemented', feature: '004-user-rankings' });
});

// GET /api/rankings/:userId/:gameId - Any user's rank (public)
rankingRoutes.get('/:userId/:gameId', optionalAuth, (req, res) => {
  res.status(501).json({ error: 'Not implemented', feature: '004-user-rankings' });
});

export default rankingRoutes;