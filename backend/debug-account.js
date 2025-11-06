require('dotenv').config();
const { Tenant, User, TollFreeNumber, Customer, Account } = require('./src/models');
const sequelize = require('./src/config/database').sequelize;

(async () => {
  try {
    await sequelize.authenticate();
    console.log('Connected to database');

    const userId = '6d19cf49-4d38-4837-a5aa-12b0cb462f68';
    const customer = await Customer.findOne({ where: { userId } });

    if (customer) {
      console.log('Customer found:', {
        id: customer.id,
        userId: customer.userId,
        tenantId: customer.tenantId
      });

      // Check if account exists
      const account = await Account.findOne({
        where: { customerId: customer.id }
      });

      if (account) {
        console.log('✅ Account exists:', {
          id: account.id,
          customerId: account.customerId,
          tenantId: account.tenantId
        });
      } else {
        console.log('❌ Account not found for customer');

        // Try to create account manually to see the error
        try {
          const newAccount = await Account.create({
            customerId: customer.id,
            tenantId: customer.tenantId,
            accountNumber: `ACC-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`,
            accountType: 'postpaid',
            balance: 0.0,
            creditLimit: 0.0,
            currency: 'INR',
          });
          console.log('Account created successfully:', newAccount.id);
        } catch (createError) {
          console.log('Account creation failed:', createError.message);
        }
      }

      // Verify tenant exists
      const tenant = await Tenant.findByPk(customer.tenantId);
      if (tenant) {
        console.log('✅ Tenant exists for customer');
      } else {
        console.log('❌ Tenant does not exist for customer');
      }
    } else {
      console.log('❌ Customer not found');
    }

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
})();