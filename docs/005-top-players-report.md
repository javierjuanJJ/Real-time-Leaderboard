# 005-top-players-report - Implementation Documentation

## Implementation Summary

Top players report endpoint supporting historical (PostgreSQL) and real-time (Redis) modes with JSON and CSV export formats.

## Key Decisions

1. **Period-Based Aggregation**: Daily/weekly/monthly use PostgreSQL with DISTINCT ON for highest score per user in period.

2. **All-Time Report**: Uses current best scores (same as real-time but from PostgreSQL).

3. **Real-Time Mode**: Reads directly from Redis Sorted Set for live data.

4. **CSV Streaming**: For large reports, streams CSV to avoid memory issues.

5. **Database Indexes**: Added composite indexes on (gameId, createdAt) and (gameId, userId, value) for query performance.

## File Structure

```
backend/
├── src/
│   ├── schemas/
│   │   └── report.schema.ts       # reportQuerySchema
│   ├── services/
│   │   └── report.service.ts      # getTopPlayersHistorical, getTopPlayersRealtime, formatCSV
│   ├── controllers/
│   │   └── report.controller.ts
│   ├── routes/
│   │   └── report.routes.ts       # GET /api/reports/top-players
│   └── routes/
│       └── index.ts
├── prisma/
│   └── schema.prisma              # Score indexes
└── tests/
    └── report.test.js
```

## API Endpoint

**GET /api/reports/top-players** (Auth optional)

Query Params:
- `gameId` (required, cuid)
- `period` (daily|weekly|monthly|all|realtime, default: all)
- `limit` (1-1000, default: 50)
- `format` (json|csv, default: json)

Response (JSON):
```json
{
  "gameId": "cuid",
  "period": "daily",
  "generatedAt": "2026-09-01T12:00:00.000Z",
  "players": [
    {
      "rank": 1,
      "userId": "cuid",
      "username": "PlayerOne",
      "score": 5000,
      "achievedAt": "2026-09-01T10:30:00.000Z"
    }
  ],
  "totalPlayers": 150
}
```

Response (CSV):
```
rank,userId,username,score,period,achievedAt
1,abc123,PlayerOne,5000,daily,2026-09-01T10:30:00.000Z
```

## Rollback Instructions

```bash
# 1. Revert Prisma migration (indexes)
npx prisma migrate resolve --rolled-back "add-score-indexes"

# 2. Remove indexes from Score model in schema.prisma

# 3. Generate Prisma client
npx prisma generate

# 4. Remove report files
rm backend/src/schemas/report.schema.ts
rm backend/src/services/report.service.ts
rm backend/src/controllers/report.controller.ts
rm backend/src/routes/report.routes.ts
rm backend/tests/report.test.js

# 5. Remove report routes from backend/src/routes/index.ts

# 6. Commit rollback
git commit -m "revert: remove top players report feature"
```

## Opencode Usage Notes

- Test JSON: `curl "/api/reports/top-players?gameId=<id>&period=daily&limit=10"`
- Test CSV: `curl -H "Accept: text/csv" "/api/reports/top-players?gameId=<id>&period=weekly"`
- Check PostgreSQL: `npx prisma studio` → Score table
- Run tests: `npm test -- backend/tests/report.test.js`