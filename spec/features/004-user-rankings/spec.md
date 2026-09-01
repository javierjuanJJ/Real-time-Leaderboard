# 004-user-rankings Specification

## Purpose
Allow users to query their own rank or any user's rank in a specific game using Redis Sorted Sets for instant rank retrieval.

## Requirements

### Requirement: Get Current User's Rank
The system SHALL return the authenticated user's rank in a game.

#### Scenario: User has rank
- **WHEN** authenticated user GETs `/api/rankings/me/:gameId`
- **THEN** system queries Redis ZREVRANK for userId in `leaderboard:{gameId}`
- **AND** returns rank (1-indexed), score, percentile, and nearby players
- **AND** returns 200 with rank data

#### Scenario: User not ranked
- **WHEN** user has no score for the game
- **THEN** returns 200 with rank: null, score: 0, message "No score submitted yet"

### Requirement: Get Any User's Rank
The system SHALL allow querying any user's rank (public info).

#### Scenario: Valid user
- **WHEN** GET `/api/rankings/:userId/:gameId`
- **THEN** returns rank, score, percentile for that user
- **AND** does not require authentication

#### Scenario: User not found
- **WHEN** userId does not exist
- **THEN** returns 404 Not Found

#### Scenario: User not ranked
- **WHEN** user has no score for the game
- **THEN** returns 200 with rank: null, score: 0

### Requirement: Rank Data Enrichment
The system SHALL provide context around the rank.

#### Scenario: Rank response includes
- **WHEN** rank returned
- **THEN** includes: rank (1-indexed), score, percentile, totalPlayers
- **AND** nearby players: 3 above and 3 below (if exist)
- **AND** nearby players include: rank, userId, username, score

### Requirement: Fallback to PostgreSQL
The system SHALL handle Redis cache misses.

#### Scenario: Redis key missing
- **WHEN** `leaderboard:{gameId}` doesn't exist in Redis
- **THEN** query PostgreSQL for user's score
- **AND** calculate rank from PostgreSQL (slower)
- **AND** return data with source: "postgresql"