// backend/src/services/redis.service.js
// Redis client and Sorted Set utilities for leaderboard

import Redis from 'ioredis';

const REDIS_PREFIX = 'leaderboard:';

function keyLeaderboard(gameId) {
  return `${REDIS_PREFIX}${gameId}`;
}

function keyUserScore(userId, gameId) {
  return `${REDIS_PREFIX}user:score:${userId}:${gameId}`;
}

function keyUserProfile(userId) {
  return `${REDIS_PREFIX}user:profile:${userId}`;
}

function keyRateLimit(endpoint, userId) {
  return `${REDIS_PREFIX}ratelimit:${endpoint}:${userId}`;
}

// Create Redis client with connection pool
const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379', 10),
  password: process.env.REDIS_PASSWORD || undefined,
  db: parseInt(process.env.REDIS_DB || '0', 10),
  maxRetriesPerRequest: 3,
  retryStrategy: (times) => Math.min(times * 50, 2000),
  enableReadyCheck: true,
  lazyConnect: true,
  connectionName: 'leaderboard-api',
  family: 4,
  // Connection pool settings
  maxConnections: 10,
  connectTimeout: 10000,
});

// Connection event handlers
redis.on('connect', () => console.log('Redis: Connecting...'));
redis.on('ready', () => console.log('Redis: Ready'));
redis.on('error', (err) => console.error('Redis: Error', err.message));
redis.on('close', () => console.log('Redis: Connection closed'));
redis.on('reconnecting', () => console.log('Redis: Reconnecting...'));

// ============================================
// SORTED SET OPERATIONS (Leaderboard)
// ============================================

export const leaderboard = {
  // Add/update score (only if higher)
  async addScore(gameId, userId, score) {
    return redis.zadd(keyLeaderboard(gameId), score, userId);
  },

  // Conditional update: only if member exists AND new score is higher
  async updateScoreIfHigher(gameId, userId, newScore) {
    const result = await redis.zadd(
      keyLeaderboard(gameId),
      'XX', 'CH',
      newScore,
      userId
    );
    if (result === 1) {
      const score = await redis.zscore(keyLeaderboard(gameId), userId);
      return { updated: true, newScore: parseFloat(score) };
    }
    const currentScore = await redis.zscore(keyLeaderboard(gameId), userId);
    return { updated: false, newScore: currentScore ? parseFloat(currentScore) : null };
  },

  // Atomic increment
  async incrementScore(gameId, userId, increment) {
    const newScore = await redis.zincrby(keyLeaderboard(gameId), increment, userId);
    return parseFloat(newScore);
  },

  // Get user rank (1-indexed, highest score = rank 1)
  async getRank(gameId, userId) {
    const rank = await redis.zrevrank(keyLeaderboard(gameId), userId);
    return rank !== null ? rank + 1 : null;
  },

  // Get user rank ascending (lowest score = rank 1)
  async getRankAsc(gameId, userId) {
    const rank = await redis.zrank(keyLeaderboard(gameId), userId);
    return rank !== null ? rank + 1 : null;
  },

  // Get user score
  async getScore(gameId, userId) {
    const score = await redis.zscore(keyLeaderboard(gameId), userId);
    return score !== null ? parseFloat(score) : null;
  },

  // Get top N players with scores
  async getTopPlayers(gameId, limit, offset = 0) {
    const results = await redis.zrevrange(
      keyLeaderboard(gameId),
      offset,
      offset + limit - 1,
      'WITHSCORES'
    );
    return parseZRangeResults(results, offset);
  },

  // Get bottom N players with scores (ascending)
  async getBottomPlayers(gameId, limit, offset = 0) {
    const results = await redis.zrange(
      keyLeaderboard(gameId),
      offset,
      offset + limit - 1,
      'WITHSCORES'
    );
    return parseZRangeResults(results, offset, true);
  },

  // Get players around a specific rank
  async getPlayersAroundRank(gameId, rank, range = 5) {
    const start = Math.max(0, rank - 1 - range);
    const stop = rank - 1 + range;
    const results = await redis.zrevrange(
      keyLeaderboard(gameId),
      start,
      stop,
      'WITHSCORES'
    );
    return parseZRangeResults(results, start);
  },

  // Get players by score range (descending)
  async getPlayersByScoreRange(gameId, min, max, limit = 50, offset = 0) {
    const results = await redis.zrevrangebyscore(
      keyLeaderboard(gameId),
      max,
      min,
      'LIMIT', offset, limit,
      'WITHSCORES'
    );
    return parseZRangeResults(results, offset);
  },

  // Get players by score range (ascending)
  async getPlayersByScoreRangeAsc(gameId, min, max, limit = 50, offset = 0) {
    const results = await redis.zrangebyscore(
      keyLeaderboard(gameId),
      min,
      max,
      'LIMIT', offset, limit,
      'WITHSCORES'
    );
    return parseZRangeResults(results, offset, true);
  },

  // Get total player count
  async getTotalPlayers(gameId) {
    return redis.zcard(keyLeaderboard(gameId));
  },

  // Remove player from leaderboard
  async removePlayer(gameId, userId) {
    return redis.zrem(keyLeaderboard(gameId), userId);
  },

  // Count players in score range
  async countInRange(gameId, min, max) {
    return redis.zcount(keyLeaderboard(gameId), min, max);
  },

  // Get user percentile (0-100, 100 = top 1%)
  async getPercentile(gameId, userId) {
    const rank = await redis.zrevrank(keyLeaderboard(gameId), userId);
    if (rank === null) return 0;
    const total = await redis.zcard(keyLeaderboard(gameId));
    if (total === 0) return 0;
    return Math.round((1 - (rank + 1) / total) * 100);
  },

  // Get full rank context in single pipeline
  async getRankContext(gameId, userId) {
    const pipeline = redis.pipeline();
    pipeline.zrevrank(keyLeaderboard(gameId), userId);
    pipeline.zscore(keyLeaderboard(gameId), userId);
    pipeline.zcard(keyLeaderboard(gameId));
    
    const [[, rank], [, score], [, total]] = await pipeline.exec();
    
    if (rank === null) {
      return { rank: null, score: 0, percentile: 0, totalPlayers: total || 0, nearbyPlayers: [] };
    }
    
    const rank1Indexed = rank + 1;
    const scoreVal = score ? parseFloat(score) : 0;
    const totalPlayers = total || 0;
    const percentile = totalPlayers > 0 ? Math.round((1 - rank1Indexed / totalPlayers) * 100) : 0;
    
    // Get nearby players (3 above, 3 below) in same pipeline
    const nearbyPipeline = redis.pipeline();
    const start = Math.max(0, rank - 3);
    const stop = rank + 3;
    nearbyPipeline.zrevrange(keyLeaderboard(gameId), start, stop, 'WITHSCORES');
    
    const [[, nearbyResults]] = await nearbyPipeline.exec();
    const nearbyPlayers = parseZRangeResults(nearbyResults || [], start);
    
    return {
      rank: rank1Indexed,
      score: scoreVal,
      percentile,
      totalPlayers,
      nearbyPlayers
    };
  },

  // Batch update multiple scores
  async batchUpdateScores(updates) {
    const pipeline = redis.pipeline();
    for (const { gameId, userId, score } of updates) {
      pipeline.zadd(keyLeaderboard(gameId), 'XX', 'CH', score, userId);
    }
    return pipeline.exec();
  },

  // Update score and get rank in single pipeline
  async updateScoreAndGetRank(gameId, userId, score) {
    const pipeline = redis.pipeline();
    pipeline.zadd(keyLeaderboard(gameId), 'XX', 'CH', score, userId);
    pipeline.zrevrank(keyLeaderboard(gameId), userId);
    const [[, updated], [, rank]] = await pipeline.exec();
    return { updated: updated === 1, rank: rank !== null ? rank + 1 : null };
  },

  // Check if leaderboard exists
  async exists(gameId) {
    return redis.exists(keyLeaderboard(gameId));
  },

  // Raw Sorted Set operations
  async zadd(key, score, member, options) {
    const args = [key];
    if (options) args.push(...options);
    args.push(score, member);
    return redis.zadd(...args);
  },

  async zrem(key, member) {
    return redis.zrem(key, member);
  },

  async zcard(key) {
    return redis.zcard(key);
  },

  async zcount(key, min, max) {
    return redis.zcount(key, min, max);
  },

  async zrange(key, start, stop, withScores = false) {
    const args = [key, start, stop];
    if (withScores) args.push('WITHSCORES');
    return redis.zrange(...args);
  },

  async zrevrange(key, start, stop, withScores = false) {
    const args = [key, start, stop];
    if (withScores) args.push('WITHSCORES');
    return redis.zrevrange(...args);
  },

  async zrangebyscore(key, min, max, options = {}) {
    const args = [key, min, max];
    if (options.limit) args.push('LIMIT', options.limit.offset, options.limit.count);
    if (options.withScores) args.push('WITHSCORES');
    return redis.zrangebyscore(...args);
  },

  async zrevrangebyscore(key, max, min, options = {}) {
    const args = [key, max, min];
    if (options.limit) args.push('LIMIT', options.limit.offset, options.limit.count);
    if (options.withScores) args.push('WITHSCORES');
    return redis.zrevrangebyscore(...args);
  },

  async zincrby(key, increment, member) {
    return redis.zincrby(key, increment, member);
  },

  async zrank(key, member) {
    return redis.zrank(key, member);
  },

  async zrevrank(key, member) {
    return redis.zrevrank(key, member);
  },

  async zscore(key, member) {
    return redis.zscore(key, member);
  },
};

// ============================================
// CACHE OPERATIONS
// ============================================

export const cache = {
  // User score cache (TTL 24h)
  async getUserScore(userId, gameId) {
    const score = await redis.get(keyUserScore(userId, gameId));
    return score !== null ? parseInt(score, 10) : null;
  },

  async setUserScore(userId, gameId, score, ttl = 86400) {
    return redis.setex(keyUserScore(userId, gameId), ttl, score.toString());
  },

  // User profile cache (TTL 1h)
  async getUserProfile(userId) {
    const profile = await redis.hgetall(keyUserProfile(userId));
    return Object.keys(profile).length > 0 ? profile : null;
  },

  async setUserProfile(userId, profile, ttl = 3600) {
    if (Object.keys(profile).length === 0) return 'OK';
    const pipeline = redis.pipeline();
    pipeline.hmset(keyUserProfile(userId), profile);
    pipeline.expire(keyUserProfile(userId), ttl);
    return pipeline.exec();
  },

  // Batch get user profiles
  async getUserProfiles(userIds) {
    if (!userIds.length) return {};
    const pipeline = redis.pipeline();
    for (const userId of userIds) {
      pipeline.hgetall(keyUserProfile(userId));
    }
    const results = await pipeline.exec();
    const profiles = {};
    for (let i = 0; i < userIds.length; i++) {
      const [, profile] = results[i];
      if (profile && Object.keys(profile).length > 0) {
        profiles[userIds[i]] = profile;
      }
    }
    return profiles;
  },

  // Rate limit counter
  async incrementRateLimit(endpoint, userId, windowMs) {
    const key = keyRateLimit(endpoint, userId);
    const count = await redis.incr(key);
    if (count === 1) {
      await redis.pexpire(key, windowMs);
    }
    return count;
  }
};

// ============================================
// PUB/SUB FOR REALTIME UPDATES (Feature 007)
// ============================================

export const pubsub = {
  // Publish score update to game channel
  async publishScoreUpdate(gameId, data) {
    const channel = `${REDIS_PREFIX}updates:${gameId}`;
    return redis.publish(channel, JSON.stringify(data));
  },

  // Subscribe to game updates
  subscribeToGame(gameId, callback) {
    const channel = `${REDIS_PREFIX}updates:${gameId}`;
    const subscriber = redis.duplicate();
    subscriber.subscribe(channel);
    subscriber.on('message', (ch, message) => {
      if (ch === channel) {
        try {
          callback(JSON.parse(message));
        } catch (e) {
          console.error('Invalid pub/sub message:', e);
        }
      }
    });
    return subscriber;
  },

  // Unsubscribe
  unsubscribe(subscriber) {
    return subscriber.unsubscribe();
  }
};

// ============================================
// HEALTH & LIFECYCLE
// ============================================

export async function connectRedis() {
  if (redis.status === 'wait') {
    await redis.connect();
  }
  return redis;
}

export async function healthCheck() {
  const start = Date.now();
  try {
    await redis.ping();
    return { healthy: true, latencyMs: Date.now() - start };
  } catch (error) {
    return { healthy: false, latencyMs: Date.now() - start, error: error.message };
  }
}

export async function shutdownRedis() {
  await redis.quit();
}

// ============================================
// HELPERS
// ============================================

function parseZRangeResults(results, startRank, ascending = false) {
  const players = [];
  for (let i = 0; i < results.length; i += 2) {
    players.push({
      rank: ascending ? startRank + (i / 2) + 1 : startRank + (i / 2) + 1,
      userId: results[i],
      score: parseFloat(results[i + 1])
    });
  }
  return players;
}

export { redis, keyLeaderboard, keyUserScore, keyUserProfile, keyRateLimit };