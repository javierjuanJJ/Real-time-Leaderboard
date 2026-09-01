# 002-score-submission Plan

## Overview
Score submission endpoint that writes to PostgreSQL (source of truth) and updates Redis Sorted Sets atomically for real-time leaderboards.

## Architecture Decisions

### Database Schema (Prisma)
```prisma
model Game {
  id          String   @id @default(cuid())
  name        String   @unique
  description String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  scores      Score[]
}

model Score {
  id        String   @id @default(cuid())
  userId    String
  gameId    String
  value     Int
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  game Game @relation(fields: [gameId], references: [id], onDelete: Cascade)

  @@unique([userId, gameId])
  @@index([gameId, value])
}
```

### Redis Key Structure
- `leaderboard:{gameId}` - Sorted Set (member: userId, score: score value)
- `user:score:{userId}:{gameId}` - String (cached best score for quick check)

### API Endpoint
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/scores` | Submit score (auth required) |

### Request/Response
**Request:**
```json
{
  "gameId": "string (cuid)",
  "score": "integer (0-2147483647)"
}
```

**Response (201 - new/improved):**
```json
{
  "score": 1500,
  "rank": 42,
  "isNewBest": true,
  "timestamp": "2026-09-01T12:00:00.000Z"
}
```

**Response (200 - not improved):**
```json
{
  "score": 2000,
  "rank": 15,
  "isNewBest": false,
  "timestamp": "2026-09-01T10:00:00.000Z"
}
```

### Zod Schema
- `submitScoreSchema` - gameId (cuid), score (int, min: 0, max: 2147483647)

### Implementation Flow
1. Validate request with Zod
2. Check game exists (Prisma)
3. Get current best from Redis cache (`user:score:{userId}:{gameId}`)
4. If new score <= cached best: return current best + rank from Redis
5. Else: Start transaction
   - Upsert Score in PostgreSQL (on conflict userId+gameId, update if value > existing)
   - Update Redis: ZADD leaderboard:{gameId} XX CH (only if higher)
   - Update cache: SET user:score:{userId}:{gameId} newScore
6. Get new rank: ZREVRANK leaderboard:{gameId} userId
7. Return response

### Error Handling
- Prisma unique constraint violation → retry logic
- Redis connection failure → fallback to PostgreSQL only, log error
- Game not found → 404

## Security
- Requires authentication (requireAuth middleware)
- Rate limit: 30 req/min per user
- Input validation via Zod