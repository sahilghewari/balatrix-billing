require('dotenv').config();
const extensionService = require('./src/services/extensionService');
const { Customer, Subscription, RatePlan } = require('./src/models');
const { sequelize } = require('./src/config/database');

(async () => {
  try {
    console.log('Testing Extension Auto-Assignment for Different Plans...\n');

    // Test with different plan types
    const planTypes = ['starter', 'professional', 'callCenter'];
    const expectedExtensions = {
      starter: 2,
      professional: 10,
      callCenter: 50
    };

    for (const planType of planTypes) {
      console.log(`\n=== Testing ${planType.toUpperCase()} Plan ===`);

      // Find or create a test customer for this plan type
      const plan = await RatePlan.findOne({ where: { planType } });
      if (!plan) {
        console.log(`❌ Plan ${planType} not found, skipping...`);
        continue;
      }

      console.log(`Plan: ${plan.planName}`);
      console.log(`Expected extensions: ${expectedExtensions[planType]}`);

      // Create a test customer and subscription
      const transaction = await sequelize.transaction();

      try {
        // Create test customer
        const testCustomer = await Customer.create({
          email: `test-${planType}-${Date.now()}@example.com`,
          password: 'testpassword',
          firstName: `Test${planType}`,
          lastName: 'User',
          phone: '1234567890',
          isActive: true,
        }, { transaction });

        // Create test subscription
        const testSubscription = await Subscription.create({
          customerId: testCustomer.id,
          ratePlanId: plan.id,
          status: 'active',
          billingCycle: 'monthly',
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
          metadata: {},
        }, { transaction });

        // Test extension auto-assignment
        console.log('Auto-assigning extensions...');
        const result = await extensionService.autoAssignExtensionsToCustomer(
          testCustomer.id,
          testSubscription.id,
          transaction
        );

        console.log(`✅ Base Prefix: ${result.basePrefix}`);
        console.log(`✅ Total Assigned: ${result.totalAssigned} (Expected: ${expectedExtensions[planType]})`);

        if (result.totalAssigned === expectedExtensions[planType]) {
          console.log('✅ Extension count matches expected!');
        } else {
          console.log('❌ Extension count does not match expected!');
        }

        // Show first few extensions
        console.log('Sample extensions:');
        result.assignedExtensions.slice(0, 3).forEach((ext, index) => {
          console.log(`  ${index + 1}. ${ext.extension}`);
        });
        if (result.assignedExtensions.length > 3) {
          console.log(`  ... and ${result.assignedExtensions.length - 3} more`);
        }

        await transaction.commit();

      } catch (error) {
        await transaction.rollback();
        console.log(`❌ Failed to test ${planType}:`, error.message);
      }
    }

    console.log('\n🎉 All plan tests completed!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
})();