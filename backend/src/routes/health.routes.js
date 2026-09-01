// backend/src/routes/health.routes.js
// Health check routes

import { Router } from 'express';
import { healthCheck } from '../services/redis.service.js';
import { prisma } from '../../server.js';

export const healthRoutes = Router();

// GET /api/health/redis
healthRoutes.get('/redis', async (req, res) => {
  const result = await healthCheck();
  const statusCode = result.healthy ? 200 : 503;
  res.status(statusCode).json(result);
});

// GET /api/health/db
healthRoutes.get('/db', async (req, res) => {
  const start = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ healthy: true, latencyMs: Date.now() - start });
  } catch (error) {
    res.status(503).json({ healthy: false, latencyMs: Date.now() - start, error: error.message });
  }
});

// GET /api/health (overall)
healthRoutes.get('/', async (req, res) => {
  const [redisHealth, dbHealth] = await Promise.all([
    healthCheck(),
    (async () => {
      const start = Date.now();
      try {
        await prisma.$queryRaw`SELECT 1`;
        return { healthy: true, latencyMs: Date.now() - start };
      } catch (error) {
        return { healthy: false, latencyMs: Date.now() - start, error: error.message };
      }
    })()
  ]);
  
  const allHealthy = redisHealth.healthy && dbHealth.healthy;
  res.status(allHealthy ? 200 : 503).json({
    status: allHealthy ? 'healthy' : 'degraded',
    timestamp: new Date().toISOString(),
    services: {
      redis: redisHealth,
      database: dbHealth
    }
  });
});

export default healthRoutes;