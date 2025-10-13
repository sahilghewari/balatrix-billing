'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Rename ratePlanId column to planId in subscriptions table
    await queryInterface.renameColumn('subscriptions', 'ratePlanId', 'planId');
  },

  down: async (queryInterface, Sequelize) => {
    // Revert: rename planId back to ratePlanId
    await queryInterface.renameColumn('subscriptions', 'planId', 'ratePlanId');
  }
};
