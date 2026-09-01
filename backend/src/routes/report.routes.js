// backend/src/routes/report.routes.js
// Top players report routes - Feature 005

import { Router } from 'express';
import { optionalAuth } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { getTopPlayersReport } from '../controllers/report.controller.js';
import { getTopPlayersReportSchema } from '../schemas/report.schema.js';

export const reportRoutes = Router();

// GET /api/reports/top-players - Top players report
reportRoutes.get('/top-players', optionalAuth, validate(getTopPlayersReportSchema), getTopPlayersReport);

export default reportRoutes;