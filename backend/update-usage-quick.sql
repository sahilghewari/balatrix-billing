UPDATE subscription_usage su
SET
  "minutesUsed" = 48,
  "localCalls" = 10,
  "mobileCalls" = 10,
  "stdCalls" = 3,
  "isdCalls" = 2,
  "updatedAt" = NOW()
FROM subscriptions s
JOIN customers c ON c.id = s."customerId"
JOIN users u ON u.id = c."userId"
WHERE su."subscriptionId" = s.id
  AND u.email = 'sahil@nexaworks.tech'
  AND su."billingPeriodStart" <= NOW()
  AND su."billingPeriodEnd" >= NOW();

SELECT 
  'Success! Updated usage to 48 minutes' as message,
  su."minutesUsed",
  su."localCalls",
  su."mobileCalls",
  su."stdCalls",
  su."isdCalls",
  su."localCalls" + su."mobileCalls" + su."stdCalls" + su."isdCalls" as "totalCalls"
FROM subscription_usage su
JOIN subscriptions s ON s.id = su."subscriptionId"
JOIN customers c ON c.id = s."customerId"
JOIN users u ON u.id = c."userId"
WHERE u.email = 'sahil@nexaworks.tech'
  AND su."billingPeriodStart" <= NOW()
  AND su."billingPeriodEnd" >= NOW();
