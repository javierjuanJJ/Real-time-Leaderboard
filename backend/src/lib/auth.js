// backend/src/lib/auth.js
// Better-Auth configuration

import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { prisma } from '../../server.js';

export const betterAuth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: 'postgresql'
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: process.env.NODE_ENV === 'production',
    minPasswordLength: 8,
    maxPasswordLength: 128
  },
  session: {
    expiresIn: 60 * 15, // 15 minutes for access token
    updateAge: 60 * 60 * 24 * 7, // 7 days for refresh
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5 // 5 minutes
    }
  },
  cookies: {
    session_token: {
      name: 'session_token',
      options: {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 7 // 7 days
      }
    }
  },
  advanced: {
    ipAddress: {
      ipAddressHeaders: ['x-forwarded-for', 'x-real-ip'],
      disableIpTracking: false
    },
    crossSubDomainCookies: {
      enabled: false
    }
  },
  trustedOrigins: process.env.FRONTEND_URL ? [process.env.FRONTEND_URL] : ['http://localhost:3000'],
  logger: {
    level: process.env.NODE_ENV === 'production' ? 'error' : 'debug'
  }
});

export default betterAuth;