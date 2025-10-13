const { sequelize } = require('./src/config/database');

async function resetMigration() {
  try {
    await sequelize.query(
      "DELETE FROM \"SequelizeMeta\" WHERE name='20241001000016-add-missing-subscription-columns.js';"
    );
    console.log('Migration record removed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

resetMigration();
