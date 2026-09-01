// backend/src/controllers/report.controller.js
// Top players report controller - Feature 005

import { prisma } from '../../server.js';
import { leaderboard, cache } from '../services/redis.service.js';
import { asyncHandler } from '../middleware/error.middleware.js';
import { NotFoundError, BadRequestError } from '../middleware/error.middleware.js';

function getPeriodDateRange(period) {
  const now = new Date();
  
  switch (period) {
    case 'daily':
      return new Date(now.getTime() - 24 * 60 * 60 * 1000);
    case 'weekly':
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    case 'monthly':
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    case 'all':
      return null; // No date filter
    case 'realtime':
      return 'realtime';
    default:
      return null;
  }
}

async function enrichReportPlayers(players) {
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
  
  return players.map((player, index) => {
    const user = userMap.get(player.userId);
    const profile = profileMap[player.userId];
    const username = user?.name || profile?.name || `User_${player.userId.slice(0, 8)}`;
    
    return {
      rank: index + 1,
      userId: player.userId,
      username,
      userImage: user?.image || profile?.image || null,
      score: player.score,
      period: player.period,
      submittedAt: player.submittedAt
    };
  });
}

function generateCSV(report) {
  const headers = ['rank', 'userId', 'username', 'score', 'period', 'submittedAt'];
  const rows = report.players.map(p => 
    [p.rank, p.userId, p.username, p.score, p.period, p.submittedAt].join(',')
  );
  return [headers.join(','), ...rows].join('\n');
}

export const getTopPlayersReport = asyncHandler(async (req, res) => {
  const { gameId, period = 'realtime', limit = 50, format = 'json' } = req.query;
  
  const game = await prisma.game.findUnique({
    where: { id: gameId },
    select: { id: true, name: true }
  });
  
  if (!game) {
    throw new NotFoundError('Game not found');
  }
  
  let players = [];
  let periodLabel = period;
  
  if (period === 'realtime') {
    // Real-time from Redis
    const topPlayers = await leaderboard.getTopPlayers(gameId, limit, 0);
    players = topPlayers.map(p => ({
      ...p,
      period: 'realtime',
      submittedAt: new Date().toISOString()
    }));
    periodLabel = 'realtime';
  } else {
    // Historical from PostgreSQL
    const startDate = getPeriodDateRange(period);
    
    const whereClause = { gameId };
    if (startDate) {
      whereClause.createdAt = { gte: startDate };
    }
    
    // Get highest score per user in the period
    const scores = await prisma.$queryRaw`
      SELECT s."userId", MAX(s.value) as score, MAX(s."updatedAt") as "submittedAt"
      FROM "Score" s
      WHERE s."gameId" = ${gameId}
      ${startDate ? `AND s."createdAt" >= ${startDate}` : ''}
      GROUP BY s."userId"
      ORDER BY score DESC, "submittedAt" ASC
      LIMIT ${limit}
    `;
    
    players = scores.map(s => ({
      userId: s.userId,
      score: Number(s.score),
      period: periodLabel,
      submittedAt: s.submittedAt.toISOString()
    }));
  }
  
  const enrichedPlayers = await enrichReportPlayers(players);
  
  const report = {
    game: { id: game.id, name: game.name },
    period: periodLabel,
    generatedAt: new Date().toISOString(),
    players: enrichedPlayers,
    totalPlayers: enrichedPlayers.length
  };
  
  if (format === 'csv') {
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="top-players-${gameId}-${periodLabel}.csv"`);
    return res.send(generateCSV(report));
  }
  
  res.json(report);
});

export default { getTopPlayersReport };