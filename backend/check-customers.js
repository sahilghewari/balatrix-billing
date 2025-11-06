require('dotenv').config();
const { Customer } = require('./src/models');
const sequelize = require('./src/config/database').sequelize;

(async () => {
  try {
    await sequelize.authenticate();

    const userId = '6d19cf49-4d38-4837-a5aa-12b0cb462f68';

    // Check all customers for this user
    const customers = await Customer.findAll({
      where: { userId }
    });

    console.log(`Found ${customers.length} customers for user ${userId}:`);
    customers.forEach((customer, index) => {
      console.log(`${index + 1}. Customer ID: ${customer.id}, Tenant ID: ${customer.tenantId}`);
    });

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
})();