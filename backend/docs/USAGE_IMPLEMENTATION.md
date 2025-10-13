# Usage Tracking Implementation - Summary

## ✅ Completed Implementation

### Backend Components

#### 1. **Usage Service** (`backend/src/services/usageService.js`)
Complete service for handling usage data:
- `getCurrentUsage()` - Fetches current billing period usage
- `getUsageHistory()` - Returns paginated historical usage
- `getUsageSummary()` - Aggregated lifetime statistics
- Calculates remaining minutes, overage, and utilization percentage
- Validates user access to subscription data

#### 2. **Usage Controller** (`backend/src/controllers/usageController.js`)
HTTP request handlers:
- `GET /api/subscriptions/:id/usage` - Current usage
- `GET /api/subscriptions/:id/usage/history` - Historical data
- `GET /api/subscriptions/:id/usage/summary` - Aggregated stats

#### 3. **Subscription Service Updates**
- Added `SubscriptionUsage` initialization on subscription activation
- Sets up:
  - `includedMinutes` from plan (100, 500, or 1500)
  - `perMinuteRate` (₹1.99, ₹1.60, or ₹1.45)
  - Billing period dates
  - Resource limits (toll-free numbers, extensions)

#### 4. **Updated Subscription Controller**
- Modified `getSubscriptionUsage()` to use new usageService
- Integrated with authentication

### Frontend Components

#### 1. **Usage API Service** (`frontend/src/api/usageService.js`)
API client for usage endpoints:
```javascript
usageService.getCurrentUsage(subscriptionId)
usageService.getUsageHistory(subscriptionId, page, limit)
usageService.getUsageSummary(subscriptionId)
```

#### 2. **UsageWidget Component** (`frontend/src/components/dashboard/UsageWidget.jsx`)
Beautiful, feature-rich usage display:
- **Real-time usage tracking**
  - Minutes used vs. included
  - Visual progress bar
  - Utilization percentage
  - Remaining minutes

- **Smart alerts**
  - ⚠️ Yellow warning at 80% usage
  - 🔴 Red alert for overage
  - Shows overage charges calculation

- **Call statistics**
  - Total calls
  - Successful calls
  - Failed calls

- **Billing period info**
  - Days remaining
  - Current period dates
  - Per-minute rate display

#### 3. **Dashboard Integration**
- Added `UsageWidget` to `DashboardPage.jsx`
- Displays prominently after subscription overview
- Only shows when user has active subscription

## 📊 Data Flow

### 1. Subscription Activation
```
User Subscribes
    ↓
Payment Verified
    ↓
Subscription Activated
    ↓
SubscriptionUsage Created {
  includedMinutes: 100 (from plan)
  totalMinutesUsed: 0
  overageMinutes: 0
  perMinuteRate: 1.99
  periodStart: 2025-10-01
  periodEnd: 2025-10-31
}
```

### 2. Real-Time Usage Display
```
Dashboard Loads
    ↓
UsageWidget Fetches Data
    ↓
GET /api/subscriptions/:id/usage
    ↓
usageService.getCurrentUsage()
    ↓
Calculate remaining minutes
Calculate utilization %
Calculate overage charges
    ↓
Display in Widget
```

### 3. CDR Processing (To Be Implemented)
```
Call Made
    ↓
CDR Created
    ↓
cdrProcessorService.processCDR()
    ↓
Find SubscriptionUsage
    ↓
Update totalMinutesUsed += callDuration
    ↓
If totalMinutesUsed > includedMinutes:
  overageMinutes = totalMinutesUsed - includedMinutes
  overageCharges = overageMinutes × perMinuteRate
    ↓
Save SubscriptionUsage
    ↓
Widget auto-refreshes
```

## 🎨 UI Features

### Usage Progress Bar
- **Blue**: Normal usage (0-79%)
- **Yellow**: Approaching limit (80-99%)
- **Red**: Overage (100%+)

### Alert System
1. **Near Limit Warning** (≥80% usage)
   ```
   ┌──────────────────────────────────┐
   │ ⚠️ Approaching Limit              │
   │ You've used 95% of your included │
   │ minutes. Additional usage will   │
   │ be charged at ₹1.99/min.         │
   └──────────────────────────────────┘
   ```

2. **Overage Alert** (>100% usage)
   ```
   ┌──────────────────────────────────┐
   │ 🔴 Overage Usage                  │
   │ You've used 50 extra minutes.    │
   │ Additional charges: ₹99.50       │
   │ at ₹1.99/min                     │
   └──────────────────────────────────┘
   ```

### Call Statistics Display
```
┌───────────────────────────────────────┐
│  📞         ✅         ❌            │
│  150       148        2              │
│  Total     Successful Failed         │
└───────────────────────────────────────┘
```

## 📝 API Response Examples

### GET /api/subscriptions/:id/usage
```json
{
  "success": true,
  "data": {
    "subscription": {
      "id": "uuid",
      "planName": "Starter",
      "billingCycle": "monthly",
      "status": "active"
    },
    "currentPeriod": {
      "start": "2025-10-01",
      "end": "2025-10-31",
      "daysRemaining": 19
    },
    "usage": {
      "includedMinutes": 100,
      "usedMinutes": 45,
      "remainingMinutes": 55,
      "overageMinutes": 0,
      "overageCharges": 0.00,
      "perMinuteRate": 1.99,
      "utilizationPercentage": "45.00"
    },
    "calls": {
      "total": 28,
      "successful": 26,
      "failed": 2
    },
    "resources": {
      "tollFreeNumbers": {
        "included": 1,
        "used": 1,
        "overage": 0,
        "charges": 0.00
      },
      "extensions": {
        "included": 2,
        "used": 2,
        "overage": 0,
        "charges": 0.00
      }
    },
    "totalCharges": 0.00
  }
}
```

## 🔧 Next Steps

### High Priority
1. **CDR Processing** - Update `cdrProcessorService.js`
   - Process call records
   - Update `SubscriptionUsage.totalMinutesUsed`
   - Calculate costs in real-time
   - Link CDRs to subscriptions

2. **Auto-refresh** - Add periodic refresh to UsageWidget
   - Poll every 30 seconds when active
   - WebSocket for real-time updates (future)

### Medium Priority
3. **Usage Chart** - Create visual chart component
   - Line chart for daily usage
   - Bar chart for monthly comparison
   - Trend analysis

4. **Billing Integration**
   - Finalize usage at period end
   - Generate invoices with overage charges
   - Reset usage for new period
   - Send usage reports via email

### Low Priority
5. **Usage Alerts** - Notification system
   - Email at 80% usage
   - Email at 100% usage
   - SMS alerts (optional)

6. **Usage API Improvements**
   - Export usage data (CSV/PDF)
   - Custom date range queries
   - Usage analytics & insights

## 🚀 How to Test

### 1. Start Backend
```bash
cd backend
npm run dev
```

### 2. Start Frontend
```bash
cd frontend
npm run dev
```

### 3. Test Flow
1. Login to dashboard
2. Subscribe to a plan (if not already subscribed)
3. View Dashboard
4. **UsageWidget should display:**
   - 0 minutes used (initial state)
   - 100/500/1500 included minutes (based on plan)
   - 0% utilization
   - 0 calls

### 4. Simulate Usage (Manual Database Update)
```sql
-- Update usage for testing
UPDATE subscription_usage
SET 
  "totalMinutesUsed" = 85,
  "overageMinutes" = 0,
  "totalCalls" = 42,
  "successfulCalls" = 40,
  "failedCalls" = 2
WHERE "subscriptionId" = 'your-subscription-id';

-- Refresh dashboard to see 85% usage with yellow warning
```

### 5. Simulate Overage
```sql
UPDATE subscription_usage
SET 
  "totalMinutesUsed" = 150,
  "overageMinutes" = 50,
  "overageCharges" = 99.50,
  "totalCalls" = 75,
  "successfulCalls" = 73,
  "failedCalls" = 2
WHERE "subscriptionId" = 'your-subscription-id';

-- Refresh to see red overage alert with charges
```

## 📂 Files Created/Modified

### Backend
- ✅ `src/services/usageService.js` (NEW)
- ✅ `src/controllers/usageController.js` (NEW)
- ✅ `src/routes/usage.js` (NEW)
- ✅ `src/services/subscriptionService.js` (MODIFIED)
- ✅ `src/controllers/subscriptionController.js` (MODIFIED)

### Frontend
- ✅ `src/api/usageService.js` (NEW)
- ✅ `src/components/dashboard/UsageWidget.jsx` (NEW)
- ✅ `src/pages/DashboardPage.jsx` (MODIFIED)

### Documentation
- ✅ `docs/FREE_MINUTES_SYSTEM.md` (NEW)
- ✅ `docs/USAGE_IMPLEMENTATION.md` (THIS FILE)

## 🎯 Success Metrics

### What Works Now
✅ Subscription creates SubscriptionUsage record
✅ Dashboard displays usage widget
✅ Real-time usage data fetch from API
✅ Visual progress bar with color coding
✅ Alert system for limits and overage
✅ Call statistics display
✅ Responsive design

### What Needs CDR Processing
⏳ Real usage tracking (currently manual)
⏳ Automatic minute deduction per call
⏳ Real-time overage calculation
⏳ Per-call cost tracking

The foundation is complete! Once CDR processing is implemented, the entire free minutes and per-minute charging system will be fully automated.
