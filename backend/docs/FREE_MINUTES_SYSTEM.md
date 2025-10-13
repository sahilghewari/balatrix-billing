# Free Minutes & Per-Minute Charging System

## Overview
Each subscription plan includes free minutes. After these minutes are exhausted, users are charged per minute based on their plan's rate.

## Plan Structure

### Starter Plan (₹349/month)
- **Free Minutes**: 100 minutes/month
- **Per-Minute Charge**: ₹1.99 (after free minutes)
- **Toll-Free Numbers**: 1
- **Extensions**: 2

### Professional Plan (₹999/month)
- **Free Minutes**: 500 minutes/month  
- **Per-Minute Charge**: ₹1.60 (after free minutes)
- **Toll-Free Numbers**: 2
- **Extensions**: 10

### Call Center Plan (₹4,999/month)
- **Free Minutes**: 1,500 minutes/month
- **Per-Minute Charge**: ₹1.45 (after free minutes)
- **Toll-Free Numbers**: 5
- **Extensions**: 50

## How It Works

### 1. Subscription Activation
When a subscription is activated:
```javascript
// SubscriptionUsage record is created with:
{
  includedMinutes: 100,        // Free minutes from plan
  totalMinutesUsed: 0,          // Initially 0
  overageMinutes: 0,            // Initially 0
  overageCharges: 0.0,          // Initially 0
  perMinuteRate: 1.99,          // From plan features
  periodStart: '2025-10-01',    // Billing cycle start
  periodEnd: '2025-10-31'       // Billing cycle end
}
```

### 2. CDR Processing (Call Detail Records)
When a call is made:
```javascript
// CDR is created with call details
{
  duration: 120,              // Call duration in seconds
  durationMinutes: 2,         // Converted to minutes
  callType: 'inbound',
  status: 'completed'
}

// SubscriptionUsage is updated:
totalMinutesUsed += 2        // Add call minutes
```

### 3. Overage Calculation
The system automatically calculates overages:

```javascript
// If totalMinutesUsed <= includedMinutes
overageMinutes = 0
overageCharges = 0

// If totalMinutesUsed > includedMinutes
overageMinutes = totalMinutesUsed - includedMinutes
overageCharges = overageMinutes * perMinuteRate
```

**Example:**
- Plan: Starter (100 free minutes, ₹1.99/min after)
- Usage: 150 minutes
- Calculation:
  - Free: 100 minutes (₹0)
  - Overage: 50 minutes × ₹1.99 = ₹99.50
  - **Total Overage Charge: ₹99.50**

### 4. Billing Cycle

#### Monthly Reset
At the start of each billing cycle:
1. Current usage is finalized
2. Invoice is generated for:
   - Base subscription fee
   - Overage charges (if any)
3. New SubscriptionUsage record is created with fresh free minutes

#### Invoice Example
```
Subscription: Starter Plan (Monthly)
Base Fee: ₹349.00

Usage Details:
- Included Minutes: 100
- Minutes Used: 150
- Overage Minutes: 50
- Overage Charges: ₹99.50

Subtotal: ₹448.50
GST (18%): ₹80.73
Total: ₹529.23
```

## Implementation Components

### 1. SubscriptionUsage Model
Tracks usage per billing period:
```javascript
{
  subscriptionId: UUID,
  periodStart: DATE,
  periodEnd: DATE,
  includedMinutes: INTEGER,      // Free minutes
  totalMinutesUsed: INTEGER,      // Actual usage
  overageMinutes: INTEGER,        // Usage beyond free
  overageCharges: DECIMAL,        // Cost of overage
  perMinuteRate: DECIMAL,         // From plan
  isFinalized: BOOLEAN            // Locked at period end
}
```

### 2. CDR Processing Service
When calls are made:
```javascript
async processCDR(cdr) {
  // 1. Find active subscription
  const subscription = await Subscription.findOne({
    where: { accountId: cdr.accountId, status: 'active' }
  });

  // 2. Get current usage period
  const usage = await SubscriptionUsage.findOne({
    where: {
      subscriptionId: subscription.id,
      periodStart: { [Op.lte]: new Date() },
      periodEnd: { [Op.gte]: new Date() }
    }
  });

  // 3. Add minutes to usage
  const durationMinutes = Math.ceil(cdr.duration / 60);
  await usage.addMinutesUsage(durationMinutes, usage.metadata.perMinuteRate);
  
  // 4. Update CDR with charges
  await cdr.update({
    cost: calculateCallCost(durationMinutes, usage)
  });
}
```

### 3. Billing Service
At billing cycle end:
```javascript
async finalizeBillingPeriod(subscriptionId) {
  const usage = await SubscriptionUsage.findOne({
    where: {
      subscriptionId,
      isFinalized: false
    }
  });

  // Calculate total charges
  usage.totalCharges = usage.overageCharges + 
                       usage.tollFreeNumbersCharges + 
                       usage.extensionsCharges;
  
  usage.isFinalized = true;
  usage.finalizedAt = new Date();
  await usage.save();

  // Generate invoice
  await Invoice.create({
    subscriptionId,
    amount: subscription.billingAmount + usage.totalCharges,
    items: [
      { description: 'Base Subscription', amount: subscription.billingAmount },
      { description: `Overage (${usage.overageMinutes} mins)`, amount: usage.overageCharges }
    ]
  });

  // Create new usage period
  await SubscriptionUsage.create({
    subscriptionId,
    periodStart: nextPeriodStart,
    periodEnd: nextPeriodEnd,
    includedMinutes: plan.freeMinutes,
    // ... reset all counters
  });
}
```

## API Endpoints

### Get Current Usage
```
GET /api/subscriptions/:id/usage
```
Response:
```json
{
  "subscription": {
    "planName": "Starter",
    "billingCycle": "monthly"
  },
  "currentPeriod": {
    "start": "2025-10-01",
    "end": "2025-10-31"
  },
  "usage": {
    "includedMinutes": 100,
    "usedMinutes": 45,
    "remainingMinutes": 55,
    "overageMinutes": 0,
    "overageCharges": 0.00,
    "perMinuteRate": 1.99
  }
}
```

### Get Usage History
```
GET /api/subscriptions/:id/usage/history
```
Returns past billing periods with usage details.

## Dashboard Display

### Usage Widget
```
┌─────────────────────────────────────┐
│ Minutes Usage (Oct 2025)            │
├─────────────────────────────────────┤
│ [████████░░] 45 / 100 minutes used  │
│                                      │
│ Remaining: 55 minutes               │
│ Overage: ₹0.00                      │
│ Per-minute rate: ₹1.99              │
└─────────────────────────────────────┘
```

### Overage Alert
```
┌─────────────────────────────────────┐
│ ⚠️ Usage Alert                      │
├─────────────────────────────────────┤
│ You've used 95% of your included    │
│ minutes. Additional usage will be   │
│ charged at ₹1.99/min.               │
└─────────────────────────────────────┘
```

## Next Steps

1. **CDR Processing** - Process call records and update usage
2. **Usage API Endpoints** - Create endpoints to fetch usage data
3. **Dashboard** - Display real-time usage statistics
4. **Billing Automation** - Auto-generate invoices at period end
5. **Alerts** - Notify users when approaching limits

## Files to Implement

### Backend
- ✅ `models/SubscriptionUsage.js` - Already exists
- ✅ `services/subscriptionService.js` - Usage initialization added
- 🔨 `services/cdrProcessorService.js` - Process CDRs and update usage
- 🔨 `services/billingService.js` - Finalize periods and generate invoices
- 🔨 `controllers/usageController.js` - Usage API endpoints
- 🔨 `routes/usage.js` - Usage routes

### Frontend
- 🔨 `components/dashboard/UsageWidget.jsx` - Display current usage
- 🔨 `components/dashboard/UsageChart.jsx` - Visual usage chart
- 🔨 `pages/UsagePage.jsx` - Detailed usage history
- 🔨 `api/usageService.js` - Usage API calls

Would you like me to implement any of these components?
