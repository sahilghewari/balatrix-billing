-- Update rate plans with correct included minutes based on your pricing structure

-- Starter Plan: ₹349/month, 100 free minutes
UPDATE rate_plans
SET 
  name = 'Starter',
  "monthlyPrice" = 349.00,
  "includedMinutes" = 100,
  "includedDIDs" = 1,
  description = 'Perfect for small businesses starting with VoIP. Includes 1 toll-free number, 2 extensions, and 100 free minutes.',
  "updatedAt" = NOW()
WHERE "monthlyPrice" = 349.00 OR name ILIKE '%starter%';

-- Professional Plan: ₹999/month, 500 free minutes
UPDATE rate_plans
SET 
  name = 'Professional',
  "monthlyPrice" = 999.00,
  "includedMinutes" = 500,
  "includedDIDs" = 2,
  description = 'Ideal for growing teams with higher call volumes. Includes 2 toll-free numbers, 10 extensions, and 500 free minutes.',
  "updatedAt" = NOW()
WHERE "monthlyPrice" = 999.00 OR name ILIKE '%professional%';

-- Call Center Plan: ₹4999/month, 1500 free minutes
UPDATE rate_plans
SET 
  name = 'Call Center',
  "monthlyPrice" = 4999.00,
  "includedMinutes" = 1500,
  "includedDIDs" = 5,
  description = 'Enterprise solution for high-volume call centers. Includes 5 toll-free numbers, 50 extensions, and 1500 free minutes.',
  "updatedAt" = NOW()
WHERE "monthlyPrice" = 4999.00 OR name ILIKE '%call%center%' OR name ILIKE '%enterprise%';

-- If Call Center plan doesn't exist, create it
INSERT INTO rate_plans (
  id,
  name,
  description,
  "planType",
  "monthlyPrice",
  "annualPrice",
  "setupFee",
  "includedMinutes",
  "includedDIDs",
  "maxConcurrentCalls",
  "isActive",
  "createdAt",
  "updatedAt"
)
SELECT
  gen_random_uuid(),
  'Call Center',
  'Enterprise solution for high-volume call centers. Includes 5 toll-free numbers, 50 extensions, and 1500 free minutes.',
  'postpaid',
  4999.00,
  47990.40, -- 20% discount on annual: 4999 * 12 * 0.8
  0,
  1500,
  5,
  50,
  true,
  NOW(),
  NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM rate_plans WHERE name = 'Call Center'
);

-- Verify the updates
SELECT 
  name as "planName",
  "monthlyPrice",
  "annualPrice",
  "includedMinutes" as "freeMinutes",
  "includedDIDs" as "tollFreeNumbers",
  description
FROM rate_plans
WHERE "isActive" = true
ORDER BY "monthlyPrice";
