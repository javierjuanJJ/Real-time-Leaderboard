// backend/tests/redis-storage.test.js
// Redis Storage tests (Feature 006)

import { test, describe, before, after, mock } from 'node:test';
import assert from 'node:assert';

const mockRedis = {
  zadd: mock.fn(),
  zrem: mock.fn(),
  zcard: mock.fn(),
  zcount: mock.fn(),
  zrange: mock.fn(),
  zrevrange: mock.fn(),
  zrangebyscore: mock.fn(),
  zrevrangebyscore: mock.fn(),
  zincrby: mock.fn(),
  zrank: mock.fn(),
  zrevrank: mock.fn(),
  zscore: mock.fn(),
  exists: mock.fn(),
  pipeline: mock.fn(() => ({
    zadd: mock.fn(),
    zrevrank: mock.fn(),
    exec: mock.fn(),
    hmset: mock.fn(),
    expire: mock.fn(),
    hgetall: mock.fn(),
    incr: mock.fn(),
    pexpire: mock.fn(),
  })),
  get: mock.fn(),
  setex: mock.fn(),
  hgetall: mock.fn(),
  hmset: mock.fn(),
  expire: mock.fn(),
  incr: mock.fn(),
  pexpire: mock.fn(),
  publish: mock.fn(),
  subscribe: mock.fn(),
  duplicate: mock.fn(() => ({
    subscribe: mock.fn(),
    on: mock.fn(),
    unsubscribe: mock.fn(),
  })),
  ping: mock.fn(),
  quit: mock.fn(),
  on: mock.fn(),
  status: 'ready',
};

mock.module('../src/services/redis.service.js', {
  namedExports: {
    redis: mockRedis,
    leaderboard: {
      addScore: mock.fn(),
      updateScoreIfHigher: mock.fn(),
      incrementScore: mock.fn(),
      getRank: mock.fn(),
      getRankAsc: mock.fn(),
      getScore: mock.fn(),
      getTopPlayers: mock.fn(),
      getBottomPlayers: mock.fn(),
      getPlayersAroundRank: mock.fn(),
      getPlayersByScoreRange: mock.fn(),
      getPlayersByScoreRangeAsc: mock.fn(),
      getTotalPlayers: mock.fn(),
      removePlayer: mock.fn(),
      countInRange: mock.fn(),
      getPercentile: mock.fn(),
      getRankContext: mock.fn(),
      batchUpdateScores: mock.fn(),
      updateScoreAndGetRank: mock.fn(),
      exists: mock.fn(),
      zadd: mock.fn(),
      zrem: mock.fn(),
      zcard: mock.fn(),
      zcount: mock.fn(),
      zrange: mock.fn(),
      zrevrange: mock.fn(),
      zrangebyscore: mock.fn(),
      zrevrangebyscore: mock.fn(),
      zincrby: mock.fn(),
      zrank: mock.fn(),
      zrevrank: mock.fn(),
      zscore: mock.fn(),
    },
    cache: {
      getUserScore: mock.fn(),
      setUserScore: mock.fn(),
      getUserProfile: mock.fn(),
      setUserProfile: mock.fn(),
      getUserProfiles: mock.fn(),
      incrementRateLimit: mock.fn(),
    },
    pubsub: {
      publishScoreUpdate: mock.fn(),
      subscribeToGame: mock.fn(),
      unsubscribe: mock.fn(),
    },
    connectRedis: mock.fn(),
    healthCheck: mock.fn(() => Promise.resolve({ healthy: true, latencyMs: 5 })),
    shutdownRedis: mock.fn(),
  },
});

let app;
let server;

describe('Redis Storage (Feature 006)', () => {
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

  describe('GET /api/health', () => {
    test('returns overall health with redis and db', async () => {
      const port = server.address().port;
      const response = await fetch(`http://localhost:${port}/api/health`);
      const data = await response.json();
      
      assert.strictEqual(response.status, 200);
      assert.ok(['healthy', 'degraded'].includes(data.status));
      assert.ok(data.services.redis);
      assert.ok(data.services.database);
    });
  });
});