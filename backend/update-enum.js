const { sequelize } = require('./src/config/database');

async function updateEnum() {
  try {
    console.log('Updating enum...');

    // Rename old enum
    await sequelize.query('ALTER TYPE "enum_TollFreeNumbers_status" RENAME TO "enum_TollFreeNumbers_status_old";');

    // Create new enum
    await sequelize.query('CREATE TYPE "enum_TollFreeNumbers_status" AS ENUM (\'available\', \'assigned\', \'suspended\');');

    // Update table to use new enum
    await sequelize.query('ALTER TABLE "TollFreeNumbers" ALTER COLUMN status TYPE "enum_TollFreeNumbers_status" USING status::text::"enum_TollFreeNumbers_status";');

    // Drop old enum
    await sequelize.query('DROP TYPE "enum_TollFreeNumbers_status_old";');

    console.log('Enum updated successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error updating enum:', error);
    process.exit(1);
  }
}

updateEnum();