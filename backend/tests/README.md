# Test README

## Quick Start

### Setup Test Database

```powershell
# Create test database
psql -U postgres -c "CREATE DATABASE telecom_billing_test;"
```

### Run Tests

```powershell
# Run all tests
npm test

# Run with coverage report
npm run test:coverage

# Run in watch mode (for development)
npm run test:watch

# Run specific test suites
npm run test:unit          # Unit tests only
npm run test:integration   # Integration tests only
npm run test:e2e          # E2E tests only
```

## Test Files Created

### Test Infrastructure
- `tests/setup.js` - Global Jest configuration
- `tests/helpers/testDatabase.js` - Database lifecycle management
- `tests/helpers/testFixtures.js` - Test data factories
- `jest.config.js` - Jest configuration

### Unit Tests (6 test files)
- `tests/unit/services/authService.test.js` - Authentication service tests
- `tests/unit/services/customerService.test.js` - Customer service tests
- `tests/unit/services/subscriptionService.test.js` - Subscription service tests
- `tests/unit/services/pricingService.test.js` - Pricing service tests
- `tests/unit/services/billingService.test.js` - Billing service tests
- `tests/unit/services/paymentService.test.js` - Payment service tests

### Integration Tests (3 test files)
- `tests/integration/auth.test.js` - Auth API endpoint tests
- `tests/integration/customers.test.js` - Customer API endpoint tests
- `tests/integration/subscriptions.test.js` - Subscription API endpoint tests

### E2E Tests (1 test file)
- `tests/e2e/userFlows.test.js` - Complete user workflow tests
  - Customer onboarding flow
  - Billing cycle flow
  - Subscription cancellation flow
  - Account balance management flow

## Test Coverage

### Current Tests
- **80+ test cases** across unit, integration, and E2E tests
- **6 core services** fully tested
- **15+ API endpoints** tested
- **4 complete user flows** tested

### Services Tested
1. **Auth Service** - Register, login, logout, refresh tokens, password change, email verification
2. **Customer Service** - Create, read, update, list, suspend, activate customers
3. **Subscription Service** - Create, cancel, suspend, reactivate, renew, change plan
4. **Pricing Service** - Call cost calculation, subscription cost, overage, tax calculation
5. **Billing Service** - Invoice generation, payment processing, overdue invoices, prorations
6. **Payment Service** - Razorpay integration, payment processing, refunds, retries

### API Endpoints Tested
1. **Auth API** - Register, login, logout, refresh, change password, get profile
2. **Customer API** - Create, list, get by ID, update, suspend, activate
3. **Subscription API** - Create, list, get by ID, cancel, suspend, reactivate

## Running Tests

### Prerequisites

1. **PostgreSQL** running on localhost:5432
2. **Redis** running on localhost:6379 (optional for some tests) <!-- Commented out: Redis disabled -->
3. **Test database** created: `telecom_billing_test`

### Environment Variables

The test setup automatically configures:
```
NODE_ENV=test
DB_NAME=telecom_billing_test
DB_USER=postgres
DB_PASSWORD=postgres
JWT_SECRET=test-jwt-secret-key
```

### Test Execution

```powershell
# Install dependencies (if not already done)
npm install

# Run all tests
npm test

# Expected output:
# PASS tests/unit/services/authService.test.js
# PASS tests/unit/services/customerService.test.js
# PASS tests/unit/services/subscriptionService.test.js
# PASS tests/unit/services/pricingService.test.js
# PASS tests/unit/services/billingService.test.js
# PASS tests/unit/services/paymentService.test.js
# PASS tests/integration/auth.test.js
# PASS tests/integration/customers.test.js
# PASS tests/integration/subscriptions.test.js
# PASS tests/e2e/userFlows.test.js
#
# Test Suites: 10 passed, 10 total
# Tests:       80+ passed, 80+ total
```

## Test Structure

### Unit Tests
Test individual functions and services in isolation. Mock external dependencies.

**Example:**
```javascript
describe('Customer Service', () => {
  it('should create a new customer', async () => {
    const user = await createTestUser();
    const customer = await customerService.createCustomer({
      userId: user.id,
      billingAddress: '123 Test St',
      billingCity: 'Bangalore',
      billingState: 'Karnataka',
      billingCountry: 'India',
      billingPincode: '560001',
    });
    expect(customer).toBeDefined();
    expect(customer.userId).toBe(user.id);
  });
});
```

### Integration Tests
Test API endpoints with full database integration.

**Example:**
```javascript
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
  });
});
```

### E2E Tests
Test complete user workflows from start to finish.

**Example:**
```javascript
it('should complete full onboarding', async () => {
  // 1. Register user
  const registerResponse = await request(app)
    .post('/api/auth/register')
    .send({...})
    .expect(201);
  
  // 2. Create customer profile
  const customerResponse = await request(app)
    .post('/api/customers')
    .set('Authorization', `Bearer ${token}`)
    .send({...})
    .expect(201);
  
  // 3. Create subscription
  // ... and so on
});
```

## Coverage Report

After running `npm run test:coverage`, view the HTML report:

```powershell
# Open coverage report in browser
start coverage/lcov-report/index.html
```

The report shows:
- Line coverage
- Function coverage
- Branch coverage
- Statement coverage

## Troubleshooting

### Database Connection Errors

```powershell
# Ensure PostgreSQL is running
pg_isready

# Create test database if it doesn't exist
psql -U postgres -c "CREATE DATABASE telecom_billing_test;"

# Grant permissions
psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE telecom_billing_test TO postgres;"
```

### Tests Hanging

If tests hang or timeout:
1. Check database connections are closed properly
2. Increase Jest timeout in jest.config.js
3. Check for async operations without await

### Port Already in Use

If you get "Port already in use" errors:
```powershell
# Kill process using port (e.g., 3000)
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

## Next Steps

To add more tests:

1. **More Integration Tests**: Add tests for remaining API endpoints (invoices, payments, CDRs, DIDs, reports)
2. **More Unit Tests**: Add tests for controllers, middleware, utilities
3. **Performance Tests**: Add load testing with Artillery or k6
4. **Security Tests**: Add security testing with OWASP ZAP

## Documentation

For detailed testing documentation, see: [docs/TESTING.md](../docs/TESTING.md)
