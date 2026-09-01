# 008-rank-queries Tasks

## 1. Redis Service Methods
- [ ] 1.1 Add `getRank(gameId, userId)` to redis.service.ts
- [ ] 1.2 Add `getRankAsc(gameId, userId)` to redis.service.ts
- [ ] 1.3 Add `getScore(gameId, userId)` to redis.service.ts
- [ ] 1.4 Add `getTopPlayers(gameId, limit, offset)` to redis.service.ts
- [ ] 1.5 Add `getPlayersAroundRank(gameId, rank, range)` to redis.service.ts
- [ ] 1.6 Add `getPlayersByScoreRange(gameId, min, max, limit, offset)` to redis.service.ts
- [ ] 1.7 Add `getTotalPlayers(gameId)` to redis.service.ts
- [ ] 1.8 Add `countPlayersInRange(gameId, min, max)` to redis.service.ts
- [ ] 1.9 Add `getPercentile(gameId, userId)` to redis.service.ts
- [ ] 1.10 Add `getRankContext(gameId, userId)` to redis.service.ts
- [ ] 1.11 Add `leaderboardExists(gameId)` to redis.service.ts
- [ ] 1.12 Add `parseZRangeResults()` helper

## 2. Lua Scripts (Optional)
- [ ] 2.1 Create `backend/src/scripts/get_rank_score.lua`
- [ ] 2.2 Register script in redis.service.ts
- [ ] 2.3 Add `getRankScoreAtomic(gameId, userId)` using script

## 3. Tests
- [ ] 3.1 Create `backend/tests/rank-queries.test.js`
- [ ] 3.2 Test getRank (exists, not exists, 1-indexed)
- [ ] 3.3 Test getScore
- [ ] 3.4 Test getTopPlayers (pagination, with scores)
- [ ] 3.5 Test getPlayersAroundRank (edges: top, bottom, middle)
- [ ] 3.6 Test getPlayersByScoreRange
- [ ] 3.7 Test getTotalPlayers
- [ ] 3.8 Test countPlayersInRange
- [ ] 3.9 Test getPercentile calculation
- [ ] 3.10 Test getRankContext (pipelined, nearby players)
- [ ] 3.11 Test leaderboardExists
- [ ] 3.12 Benchmark each query type
- [ ] 3.13 Mock Redis for unit tests

## 4. Documentation
- [ ] 4.1 Create `docs/008-rank-queries.md` with:
  - Implementation summary
  - Key decisions (pipelining, 1-indexed ranks, ZREVRANGEBYSCORE)
  - Rollback instructions
  - Opencode usage notes

## 5. Git Commit
- [ ] 5.1 `git add -A`
- [ ] 5.2 `git commit -m "feat(redis): implement comprehensive rank and range query utilities"`