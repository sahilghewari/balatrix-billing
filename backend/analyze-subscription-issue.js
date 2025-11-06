require('dotenv').config();
const { Customer, Subscription, TollFreeNumber, RatePlan } = require('./src/models');
const sequelize = require('./src/config/database').sequelize;

(async () => {
  try {
    await sequelize.authenticate();

    const userId = '6d19cf49-4d38-4837-a5aa-12b0cb462f68';

    // Get customer
    const customer = await Customer.findOne({
      where: { userId }
    });

    if (!customer) {
      console.log('No customer found');
      process.exit(1);
    }

    console.log(`Customer: ${customer.id}`);

    // Get all subscriptions for this customer
    const subscriptions = await Subscription.findAll({
      where: { customerId: customer.id },
      include: [{ model: RatePlan, as: 'plan' }]
    });

    console.log(`\nFound ${subscriptions.length} subscriptions:`);
    subscriptions.forEach((sub, index) => {
      console.log(`\n${index + 1}. Subscription ID: ${sub.id}`);
      console.log(`   Status: ${sub.status}`);
      console.log(`   Plan: ${sub.plan ? sub.plan.planName : 'No plan'}`);
      console.log(`   Plan Limits: ${sub.plan ? JSON.stringify(sub.plan.limits) : 'No limits'}`);
      console.log(`   Metadata: ${JSON.stringify(sub.metadata, null, 2)}`);
    });

    // Get all toll-free numbers assigned to this tenant
    const numbers = await TollFreeNumber.findAll({
      where: { tenantId: customer.tenantId }
    });

    console.log(`\nToll-free numbers for tenant (${numbers.length} total):`);
    numbers.forEach((num, index) => {
      console.log(`${index + 1}. ${num.number} - Status: ${num.status}, Config: ${JSON.stringify(num.config)}`);
    });

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
})();