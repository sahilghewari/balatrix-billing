require('dotenv').config();
const { Subscription, TollFreeNumber } = require('./src/models');
const tollFreeNumberService = require('./src/services/tollFreeNumberService');
const sequelize = require('./src/config/database').sequelize;

(async () => {
  try {
    // Get all active subscriptions
    const subscriptions = await Subscription.findAll({
      where: { status: 'active' },
      include: [{ model: require('./src/models').RatePlan, as: 'plan' }]
    });

    console.log(`Found ${subscriptions.length} active subscriptions`);

    for (const subscription of subscriptions) {
      console.log(`\nProcessing subscription ${subscription.id} (${subscription.plan?.planName})`);

      // Get plan features
      const planFeatures = subscription.plan?.features || {};
      const planLimits = subscription.plan?.limits || {};
      const includedTollFreeNumbers = planFeatures.tollFreeNumbers || planLimits.maxTollFreeNumbers || 0;

      console.log(`Plan includes ${includedTollFreeNumbers} toll-free numbers`);

      // Get currently assigned numbers for this subscription
      const assignedNumbers = await TollFreeNumber.findAll({
        where: {
          tenantId: subscription.tenantId,
          status: 'inactive',
          config: {
            subscriptionId: subscription.id
          }
        }
      });

      console.log(`Currently assigned: ${assignedNumbers.length} numbers`);

      // Check if we need to assign more numbers
      if (assignedNumbers.length < includedTollFreeNumbers) {
        const additionalNeeded = includedTollFreeNumbers - assignedNumbers.length;
        console.log(`Need ${additionalNeeded} more numbers`);

        // Get available numbers not already assigned to this tenant
        const assignedIds = assignedNumbers.map(n => n.id);
        const availableNumbers = await TollFreeNumber.findAll({
          where: {
            status: 'active',
            id: { [require('sequelize').Op.notIn]: assignedIds }
          },
          limit: additionalNeeded,
          order: [['number', 'ASC']],
        });

        console.log(`Found ${availableNumbers.length} available numbers`);

        // Assign the additional numbers
        for (const number of availableNumbers) {
          console.log(`Assigning ${number.number} to subscription ${subscription.id}`);
          await tollFreeNumberService.assignNumberToCustomer(
            subscription.customerId,
            number.id,
            subscription.id
          );
        }

        // Update subscription metadata
        const currentSelected = subscription.metadata?.selectedNumbers || [];
        const selectedArray = Array.isArray(currentSelected) ? currentSelected : [currentSelected];

        const newNumbers = availableNumbers.map(num => ({
          id: num.id,
          number: num.number,
          provider: 'balatrix',
          setupCost: 0,
          monthlyCost: planFeatures.perMinuteCharge || '99.99',
          perMinuteCost: '0.0199'
        }));

        subscription.metadata = {
          ...subscription.metadata,
          selectedNumbers: [...selectedArray, ...newNumbers],
          autoAssignedNumbers: true,
        };
        await subscription.save();

      } else {
        console.log('Already has correct number of numbers assigned');
      }
    }

    console.log('\nFix complete');

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
})();