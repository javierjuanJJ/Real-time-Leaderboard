// backend/src/controllers/leaderboard.controller.js
// Global leaderboard controller - Feature 003

import { prisma } from '../../server.js';
import { leaderboard, cache } from '../services/redis.service.js';
import { asyncHandler } from '../middleware/error.middleware.js';
import { NotFoundError } from '../middleware/error.middleware.js';

async function enrichLeaderboardPlayers(players) {
  if (!players.length) return players;
  
  const userIds = players.map(p => p.userId);
  
  const [users, cachedProfiles] = await Promise.all([
    prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true, image: true }
    }),
    cache.getUserProfiles(userIds)
  ]);
  
  const userMap = new Map(users.map(u => [u.id, u]));
  const profileMap = cachedProfiles;
  
  return players.map(player => {
    const user = userMap.get(player.userId);
    const profile = profileMap[player.userId];
    const username = user?.name || profile?.name || `User_${player.userId.slice(0, 8)}`;
    
    return {
      ...player,
      username,
      userImage: user?.image || profile?.image || null
    };
  });
}

export const getLeaderboard = asyncHandler(async (req, res) => {
  const { gameId } = req.params;
  const { limit = 50, offset = 0 } = req.query;
  
  // Verify game exists
  const game = await prisma.game.findUnique({
    where: { id: gameId },
    select: { id: true, name: true }
  });
  
  if (!game) {
    throw new NotFoundError('Game not found');
  }
  
  // Check if leaderboard exists in Redis
  const exists = await leaderboard.exists(gameId);
  
  let players = [];
  let totalPlayers = 0;
  let source = 'redis';
  
  if (exists) {
    players = await leaderboard.getTopPlayers(gameId, limit, offset);
    totalPlayers = await leaderboard.getTotalPlayers(gameId);
  } else {
    // Fallback to PostgreSQL
    source = 'postgresql';
    const scores = await prisma.score.findMany({
      where: { gameId },
      orderBy: { value: 'desc' },
      take: limit,
      skip: offset
    });
    
    totalPlayers = await prisma.score.count({ where: { gameId } });
    
    players = scores.map((score, index) => ({
      rank: offset + index + 1,
      userId: score.userId,
      score: score.value,
      updatedAt: score.updatedAt.toISOString()
    }));
    
    // Rebuild Redis in background (fire and forget)
    rebuildLeaderboardFromPostgreSQL(gameId);
  }
  
  // Enrich with user profiles
  const enrichedPlayers = await enrichLeaderboardPlayers(players);
  
  res.json({
    game: { id: game.id, name: game.name },
    leaderboard: enrichedPlayers,
    pagination: {
      total: totalPlayers,
      limit: Number(limit),
      offset: Number(offset),
      hasMore: Number(offset) + Number(limit) < totalPlayers
    },
    source
  });
});

async function rebuildLeaderboardFromPostgreSQL(gameId) {
  try {
    const scores = await prisma.score.findMany({
      where: { gameId },
      orderBy: { value: 'desc' },
      select: { userId: true, value: true }
    });
    
    if (scores.length > 0) {
      const pipeline = scores.map(s => ({ gameId, userId: s.userId, score: s.value }));
      await leaderboard.batchUpdateScores(pipeline);
    }
  } catch (error) {
    console.error('Background leaderboard rebuild failed:', error);
  }
}

export default { getLeaderboard };