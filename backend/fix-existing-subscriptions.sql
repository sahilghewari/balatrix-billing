-- Fix existing subscriptions to have correct free minutes based on their plan
UPDATE subscription_usage su
SET 
  "minutesIncluded" = COALESCE(rp."includedMinutes", 
    CASE
      WHEN rp."monthlyPrice" <= 500 THEN 100
      WHEN rp."monthlyPrice" <= 1500 THEN 500
      ELSE 1500
    END
  ),
  metadata = jsonb_set(
    COALESCE(su.metadata, '{}'::jsonb),
    '{perMinuteRate}',
    to_jsonb(
      CASE
        WHEN rp."monthlyPrice" <= 500 THEN 1.99
        WHEN rp."monthlyPrice" <= 1500 THEN 1.60
        ELSE 1.45
      END
    )
  ),
  "updatedAt" = NOW()
FROM subscriptions s
JOIN rate_plans rp ON rp.id = s."planId"
WHERE su."subscriptionId" = s.id
  AND s.status = 'active'
  AND su."billingPeriodStart" <= NOW()
  AND su."billingPeriodEnd" >= NOW();

-- Verify the update
SELECT 
  u.email,
  s.id as subscription_id,
  rp.name as "planName",
  rp."monthlyPrice",
  rp."includedMinutes" as "planIncludedMinutes",
  su."minutesIncluded" as "usageIncludedMinutes",
  su."minutesUsed",
  su."minutesIncluded" - su."minutesUsed" as "remainingMinutes",
  ROUND((su."minutesUsed"::numeric / NULLIF(su."minutesIncluded", 0) * 100), 1) as "percentageUsed",
  su.metadata->>'perMinuteRate' as "perMinuteRate"
FROM subscription_usage su
JOIN subscriptions s ON s.id = su."subscriptionId"
JOIN rate_plans rp ON rp.id = s."planId"
JOIN customers c ON c.id = s."customerId"
JOIN users u ON u.id = c."userId"
WHERE s.status = 'active'
  AND su."billingPeriodStart" <= NOW()
  AND su."billingPeriodEnd" >= NOW()
ORDER BY u.email, s."createdAt";
