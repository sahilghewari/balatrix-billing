/**
 * Add more toll-free numbers to the database
 * This script creates additional available toll-free numbers for testing
 */

require('dotenv').config();
const { sequelize } = require('./src/config/database');
const { TollFreeNumber } = require('./src/models');

async function addTollFreeNumbers() {
  try {
    await sequelize.authenticate();
    console.log('Connected to database');

    // Check current numbers
    const totalNumbers = await TollFreeNumber.count();
    console.log('Current total toll-free numbers:', totalNumbers);

    // Create more toll-free numbers
    const newNumbers = [
      '1800-111-2222', '1800-222-3333', '1800-333-4444', '1800-444-5555', '1800-555-6666',
      '1800-666-7777', '1800-777-8888', '1800-888-9999', '1800-999-0000', '1800-000-1111',
      '1800-121-2121', '1800-232-3232', '1800-343-4343', '1800-454-5454', '1800-565-6565',
      '1800-676-7676', '1800-787-8787', '1800-898-9898', '1800-909-0909', '1800-010-1010',
      '1800-131-3131', '1800-242-4242', '1800-353-5353', '1800-464-6464', '1800-575-7575',
      '1800-686-8686', '1800-797-9797', '1800-808-0808', '1800-919-1919', '1800-020-2020'
    ];

    const numbersToCreate = [];
    for (const number of newNumbers) {
      // Check if number already exists
      const existing = await TollFreeNumber.findOne({ where: { number } });
      if (!existing) {
        numbersToCreate.push({
          number,
          status: 'active',
          monthlyCost: 99.99,
          perMinuteCost: 0.0199,
          tenantId: null,
          assignedAt: null,
        });
      }
    }

    if (numbersToCreate.length > 0) {
      // Create numbers one by one to avoid bulk insert issues
      for (const numberData of numbersToCreate) {
        try {
          await TollFreeNumber.create(numberData);
        } catch (error) {
          console.log(`Failed to create ${numberData.number}:`, error.message);
        }
      }
      console.log(`Attempted to create ${numbersToCreate.length} new toll-free numbers`);
    } else {
      console.log('All numbers already exist');
    }

    // Final count
    const finalTotal = await TollFreeNumber.count();
    const finalActive = await TollFreeNumber.count({ where: { status: 'active' } });
    const finalInactive = await TollFreeNumber.count({ where: { status: 'inactive' } });

    console.log('\nFinal counts:');
    console.log('Total toll-free numbers:', finalTotal);
    console.log('Active (available):', finalActive);
    console.log('Inactive (assigned):', finalInactive);

  } catch (error) {
    console.error('Error:', error.message);
    throw error;
  }
}

// Run the script
if (require.main === module) {
  addTollFreeNumbers()
    .then(() => {
      console.log('Script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Script failed:', error);
      process.exit(1);
    });
}

module.exports = { addTollFreeNumbers };