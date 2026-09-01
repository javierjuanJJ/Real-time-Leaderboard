# 007-realtime-updates Tasks

## 1. Redis Service Extensions
- [ ] 1.1 Add `updateScoreIfHigher(gameId, userId, score)` to redis.service.ts
- [ ] 1.2 Add `incrementScore(gameId, userId, increment)` to redis.service.ts
- [ ] 1.3 Add `batchUpdateScores(updates[])` to redis.service.ts
- [ ] 1.4 Add `updateScoreAndGetRank(gameId, userId, score)` (pipeline ZADD + ZREVRANK)

## 2. Score Submission Integration
- [ ] 2.1 Update score.controller.ts to use `updateScoreIfHigher`
- [ ] 2.2 Handle `updated: false` case (return current best)
- [ ] 2.3 Add pipeline optimization for multi-game submissions

## 3. Lua Scripts (Optional - Advanced)
- [ ] 3.1 Create `update_score_if_higher.lua` for atomic check-and-set with rank
- [ ] 3.2 Register script with ioredis
- [ ] 3.3 Use for single-round-trip update + rank

## 4. Tests
- [ ] 4.1 Create `backend/tests/realtime-updates.test.js`
- [ ] 4.2 Test ZADD XX CH (higher score updates, lower score rejected)
- [ ] 4.3 Test ZINCRBY atomic increment
- [ ] 4.4 Test batch update with pipeline
- [ ] 4.5 Test concurrent updates (simulate race condition)
- [ ] 4.6 Test tie handling
- [ ] 4.7 Test Redis failure fallback
- [ ] 4.8 Benchmark: 10k updates/sec target
- [ ] 4.9 Mock Redis for unit tests

## 5. Documentation
- [ ] 5.1 Create `docs/007-realtime-updates.md` with:
  - Implementation summary
  - Key decisions (ZADD XX CH, ZINCRBY, pipeline)
  - Rollback instructions
  - Opencode usage notes

## 6. Git Commit
- [ ] 6.1 `git add -A`
- [ ] 6.2 `git commit -m "feat(redis): implement efficient real-time update patterns with ZADD XX CH and ZINCRBY"`