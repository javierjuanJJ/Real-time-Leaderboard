// backend/tests/ranking.test.js
// Ranking tests using node:test

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

describe('User Rankings (Feature 004)', () => {
  before(async () => {
    process.env.NODE_ENV = 'test';
  });

  describe('GET /api/rankings/me/:gameId', () => {
    test('returns 401 without authentication', async () => {
      const server = app.listen(0);
      
      try {
        const port = server.address().port;
        const response = await fetch(`http://localhost:${port}/api/rankings/me/game1`);
        assert.strictEqual(response.status, 401);
      } finally {
        await new Promise(resolve => server.close(resolve));
      }
    });

    test('returns 404 for invalid gameId', async () => {
      const server = app.listen(0);
      
      try {
        const port = server.address().port;
        const response = await fetch(`http://localhost:${port}/api/rankings/me/game1`, {
          headers: { 'Authorization': 'Bearer valid-token' }
        });
        assert.strictEqual(response.status, 404);
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
      } finally {
        await new Promise(resolve => server.close(resolve));
      }
    });
  });

  describe('GET /api/rankings/:userId/:gameId', () => {
    test('returns 404 for invalid gameId', async () => {
      const server = app.listen(0);
      
      try {
        const port = server.address().port;
        const response = await fetch(`http://localhost:${port}/api/rankings/user1/invalid`);
        assert.strictEqual(response.status, 404);
      } finally {
        await new Promise(resolve => server.close(resolve));
      }
    });

    test('returns 404 for invalid userId', async () => {
      const server = app.listen(0);
      
      try {
        const port = server.address().port;
        const response = await fetch(`http://localhost:${port}/api/rankings/invalid/game1`);
        assert.strictEqual(response.status, 404);
      } finally {
        await new Promise(resolve => server.close(resolve));
      }
    });
  });
});
