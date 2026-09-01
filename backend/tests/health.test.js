// backend/tests/health.test.js
// Health check tests using node:test

import { test, describe, before, after, mock } from 'node:test';
import assert from 'node:assert';

// Mock dependencies before importing
mock.module('../src/services/redis.service.js', {
  namedExports: {
    healthCheck: async () => ({ healthy: true, latencyMs: 5 })
  }
});

mock.module('../server.js', {
  namedExports: {
    prisma: {
      $queryRaw: async () => [[1]]
    }
  }
});

let app;
let server;

describe('Health Checks', () => {
  before(async () => {
    // Set test env
    process.env.NODE_ENV = 'test';
    
    // Import app after mocks
    const { app: importedApp } = await import('../app.js');
    app = importedApp;
    
    // Start test server on random port
    server = app.listen(0);
  });

  after(async () => {
    if (server) {
      await new Promise(resolve => server.close(resolve));
    }
  });

  describe('GET /api/health', () => {
    test('returns healthy status', async () => {
      const port = server.address().port;
      const response = await fetch(`http://localhost:${port}/api/health`);
      const data = await response.json();
      
      assert.strictEqual(response.status, 200);
      assert.strictEqual(data.status, 'healthy');
      assert.ok(data.timestamp);
      assert.ok(data.services.redis.healthy);
      assert.ok(data.services.database.healthy);
    });
  });

  describe('GET /api/health/redis', () => {
    test('returns Redis health', async () => {
      const port = server.address().port;
      const response = await fetch(`http://localhost:${port}/api/health/redis`);
      const data = await response.json();
      
      assert.strictEqual(response.status, 200);
      assert.strictEqual(data.healthy, true);
      assert.ok(typeof data.latencyMs === 'number');
    });
  });

  describe('GET /api/health/db', () => {
    test('returns database health', async () => {
      const port = server.address().port;
      const response = await fetch(`http://localhost:${port}/api/health/db`);
      const data = await response.json();
      
      assert.strictEqual(response.status, 200);
      assert.strictEqual(data.healthy, true);
      assert.ok(typeof data.latencyMs === 'number');
    });
  });
});