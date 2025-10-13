-- Manual SQL script to update subscription usage from demo CDRs
-- Run this in your PostgreSQL database after seeding demo CDRs

-- First, let's see the current subscription usage
SELECT 
  su.id,
  s."customerId",
  su."subscriptionId",
  su."minutesIncluded",
  su."minutesUsed",
  su."minutesOverage",
  su."overageCost",
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
WHERE u.email = 'sahil@nexaworks.tech'
  AND su."billingPeriodStart" <= NOW()
  AND su."billingPeriodEnd" >= NOW();

-- Update the usage based on demo CDRs (48 total minutes)
-- Local: 10 calls, 19 minutes
-- Mobile: 10 calls, 26 minutes  
-- STD: 3 calls, 8 minutes
-- ISD: 2 calls, 5 minutes
-- Total: 25 calls, 48 minutes

UPDATE subscription_usage su
SET 
  "minutesUsed" = 48,
  "minutesOverage" = CASE 
    WHEN 48 > su."minutesIncluded" THEN 48 - su."minutesIncluded" 
    ELSE 0 
  END,
  "overageCost" = CASE 
    WHEN 48 > su."minutesIncluded" 
    THEN (48 - su."minutesIncluded") * CAST((su.metadata->>'perMinuteRate')::numeric AS DECIMAL(10,2))
    ELSE 0 
  END,
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

-- Verify the update
SELECT 
  su.id,
  su."subscriptionId",
  su."minutesIncluded",
  su."minutesUsed",
  su."minutesOverage",
  su."overageCost",
  su."localCalls" + su."mobileCalls" + su."stdCalls" + su."isdCalls" as "totalCalls",
  su."localCalls",
  su."mobileCalls",
  su."stdCalls",
  su."isdCalls",
  ROUND((su."minutesUsed"::numeric / NULLIF(su."minutesIncluded", 0) * 100), 2) as "percentageUsed"
FROM subscription_usage su
JOIN subscriptions s ON s.id = su."subscriptionId"
JOIN customers c ON c.id = s."customerId"
JOIN users u ON u.id = c."userId"
WHERE u.email = 'sahil@nexaworks.tech'
  AND su."billingPeriodStart" <= NOW()
  AND su."billingPeriodEnd" >= NOW();
