// backend/src/schemas/ranking.schema.js
// Zod validation schemas for ranking endpoints

import { z } from 'zod';

// GET /api/rankings/me/:gameId - Get current user's rank
export const getMyRankSchema = z.object({
  params: z.object({
    gameId: z.string().min(1, 'gameId is required').max(100),
  }),
});

// GET /api/rankings/:userId/:gameId - Get any user's rank
export const getUserRankSchema = z.object({
  params: z.object({
    userId: z.string().min(1, 'userId is required').max(100),
    gameId: z.string().min(1, 'gameId is required').max(100),
  }),
});

export default {
  getMyRankSchema,
  getUserRankSchema,
};