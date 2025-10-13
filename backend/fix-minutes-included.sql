-- Fix the minutesIncluded field - it should be 100 for Starter plan
-- First, check what plan the user has
SELECT 
  u.email,
  s.id as subscription_id,
  rp."planName",
  rp.features->>'freeMinutes' as plan_free_minutes,
  su."minutesIncluded" as current_included,
  su."minutesUsed"
FROM subscription_usage su
JOIN subscriptions s ON s.id = su."subscriptionId"
JOIN rate_plans rp ON rp.id = s."planId"
JOIN customers c ON c.id = s."customerId"
JOIN users u ON u.id = c."userId"
WHERE u.email = 'sahil@nexaworks.tech'
  AND su."billingPeriodStart" <= NOW()
  AND su."billingPeriodEnd" >= NOW();

-- Update to set correct free minutes based on plan
UPDATE subscription_usage su
SET 
  "minutesIncluded" = CAST(rp.features->>'freeMinutes' AS INTEGER),
  "updatedAt" = NOW()
FROM subscriptions s
JOIN rate_plans rp ON rp.id = s."planId"
JOIN customers c ON c.id = s."customerId"
JOIN users u ON u.id = c."userId"
WHERE su."subscriptionId" = s.id
  AND u.email = 'sahil@nexaworks.tech'
  AND su."billingPeriodStart" <= NOW()
  AND su."billingPeriodEnd" >= NOW();

-- Verify the fix
SELECT 
  u.email,
  rp."planName",
  su."minutesIncluded",
  su."minutesUsed",
  su."minutesIncluded" - su."minutesUsed" as "remainingMinutes",
  ROUND((su."minutesUsed"::numeric / NULLIF(su."minutesIncluded", 0) * 100), 1) as "percentageUsed"
FROM subscription_usage su
JOIN subscriptions s ON s.id = su."subscriptionId"
JOIN rate_plans rp ON rp.id = s."planId"
JOIN customers c ON c.id = s."customerId"
JOIN users u ON u.id = c."userId"
WHERE u.email = 'sahil@nexaworks.tech'
  AND su."billingPeriodStart" <= NOW()
  AND su."billingPeriodEnd" >= NOW();
