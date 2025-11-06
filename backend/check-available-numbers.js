require('dotenv').config();
const { TollFreeNumber } = require('./src/models');

(async () => {
  try {
    // Check all toll-free numbers and their status
    const allNumbers = await TollFreeNumber.findAll({
      order: [['number', 'ASC']]
    });

    console.log(`Total toll-free numbers: ${allNumbers.length}`);
    allNumbers.forEach((num, index) => {
      console.log(`${index + 1}. ${num.number} - Status: ${num.status}, TenantId: ${num.tenantId}`);
    });

    // Check available numbers (status = 'active')
    const availableNumbers = await TollFreeNumber.findAll({
      where: { status: 'active' },
      order: [['number', 'ASC']]
    });

    console.log(`\nAvailable numbers (status='active'): ${availableNumbers.length}`);
    availableNumbers.forEach((num, index) => {
      console.log(`${index + 1}. ${num.number}`);
    });

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
})();