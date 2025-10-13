# Backend API Endpoints - Updated

## Overview
This document lists all the backend API endpoints for the subscription and payment flow.

## Rate Plan Endpoints

### Public Endpoints (No Auth Required)

#### Get Public Plans
```
GET /api/rate-plans/public
```
Returns all publicly available subscription plans.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "plan_code": "STARTER",
      "planName": "Starter Plan",
      "monthlyPrice": 349,
      "annualPrice": 3349,
      "currency": "INR",
      "limits": {
        "tollFreeNumbers": 1,
        "includedMinutes": 100,
        "extensions": 2,
        "pricePerMinute": 1.99
      },
      "billingCycle": "monthly",
      "features": [...],
      "metadata": {
        "addOns": {
          "extraTollFreeNumber": {
            "payg": 1,
            "oneTime": 199
          },
          "extraExtension": {
            "payg": 1,
            "oneTime": 99
          }
        }
      }
    }
  ]
}
```

#### Calculate Price
```
POST /api/rate-plans/calculate-price
```
Calculate subscription price with add-ons before purchase.

**Request Body:**
```json
{
  "planId": 1,
  "billingCycle": "quarterly",
  "addons": {
    "extraTollFreeNumbers": 2,
    "extraExtensions": 5
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "plan": {
      "id": 1,
      "name": "Starter Plan",
      "code": "STARTER"
    },
    "billingCycle": "quarterly",
    "pricing": {
      "basePrice": 1047,
      "setupFee": 0,
      "subtotal": 1047,
      "gst": 188.46,
      "total": 1235.46
    },
    "addons": [
      {
        "type": "extraTollFreeNumbers",
        "quantity": 2,
        "unitPrice": 1,
        "total": 2,
        "description": "Extra Toll-Free Numbers (PAYG)"
      },
      {
        "type": "extraExtensions",
        "quantity": 5,
        "unitPrice": 1,
        "total": 5,
        "description": "Extra Extensions (PAYG)"
      }
    ],
    "currency": "INR",
    "features": [...],
    "limits": {...}
  }
}
```

### Admin Endpoints (Requires Admin Role)

#### Get All Plans
```
GET /api/rate-plans
```
Get all plans including inactive ones (admin only).

#### Get Plan by ID
```
GET /api/rate-plans/:id
```

#### Get Plan by Code
```
GET /api/rate-plans/code/:code
```

#### Create Plan
```
POST /api/rate-plans
```

#### Update Plan
```
PUT /api/rate-plans/:id
```

#### Delete Plan
```
DELETE /api/rate-plans/:id
```

---

## Subscription Endpoints

### User Endpoints (Requires Authentication)

#### Get My Subscription
```
GET /api/subscriptions/my-subscription
```
Get current user's active subscription.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "customerId": 1,
    "ratePlanId": 1,
    "status": "active",
    "billingCycle": "quarterly",
    "startDate": "2025-01-10T00:00:00.000Z",
    "currentPeriodStart": "2025-01-10T00:00:00.000Z",
    "currentPeriodEnd": "2025-04-10T00:00:00.000Z",
    "nextBillingDate": "2025-04-11T00:00:00.000Z",
    "autoRenew": true,
    "metadata": {
      "pricing": {...},
      "addons": {...}
    },
    "ratePlan": {
      "id": 1,
      "planName": "Starter Plan",
      "limits": {...}
    }
  }
}
```

#### Create Subscription with Payment
```
POST /api/subscriptions/create-with-payment
```
Creates a Razorpay order and pending subscription record.

**Request Body:**
```json
{
  "planId": 1,
  "billingCycle": "quarterly",
  "addons": {
    "extraTollFreeNumbers": 2,
    "extraExtensions": 5
  },
  "customerData": {
    "firstName": "John",
    "lastName": "Doe",
    "phone": "+919876543210",
    "company": "ABC Corp",
    "address": "123 Main St",
    "city": "Mumbai",
    "state": "Maharashtra",
    "country": "IN",
    "postalCode": "400001",
    "gstNumber": "27AAPFU0939F1ZV"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "orderId": "order_NZ2QJcaQUeZqjM",
    "subscriptionId": 1,
    "amount": 123546,
    "currency": "INR",
    "key": "rzp_test_xxx",
    "pricing": {
      "plan": {...},
      "billingCycle": "quarterly",
      "pricing": {...},
      "addons": [...],
      "currency": "INR"
    },
    "customer": {
      "id": 1,
      "name": "John Doe",
      "email": "john@example.com",
      "contact": "+919876543210"
    }
  }
}
```

#### Verify Payment and Activate Subscription
```
POST /api/subscriptions/verify-payment
```
Verifies Razorpay payment signature and activates subscription.

**Request Body:**
```json
{
  "razorpay_order_id": "order_NZ2QJcaQUeZqjM",
  "razorpay_payment_id": "pay_NZ2QJcaQUeZqjM",
  "razorpay_signature": "abc123...",
  "subscriptionId": 1
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "subscription": {
      "id": 1,
      "customerId": 1,
      "status": "active",
      "startDate": "2025-01-10T00:00:00.000Z",
      "currentPeriodStart": "2025-01-10T00:00:00.000Z",
      "currentPeriodEnd": "2025-04-10T00:00:00.000Z",
      "nextBillingDate": "2025-04-11T00:00:00.000Z",
      "ratePlan": {...}
    },
    "payment": {
      "id": 1,
      "amount": 1235.46,
      "currency": "INR",
      "status": "completed",
      "transactionId": "pay_NZ2QJcaQUeZqjM"
    }
  },
  "message": "Payment verified and subscription activated"
}
```

### Existing Endpoints

#### Create Subscription (Legacy)
```
POST /api/subscriptions
```

#### Get All Subscriptions (Admin)
```
GET /api/subscriptions
```

#### Get Subscription by ID
```
GET /api/subscriptions/:id
```

#### Update Subscription
```
PUT /api/subscriptions/:id
```

#### Change Subscription Plan
```
POST /api/subscriptions/:id/change-plan
```

#### Cancel Subscription
```
POST /api/subscriptions/:id/cancel
```

#### Suspend Subscription (Admin)
```
POST /api/subscriptions/:id/suspend
```

#### Activate Subscription (Admin)
```
POST /api/subscriptions/:id/activate
```

#### Get Subscription Usage
```
GET /api/subscriptions/:id/usage
```

#### Update Subscription Usage (Admin)
```
POST /api/subscriptions/:id/usage
```

#### Renew Subscription (Admin)
```
POST /api/subscriptions/:id/renew
```

---

## User Flow for Subscription Purchase

### Step 1: Browse Plans (No Auth)
```javascript
// Frontend fetches public plans
GET /api/rate-plans/public
```

### Step 2: Calculate Price (No Auth - Optional)
```javascript
// User selects plan and add-ons, frontend calculates price
POST /api/rate-plans/calculate-price
{
  "planId": 1,
  "billingCycle": "quarterly",
  "addons": {
    "extraTollFreeNumbers": 2,
    "extraExtensions": 5
  }
}
```

### Step 3: User Login/Register
```javascript
// User must be authenticated
POST /api/auth/login
// or
POST /api/auth/register
```

### Step 4: Create Order
```javascript
// Frontend creates Razorpay order
POST /api/subscriptions/create-with-payment
{
  "planId": 1,
  "billingCycle": "quarterly",
  "addons": {...},
  "customerData": {...}
}

// Response includes orderId, amount, key for Razorpay
```

### Step 5: Razorpay Payment
```javascript
// Frontend opens Razorpay checkout with orderId
const options = {
  key: response.data.key,
  amount: response.data.amount,
  currency: response.data.currency,
  order_id: response.data.orderId,
  name: 'Balatrix Telecom',
  description: 'Subscription Payment',
  prefill: {
    name: response.data.customer.name,
    email: response.data.customer.email,
    contact: response.data.customer.contact
  },
  handler: function(paymentResponse) {
    // Payment successful, verify on backend
  }
};
```

### Step 6: Verify Payment
```javascript
// After payment success, verify and activate
POST /api/subscriptions/verify-payment
{
  "razorpay_order_id": "order_xxx",
  "razorpay_payment_id": "pay_xxx",
  "razorpay_signature": "signature_xxx",
  "subscriptionId": 1
}

// Response includes activated subscription
```

### Step 7: Redirect to Dashboard
```javascript
// Frontend redirects to dashboard with subscription
GET /api/subscriptions/my-subscription
```

---

## Pricing Structure

### Plans
1. **Starter Plan**
   - Monthly: ₹349
   - Quarterly: ₹1,047 (₹349 × 3)
   - Annual: ₹3,349 (20% discount)
   - Limits: 1 TFN, 100 min, 2 ext, ₹1.99/min

2. **Professional Plan**
   - Monthly: ₹999
   - Quarterly: ₹2,997 (₹999 × 3)
   - Annual: ₹9,590 (20% discount)
   - Limits: 2 TFN, 500 min, 10 ext, ₹1.60/min

3. **Call Center Plan**
   - Monthly: ₹4,999
   - Quarterly: ₹14,997 (₹4,999 × 3)
   - Annual: ₹47,990 (20% discount)
   - Limits: 5 TFN, 1500 min, 50 ext, ₹1.45/min

### Add-ons
- **Extra Toll-Free Number**
  - Quarterly/Annual: ₹1 per month (PAYG)
  - Monthly: ₹199 one-time charge (OTC)

- **Extra Extension**
  - Quarterly/Annual: ₹1 per month (PAYG)
  - Monthly: ₹99 one-time charge (OTC)

### GST
- 18% GST applied on subtotal (base price + add-ons + setup fee)

---

## Environment Variables Required

```env
# Razorpay Configuration
RAZORPAY_KEY_ID=rzp_test_xxx
RAZORPAY_KEY_SECRET=xxx
RAZORPAY_WEBHOOK_SECRET=xxx

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/balatrix_billing

# JWT
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_SECRET=your_refresh_token_secret
REFRESH_TOKEN_EXPIRES_IN=7d
```

---

## Next Steps for Frontend

1. Create `src/pages/PlansPage.jsx` - Display plans with pricing
2. Create `src/components/plans/PlanCard.jsx` - Individual plan card
3. Create `src/components/plans/AddonSelector.jsx` - Select add-ons
4. Create `src/components/payment/RazorpayCheckout.jsx` - Payment integration
5. Create `src/api/planService.js` - API calls for plans
6. Create `src/api/subscriptionService.js` - API calls for subscriptions
7. Update `src/pages/DashboardPage.jsx` - Show subscription details
8. Add Razorpay script to `index.html`

---

## Testing Checklist

- [ ] Test GET /api/rate-plans/public
- [ ] Test POST /api/rate-plans/calculate-price with different billing cycles
- [ ] Test POST /api/subscriptions/create-with-payment with customer data
- [ ] Test Razorpay payment flow in test mode
- [ ] Test POST /api/subscriptions/verify-payment with test signature
- [ ] Test GET /api/subscriptions/my-subscription
- [ ] Verify subscription activation in database
- [ ] Verify payment record creation
- [ ] Test error scenarios (invalid signature, duplicate payment, etc.)
