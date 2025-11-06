require('dotenv').config();
const { Tenant, User, TollFreeNumber, Customer } = require('./src/models');
const sequelize = require('./src/config/database').sequelize;

(async () => {
  try {
    await sequelize.authenticate();
    console.log('Connected to database');

    // Check if default tenant exists
    const tenant = await Tenant.findByPk('5a98f0ca-b2ef-478a-8d7c-85e6f61aa7ea');
    if (tenant) {
      console.log('✅ Default tenant exists:', {
        id: tenant.id,
        name: tenant.name,
        isActive: tenant.isActive
      });
    } else {
      console.log('❌ Default tenant not found');
    }

    // Check all tenants
    const allTenants = await Tenant.findAll();
    console.log('All tenants:', allTenants.map(t => ({ id: t.id, name: t.name })));

    // Check if user exists
    const user = await User.findByPk('6d19cf49-4d38-4837-a5aa-12b0cb462f68');
    if (user) {
      console.log('✅ User exists:', user.email);

      // Check if customer exists for this user
      const customer = await Customer.findOne({ where: { userId: user.id } });
      if (customer) {
        console.log('✅ Customer exists:', {
          id: customer.id,
          tenantId: customer.tenantId
        });
      } else {
        console.log('❌ Customer not found for user');
      }
    } else {
      console.log('❌ User not found');
    }

    // Check the toll-free number being selected
    const number = await TollFreeNumber.findByPk('bd5bc502-4829-44b5-90da-72af781449b3');
    if (number) {
      console.log('✅ Toll-free number exists:', {
        id: number.id,
        number: number.number,
        status: number.status,
        tenantId: number.tenantId
      });
    } else {
      console.log('❌ Toll-free number not found');
    }

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
})();