# Mission - Real-time Leaderboard API

## Purpose
Build a high-performance, real-time leaderboard system that allows users to submit scores for games and instantly see global rankings, their personal position, and top player reports.

## Vision
Create a scalable backend API that powers competitive gaming experiences with sub-millisecond leaderboard updates using Redis Sorted Sets, while maintaining data persistence in PostgreSQL via Prisma ORM.

## Core Values
1. **Performance First**: Real-time updates via Redis Sorted Sets (ZADD, ZINCRBY, ZRANK, ZREVRANGE)
2. **Data Integrity**: PostgreSQL as source of truth, Redis as high-speed cache
3. **Security**: Better-Auth with proper password hashing, JWT tokens, rate limiting
4. **Developer Experience**: Spec-driven development, comprehensive tests, clear documentation
5. **Scalability**: Horizontal scaling ready, stateless services, efficient Redis operations

## Success Criteria
- Score submission latency < 50ms (p99)
- Leaderboard query latency < 20ms (p99)
- Support 100k+ concurrent users
- 99.9% uptime SLA
- Zero data loss on score submissions