-- Check which user's subscription usage was updated
SELECT 
  u.email,
  u."firstName",
  u."lastName",
  c."companyName",
  s.id as "subscriptionId",
  s.status as "subscriptionStatus",
  su."minutesUsed",
  su."minutesIncluded",
  su."localCalls",
  su."mobileCalls",
  su."stdCalls",
  su."isdCalls",
  su."billingPeriodStart",
  su."billingPeriodEnd"
FROM subscription_usage su
JOIN subscriptions s ON s.id = su."subscriptionId"
JOIN customers c ON c.id = s."customerId"
JOIN users u ON u.id = c."userId"
WHERE su."minutesUsed" = 48
  AND su."billingPeriodStart" <= NOW()
  AND su."billingPeriodEnd" >= NOW()
ORDER BY su."updatedAt" DESC;
