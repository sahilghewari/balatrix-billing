-- Directly set minutesIncluded to 100 for Starter plan users
UPDATE subscription_usage su
SET 
  "minutesIncluded" = 100,
  "updatedAt" = NOW()
FROM subscriptions s
JOIN customers c ON c.id = s."customerId"
JOIN users u ON u.id = c."userId"
WHERE su."subscriptionId" = s.id
  AND u.email = 'sahil@nexaworks.tech'
  AND su."billingPeriodStart" <= NOW()
  AND su."billingPeriodEnd" >= NOW();

-- Verify the fix
SELECT 
  'Success! Updated minutesIncluded to 100' as message,
  u.email,
  su."minutesIncluded",
  su."minutesUsed",
  su."minutesIncluded" - su."minutesUsed" as "remainingMinutes",
  ROUND((su."minutesUsed"::numeric / NULLIF(su."minutesIncluded", 0) * 100), 1) as "percentageUsed",
  su."localCalls" + su."mobileCalls" + su."stdCalls" + su."isdCalls" as "totalCalls"
FROM subscription_usage su
JOIN subscriptions s ON s.id = su."subscriptionId"
JOIN customers c ON c.id = s."customerId"
JOIN users u ON u.id = c."userId"
WHERE u.email = 'sahil@nexaworks.tech'
  AND su."billingPeriodStart" <= NOW()
  AND su."billingPeriodEnd" >= NOW();
