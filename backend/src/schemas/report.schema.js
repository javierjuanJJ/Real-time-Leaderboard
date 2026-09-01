// backend/src/schemas/report.schema.js
// Zod validation schemas for report endpoints

import { z } from 'zod';

// GET /api/reports/top-players - Get top players report
export const getTopPlayersReportSchema = z.object({
  query: z.object({
    gameId: z.string().min(1, 'gameId is required').max(100),
    period: z.enum(['daily', 'weekly', 'monthly', 'all', 'realtime']).default('realtime'),
    limit: z.coerce.number().int().min(1).max(1000).default(50),
    format: z.enum(['json', 'csv']).default('json'),
  }),
});

export default {
  getTopPlayersReportSchema,
};