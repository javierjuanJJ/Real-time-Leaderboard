# 008-rank-queries - Implementation Documentation

## Implementation Summary

Comprehensive Redis Sorted Set read utilities for rank, score, range, and percentile queries with pipelined composite operations for optimal performance.

## Key Decisions

1. **1-Indexed Ranks**: All rank outputs are 1-indexed (1 = top player) for user-facing display.

2. **Pipelined Composite Queries**: `getRankContext` uses pipeline for ZREVRANK + ZSCORE + ZCARD in single round trip.

3. **ZREVRANGEBYSCORE for Score Ranges**: Efficient score-based range queries.

4. **Percentile Formula**: `Math.round((1 - (rank - 1) / total) * 100)` - top 1% = 100th percentile.

5. **Nearby Players**: Returns configurable range around target rank (default ±3).

6. **Lua Script Option**: Atomic rank+score+total in single command for highest consistency.

## File Structure

```
backend/
├── src/
│   ├── services/
│   │   └── redis.service.ts       # All rank query methods
│   ├── scripts/
│   │   └── get_rank_score.lua     # Optional Lua script
│   └── tests/
│       └── rank-queries.test.js
```

## Core Methods

### getRank(gameId, userId) → number | null
```typescript
const rank = await redis.zrevrank(`lb:leaderboard:${gameId}`, userId);
return rank !== null ? rank + 1 : null;
```

### getScore(gameId, userId) → number | null
```typescript
return redis.zscore(`lb:leaderboard:${gameId}`, userId);
```

### getTopPlayers(gameId, limit, offset) → Player[]
```typescript
const results = await redis.zrevrange(key, offset, offset + limit - 1, 'WITHSCORES');
return parseZRangeResults(results, offset);
```

### getPlayersAroundRank(gameId, rank, range) → Player[]
```typescript
const start = Math.max(0, rank - 1 - range);
const stop = rank - 1 + range;
const results = await redis.zrevrange(key, start, stop, 'WITHSCORES');
```

### getPlayersByScoreRange(gameId, min, max, limit, offset) → Player[]
```typescript
const results = await redis.zrevrangebyscore(key, max, min, 'LIMIT', offset, limit, 'WITHSCORES');
```

### getTotalPlayers(gameId) → number
```typescript
return redis.zcard(`lb:leaderboard:${gameId}`);
```

### getPercentile(gameId, userId) → number
```typescript
const [rank, total] = await Promise.all([getRank(...), getTotalPlayers(...)]);
return rank && total ? Math.round((1 - (rank - 1) / total) * 100) : 0;
```

### getRankContext(gameId, userId) → RankContext
```typescript
// Pipelined: ZREVRANK + ZSCORE + ZCARD
const pipeline = redis.pipeline();
pipeline.zrevrank(key, userId);
pipeline.zscore(key, userId);
pipeline.zcard(key);
const [[, rank], [, score], [, total]] = await pipeline.exec();
// + getPlayersAroundRank
```

## Rollback Instructions

```bash
# 1. Remove rank query methods from redis.service.ts
# Keep only methods used by other features (getTopPlayers, getTotalPlayers)

# 2. Remove Lua script if created
rm backend/src/scripts/get_rank_score.lua

# 3. Remove test file
rm backend/tests/rank-queries.test.js

# 4. Commit rollback
git commit -m "revert: remove advanced rank query utilities"
```

## Opencode Usage Notes

- Test rank: `redis-cli ZREVRANK lb:leaderboard:<gameId> <userId>`
- Test score: `redis-cli ZSCORE lb:leaderboard:<gameId> <userId>`
- Test range: `redis-cli ZREVRANGE lb:leaderboard:<gameId> 0 9 WITHSCORES`
- Test score range: `redis-cli ZREVRANGEBYSCORE lb:leaderboard:<gameId> +inf 1000 LIMIT 0 10 WITHSCORES`
- Run tests: `npm test -- backend/tests/rank-queries.test.js`
- Benchmark each query type with `redis-benchmark`