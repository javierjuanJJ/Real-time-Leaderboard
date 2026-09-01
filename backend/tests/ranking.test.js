// backend/tests/ranking.test.js
// Ranking tests using node:test

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
  leaderboard: {
    getRank: mock.fn(),
    getScore: mock.fn(),
    getTotalPlayers: mock.fn(),
    getPlayersAroundRank: mock.fn(),
    exists: mock.fn(),
  },
  cache: {
    getUserProfile: mock.fn(),
    getUserProfiles: mock.fn(),
  },
};

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

mock.module('../src/services/redis.service.js', {
  namedExports: {
    leaderboard: mockRedis.leaderboard,
    cache: mockRedis.cache,
  },
});

let app;
let server;

describe('User Rankings (Feature 004)', () => {
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
    test('returns 401 without authentication', async () => {
      const port = server.address().port;
      const response = await fetch(`http://localhost:${port}/api/rankings/me/game1`);
      assert.strictEqual(response.status, 401);
    });

    test('returns 404 for invalid gameId', async () => {
      mockPrisma.game.findUnique.mock.mockImplementation(() => Promise.resolve(null));
      mockRedis.leaderboard.exists.mock.mockImplementation(() => Promise.resolve(false));
      
      const port = server.address().port;
      const response = await fetch(`http://localhost:${port}/api/rankings/me/game1`, {
        headers: { 'Authorization': 'Bearer valid-token' }
      });
      
      assert.strictEqual(response.status, 404);
    });

    test('returns rank: null when user has no score', async () => {
      mockPrisma.game.findUnique.mock.mockImplementation(() => Promise.resolve({ id: 'game1', name: 'Game 1' }));
      mockPrisma.user.findUnique.mock.mockImplementation(() => Promise.resolve({ id: 'user1', name: 'Test User' }));
      mockRedis.leaderboard.exists.mock.mockImplementation(() => Promise.resolve(true));
      mockRedis.leaderboard.getRank.mock.mockImplementation(() => Promise.resolve(null));
      mockRedis.leaderboard.getTotalPlayers.mock.mockImplementation(() => Promise.resolve(10));
      mockRedis.leaderboard.getPlayersAroundRank.mock.mockImplementation(() => Promise.resolve([]));
      mockRedis.cache.getUserProfiles.mock.mockImplementation(() => Promise.resolve({}));
      
      const port = server.address().port;
      const response = await fetch(`http://localhost:${port}/api/rankings/me/game1`, {
        headers: { 'Authorization': 'Bearer valid-token' }
      });
      const data = await response.json();
      
      assert.strictEqual(response.status, 200);
      assert.strictEqual(data.rank, null);
      assert.strictEqual(data.score, 0);
    });
  });

  describe('GET /api/rankings/:userId/:gameId', () => {
    test('returns 404 for invalid gameId', async () => {
      mockPrisma.game.findUnique.mock.mockImplementation(() => Promise.resolve(null));
      
      const port = server.address().port;
      const response = await fetch(`http://localhost:${port}/api/rankings/user1/invalid`);
      
      assert.strictEqual(response.status, 404);
    });

    test('returns 404 for invalid userId', async () => {
      mockPrisma.game.findUnique.mock.mockImplementation(() => Promise.resolve({ id: 'game1', name: 'Game 1' }));
      mockPrisma.user.findUnique.mock.mockImplementation(() => Promise.resolve(null));
      
      const port = server.address().port;
      const response = await fetch(`http://localhost:${port}/api/rankings/invalid/game1`);
      
      assert.strictEqual(response.status, 404);
    });
  });
});