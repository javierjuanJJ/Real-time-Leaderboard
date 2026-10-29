// backend/tests/redis-storage.test.js
// Redis storage tests using node:test

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

describe('Redis Storage', () => {
  before(async () => {
    process.env.NODE_ENV = 'test';
  });

  describe('GET /api/health/redis', () => {
    test('returns Redis health', async () => {
      const server = app.listen(0);
      
      try {
        const port = server.address().port;
        const response = await fetch(`http://localhost:${port}/api/health/redis`);
        const data = await response.json();
        
        assert.strictEqual(response.status, 200);
        assert.strictEqual(data.healthy, true);
        assert.ok(typeof data.latencyMs === 'number');
      } finally {
        await new Promise(resolve => server.close(resolve));
      }
    });
  });
});
