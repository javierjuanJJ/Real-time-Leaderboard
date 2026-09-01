# 007-realtime-updates Plan

## Overview
Efficient Redis insertion patterns for real-time leaderboard updates using atomic Sorted Set operations.

## Architecture Decisions

### Core Redis Commands

#### ZADD with XX CH (Primary Pattern)
```typescript
// Only update if member exists AND new score is higher
// XX = only update existing members
// CH = return count of changed members (not just added)
const result = await redis.zadd(
  `lb:leaderboard:${gameId}`,
  'XX', 'CH',
  newScore,
  userId
);
// result = number of changed elements (0 or 1)
```

#### ZINCRBY (Incremental Pattern)
```typescript
// Atomic increment, creates member if not exists
const newScore = await redis.zincrby(
  `lb:leaderboard:${gameId}`,
  increment,
  userId
);
```

#### Pipeline for Batch
```typescript
const pipeline = redis.pipeline();
pipeline.zadd(`lb:leaderboard:${gameId1}`, 'XX', 'CH', score1, userId);
pipeline.zadd(`lb:leaderboard:${gameId2}`, 'XX', 'CH', score2, userId);
const results = await pipeline.exec();
```

### Update Strategies

#### Strategy 1: Cache-First (Used by 002-score-submission)
1. Check Redis cache `lb:user:score:${userId}:${gameId}`
2. If newScore <= cached: return early (no Redis/DB write)
3. Else: PostgreSQL upsert → Redis ZADD XX CH → Update cache

#### Strategy 2: Direct Redis (For incremental games)
1. ZINCRBY directly
2. Async PostgreSQL sync (eventual consistency)
3. Use for high-frequency updates (e.g., clicker games)

### PostgreSQL Synchronization
- Source of truth remains PostgreSQL
- Redis updated synchronously for read path
- Background job reconciles drift (hourly)

### Tiebreaking
- Redis Sorted Set: scores are doubles, ties broken by lexicographic member order
- Member = userId (cuid) - not ideal for timestamp tiebreaker
- Solution: Encode timestamp in score: `score * 1e12 + (maxTimestamp - timestamp)`
- Or: Handle tiebreaker in PostgreSQL, Redis shows approximate rank

### Service Methods (in redis.service.ts)
```typescript
// Atomic conditional update (returns { updated: boolean, newScore: number })
async updateScoreIfHigher(gameId, userId, newScore) {
  const result = await this.redis.zadd(
    `lb:leaderboard:${gameId}`, 'XX', 'CH', newScore, userId
  );
  if (result === 1) {
    const score = await this.redis.zscore(`lb:leaderboard:${gameId}`, userId);
    return { updated: true, newScore: score };
  }
  const currentScore = await this.redis.zscore(`lb:leaderboard:${gameId}`, userId);
  return { updated: false, newScore: currentScore };
}

// Atomic increment
async incrementScore(gameId, userId, increment) {
  return this.redis.zincrby(`lb:leaderboard:${gameId}`, increment, userId);
}

// Batch update
async batchUpdateScores(updates: { gameId, userId, score }[]) {
  const pipeline = this.redis.pipeline();
  for (const u of updates) {
    pipeline.zadd(`lb:leaderboard:${u.gameId}`, 'XX', 'CH', u.score, u.userId);
  }
  return pipeline.exec();
}
```

### Error Handling
- Redis connection failure: Queue for retry, fallback to PostgreSQL-only
- ZADD returns 0: Score not higher, return current
- Pipeline partial failure: Process results individually

## Performance Optimization
- Lua scripts for complex atomic operations (future)
- Connection pooling (10 connections)
- Pipeline for multi-game submissions
- Avoid round trips: combine ZADD + ZREVRANK in pipeline