# 008-rank-queries Specification

## Purpose
Provide comprehensive Redis Sorted Set read utilities for rank and range queries, supporting all leaderboard display needs including pagination, percentile calculation, and score range filtering.

## Requirements

### Requirement: Rank Queries
The system SHALL provide efficient rank lookup for any user in any game.

#### Scenario: Get user rank (highest score = rank 1)
- **WHEN** calling `getRank(gameId, userId)`
- **THEN** executes ZREVRANK on `lb:leaderboard:{gameId}`
- **THEN** returns 1-indexed rank (null if not ranked)
- **THEN** latency < 2ms

#### Scenario: Get user rank (lowest score = rank 1)
- **WHEN** calling `getRankAsc(gameId, userId)`
- **THEN** executes ZRANK on `lb:leaderboard:{gameId}`
- **THEN** returns 1-indexed rank

### Requirement: Score Queries
The system SHALL retrieve user's current score.

#### Scenario: Get exact score
- **WHEN** calling `getScore(gameId, userId)`
- **THEN** executes ZSCORE on `lb:leaderboard:{gameId}`
- **THEN** returns score as number (null if not ranked)

### Requirement: Range Queries
The system SHALL support flexible range-based leaderboard retrieval.

#### Scenario: Top N players
- **WHEN** calling `getTopPlayers(gameId, limit, offset)`
- **THEN** executes ZREVRANGE with WITHSCORES
- **THEN** returns array of { userId, score } with 1-indexed ranks

#### Scenario: Players around rank
- **WHEN** calling `getPlayersAroundRank(gameId, rank, range)`
- **THEN** calculates start/stop from rank
- **THEN** executes ZREVRANGE
- **THEN** returns players from rank-range to rank+range

#### Scenario: Players by score range
- **WHEN** calling `getPlayersByScoreRange(gameId, min, max, limit)`
- **THEN** executes ZREVRANGEBYSCORE (or ZRANGEBYSCORE for asc)
- **THEN** returns players within score bounds

### Requirement: Count Queries
The system SHALL provide counting utilities.

#### Scenario: Total players
- **WHEN** calling `getTotalPlayers(gameId)`
- **THEN** executes ZCARD on `lb:leaderboard:{gameId}`

#### Scenario: Players in score range
- **WHEN** calling `countPlayersInRange(gameId, min, max)`
- **THEN** executes ZCOUNT on `lb:leaderboard:{gameId}`

### Requirement: Percentile Calculation
The system SHALL calculate user percentile from rank.

#### Scenario: Percentile from rank
- **WHEN** calling `getPercentile(gameId, userId)`
- **THEN** gets rank and total
- **THEN** calculates: `Math.round((1 - rank / total) * 100)`
- **THEN** returns 0-100 (100 = top 1%)

### Requirement: Composite Queries
The system SHALL support combined rank + context queries.

#### Scenario: Full rank context
- **WHEN** calling `getRankContext(gameId, userId)`
- **THEN** returns: rank, score, percentile, totalPlayers, nearbyPlayers
- **THEN** single function, optimized (pipelined)

### Requirement: Performance
All queries SHALL meet latency targets.

#### Scenario: Single key queries
- **WHEN** any rank/score/range query
- **THEN** p99 < 5ms

#### Scenario: Composite queries
- **WHEN** getRankContext
- **THEN** p99 < 10ms (pipelined)