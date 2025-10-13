-- Check subscription details for sahil@nexaworks.tech
SELECT 
  u.email,
  s.id as subscription_id,
  s."planId",
  s.status,
  rp.id as rate_plan_id,
  rp."planName",
  rp.features
FROM subscriptions s
JOIN customers c ON c.id = s."customerId"
JOIN users u ON u.id = c."userId"
LEFT JOIN rate_plans rp ON rp.id = s."planId"
WHERE u.email = 'sahil@nexaworks.tech'
  AND s.status = 'active';
