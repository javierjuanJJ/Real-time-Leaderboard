# 004-user-rankings Tasks

## 1. Validation Schema
- [ ] 1.1 Add rankingParamsSchema to `backend/src/schemas/ranking.schema.ts`

## 2. Redis Service Methods
- [ ] 2.1 Add `getUserRank(gameId, userId)` to redis.service.ts
- [ ] 2.2 Add `getUserScore(gameId, userId)` to redis.service.ts
- [ ] 2.3 Add `getNearbyPlayers(gameId, rank, range)` to redis.service.ts
- [ ] 2.4 Add `getLeaderboardTotal(gameId)` to redis.service.ts

## 3. PostgreSQL Fallback
- [ ] 3.1 Add `getUserRankFromPostgres(gameId, userId)` to score.service.ts
- [ ] 3.2 Implement raw SQL for efficient rank calculation

## 4. Controller & Routes
- [ ] 4.1 Create `backend/src/controllers/ranking.controller.ts`
- [ ] 4.2 Implement `getMyRank` (GET /api/rankings/me/:gameId)
- [ ] 4.3 Implement `getUserRank` (GET /api/rankings/:userId/:gameId)
- [ ] 4.4 Create `backend/src/routes/ranking.routes.ts`
- [ ] 4.5 Register routes with appropriate auth middleware

## 5. Username Resolution
- [ ] 5.1 Reuse user profile caching from leaderboard feature
- [ ] 5.2 Batch fetch usernames for nearby players

## 6. Tests
- [ ] 6.1 Create `backend/tests/ranking.test.js`
- [ ] 6.2 Test get my rank (has score, no score)
- [ ] 6.3 Test get any user rank (exists, not found, no score)
- [ ] 6.4 Test percentile calculation
- [ ] 6.5 Test nearby players (edges: top, bottom, middle)
- [ ] 6.6 Test Redis fallback to PostgreSQL
- [ ] 6.7 Mock Redis and Prisma

## 7. Documentation
- [ ] 7.1 Create `docs/004-user-rankings.md` with:
  - Implementation summary
  - Key decisions (ZREVRANK, percentile, fallback)
  - Rollback instructions
  - Opencode usage notes

## 8. Git Commit
- [ ] 8.1 `git add -A`
- [ ] 8.2 `git commit -m "feat(ranking): implement user rank queries with Redis and PostgreSQL fallback"`