// backend/tests/report.test.js
// Report tests using node:test

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
  $queryRaw: mock.fn(),
};

const mockRedis = {
  leaderboard: {
    getTopPlayers: mock.fn(),
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

describe('Top Players Report (Feature 005)', () => {
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

  describe('GET /api/reports/top-players', () => {
    test('returns 404 for invalid gameId', async () => {
      mockPrisma.game.findUnique.mock.mockImplementation(() => Promise.resolve(null));
      
      const port = server.address().port;
      const response = await fetch(`http://localhost:${port}/api/reports/top-players?gameId=invalid`);
      
      assert.strictEqual(response.status, 404);
    });

    test('returns 400 for invalid period', async () => {
      mockPrisma.game.findUnique.mock.mockImplementation(() => Promise.resolve({ id: 'game1', name: 'Game 1' }));
      
      const port = server.address().port;
      const response = await fetch(`http://localhost:${port}/api/reports/top-players?gameId=game1&period=invalid`);
      
      assert.strictEqual(response.status, 400);
    });

    test('returns realtime leaderboard when period=realtime', async () => {
      mockPrisma.game.findUnique.mock.mockImplementation(() => Promise.resolve({ id: 'game1', name: 'Game 1' }));
      mockRedis.leaderboard.getTopPlayers.mock.mockImplementation(() => Promise.resolve([
        { rank: 1, userId: 'user1', score: 1000 },
        { rank: 2, userId: 'user2', score: 900 },
      ]));
      mockRedis.cache.getUserProfiles.mock.mockImplementation(() => Promise.resolve({}));
      
      const port = server.address().port;
      const response = await fetch(`http://localhost:${port}/api/reports/top-players?gameId=game1&period=realtime&limit=10`);
      const data = await response.json();
      
      assert.strictEqual(response.status, 200);
      assert.strictEqual(data.period, 'realtime');
      assert.strictEqual(data.players.length, 2);
    });

    test('returns CSV format when requested', async () => {
      mockPrisma.game.findUnique.mock.mockImplementation(() => Promise.resolve({ id: 'game1', name: 'Game 1' }));
      mockRedis.leaderboard.getTopPlayers.mock.mockImplementation(() => Promise.resolve([
        { rank: 1, userId: 'user1', score: 1000 },
      ]));
      mockRedis.cache.getUserProfiles.mock.mockImplementation(() => Promise.resolve({}));
      
      const port = server.address().port;
      const response = await fetch(`http://localhost:${port}/api/reports/top-players?gameId=game1&period=realtime&format=csv`);
      
      assert.strictEqual(response.status, 200);
      assert.ok(response.headers.get('content-type').includes('text/csv'));
    });
  });
});