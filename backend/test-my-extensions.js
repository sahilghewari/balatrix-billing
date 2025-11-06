require('dotenv').config();
const extensionService = require('./src/services/extensionService');
const { Customer } = require('./src/models');

(async () => {
  try {
    console.log('Testing My Extensions API Logic...\n');

    // Find a customer with extensions
    const customer = await Customer.findOne({
      include: [{ model: require('./src/models').Tenant, as: 'tenant' }],
      order: [['createdAt', 'DESC']]
    });

    if (!customer) {
      console.log('No customers found');
      return;
    }

    console.log(`Testing with customer: ${customer.email || 'No email'}`);
    console.log(`Customer ID: ${customer.id}`);

    // Test the extension service directly
    const extensions = await extensionService.getCustomerExtensions(customer.id);

    console.log(`\nFound ${extensions.length} extensions:`);
    extensions.forEach((ext, index) => {
      console.log(`  ${index + 1}. ${ext.extension} (Base: ${ext.basePrefix}, Index: ${ext.extensionIndex})`);
    });

    console.log('\n✅ Extension retrieval test completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error.stack);
  }
})();