# 002-score-submission - Implementation Documentation

## Implementation Summary

Score submission endpoint that persists scores to PostgreSQL (source of truth) and updates Redis Sorted Sets for real-time leaderboard queries. Uses cache-first strategy to avoid unnecessary writes.

## Key Decisions

1. **Cache-First Validation**: Check Redis `lb:user:score:{userId}:{gameId}` before database write. If new score <= cached, return early.

2. **PostgreSQL Upsert**: Uses Prisma upsert with `where: { userId_gameId }` and `update: { value: { set: newScore } }` only when new score is higher.

3. **Redis ZADD XX CH**: Atomic conditional update - only updates if member exists AND new score is higher. Returns 1 if changed, 0 if not.

4. **Race Condition Handling**: PostgreSQL unique constraint on (userId, gameId) + Redis atomic operations ensure consistency.

5. **Idempotency**: Duplicate submissions return same result without side effects.

## File Structure

```
backend/
├── src/
│   ├── schemas/
│   │   └── score.schema.ts        # submitScoreSchema
│   ├── services/
│   │   └── redis.service.ts       # updateLeaderboardScore, getUserScoreCache
│   ├── controllers/
│   │   └── score.controller.ts    # submitScore logic
│   ├── routes/
│   │   └── score.routes.ts        # POST /api/scores
│   └── routes/
│       └── index.ts
├── prisma/
│   └── schema.prisma              # Game, Score models
└── tests/
    └── score.test.js
```

## API Endpoint

**POST /api/scores** (Auth required)

Request:
```json
{
  "gameId": "cuid",
  "score": 1500
}
```

Response (201 - new/improved):
```json
{
  "score": 1500,
  "rank": 42,
  "isNewBest": true,
  "timestamp": "2026-09-01T12:00:00.000Z"
}
```

Response (200 - not improved):
```json
{
  "score": 2000,
  "rank": 15,
  "isNewBest": false,
  "timestamp": "2026-09-01T10:00:00.000Z"
}
```

## Rollback Instructions

```bash
# 1. Revert Prisma migration
npx prisma migrate resolve --rolled-back "add-game-score-models"

# 2. Remove Game, Score models from schema.prisma

# 3. Generate Prisma client
npx prisma generate

# 4. Remove score-related files
rm backend/src/schemas/score.schema.ts
rm backend/src/services/redis.service.ts  # or revert changes
rm backend/src/controllers/score.controller.ts
rm backend/src/routes/score.routes.ts
rm backend/tests/score.test.js

# 5. Remove score routes from backend/src/routes/index.ts

# 6. Commit rollback
git commit -m "revert: remove score submission feature"
```

## Opencode Usage Notes

- Test with valid JWT: `curl -H "Authorization: Bearer <token>" -X POST -d '{"gameId":"...","score":1000}' /api/scores`
- Monitor Redis: `redis-cli MONITOR` to see ZADD operations
- Check PostgreSQL: `npx prisma studio` to view Score table
- Run tests: `npm test -- backend/tests/score.test.js`