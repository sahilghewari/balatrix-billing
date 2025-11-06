require('dotenv').config();
const { Tenant } = require('./src/models');
const sequelize = require('./src/config/database').sequelize;

(async () => {
  try {
    await sequelize.authenticate();

    const tenantId = '5a98f0ca-b2ef-478a-8d7c-85e6f61aa7ea';

    // Check if the default tenant exists
    const tenant = await Tenant.findByPk(tenantId);

    if (tenant) {
      console.log(`Tenant found: ID=${tenant.id}, Name=${tenant.name}, Active=${tenant.isActive}`);
    } else {
      console.log('Default tenant NOT found!');
    }

    // Check all tenants
    const allTenants = await Tenant.findAll();
    console.log(`Total tenants in database: ${allTenants.length}`);
    allTenants.forEach((t, index) => {
      console.log(`${index + 1}. ID: ${t.id}, Name: ${t.name}, Active: ${t.isActive}`);
    });

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
})();