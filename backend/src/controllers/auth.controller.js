// backend/src/controllers/auth.controller.js
// Authentication controllers

import { betterAuth } from '../lib/auth.js';
import { asyncHandler } from '../middleware/error.middleware.js';

export const register = asyncHandler(async (req, res) => {
  const { email, password, name } = req.body;
  
  const result = await betterAuth.api.signUpEmail({
    body: { email, password, name }
  });
  
  // Set session cookie
  if (result.session) {
    res.cookie('session_token', result.session.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: '/'
    });
  }
  
  res.status(201).json({
    user: {
      id: result.user.id,
      email: result.user.email,
      name: result.user.name
    }
  });
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  
  const result = await betterAuth.api.signInEmail({
    body: { email, password }
  });
  
  // Set session cookie
  if (result.session) {
    res.cookie('session_token', result.session.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/'
    });
  }
  
  res.json({
    user: {
      id: result.user.id,
      email: result.user.email,
      name: result.user.name
    },
    accessToken: result.session?.token
  });
});

export const logout = asyncHandler(async (req, res) => {
  // Get session from cookie
  const sessionToken = req.cookies.session_token;
  
  if (sessionToken) {
    await betterAuth.api.signOut({
      headers: { cookie: `session_token=${sessionToken}` }
    });
  }
  
  // Clear cookie
  res.clearCookie('session_token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/'
  });
  
  res.json({ message: 'Logged out successfully' });
});

export const refresh = asyncHandler(async (req, res) => {
  const sessionToken = req.cookies.session_token;
  
  if (!sessionToken) {
    return res.status(401).json({ error: 'No session token', code: 'UNAUTHORIZED' });
  }
  
  const result = await betterAuth.api.refreshToken({
    headers: { cookie: `session_token=${sessionToken}` }
  });
  
  if (result.session) {
    res.cookie('session_token', result.session.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/'
    });
  }
  
  res.json({
    accessToken: result.session?.token
  });
});

export const me = asyncHandler(async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Not authenticated', code: 'UNAUTHORIZED' });
  }
  
  res.json({
    user: {
      id: req.user.id,
      email: req.user.email,
      name: req.user.name,
      image: req.user.image,
      emailVerified: req.user.emailVerified
    }
  });
});