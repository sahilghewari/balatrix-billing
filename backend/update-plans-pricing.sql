-- Update Rate Plans with Correct Pricing and Free Minutes
-- Based on your pricing structure

-- First, let's see current plans
SELECT id, "planName", "basePrice", "billingCycle", features, limits
FROM rate_plans
ORDER BY "basePrice";

-- Update Starter Plan (Monthly)
UPDATE rate_plans
SET
  "planName" = 'Starter',
  "basePrice" = 349.00,
  "billingCycle" = 'monthly',
  features = jsonb_set(
    jsonb_set(
      jsonb_set(features, '{freeMinutes}', '100'),
      '{perMinuteCharge}', '1.99'
    ),
    '{description}', '"Perfect for small businesses starting with VoIP"'
  ),
  limits = jsonb_set(
    jsonb_set(
      jsonb_set(limits, '{tollFreeNumbers}', '1'),
      '{extensions}', '2'
    ),
    '{monthlyMinuteAllowance}', '100'
  ),
  "updatedAt" = NOW()
WHERE "basePrice" = 349.00 OR "planName" ILIKE '%starter%';

-- Update Professional Plan (Monthly)
UPDATE rate_plans
SET
  "planName" = 'Professional',
  "basePrice" = 999.00,
  "billingCycle" = 'monthly',
  features = jsonb_set(
    jsonb_set(
      jsonb_set(features, '{freeMinutes}', '500'),
      '{perMinuteCharge}', '1.60'
    ),
    '{description}', '"Ideal for growing teams with higher call volumes"'
  ),
  limits = jsonb_set(
    jsonb_set(
      jsonb_set(limits, '{tollFreeNumbers}', '2'),
      '{extensions}', '10'
    ),
    '{monthlyMinuteAllowance}', '500'
  ),
  "updatedAt" = NOW()
WHERE "basePrice" = 999.00 OR "planName" ILIKE '%professional%';

-- Update Call Center Plan (Monthly)
UPDATE rate_plans
SET
  "planName" = 'Call Center',
  "basePrice" = 4999.00,
  "billingCycle" = 'monthly',
  features = jsonb_set(
    jsonb_set(
      jsonb_set(features, '{freeMinutes}', '1500'),
      '{perMinuteCharge}', '1.45'
    ),
    '{description}', '"Enterprise solution for high-volume call centers"'
  ),
  limits = jsonb_set(
    jsonb_set(
      jsonb_set(limits, '{tollFreeNumbers}', '5'),
      '{extensions}', '50'
    ),
    '{monthlyMinuteAllowance}', '1500'
  ),
  "updatedAt" = NOW()
WHERE "basePrice" = 4999.00 OR "planName" ILIKE '%call%center%' OR "planName" ILIKE '%enterprise%';

-- If Call Center plan doesn't exist, create it
INSERT INTO rate_plans (
  id,
  "planName",
  "planType",
  "basePrice",
  "billingCycle",
  currency,
  features,
  limits,
  "isActive",
  "createdAt",
  "updatedAt"
)
SELECT
  gen_random_uuid(),
  'Call Center',
  'postpaid',
  4999.00,
  'monthly',
  'INR',
  '{
    "freeMinutes": 1500,
    "perMinuteCharge": 1.45,
    "callRecording": true,
    "callForwarding": true,
    "ivr": true,
    "voicemail": true,
    "api": true,
    "analytics": "advanced",
    "support": "priority",
    "description": "Enterprise solution for high-volume call centers"
  }'::jsonb,
  '{
    "tollFreeNumbers": 5,
    "extensions": 50,
    "monthlyMinuteAllowance": 1500,
    "concurrentCalls": 50,
    "maxUsers": 50
  }'::jsonb,
  true,
  NOW(),
  NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM rate_plans WHERE "planName" = 'Call Center'
);

-- Verify the updates
SELECT 
  "planName",
  "basePrice",
  "billingCycle",
  features->>'freeMinutes' as "freeMinutes",
  features->>'perMinuteCharge' as "perMinuteRate",
  limits->>'tollFreeNumbers' as "tollFreeNumbers",
  limits->>'extensions' as "extensions",
  limits->>'monthlyMinuteAllowance' as "monthlyMinutes"
FROM rate_plans
WHERE "isActive" = true
ORDER BY "basePrice";
