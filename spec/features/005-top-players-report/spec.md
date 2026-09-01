# 005-top-players-report Specification

## Purpose
Generate reports of top players across games for specific time periods, combining historical data from PostgreSQL with real-time data from Redis.

## Requirements

### Requirement: Top Players Report
The system SHALL generate a report of top players for a game within a time period.

#### Scenario: Daily report
- **WHEN** GET `/api/reports/top-players?gameId=xxx&period=daily&limit=10`
- **THEN** system queries PostgreSQL for scores submitted in last 24 hours
- **AND** aggregates by user (highest score in period)
- **AND** returns top N players with score, rank, and submission time
- **AND** returns 200 with report data

#### Scenario: Weekly report
- **WHEN** period=weekly
- **THEN** uses last 7 days of data

#### Scenario: Monthly report
- **WHEN** period=monthly
- **THEN** uses last 30 days of data

#### Scenario: All-time report
- **WHEN** period=all
- **THEN** uses all historical data (current best scores)

#### Scenario: Real-time snapshot
- **WHEN** period=realtime
- **THEN** reads directly from Redis Sorted Set
- **AND** returns current live leaderboard

### Requirement: Report Export
The system SHALL support multiple output formats.

#### Scenario: JSON format
- **WHEN** Accept: application/json (default)
- **THEN** returns JSON response

#### Scenario: CSV format
- **WHEN** Accept: text/csv or ?format=csv
- **THEN** returns CSV with headers: rank,userId,username,score,period,submittedAt

### Requirement: Report Parameters
The system SHALL validate and support flexible query parameters.

#### Scenario: Valid parameters
- **WHEN** gameId (required), period (enum), limit (1-1000, default 50)
- **THEN** proceeds with query

#### Scenario: Invalid game
- **WHEN** gameId not found
- **THEN** returns 404

#### Scenario: Invalid period
- **WHEN** period not in [daily, weekly, monthly, all, realtime]
- **THEN** returns 400

### Requirement: Performance
The system SHALL generate reports efficiently.

#### Scenario: Historical queries
- **WHEN** period is daily/weekly/monthly/all
- **THEN** uses PostgreSQL indexes on Score.createdAt
- **AND** query completes < 500ms for 1M scores

#### Scenario: Real-time queries
- **WHEN** period=realtime
- **THEN** uses Redis ZREVRANGE
- **AND** query completes < 20ms