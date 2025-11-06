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

    // Get subscriptions for this customer
    const subscriptions = await Subscription.findAll({
      where: { customerId: customer.id }
    });

    console.log(`Found ${subscriptions.length} subscriptions:`);
    subscriptions.forEach((sub, index) => {
      console.log(`${index + 1}. ID: ${sub.id}, Status: ${sub.status}, PlanId: ${sub.ratePlanId}`);
    });

    // Get toll-free numbers assigned to this tenant
    const numbers = await TollFreeNumber.findAll({
      where: { tenantId: customer.tenantId }
    });

    console.log(`\nFound ${numbers.length} toll-free numbers for tenant:`);
    numbers.forEach((num, index) => {
      console.log(`${index + 1}. Number: ${num.number}, Status: ${num.status}, Config: ${JSON.stringify(num.config)}`);
    });

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
})();