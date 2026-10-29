// backend/tests/realtime-updates.test.js
// Realtime Updates tests (Feature 007)

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

describe('Realtime Updates (Feature 007)', () => {
  before(async () => {
    process.env.NODE_ENV = 'test';
  });

  describe('GET /api/ws', () => {
    test('returns WebSocket service info', async () => {
      const server = app.listen(0);
      
      try {
        const port = server.address().port;
        const response = await fetch(`http://localhost:${port}/api/ws`);
        const data = await response.json();
        
        assert.strictEqual(response.status, 200);
        assert.strictEqual(data.service, 'websocket');
        assert.strictEqual(data.endpoint, '/ws');
        assert.ok(data.messages);
        assert.ok(data.events);
      } finally {
        await new Promise(resolve => server.close(resolve));
      }
    });
  });

  describe('GET /api/ws/health', () => {
    test('returns WebSocket health', async () => {
      const server = app.listen(0);
      
      try {
        const port = server.address().port;
        const response = await fetch(`http://localhost:${port}/api/ws/health`);
        const data = await response.json();
        
        assert.strictEqual(response.status, 200);
        assert.strictEqual(data.status, 'ok');
        assert.strictEqual(data.service, 'websocket');
      } finally {
        await new Promise(resolve => server.close(resolve));
      }
    });
  });
});
