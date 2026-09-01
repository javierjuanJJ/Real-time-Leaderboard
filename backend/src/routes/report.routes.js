// backend/src/routes/report.routes.js
// Top players report routes - placeholder for feature 005

import { Router } from 'express';
import { optionalAuth } from '../middleware/auth.middleware.js';

export const reportRoutes = Router();

// GET /api/reports/top-players - Top players report
reportRoutes.get('/top-players', optionalAuth, (req, res) => {
  res.status(501).json({ error: 'Not implemented', feature: '005-top-players-report' });
});

export default reportRoutes;