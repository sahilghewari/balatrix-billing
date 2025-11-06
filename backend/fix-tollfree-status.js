/**
 * Fix toll-free number status for assigned numbers
 * This script updates the status of toll-free numbers that have tenantId set but status is still 'active'
 */

// Load environment variables first
require('dotenv').config();

const { sequelize } = require('./src/config/database');
const { TollFreeNumber } = require('./src/models');

async function fixAssignedTollFreeNumbers() {
  try {
    console.log('Starting fix for assigned toll-free numbers...');

    // Find numbers that are assigned (have tenantId) but status is 'active'
    const assignedButActiveNumbers = await TollFreeNumber.findAll({
      where: {
        tenantId: { [require('sequelize').Op.ne]: null },
        status: 'active'
      }
    });

    console.log(`Found ${assignedButActiveNumbers.length} numbers that need status fix`);

    if (assignedButActiveNumbers.length === 0) {
      console.log('No numbers need fixing.');
      return;
    }

    // Update their status to 'inactive'
    const updatePromises = assignedButActiveNumbers.map(number =>
      number.update({ status: 'inactive' })
    );

    await Promise.all(updatePromises);

    console.log(`Successfully updated ${assignedButActiveNumbers.length} toll-free numbers`);

    // Log the updated numbers
    assignedButActiveNumbers.forEach(number => {
      console.log(`Updated: ${number.number} (ID: ${number.id})`);
    });

  } catch (error) {
    console.error('Error fixing toll-free numbers:', error);
    throw error;
  }
}

// Run the fix
if (require.main === module) {
  fixAssignedTollFreeNumbers()
    .then(() => {
      console.log('Fix completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Fix failed:', error);
      process.exit(1);
    });
}

module.exports = { fixAssignedTollFreeNumbers };