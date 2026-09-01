// backend/src/routes/ws.routes.js
// WebSocket routes for real-time updates - Feature 007

import { Router } from 'express';
import { optionalAuth } from '../middleware/auth.middleware.js';

export const wsRoutes = Router();

// WebSocket upgrade endpoint info
wsRoutes.get('/', optionalAuth, (req, res) => {
  res.json({
    service: 'websocket',
    endpoint: '/ws',
    protocol: 'ws',
    description: 'Real-time leaderboard updates via WebSocket',
    messages: {
      auth: { type: 'auth', token: '<jwt_token>' },
      subscribe: { type: 'subscribe', gameId: '<game_id>' },
      unsubscribe: { type: 'unsubscribe' },
      ping: { type: 'ping' }
    },
    events: {
      connected: { type: 'connected' },
      auth_result: { type: 'auth_result', success: true/false, user: {...} },
      subscribe_result: { type: 'subscribe_result', success: true/false, gameId: '...' },
      score_update: { type: 'score_update', gameId: '...', userId: '...', score: 1000, rank: 1 },
      broadcast: { type: 'broadcast', gameId: '...', ... },
      error: { type: 'error', code: '...', message: '...' },
      pong: { type: 'pong', timestamp: 1234567890 }
    },
    feature: '007-realtime-updates'
  });
});

// Health check for WebSocket server
wsRoutes.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    service: 'websocket', 
    feature: '007-realtime-updates',
    timestamp: new Date().toISOString()
  });
});

export default wsRoutes;