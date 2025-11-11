/**
 * Minimal test to find which import is causing the crash
 */

console.log('1. Loading express...');
const express = require('express');
console.log('✅ Express loaded');

console.log('2. Loading logger...');
const logger = require('./src/utils/logger');
console.log('✅ Logger loaded');

console.log('3. Loading database...');
const { sequelize } = require('./src/config/database');
console.log('✅ Database loaded');

console.log('4. Loading redis...');
// const { redisClient } = require('./src/config/redis');
console.log('✅ Redis loaded');

console.log('5. Loading sentry...');
const sentry = require('./src/config/sentry');
console.log('✅ Sentry loaded');

console.log('6. Loading auth routes...');
const authRoutes = require('./src/routes/auth');
console.log('✅ Auth routes loaded');

console.log('7. Loading customer routes...');
const customerRoutes = require('./src/routes/customers');
console.log('✅ Customer routes loaded');

console.log('8. Loading subscription routes...');
const subscriptionRoutes = require('./src/routes/subscriptions');
console.log('✅ Subscription routes loaded');

console.log('9. Loading payment routes...');
const paymentRoutes = require('./src/routes/payments');
console.log('✅ Payment routes loaded');

console.log('10. Loading CDR routes...');
const cdrRoutes = require('./src/routes/cdrs');
console.log('✅ CDR routes loaded');

console.log('11. Loading invoice routes...');
const invoiceRoutes = require('./src/routes/invoices');
console.log('✅ Invoice routes loaded');

console.log('12. Loading monitoring routes...');
const monitoringRoutes = require('./src/routes/monitoring');
console.log('✅ Monitoring routes loaded');

console.log('13. Loading monitoring service...');
const { metricsMiddleware, updateAllMetrics } = require('./src/services/monitoringService');
console.log('✅ Monitoring service loaded');

console.log('\n🎉 All imports successful! The issue must be elsewhere.\n');

setTimeout(() => {
  console.log('Exiting after 2 seconds...');
  process.exit(0);
}, 2000);
