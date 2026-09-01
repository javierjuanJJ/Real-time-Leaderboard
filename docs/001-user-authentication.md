# 001-user-authentication - Implementation Documentation

## Implementation Summary

Implemented user authentication using Better-Auth with Prisma adapter. Features include registration, login, logout, token refresh, and protected route middleware.

## Key Decisions

1. **Better-Auth over custom auth**: Better-Auth handles password hashing, JWT management, session storage, and security best practices out of the box.

2. **JWT Access Tokens (15min) + Refresh Tokens (7 days)**: Short-lived access tokens reduce risk of token theft. Refresh tokens stored in HttpOnly cookies prevent XSS.

3. **Prisma Adapter**: Uses Better-Auth's official Prisma adapter for User, Account, Session, VerificationToken models.

4. **bcrypt via Better-Auth**: Password hashing handled internally by Better-Auth using bcrypt with cost factor 12.

5. **Cookie Configuration**:
   - HttpOnly: true (prevents XSS)
   - Secure: true (HTTPS only in production)
   - SameSite: 'lax' (CSRF protection)
   - Path: '/'

## File Structure

```
backend/
├── src/
│   ├── lib/
│   │   └── auth.ts              # Better-Auth configuration
│   ├── schemas/
│   │   └── auth.schema.ts       # Zod validation schemas
│   ├── middleware/
│   │   └── auth.middleware.ts   # JWT validation middleware
│   ├── controllers/
│   │   └── auth.controller.ts   # Auth business logic
│   ├── routes/
│   │   └── auth.routes.ts       # Auth endpoints
│   └── routes/
│       └── index.ts             # Route registration
├── prisma/
│   └── schema.prisma            # User, Account, Session models
└── tests/
    └── auth.test.js             # Unit tests
```

## API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/auth/register` | No | Register new user |
| POST | `/api/auth/login` | No | Login user |
| POST | `/api/auth/logout` | Yes | Logout user |
| POST | `/api/auth/refresh` | Cookie | Refresh access token |
| GET | `/api/auth/me` | Yes | Get current user |

## Rollback Instructions

```bash
# 1. Revert Prisma migration
npx prisma migrate resolve --rolled-back "add-auth-models"

# 2. Remove auth models from schema.prisma
# Edit prisma/schema.prisma and remove User, Account, Session, VerificationToken models

# 3. Generate Prisma client
npx prisma generate

# 4. Remove auth-related files
rm backend/src/lib/auth.ts
rm backend/src/schemas/auth.schema.ts
rm backend/src/middleware/auth.middleware.ts
rm backend/src/controllers/auth.controller.ts
rm backend/src/routes/auth.routes.ts
rm backend/tests/auth.test.js

# 5. Remove auth routes from backend/src/routes/index.ts

# 6. Remove dependencies
npm uninstall better-auth @better-auth/prisma

# 7. Commit rollback
git commit -m "revert: remove user authentication feature"
```

## Opencode Usage Notes

- Run tests: `npm test -- backend/tests/auth.test.js`
- Check types: `npx tsc --noEmit`
- View Prisma Studio: `npx prisma studio`
- Test auth flow manually: Use `curl` or Postman with the endpoints above