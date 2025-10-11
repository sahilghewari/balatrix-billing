# Testing Documentation

## Overview

This document provides comprehensive information about the testing infrastructure for the Balatrix Telecom Billing Backend system.

## Test Coverage

The test suite includes:

- **Unit Tests**: Test individual functions and services in isolation
- **Integration Tests**: Test API endpoints with database interactions
- **E2E Tests**: Test complete user workflows end-to-end

### Coverage Goals

- **Target Coverage**: 90%+ for all metrics
- **Critical Services**: 95%+ coverage for billing, payment, and auth services
- **API Endpoints**: 100% coverage for all public APIs

## Test Structure

```
tests/
├── setup.js                    # Global Jest setup
├── helpers/
│   ├── testDatabase.js        # Database lifecycle management
│   └── testFixtures.js        # Test data factories
├── unit/
│   └── services/
│       ├── authService.test.js
│       ├── customerService.test.js
│       ├── subscriptionService.test.js
│       ├── pricingService.test.js
│       ├── billingService.test.js
│       └── paymentService.test.js
├── integration/
│   ├── auth.test.js
│   ├── customers.test.js
│   └── subscriptions.test.js
└── e2e/
    └── userFlows.test.js
```

## Running Tests

### Run All Tests

```bash
npm test
```

### Run Specific Test Suites

```bash
# Unit tests only
npm run test:unit

# Integration tests only
npm run test:integration

# E2E tests only
npm run test:e2e
```

### Run Tests in Watch Mode

```bash
npm run test:watch
```

### Generate Coverage Report

```bash
npm run test:coverage
```

Coverage reports will be generated in the `coverage/` directory.

## Test Database

### Setup

The test suite uses a separate PostgreSQL database (`telecom_billing_test`) to avoid interfering with development or production data.

**Environment Variables for Testing:**

```env
NODE_ENV=test
DB_NAME=telecom_billing_test
DB_USER=postgres
DB_PASSWORD=postgres
DB_HOST=localhost
DB_PORT=5432
```

### Lifecycle Management

- **Before All Tests**: Database is created and tables are synced
- **Before Each Test**: All tables are cleaned (truncated)
- **After All Tests**: Database connection is closed

## Test Helpers

### Test Database Helper

Located in `tests/helpers/testDatabase.js`:

- `setupTestDatabase()` - Initialize test database
- `teardownTestDatabase()` - Close database connection
- `cleanDatabase()` - Truncate all tables

### Test Fixtures

Located in `tests/helpers/testFixtures.js`:

Factory functions to create test data:

- `createTestUser(data)` - Create a test user
- `createTestCustomer(userId, data)` - Create a test customer
- `createTestRatePlan(data)` - Create a test rate plan
- `createTestAccount(customerId, data)` - Create a test account
- `createTestSubscription(customerId, accountId, ratePlanId, data)` - Create a test subscription
- `createTestCDR(subscriptionId, accountId, data)` - Create a test CDR
- `createTestPayment(customerId, data)` - Create a test payment
- `createTestInvoice(customerId, data)` - Create a test invoice
- `createFullTestCustomer(data)` - Create complete customer with all related entities

### Global Test Helpers

Available via `global.testHelpers`:

- `generateUUID()` - Generate test UUIDs
- `sleep(ms)` - Async sleep helper
- `createMockRequest(data)` - Create Express request mock
- `createMockResponse()` - Create Express response mock
- `createMockNext()` - Create Express next() mock

## Writing Tests

### Unit Test Example

```javascript
const customerService = require('../../../src/services/customerService');
const { setupTestDatabase, cleanDatabase, teardownTestDatabase } = require('../../helpers/testDatabase');
const { createTestUser } = require('../../helpers/testFixtures');

describe('Customer Service', () => {
  beforeAll(async () => {
    await setupTestDatabase();
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  beforeEach(async () => {
    await cleanDatabase();
  });

  describe('createCustomer', () => {
    it('should create a new customer with valid data', async () => {
      const user = await createTestUser({ role: 'customer' });

      const customerData = {
        userId: user.id,
        companyName: 'Test Company',
        billingAddress: '123 Test Street',
        billingCity: 'Bangalore',
        billingState: 'Karnataka',
        billingCountry: 'India',
        billingPincode: '560001',
      };

      const customer = await customerService.createCustomer(customerData);

      expect(customer).toBeDefined();
      expect(customer.userId).toBe(user.id);
      expect(customer.companyName).toBe('Test Company');
    });
  });
});
```

### Integration Test Example

```javascript
const request = require('supertest');
const app = require('../../../src/app');
const { setupTestDatabase, cleanDatabase, teardownTestDatabase } = require('../../helpers/testDatabase');

describe('Auth API Integration Tests', () => {
  beforeAll(async () => {
    await setupTestDatabase();
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  beforeEach(async () => {
    await cleanDatabase();
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'testuser',
          email: 'test@example.com',
          password: 'Test@123',
          firstName: 'Test',
          lastName: 'User',
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user).toBeDefined();
      expect(response.body.data.tokens).toBeDefined();
    });
  });
});
```

### E2E Test Example

```javascript
const request = require('supertest');
const app = require('../../../src/app');
const { setupTestDatabase, cleanDatabase, teardownTestDatabase } = require('../../helpers/testDatabase');

describe('Complete Customer Onboarding Flow', () => {
  beforeAll(async () => {
    await setupTestDatabase();
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  beforeEach(async () => {
    await cleanDatabase();
  });

  it('should complete full onboarding: register -> create customer -> create subscription', async () => {
    // Step 1: Register
    const registerResponse = await request(app)
      .post('/api/auth/register')
      .send({
        username: 'newcustomer',
        email: 'newcustomer@example.com',
        password: 'Customer@123',
        firstName: 'New',
        lastName: 'Customer',
      })
      .expect(201);

    const accessToken = registerResponse.body.data.tokens.accessToken;

    // Step 2: Create Customer Profile
    const customerResponse = await request(app)
      .post('/api/customers')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        companyName: 'New Customer Corp',
        billingAddress: '123 Startup Street',
        billingCity: 'Bangalore',
        billingState: 'Karnataka',
        billingCountry: 'India',
        billingPincode: '560001',
      })
      .expect(201);

    expect(customerResponse.body.success).toBe(true);
    
    // Continue with more steps...
  });
});
```

## Best Practices

### 1. Test Isolation

- Each test should be independent
- Use `beforeEach` to clean database state
- Don't rely on test execution order

### 2. Descriptive Test Names

```javascript
// Good
it('should return 401 for invalid password', async () => {});

// Bad
it('test login', async () => {});
```

### 3. Arrange-Act-Assert Pattern

```javascript
it('should create a customer', async () => {
  // Arrange
  const user = await createTestUser();
  const customerData = { userId: user.id, /* ... */ };

  // Act
  const customer = await customerService.createCustomer(customerData);

  // Assert
  expect(customer).toBeDefined();
  expect(customer.userId).toBe(user.id);
});
```

### 4. Test Both Success and Failure Cases

```javascript
describe('login', () => {
  it('should login with valid credentials', async () => {
    // Test success case
  });

  it('should return error for invalid password', async () => {
    // Test failure case
  });

  it('should return error for non-existent user', async () => {
    // Test edge case
  });
});
```

### 5. Mock External Dependencies

```javascript
// Mock external payment gateway
jest.mock('../../../src/config/razorpay', () => ({
  orders: {
    create: jest.fn().mockResolvedValue({ id: 'order_123' }),
  },
}));
```

### 6. Use Test Fixtures

```javascript
// Instead of manually creating data
const user = await User.create({ /* ... */ });
const customer = await Customer.create({ /* ... */ });

// Use fixtures
const { user, customer } = await createFullTestCustomer();
```

## Continuous Integration

### GitHub Actions Workflow

```yaml
name: Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:14
        env:
          POSTGRES_DB: telecom_billing_test
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
      
      redis:
        image: redis:7
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run migrate:test
      - run: npm test
      - run: npm run test:coverage
      - uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info
```

## Troubleshooting

### Tests Hang or Timeout

- Check if database connections are properly closed
- Increase Jest timeout: `jest.setTimeout(30000)`
- Verify Redis is running for integration tests

### Database Connection Errors

- Ensure PostgreSQL is running
- Verify test database exists: `CREATE DATABASE telecom_billing_test;`
- Check environment variables are set correctly

### Random Test Failures

- Usually indicates test isolation issues
- Verify `cleanDatabase()` is called in `beforeEach`
- Check for shared state between tests

### Coverage Not Updating

- Clear Jest cache: `npm run test -- --clearCache`
- Delete coverage folder: `rm -rf coverage`
- Run tests again: `npm run test:coverage`

## Test Statistics

### Current Coverage (Target)

- **Lines**: 90%+
- **Functions**: 90%+
- **Branches**: 80%+
- **Statements**: 90%+

### Test Counts

- **Unit Tests**: 40+ tests
- **Integration Tests**: 30+ tests
- **E2E Tests**: 10+ tests
- **Total Tests**: 80+ tests

## Next Steps

1. **Increase Coverage**: Add tests for remaining controllers and routes
2. **Performance Tests**: Add load testing with Artillery or k6
3. **Security Tests**: Add security scanning with OWASP ZAP
4. **Contract Tests**: Add API contract testing with Pact
5. **Visual Regression**: Add screenshot testing for admin dashboards

## Resources

- [Jest Documentation](https://jestjs.io/)
- [Supertest Documentation](https://github.com/visionmedia/supertest)
- [Testing Best Practices](https://testingjavascript.com/)
- [Test Coverage Best Practices](https://martinfowler.com/bliki/TestCoverage.html)
