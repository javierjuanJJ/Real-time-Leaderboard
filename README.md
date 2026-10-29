# Real-time Leaderboard API

High-performance real-time leaderboard system built with Node.js, Express, Prisma, PostgreSQL, Redis, and Better-Auth. Implements Spec-Driven Development (SDD) with constitution-governed code constraints.

## Architecture

- **Loop Engineering + Spec Driven Development (SDD)**: All features defined in `spec/features/NNN-name/` before implementation
- **Constitution**: Rules enforced in `spec/constitution/` - notably `app.js` exports ONLY the Express app with NO async functions and NO `run()` method; server startup handled in `server.js` based on `NODE_ENV`
- **Redis Sorted Sets**: Mandatory for leaderboard storage, real-time updates, and rank queries
- **Better-Auth + Prisma**: Authentication with proper password hashing and session management

## Tech Stack

- **Runtime**: Node.js 20+ (ES Modules)
- **Framework**: Express.js
- **Database**: PostgreSQL + Prisma ORM
- **Cache/Leaderboard**: Redis 7+ (Sorted Sets / ZSETs)
- **Auth**: Better-Auth + Prisma Adapter
- **Validation**: Zod
- **Testing**: node:test (native Node.js test runner)
- **WebSockets**: ws library for real-time score updates

## Quick Start

### Prerequisites

- Node.js 20+
- PostgreSQL 15+
- Redis 7+

### Local Development

```bash
# 1. Start infrastructure
docker-compose up -d

# 2. Install dependencies
cd backend && npm install

# 3. Setup environment
cp .env.example .env
# Edit .env with your values

# 4. Setup database and Prisma
npm run prisma:generate
npm run prisma:migrate

# 5. Start development server
npm run dev
# or: node server.js (production)
```

Server runs at `http://localhost:3000`

### Environment Variables

Copy `.env.example` to `.env` and configure:

| Variable | Description |
|----------|-------------|
| `NODE_ENV` | Environment (development/production) |
| `PORT` | Server port (default: 3000) |
| `FRONTEND_URL` | Frontend URL for CORS |
| `DATABASE_URL` | PostgreSQL connection string |
| `REDIS_HOST` | Redis host (default: localhost) |
| `REDIS_PORT` | Redis port (default: 6379) |
| `REDIS_PASSWORD` | Redis password (optional) |
| `REDIS_DB` | Redis database number (default: 0) |
| `BETTER_AUTH_SECRET` | Secret for better-auth tokens |
| `BETTER_AUTH_URL` | Better-auth base URL |

## API Endpoints

### Health Checks (No Auth Required)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/health` | Overall system health (Redis + DB) |
| GET | `/api/health/redis` | Redis health check |
| GET | `/api/health/db` | PostgreSQL health check |

**Response (GET /api/health):**
```json
{
  "status": "healthy",
  "timestamp": "2026-10-29T18:00:47.976Z",
  "services": {
    "redis": { "healthy": true, "latencyMs": 4 },
    "database": { "healthy": true, "latencyMs": 40 }
  }
}
```

### Authentication (Better-Auth)

> **Note**: Authentication endpoints require proper Prisma schema alignment with better-auth. The Prisma schema must be generated via `npx auth generate --config src/lib/auth.js` after setting up the `BETTER_AUTH_URL` and `BETTER_AUTH_SECRET` environment variables.

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login user |
| POST | `/api/auth/logout` | Logout user |
| POST | `/api/auth/refresh` | Refresh access token |
| GET | `/api/auth/me` | Get current user |

**Register Request:**
```json
{
  "body": {
    "email": "user@example.com",
    "password": "securepassword123",
    "name": "Optional Display Name"
  }
}
```

**Login Response:**
```json
{
  "user": {
    "id": "user-123",
    "email": "user@example.com",
    "name": "User Name"
  },
  "accessToken": "jwt-token-string"
}
```

**Me Response (Auth Required):**
```json
{
  "user": {
    "id": "user-123",
    "email": "user@example.com",
    "name": "User Name",
    "image": null,
    "emailVerified": null
  }
}
```

### Scores (Auth Required - JWT Bearer Token)

> **Auth**: Pass token via `Authorization: Bearer <token>` header or `access_token` cookie.

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/scores` | Submit score for a game |
| GET | `/api/scores/:gameId` | Get user's score history for a game |

**Submit Score Request:**
```json
{
  "body": {
    "gameId": "game-1",
    "score": 1000
  }
}
```

**Submit Score Response (New Record):**
```json
{
  "message": "Score submitted",
  "score": 1000,
  "rank": 5,
  "totalPlayers": 100,
  "isNewRecord": true,
  "submittedAt": "2026-10-29T18:00:00.000Z"
}
```

**Submit Score Response (Not Improved):**
```json
{
  "message": "Score not improved",
  "score": 800,
  "rank": 5,
  "totalPlayers": 100,
  "isNewRecord": false,
  "submittedAt": "2026-10-29T18:00:00.000Z"
}
```

**Get User Scores Response:**
```json
{
  "scores": [
    {
      "score": 1000,
      "submittedAt": "2026-01-01T00:00:00.000Z",
      "updatedAt": "2026-01-01T00:00:00.000Z"
    }
  ],
  "pagination": {
    "total": 1,
    "limit": 20,
    "offset": 0,
    "hasMore": false
  }
}
```

### Leaderboard (Optional Auth)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/leaderboard/:gameId` | Global leaderboard for a game |

**Query Parameters:**
- `limit` (default: 50, max: 100) - Number of players to return
- `offset` (default: 0) - Pagination offset

**Response:**
```json
{
  "game": { "id": "game-1", "name": "Game 1" },
  "leaderboard": [
    { "rank": 1, "userId": "user-1", "score": 5000, "username": "Player1", "userImage": null },
    { "rank": 2, "userId": "user-2", "score": 4800, "username": "Player2", "userImage": null }
  ],
  "pagination": {
    "total": 100,
    "limit": 50,
    "offset": 0,
    "hasMore": true
  },
  "source": "redis" // or "postgresql" if Redis cache miss
}
```

### Rankings (Optional Auth for `/:userId/:gameId`, Auth Required for `/me/:gameId`)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/rankings/me/:gameId` | Current user's rank for a game (auth required) |
| GET | `/api/rankings/:userId/:gameId` | Any user's rank (public) |

**My Rank Response:**
```json
{
  "game": { "id": "game-1", "name": "Game 1" },
  "user": { "id": "user-123", "name": "Test User", "image": null },
  "rank": 5,
  "score": 1000,
  "percentile": 95,
  "totalPlayers": 100,
  "nearbyPlayers": [
    { "rank": 2, "userId": "user-2", "score": 1200 },
    { "rank": 3, "userId": "user-3", "score": 1100 },
    { "rank": 4, "userId": "user-4", "score": 1050 },
    { "rank": 5, "userId": "user-1", "score": 1000 },
    { "rank": 6, "userId": "user-5", "score": 950 },
    { "rank": 7, "userId": "user-6", "score": 900 },
    { "rank": 8, "userId": "user-7", "score": 850 }
  ],
  "source": "redis"
}
```

**No Score Response:**
```json
{
  "game": { "id": "game-1", "name": "Game 1" },
  "user": { "id": "user-123", "name": "Test User", "image": null },
  "rank": null,
  "score": 0,
  "percentile": 0,
  "totalPlayers": 100,
  "message": "No score submitted yet",
  "nearbyPlayers": []
}
```

**User Rank Response:**
```json
{
  "game": { "id": "game-1", "name": "Game 1" },
  "user": { "id": "user-456", "name": "Other User", "image": null },
  "rank": 1,
  "score": 2000,
  "percentile": 100
}
```

### Reports (Optional Auth)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/reports/top-players` | Top players report |

**Query Parameters:**
- `gameId` (required) - Game identifier
- `period` (default: "realtime") - "daily" \| "weekly" \| "monthly" \| "all" \| "realtime"
- `limit` (default: 50, max: 1000) - Number of players
- `format` (default: "json") - "json" \| "csv"

**Realtime Response:**
```json
{
  "game": { "id": "game-1", "name": "Game 1" },
  "period": "realtime",
  "generatedAt": "2026-10-29T18:00:00.000Z",
  "players": [
    { "rank": 1, "userId": "user-1", "username": "Player1", "userImage": null, "score": 5000, "period": "realtime", "submittedAt": "2026-10-29T18:00:00.000Z" },
    { "rank": 2, "userId": "user-2", "username": "Player2", "userImage": null, "score": 4800, "period": "realtime", "submittedAt": "2026-10-29T18:00:00.000Z" }
  ],
  "totalPlayers": 2
}
```

**CSV Response**: Sets `Content-Type: text/csv` and `Content-Disposition` header for download.

**Historical Period Response:**
```json
{
  "game": { "id": "game-1", "name": "Game 1" },
  "period": "daily",
  "generatedAt": "2026-10-29T18:00:00.000Z",
  "players": [...],
  "totalPlayers": 50
}
```

## Project Structure

```
Real-time-Leaderboard/
├── AGENTS.md                    # AI assistant instructions
├── spec/
│   ├── constitution/            # Project constitution
│   │   ├── mission.md
│   │   ├── tech-stack.md
│   │   └── roadmap.md
│   └── features/                # Feature specifications (SDD)
│       ├── 001-user-authentication/
│       ├── 002-score-submission/
│       ├── 003-leaderboard-updates/
│       ├── 004-user-rankings/
│       ├── 005-top-players-report/
│       ├── 006-leaderboard-storage-redis/
│       ├── 007-realtime-updates/
│       └── 008-rank-queries/
├── docs/                        # Implementation documentation
│   └── NNN-feature-name.md      # Per-feature docs
├── backend/
│   ├── app.js                   # Express app (NO async, NO run())
│   ├── server.js                # Entry point, starts server based on NODE_ENV
│   ├── prisma/schema.prisma     # Database models
│   ├── src/
│   │   ├── lib/                 # Core libraries (auth.js, websocket.service.js)
│   │   ├── middleware/          # Express middleware (auth, validate, error)
│   │   ├── controllers/         # Business logic (score, leaderboard, etc.)
│   │   ├── routes/              # Route handlers
│   │   ├── services/            # External services (Redis, WebSocket)
│   │   └── schemas/             # Zod validation schemas
│   └── tests/                   # node:test files
└── docker-compose.yml           # Infrastructure (PostgreSQL + Redis + Backend)
```

## Key Constraints (Constitution)

1. **app.js**: Export only, no async functions, no `run()` method - server started via `server.js` using `process.env.NODE_ENV`
2. **Redis Sorted Sets**: Mandatory for leaderboard operations - all leaderboard data stored in Redis ZSETs with keys `leaderboard:{gameId}`
3. **Spec-first**: Never write code without corresponding spec in `spec/features/NNN-name/`
4. **Tests**: Use `node:test` and `node:assert` only - unit tests mock Redis and Prisma
5. **Error Handling**: Centralized error middleware with proper HTTP codes (400, 401, 404, 409, 429, 500)

## Redis Key Patterns

- `lb:leaderboard:{gameId}` - Sorted Set (member: userId, score: score) - Primary leaderboard storage
- `lb:user:score:{userId}:{gameId}` - String (cached best score, TTL 24h) - User's best score cache
- `lb:user:profile:{userId}` - Hash (username cache, TTL 1h) - User profile cache
- `lb:ratelimit:{endpoint}:{userId}` - String (rate limit counter) - Per-user rate limiting

## API Testing

### Running Tests

```bash
# Run all tests
npm test

# Run specific test file
node --test tests/health.test.js

# Watch mode
npm run test:watch
```

### Test Infrastructure

Tests use `node:test` (native Node.js test runner) with `mock.module` for mocking dependencies. Each test file:

1. **Mocks** Prisma and Redis services before importing the app
2. **Starts** the Express app on a random port (`app.listen(0)`)
3. **Tests** HTTP endpoints using `fetch()` against the running app
4. **Asserts** response status codes and JSON body structure

**Note**: The test suite uses `mock.module` from `node:test`. Compatibility with Node.js 24 may require updates to the mock imports. The health check tests are verified working against the running server.

### Manual API Testing

The API can be tested via `curl` or `fetch` against the running server:

```bash
# Health check
curl http://localhost:3000/api/health

# Leaderboard (optional auth)
curl http://localhost:3000/api/leaderboard/game1

# Score submission (requires auth)
curl -X POST http://localhost:3000/api/scores \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"gameId":"game1","score":1000}'
```

## Git Workflow

```bash
# Feature completion
git add -A
git commit -m "feat(scope): description"

# Examples:
git commit -m "feat(auth): implement user authentication with Better-Auth"
git commit -m "feat(score): implement score submission with Redis Sorted Sets"
git commit -m "fix(redis): handle connection retry logic"
git commit -m "docs(scope): update API documentation"
```

## Documentation

Each feature has implementation docs in `docs/NNN-feature-name.md` with:
- Implementation summary
- Key decisions
- Rollback instructions
- Opencode usage notes

Example: `docs/002-score-submission.md`, `docs/003-leaderboard-updates.md`, etc.

## License

MIT