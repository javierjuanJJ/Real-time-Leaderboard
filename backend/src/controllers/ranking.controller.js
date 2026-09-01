// backend/src/controllers/ranking.controller.js
// User ranking controller - Feature 004

import { prisma } from '../../server.js';
import { leaderboard, cache } from '../services/redis.service.js';
import { asyncHandler } from '../middleware/error.middleware.js';
import { NotFoundError } from '../middleware/error.middleware.js';

async function getUserProfile(userId) {
  const [user, cachedProfile] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, image: true }
    }),
    cache.getUserProfile(userId)
  ]);
  
  if (user) return user;
  if (cachedProfile) return cachedProfile;
  return { id: userId, name: `User_${userId.slice(0, 8)}`, image: null };
}

async function getRankContext(gameId, userId) {
  const rank = await leaderboard.getRank(gameId, userId);
  
  if (rank === null) {
    const score = await leaderboard.getScore(gameId, userId);
    if (score === null) {
      return { rank: null, score: 0, percentile: 0, totalPlayers: 0, nearbyPlayers: [], source: 'redis' };
    }
    // Has score but no rank? shouldn't happen, but handle it
  }
  
  const score = await leaderboard.getScore(gameId, userId);
  const totalPlayers = await leaderboard.getTotalPlayers(gameId);
  const percentile = totalPlayers > 0 ? Math.round((1 - rank / totalPlayers) * 100) : 0;
  
  // Get nearby players (3 above, 3 below)
  const range = 3;
  const nearby = await leaderboard.getPlayersAroundRank(gameId, rank, range);
  const enrichedNearby = await enrichPlayers(nearby);
  
  return {
    rank,
    score,
    percentile,
    totalPlayers,
    nearbyPlayers: enrichedNearby,
    source: 'redis'
  };
}

async function getRankContextFromPostgreSQL(gameId, userId) {
  const scoreRecord = await prisma.score.findUnique({
    where: { userId_gameId: { userId, gameId } }
  });
  
  if (!scoreRecord) {
    return { rank: null, score: 0, percentile: 0, totalPlayers: 0, nearbyPlayers: [], source: 'postgresql' };
  }
  
  const higherScores = await prisma.score.count({
    where: { gameId, value: { gt: scoreRecord.value } }
  });
  
  const sameScoreEarlier = await prisma.score.count({
    where: { gameId, value: scoreRecord.value, updatedAt: { lt: scoreRecord.updatedAt } }
  });
  
  const rank = higherScores + sameScoreEarlier + 1;
  const totalPlayers = await prisma.score.count({ where: { gameId } });
  const percentile = totalPlayers > 0 ? Math.round((1 - rank / totalPlayers) * 100) : 0;
  
  // Get nearby players from PostgreSQL
  const nearbyScores = await prisma.score.findMany({
    where: { gameId },
    orderBy: [
      { value: 'desc' },
      { updatedAt: 'asc' }
    ],
    take: 7, // rank-3 to rank+3
    skip: Math.max(0, rank - 4)
  });
  
  const enrichedNearby = await enrichPlayers(
    nearbyScores.map((s, i) => ({
      rank: Math.max(1, rank - 3) + i,
      userId: s.userId,
      score: s.value
    }))
  );
  
  return {
    rank,
    score: scoreRecord.value,
    percentile,
    totalPlayers,
    nearbyPlayers: enrichedNearby,
    source: 'postgresql'
  };
}

async function enrichPlayers(players) {
  if (!players.length) return [];
  
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

export const getMyRank = asyncHandler(async (req, res) => {
  const { gameId } = req.params;
  const userId = req.user.id;
  
  const game = await prisma.game.findUnique({
    where: { id: gameId },
    select: { id: true, name: true }
  });
  
  if (!game) {
    throw new NotFoundError('Game not found');
  }
  
  const exists = await leaderboard.exists(gameId);
  let context;
  
  if (exists) {
    context = await getRankContext(gameId, userId);
  } else {
    context = await getRankContextFromPostgreSQL(gameId, userId);
  }
  
  const profile = await getUserProfile(userId);
  
  if (context.rank === null) {
    return res.json({
      game: { id: game.id, name: game.name },
      user: { id: userId, name: profile.name, image: profile.image },
      rank: null,
      score: 0,
      percentile: 0,
      totalPlayers: context.totalPlayers,
      message: 'No score submitted yet',
      nearbyPlayers: [],
      source: context.source
    });
  }
  
  res.json({
    game: { id: game.id, name: game.name },
    user: { id: userId, name: profile.name, image: profile.image },
    ...context
  });
});

export const getUserRank = asyncHandler(async (req, res) => {
  const { userId, gameId } = req.params;
  
  const game = await prisma.game.findUnique({
    where: { id: gameId },
    select: { id: true, name: true }
  });
  
  if (!game) {
    throw new NotFoundError('Game not found');
  }
  
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, image: true }
  });
  
  if (!user) {
    throw new NotFoundError('User not found');
  }
  
  const exists = await leaderboard.exists(gameId);
  let context;
  
  if (exists) {
    context = await getRankContext(gameId, userId);
  } else {
    context = await getRankContextFromPostgreSQL(gameId, userId);
  }
  
  if (context.rank === null) {
    return res.json({
      game: { id: game.id, name: game.name },
      user: { id: userId, name: user.name, image: user.image },
      rank: null,
      score: 0,
      percentile: 0,
      totalPlayers: context.totalPlayers,
      nearbyPlayers: [],
      source: context.source
    });
  }
  
  res.json({
    game: { id: game.id, name: game.name },
    user: { id: userId, name: user.name, image: user.image },
    ...context
  });
});

export default { getMyRank, getUserRank };