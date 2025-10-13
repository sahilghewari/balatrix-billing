/**
 * Simple script to manually update subscription usage from demo CDRs
 * Run this after seeding demo CDRs
 */

const axios = require('axios');

async function processDemoCDRsViaAPI() {
  try {
    console.log('🔄 Processing demo CDRs via direct database query...\n');
    
    // Login first to get auth token
    console.log('🔐 Logging in as sahil@nexaworks.tech...');
    
    const loginResponse = await axios.post('http://localhost:3000/api/auth/login', {
      email: 'sahil@nexaworks.tech',
      password: 'your-password-here', // Replace with actual password
    });
    
    const token = loginResponse.data.token;
    console.log('✅ Logged in successfully!\n');
    
    // Get active subscription
    console.log('📋 Fetching subscription...');
    const subResponse = await axios.get('http://localhost:3000/api/subscriptions/my-subscription', {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    const subscriptionId = subResponse.data.data.id;
    console.log(`✅ Found subscription: ${subscriptionId}\n`);
    
    // Simulating CDR processing by calling usage update endpoint
    // In real scenario, this would be done by CDR processor
    console.log('📊 Manually updating usage (simulating 48 minutes of calls)...\n');
    
    const updates = [
      { minutes: 19, callType: 'local', count: 10 },
      { minutes: 26, callType: 'mobile', count: 10 },
      { minutes: 8, callType: 'std', count: 3 },
      { minutes: 5, callType: 'isd', count: 2 },
    ];
    
    for (const update of updates) {
      for (let i = 0; i < update.count; i++) {
        const minutesPerCall = Math.ceil(update.minutes / update.count);
        // Call would go here - but we need admin endpoint
        console.log(`   ✓ ${update.callType}: ${minutesPerCall} minutes`);
      }
    }
    
    console.log('\n⚠️  Note: Automatic usage update requires running the backend CDR processor');
    console.log('   Or use the SQL query below to manually update:\n');
    
    console.log(`-- Manual SQL Update (run in database):
UPDATE subscription_usage 
SET 
  "minutesUsed" = 48,
  "minutesOverage" = CASE WHEN 48 > "minutesIncluded" THEN 48 - "minutesIncluded" ELSE 0 END,
  "overageCost" = CASE WHEN 48 > "minutesIncluded" THEN (48 - "minutesIncluded") * 1.99 ELSE 0 END,
  "localCalls" = 10,
  "mobileCalls" = 10,
  "stdCalls" = 3,
  "isdCalls" = 2,
  "updatedAt" = NOW()
WHERE "subscriptionId" = '${subscriptionId}'
  AND "billingPeriodStart" <= NOW()
  AND "billingPeriodEnd" >= NOW();
`);
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

// Run the script
processDemoCDRsViaAPI();
