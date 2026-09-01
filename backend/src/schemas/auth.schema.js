// backend/src/schemas/auth.schema.js
// Zod validation schemas for authentication

import { z } from 'zod';

export const registerSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email format'),
    password: z.string().min(8, 'Password must be at least 8 characters').max(128),
    name: z.string().min(1).max(100).optional()
  })
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email format'),
    password: z.string().min(1, 'Password is required')
  })
});

export const refreshSchema = z.object({
  cookies: z.object({
    session_token: z.string().optional()
  }).optional()
});

export const logoutSchema = z.object({});

export const meSchema = z.object({});