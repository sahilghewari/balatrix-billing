/**
 * Redis Configuration
 * Redis connection for caching and session management
 */

const Redis = require('ioredis');
const logger = require('../utils/logger');

// Check if Redis should be enabled
const REDIS_ENABLED = process.env.ENABLE_REDIS !== 'false';

// Redis client configuration
const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT, 10) || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
  db: parseInt(process.env.REDIS_DB, 10) || 0,
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000);
    logger.warn(`Redis connection retry attempt ${times}, delay: ${delay}ms`);
    return delay;
  },
  maxRetriesPerRequest: 3,
  enableOfflineQueue: true,
  lazyConnect: false,
};

// Create Redis client conditionally
let redisClient = null;

if (REDIS_ENABLED) {
  try {
    redisClient = new Redis(redisConfig);

    // Redis event handlers
    redisClient.on('connect', () => {
      logger.info('Redis client connected');
    });

    redisClient.on('ready', () => {
      logger.info('Redis client ready');
    });

    redisClient.on('error', (error) => {
      logger.error('Redis client error:', error);
    });

    redisClient.on('close', () => {
      logger.warn('Redis connection closed');
    });

    redisClient.on('reconnecting', () => {
      logger.info('Redis client reconnecting');
    });

    logger.info('Redis client initialized successfully');
  } catch (error) {
    logger.warn('Failed to initialize Redis client - caching will be disabled:', error.message);
  }
} else {
  logger.info('Redis disabled via ENABLE_REDIS=false - caching features will be unavailable');
}

// Helper functions for common Redis operations

/**
 * Set key with expiration
 * @param {string} key - Redis key
 * @param {any} value - Value to store
 * @param {number} expirySeconds - Expiration time in seconds
 */
const setCache = async (key, value, expirySeconds = 3600) => {
  if (!redisClient) return false;
  try {
    const serialized = JSON.stringify(value);
    await redisClient.setex(key, expirySeconds, serialized);
    return true;
  } catch (error) {
    logger.error('Redis setCache error:', error);
    return false;
  }
};

/**
 * Get cached value
 * @param {string} key - Redis key
 * @returns {any} Cached value or null
 */
const getCache = async (key) => {
  if (!redisClient) return null;
  try {
    const value = await redisClient.get(key);
    return value ? JSON.parse(value) : null;
  } catch (error) {
    logger.error('Redis getCache error:', error);
    return null;
  }
};

/**
 * Delete cache key
 * @param {string} key - Redis key
 */
const deleteCache = async (key) => {
  if (!redisClient) return false;
  try {
    await redisClient.del(key);
    return true;
  } catch (error) {
    logger.error('Redis deleteCache error:', error);
    return false;
  }
};

/**
 * Delete multiple cache keys by pattern
 * @param {string} pattern - Redis key pattern (e.g., 'user:*')
 */
const deleteCachePattern = async (pattern) => {
  if (!redisClient) return false;
  try {
    const keys = await redisClient.keys(pattern);
    if (keys.length > 0) {
      await redisClient.del(...keys);
    }
    return true;
  } catch (error) {
    logger.error('Redis deleteCachePattern error:', error);
    return false;
  }
};

/**
 * Check if key exists
 * @param {string} key - Redis key
 * @returns {boolean} True if exists
 */
const existsCache = async (key) => {
  if (!redisClient) return false;
  try {
    const exists = await redisClient.exists(key);
    return exists === 1;
  } catch (error) {
    logger.error('Redis existsCache error:', error);
    return false;
  }
};

/**
 * Increment counter
 * @param {string} key - Redis key
 * @param {number} amount - Amount to increment
 * @returns {number} New value
 */
const incrementCounter = async (key, amount = 1) => {
  if (!redisClient) return 0;
  try {
    return await redisClient.incrby(key, amount);
  } catch (error) {
    logger.error('Redis incrementCounter error:', error);
    return 0;
  }
};

/**
 * Set with expiry using SET EX NX (atomic set if not exists)
 * @param {string} key - Redis key
 * @param {any} value - Value to store
 * @param {number} expirySeconds - Expiration time
 * @returns {boolean} True if set, false if already exists
 */
const setIfNotExists = async (key, value, expirySeconds = 3600) => {
  if (!redisClient) return false;
  try {
    const serialized = JSON.stringify(value);
    const result = await redisClient.set(key, serialized, 'EX', expirySeconds, 'NX');
    return result === 'OK';
  } catch (error) {
    logger.error('Redis setIfNotExists error:', error);
    return false;
  }
};

/**
 * Add item to set
 * @param {string} key - Redis set key
 * @param {string} member - Member to add
 */
const addToSet = async (key, member) => {
  if (!redisClient) return false;
  try {
    await redisClient.sadd(key, member);
    return true;
  } catch (error) {
    logger.error('Redis addToSet error:', error);
    return false;
  }
};

/**
 * Check if member exists in set
 * @param {string} key - Redis set key
 * @param {string} member - Member to check
 * @returns {boolean} True if exists
 */
const isInSet = async (key, member) => {
  if (!redisClient) return false;
  try {
    const exists = await redisClient.sismember(key, member);
    return exists === 1;
  } catch (error) {
    logger.error('Redis isInSet error:', error);
    return false;
  }
};

/**
 * Remove item from set
 * @param {string} key - Redis set key
 * @param {string} member - Member to remove
 */
const removeFromSet = async (key, member) => {
  if (!redisClient) return false;
  try {
    await redisClient.srem(key, member);
    return true;
  } catch (error) {
    logger.error('Redis removeFromSet error:', error);
    return false;
  }
};

/**
 * Get all set members
 * @param {string} key - Redis set key
 * @returns {Array} Set members
 */
const getSetMembers = async (key) => {
  if (!redisClient) return [];
  try {
    return await redisClient.smembers(key);
  } catch (error) {
    logger.error('Redis getSetMembers error:', error);
    return [];
  }
};

/**
 * Push to list
 * @param {string} key - Redis list key
 * @param {any} value - Value to push
 */
const pushToList = async (key, value) => {
  if (!redisClient) return false;
  try {
    const serialized = JSON.stringify(value);
    await redisClient.rpush(key, serialized);
    return true;
  } catch (error) {
    logger.error('Redis pushToList error:', error);
    return false;
  }
};

/**
 * Get list range
 * @param {string} key - Redis list key
 * @param {number} start - Start index
 * @param {number} end - End index
 * @returns {Array} List items
 */
const getListRange = async (key, start = 0, end = -1) => {
  if (!redisClient) return [];
  try {
    const values = await redisClient.lrange(key, start, end);
    return values.map((v) => JSON.parse(v));
  } catch (error) {
    logger.error('Redis getListRange error:', error);
    return [];
  }
};

/**
 * Flush all Redis data (use with caution)
 */
const flushAll = async () => {
  if (!redisClient) return false;
  try {
    await redisClient.flushall();
    logger.warn('Redis FLUSHALL executed - all data cleared');
    return true;
  } catch (error) {
    logger.error('Redis flushAll error:', error);
    return false;
  }
};

/**
 * Close Redis connection
 */
const closeConnection = async () => {
  if (!redisClient) return;
  try {
    await redisClient.quit();
    logger.info('Redis connection closed gracefully');
  } catch (error) {
    logger.error('Error closing Redis connection:', error);
  }
};

module.exports = {
  redisClient,
  setCache,
  getCache,
  deleteCache,
  deleteCachePattern,
  existsCache,
  incrementCounter,
  setIfNotExists,
  addToSet,
  isInSet,
  removeFromSet,
  getSetMembers,
  pushToList,
  getListRange,
  flushAll,
  closeConnection,
};
