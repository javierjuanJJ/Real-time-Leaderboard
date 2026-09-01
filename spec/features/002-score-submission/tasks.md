# 002-score-submission Tasks

## 1. Database Setup
- [ ] 1.1 Add Game and Score models to Prisma schema
- [ ] 1.2 Run `npx prisma migrate dev --name add-game-score-models`
- [ ] 1.3 Seed initial games (optional)

## 2. Redis Service
- [ ] 2.1 Create `backend/src/services/redis.service.ts` (from feature 006)
- [ ] 2.2 Implement `updateLeaderboardScore(gameId, userId, score)` method
- [ ] 2.3 Implement `getUserScoreCache(userId, gameId)` method
- [ ] 2.4 Implement `setUserScoreCache(userId, gameId, score)` method

## 3. Validation Schema
- [ ] 3.1 Create `backend/src/schemas/score.schema.ts` with submitScoreSchema

## 4. Controller & Routes
- [ ] 4.1 Create `backend/src/controllers/score.controller.ts`
- [ ] 4.2 Implement `submitScore` function
- [ ] 4.3 Create `backend/src/routes/score.routes.ts`
- [ ] 4.4 Register POST /api/scores with auth middleware

## 5. Business Logic
- [ ] 5.1 Implement score comparison logic (Redis cache first)
- [ ] 5.2 Implement PostgreSQL upsert with Prisma
- [ ] 5.3 Implement Redis Sorted Set update (ZADD XX CH)
- [ ] 5.4 Implement rank retrieval (ZREVRANK)
- [ ] 5.5 Handle race conditions with Redis transactions

## 6. Tests
- [ ] 6.1 Create `backend/tests/score.test.js`
- [ ] 6.2 Test successful submission (new score)
- [ ] 6.3 Test score improvement (higher than previous)
- [ ] 6.4 Test score not improved (lower than previous)
- [ ] 6.5 Test unauthorized access
- [ ] 6.6 Test invalid gameId
- [ ] 6.7 Test invalid score values (negative, too high, non-integer)
- [ ] 6.8 Test idempotency (duplicate submissions)
- [ ] 6.9 Mock Redis and Prisma

## 7. Documentation
- [ ] 7.1 Create `docs/002-score-submission.md` with:
  - Implementation summary
  - Key decisions (cache-first, ZADD XX CH)
  - Rollback instructions
  - Opencode usage notes

## 8. Git Commit
- [ ] 8.1 `git add -A`
- [ ] 8.2 `git commit -m "feat(score): implement score submission with PostgreSQL and Redis Sorted Sets"`