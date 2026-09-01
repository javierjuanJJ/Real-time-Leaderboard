// backend/src/routes/index.js
// Main route registration

import { Router } from 'express';
import { authRoutes } from './auth.routes.js';
import { scoreRoutes } from './score.routes.js';
import { leaderboardRoutes } from './leaderboard.routes.js';
import { rankingRoutes } from './ranking.routes.js';
import { reportRoutes } from './report.routes.js';
import { healthRoutes } from './health.routes.js';

export const routes = Router();

// Health checks (no auth)
routes.use('/health', healthRoutes);

// Auth routes
routes.use('/auth', authRoutes);

// Protected routes (require auth)
// Note: individual routes apply their own auth middleware
routes.use('/scores', scoreRoutes);
routes.use('/leaderboard', leaderboardRoutes);
routes.use('/rankings', rankingRoutes);
routes.use('/reports', reportRoutes);

// Future: WebSocket routes for real-time updates
// routes.use('/ws', websocketRoutes);

export default routes;