// backend/src/services/websocket.service.js
// WebSocket server for real-time leaderboard updates (Feature 007)

import { WebSocketServer, WebSocket } from 'ws';
import { pubsub } from './redis.service.js';
import { betterAuth } from '../lib/auth.js';

const clients = new Map(); // gameId -> Set of { ws, userId, authenticated }

export function createWebSocketServer(server) {
  const wss = new WebSocketServer({ 
    server,
    path: '/ws',
    verifyClient: async (info, done) => {
      // Allow connection, auth happens per-game subscription
      done(true);
    }
  });

  wss.on('connection', async (ws, req) => {
    console.log('WebSocket: New connection');
    
    let currentGameId = null;
    let currentUserId = null;
    let authenticated = false;

    ws.on('message', async (data) => {
      try {
        const message = JSON.parse(data.toString());
        
        switch (message.type) {
          case 'auth':
            await handleAuth(ws, message);
            break;
          case 'subscribe':
            await handleSubscribe(ws, message);
            break;
          case 'unsubscribe':
            handleUnsubscribe();
            break;
          case 'ping':
            ws.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
            break;
          default:
            ws.send(JSON.stringify({ 
              type: 'error', 
              code: 'UNKNOWN_MESSAGE_TYPE', 
              message: `Unknown message type: ${message.type}` 
            }));
        }
      } catch (err) {
        console.error('WebSocket message error:', err);
        ws.send(JSON.stringify({ 
          type: 'error', 
          code: 'INVALID_MESSAGE', 
          message: 'Invalid JSON message' 
        }));
      }
    });

    ws.on('close', () => {
      if (currentGameId && currentUserId) {
        removeClient(currentGameId, ws);
        console.log(`WebSocket: User ${currentUserId} unsubscribed from ${currentGameId}`);
      }
    });

    ws.on('error', (err) => {
      console.error('WebSocket error:', err);
    });

    // Send welcome message
    ws.send(JSON.stringify({ 
      type: 'connected', 
      message: 'Connected to leaderboard realtime updates',
      timestamp: Date.now()
    }));

    async function handleAuth(ws, message) {
      const { token } = message;
      if (!token) {
        ws.send(JSON.stringify({ type: 'auth_result', success: false, error: 'Token required' }));
        return;
      }

      try {
        const session = await betterAuth.api.getSession({
          headers: { authorization: `Bearer ${token}` }
        });
        
        if (session?.user) {
          currentUserId = session.user.id;
          authenticated = true;
          ws.send(JSON.stringify({ 
            type: 'auth_result', 
            success: true, 
            user: { id: session.user.id, name: session.user.name } 
          }));
        } else {
          ws.send(JSON.stringify({ type: 'auth_result', success: false, error: 'Invalid token' }));
        }
      } catch (err) {
        ws.send(JSON.stringify({ type: 'auth_result', success: false, error: 'Auth failed' }));
      }
    }

    async function handleSubscribe(ws, message) {
      const { gameId } = message;
      if (!gameId) {
        ws.send(JSON.stringify({ type: 'subscribe_result', success: false, error: 'gameId required' }));
        return;
      }

      // Unsubscribe from previous game if any
      if (currentGameId) {
        removeClient(currentGameId, ws);
      }

      currentGameId = gameId;
      addClient(gameId, ws, currentUserId, authenticated);

      // Subscribe to Redis pub/sub for this game
      const subscriber = pubsub.subscribeToGame(gameId, (data) => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({
            type: 'score_update',
            gameId,
            ...data,
            timestamp: Date.now()
          }));
        }
      });

      // Store subscriber for cleanup
      ws._redisSubscriber = subscriber;

      ws.send(JSON.stringify({ 
        type: 'subscribe_result', 
        success: true, 
        gameId,
        message: `Subscribed to ${gameId} updates`
      }));

      console.log(`WebSocket: User ${currentUserId || 'anonymous'} subscribed to ${gameId}`);
    }

    function handleUnsubscribe() {
      if (currentGameId) {
        removeClient(currentGameId, ws);
        if (ws._redisSubscriber) {
          pubsub.unsubscribe(ws._redisSubscriber);
          ws._redisSubscriber = null;
        }
        currentGameId = null;
        ws.send(JSON.stringify({ type: 'unsubscribed', message: 'Unsubscribed from updates' }));
      }
    }
  });

  // Broadcast to all clients subscribed to a game
  wss.broadcastToGame = (gameId, data) => {
    const gameClients = clients.get(gameId);
    if (!gameClients) return;
    
    const message = JSON.stringify({ type: 'broadcast', gameId, ...data, timestamp: Date.now() });
    for (const client of gameClients) {
      if (client.ws.readyState === WebSocket.OPEN) {
        client.ws.send(message);
      }
    }
  };

  return wss;
}

function addClient(gameId, ws, userId, authenticated) {
  if (!clients.has(gameId)) {
    clients.set(gameId, new Set());
  }
  clients.get(gameId).add({ ws, userId, authenticated });
}

function removeClient(gameId, ws) {
  const gameClients = clients.get(gameId);
  if (gameClients) {
    for (const client of gameClients) {
      if (client.ws === ws) {
        gameClients.delete(client);
        break;
      }
    }
    if (gameClients.size === 0) {
      clients.delete(gameId);
    }
  }
}

export function getConnectedClients(gameId) {
  const gameClients = clients.get(gameId);
  return gameClients ? gameClients.size : 0;
}

export function getAllGames() {
  return Array.from(clients.keys());
}

export default { createWebSocketServer, getConnectedClients, getAllGames };