# Real-time Leaderboard API

High-performance real-time leaderboard system built with Node.js, Express, Prisma, PostgreSQL, Redis, and Better-Auth.

## Architecture

- **Loop Engineering + Spec Driven Development (SDD)**
- **Spec-first**: All features defined in `spec/features/NNN-name/` before implementation
- **Constitution**: Rules in `spec/constitution/`

## Tech Stack

- **Runtime**: Node.js 20+ (ES Modules)
- **Framework**: Express.js
- **Database**: PostgreSQL + Prisma ORM
- **Cache/Leaderboard**: Redis 7 (Sorted Sets)
- **Auth**: Better-Auth + Prisma Adapter
- **Validation**: Zod
- **Testing**: node:test (native)

## Quick Start

### Prerequisites
- Node.js 20+
- PostgreSQL 15+
- Redis 7+

### Local Development

```bash
# 1. Start infrastructure
docker-compose up -d

# 2. Install dependencies
cd backend && npm install

# 3. Setup environment
cp .env.example .env
# Edit .env with your values

# 4. Setup database
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed

# 5. Start development server
npm run dev
```

Server runs at `http://localhost:3000`

### API Endpoints

#### Authentication
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login |
| POST | `/api/auth/logout` | Logout |
| POST | `/api/auth/refresh` | Refresh access token |
| GET | `/api/auth/me` | Get current user |

#### Scores (Auth Required)
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/scores` | Submit score |

#### Leaderboard
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/leaderboard/:gameId` | Global leaderboard |

#### Rankings
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/rankings/me/:gameId` | My rank |
| GET | `/api/rankings/:userId/:gameId` | User's rank |

#### Reports
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/reports/top-players` | Top players report |

#### Health
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/health` | Overall health |
| GET | `/api/health/redis` | Redis health |
| GET | `/api/health/db` | Database health |

## Project Structure

```
Real-time-Leaderboard/
├── AGENTS.md                    # AI assistant instructions
├── spec/
│   ├── constitution/            # Project constitution
│   │   ├── mission.md
│   │   ├── tech-stack.md
│   │   └── roadmap.md
│   └── features/                # Feature specifications
│       ├── 001-user-authentication/
│       ├── 002-score-submission/
│       ├── 003-leaderboard-updates/
│       ├── 004-user-rankings/
│       ├── 005-top-players-report/
│       ├── 006-leaderboard-storage-redis/
│       ├── 007-realtime-updates/
│       └── 008-rank-queries/
├── docs/                        # Implementation documentation
└── backend/
    ├── app.js                   # Express app (NO async, NO run())
    ├── server.js                # Entry point
    ├── prisma/schema.prisma     # Database models
    ├── src/
    │   ├── lib/                 # Core libraries (auth, etc.)
    │   ├── middleware/          # Express middleware
    │   ├── controllers/         # Business logic
    │   ├── routes/              # Route handlers
    │   ├── services/            # External services (Redis)
    │   └── schemas/             # Zod validation schemas
    └── tests/                   # node:test files
```

## Key Constraints

1. **app.js**: Export only, no async functions, no `run()` method
2. **Redis Sorted Sets**: Mandatory for leaderboard operations
3. **Spec-first**: Never write code without corresponding spec
4. **Tests**: Use `node:test` and `node:assert` only

## Redis Key Patterns

- `lb:leaderboard:{gameId}` - Sorted Set (member: userId, score: score)
- `lb:user:score:{userId}:{gameId}` - String (cached best score, TTL 24h)
- `lb:user:profile:{userId}` - Hash (username cache, TTL 1h)
- `lb:ratelimit:{endpoint}:{userId}` - String (rate limit counter)

## Testing

```bash
# Run all tests
npm test

# Run specific test file
node --test tests/health.test.js

# Watch mode
npm run test:watch
```

## Git Workflow

```bash
# Feature completion
git add -A
git commit -m "feat(scope): description"

# Examples:
git commit -m "feat(auth): implement user authentication with Better-Auth"
git commit -m "feat(score): implement score submission with Redis Sorted Sets"
git commit -m "fix(redis): handle connection retry logic"
```

## Documentation

Each feature has implementation docs in `docs/NNN-feature-name.md` with:
- Implementation summary
- Key decisions
- Rollback instructions
- Opencode usage notes

## License

MIT