# 001-user-authentication Tasks

## 1. Setup & Configuration
- [ ] 1.1 Install dependencies: `better-auth`, `@better-auth/prisma`, `zod`
- [ ] 1.2 Configure Better-Auth in `backend/src/lib/auth.ts`
- [ ] 1.3 Update Prisma schema with User, Account, Session, VerificationToken models
- [ ] 1.4 Run `npx prisma migrate dev --name add-auth-models`
- [ ] 1.5 Generate Prisma client: `npx prisma generate`

## 2. Validation Schemas
- [ ] 2.1 Create `backend/src/schemas/auth.schema.ts` with registerSchema, loginSchema
- [ ] 2.2 Export validation middleware using Zod

## 3. Auth Routes & Controllers
- [ ] 3.1 Create `backend/src/routes/auth.routes.ts`
- [ ] 3.2 Create `backend/src/controllers/auth.controller.ts`
- [ ] 3.3 Implement register endpoint (POST /api/auth/register)
- [ ] 3.4 Implement login endpoint (POST /api/auth/login)
- [ ] 3.5 Implement logout endpoint (POST /api/auth/logout)
- [ ] 3.6 Implement refresh endpoint (POST /api/auth/refresh)
- [ ] 3.7 Implement me endpoint (GET /api/auth/me)

## 4. Middleware
- [ ] 4.1 Create `backend/src/middleware/auth.middleware.ts`
- [ ] 4.2 Implement JWT validation middleware
- [ ] 4.3 Export `requireAuth` and `optionalAuth` functions

## 5. Integration
- [ ] 5.1 Register auth routes in `backend/src/routes/index.ts`
- [ ] 5.2 Apply auth middleware to protected routes

## 6. Tests
- [ ] 6.1 Create `backend/tests/auth.test.js`
- [ ] 6.2 Test registration (success, duplicate email, invalid input)
- [ ] 6.3 Test login (success, invalid credentials, rate limit)
- [ ] 6.4 Test logout (success)
- [ ] 6.5 Test token refresh (valid, expired, missing)
- [ ] 6.6 Test protected route access (valid token, invalid token, no token)
- [ ] 6.7 Mock Prisma and Better-Auth in unit tests

## 7. Documentation
- [ ] 7.1 Create `docs/001-user-authentication.md` with:
  - Implementation summary
  - Key decisions (Better-Auth config, token strategy)
  - Rollback instructions (drop tables, revert migration)
  - Opencode usage notes

## 8. Git Commit
- [ ] 8.1 `git add -A`
- [ ] 8.2 `git commit -m "feat(auth): implement user authentication with Better-Auth and Prisma"`