# 003-leaderboard-updates - Implementation Documentation

## Implementation Summary

Global leaderboard endpoint that reads from Redis Sorted Sets with pagination support. Provides sub-20ms latency for top player queries.

## Key Decisions

1. **Redis ZREVRANGE WITHSCORES**: Single command retrieves top N players with scores efficiently.

2. **Username Resolution**: Hybrid approach - cache usernames in Redis Hash `lb:user:profile:{userId}` (TTL 1h), fallback to PostgreSQL.

3. **Pagination**: Supports limit (default 50, max 100) and offset for infinite scroll.

4. **1-Indexed Ranks**: Display ranks start at 1 (top player), internally Redis uses 0-indexed.

5. **Graceful Degradation**: If Redis key missing, returns empty leaderboard and triggers async rebuild.

## File Structure

```
backend/
├── src/
│   ├── schemas/
│   │   └── leaderboard.schema.ts  # leaderboardQuerySchema
│   ├── services/
│   │   └── redis.service.ts       # getLeaderboard, getLeaderboardTotal, getUserProfiles
│   ├── controllers/
│   │   └── leaderboard.controller.ts
│   ├── routes/
│   │   └── leaderboard.routes.ts  # GET /api/leaderboard/:gameId
│   └── routes/
│       └── index.ts
└── tests/
    └── leaderboard.test.js
```

## API Endpoint

**GET /api/leaderboard/:gameId** (Auth optional)

Query Params:
- `limit` (1-100, default 50)
- `offset` (default 0)

Response:
```json
{
  "gameId": "cuid",
  "leaderboard": [
    {
      "rank": 1,
      "userId": "cuid",
      "username": "PlayerOne",
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

## Rollback Instructions

```bash
# 1. Remove leaderboard files
rm backend/src/schemas/leaderboard.schema.ts
rm backend/src/controllers/leaderboard.controller.ts
rm backend/src/routes/leaderboard.routes.ts
rm backend/tests/leaderboard.test.js

# 2. Remove leaderboard routes from backend/src/routes/index.ts
# 3. Remove getLeaderboard, getLeaderboardTotal, getUserProfiles from redis.service.ts

# 4. Commit rollback
git commit -m "revert: remove global leaderboard endpoint"
```

## Opencode Usage Notes

- Test pagination: `curl "/api/leaderboard/<gameId>?limit=10&offset=20"`
- Check Redis: `redis-cli ZREVRANGE lb:leaderboard:<gameId> 0 49 WITHSCORES`
- Run tests: `npm test -- backend/tests/leaderboard.test.js`
- Benchmark: `wrk -t4 -c100 -d30s "http://localhost:3000/api/leaderboard/<gameId>"`