-- Update ALL ₹349 plans to have 100 minutes
UPDATE rate_plans 
SET "includedMinutes" = 100, "includedDIDs" = 1 
WHERE "monthlyPrice" = 349.00;

-- Update ALL ₹999 plans to have 500 minutes
UPDATE rate_plans 
SET "includedMinutes" = 500, "includedDIDs" = 2 
WHERE "monthlyPrice" = 999.00;

-- Update ALL ₹4999 plans to have 1500 minutes
UPDATE rate_plans 
SET "includedMinutes" = 1500, "includedDIDs" = 5 
WHERE "monthlyPrice" = 4999.00;

-- Update existing subscriptions to match their plan's included minutes
UPDATE subscription_usage su
SET "minutesIncluded" = rp."includedMinutes"
FROM subscriptions s
JOIN rate_plans rp ON rp.id = s."planId"
WHERE su."subscriptionId" = s.id 
  AND s.status = 'active';

-- Show results
SELECT 
  'SUCCESS!' as status,
  COUNT(*) as plans_updated
FROM rate_plans 
WHERE "monthlyPrice" IN (349.00, 999.00, 4999.00);
