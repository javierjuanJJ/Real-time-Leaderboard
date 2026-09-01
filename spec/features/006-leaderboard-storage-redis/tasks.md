# 006-leaderboard-storage-redis Tasks

## 1. Dependencies
- [ ] 1.1 Install ioredis: `npm install ioredis`
- [ ] 1.2 Install @types/ioredis if needed

## 2. Redis Service
- [ ] 2.1 Create `backend/src/services/redis.service.ts`
- [ ] 2.2 Configure ioredis client with env vars
- [ ] 2.3 Implement connection event handlers (connect, ready, error, close)
- [ ] 2.4 Implement graceful shutdown

## 3. Sorted Set Utilities
- [ ] 3.1 Implement `leaderboard.addScore()`
- [ ] 3.2 Implement `leaderboard.incrementScore()`
- [ ] 3.3 Implement `leaderboard.getRank()`
- [ ] 3.4 Implement `leaderboard.getScore()`
- [ ] 3.5 Implement `leaderboard.getTopPlayers()`
- [ ] 3.6 Implement `leaderboard.getPlayersInRange()`
- [ ] 3.7 Implement `leaderboard.getTotalPlayers()`
- [ ] 3.8 Implement `leaderboard.removePlayer()`
- [ ] 3.9 Implement `leaderboard.countInRange()`

## 4. Cache Utilities
- [ ] 4.1 Implement `cache.getUserScore()` / `setUserScore()`
- [ ] 4.2 Implement `cache.getUserProfile()` / `setUserProfile()`

## 5. Pipeline Support
- [ ] 5.1 Add `leaderboard.pipeline()` method returning ioredis pipeline
- [ ] 5.2 Document usage for bulk operations

## 6. Health Check
- [ ] 6.1 Implement `healthCheck()` method
- [ ] 6.2 Create `backend/src/routes/health.routes.ts`
- [ ] 6.3 Register GET /api/health/redis

## 7. Tests
- [ ] 7.1 Create `backend/tests/redis.test.js`
- [ ] 7.2 Test client connection
- [ ] 7.3 Test health check (healthy/unhealthy)
- [ ] 7.4 Test Sorted Set operations (add, rank, range, count)
- [ ] 7.5 Test cache operations (get/set with TTL)
- [ ] 7.6 Test pipeline execution
- [ ] 7.7 Mock Redis for unit tests (use ioredis-mock or manual mock)

## 8. Documentation
- [ ] 8.1 Create `docs/006-leaderboard-storage-redis.md` with:
  - Implementation summary
  - Key decisions (ioredis, key prefix, connection pooling)
  - Rollback instructions
  - Opencode usage notes

## 9. Git Commit
- [ ] 9.1 `git add -A`
- [ ] 9.2 `git commit -m "feat(redis): implement Redis client and Sorted Set utilities for leaderboard"`