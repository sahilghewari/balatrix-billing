/**
 * Fix database schema to make tenantId nullable for toll-free numbers
 */

require('dotenv').config();
const { sequelize } = require('./src/config/database');

async function fixSchema() {
  try {
    await sequelize.authenticate();
    console.log('Connected to database');

    // Alter the table to make tenantId nullable
    await sequelize.query('ALTER TABLE "TollFreeNumbers" ALTER COLUMN "tenantId" DROP NOT NULL;');
    console.log('Successfully made tenantId nullable');

  } catch (error) {
    console.error('Error:', error.message);
    throw error;
  }
}

// Run the script
if (require.main === module) {
  fixSchema()
    .then(() => {
      console.log('Schema fix completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Schema fix failed:', error);
      process.exit(1);
    });
}

module.exports = { fixSchema };