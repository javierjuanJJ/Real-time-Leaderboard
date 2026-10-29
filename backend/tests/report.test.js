// backend/tests/report.test.js
// Report tests using node:test

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

describe('Top Players Report (Feature 005)', () => {
  before(async () => {
    process.env.NODE_ENV = 'test';
  });

  describe('GET /api/reports/top-players', () => {
    test('returns 404 for invalid gameId', async () => {
      const server = app.listen(0);
      
      try {
        const port = server.address().port;
        const response = await fetch(`http://localhost:${port}/api/reports/top-players?gameId=invalid`);
        assert.strictEqual(response.status, 404);
      } finally {
        await new Promise(resolve => server.close(resolve));
      }
    });

    test('returns 400 for invalid period', async () => {
      const server = app.listen(0);
      
      try {
        const port = server.address().port;
        const response = await fetch(`http://localhost:${port}/api/reports/top-players?gameId=game1&period=invalid`);
        assert.strictEqual(response.status, 400);
      } finally {
        await new Promise(resolve => server.close(resolve));
      }
    });

    test('returns realtime leaderboard when period=realtime', async () => {
      const server = app.listen(0);
      
      try {
        const port = server.address().port;
        const response = await fetch(`http://localhost:${port}/api/reports/top-players?gameId=game1&period=realtime&limit=10`);
        const data = await response.json();
        
        assert.strictEqual(response.status, 200);
        assert.strictEqual(data.period, 'realtime');
        assert.ok(data.players.length >= 0);
      } finally {
        await new Promise(resolve => server.close(resolve));
      }
    });

    test('returns CSV format when requested', async () => {
      const server = app.listen(0);
      
      try {
        const port = server.address().port;
        const response = await fetch(`http://localhost:${port}/api/reports/top-players?gameId=game1&period=realtime&format=csv`);
        
        assert.strictEqual(response.status, 200);
        assert.ok(response.headers.get('content-type').includes('text/csv'));
      } finally {
        await new Promise(resolve => server.close(resolve));
      }
    });
  });
});
