# 006-leaderboard-storage-redis Specification

## Purpose
Establish the foundational Redis infrastructure including client configuration, connection management, health checks, and base Sorted Set utilities for all leaderboard features.

## Requirements

### Requirement: Redis Client Configuration
The system SHALL provide a configured Redis client with connection pooling.

#### Scenario: Client initialization
- **WHEN** application starts
- **THEN** Redis client connects using environment variables
- **AND** connection pool is established (max 10 connections)
- **AND** client emits 'ready' event
- **AND** graceful shutdown on SIGTERM/SIGINT

#### Scenario: Connection failure
- **WHEN** Redis is unavailable
- **THEN** client retries with exponential backoff
- **AND** logs error but doesn't crash application
- **AND** health check returns unhealthy

### Requirement: Health Checks
The system SHALL provide Redis health check endpoint.

#### Scenario: Health check
- **WHEN** GET `/api/health/redis`
- **THEN** executes PING command
- **AND** returns 200 with { status: "healthy", latencyMs }
- **OR** returns 503 with { status: "unhealthy", error }

### Requirement: Key Naming Conventions
The system SHALL enforce consistent Redis key patterns.

#### Scenario: Leaderboard keys
- **WHEN** storing game leaderboard
- **THEN** key format: `leaderboard:{gameId}` (Sorted Set)

#### Scenario: User score cache
- **WHEN** caching user's best score
- **THEN** key format: `user:score:{userId}:{gameId}` (String, TTL 24h)

#### Scenario: User profile cache
- **WHEN** caching username
- **THEN** key format: `user:profile:{userId}` (Hash, TTL 1h)

#### Scenario: Rate limiting keys
- **WHEN** tracking API rate limits
- **THEN** key format: `ratelimit:{endpoint}:{userId}` (String, TTL per endpoint)

### Requirement: Base Sorted Set Operations
The system SHALL provide reusable Sorted Set utility functions.

#### Scenario: Core operations available
- **WHEN** any feature needs leaderboard operations
- **THEN** the following are available:
  - `zadd(key, score, member, options?)` - Add/update member
  - `zincrby(key, increment, member)` - Atomic increment
  - `zrevrank(key, member)` - Get rank (0-indexed, highest score = 0)
  - `zrank(key, member)` - Get rank (0-indexed, lowest score = 0)
  - `zscore(key, member)` - Get member's score
  - `zrevrange(key, start, stop, withScores?)` - Top N members
  - `zrange(key, start, stop, withScores?)` - Bottom N members
  - `zcard(key)` - Total count
  - `zrem(key, member)` - Remove member
  - `zcount(key, min, max)` - Count in score range

### Requirement: Pipeline/Batch Support
The system SHALL support batched operations for efficiency.

#### Scenario: Bulk score updates
- **WHEN** multiple scores need updating
- **THEN** pipeline executes atomically
- **AND** reduces round trips