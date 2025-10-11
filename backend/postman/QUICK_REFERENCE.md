# Quick API Testing Reference

## 🚀 Quick Start

### 1. Import to Postman
- Import `Telecom-Billing-API.postman_collection.json`
- Import `Telecom-Billing-Environment.postman_environment.json`
- Select "Telecom Billing - Development" environment

### 2. Server Status
✅ Backend: `http://localhost:3000`
✅ Database: PostgreSQL on `10.10.0.6:5432`
✅ Redis: `localhost:6379`

---

## 📋 Test Sequence (Copy-Paste Ready)

### Step 1: Register & Login
```
POST http://localhost:3000/api/auth/register
Content-Type: application/json

{
  "email": "test@example.com",
  "password": "SecurePass123!@#",
  "firstName": "Test",
  "lastName": "User",
  "phoneNumber": "+919876543210",
  "role": "customer"
}
```

### Step 2: Health Check
```
GET http://localhost:3000/health
```

### Step 3: Get Rate Plan ID
Use seeded data or query:
```sql
SELECT "ratePlanId", name FROM rate_plans LIMIT 1;
```
Example ID: Use from your seeders

### Step 4: Create Customer
```
POST http://localhost:3000/api/customers
Authorization: Bearer {{access_token}}
Content-Type: application/json

{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "phoneNumber": "+919876543211",
  "billingAddress": "123 Main St",
  "gstin": "22AAAAA0000A1Z5",
  "pan": "ABCDE1234F"
}
```

### Step 5: Create CDR
```
POST http://localhost:3000/api/webhooks/cdr
Content-Type: application/json

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

---

## 🔑 Environment Variables

Set these in Postman environment after each request:

| Variable | Set By | Value From Response |
|----------|--------|---------------------|
| `access_token` | Register/Login | `data.tokens.accessToken` |
| `customer_id` | Create Customer | `data.customerId` |
| `subscription_id` | Create Subscription | `data.subscriptionId` |
| `payment_id` | Create Payment | `data.paymentId` |
| `invoice_id` | Generate Invoice | `data.invoiceId` |

---

## 🧪 Quick Tests

### Test 1: Authentication Flow
1. ✅ Register → Save token
2. ✅ Login → Verify token
3. ✅ Get Me → Check user data
4. ✅ Logout → Revoke token

### Test 2: Customer Lifecycle
1. ✅ Create Customer → Save ID
2. ✅ Get Customer → Verify data
3. ✅ Update Customer → Check changes
4. ✅ List Customers → Find in list

### Test 3: CDR Processing
1. ✅ Create CDR → via webhook
2. ✅ Get All CDRs → Verify created
3. ✅ Get by Customer → Filter check

### Test 4: Payment Flow
1. ✅ Create Payment → Save ID
2. ✅ Process Payment → Status change
3. ✅ Get Payment → Verify status
4. ✅ Refund → Partial refund

---

## 🐛 Common Issues & Fixes

### Error: 401 Unauthorized
```
Solution: Re-run login and update access_token
```

### Error: 404 Customer Not Found
```
Solution: Create customer first or use existing ID from database
```

### Error: 500 Internal Server Error
```
Check server logs:
tail -f logs/application.log
```

### Error: Connection Refused
```
Check services:
✓ npm run dev (backend)
✓ PostgreSQL running
✓ Redis running
```

---

## 📊 Sample Data

### Valid Email Formats
- test@example.com
- user123@test.com
- admin@company.org

### Valid Phone Numbers (E.164)
- +919876543210 (India)
- +911234567890 (India)
- +12025551234 (US)

### Valid GSTIN
- 22AAAAA0000A1Z5
- 29ABCDE1234F1Z5

### Valid PAN
- ABCDE1234F
- XYZAB5678C

### Payment Methods
- razorpay
- stripe
- bank_transfer
- cash

---

## 🎯 Success Criteria

### ✅ All Endpoints Working
- [ ] Authentication (5 endpoints)
- [ ] Customers (5 endpoints)
- [ ] Subscriptions (6 endpoints)
- [ ] Payments (5 endpoints)
- [ ] Invoices (4 endpoints)
- [ ] CDRs (4 endpoints)
- [ ] Monitoring (3 endpoints)

### ✅ Data Flow
- [ ] User registration → Customer creation
- [ ] Customer → Subscription → Usage
- [ ] Usage → Invoice → Payment
- [ ] CDR → Billing calculation

### ✅ Security
- [ ] Protected routes require token
- [ ] Invalid tokens rejected
- [ ] Role-based access working

---

## 🔧 Utilities

### Get All Customers
```bash
curl http://localhost:3000/api/customers \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Health Check
```bash
curl http://localhost:3000/health
```

### Check Metrics
```bash
curl http://localhost:3000/api/monitoring/metrics
```

---

## 📝 Notes

- All timestamps are in ISO 8601 format
- Currency defaults to INR
- Pagination: `?page=1&limit=20`
- Rate plans must exist before creating subscriptions
- CDR webhook doesn't require authentication

---

## 🎉 Happy Testing!

Start with the **Authentication** folder and work your way through sequentially.
The collection will automatically save IDs and tokens for you!
