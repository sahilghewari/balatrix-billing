require('dotenv').config();
const { TollFreeNumber, Customer } = require('./src/models');
const tollFreeNumberService = require('./src/services/tollFreeNumberService');

(async () => {
  try {
    const customerId = '7e56107e-c49b-4448-8fda-647907830aa3';
    const numberId = 'bd5bc502-4829-44b5-90da-72af781449b3';
    const subscriptionId = '535fbbfa-032f-454c-963a-83d071ab37d0';

    console.log('Assigning toll-free number manually...');
    const result = await tollFreeNumberService.assignNumberToCustomer(
      customerId,
      numberId,
      subscriptionId
    );

    console.log('Assignment successful:', result.number);

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
})();