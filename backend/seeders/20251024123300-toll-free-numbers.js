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
      console.log('Default tenant not found, skipping toll-free numbers seeder');
      return;
    }

    const tenantId = tenants[0].id;
    const now = new Date();

    // Sample toll-free numbers
    const tollFreeNumbers = [
      // 1800 series
      { id: uuidv4(), number: '1800-123-4567', provider: 'Airtel', setupCost: 500, monthlyCost: 200, tenantId, createdAt: now, updatedAt: now },
      { id: uuidv4(), number: '1800-234-5678', provider: 'Vodafone', setupCost: 500, monthlyCost: 200, tenantId, createdAt: now, updatedAt: now },
      { id: uuidv4(), number: '1800-345-6789', provider: 'Jio', setupCost: 500, monthlyCost: 200, tenantId, createdAt: now, updatedAt: now },
      { id: uuidv4(), number: '1800-456-7890', provider: 'BSNL', setupCost: 500, monthlyCost: 200, tenantId, createdAt: now, updatedAt: now },
      { id: uuidv4(), number: '1800-567-8901', provider: 'Airtel', setupCost: 500, monthlyCost: 200, tenantId, createdAt: now, updatedAt: now },
      { id: uuidv4(), number: '1800-678-9012', provider: 'Vodafone', setupCost: 500, monthlyCost: 200, tenantId, createdAt: now, updatedAt: now },
      { id: uuidv4(), number: '1800-789-0123', provider: 'Jio', setupCost: 500, monthlyCost: 200, tenantId, createdAt: now, updatedAt: now },
      { id: uuidv4(), number: '1800-890-1234', provider: 'BSNL', setupCost: 500, monthlyCost: 200, tenantId, createdAt: now, updatedAt: now },
      { id: uuidv4(), number: '1800-901-2345', provider: 'Airtel', setupCost: 500, monthlyCost: 200, tenantId, createdAt: now, updatedAt: now },
      { id: uuidv4(), number: '1800-012-3456', provider: 'Vodafone', setupCost: 500, monthlyCost: 200, tenantId, createdAt: now, updatedAt: now },

      // Premium numbers (higher cost)
      { id: uuidv4(), number: '1800-111-1111', provider: 'Airtel', setupCost: 1000, monthlyCost: 500, tenantId, createdAt: now, updatedAt: now },
      { id: uuidv4(), number: '1800-222-2222', provider: 'Vodafone', setupCost: 1000, monthlyCost: 500, tenantId, createdAt: now, updatedAt: now },
      { id: uuidv4(), number: '1800-333-3333', provider: 'Jio', setupCost: 1000, monthlyCost: 500, tenantId, createdAt: now, updatedAt: now },
      { id: uuidv4(), number: '1800-444-4444', provider: 'BSNL', setupCost: 1000, monthlyCost: 500, tenantId, createdAt: now, updatedAt: now },
      { id: uuidv4(), number: '1800-555-5555', provider: 'Airtel', setupCost: 1000, monthlyCost: 500, tenantId, createdAt: now, updatedAt: now },

      // More standard numbers
      { id: uuidv4(), number: '1800-666-6666', provider: 'Vodafone', setupCost: 500, monthlyCost: 200, tenantId, createdAt: now, updatedAt: now },
      { id: uuidv4(), number: '1800-777-7777', provider: 'Jio', setupCost: 500, monthlyCost: 200, tenantId, createdAt: now, updatedAt: now },
      { id: uuidv4(), number: '1800-888-8888', provider: 'BSNL', setupCost: 500, monthlyCost: 200, tenantId, createdAt: now, updatedAt: now },
      { id: uuidv4(), number: '1800-999-9999', provider: 'Airtel', setupCost: 500, monthlyCost: 200, tenantId, createdAt: now, updatedAt: now },
      { id: uuidv4(), number: '1800-000-0000', provider: 'Vodafone', setupCost: 500, monthlyCost: 200, tenantId, createdAt: now, updatedAt: now },
    ];

    await queryInterface.bulkInsert('TollFreeNumbers', tollFreeNumbers);
    console.log(`Seeded ${tollFreeNumbers.length} toll-free numbers`);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('TollFreeNumbers', null, {});
    console.log('Removed all toll-free numbers');
  }
};