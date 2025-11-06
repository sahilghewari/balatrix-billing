require('dotenv').config();
const { Customer, Subscription, TollFreeNumber } = require('./src/models');
const sequelize = require('./src/config/database').sequelize;

(async () => {
  try {
    await sequelize.authenticate();

    const userId = '50d61c9c-ee71-49ee-a7e9-f0b99b8efa6f';

    // Get customer
    const customer = await Customer.findOne({
      where: { userId }
    });

    if (!customer) {
      console.log('No customer found for user');
      process.exit(1);
    }

    console.log(`Customer: ${customer.id}`);

    // Get all subscriptions for this customer
    const subscriptions = await Subscription.findAll({
      where: { customerId: customer.id },
      include: [{ model: require('./src/models').RatePlan, as: 'plan' }],
      order: [['createdAt', 'DESC']]
    });

    console.log(`\nFound ${subscriptions.length} subscriptions:`);
    subscriptions.forEach((sub, index) => {
      console.log(`\n${index + 1}. Subscription ID: ${sub.id}`);
      console.log(`   Status: ${sub.status}`);
      console.log(`   Plan: ${sub.plan ? sub.plan.planName : 'No plan'}`);
      console.log(`   Plan features:`, sub.plan ? sub.plan.features : 'No features');
      console.log(`   Plan limits:`, sub.plan ? sub.plan.limits : 'No limits');
      console.log(`   SelectedNumbers in metadata:`, sub.metadata?.selectedNumbers);
      console.log(`   CreatedAt: ${sub.createdAt}`);
    });

    // Get toll-free numbers assigned to this tenant
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