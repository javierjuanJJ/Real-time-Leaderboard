# 007-realtime-updates Specification

## Purpose
Implement efficient Redis insertion patterns for real-time score updates using ZADD, ZINCRBY, and pipelining to ensure sub-millisecond leaderboard updates with atomicity guarantees.

## Requirements

### Requirement: Atomic Score Update
The system SHALL update leaderboard scores atomically.

#### Scenario: New score higher than current
- **WHEN** user submits score higher than current best
- **THEN** system uses ZADD with XX CH flags (only update if higher)
- **AND** operation is atomic (single Redis command)
- **AND** returns new score and rank

#### Scenario: Score increment
- **WHEN** game uses incremental scoring (e.g., points per action)
- **THEN** system uses ZINCRBY for atomic increment
- **AND** returns new total score

### Requirement: Conditional Updates
The system SHALL prevent score regression.

#### Scenario: Lower score rejected
- **WHEN** ZADD XX CH used with lower score
- **THEN** Redis returns nil (no update)
- **AND** system detects and returns current best

#### Scenario: Tie handling
- **WHEN** score equals current best
- **THEN** ZADD XX CH does not update (CH = changed only)
- **AND** timestamp tiebreaker handled in PostgreSQL

### Requirement: Batch Operations
The system SHALL support efficient bulk updates.

#### Scenario: Multiple game updates
- **WHEN** user submits scores for multiple games
- **THEN** system uses Redis pipeline
- **AND** all commands execute in single round trip
- **AND** results returned in order

### Requirement: Optimistic Locking
The system SHALL handle concurrent updates correctly.

#### Scenario: Concurrent submissions
- **WHEN** two requests for same user/game arrive simultaneously
- **THEN** Redis atomic operations ensure consistency
- **AND** last write wins (highest score)
- **AND** no lost updates

### Requirement: Performance Targets
The system SHALL meet strict latency requirements.

#### Scenario: Single update latency
- **WHEN** score update executed
- **THEN** p99 < 5ms (Redis only)
- **AND** p99 < 50ms (including PostgreSQL upsert)

#### Scenario: Throughput
- **WHEN** under load
- **THEN** supports 10,000 updates/second
- **AND** Redis CPU < 50%