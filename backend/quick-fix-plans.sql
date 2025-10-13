UPDATE rate_plans SET "includedMinutes" = 100, "includedDIDs" = 1 WHERE "monthlyPrice" = 349.00;
UPDATE rate_plans SET "includedMinutes" = 500, "includedDIDs" = 2 WHERE "monthlyPrice" = 999.00;
UPDATE rate_plans SET "includedMinutes" = 1500, "includedDIDs" = 5 WHERE "monthlyPrice" = 4999.00;

UPDATE subscription_usage su
SET "minutesIncluded" = rp."includedMinutes"
FROM subscriptions s
JOIN rate_plans rp ON rp.id = s."planId"
WHERE su."subscriptionId" = s.id AND s.status = 'active';

SELECT 'Plans and subscriptions updated successfully!' as result;
