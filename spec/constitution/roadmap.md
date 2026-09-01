# Roadmap - Real-time Leaderboard API

## Phase 1: Foundation (Features 001, 006)
**Timeline**: Week 1-2
**Goal**: Core infrastructure, authentication, Redis setup

### 001-user-authentication
- User registration with email/password
- User login with JWT tokens
- Better-Auth + Prisma integration
- Password hashing via bcrypt
- Session management (cookies)
- Protected routes middleware

### 006-leaderboard-storage-redis
- Redis client configuration (ioredis)
- Connection pooling
- Health checks
- Key naming conventions
- Basic Sorted Set operations wrapper

## Phase 2: Core Leaderboard (Features 002, 003, 007)
**Timeline**: Week 2-3
**Goal**: Score submission, real-time updates, leaderboard queries

### 002-score-submission
- POST `/api/scores` - Submit score for a game
- Validate: gameId, score, userId (from auth)
- Upsert score in PostgreSQL (source of truth)
- Update Redis Sorted Set atomically
- Return updated rank

### 003-leaderboard-updates
- GET `/api/leaderboard/:gameId` - Global leaderboard
- Query Redis Sorted Set (ZREVRANGE)
- Pagination support (limit, offset)
- Response: rank, userId, username, score, timestamp

### 007-realtime-updates
- Efficient Redis insertion patterns
- ZINCRBY for incremental updates
- Pipeline/batch operations for bulk
- Optimistic locking for consistency
- Pub/Sub for real-time notifications (future)

## Phase 3: User Rankings & Reports (Features 004, 005, 008)
**Timeline**: Week 3-4
**Goal**: Personal rankings, top players reports, advanced queries

### 004-user-rankings
- GET `/api/rankings/me/:gameId` - Current user's rank
- GET `/api/rankings/:userId/:gameId` - Any user's rank
- Query Redis (ZREVRANK)
- Fallback to PostgreSQL if not in Redis
- Include percentile, nearby players

### 008-rank-queries
- Redis utility functions:
  - `getRank(gameId, userId)` - ZREVRANK
  - `getScore(gameId, userId)` - ZSCORE
  - `getTopPlayers(gameId, limit)` - ZREVRANGE
  - `getPlayersInRange(gameId, start, stop)` - ZRANGE
  - `getPercentile(gameId, userId)` - Calculate from rank/total

### 005-top-players-report
- GET `/api/reports/top-players` - Top players report
- Query params: gameId, period (daily/weekly/monthly), limit
- Aggregate from PostgreSQL (historical)
- Redis for real-time current snapshot
- Export: JSON, CSV

## Phase 4: Polish & Production (Week 4-5)
- Comprehensive test coverage (>80%)
- API documentation (OpenAPI/Swagger)
- Rate limiting, CORS, security headers
- Monitoring/observability (metrics, logs)
- CI/CD pipeline
- Load testing
- Documentation in `docs/`

## Future Enhancements (Post-MVP)
- WebSocket real-time updates
- Multi-region Redis replication
- Seasonal leaderboards
- Team/clan leaderboards
- Anti-cheat integration
- Admin dashboard