# Postman API Testing Guide

## Overview
This guide provides step-by-step instructions for testing the Telecom Billing Backend API using Postman.

## Prerequisites
1. **Postman** installed (Desktop or Web version)
2. **Backend server** running on `http://localhost:3000`
3. **PostgreSQL** database running with migrations and seeders applied
4. **Redis** server running on `localhost:6379`

## Setup Instructions

### 1. Import Collection and Environment

1. Open Postman
2. Click **Import** button (top left)
3. Select the following files:
   - `postman/Telecom-Billing-API.postman_collection.json`
   - `postman/Telecom-Billing-Environment.postman_environment.json`
4. Select the "Telecom Billing - Development" environment from the environment dropdown (top right)

### 2. Start the Backend Server

```bash
cd backend
npm run dev
```

Ensure the server is running on `http://localhost:3000`

## Testing Workflow

### Phase 1: Authentication

#### 1.1 Register a New User
- **Request**: `Authentication > Register User`
- **Expected**: HTTP 201 Created
- **Auto-saved variables**: `access_token`, `refresh_token`, `user_id`
- **Notes**: Registration email must be unique

#### 1.2 Login
- **Request**: `Authentication > Login`
- **Expected**: HTTP 200 OK
- **Auto-saved variables**: `access_token`, `refresh_token`
- **Notes**: Use for testing with existing users

#### 1.3 Get Current User
- **Request**: `Authentication > Get Current User`
- **Expected**: HTTP 200 OK
- **Returns**: User profile information

#### 1.4 Refresh Token
- **Request**: `Authentication > Refresh Token`
- **Expected**: HTTP 200 OK
- **Auto-saved variables**: New `access_token`
- **Notes**: Test token refresh mechanism

#### 1.5 Logout
- **Request**: `Authentication > Logout`
- **Expected**: HTTP 200 OK
- **Notes**: Revokes refresh token

---

### Phase 2: Customer Management

#### 2.1 Create Customer
- **Request**: `Customers > Create Customer`
- **Expected**: HTTP 201 Created
- **Auto-saved variables**: `customer_id`
- **Body Example**:
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john.doe@example.com",
  "phoneNumber": "+919876543211",
  "billingAddress": "123 Main St, City, State 12345",
  "gstin": "22AAAAA0000A1Z5",
  "pan": "ABCDE1234F"
}
```

#### 2.2 Get All Customers
- **Request**: `Customers > Get All Customers`
- **Expected**: HTTP 200 OK
- **Query params**: `page=1`, `limit=10`

#### 2.3 Get Customer by ID
- **Request**: `Customers > Get Customer by ID`
- **Expected**: HTTP 200 OK
- **Uses**: `{{customer_id}}` variable

#### 2.4 Update Customer
- **Request**: `Customers > Update Customer`
- **Expected**: HTTP 200 OK
- **Body**: Partial customer data to update

#### 2.5 Delete Customer
- **Request**: `Customers > Delete Customer`
- **Expected**: HTTP 200 OK
- **Notes**: Test at the end of testing cycle

---

### Phase 3: Subscriptions

#### 3.1 Create Subscription
- **Request**: `Subscriptions > Create Subscription`
- **Expected**: HTTP 201 Created
- **Auto-saved variables**: `subscription_id`
- **Prerequisites**: Valid `customer_id` and `rate_plan_id`
- **Body Example**:
```json
{
  "customerId": "{{customer_id}}",
  "ratePlanId": "{{rate_plan_id}}",
  "billingCycle": "monthly",
  "autoRenew": true
}
```

#### 3.2 Get All Subscriptions
- **Request**: `Subscriptions > Get All Subscriptions`
- **Expected**: HTTP 200 OK

#### 3.3 Get Subscription by ID
- **Request**: `Subscriptions > Get Subscription by ID`
- **Expected**: HTTP 200 OK

#### 3.4 Get Subscription Usage
- **Request**: `Subscriptions > Get Subscription Usage`
- **Expected**: HTTP 200 OK
- **Returns**: Usage metrics for the subscription

#### 3.5 Update Subscription
- **Request**: `Subscriptions > Update Subscription`
- **Expected**: HTTP 200 OK

#### 3.6 Cancel Subscription
- **Request**: `Subscriptions > Cancel Subscription`
- **Expected**: HTTP 200 OK
- **Notes**: Changes status to 'cancelled'

---

### Phase 4: Payments

#### 4.1 Create Payment
- **Request**: `Payments > Create Payment`
- **Expected**: HTTP 201 Created
- **Auto-saved variables**: `payment_id`
- **Body Example**:
```json
{
  "customerId": "{{customer_id}}",
  "amount": 1000,
  "paymentMethod": "razorpay",
  "currency": "INR"
}
```

#### 4.2 Get All Payments
- **Request**: `Payments > Get All Payments`
- **Expected**: HTTP 200 OK

#### 4.3 Get Payment by ID
- **Request**: `Payments > Get Payment by ID`
- **Expected**: HTTP 200 OK

#### 4.4 Process Payment
- **Request**: `Payments > Process Payment`
- **Expected**: HTTP 200 OK
- **Notes**: Simulates payment gateway processing

#### 4.5 Refund Payment
- **Request**: `Payments > Refund Payment`
- **Expected**: HTTP 200 OK
- **Body Example**:
```json
{
  "amount": 500,
  "reason": "Customer request"
}
```

---

### Phase 5: Invoices

#### 5.1 Generate Invoice
- **Request**: `Invoices > Generate Invoice`
- **Expected**: HTTP 201 Created
- **Auto-saved variables**: `invoice_id`
- **Body Example**:
```json
{
  "customerId": "{{customer_id}}",
  "subscriptionId": "{{subscription_id}}",
  "billingPeriodStart": "2025-10-01",
  "billingPeriodEnd": "2025-10-31"
}
```

#### 5.2 Get All Invoices
- **Request**: `Invoices > Get All Invoices`
- **Expected**: HTTP 200 OK

#### 5.3 Get Invoice by ID
- **Request**: `Invoices > Get Invoice by ID`
- **Expected**: HTTP 200 OK

#### 5.4 Download Invoice PDF
- **Request**: `Invoices > Download Invoice PDF`
- **Expected**: HTTP 200 OK with PDF file
- **Notes**: Response will be a PDF document

---

### Phase 6: CDR (Call Detail Records)

#### 6.1 Create CDR (via Webhook)
- **Request**: `CDR > Create CDR (Webhook)`
- **Expected**: HTTP 201 Created
- **No Auth Required**: Webhook endpoint
- **Body Example**:
```json
{
  "uuid": "550e8400-e29b-41d4-a716-446655440000",
  "callingNumber": "+919876543210",
  "calledNumber": "+911234567890",
  "startTime": "2025-10-10T10:00:00Z",
  "endTime": "2025-10-10T10:05:30Z",
  "duration": 330,
  "billsec": 330,
  "hangupCause": "NORMAL_CLEARING",
  "direction": "outbound",
  "callType": "local"
}
```

#### 6.2 Get All CDRs
- **Request**: `CDR > Get All CDRs`
- **Expected**: HTTP 200 OK
- **Query params**: Pagination supported

#### 6.3 Get CDR by ID
- **Request**: `CDR > Get CDR by ID`
- **Expected**: HTTP 200 OK

#### 6.4 Get CDRs by Customer
- **Request**: `CDR > Get CDRs by Customer`
- **Expected**: HTTP 200 OK
- **Returns**: All CDRs for a specific customer

---

### Phase 7: Monitoring & Health

#### 7.1 Health Check
- **Request**: `Monitoring & Health > Health Check`
- **Expected**: HTTP 200 OK
- **No Auth Required**
- **Returns**: System health status

#### 7.2 Get Metrics
- **Request**: `Monitoring & Health > Get Metrics`
- **Expected**: HTTP 200 OK
- **Returns**: Prometheus-formatted metrics

#### 7.3 Get System Stats
- **Request**: `Monitoring & Health > Get System Stats`
- **Expected**: HTTP 200 OK
- **Requires Auth**: Admin role
- **Returns**: Detailed system statistics

---

## Testing Scenarios

### Scenario 1: Complete User Onboarding Flow
1. Register User
2. Create Customer Profile
3. Create Subscription
4. Generate Invoice
5. Process Payment

### Scenario 2: Call Processing Flow
1. Login
2. Create CDR (simulate call)
3. Get CDRs by Customer
4. Verify usage tracking
5. Generate invoice based on usage

### Scenario 3: Payment Lifecycle
1. Create Payment
2. Process Payment (success)
3. Create another payment
4. Process Payment (failure simulation)
5. Refund first payment

### Scenario 4: Subscription Management
1. Create Subscription
2. Check initial usage
3. Create CDRs to generate usage
4. Update subscription
5. Cancel subscription

---

## Common Variables

The collection automatically manages these variables:
- `access_token` - JWT access token (auto-updated on login/register)
- `refresh_token` - JWT refresh token
- `user_id` - Current user ID
- `customer_id` - Current customer ID
- `subscription_id` - Current subscription ID
- `payment_id` - Current payment ID
- `invoice_id` - Current invoice ID
- `cdr_id` - Current CDR ID
- `rate_plan_id` - Rate plan ID (set manually from seeded data)

---

## Tips for Testing

### 1. Run Requests in Order
Follow the phases sequentially as many requests depend on previous responses.

### 2. Check Auto-Saved Variables
After creating resources, verify that the IDs are saved:
- Click the eye icon (👁️) in top right
- Check collection/environment variables

### 3. Rate Plan ID
Before creating subscriptions, get a rate plan ID from seeded data:
```sql
SELECT "ratePlanId" FROM rate_plans LIMIT 1;
```
Or use the seeder data UUID from `seeders/20241001000003-demo-rate-plans.js`

### 4. Modify Request Bodies
Customize request bodies based on your testing needs:
- Change email addresses to avoid duplicates
- Adjust amounts for payments
- Modify dates for billing periods

### 5. Test Error Scenarios
- Invalid email format in registration
- Expired/invalid tokens
- Non-existent resource IDs
- Insufficient permissions

### 6. Monitor Server Logs
Watch the terminal running `npm run dev` for:
- Request logs
- Error messages
- Database queries
- Redis operations

---

## Troubleshooting

### Issue: 401 Unauthorized
**Solution**: 
1. Run Login or Register request
2. Verify `access_token` is saved
3. Check environment is selected

### Issue: 404 Not Found
**Solution**:
1. Verify resource ID variables are set
2. Check if resource exists in database
3. Verify API endpoint path

### Issue: 500 Internal Server Error
**Solution**:
1. Check server logs for error details
2. Verify database connection
3. Ensure Redis is running
4. Check all required fields in request body

### Issue: Connection Refused
**Solution**:
1. Verify backend server is running
2. Check correct port (3000)
3. Ensure PostgreSQL and Redis are running

---

## Advanced Testing

### Using Postman Runner
1. Select collection or folder
2. Click **Run** button
3. Configure run settings
4. Execute batch tests

### Collection Variables vs Environment Variables
- **Collection variables**: Specific to this collection
- **Environment variables**: Can be shared across collections
- Use environment for base_url to switch between dev/staging/prod

### Pre-request Scripts
Requests include scripts that automatically:
- Save tokens after authentication
- Save resource IDs after creation
- Validate responses

### Test Scripts
Add custom test scripts to validate:
```javascript
pm.test("Status code is 200", function () {
    pm.response.to.have.status(200);
});

pm.test("Response has data", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData.success).to.be.true;
    pm.expect(jsonData.data).to.exist;
});
```

---

## Next Steps

After completing API testing:
1. Document any bugs or issues found
2. Test edge cases and boundary conditions
3. Perform load testing with multiple concurrent requests
4. Test with production-like data volumes
5. Validate security and authentication thoroughly

---

## Support

For issues or questions:
- Check server logs: `backend/logs/`
- Review API documentation
- Verify environment configuration in `.env`
- Test database connectivity

Happy Testing! 🚀
