// backend/src/schemas/leaderboard.schema.js
// Zod validation schemas for leaderboard endpoints

import { z } from 'zod';

// GET /api/leaderboard/:gameId - Get global leaderboard
export const getLeaderboardSchema = z.object({
  params: z.object({
    gameId: z.string().min(1, 'gameId is required').max(100),
  }),
  query: z.object({
    limit: z.coerce.number().int().min(1).max(100).default(50),
    offset: z.coerce.number().int().min(0).default(0),
  }),
});

export default {
  getLeaderboardSchema,
};