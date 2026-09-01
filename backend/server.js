// backend/server.js
// Entry point - starts server based on NODE_ENV
// Imports app from app.js (which has NO async functions, NO run() method)

import { app } from './app.js';
import { PrismaClient } from '@prisma/client';
import { connectRedis, shutdownRedis } from './src/services/redis.service.js';

const prisma = new PrismaClient();
const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    // Connect to PostgreSQL
    await prisma.$connect();
    console.log('✓ PostgreSQL connected');

    // Connect to Redis
    await connectRedis();
    console.log('✓ Redis connected');

    // Start HTTP server
    const server = app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`   Health: http://localhost:${PORT}/api/health`);
    });

    // Graceful shutdown
    const shutdown = async (signal) => {
      console.log(`\n${signal} received. Shutting down gracefully...`);
      
      server.close(async () => {
        console.log('✓ HTTP server closed');
        
        try {
          await shutdownRedis();
          console.log('✓ Redis disconnected');
        } catch (err) {
          console.error('Error closing Redis:', err);
        }
        
        try {
          await prisma.$disconnect();
          console.log('✓ PostgreSQL disconnected');
        } catch (err) {
          console.error('Error closing Prisma:', err);
        }
        
        process.exit(0);
      });

      // Force close after 10s
      setTimeout(() => {
        console.error('Forced shutdown after timeout');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Only start server if not in test environment
if (process.env.NODE_ENV !== 'test') {
  startServer();
}

export { prisma };