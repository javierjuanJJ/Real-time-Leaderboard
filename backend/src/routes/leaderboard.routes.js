// backend/src/routes/leaderboard.routes.js
// Global leaderboard routes - placeholder for feature 003

import { Router } from 'express';
import { optionalAuth } from '../middleware/auth.middleware.js';

export const leaderboardRoutes = Router();

// GET /api/leaderboard/:gameId - Global leaderboard
leaderboardRoutes.get('/:gameId', optionalAuth, (req, res) => {
  res.status(501).json({ error: 'Not implemented', feature: '003-leaderboard-updates' });
});

export default leaderboardRoutes;