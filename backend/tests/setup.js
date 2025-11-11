/**
 * Jest Setup File
 * Runs before all tests
 */

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-key';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-key';
process.env.JWT_EXPIRES_IN = '15m';
process.env.JWT_REFRESH_EXPIRES_IN = '7d';

// Database config for testing
process.env.DB_HOST = '10.10.0.6';
process.env.DB_PORT = '5432';
process.env.DB_NAME = 'frendsahil';
process.env.DB_USER = 'frend1';
process.env.DB_PASSWORD = 'SolidMasti1!';

// Redis config for testing
// process.env.REDIS_HOST = 'localhost';
// process.env.REDIS_PORT = '6379';

// Disable external services in tests
process.env.SENTRY_DSN = '';
process.env.RAZORPAY_KEY_ID = 'test_razorpay_key';
process.env.RAZORPAY_KEY_SECRET = 'test_razorpay_secret';
process.env.STRIPE_SECRET_KEY = 'sk_test_stripe_key';

// Increase timeout for database operations
jest.setTimeout(10000);

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Global test helpers
global.testHelpers = {
  generateUUID: () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  },
  
  sleep: (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
  
  createMockRequest: (data = {}) => ({
    body: data.body || {},
    params: data.params || {},
    query: data.query || {},
    headers: data.headers || {},
    user: data.user || null,
  }),
  
  createMockResponse: () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    res.send = jest.fn().mockReturnValue(res);
    res.set = jest.fn().mockReturnValue(res);
    return res;
  },
  
  createMockNext: () => jest.fn(),
};
