// backend/tests/leaderboard.test.js
// Leaderboard tests using node:test

import { test, describe, before, after, mock } from 'node:test';
import assert from 'node:assert';

const mockPrisma = {
  game: {
    findUnique: mock.fn(),
  },
  score: {
    findMany: mock.fn(),
    count: mock.fn(),
  },
};

const mockRedis = {
  leaderboard: {
    getTopPlayers: mock.fn(),
    getTotalPlayers: mock.fn(),
    exists: mock.fn(),
  },
  cache: {
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

describe('Global Leaderboard (Feature 003)', () => {
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

  describe('GET /api/leaderboard/:gameId', () => {
    test('returns 404 for invalid gameId', async () => {
      mockPrisma.game.findUnique.mock.mockImplementation(() => Promise.resolve(null));
      mockRedis.leaderboard.exists.mock.mockImplementation(() => Promise.resolve(false));
      
      const port = server.address().port;
      const response = await fetch(`http://localhost:${port}/api/leaderboard/invalid`);
      
      assert.strictEqual(response.status, 404);
    });

    test('returns empty leaderboard when no scores', async () => {
      mockPrisma.game.findUnique.mock.mockImplementation(() => Promise.resolve({ id: 'game1', name: 'Game 1' }));
      mockRedis.leaderboard.exists.mock.mockImplementation(() => Promise.resolve(true));
      mockRedis.leaderboard.getTopPlayers.mock.mockImplementation(() => Promise.resolve([]));
      mockRedis.leaderboard.getTotalPlayers.mock.mockImplementation(() => Promise.resolve(0));
      mockRedis.cache.getUserProfiles.mock.mockImplementation(() => Promise.resolve({}));
      
      const port = server.address().port;
      const response = await fetch(`http://localhost:${port}/api/leaderboard/game1`);
      const data = await response.json();
      
      assert.strictEqual(response.status, 200);
      assert.strictEqual(data.leaderboard.length, 0);
      assert.strictEqual(data.pagination.total, 0);
    });
  });
});