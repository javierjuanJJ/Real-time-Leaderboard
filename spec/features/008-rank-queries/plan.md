# 008-rank-queries Plan

## Overview
Comprehensive Redis Sorted Set read utilities for rank, score, range, and percentile queries with pipelined composite operations.

## Architecture Decisions

### Core Query Methods (in redis.service.ts)

```typescript
// Rank queries
async getRank(gameId, userId) {
  const rank = await this.redis.zrevrank(`lb:leaderboard:${gameId}`, userId);
  return rank !== null ? rank + 1 : null; // 1-indexed
}

async getRankAsc(gameId, userId) {
  const rank = await this.redis.zrank(`lb:leaderboard:${gameId}`, userId);
  return rank !== null ? rank + 1 : null;
}

// Score query
async getScore(gameId, userId) {
  return this.redis.zscore(`lb:leaderboard:${gameId}`, userId);
}

// Range queries
async getTopPlayers(gameId, limit, offset = 0) {
  const results = await this.redis.zrevrange(
    `lb:leaderboard:${gameId}`,
    offset,
    offset + limit - 1,
    'WITHSCORES'
  );
  return this.parseZRangeResults(results, offset);
}

async getPlayersAroundRank(gameId, rank, range = 5) {
  const start = Math.max(0, rank - 1 - range);
  const stop = rank - 1 + range;
  const results = await this.redis.zrevrange(
    `lb:leaderboard:${gameId}`,
    start,
    stop,
    'WITHSCORES'
  );
  return this.parseZRangeResults(results, start);
}

async getPlayersByScoreRange(gameId, min, max, limit = 50, offset = 0) {
  // ZREVRANGEBYSCORE for descending (high to low)
  const results = await this.redis.zrevrangebyscore(
    `lb:leaderboard:${gameId}`,
    max,
    min,
    'LIMIT', offset, limit,
    'WITHSCORES'
  );
  return this.parseZRangeResults(results, offset);
}

// Count queries
async getTotalPlayers(gameId) {
  return this.redis.zcard(`lb:leaderboard:${gameId}`);
}

async countPlayersInRange(gameId, min, max) {
  return this.redis.zcount(`lb:leaderboard:${gameId}`, min, max);
}

// Percentile
async getPercentile(gameId, userId) {
  const [rank, total] = await Promise.all([
    this.getRank(gameId, userId),
    this.getTotalPlayers(gameId)
  ]);
  if (!rank || !total) return 0;
  return Math.round((1 - (rank - 1) / total) * 100);
}

// Composite: Rank + Context (pipelined)
async getRankContext(gameId, userId) {
  const pipeline = this.redis.pipeline();
  const key = `lb:leaderboard:${gameId}`;
  
  pipeline.zrevrank(key, userId);
  pipeline.zscore(key, userId);
  pipeline.zcard(key);
  
  const [[, rank], [, score], [, total]] = await pipeline.exec();
  
  if (rank === null) {
    return { rank: null, score: null, percentile: 0, totalPlayers: total };
  }
  
  const rank1 = rank + 1;
  const percentile = Math.round((1 - rank / total) * 100);
  
  // Get nearby players
  const nearby = await this.getPlayersAroundRank(gameId, rank1, 3);
  
  return {
    rank: rank1,
    score,
    percentile,
    totalPlayers: total,
    nearbyPlayers: nearby
  };
}

// Helper
parseZRangeResults(results, startRank) {
  const players = [];
  for (let i = 0; i < results.length; i += 2) {
    players.push({
      rank: startRank + (i / 2) + 1,
      userId: results[i],
      score: parseFloat(results[i + 1])
    });
  }
  return players;
}
```

### Pipeline Optimization
- `getRankContext` uses pipeline for 3 commands in 1 round trip
- Batch multiple user rank lookups via pipeline

### Lua Script for Atomic Rank+Score
```lua
-- get_rank_score.lua
local rank = redis.call('ZREVRANK', KEYS[1], ARGV[1])
local score = redis.call('ZSCORE', KEYS[1], ARGV[1])
local total = redis.call('ZCARD', KEYS[1])
return {rank, score, total}
```

### Key Existence Check
```typescript
async leaderboardExists(gameId) {
  return this.redis.exists(`lb:leaderboard:${gameId}`);
}
```

## API Exposure
These are internal service methods, exposed via:
- 003-leaderboard-updates (getTopPlayers)
- 004-user-rankings (getRank, getRankContext)
- 005-top-players-report (getPlayersByScoreRange for realtime)

## Testing Strategy
- Unit test each method with ioredis-mock
- Integration test with real Redis
- Benchmark each query type

## Performance Targets
| Query Type | Target (p99) |
|------------|--------------|
| ZREVRANK/ZSCORE | < 2ms |
| ZREVRANGE (50) | < 5ms |
| ZREVRANGEBYSCORE | < 10ms |
| Pipeline (3 cmds) | < 5ms |
| getRankContext | < 10ms |