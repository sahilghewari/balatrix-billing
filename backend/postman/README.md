# Postman API Testing Collection

## 📁 Files Included

1. **Telecom-Billing-API.postman_collection.json**
   - Complete Postman collection with 32+ API endpoints
   - Organized into 7 main categories
   - Auto-saves tokens and IDs
   - Includes test scripts

2. **Telecom-Billing-Environment.postman_environment.json**
   - Development environment configuration
   - Pre-configured variables
   - Base URL and authentication tokens

3. **TESTING_GUIDE.md**
   - Comprehensive step-by-step testing guide
   - Detailed explanation of each endpoint
   - Testing scenarios and workflows
   - Troubleshooting tips

4. **QUICK_REFERENCE.md**
   - Quick start guide
   - Copy-paste ready request examples
   - Common issues and solutions
   - Success criteria checklist

## 🚀 Quick Start

### 1. Import to Postman

**Option A: Using Postman Desktop**
1. Open Postman
2. Click **Import** (top left)
3. Drag and drop both JSON files or click **Choose Files**
4. Select both files:
   - `Telecom-Billing-API.postman_collection.json`
   - `Telecom-Billing-Environment.postman_environment.json`

**Option B: Using Postman Web**
1. Go to https://web.postman.co
2. Click **Import**
3. Upload the JSON files

### 2. Select Environment
- Click the environment dropdown (top right)
- Select **"Telecom Billing - Development"**

### 3. Start Testing
- Open the collection
- Start with **Authentication > Register User**
- Follow the testing guide

## 📋 API Categories

### 1. Authentication (5 endpoints)
- Register User
- Login
- Get Current User
- Refresh Token
- Logout

### 2. Customers (5 endpoints)
- Get All Customers
- Get Customer by ID
- Create Customer
- Update Customer
- Delete Customer

### 3. Subscriptions (6 endpoints)
- Get All Subscriptions
- Get Subscription by ID
- Create Subscription
- Update Subscription
- Cancel Subscription
- Get Subscription Usage

### 4. Payments (5 endpoints)
- Get All Payments
- Get Payment by ID
- Create Payment
- Process Payment
- Refund Payment

### 5. Invoices (4 endpoints)
- Get All Invoices
- Get Invoice by ID
- Generate Invoice
- Download Invoice PDF

### 6. CDR - Call Detail Records (4 endpoints)
- Get All CDRs
- Get CDR by ID
- Create CDR (Webhook)
- Get CDRs by Customer

### 7. Monitoring & Health (3 endpoints)
- Health Check
- Get Metrics
- Get System Stats

## 🎯 Testing Workflow

### Recommended Order:
1. **Start Services**
   ```bash
   # Terminal 1: Start backend
   npm run dev
   
   # Verify PostgreSQL is running on port 5432
   # Verify Redis is running on port 6379
   ```

2. **Test Authentication**
   - Register a new user
   - Login with credentials
   - Verify token is saved automatically

3. **Test Core Features**
   - Create customers
   - Create subscriptions
   - Process CDRs
   - Generate invoices
   - Process payments

4. **Test Monitoring**
   - Check health endpoint
   - View metrics
   - Check system stats

## 🔑 Auto-Saved Variables

The collection automatically manages these variables:

| Variable | Description | Set By |
|----------|-------------|--------|
| `access_token` | JWT authentication token | Register/Login |
| `refresh_token` | Token refresh | Register/Login |
| `user_id` | Current user ID | Register |
| `customer_id` | Customer ID | Create Customer |
| `subscription_id` | Subscription ID | Create Subscription |
| `payment_id` | Payment ID | Create Payment |
| `invoice_id` | Invoice ID | Generate Invoice |
| `cdr_id` | CDR ID | Create CDR |
| `rate_plan_id` | Rate plan ID | Manual (from seeders) |

## 📖 Documentation

### For Complete Guide
See **TESTING_GUIDE.md** for:
- Detailed endpoint documentation
- Request/response examples
- Testing scenarios
- Troubleshooting

### For Quick Reference
See **QUICK_REFERENCE.md** for:
- Copy-paste requests
- Quick troubleshooting
- Sample data
- Success criteria

## 🛠️ Prerequisites

Before testing, ensure:

✅ **Backend Server Running**
```bash
cd backend
npm run dev
# Server should start on http://localhost:3000
```

✅ **Database Setup**
```bash
# Run migrations
npx sequelize-cli db:migrate

# Run seeders
npx sequelize-cli db:seed:all
```

✅ **Services Running**
- PostgreSQL on port 5432
- Redis on port 6379

✅ **Environment Variables**
- `.env` file configured correctly
- Database credentials set
- JWT secrets configured

## 🔍 Testing Tips

### 1. Sequential Testing
Run requests in order as many depend on previous responses.

### 2. Check Variables
After each request, verify variables are saved:
- Click the eye icon (👁️) in Postman
- View Collection/Environment variables

### 3. Monitor Logs
Watch server logs while testing:
```bash
tail -f logs/application.log
```

### 4. Use Test Scripts
Requests include pre-configured test scripts that:
- Validate response status
- Save IDs and tokens automatically
- Check response structure

### 5. Customize Requests
Feel free to modify:
- Email addresses (must be unique)
- Phone numbers
- Payment amounts
- Date ranges

## 🐛 Common Issues

### Issue: 401 Unauthorized
**Cause**: Token expired or not set  
**Fix**: Run Login request again

### Issue: 404 Not Found
**Cause**: Resource doesn't exist  
**Fix**: Create the resource first or check ID

### Issue: 500 Internal Server Error
**Cause**: Server error  
**Fix**: Check server logs for details

### Issue: Connection Refused
**Cause**: Server not running  
**Fix**: Start backend with `npm run dev`

## 📊 Test Coverage

The collection covers:
- ✅ CRUD operations for all resources
- ✅ Authentication and authorization
- ✅ Payment processing workflows
- ✅ Invoice generation
- ✅ CDR processing
- ✅ Monitoring and health checks
- ✅ Error handling
- ✅ Pagination
- ✅ Filtering and search

## 🎨 Features

### Automatic Token Management
- Tokens are automatically extracted and saved after login/register
- All authenticated requests use the saved token
- No manual copying required

### Pre-request Scripts
- Validate required variables
- Format data before sending
- Add timestamps

### Test Scripts
- Validate response codes
- Extract and save IDs
- Check response structure
- Display success messages

### Environment Variables
- Easy switching between dev/staging/prod
- Centralized configuration
- Secure credential management

## 🚦 Status Codes

| Code | Meaning | Example |
|------|---------|---------|
| 200 | Success | Get requests |
| 201 | Created | Create requests |
| 400 | Bad Request | Invalid data |
| 401 | Unauthorized | Missing/invalid token |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource doesn't exist |
| 500 | Server Error | Backend error |

## 📞 Support

For issues:
1. Check **TESTING_GUIDE.md** for detailed help
2. Review server logs
3. Verify environment configuration
4. Check database connectivity

## 🎉 Get Started

1. Import the collection and environment
2. Start the backend server
3. Run **Authentication > Register User**
4. Follow the sequential flow
5. Check the testing guide for detailed instructions

Happy Testing! 🚀
