require('dotenv').config();
const { Subscription } = require('./src/models');

(async () => {
  try {
    const subscriptionId = '710fe781-1d83-4f3f-a7b3-bba079e5faf1';
    
    const subscription = await Subscription.findByPk(subscriptionId);
    
    if (subscription) {
      console.log('Subscription metadata:');
      console.log(JSON.stringify(subscription.metadata, null, 2));
    } else {
      console.log('Subscription not found');
    }

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
})();