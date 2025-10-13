'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Add new columns
    await queryInterface.addColumn('rate_plans', 'plan_code', {
      type: Sequelize.STRING(50),
      allowNull: true, // Allow null initially
    });

    await queryInterface.addColumn('rate_plans', 'planName', {
      type: Sequelize.STRING(255),
      allowNull: true,
    });

    await queryInterface.addColumn('rate_plans', 'currency', {
      type: Sequelize.STRING(3),
      defaultValue: 'INR',
    });

    await queryInterface.addColumn('rate_plans', 'limits', {
      type: Sequelize.JSON,
      defaultValue: {},
    });

    await queryInterface.addColumn('rate_plans', 'billingCycle', {
      type: Sequelize.ENUM('monthly', 'quarterly', 'annual'),
      defaultValue: 'monthly',
    });

    await queryInterface.addColumn('rate_plans', 'trialDays', {
      type: Sequelize.INTEGER,
      defaultValue: 0,
    });

    await queryInterface.addColumn('rate_plans', 'isPublic', {
      type: Sequelize.BOOLEAN,
      defaultValue: true,
    });

    await queryInterface.addColumn('rate_plans', 'displayOrder', {
      type: Sequelize.INTEGER,
      defaultValue: 0,
    });

    await queryInterface.addColumn('rate_plans', 'metadata', {
      type: Sequelize.JSON,
      defaultValue: {},
    });

    // Modify existing planType enum
    await queryInterface.sequelize.query(`
      ALTER TYPE "enum_rate_plans_planType" ADD VALUE IF NOT EXISTS 'starter';
      ALTER TYPE "enum_rate_plans_planType" ADD VALUE IF NOT EXISTS 'professional';
      ALTER TYPE "enum_rate_plans_planType" ADD VALUE IF NOT EXISTS 'callCenter';
      ALTER TYPE "enum_rate_plans_planType" ADD VALUE IF NOT EXISTS 'custom';
    `);

    // Create index for plan_code
    await queryInterface.addIndex('rate_plans', ['plan_code'], {
      name: 'rate_plans_plan_code_idx',
      unique: true,
    });
  },

  down: async (queryInterface, Sequelize) => {
    // Remove added columns
    await queryInterface.removeColumn('rate_plans', 'metadata');
    await queryInterface.removeColumn('rate_plans', 'displayOrder');
    await queryInterface.removeColumn('rate_plans', 'isPublic');
    await queryInterface.removeColumn('rate_plans', 'trialDays');
    await queryInterface.removeColumn('rate_plans', 'billingCycle');
    await queryInterface.removeColumn('rate_plans', 'limits');
    await queryInterface.removeColumn('rate_plans', 'currency');
    await queryInterface.removeColumn('rate_plans', 'planName');
    await queryInterface.removeColumn('rate_plans', 'plan_code');

    // Remove index
    await queryInterface.removeIndex('rate_plans', 'rate_plans_plan_code_idx');
  },
};
