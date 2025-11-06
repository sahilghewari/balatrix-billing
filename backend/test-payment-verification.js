require('dotenv').config();
const subscriptionService = require('./src/services/subscriptionService');

(async () => {
  try {
    // Manually trigger payment verification for the Call Center subscription
    const subscriptionId = '710fe781-1d83-4f3f-a7b3-bba079e5faf1';
    
    console.log('Testing payment verification for Call Center subscription...');
    
    // We need to get the razorpay order ID from the subscription
    const { Subscription } = require('./src/models');
    const subscription = await Subscription.findByPk(subscriptionId);
    
    if (!subscription) {
      console.log('Subscription not found');
      process.exit(1);
    }
    
    const razorpayOrderId = subscription.metadata?.razorpayOrderId;
    console.log(`Razorpay Order ID: ${razorpayOrderId}`);
    
    // For testing, we'll simulate the payment verification
    // In reality, this would be called by the frontend after payment
    console.log('This would normally be called after payment verification...');
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
})();