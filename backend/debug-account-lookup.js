require('dotenv').config();
const { Customer, Account } = require('./src/models');
const sequelize = require('./src/config/database').sequelize;

(async () => {
  try {
    await sequelize.authenticate();

    const userId = '6d19cf49-4d38-4837-a5aa-12b0cb462f68';

    // Get customer like the subscription service does
    const customer = await Customer.findOne({
      where: { userId }
    });

    if (!customer) {
      console.log('No customer found for user');
      process.exit(1);
    }

    console.log(`Customer found: ID=${customer.id}, TenantId=${customer.tenantId}`);

    // Now try the account lookup exactly like subscription service
    const account = await Account.findOne({
      where: { customerId: customer.id }
    });

    console.log(`Account lookup result: ${account ? 'FOUND' : 'NOT FOUND'}`);
    if (account) {
      console.log(`Account: ID=${account.id}, CustomerId=${account.customerId}, TenantId=${account.tenantId}`);
    }

    // Also check all accounts for this customer
    const allAccounts = await Account.findAll({
      where: { customerId: customer.id }
    });

    console.log(`Total accounts for customer: ${allAccounts.length}`);
    allAccounts.forEach((acc, index) => {
      console.log(`${index + 1}. Account ID: ${acc.id}, CustomerId: ${acc.customerId}`);
    });

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
})();