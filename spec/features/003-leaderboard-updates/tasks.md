# 003-leaderboard-updates Tasks

## 1. Validation Schema
- [ ] 1.1 Create `backend/src/schemas/leaderboard.schema.ts` with leaderboardQuerySchema

## 2. Redis Service Methods
- [ ] 2.1 Add `getLeaderboard(gameId, limit, offset)` to redis.service.ts
- [ ] 2.2 Add `getLeaderboardTotal(gameId)` to redis.service.ts
- [ ] 2.3 Add `getUserProfiles(userIds)` for username resolution

## 3. Controller & Routes
- [ ] 3.1 Create `backend/src/controllers/leaderboard.controller.ts`
- [ ] 3.2 Implement `getLeaderboard` function
- [ ] 3.3 Create `backend/src/routes/leaderboard.routes.ts`
- [ ] 3.4 Register GET /api/leaderboard/:gameId

## 4. Username Resolution
- [ ] 4.1 Implement Redis hash `user:profile:{userId}` caching
- [ ] 4.2 Add fallback to PostgreSQL User model
- [ ] 4.3 Update cache on user profile changes (future)

## 5. Tests
- [ ] 5.1 Create `backend/tests/leaderboard.test.js`
- [ ] 5.2 Test successful leaderboard retrieval
- [ ] 5.3 Test pagination (limit, offset)
- [ ] 5.4 Test empty leaderboard
- [ ] 5.5 Test invalid gameId
- [ ] 5.6 Test username resolution (Redis cache hit/miss)
- [ ] 5.7 Test rank calculation (1-indexed)
- [ ] 5.8 Mock Redis and Prisma

## 6. Documentation
- [ ] 6.1 Create `docs/003-leaderboard-updates.md` with:
  - Implementation summary
  - Key decisions (ZREVRANGE, username caching)
  - Rollback instructions
  - Opencode usage notes

## 7. Git Commit
- [ ] 7.1 `git add -A`
- [ ] 7.2 `git commit -m "feat(leaderboard): implement global leaderboard endpoint with Redis Sorted Sets"`