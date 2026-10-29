// backend/tests/score.test.js
// Score submission tests using node:test

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

describe('Score Submission (Feature 002)', () => {
  before(async () => {
    process.env.NODE_ENV = 'test';
  });

  describe('POST /api/scores', () => {
    test('returns 401 without authentication', async () => {
      const server = app.listen(0);
      
      try {
        const port = server.address().port;
        const response = await fetch(`http://localhost:${port}/api/scores`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ gameId: 'game1', score: 100 }),
        });
        assert.strictEqual(response.status, 401);
      } finally {
        await new Promise(resolve => server.close(resolve));
      }
    });

    test('returns 404 for invalid gameId', async () => {
      const server = app.listen(0);
      
      try {
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
      } finally {
        await new Promise(resolve => server.close(resolve));
      }
    });

    test('returns 400 for invalid score', async () => {
      const server = app.listen(0);
      
      try {
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
      } finally {
        await new Promise(resolve => server.close(resolve));
      }
    });
  });

  describe('GET /api/scores/:gameId', () => {
    test('returns 401 without authentication', async () => {
      const server = app.listen(0);
      
      try {
        const port = server.address().port;
        const response = await fetch(`http://localhost:${port}/api/scores/game1`);
        assert.strictEqual(response.status, 401);
      } finally {
        await new Promise(resolve => server.close(resolve));
      }
    });
  });
});
