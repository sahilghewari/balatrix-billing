require('dotenv').config();
const { Customer, Subscription, TollFreeNumber } = require('./src/models');
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

    // Get subscription details
    const subscription = await Subscription.findOne({
      where: { customerId: customer.id, status: 'active' }
    });

    if (subscription) {
      console.log(`\nSubscription details:`);
      console.log(`ID: ${subscription.id}`);
      console.log(`Status: ${subscription.status}`);
      console.log(`RatePlanId: ${subscription.planId}`);
      console.log(`BillingCycle: ${subscription.billingCycle}`);
      console.log(`Metadata: ${JSON.stringify(subscription.metadata, null, 2)}`);
      console.log(`SelectedNumbers from metadata: ${JSON.stringify(subscription.metadata?.selectedNumbers)}`);
      console.log(`CreatedAt: ${subscription.createdAt}`);
    }

    // Check if there are any toll-free numbers with this subscription in config
    const numbersWithSubscription = await TollFreeNumber.findAll({
      where: {
        config: {
          subscriptionId: subscription.id
        }
      }
    });

    console.log(`\nToll-free numbers with this subscription in config: ${numbersWithSubscription.length}`);
    numbersWithSubscription.forEach((num, index) => {
      console.log(`${index + 1}. Number: ${num.number}, Status: ${num.status}`);
    });

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
})();