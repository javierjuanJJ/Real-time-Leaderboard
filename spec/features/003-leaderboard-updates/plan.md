# 003-leaderboard-updates Plan

## Overview
Read-only endpoint to fetch global leaderboard from Redis Sorted Sets with pagination support.

## Architecture Decisions

### Redis Query Pattern
```typescript
// Get top N players with scores
const results = await redis.zrevrange(
  `leaderboard:${gameId}`,
  0,
  limit - 1,
  'WITHSCORES'
);

// Get total count
const total = await redis.zcard(`leaderboard:${gameId}`);
```

### Response Format
```json
{
  "gameId": "string",
  "leaderboard": [
    {
      "rank": 1,
      "userId": "string",
      "username": "string",
      "score": 10000,
      "updatedAt": "2026-09-01T12:00:00.000Z"
    }
  ],
  "pagination": {
    "total": 1500,
    "limit": 50,
    "offset": 0,
    "hasMore": true
  }
}
```

### Username Resolution
- Option A: Store username in Redis (denormalized) - faster, needs sync
- Option B: Fetch from PostgreSQL per request - slower, always fresh
- **Decision**: Hybrid - cache usernames in Redis hash `user:profile:{userId}`, fallback to PostgreSQL

### API Endpoint
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/leaderboard/:gameId` | Optional | Global leaderboard |

### Query Parameters
- `limit` (optional, default: 50, max: 100)
- `offset` (optional, default: 0)

### Zod Schema
- `leaderboardQuerySchema` - limit (int, 1-100), offset (int, min: 0)

### Implementation Flow
1. Validate gameId (cuid) and query params
2. Check game exists (Prisma)
3. Query Redis: ZREVRANGE with WITHSCORES, LIMIT offset limit
4. Get total count: ZCARD
5. Resolve usernames (Redis hash → PostgreSQL fallback)
6. Build response with 1-indexed ranks
7. Return 200 with pagination metadata

### Fallback Strategy
- If Redis key missing: trigger async rebuild from PostgreSQL
- Return empty leaderboard with total: 0 (or stale data if available)
- Background job populates Redis

## Performance Targets
- p99 latency < 20ms
- Support 10k+ concurrent readers
- Redis connection pooling