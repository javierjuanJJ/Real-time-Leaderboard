// backend/tests/rank-queries.test.js
// Rank Queries tests (Feature 008)

import { test, describe, before, after, mock } from 'node:test';
import assert from 'node:assert';

const mockPrisma = {
  game: {
    findUnique: mock.fn(),
  },
  user: {
    findUnique: mock.fn(),
  },
  score: {
    findUnique: mock.fn(),
    count: mock.fn(),
    findMany: mock.fn(),
  },
};

const mockRedis = {
  zadd: mock.fn(),
  zrem: mock.fn(),
  zcard: mock.fn(),
  zcount: mock.fn(),
  zrange: mock.fn(),
  zrevrange: mock.fn(),
  zrangebyscore: mock.fn(),
  zrevrangebyscore: mock.fn(),
  zincrby: mock.fn(),
  zrank: mock.fn(),
  zrevrank: mock.fn(),
  zscore: mock.fn(),
  exists: mock.fn(),
  pipeline: mock.fn(() => ({
    zrevrank: mock.fn(),
    zscore: mock.fn(),
    zcard: mock.fn(),
    zrevrange: mock.fn(),
    exec: mock.fn(),
    hmset: mock.fn(),
    expire: mock.fn(),
    hgetall: mock.fn(),
    incr: mock.fn(),
    pexpire: mock.fn(),
    zadd: mock.fn(),
  })),
  get: mock.fn(),
  setex: mock.fn(),
  hgetall: mock.fn(),
  hmset: mock.fn(),
  expire: mock.fn(),
  incr: mock.fn(),
  pexpire: mock.fn(),
  publish: mock.fn(),
  subscribe: mock.fn(),
  duplicate: mock.fn(() => ({
    subscribe: mock.fn(),
    on: mock.fn(),
    unsubscribe: mock.fn(),
  })),
  ping: mock.fn(),
  quit: mock.fn(),
  on: mock.fn(),
  status: 'ready',
};

const mockLeaderboard = {
  getRank: mock.fn(),
  getRankAsc: mock.fn(),
  getScore: mock.fn(),
  getTopPlayers: mock.fn(),
  getBottomPlayers: mock.fn(),
  getPlayersAroundRank: mock.fn(),
  getPlayersByScoreRange: mock.fn(),
  getPlayersByScoreRangeAsc: mock.fn(),
  getTotalPlayers: mock.fn(),
  removePlayer: mock.fn(),
  countInRange: mock.fn(),
  getPercentile: mock.fn(),
  getRankContext: mock.fn(),
  batchUpdateScores: mock.fn(),
  updateScoreAndGetRank: mock.fn(),
  exists: mock.fn(),
  zadd: mock.fn(),
  zrem: mock.fn(),
  zcard: mock.fn(),
  zcount: mock.fn(),
  zrange: mock.fn(),
  zrevrange: mock.fn(),
  zrangebyscore: mock.fn(),
  zrevrangebyscore: mock.fn(),
  zincrby: mock.fn(),
  zrank: mock.fn(),
  zrevrank: mock.fn(),
  zscore: mock.fn(),
};

const mockCache = {
  getUserScore: mock.fn(),
  setUserScore: mock.fn(),
  getUserProfile: mock.fn(),
  setUserProfile: mock.fn(),
  getUserProfiles: mock.fn(),
  incrementRateLimit: mock.fn(),
};

mock.module('../src/services/redis.service.js', {
  namedExports: {
    redis: mockRedis,
    leaderboard: mockLeaderboard,
    cache: mockCache,
    pubsub: {
      publishScoreUpdate: mock.fn(),
      subscribeToGame: mock.fn(),
      unsubscribe: mock.fn(),
    },
    connectRedis: mock.fn(),
    healthCheck: mock.fn(() => Promise.resolve({ healthy: true, latencyMs: 5 })),
    shutdownRedis: mock.fn(),
  },
});

mock.module('../src/lib/auth.js', {
  namedExports: {
    betterAuth: {
      api: {
        getSession: mock.fn(),
      },
    },
  },
});

mock.module('../server.js', {
  namedExports: {
    prisma: mockPrisma,
  },
});

let app;
let server;

describe('Rank Queries (Feature 008)', () => {
  before(async () => {
    process.env.NODE_ENV = 'test';
    const { app: importedApp } = await import('../app.js');
    app = importedApp;
    server = app.listen(0);
  });

  after(async () => {
    if (server) {
      await new Promise(resolve => server.close(resolve));
    }
  });

  describe('GET /api/rankings/me/:gameId', () => {
    test('returns rank, score, percentile, totalPlayers, nearbyPlayers when ranked', async () => {
      mockPrisma.game.findUnique.mock.mockImplementation(() => Promise.resolve({ id: 'game1', name: 'Game 1' }));
      mockPrisma.user.findUnique.mock.mockImplementation(() => Promise.resolve({ id: 'user1', name: 'Test User' }));
      mockLeaderboard.exists.mock.mockImplementation(() => Promise.resolve(true));
      mockLeaderboard.getRankContext.mock.mockImplementation(() => Promise.resolve({
        rank: 5,
        score: 1000,
        percentile: 95,
        totalPlayers: 100,
        nearbyPlayers: [
          { rank: 2, userId: 'user2', score: 1200 },
          { rank: 3, userId: 'user3', score: 1100 },
          { rank: 4, userId: 'user4', score: 1050 },
          { rank: 5, userId: 'user1', score: 1000 },
          { rank: 6, userId: 'user5', score: 950 },
          { rank: 7, userId: 'user6', score: 900 },
          { rank: 8, userId: 'user7', score: 850 },
        ],
      }));
      mockCache.getUserProfiles.mock.mockImplementation(() => Promise.resolve({}));
      
      const port = server.address().port;
      const response = await fetch(`http://localhost:${port}/api/rankings/me/game1`, {
        headers: { 'Authorization': 'Bearer valid-token' }
      });
      const data = await response.json();
      
      assert.strictEqual(response.status, 200);
      assert.strictEqual(data.rank, 5);
      assert.strictEqual(data.score, 1000);
      assert.strictEqual(data.percentile, 95);
      assert.strictEqual(data.totalPlayers, 100);
      assert.strictEqual(data.nearbyPlayers.length, 7);
      assert.strictEqual(data.source, 'redis');
    });

    test('returns rank: null when user has no score', async () => {
      mockPrisma.game.findUnique.mock.mockImplementation(() => Promise.resolve({ id: 'game1', name: 'Game 1' }));
      mockPrisma.user.findUnique.mock.mockImplementation(() => Promise.resolve({ id: 'user1', name: 'Test User' }));
      mockLeaderboard.exists.mock.mockImplementation(() => Promise.resolve(true));
      mockLeaderboard.getRankContext.mock.mockImplementation(() => Promise.resolve({
        rank: null,
        score: 0,
        percentile: 0,
        totalPlayers: 100,
        nearbyPlayers: [],
      }));
      mockCache.getUserProfiles.mock.mockImplementation(() => Promise.resolve({}));
      
      const port = server.address().port;
      const response = await fetch(`http://localhost:${port}/api/rankings/me/game1`, {
        headers: { 'Authorization': 'Bearer valid-token' }
      });
      const data = await response.json();
      
      assert.strictEqual(response.status, 200);
      assert.strictEqual(data.rank, null);
      assert.strictEqual(data.score, 0);
      assert.ok(data.message.includes('No score'));
    });
  });

  describe('GET /api/rankings/:userId/:gameId', () => {
    test('returns rank data for any user', async () => {
      mockPrisma.game.findUnique.mock.mockImplementation(() => Promise.resolve({ id: 'game1', name: 'Game 1' }));
      mockPrisma.user.findUnique.mock.mockImplementation(() => Promise.resolve({ id: 'user2', name: 'Other User' }));
      mockLeaderboard.exists.mock.mockImplementation(() => Promise.resolve(true));
      mockLeaderboard.getRankContext.mock.mockImplementation(() => Promise.resolve({
        rank: 1,
        score: 2000,
        percentile: 100,
        totalPlayers: 100,
        nearbyPlayers: [],
      }));
      mockCache.getUserProfiles.mock.mockImplementation(() => Promise.resolve({}));
      
      const port = server.address().port;
      const response = await fetch(`http://localhost:${port}/api/rankings/user2/game1`);
      const data = await response.json();
      
      assert.strictEqual(response.status, 200);
      assert.strictEqual(data.rank, 1);
      assert.strictEqual(data.score, 2000);
      assert.strictEqual(data.percentile, 100);
    });
  });
});