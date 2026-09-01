# 003-leaderboard-updates Specification

## Purpose
Provide a real-time global leaderboard endpoint that returns top players for a specific game using Redis Sorted Sets for sub-millisecond query performance.

## Requirements

### Requirement: Get Global Leaderboard
The system SHALL return paginated leaderboard for a game.

#### Scenario: Successful leaderboard retrieval
- **WHEN** a user GETs `/api/leaderboard/:gameId` with optional query params
- **THEN** the system queries Redis Sorted Set `leaderboard:{gameId}`
- **AND** returns top players with rank, userId, username, score
- **AND** supports pagination (limit, offset)
- **AND** returns 200 with leaderboard data

#### Scenario: Empty leaderboard
- **WHEN** game has no scores yet
- **THEN** returns 200 with empty array and total: 0

#### Scenario: Invalid game
- **WHEN** gameId does not exist
- **THEN** returns 404 Not Found

#### Scenario: Pagination parameters
- **WHEN** limit and offset provided
- **THEN** returns requested page (default limit: 50, max: 100)
- **AND** includes pagination metadata (total, limit, offset, hasMore)

#### Scenario: Cache miss fallback
- **WHEN** Redis key doesn't exist
- **THEN** rebuild from PostgreSQL (background)
- **AND** return current data (may be empty initially)

### Requirement: Leaderboard Data Shape
The system SHALL return consistent data structure.

#### Scenario: Response format
- **WHEN** leaderboard returned
- **THEN** each entry contains: rank, userId, username, score, updatedAt
- **AND** rank is 1-indexed (1 = top player)
- **AND** sorted by score descending, then by updatedAt ascending (tiebreaker)

### Requirement: Real-time Consistency
The system SHALL reflect latest scores immediately.

#### Scenario: Score submitted
- **WHEN** new score submitted via 002-score-submission
- **THEN** subsequent leaderboard query reflects new score
- **AND** rank changes visible within 100ms