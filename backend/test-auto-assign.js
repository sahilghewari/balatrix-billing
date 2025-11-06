require('dotenv').config();
const { Subscription } = require('./src/models');
const subscriptionService = require('./src/services/subscriptionService');
const sequelize = require('./src/config/database').sequelize;

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
    console.log(`Selected numbers in metadata:`, subscription.metadata?.selectedNumbers);

    // Start a transaction to test the assignment logic
    const transaction = await sequelize.transaction();

    try {
      // Assign toll-free numbers to customer
      const selectedNumbers = subscription.metadata.selectedNumbers || [];
      const numbersArray = Array.isArray(selectedNumbers) ? selectedNumbers : [selectedNumbers];

      // Get plan features to determine included toll-free numbers
      const planFeatures = subscription.plan?.features || {};
      const planLimits = subscription.plan?.limits || {};
      const includedTollFreeNumbers = planFeatures.tollFreeNumbers || planLimits.maxTollFreeNumbers || 0;

      console.log(`Plan includes ${includedTollFreeNumbers} toll-free numbers`);
      console.log(`Currently selected: ${numbersArray.length} numbers`);

      // Ensure we assign at least the included numbers for the plan
      let numbersToAssign = [...numbersArray];
      if (numbersToAssign.length < includedTollFreeNumbers && includedTollFreeNumbers > 0) {
        const additionalNeeded = includedTollFreeNumbers - numbersToAssign.length;
        console.log(`Need ${additionalNeeded} additional numbers`);

        // Auto-assign additional numbers from available pool
        const TollFreeNumber = require('./src/models').TollFreeNumber;
        const alreadyAssignedIds = numbersToAssign.map(n => n.id);
        const availableNumbers = await TollFreeNumber.findAll({
          where: {
            status: 'active',
            id: { [require('sequelize').Op.notIn]: alreadyAssignedIds }
          },
          limit: additionalNeeded,
          order: [['number', 'ASC']],
          transaction,
        });

        console.log(`Found ${availableNumbers.length} available numbers`);

        const additionalNumbers = availableNumbers.map(num => ({
          id: num.id,
          number: num.number,
          provider: 'balatrix',
          setupCost: 0,
          monthlyCost: planFeatures.perMinuteCharge || '99.99',
          perMinuteCost: '0.0199'
        }));

        numbersToAssign = [...numbersToAssign, ...additionalNumbers];
        console.log(`Total numbers to assign: ${numbersToAssign.length}`);
        console.log(`Numbers:`, numbersToAssign.map(n => n.number));

        // Update subscription metadata with auto-assigned numbers
        subscription.metadata = {
          ...subscription.metadata,
          selectedNumbers: numbersToAssign,
          autoAssignedNumbers: true,
        };
        await subscription.save({ transaction });
      }

      if (numbersToAssign.length > 0) {
        const tollFreeNumberService = require('./src/services/tollFreeNumberService');
        for (const numberData of numbersToAssign) {
          if (numberData && numberData.id) {
            console.log(`Assigning number ${numberData.number} (${numberData.id})`);
            await tollFreeNumberService.assignNumberToCustomer(
              subscription.customerId,
              numberData.id,
              subscription.id,
              transaction
            );
          }
        }
      }

      await transaction.commit();
      console.log('Assignment complete');

    } catch (error) {
      await transaction.rollback();
      throw error;
    }

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
})();