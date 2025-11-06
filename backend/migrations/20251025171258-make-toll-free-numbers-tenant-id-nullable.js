'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // Make tenantId nullable for unassigned toll-free numbers
    await queryInterface.changeColumn('TollFreeNumbers', 'tenantId', {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: 'Tenants',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    });
  },

  async down (queryInterface, Sequelize) {
    // Revert: make tenantId not nullable
    await queryInterface.changeColumn('TollFreeNumbers', 'tenantId', {
      type: Sequelize.UUID,
      allowNull: false,
      references: {
        model: 'Tenants',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    });
  },
};
