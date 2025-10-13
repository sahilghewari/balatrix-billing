-- First, let's see all active plans
SELECT id, name, "monthlyPrice", "includedMinutes", "includedDIDs" 
FROM rate_plans 
WHERE "isActive" = true
ORDER BY "monthlyPrice";

-- Update specific plans by ID to set correct included minutes
-- Starter Plan (₹349) - 100 minutes
UPDATE rate_plans
SET 
  "includedMinutes" = 100,
  "includedDIDs" = 1,
  "updatedAt" = NOW()
WHERE "monthlyPrice" = 349.00 
  AND "isActive" = true;

-- Professional Plan (₹999) - 500 minutes  
UPDATE rate_plans
SET 
  "includedMinutes" = 500,
  "includedDIDs" = 2,
  "updatedAt" = NOW()
WHERE "monthlyPrice" = 999.00 
  AND "isActive" = true;

-- Call Center Plan (₹4999) - 1500 minutes
UPDATE rate_plans
SET 
  "includedMinutes" = 1500,
  "includedDIDs" = 5,
  "updatedAt" = NOW()
WHERE "monthlyPrice" = 4999.00 
  AND "isActive" = true;

-- Now fix the existing subscriptions
UPDATE subscription_usage su
SET 
  "minutesIncluded" = rp."includedMinutes",
  "updatedAt" = NOW()
FROM subscriptions s
JOIN rate_plans rp ON rp.id = s."planId"
WHERE su."subscriptionId" = s.id
  AND s.status = 'active'
  AND su."billingPeriodStart" <= NOW()
  AND su."billingPeriodEnd" >= NOW();

-- Verify the updates
SELECT 
  rp.name as "planName",
  rp."monthlyPrice",
  rp."includedMinutes" as "planFreeMinutes",
  su."minutesIncluded" as "usageFreeMinutes",
  su."minutesUsed",
  rp."includedDIDs" as "tollFreeNumbers"
FROM rate_plans rp
LEFT JOIN subscriptions s ON s."planId" = rp.id AND s.status = 'active'
LEFT JOIN subscription_usage su ON su."subscriptionId" = s.id 
  AND su."billingPeriodStart" <= NOW() 
  AND su."billingPeriodEnd" >= NOW()
WHERE rp."isActive" = true
ORDER BY rp."monthlyPrice";
