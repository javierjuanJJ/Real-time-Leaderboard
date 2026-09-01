# 004-user-rankings Plan

## Overview
Rank query endpoints using Redis ZREVRANK/ZRANK with PostgreSQL fallback.

## Architecture Decisions

### Redis Queries
```typescript
// Get user's rank (0-indexed, so +1 for display)
const rank = await redis.zrevrank(`leaderboard:${gameId}`, userId);

// Get user's score
const score = await redis.zscore(`leaderboard:${gameId}`, userId);

// Get total players
const total = await redis.zcard(`leaderboard:${gameId}`);

// Get nearby players (rank-3 to rank+3)
const nearby = await redis.zrevrange(
  `leaderboard:${gameId}`,
  Math.max(0, rank - 3),
  rank + 3,
  'WITHSCORES'
);
```

### Percentile Calculation
```typescript
percentile = rank === null ? 0 : Math.round((1 - rank / total) * 100);
```

### API Endpoints
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/rankings/me/:gameId` | Required | Current user's rank |
| GET | `/api/rankings/:userId/:gameId` | Optional | Any user's rank |

### Response Format
```json
{
  "gameId": "string",
  "userId": "string",
  "username": "string",
  "rank": 42,
  "score": 1500,
  "percentile": 95,
  "totalPlayers": 1000,
  "nearbyPlayers": [
    { "rank": 39, "userId": "...", "username": "...", "score": 1550 },
    { "rank": 40, "userId": "...", "username": "...", "score": 1530 },
    { "rank": 41, "userId": "...", "username": "...", "score": 1510 },
    { "rank": 42, "userId": "...", "username": "...", "score": 1500 },
    { "rank": 43, "userId": "...", "username": "...", "score": 1490 },
    { "rank": 44, "userId": "...", "username": "...", "score": 1480 },
    { "rank": 45, "userId": "...", "username": "...", "score": 1470 }
  ],
  "source": "redis"
}
```

### Zod Schema
- `rankingParamsSchema` - gameId (cuid), userId (cuid, for public endpoint)

### Implementation Flow
1. Validate params
2. Check game exists
3. For `/me` endpoint: get userId from auth
4. Try Redis: ZREVRANK + ZSCORE + ZCARD
5. If rank !== null: get nearby players via ZREVRANGE
6. Resolve usernames for nearby players
7. If Redis miss (key doesn't exist): fallback to PostgreSQL
   - Query Score model for userId + gameId
   - Calculate rank via raw SQL or Prisma aggregation
8. Return enriched response

## Performance Targets
- p99 latency < 10ms (Redis hit)
- p99 latency < 100ms (PostgreSQL fallback)