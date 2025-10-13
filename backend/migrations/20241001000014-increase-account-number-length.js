'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Increase accountNumber column size from 20 to 50 characters
    await queryInterface.changeColumn('accounts', 'accountNumber', {
      type: Sequelize.STRING(50),
      allowNull: false,
      unique: true,
    });
  },

  down: async (queryInterface, Sequelize) => {
    // Revert back to 20 characters (though this might fail if data exists)
    await queryInterface.changeColumn('accounts', 'accountNumber', {
      type: Sequelize.STRING(20),
      allowNull: false,
      unique: true,
    });
  },
};
