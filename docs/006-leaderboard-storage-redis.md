# 006-leaderboard-storage-redis - Implementation Documentation

## Implementation Summary

Foundational Redis infrastructure with ioredis client, connection pooling, health checks, and Sorted Set utilities for all leaderboard operations.

## Key Decisions

1. **ioredis Client**: Robust Redis client with built-in connection pooling, retry strategy, and cluster support.

2. **Key Prefix `lb:`**: Namespace isolation for all leaderboard keys (leaderboard, user:score, user:profile, ratelimit).

3. **Connection Pool**: Max 10 connections via ioredis internal pooling.

4. **Lazy Connect**: Client connects on first command, not at startup.

5. **Graceful Shutdown**: SIGTERM/SIGINT handlers close Redis connections properly.

6. **Health Check Endpoint**: `/api/health/redis` for load balancer probes.

## File Structure

```
backend/
├── src/
│   ├── services/
│   │   └── redis.service.ts       # Redis client + all utilities
│   ├── routes/
│   │   └── health.routes.ts       # GET /api/health/redis
│   └── routes/
│       └── index.ts
├── docker-compose.yml             # Redis for local dev
└── tests/
    └── redis.test.js
```

## Redis Service Exports

```typescript
// Raw client (advanced use)
export const redis: Redis;

// Sorted Set operations
export const leaderboard = {
  addScore(gameId, userId, score),
  incrementScore(gameId, userId, increment),
  getRank(gameId, userId),
  getScore(gameId, userId),
  getTopPlayers(gameId, limit, offset),
  getPlayersInRange(gameId, start, stop),
  getTotalPlayers(gameId),
  removePlayer(gameId, userId),
  countInRange(gameId, min, max),
  updateScoreIfHigher(gameId, userId, score),
  batchUpdateScores(updates),
};

// Cache operations
export const cache = {
  getUserScore(userId, gameId),
  setUserScore(userId, gameId, score, ttl),
  getUserProfile(userId),
  setUserProfile(userId, profile, ttl),
};

// Health & lifecycle
export const healthCheck(): Promise<{ healthy: boolean; latencyMs: number }>;
export const shutdown(): Promise<void>;
```

## Key Patterns

### Leaderboard Key
`lb:leaderboard:{gameId}` - Sorted Set (member: userId, score: score)

### User Score Cache
`lb:user:score:{userId}:{gameId}` - String (TTL 24h)

### User Profile Cache
`lb:user:profile:{userId}` - Hash (TTL 1h)

## Rollback Instructions

```bash
# 1. Remove Redis dependency
npm uninstall ioredis

# 2. Remove Redis files
rm backend/src/services/redis.service.ts
rm backend/src/routes/health.routes.ts
rm backend/tests/redis.test.js

# 3. Remove health route from backend/src/routes/index.ts
# 4. Remove Redis from docker-compose.yml

# 5. Commit rollback
git commit -m "revert: remove Redis infrastructure"
```

## Opencode Usage Notes

- Test health: `curl /api/health/redis`
- Monitor Redis: `redis-cli MONITOR`
- Check keys: `redis-cli KEYS "lb:*"`
- Run tests: `npm test -- backend/tests/redis.test.js`
- Local dev: `docker-compose up -d redis`