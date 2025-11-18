'use strict';

const { v4: uuidv4 } = require('uuid');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Get the default tenant
    const tenants = await queryInterface.sequelize.query(
      'SELECT id FROM "Tenants" WHERE name = \'Default Tenant\' LIMIT 1;',
      { type: Sequelize.QueryTypes.SELECT }
    );

    if (tenants.length === 0) {
      console.log('Default tenant not found, skipping additional toll-free numbers seeder');
      return;
    }

    const tenantId = tenants[0].id;
    const now = new Date();

    // Additional toll-free numbers
    const additionalTollFreeNumbers = [
      { id: uuidv4(), number: '8886343114', provider: 'Airtel', setupCost: 500, monthlyCost: 200, tenantId, createdAt: now, updatedAt: now },
      { id: uuidv4(), number: '8667360279', provider: 'Vodafone', setupCost: 500, monthlyCost: 200, tenantId, createdAt: now, updatedAt: now },
    ];

    await queryInterface.bulkInsert('TollFreeNumbers', additionalTollFreeNumbers);

    console.log('✅ Additional toll-free numbers added successfully');
    console.log('📞 Added: 888-634-3114, 866-736-0279');
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('TollFreeNumbers', {
      number: {
        [Sequelize.Op.in]: ['888-634-3114', '866-736-0279']
      }
    });
  }
};