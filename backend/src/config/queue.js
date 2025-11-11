/**
 * Bull Queue Configuration
 * Background job processing with Redis
 */

// const Queue = require('bull');
// const logger = require('../utils/logger');
// const { QUEUE_NAMES } = require('../utils/constants');

// Check if queues should be enabled
// const QUEUES_ENABLED = process.env.ENABLE_QUEUES !== 'false';

// Queue configuration
/*
const queueConfig = {
  redis: {
    host: process.env.BULL_QUEUE_REDIS_HOST || process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.BULL_QUEUE_REDIS_PORT || process.env.REDIS_PORT, 10) || 6379,
    password: process.env.REDIS_PASSWORD || undefined,
  },
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
    removeOnComplete: 100, // Keep last 100 completed jobs
    removeOnFail: 200, // Keep last 200 failed jobs
  },
  limiter: {
    max: 100,
    duration: 1000,
  },
};
*/

// Create queues (only if enabled)
const queues = {};

/*
if (QUEUES_ENABLED) {
  try {
    queues.cdrProcessing = new Queue(QUEUE_NAMES.CDR_PROCESSING, queueConfig);
    queues.billing = new Queue(QUEUE_NAMES.BILLING, queueConfig);
    queues.invoiceGeneration = new Queue(QUEUE_NAMES.INVOICE_GENERATION, queueConfig);
    queues.paymentRetry = new Queue(QUEUE_NAMES.PAYMENT_RETRY, queueConfig);
    queues.notifications = new Queue(QUEUE_NAMES.NOTIFICATIONS, queueConfig);
    queues.reports = new Queue(QUEUE_NAMES.REPORTS, queueConfig);
    queues.cleanup = new Queue(QUEUE_NAMES.CLEANUP, queueConfig);
    queues.backup = new Queue(QUEUE_NAMES.BACKUP, queueConfig);
    logger.info('Bull queues initialized successfully');
  } catch (error) {
    logger.warn('Failed to initialize Bull queues - queues will be disabled:', error.message);
  }
} else {
  logger.info('Bull queues disabled via ENABLE_QUEUES=false');
}
*/

// Queue event handlers
/*
Object.entries(queues).forEach(([name, queue]) => {
  queue.on('error', (error) => {
    logger.error(`Queue ${name} error:`, error);
  });

  queue.on('waiting', (jobId) => {
    logger.debug(`Queue ${name}: Job ${jobId} is waiting`);
  });

  queue.on('active', (job) => {
    logger.debug(`Queue ${name}: Job ${job.id} started processing`);
  });

  queue.on('completed', (job, result) => {
    logger.info(`Queue ${name}: Job ${job.id} completed`, { result });
  });

  queue.on('failed', (job, err) => {
    logger.error(`Queue ${name}: Job ${job.id} failed`, { error: err.message });
  });

  queue.on('stalled', (job) => {
    logger.warn(`Queue ${name}: Job ${job.id} has stalled`);
  });
});
*/

/**
 * Add job to queue
 * @param {string} queueName - Queue name
 * @param {Object} data - Job data
 * @param {Object} options - Job options
 * @returns {Object} Job instance
 */
const addJob = async (queueName, data, options = {}) => {
  try {
    const queue = queues[queueName];
    if (!queue) {
      throw new Error(`Queue ${queueName} not found`);
    }

    const job = await queue.add(data, {
      ...queueConfig.defaultJobOptions,
      ...options,
    });

    logger.info(`Job added to queue ${queueName}`, {
      jobId: job.id,
      data,
    });

    return job;
  } catch (error) {
    logger.error(`Error adding job to queue ${queueName}:`, error);
    throw error;
  }
};

/**
 * Add bulk jobs to queue
 * @param {string} queueName - Queue name
 * @param {Array} jobs - Array of job objects { data, opts }
 * @returns {Array} Job instances
 */
const addBulkJobs = async (queueName, jobs) => {
  try {
    const queue = queues[queueName];
    if (!queue) {
      throw new Error(`Queue ${queueName} not found`);
    }

    const jobsWithDefaults = jobs.map((job) => ({
      data: job.data,
      opts: {
        ...queueConfig.defaultJobOptions,
        ...job.opts,
      },
    }));

    const createdJobs = await queue.addBulk(jobsWithDefaults);
    logger.info(`${createdJobs.length} jobs added to queue ${queueName}`);

    return createdJobs;
  } catch (error) {
    logger.error(`Error adding bulk jobs to queue ${queueName}:`, error);
    throw error;
  }
};

/**
 * Get queue statistics
 * @param {string} queueName - Queue name
 * @returns {Object} Queue stats
 */
const getQueueStats = async (queueName) => {
  try {
    const queue = queues[queueName];
    if (!queue) {
      throw new Error(`Queue ${queueName} not found`);
    }

    const [waiting, active, completed, failed, delayed] = await Promise.all([
      queue.getWaitingCount(),
      queue.getActiveCount(),
      queue.getCompletedCount(),
      queue.getFailedCount(),
      queue.getDelayedCount(),
    ]);

    return {
      queueName,
      waiting,
      active,
      completed,
      failed,
      delayed,
      total: waiting + active + completed + failed + delayed,
    };
  } catch (error) {
    logger.error(`Error getting queue stats for ${queueName}:`, error);
    throw error;
  }
};

/**
 * Get all queues statistics
 * @returns {Array} Array of queue stats
 */
const getAllQueuesStats = async () => {
  try {
    const stats = await Promise.all(
      Object.keys(queues).map((queueName) => getQueueStats(queueName))
    );
    return stats;
  } catch (error) {
    logger.error('Error getting all queues stats:', error);
    throw error;
  }
};

/**
 * Pause queue
 * @param {string} queueName - Queue name
 */
const pauseQueue = async (queueName) => {
  try {
    const queue = queues[queueName];
    if (!queue) {
      throw new Error(`Queue ${queueName} not found`);
    }

    await queue.pause();
    logger.info(`Queue ${queueName} paused`);
  } catch (error) {
    logger.error(`Error pausing queue ${queueName}:`, error);
    throw error;
  }
};

/**
 * Resume queue
 * @param {string} queueName - Queue name
 */
const resumeQueue = async (queueName) => {
  try {
    const queue = queues[queueName];
    if (!queue) {
      throw new Error(`Queue ${queueName} not found`);
    }

    await queue.resume();
    logger.info(`Queue ${queueName} resumed`);
  } catch (error) {
    logger.error(`Error resuming queue ${queueName}:`, error);
    throw error;
  }
};

/**
 * Clean queue jobs
 * @param {string} queueName - Queue name
 * @param {number} grace - Grace period in milliseconds
 * @param {string} status - Job status to clean (completed, failed, etc.)
 */
const cleanQueue = async (queueName, grace = 86400000, status = 'completed') => {
  try {
    const queue = queues[queueName];
    if (!queue) {
      throw new Error(`Queue ${queueName} not found`);
    }

    const jobs = await queue.clean(grace, status);
    logger.info(`Cleaned ${jobs.length} ${status} jobs from queue ${queueName}`);
    return jobs;
  } catch (error) {
    logger.error(`Error cleaning queue ${queueName}:`, error);
    throw error;
  }
};

/**
 * Remove job from queue
 * @param {string} queueName - Queue name
 * @param {string} jobId - Job ID
 */
const removeJob = async (queueName, jobId) => {
  try {
    const queue = queues[queueName];
    if (!queue) {
      throw new Error(`Queue ${queueName} not found`);
    }

    const job = await queue.getJob(jobId);
    if (job) {
      await job.remove();
      logger.info(`Job ${jobId} removed from queue ${queueName}`);
    }
  } catch (error) {
    logger.error(`Error removing job ${jobId} from queue ${queueName}:`, error);
    throw error;
  }
};

/**
 * Retry failed job
 * @param {string} queueName - Queue name
 * @param {string} jobId - Job ID
 */
const retryJob = async (queueName, jobId) => {
  try {
    const queue = queues[queueName];
    if (!queue) {
      throw new Error(`Queue ${queueName} not found`);
    }

    const job = await queue.getJob(jobId);
    if (job) {
      await job.retry();
      logger.info(`Job ${jobId} retried in queue ${queueName}`);
    }
  } catch (error) {
    logger.error(`Error retrying job ${jobId} in queue ${queueName}:`, error);
    throw error;
  }
};

/**
 * Close all queues
 */
const closeAllQueues = async () => {
  try {
    await Promise.all(Object.values(queues).map((queue) => queue.close()));
    logger.info('All queues closed');
  } catch (error) {
    logger.error('Error closing queues:', error);
  }
};

module.exports = {
  queues,
  addJob,
  addBulkJobs,
  getQueueStats,
  getAllQueuesStats,
  pauseQueue,
  resumeQueue,
  cleanQueue,
  removeJob,
  retryJob,
  closeAllQueues,
};
