'use strict';

const { v4: uuidv4 } = require('uuid');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const now = new Date();
    
    // Get the admin user ID
    const [adminUser] = await queryInterface.sequelize.query(
      'SELECT id FROM users WHERE role = \'admin\' LIMIT 1',
      { type: Sequelize.QueryTypes.SELECT }
    );
    
    if (!adminUser) {
      throw new Error('Admin user not found. Please run admin users seeder first.');
    }
    
    // Create default tenant
    await queryInterface.bulkInsert('Tenants', [
      {
        id: '5a98f0ca-b2ef-478a-8d7c-85e6f61aa7ea',
        name: 'Default Tenant',
        description: 'Default tenant for the system',
        domain: null,
        config: JSON.stringify({}),
        isActive: true,
        createdBy: adminUser.id,
        createdAt: now,
        updatedAt: now,
      },
    ]);

    console.log('✅ Default tenant created');
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('Tenants', {
      id: '5a98f0ca-b2ef-478a-8d7c-85e6f61aa7ea',
    });
  },
};