// backend/src/controllers/score.controller.js
// Score submission controller - Feature 002

import { prisma } from '../../server.js';
import { leaderboard, cache } from '../services/redis.service.js';
import { asyncHandler } from '../middleware/error.middleware.js';
import { NotFoundError, BadRequestError } from '../middleware/error.middleware.js';

function enrichPlayersWithProfiles(players) {
  if (!players.length) return Promise.resolve(players);
  
  const userIds = players.map(p => p.userId);
  
  return Promise.all([
    prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true, image: true }
    }),
    cache.getUserProfiles(userIds)
  ]).then(([users, cachedProfiles]) => {
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
  });
}

export const submitScore = asyncHandler(async (req, res) => {
  const { gameId, score } = req.body;
  const userId = req.user.id;
  
  // Verify game exists
  const game = await prisma.game.findUnique({
    where: { id: gameId },
    select: { id: true, name: true }
  });
  
  if (!game) {
    throw new NotFoundError('Game not found');
  }
  
  // Get current best score from PostgreSQL
  const existingScore = await prisma.score.findUnique({
    where: { userId_gameId: { userId, gameId } }
  });
  
  const isNewScore = !existingScore;
  const isImprovement = !existingScore || score > existingScore.value;
  
  if (!isImprovement) {
    // Score not improved - return current best
    const currentRank = await leaderboard.getRank(gameId, userId);
    const totalPlayers = await leaderboard.getTotalPlayers(gameId);
    
    return res.status(200).json({
      message: 'Score not improved',
      score: existingScore.value,
      rank: currentRank,
      totalPlayers,
      isNewRecord: false,
      submittedAt: existingScore.updatedAt.toISOString()
    });
  }
  
  // Update PostgreSQL (source of truth)
  const updatedScore = await prisma.score.upsert({
    where: { userId_gameId: { userId, gameId } },
    update: { value: score },
    create: { userId, gameId, value: score }
  });
  
  // Update Redis Sorted Set (only if higher)
  const redisResult = await leaderboard.updateScoreIfHigher(gameId, userId, score);
  
  // Get new rank
  const newRank = await leaderboard.getRank(gameId, userId);
  const totalPlayers = await leaderboard.getTotalPlayers(gameId);
  
  // Cache user score
  await cache.setUserScore(userId, gameId, score);
  
  // Cache user profile for leaderboard enrichment
  await cache.setUserProfile(userId, {
    name: req.user.name || `User_${userId.slice(0, 8)}`,
    image: req.user.image || null
  });
  
  const statusCode = isNewScore ? 201 : 200;
  
  res.status(statusCode).json({
    message: isNewScore ? 'Score submitted' : 'Score improved',
    score,
    rank: newRank,
    totalPlayers,
    isNewRecord: isNewScore,
    submittedAt: updatedScore.updatedAt.toISOString()
  });
});

export const getUserScores = asyncHandler(async (req, res) => {
  const { gameId } = req.params;
  const { limit, offset } = req.query;
  const userId = req.user.id;
  
  const game = await prisma.game.findUnique({
    where: { id: gameId },
    select: { id: true }
  });
  
  if (!game) {
    throw new NotFoundError('Game not found');
  }
  
  const scores = await prisma.score.findMany({
    where: { userId, gameId },
    orderBy: { createdAt: 'desc' },
    take: limit,
    skip: offset
  });
  
  const total = await prisma.score.count({ where: { userId, gameId } });
  
  res.json({
    scores: scores.map(s => ({
      score: s.value,
      submittedAt: s.createdAt.toISOString(),
      updatedAt: s.updatedAt.toISOString()
    })),
    pagination: { total, limit, offset, hasMore: offset + limit < total }
  });
});

export default { submitScore, getUserScores };