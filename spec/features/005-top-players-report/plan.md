# 005-top-players-report Plan

## Overview
Reporting endpoint that aggregates top players from PostgreSQL (historical) or Redis (real-time).

## Architecture Decisions

### PostgreSQL Query Strategy
```sql
-- Daily/weekly/monthly: highest score per user in period
SELECT DISTINCT ON (s."userId") 
  s."userId", s.value as score, s."createdAt", u.username
FROM "Score" s
JOIN "User" u ON u.id = s."userId"
WHERE s."gameId" = $1 
  AND s."createdAt" >= $2  -- period start
ORDER BY s."userId", s.value DESC, s."createdAt" ASC
LIMIT $3;
```

### Period Definitions
- `daily`: NOW() - INTERVAL '24 hours'
- `weekly`: NOW() - INTERVAL '7 days'
- `monthly`: NOW() - INTERVAL '30 days'
- `all`: No date filter (current best scores)
- `realtime`: Redis only

### Redis Query (realtime)
```typescript
await redis.zrevrange(`leaderboard:${gameId}`, 0, limit - 1, 'WITHSCORES');
```

### API Endpoint
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/reports/top-players` | Optional | Top players report |

### Query Parameters
- `gameId` (required, cuid)
- `period` (enum: daily, weekly, monthly, all, realtime; default: all)
- `limit` (int, 1-1000, default: 50)
- `format` (enum: json, csv; default: json)

### Response Format (JSON)
```json
{
  "gameId": "string",
  "period": "daily",
  "generatedAt": "2026-09-01T12:00:00.000Z",
  "players": [
    {
      "rank": 1,
      "userId": "string",
      "username": "string",
      "score": 5000,
      "achievedAt": "2026-09-01T10:30:00.000Z"
    }
  ],
  "totalPlayers": 150
}
```

### CSV Format
```
rank,userId,username,score,period,achievedAt
1,abc123,PlayerOne,5000,daily,2026-09-01T10:30:00.000Z
```

### Zod Schema
- `reportQuerySchema` - gameId, period, limit, format

### Implementation Flow
1. Validate params
2. Check game exists
3. If period=realtime: query Redis, return
4. Else: calculate period start date
5. Query PostgreSQL with period filter
6. Rank results in memory (already ordered by score DESC)
7. Resolve usernames
8. Format response (JSON or CSV)
9. Set appropriate Content-Type header

## Database Indexes
```prisma
// Add to Score model
@@index([gameId, createdAt])
@@index([gameId, userId, value])
```

## Performance Targets
- Historical reports: < 500ms
- Real-time reports: < 20ms
- CSV streaming for large datasets