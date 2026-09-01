# 006-leaderboard-storage-redis Plan

## Overview
Foundational Redis infrastructure using ioredis with connection pooling, health checks, and Sorted Set utilities.

## Architecture Decisions

### Redis Client (ioredis)
```typescript
import Redis from 'ioredis';

const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  db: parseInt(process.env.REDIS_DB || '0'),
  maxRetriesPerRequest: 3,
  retryStrategy: (times) => Math.min(times * 50, 2000),
  enableReadyCheck: true,
  lazyConnect: true,
  connectionName: 'leaderboard-api',
});

// Connection pool via cluster or multiple clients if needed
```

### Key Prefix Strategy
All keys prefixed with `lb:` (leaderboard) for namespace isolation:
- `lb:leaderboard:{gameId}`
- `lb:user:score:{userId}:{gameId}`
- `lb:user:profile:{userId}`
- `lb:ratelimit:{endpoint}:{userId}`

### Service Structure
`backend/src/services/redis.service.ts` exports:
- `redis` - Raw ioredis client (for advanced use)
- `leaderboard` - Object with Sorted Set methods
- `cache` - Object with String/Hash methods
- `healthCheck()` - Returns { healthy, latencyMs }
- `shutdown()` - Graceful disconnect

### Sorted Set Utility Methods
```typescript
const leaderboard = {
  addScore: (gameId, userId, score) => 
    redis.zadd(`lb:leaderboard:${gameId}`, score, userId),
  
  incrementScore: (gameId, userId, increment) =>
    redis.zincrby(`lb:leaderboard:${gameId}`, increment, userId),
  
  getRank: (gameId, userId) =>
    redis.zrevrank(`lb:leaderboard:${gameId}`, userId),
  
  getScore: (gameId, userId) =>
    redis.zscore(`lb:leaderboard:${gameId}`, userId),
  
  getTopPlayers: (gameId, limit, offset = 0) =>
    redis.zrevrange(`lb:leaderboard:${gameId}`, offset, offset + limit - 1, 'WITHSCORES'),
  
  getPlayersInRange: (gameId, start, stop) =>
    redis.zrevrange(`lb:leaderboard:${gameId}`, start, stop, 'WITHSCORES'),
  
  getTotalPlayers: (gameId) =>
    redis.zcard(`lb:leaderboard:${gameId}`),
  
  removePlayer: (gameId, userId) =>
    redis.zrem(`lb:leaderboard:${gameId}`, userId),
  
  countInRange: (gameId, min, max) =>
    redis.zcount(`lb:leaderboard:${gameId}`, min, max),
};
```

### Cache Utility Methods
```typescript
const cache = {
  getUserScore: (userId, gameId) =>
    redis.get(`lb:user:score:${userId}:${gameId}`),
  
  setUserScore: (userId, gameId, score, ttl = 86400) =>
    redis.setex(`lb:user:score:${userId}:${gameId}`, ttl, score),
  
  getUserProfile: (userId) =>
    redis.hgetall(`lb:user:profile:${userId}`),
  
  setUserProfile: (userId, profile, ttl = 3600) =>
    redis.hmset(`lb:user:profile:${userId}`, profile).then(() => 
      redis.expire(`lb:user:profile:${userId}`, ttl)
    ),
};
```

### Health Check Endpoint
- GET `/api/health/redis` (no auth)
- Returns { status: 'healthy'|'unhealthy', latencyMs, timestamp }

### Environment Variables
```
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0
```

### Docker Compose (for local dev)
```yaml
redis:
  image: redis:7-alpine
  ports: ["6379:6379"]
  volumes: ["redis-data:/data"]
  command: redis-server --appendonly yes
```

## Implementation Flow
1. Install ioredis
2. Create redis.service.ts with client config
3. Implement Sorted Set utilities
4. Implement cache utilities
5. Add health check endpoint
6. Add graceful shutdown handler
7. Write tests
8. Document