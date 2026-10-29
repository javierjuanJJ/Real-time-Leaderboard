// backend/tests/rank-queries.test.js
// Rank Queries tests (Feature 008)

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

describe('Rank Queries (Feature 008)', () => {
  before(async () => {
    process.env.NODE_ENV = 'test';
  });

  describe('GET /api/rankings/me/:gameId', () => {
    test('returns rank, score, percentile, totalPlayers, nearbyPlayers when ranked', async () => {
      const server = app.listen(0);
      
      try {
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
      } finally {
        await new Promise(resolve => server.close(resolve));
      }
    });

    test('returns rank: null when user has no score', async () => {
      const server = app.listen(0);
      
      try {
        const port = server.address().port;
        const response = await fetch(`http://localhost:${port}/api/rankings/me/game1`, {
          headers: { 'Authorization': 'Bearer valid-token' }
        });
        const data = await response.json();
        
        assert.strictEqual(response.status, 200);
        assert.strictEqual(data.rank, null);
        assert.strictEqual(data.score, 0);
        assert.ok(data.message.includes('No score'));
      } finally {
        await new Promise(resolve => server.close(resolve));
      }
    });
  });

  describe('GET /api/rankings/:userId/:gameId', () => {
    test('returns rank data for any user', async () => {
      const server = app.listen(0);
      
      try {
        const port = server.address().port;
        const response = await fetch(`http://localhost:${port}/api/rankings/user2/game1`);
        const data = await response.json();
        
        assert.strictEqual(response.status, 200);
        assert.strictEqual(data.rank, 1);
        assert.strictEqual(data.score, 2000);
        assert.strictEqual(data.percentile, 100);
      } finally {
        await new Promise(resolve => server.close(resolve));
      }
    });
  });
});
