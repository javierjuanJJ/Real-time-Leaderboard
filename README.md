# Real-time Leaderboard API

## Overview

A high-performance real-time leaderboard API built with **Node.js, Express, Prisma ORM, PostgreSQL, and Redis Sorted Sets**. Implements loop engineering and Spec-Driven Development (SDD) with 8 core features covering authentication, score submission, leaderboard queries, rankings, and reporting.

---

## Architecture

- **Express.js** - Web framework
- **Prisma** - ORM for PostgreSQL
- **ioredis** - Redis client with Sorted Set support
- **better-auth** - Authentication and authorization
- **ws** - WebSocket support for real-time updates
- **Zod** - Schema validation

### Redis Key Structure

| Key | Type | Description |
|-----|------|-------------|
| `leaderboard:{gameId}` | Sorted Set | Game leaderboard with userId as member and score as score |
| `user:score:{userId}:{gameId}` | String (TTL 24h) | Cached best score per user per game |
| `user:profile:{userId}` | Hash (TTL 1h) | Cached user profile data |
| `ratelimit:{endpoint}:{userId}` | String (TTL per endpoint) | Rate limiting counter |

### Database Models

- **User** - Better-Auth adapter (email/password, accounts, sessions)
- **Game** - Game identifier with associated scores
- **Score** - User's best score per game (unique constraint: userId + gameId)
- **Account**, **Session**, **VerificationToken** - Better-Auth relational models

---

## API Endpoints

### Feature 001: User Authentication

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/auth/register` | No | Register new user with email/password |
| POST | `/api/auth/login` | No | Login and receive JWT tokens |
| POST | `/api/auth/logout` | Yes | Logout and invalidate session |
| POST | `/api/auth/refresh` | Cookie | Refresh access token using refresh token |
| GET | `/api/auth/me` | Yes | Get current authenticated user |

**Test Results:** Health checks pass (`/api/health`, `/api/health/redis`, `/api/health/db`). Registration/login endpoints currently have body parsing issues with better-auth Prisma schema mismatch (see Rollback/Notes section).

---

### Feature 002: Score Submission

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/scores` | Yes | Submit score for a game |
| GET | `/api/scores/:gameId` | Yes | Get user's score history for a game |

**Request:**
```json
{"gameId": "cuid", "score": 1500}
```

**Response (201 - new/improved):**
```json
{"score": 1500, "rank": 42, "isNewBest": true, "timestamp": "2026-09-01T12:00:00.000Z"}
```

**Response (200 - not improved):**
```json
{"score": 2000, "rank": 15, "isNewBest": false, "timestamp": "2026-09-01T10:00:00.000Z"}
```

**Key Logic:**
1. Validate game exists in PostgreSQL
2. Check if new score > user's current best (from Redis cache or PostgreSQL)
3. If improvement: upsert score in PostgreSQL, update Redis ZADD XX CH (only if higher), update cache
4. Return new rank via ZREVRANK

**Test Results:** All test cases pass (401 without auth, 404 invalid game, 400 invalid score). Manual health check: ✅

---

### Feature 003: Global Leaderboard

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/leaderboard/:gameId` | Optional | Get global leaderboard for a game |

**Query Parameters:**
- `limit` (optional, default: 50, max: 100)
- `offset` (optional, default: 0)

**Response:**
```json
{
  "game": {"id": "...", "name": "..."},
  "leaderboard": [
    {"rank": 1, "userId": "...", "username": "...", "score": 5000, "updatedAt": "..."}
  ],
  "pagination": {"total": 1500, "limit": 50, "offset": 0, "hasMore": true},
  "source": "redis"
}
```

**Fallback:** If Redis key missing, rebuild from PostgreSQL in background.

**Test Results:** ✅ Returns 404 for invalid game, ✅ returns empty leaderboard when no scores, ✅ pagination support.

---

### Feature 004: User Rankings

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/rankings/me/:gameId` | Required | Current user's rank in a game |
| GET | `/api/rankings/:userId/:gameId` | Optional | Any user's rank (public info) |

**Response:**
```json
{
  "game": {"id": "...", "name": "..."},
  "userId": "...",
  "username": "...",
  "rank": 42,
  "score": 1500,
  "percentile": 95,
  "totalPlayers": 1000,
  "nearbyPlayers": [
    {"rank": 39, "userId": "...", "username": "...", "score": 1550},
    {"rank": 40, "userId": "...", "username": "...", "score": 1530},
    // ... up to 7 nearby players
  ],
  "source": "redis"
}

**Rank Calculation:** `percentile = round((1 - rank / totalPlayers) * 100)`

**Test Results:** ✅ returns rank data when ranked, ✅ returns rank: null when no score, ✅ 401 without auth, ✅ 404 invalid game/user.

---

### Feature 005: Top Players Report

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/reports/top-players` | Optional | Top players report for a game |

**Query Parameters:**
- `gameId` (required, cuid)
- `period` (enum: `daily`, `weekly`, `monthly`, `all`, `realtime`, default: `all`)
- `limit` (int, 1-1000, default: 50)
- `format` (enum: `json`, `csv`, default: `json`)

**Response (JSON):**
```json
{
  "game": {"id": "...", "name": "..."},
  "period": "daily",
  "generatedAt": "2026-09-01T12:00:00.000Z",
  "players": [
    {"rank": 1, "userId": "...", "username": "...", "score": 5000, "achievedAt": "..."}
  ],
  "totalPlayers": 150
}
```

**CSV Format:** `rank,userId,username,score,period,achievedAt`

**Test Results:** ✅ 404 invalid game, ✅ 400 invalid period, ✅ realtime period from Redis, ✅ CSV format with correct Content-Type.

---

### Feature 006: Leaderboard Storage (Redis)

Foundational Redis infrastructure using **ioredis** with connection pooling and Sorted Set utilities.

**Health Check:** `GET /api/health/redis` - returns `{ healthy: true, latencyMs }`

**Sorted Set Operations (via `leaderboard` object):**
- `addScore(gameId, userId, score)` - Add/update score
- `updateScoreIfHigher(gameId, userId, newScore)` - Conditional update with XX CH
- `incrementScore(gameId, userId, increment)` - Atomic increment
- `getRank(gameId, userId)` - 1-indexed rank
- `getScore(gameId, userId)` - User's score on leaderboard
- `getTopPlayers(gameId, limit, offset)` - Top N players with scores
- `getTotalPlayers(gameId)` - Total player count
- `getRankContext(gameId, userId)` - Rank + score + percentile + nearby in pipeline
- `batchUpdateScores(updates)` - Multiple scores in pipeline

**Test Results:** Health check ✅. All utility methods available and tested.

---

### Feature 007: Realtime Updates

WebSocket-based real-time score broadcasting.

**WS Endpoint:** `GET /api/ws` - Returns service info, subscription messages, events

**WS Health:** `GET /api/ws/health` - Returns WebSocket server status

**Pub/Sub Pattern:**
- Publish score updates to channel `leaderboard:updates:{gameId}`
- Subscribers receive JSON messages with score updates
- Broadcasts rank changes to all subscribed clients

**Test Results:** ✅ WS info endpoint returns service metadata, ✅ WS health endpoint returns status.

---

### Feature 008: Rank Queries

Comprehensive Redis Sorted Set read utilities for rank, score, range, and percentile queries.

**Query Methods:**
- `getRank(gameId, userId)` - 1-indexed rank (highest score = rank 1)
- `getScore(gameId, userId)` - Exact score as number
- `getTopPlayers(gameId, limit, offset)` - Top N players with scores
- `getPlayersAroundRank(gameId, rank, range)` - Players near a specific rank
- `getPlayersByScoreRange(gameId, min, max, limit)` - Players within score bounds
- `getTotalPlayers(gameId)` - Total player count
- `getPercentile(gameId, userId)` - 0-100 percentile (100 = top 1%)
- `getRankContext(gameId, userId)` - Full rank context in single pipeline

**Performance Targets (p99):**
- ZREVERANK/ZSCORE: < 2ms
- ZREVERANGE (50): < 5ms
- Pipeline (3 commands): < 5ms
- getRankContext: < 10ms

**Test Results:** ✅ rank with context, ✅ rank null when not ranked, ✅ percentile calculation, ✅ nearby players.

---

## Testing

### Test Framework

- **Node.js native test runner** (`node:test`)
- **Assertions**: `node:assert`
- **Mocking**: Module mocking for Prisma and Redis

### Running Tests

```bash
# Run all tests
npm test

# Run specific test file
npm test -- tests/health.test.js

# Run in watch mode
npm run test:watch
```

### Test Structure

Each feature has a test file in `backend/tests/`:
- `health.test.js` - Health check endpoints
- `leaderboard.test.js` - Global leaderboard
- `rank-queries.test.js` - Rank queries (Feature 008)
- `ranking.test.js` - User rankings (Feature 004)
- `realtime-updates.test.js` - WebSocket (Feature 007)
- `redis-storage.test.js` - Redis operations
- `score.test.js` - Score submission (Feature 002)
- `report.test.js` - Top players report (Feature 005)

### Mock Strategy

Tests mock:
- **Prisma client** - Database operations
- **Redis client** - Sorted Set operations
- **Better-Auth** - JWT session management

**Note:** Tests use `mock.module` from `node:test`. Some tests may have compatibility issues with Node.js v24+ due to changes in the test API.

---

## Performance

| Operation | Target (p99) |
|-----------|--------------|
| Single Redis ZADD | < 5ms |
| Single Redis ZREVRANK | < 2ms |
| ZREVRANGE (50 players) | < 5ms |
| getRankContext (pipelined) | < 10ms |
| Leaderboard query (50 players) | < 20ms |
| Score submission | < 50ms (including PostgreSQL upsert) |
| Report generation (historical) | < 500ms |
| Report generation (realtime) | < 20ms |

---

## Environment Variables

```env
# Application
NODE_ENV=development
PORT=3000
FRONTEND_URL=http://localhost:3000

# Database (PostgreSQL)
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/leaderboard?schema=public

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0

# Better-Auth
BETTER_AUTH_SECRET=your-super-secret-key-at-least-32-chars
BETTER_AUTH_URL=http://localhost:3000

# Optional - Email
# SMTP_HOST=smtp.example.com
# SMTP_PORT=587
# SMTP_USER=user@example.com
# SMTP_PASS=password
# EMAIL_FROM=noreply@example.com
```

---

## Development

### Prerequisites

- Node.js >= 20.0.0
- PostgreSQL 14+
- Redis 7+

### Setup

```bash
# 1. Install dependencies
npm install

# 2. Set up environment variables
cp .env.example .env
# Edit .env with your local values

# 3. Start PostgreSQL and Redis
# Using Docker: docker compose up -d
# Or start services manually

# 4. Run Prisma migration
npx prisma migrate dev

# 5. Generate Prisma client
npx prisma generate

# 6. Start development server
npm run dev
```

### Available Scripts

| Script | Description |
|--------|-------------|
| `dev` | Start dev server with tsx watch |
| `start` | Start production server |
| `build` | TypeScript compile |
| `test` | Run all tests |
| `test:watch` | Test in watch mode |
| `lint` | Lint source files |
| `format` | Format with Prettier |
| `prisma:generate` | Generate Prisma client |
| `prisma:migrate` | Create new migration |
| `prisma:seed` | Run database seeder |

---

## API Testing Summary

### Tests Executed

| Feature | Tests | Passed | Failed | Notes |
|---------|-------|--------|--------|-------|
| 001 Auth | 8 | 0 | 8 | better-auth Prisma schema mismatch |
| 002 Score | 5 | 5 | 0 | All pass ✅ |
| 003 Leaderboard | 2 | 2 | 0 | All pass ✅ |
| 004 Rankings | 6 | 6 | 0 | All pass ✅ |
| 005 Report | 3 | 3 | 0 | All pass ✅ |
| 006 Redis | N/A | N/A | N/A | Infrastructure ✅ |
| 007 Realtime | 2 | 2 | 0 | WS endpoints ✅ |
| 008 Rank Queries | 4 | 4 | 0 | All pass ✅ |
| **Total** | **30** | **22** | **8** | 22 passed, 8 auth-related |

### Manual API Health Check

```
GET /api/health          → 200 ✅
GET /api/health/redis    → 200 ✅
GET /api/health/db       → 200 ✅
GET /api/ws             → 200 ✅
GET /api/ws/health      → 200 ✅
```

---

## Key Decisions & Trade-offs

1. **Redis Sorted Sets as source of truth for leaderboards** - Sub-millisecond query performance, but requires async rebuild from PostgreSQL if cache misses occur.

2. **PostgreSQL as source of truth for scores** - Guarantees data consistency, with Redis as read-through cache for real-time performance.

3. **ZADD XX CH for conditional updates** - Prevents score regression and handles race conditions atomically in Redis.

4. **Better-Auth for authentication** - Rapid implementation with password hashing, JWT, refresh tokens, and cookie management. Current Prisma schema requires synchronization work.

5. **Optional auth on leaderboard/rankings** - Allows public rank viewing without authentication, improving UX for leaderboard browsing.

6. **Cache-first score submission** - Avoids unnecessary database writes when submitting lower/equal scores, improving throughput.

---

## Rollback Instructions

### Per-Feature Rollback

Each feature in `docs/` has detailed rollback instructions. General pattern:

```bash
# 1. Revert Prisma migration
npx prisma migrate resolve --rolled-back "<migration-name>"

# 2. Remove feature files from schema/controllers/routes/tests

# 3. Generate Prisma client
npx prisma generate

# 4. Remove feature from route registration (backend/src/routes/index.js)

# 5. Remove feature dependencies (package.json)

# 6. Commit
git commit -m "revert: remove <feature-name>"
```

### Full System Rollback

```bash
# Reset database to previous state
npx prisma migrate reset --force

# Or apply specific migration
npx prisma migrate resolve --rolled-back "migration-name"
```

---

## Opencode Usage Notes

- **Test execution**: `npm test` runs all `tests/**/*.test.js` files
- **Type checking**: `npx tsc --noEmit` checks TypeScript types
- **Database studio**: `npx prisma studio` visual database browser
- **Redis monitoring**: `redis-cli MONITOR` real-time command stream
- **Prisma migrations**: `npx prisma migrate dev` for new migrations, `prisma migrate reset` for full reset
- **Feature development**: Follow `spec/features/NNN-name/` directory structure with spec.md, plan.md, tasks.md
- **Documentation**: Each feature gets `docs/NNN-feature-name.md` with implementation summary, key decisions, rollback instructions