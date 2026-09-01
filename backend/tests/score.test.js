// backend/tests/score.test.js
// Score submission tests using node:test

import { test, describe, before, after, mock } from 'node:test';
import assert from 'node:assert';

// Mock Prisma
const mockPrisma = {
  game: {
    findUnique: mock.fn(),
  },
  score: {
    findUnique: mock.fn(),
    upsert: mock.fn(),
    findMany: mock.fn(),
    count: mock.fn(),
  },
};

// Mock Redis service
const mockRedis = {
  leaderboard: {
    getRank: mock.fn(),
    getTotalPlayers: mock.fn(),
    updateScoreIfHigher: mock.fn(),
    exists: mock.fn(),
  },
  cache: {
    setUserScore: mock.fn(),
    setUserProfile: mock.fn(),
    getUserProfiles: mock.fn(),
  },
};

// Mock betterAuth
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

describe('Score Submission (Feature 002)', () => {
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

  describe('POST /api/scores', () => {
    test('returns 401 without authentication', async () => {
      const port = server.address().port;
      const response = await fetch(`http://localhost:${port}/api/scores`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gameId: 'game1', score: 100 }),
      });
      
      assert.strictEqual(response.status, 401);
    });

    test('returns 404 for invalid gameId', async () => {
      mockPrisma.game.findUnique.mock.mockImplementation(() => Promise.resolve(null));
      
      const port = server.address().port;
      const response = await fetch(`http://localhost:${port}/api/scores`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': 'Bearer valid-token'
        },
        body: JSON.stringify({ gameId: 'invalid', score: 100 }),
      });
      
      assert.strictEqual(response.status, 404);
    });

    test('returns 400 for invalid score', async () => {
      const port = server.address().port;
      const response = await fetch(`http://localhost:${port}/api/scores`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': 'Bearer valid-token'
        },
        body: JSON.stringify({ gameId: 'game1', score: -10 }),
      });
      
      assert.strictEqual(response.status, 400);
    });
  });

  describe('GET /api/scores/:gameId', () => {
    test('returns 401 without authentication', async () => {
      const port = server.address().port;
      const response = await fetch(`http://localhost:${port}/api/scores/game1`);
      assert.strictEqual(response.status, 401);
    });
  });
});