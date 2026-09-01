# 001-user-authentication Plan

## Overview
Implement authentication using Better-Auth with Prisma adapter. This follows Better-Auth's recommended patterns for Express.js integration.

## Architecture Decisions

### Better-Auth Configuration
- Use `better-auth` package with Prisma adapter
- Email/password provider only (no OAuth for MVP)
- JWT strategy for access tokens (15 min)
- Database sessions for refresh tokens (7 days)
- bcrypt for password hashing (handled by Better-Auth)

### Database Schema (Prisma)
```prisma
model User {
  id            String    @id @default(cuid())
  email         String    @unique
  name          String?
  emailVerified Boolean   @default(false)
  image         String?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  accounts      Account[]
  sessions      Session[]
}

model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String? @db.Text
  access_token      String? @db.Text
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String? @db.Text
  session_state     String?

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime

  @@unique([identifier, token])
}
```

### API Endpoints
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login user |
| POST | `/api/auth/logout` | Logout user |
| POST | `/api/auth/refresh` | Refresh access token |
| GET | `/api/auth/me` | Get current user |

### Middleware
- `authMiddleware` - Validates JWT, attaches `req.user`
- `optionalAuthMiddleware` - Attaches user if token present

### Zod Schemas
- `registerSchema` - email (email), password (min 8), name (optional)
- `loginSchema` - email (email), password (string)

## Implementation Steps
1. Install Better-Auth and Prisma adapter
2. Configure Better-Auth instance
3. Create Prisma schema models
4. Run migration
5. Create auth routes and controllers
6. Create validation schemas
7. Create auth middleware
8. Write tests
9. Document in docs/001-user-authentication.md

## Security Considerations
- HttpOnly, Secure, SameSite=Strict cookies for refresh tokens
- Rate limiting on auth endpoints (5 req/min)
- Password strength enforced by Zod
- JWT secret rotation strategy
- CORS configured for frontend origin only