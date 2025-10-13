# Phase 2: Subscription Plans & Payment Integration - In Progress

## ✅ Completed So Far

### 1. Database Schema Updates
- ✅ Updated `rate_plans` table with new columns:
  - `plan_code` (unique identifier)
  - `planName` (display name)
  - `currency` (INR)
  - `limits` (JSON for plan limits)
  - `billingCycle` (monthly/quarterly/annual)
  - `trialDays`
  - `isPublic` (visibility flag)
  - `displayOrder` (sorting)
  - `metadata` (JSON for additional data)

- ✅ Added new `planType` enum values:
  - `starter`
  - `professional`
  - `callCenter`
  - `custom`

### 2. Subscription Plans Created

#### Starter Plan (₹349/month)
- 1 Toll-Free Number
- 100 Free Minutes
- 2 Extensions
- ₹1.99/minute after limit
- Email Support
- Annual: ₹3,349 (20% discount)

#### Professional Plan (₹999/month) - **Most Popular**
- 2 Toll-Free Numbers
- 500 Free Minutes
- 10 Extensions
- ₹1.60/minute after limit
- Priority Support
- IVR System
- Annual: ₹9,590 (20% discount)

#### Call Center Plan (₹4,999/month)
- 5 Toll-Free Numbers
- 1500 Free Minutes
- 50 Extensions
- ₹1.45/minute after limit
- 24/7 Support
- Queue Management
- API Access
- Annual: ₹47,990 (20% discount)

### 3. Add-ons Pricing
- **Toll-Free Number**: ₹1 (pay-as-you-go) or ₹199 (one-time)
- **Extension**: ₹1 (pay-as-you-go) or ₹99 (one-time)
- **Per Minute Charge**: ₹1.99

### 4. Quarterly Payment Benefit
- Pay quarterly → No OTC charges for add-ons

## 🚧 Next Steps

### Backend Tasks
1. Create API endpoint to list all public rate plans
2. Create subscription creation endpoint with payment integration
3. Integrate Razorpay for payment processing
4. Create payment verification endpoint
5. Handle subscription activation after payment

### Frontend Tasks
1. Create Plans page to display all subscription plans
2. Add plan comparison table
3. Create plan selection UI with customization
4. Add billing cycle selector (Monthly/Quarterly/Annual)
5. Add add-ons selector
6. Integrate Razorpay checkout
7. Handle payment success/failure
8. Show subscription confirmation
9. Redirect to dashboard with active subscription

## 📋 API Endpoints Needed

```
GET  /api/rate-plans/public          - List all public plans
GET  /api/rate-plans/:id              - Get plan details
POST /api/subscriptions/create-with-payment  - Create subscription + payment
POST /api/payments/verify-razorpay    - Verify Razorpay payment
GET  /api/subscriptions/my-subscription - Get user's subscription
```

## 🎯 User Flow

```
1. User logs in/registers
2. Redirected to Plans page
3. Views all available plans
4. Selects a plan
5. Chooses billing cycle (Monthly/Quarterly/Annual)
6. Optionally adds extra TFNs/Extensions
7. Reviews total cost
8. Proceeds to payment (Razorpay)
9. Completes payment
10. Subscription activated
11. Redirected to Dashboard with active plan
```

## 💾 Files Modified/Created

### Backend
- ✅ `migrations/20241001000015-update-rate-plans-structure.js`
- ✅ `seeders/20241001000003-subscription-plans.js`
- ⏳ `services/paymentService.js` (next)
- ⏳ `controllers/subscriptionController.js` (update needed)
- ⏳ `routes/subscriptions.js` (update needed)

### Frontend (Coming Next)
- ⏳ `pages/PlansPage.jsx`
- ⏳ `components/plans/PlanCard.jsx`
- ⏳ `components/plans/PlanComparison.jsx`
- ⏳ `components/payment/RazorpayCheckout.jsx`
- ⏳ `api/planService.js`
- ⏳ `api/subscriptionService.js`

---

**Status**: Backend database and plans ready. Moving to API endpoints and payment integration next!
