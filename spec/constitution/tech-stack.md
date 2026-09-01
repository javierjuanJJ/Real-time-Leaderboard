# Tech Stack - Real-time Leaderboard API

## Core Technologies

### Runtime & Framework
- **Node.js** >= 20.x (LTS) - ES Modules
- **Express.js** 4.x - REST API framework
- **Next.js** 14+ (App Router) - Frontend (separate repo, API consumed here)

### Database & ORM
- **PostgreSQL** 15+ - Primary relational database
- **Prisma ORM** 5.x - Type-safe database access, migrations
- **Prisma Client** - Generated client for database operations

### Caching & Real-time
- **Redis** 7.x - In-memory data store
- **Redis Sorted Sets** - Mandatory for leaderboard operations:
  - `ZADD` - Add/update scores
  - `ZINCRBY` - Increment scores atomically
  - `ZRANK` / `ZREVRANK` - Get user rank
  - `ZREVRANGE` - Get top players with scores
  - `ZRANGE` - Get players by rank range

### Authentication
- **Better-Auth** - Modern authentication library
- **Better-Auth Prisma Adapter** - Database integration
- **bcrypt** - Password hashing (via Better-Auth)
- **JWT** - Access/refresh tokens
- **Cookie-based sessions** - HttpOnly, Secure, SameSite

### Validation
- **Zod** 3.x - Schema validation
- **Zod Express Middleware** - Request validation

### Testing
- **node:test** - Native test runner (no Jest)
- **node:assert** - Native assertions
- **node:mock** - Mocking (if available) or manual mocks

### Development Tools
- **TypeScript** 5.x - Type safety
- **ESLint** + **Prettier** - Code quality
- **Husky** - Git hooks
- **tsx** - TypeScript execution

## Infrastructure
- **Docker** - Containerization
- **Docker Compose** - Local development
- **PostgreSQL** (Docker) - Local DB
- **Redis** (Docker) - Local cache

## Key Constraints
1. **NO async functions in `app.js`** - Export app only
2. **NO `run()` method in `app.js`** - Start via `server.js`
3. **ES Modules only** - `import`/`export` syntax
4. **Zod schemas in `src/schemas/`** - Separate files per domain
5. **Redis keys pattern**: `leaderboard:{gameId}`, `user:rank:{userId}`, `user:score:{userId}:{gameId}`