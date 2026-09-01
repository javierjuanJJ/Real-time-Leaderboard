# 007-realtime-updates - Implementation Documentation

## Implementation Summary

Efficient Redis insertion patterns using ZADD XX CH for conditional updates, ZINCRBY for atomic increments, and pipelining for batch operations. Ensures sub-millisecond leaderboard updates with atomicity.

## Key Decisions

1. **ZADD XX CH Pattern**: Primary update mechanism - only updates existing member if new score is higher. Atomic, single round trip.

2. **ZINCRBY for Incremental Games**: Atomic score increment for games with progressive scoring.

3. **Pipeline for Batch**: Multiple game updates in single round trip.

4. **Cache-First Optimization**: Check `lb:user:score:{userId}:{gameId}` before Redis/DB writes.

5. **PostgreSQL as Source of Truth**: Redis updated synchronously; background reconciliation job handles drift.

## File Structure

```
backend/
├── src/
│   ├── services/
│   │   └── redis.service.ts       # updateScoreIfHigher, incrementScore, batchUpdateScores, updateScoreAndGetRank
│   ├── controllers/
│   │   └── score.controller.ts    # Updated to use new patterns
│   └── scripts/
│       └── update_score_if_higher.lua  # Optional Lua script
└── tests/
    └── realtime-updates.test.js
```

## Core Methods

### updateScoreIfHigher(gameId, userId, newScore)
```typescript
// Returns { updated: boolean, newScore: number }
const result = await redis.zadd(
  `lb:leaderboard:${gameId}`, 'XX', 'CH', newScore, userId
);
```

### incrementScore(gameId, userId, increment)
```typescript
// Atomic increment, returns new score
const newScore = await redis.zincrby(
  `lb:leaderboard:${gameId}`, increment, userId
);
```

### batchUpdateScores(updates[])
```typescript
// Pipeline multiple updates
const pipeline = redis.pipeline();
updates.forEach(u => 
  pipeline.zadd(`lb:leaderboard:${u.gameId}`, 'XX', 'CH', u.score, u.userId)
);
return pipeline.exec();
```

### updateScoreAndGetRank(gameId, userId, score)
```typescript
// Pipeline: ZADD XX CH + ZREVRANK in single round trip
const pipeline = redis.pipeline();
pipeline.zadd(`lb:leaderboard:${gameId}`, 'XX', 'CH', score, userId);
pipeline.zrevrank(`lb:leaderboard:${gameId}`, userId);
const [[, updated], [, rank]] = await pipeline.exec();
```

## Rollback Instructions

```bash
# 1. Remove realtime update methods from redis.service.ts
# Revert to basic ZADD in score.controller.ts

# 2. Remove Lua script if created
rm backend/src/scripts/update_score_if_higher.lua

# 3. Remove test file
rm backend/tests/realtime-updates.test.js

# 4. Commit rollback
git commit -m "revert: remove realtime update optimizations"
```

## Opencode Usage Notes

- Test atomic update: `redis-cli ZADD lb:leaderboard:<gameId> XX CH 2000 <userId>`
- Test increment: `redis-cli ZINCRBY lb:leaderboard:<gameId> 100 <userId>`
- Benchmark: `wrk -t4 -c100 -d30s -s post_score.lua http://localhost:3000/api/scores`
- Run tests: `npm test -- backend/tests/realtime-updates.test.js`
- Monitor Redis CPU: `redis-cli INFO CPU`