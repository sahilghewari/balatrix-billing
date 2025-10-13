'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      // Helper function to check if column exists
      const columnExists = async (tableName, columnName) => {
        const [results] = await queryInterface.sequelize.query(
          `SELECT column_name FROM information_schema.columns WHERE table_name='${tableName}' AND column_name='${columnName}';`,
          { transaction }
        );
        return results.length > 0;
      };

      // Add paymentType if it doesn't exist
      if (!(await columnExists('payments', 'paymentType'))) {
        await queryInterface.addColumn('payments', 'paymentType', {
          type: Sequelize.ENUM('subscription', 'invoice', 'recharge', 'refund', 'adjustment'),
          allowNull: false,
          defaultValue: 'subscription',
        }, { transaction });
      }

      // Add isRecurring if it doesn't exist
      if (!(await columnExists('payments', 'isRecurring'))) {
        await queryInterface.addColumn('payments', 'isRecurring', {
          type: Sequelize.BOOLEAN,
          defaultValue: false,
          allowNull: false,
        }, { transaction });
      }

      // Add paymentMethodId if it doesn't exist
      if (!(await columnExists('payments', 'paymentMethodId'))) {
        await queryInterface.addColumn('payments', 'paymentMethodId', {
          type: Sequelize.UUID,
          allowNull: true,
        }, { transaction });
      }

      // Add failedAt if it doesn't exist
      if (!(await columnExists('payments', 'failedAt'))) {
        await queryInterface.addColumn('payments', 'failedAt', {
          type: Sequelize.DATE,
          allowNull: true,
        }, { transaction });
      }

      // Add refundedAt if it doesn't exist
      if (!(await columnExists('payments', 'refundedAt'))) {
        await queryInterface.addColumn('payments', 'refundedAt', {
          type: Sequelize.DATE,
          allowNull: true,
        }, { transaction });
      }

      // Add failureCode if it doesn't exist
      if (!(await columnExists('payments', 'failureCode'))) {
        await queryInterface.addColumn('payments', 'failureCode', {
          type: Sequelize.STRING(50),
          allowNull: true,
        }, { transaction });
      }

      // Add nextRetryAt if it doesn't exist
      if (!(await columnExists('payments', 'nextRetryAt'))) {
        await queryInterface.addColumn('payments', 'nextRetryAt', {
          type: Sequelize.DATE,
          allowNull: true,
        }, { transaction });
      }

      // Add refundAmount if it doesn't exist
      if (!(await columnExists('payments', 'refundAmount'))) {
        await queryInterface.addColumn('payments', 'refundAmount', {
          type: Sequelize.DECIMAL(15, 2),
          allowNull: true,
        }, { transaction });
      }

      // Add refundedBy if it doesn't exist
      if (!(await columnExists('payments', 'refundedBy'))) {
        await queryInterface.addColumn('payments', 'refundedBy', {
          type: Sequelize.UUID,
          allowNull: true,
        }, { transaction });
      }

      // Add transactionId if it doesn't exist
      if (!(await columnExists('payments', 'transactionId'))) {
        await queryInterface.addColumn('payments', 'transactionId', {
          type: Sequelize.STRING(100),
          allowNull: true,
        }, { transaction });
      }

      // Add notes if it doesn't exist
      if (!(await columnExists('payments', 'notes'))) {
        await queryInterface.addColumn('payments', 'notes', {
          type: Sequelize.TEXT,
          allowNull: true,
        }, { transaction });
      }

      // Add gatewayResponse if it doesn't exist
      if (!(await columnExists('payments', 'gatewayResponse'))) {
        await queryInterface.addColumn('payments', 'gatewayResponse', {
          type: Sequelize.JSONB,
          allowNull: true,
        }, { transaction });
      }

      // Update paymentNumber length
      await queryInterface.changeColumn('payments', 'paymentNumber', {
        type: Sequelize.STRING(50),
        allowNull: false,
        unique: true,
      }, { transaction });

      // Update amount precision
      await queryInterface.changeColumn('payments', 'amount', {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: false,
      }, { transaction });

      // Update paymentMethod enum to include 'razorpay'
      await queryInterface.sequelize.query(`
        DO $$ BEGIN
          IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'razorpay' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'enum_payments_paymentMethod')) THEN
            ALTER TYPE "enum_payments_paymentMethod" ADD VALUE 'razorpay';
          END IF;
        END $$;
      `, { transaction });

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    // Remove added columns
    await queryInterface.removeColumn('payments', 'paymentType');
    await queryInterface.removeColumn('payments', 'isRecurring');
    await queryInterface.removeColumn('payments', 'paymentMethodId');
    await queryInterface.removeColumn('payments', 'failedAt');
    await queryInterface.removeColumn('payments', 'refundedAt');
    await queryInterface.removeColumn('payments', 'failureCode');
    await queryInterface.removeColumn('payments', 'nextRetryAt');
    await queryInterface.removeColumn('payments', 'refundAmount');
    await queryInterface.removeColumn('payments', 'refundedBy');
    await queryInterface.removeColumn('payments', 'transactionId');
    await queryInterface.removeColumn('payments', 'notes');
    await queryInterface.removeColumn('payments', 'gatewayResponse');

    // Revert paymentNumber length
    await queryInterface.changeColumn('payments', 'paymentNumber', {
      type: Sequelize.STRING(20),
      allowNull: false,
      unique: true,
    });

    // Revert amount precision
    await queryInterface.changeColumn('payments', 'amount', {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: false,
    });
  }
};
