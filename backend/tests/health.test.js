// backend/tests/health.test.js
// Health check tests using node:test

import { test, describe, before, after } from 'node:test';

// Use Node.js built-in assert module for assertions
import assert from 'assert';

// v24 compat: MockTracker doesn't have .module, add it
const mockFromTest = await import('node:test');
mockFromTest.mock.module = () => {};

// Set up environment variables BEFORE importing app
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'postgresql://postgres:postgres@localhost:5432/leaderboard?schema=public';
process.env.REDIS_HOST = 'localhost';
process.env.REDIS_PORT = '6379';
process.env.BETTER_AUTH_SECRET = 'test-secret-key-at-least-32-chars';
process.env.BETTER_AUTH_URL = 'http://localhost:3000';

import { app } from '../app.js';

describe('Health Checks', () => {
  before(async () => {
    process.env.NODE_ENV = 'test';
  });

  describe('GET /api/health', () => {
    test('returns healthy status', async () => {
      const server = app.listen(0);
      
      try {
        const port = server.address().port;
        const response = await fetch(`http://localhost:${port}/api/health`);
        const data = await response.json();
        
        assert.strictEqual(response.status, 200);
        assert.strictEqual(data.status, 'healthy');
        assert.ok(data.timestamp);
        assert.ok(data.services);
        assert.ok(data.services.redis.healthy);
        assert.ok(data.services.database.healthy);
      } finally {
        await new Promise(resolve => server.close(resolve));
      }
    });
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

  describe('GET /api/health/db', () => {
    test('returns database health', async () => {
      const server = app.listen(0);
      
      try {
        const port = server.address().port;
        const response = await fetch(`http://localhost:${port}/api/health/db`);
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
