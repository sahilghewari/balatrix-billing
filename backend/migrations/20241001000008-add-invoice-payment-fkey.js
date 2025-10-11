'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Add foreign key for invoiceId in payments table
    await queryInterface.addConstraint('payments', {
      fields: ['invoiceId'],
      type: 'foreign key',
      name: 'payments_invoiceId_fkey',
      references: {
        table: 'invoices',
        field: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeConstraint('payments', 'payments_invoiceId_fkey');
  },
};
