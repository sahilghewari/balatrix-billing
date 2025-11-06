require('dotenv').config();
const extensionService = require('./src/services/extensionService');
const { Customer, Subscription } = require('./src/models');

(async () => {
  try {
    console.log('Testing Extension Auto-Assignment...\n');

    // Find an active subscription to test with
    const subscription = await Subscription.findOne({
      where: { status: 'active' },
      include: [
        { model: require('./src/models').RatePlan, as: 'plan' },
        { model: require('./src/models').Customer, as: 'customer' }
      ],
      order: [['createdAt', 'DESC']]
    });

    if (!subscription) {
      console.log('No active subscription found to test with');
      process.exit(1);
    }

    console.log(`Testing with subscription: ${subscription.id}`);
    console.log(`Customer: ${subscription.customerId}`);
    console.log(`Plan: ${subscription.plan?.planName} (${subscription.plan?.planType})`);
    console.log(`Plan includes ${subscription.plan?.features?.extensions || 0} extensions\n`);

    // Test extension auto-assignment
    console.log('Auto-assigning extensions...');
    const result = await extensionService.autoAssignExtensionsToCustomer(
      subscription.customerId,
      subscription.id
    );

    console.log('\nExtension Assignment Result:');
    console.log(`Base Prefix: ${result.basePrefix}`);
    console.log(`Total Assigned: ${result.totalAssigned}`);
    console.log('Assigned Extensions:');
    result.assignedExtensions.forEach((ext, index) => {
      console.log(`  ${index + 1}. ${ext.extension} (Password: ${ext.password})`);
    });

    // Verify extensions were created in database
    console.log('\nVerifying extensions in database...');
    const customerExtensions = await extensionService.getCustomerExtensions(
      subscription.customerId,
      subscription.id
    );

    console.log(`Found ${customerExtensions.length} extensions in database:`);
    customerExtensions.forEach((ext, index) => {
      console.log(`  ${index + 1}. ${ext.extension} (Base: ${ext.basePrefix}, Index: ${ext.extensionIndex})`);
    });

    console.log('\n✅ Extension auto-assignment test completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
})();