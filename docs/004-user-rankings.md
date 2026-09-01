# 004-user-rankings - Implementation Documentation

## Implementation Summary

User rank query endpoints using Redis ZREVRANK/ZSCORE with PostgreSQL fallback. Provides rank, score, percentile, and nearby players context.

## Key Decisions

1. **ZREVRANK for Rank**: Returns 0-indexed rank (0 = top), converted to 1-indexed for display.

2. **Percentile Calculation**: `Math.round((1 - (rank - 1) / total) * 100)` where rank is 1-indexed.

3. **Nearby Players**: Returns 3 players above and below current rank using ZREVRANGE.

4. **PostgreSQL Fallback**: When Redis key missing, queries Score model and calculates rank via window function.

5. **Public Endpoint**: `/api/rankings/:userId/:gameId` doesn't require auth (public leaderboard info).

## File Structure

```
backend/
├── src/
│   ├── schemas/
│   │   └── ranking.schema.ts      # rankingParamsSchema
│   ├── services/
│   │   ├── redis.service.ts       # getUserRank, getUserScore, getNearbyPlayers, getLeaderboardTotal
│   │   └── score.service.ts       # getUserRankFromPostgres (fallback)
│   ├── controllers/
│   │   └── ranking.controller.ts
│   ├── routes/
│   │   └── ranking.routes.ts      # GET /api/rankings/me/:gameId, GET /api/rankings/:userId/:gameId
│   └── routes/
│       └── index.ts
└── tests/
    └── ranking.test.js
```

## API Endpoints

**GET /api/rankings/me/:gameId** (Auth required)
**GET /api/rankings/:userId/:gameId** (Auth optional)

Response:
```json
{
  "gameId": "cuid",
  "userId": "cuid",
  "username": "PlayerOne",
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

## Rollback Instructions

```bash
# 1. Remove ranking files
rm backend/src/schemas/ranking.schema.ts
rm backend/src/controllers/ranking.controller.ts
rm backend/src/routes/ranking.routes.ts
rm backend/tests/ranking.test.js

# 2. Remove ranking routes from backend/src/routes/index.ts
# 3. Remove rank methods from redis.service.ts and score.service.ts

# 4. Commit rollback
git commit -m "revert: remove user rank queries feature"
```

## Opencode Usage Notes

- Test my rank: `curl -H "Authorization: Bearer <token>" /api/rankings/me/<gameId>`
- Test any user: `curl /api/rankings/<userId>/<gameId>`
- Check Redis: `redis-cli ZREVRANK lb:leaderboard:<gameId> <userId>`
- Run tests: `npm test -- backend/tests/ranking.test.js`