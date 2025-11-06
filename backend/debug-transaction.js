require('dotenv').config();
const { Customer, Account } = require('./src/models');
const sequelize = require('./src/config/database').sequelize;

(async () => {
  try {
    await sequelize.authenticate();

    const userId = '6d19cf49-4d38-4837-a5aa-12b0cb462f68';

    // Start a transaction like the subscription service does
    const transaction = await sequelize.transaction();

    try {
      // Get customer like the subscription service does
      const customer = await Customer.findOne({
        where: { userId },
        transaction,
      });

      if (!customer) {
        console.log('No customer found for user');
        await transaction.rollback();
        process.exit(1);
      }

      console.log(`Customer found: ID=${customer.id}, TenantId=${customer.tenantId}`);

      // Now try the account lookup exactly like subscription service
      const account = await Account.findOne({
        where: { customerId: customer.id },
        transaction,
      });

      console.log(`Account lookup result within transaction: ${account ? 'FOUND' : 'NOT FOUND'}`);
      if (account) {
        console.log(`Account: ID=${account.id}, CustomerId=${account.customerId}, TenantId=${account.tenantId}`);
      } else {
        console.log('Account not found, would try to create one...');
      }

      await transaction.rollback();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
})();