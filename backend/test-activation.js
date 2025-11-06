require('dotenv').config();
const { Subscription } = require('./src/models');
const subscriptionService = require('./src/services/subscriptionService');

(async () => {
  try {
    // Get the pending subscription
    const subscription = await Subscription.findOne({
      where: { status: 'pending' },
      include: [{ model: require('./src/models').RatePlan, as: 'plan' }]
    });

    if (!subscription) {
      console.log('No pending subscription found');
      process.exit(1);
    }

    console.log(`Found pending subscription: ${subscription.id}`);
    console.log(`Plan: ${subscription.plan?.planName}`);
    console.log(`Plan features:`, subscription.plan?.features);
    console.log(`Plan limits:`, subscription.plan?.limits);
    console.log(`Selected numbers in metadata:`, subscription.metadata?.selectedNumbers);

    // Manually activate the subscription (for testing)
    console.log('Activating subscription...');

    // Update status to active
    subscription.status = 'active';
    subscription.metadata = {
      ...subscription.metadata,
      paymentVerified: true,
      activatedAt: new Date(),
    };
    await subscription.save();

    // Now run the number assignment logic
    const selectedNumbers = subscription.metadata.selectedNumbers || [];
    const numbersArray = Array.isArray(selectedNumbers) ? selectedNumbers : [selectedNumbers];

    // Get plan features to determine included toll-free numbers
    const planFeatures = subscription.plan?.features || {};
    const planLimits = subscription.plan?.limits || {};
    const includedTollFreeNumbers = planFeatures.tollFreeNumbers || planLimits.maxTollFreeNumbers || 0;

    console.log(`Included toll-free numbers: ${includedTollFreeNumbers}`);
    console.log(`Selected numbers count: ${numbersArray.length}`);

    // If no numbers were explicitly selected but plan includes numbers, auto-assign included numbers
    let numbersToAssign = [...numbersArray];
    if (numbersArray.length === 0 && includedTollFreeNumbers > 0) {
      console.log('Auto-assigning included numbers...');
      // Auto-assign included numbers from available pool
      const TollFreeNumber = require('./src/models').TollFreeNumber;
      const availableNumbers = await TollFreeNumber.findAll({
        where: { status: 'active' },
        limit: includedTollFreeNumbers,
        order: [['number', 'ASC']],
      });

      numbersToAssign = availableNumbers.map(num => ({
        id: num.id,
        number: num.number,
        provider: 'balatrix',
        setupCost: 0,
        monthlyCost: planFeatures.perMinuteCharge || '99.99',
        perMinuteCost: '0.0199'
      }));

      console.log(`Auto-assigned ${numbersToAssign.length} numbers:`, numbersToAssign.map(n => n.number));

      // Update subscription metadata with auto-assigned numbers
      subscription.metadata = {
        ...subscription.metadata,
        selectedNumbers: numbersToAssign,
        autoAssignedNumbers: true,
      };
      await subscription.save();
    }

    if (numbersToAssign.length > 0) {
      const tollFreeNumberService = require('./src/services/tollFreeNumberService');
      for (const numberData of numbersToAssign) {
        if (numberData && numberData.id) {
          console.log(`Assigning number ${numberData.number} (${numberData.id})`);
          await tollFreeNumberService.assignNumberToCustomer(
            subscription.customerId,
            numberData.id,
            subscription.id
          );
        }
      }
    }

    console.log('Subscription activation complete');

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
})();