// backend/tests/leaderboard.test.js
// Leaderboard tests using node:test

import { test, describe, before, after } from 'node:test';
import assert from 'assert';

// v24 compat
const mockFromTest = await import('node:test');
mockFromTest.mock.module = () => {};

// Set up env
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'postgresql://postgres:postgres@localhost:5432/leaderboard?schema=public';
process.env.REDIS_HOST = 'localhost';
process.env.REDIS_PORT = '6379';
process.env.BETTER_AUTH_SECRET = 'test-secret-key-at-least-32-chars';

import { app } from '../app.js';

describe('Global Leaderboard (Feature 003)', () => {
  before(async () => {
    process.env.NODE_ENV = 'test';
  });

  after(async () => {
    // Clean up any remaining servers
  });

  describe('GET /api/leaderboard/:gameId', () => {
    test('returns 404 for invalid gameId', async () => {
      const server = app.listen(0);
      const closeServer = () => new Promise(resolve => server.close(resolve));
      
      try {
        const port = server.address().port;
        const response = await fetch(`http://localhost:${port}/api/leaderboard/invalid`);
        const data = await response.json();
        
        assert.strictEqual(response.status, 404);
      } finally {
        await closeServer();
      }
    });

    test('returns empty leaderboard when no scores', async () => {
      const server = app.listen(0);
      const closeServer = () => new Promise(resolve => server.close(resolve));
      
      try {
        const port = server.address().port;
        const response = await fetch(`http://localhost:${port}/api/leaderboard/game1`);
        const data = await response.json();
        
        assert.strictEqual(response.status, 200);
        assert.strictEqual(data.leaderboard.length, 0);
        assert.strictEqual(data.pagination.total, 0);
      } finally {
        await closeServer();
      }
    });
  });
});
