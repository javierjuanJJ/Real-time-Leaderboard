// backend/src/schemas/score.schema.js
// Zod validation schemas for score submission

import { z } from 'zod';

// POST /api/scores - Submit score
export const submitScoreSchema = z.object({
  body: z.object({
    gameId: z.string().min(1, 'gameId is required').max(100),
    score: z.number().int().min(0, 'Score must be non-negative').max(2147483647, 'Score exceeds maximum'),
  }),
});

// GET /api/scores/:gameId - Get user's score history for a game
export const getUserScoresSchema = z.object({
  params: z.object({
    gameId: z.string().min(1, 'gameId is required').max(100),
  }),
  query: z.object({
    limit: z.coerce.number().int().min(1).max(100).default(20),
    offset: z.coerce.number().int().min(0).default(0),
  }),
});

export default {
  submitScoreSchema,
  getUserScoresSchema,
};