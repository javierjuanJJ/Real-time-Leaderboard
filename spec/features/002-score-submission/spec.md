# 002-score-submission Specification

## Purpose
Allow authenticated users to submit scores for specific games. Scores are persisted in PostgreSQL (source of truth) and immediately reflected in Redis Sorted Sets for real-time leaderboard queries.

## Requirements

### Requirement: Submit Score
The system SHALL accept score submissions from authenticated users.

#### Scenario: Successful score submission
- **WHEN** an authenticated user POSTs to `/api/scores` with valid gameId and score
- **THEN** the system validates the game exists
- **AND** upserts the score in PostgreSQL (keeps highest score per user per game)
- **AND** updates Redis Sorted Set `leaderboard:{gameId}` with user's score
- **AND** returns 201 with submitted score, new rank, and timestamp

#### Scenario: Score improvement
- **WHEN** user submits a higher score than their previous best
- **THEN** the system updates PostgreSQL record
- **AND** updates Redis with new higher score (ZADD with XX option)
- **AND** returns new rank reflecting improvement

#### Scenario: Score not improved
- **WHEN** user submits a score lower or equal to their best
- **THEN** the system does not update PostgreSQL
- **AND** does not update Redis
- **AND** returns 200 with current best score and rank

#### Scenario: Unauthorized submission
- **WHEN** request lacks valid JWT
- **THEN** returns 401 Unauthorized

#### Scenario: Invalid game
- **WHEN** gameId does not exist
- **THEN** returns 404 Not Found

#### Scenario: Invalid score value
- **WHEN** score is negative, not a number, or exceeds max (2,147,483,647)
- **THEN** returns 400 Bad Request

### Requirement: Game Validation
The system SHALL validate gameId against known games.

#### Scenario: Valid game
- **WHEN** gameId exists in games table
- **THEN** submission proceeds

#### Scenario: Invalid game
- **WHEN** gameId not in games table
- **THEN** returns 404

### Requirement: Idempotency
The system SHALL handle duplicate submissions gracefully.

#### Scenario: Duplicate request
- **WHEN** same request submitted twice (network retry)
- **THEN** second request returns same result as first
- **AND** no duplicate database records