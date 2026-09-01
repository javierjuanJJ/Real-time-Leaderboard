# AGENTS.md - AI Assistant Instructions for Real-time Leaderboard API

## Project Context
- **Project**: Real-time Leaderboard API
- **Architecture**: Loop Engineering + Spec Driven Development (SDD)
- **Stack**: Node.js, Express, Next.js, Prisma ORM, PostgreSQL, Redis, Better-Auth, Zod
- **Testing**: node:test (native Node.js test runner)

## Core Principles
1. **Spec-First Development**: Never write code without a corresponding spec in `spec/features/NNN-name/`
2. **Constitution Compliance**: All code must follow rules in `spec/constitution/`
3. **Hard Limits in app.js**: NO async functions, NO run() method - export app, start via process.env.NODE_ENV
4. **Redis Sorted Sets**: Mandatory for leaderboard storage, real-time updates, rank queries
5. **Better-Auth + Prisma**: Authentication with proper password hashing

## Workflow
1. Read relevant spec in `spec/features/NNN-name/spec.md`
2. Review plan in `spec/features/NNN-name/plan.md`
3. Execute tasks from `spec/features/NNN-name/tasks.md`
4. Write tests using `node:test` and `node:assert`
5. Update docs/ with implementation notes and rollback instructions
6. Commit with conventional commit message

## File Structure Rules
- `backend/app.js` - Export Express app only, no async, no run()
- `backend/server.js` - Entry point, starts server based on NODE_ENV
- `backend/prisma/schema.prisma` - Database models
- `backend/src/routes/` - Route handlers
- `backend/src/controllers/` - Business logic
- `backend/src/middleware/` - Validation, auth, error handling
- `backend/src/services/` - Redis, external services
- `backend/src/schemas/` - Zod validation schemas
- `backend/tests/` - Test files using node:test

## Code Conventions
- Use ES Modules (import/export)
- Zod schemas in separate files under `schemas/`
- Redis keys: `leaderboard:{gameId}`, `user:rank:{userId}`
- Prisma models: PascalCase, relations explicit
- Error handling: Centralized middleware, proper HTTP codes

## Testing Requirements
- Every feature must have tests in `backend/tests/`
- Use `node:test` and `node:assert` only
- Test both success and error paths
- Mock Redis and Prisma in unit tests

## Git Commits
Format: `feat(scope): description` / `fix(scope): description` / `docs(scope): description`
Each feature completion: `git commit -m "feat: implement NNN-feature-name"`

## Documentation
- Each feature gets a `docs/NNN-feature-name.md` with:
  - Implementation summary
  - Key decisions
  - Rollback instructions
  - Opencode usage notes