require('dotenv').config();
const { Subscription, TollFreeNumber } = require('./src/models');
const sequelize = require('./src/config/database').sequelize;

(async () => {
  try {
    const subscriptionId = '710fe781-1d83-4f3f-a7b3-bba079e5faf1';
    
    // Get subscription with plan
    const subscription = await Subscription.findByPk(subscriptionId, {
      include: [{ model: require('./src/models').RatePlan, as: 'plan' }]
    });
    
    if (!subscription) {
      console.log('Subscription not found');
      process.exit(1);
    }
    
    console.log(`Processing Call Center subscription: ${subscription.id}`);
    console.log(`Plan: ${subscription.plan?.planName}`);
    console.log(`Plan features:`, subscription.plan?.features);
    console.log(`Plan limits:`, subscription.plan?.limits);
    
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
    
    // Get selected numbers from metadata
    const selectedNumbers = subscription.metadata.selectedNumbers || [];
    const numbersArray = Array.isArray(selectedNumbers) ? selectedNumbers : [selectedNumbers];
    
    console.log(`Selected numbers in metadata: ${numbersArray.length}`);
    
    let numbersToAssign = [...numbersArray];
    
    // Ensure we assign at least the included numbers for the plan
    if (numbersToAssign.length < includedTollFreeNumbers && includedTollFreeNumbers > 0) {
      const additionalNeeded = includedTollFreeNumbers - numbersToAssign.length;
      console.log(`Need ${additionalNeeded} additional numbers`);
      
      // Auto-assign additional numbers from available pool
      const alreadyAssignedIds = numbersToAssign.map(n => n.id);
      console.log(`Already assigned IDs:`, alreadyAssignedIds);
      
      const availableNumbers = await TollFreeNumber.findAll({
        where: {
          status: 'active',
          id: { [require('sequelize').Op.notIn]: alreadyAssignedIds }
        },
        limit: additionalNeeded,
        order: [['number', 'ASC']],
      });
      
      console.log(`Found ${availableNumbers.length} available numbers`);
      
      const additionalNumbers = availableNumbers.map(num => ({
        id: num.id,
        number: num.number,
        provider: 'balatrix',
        setupCost: 0,
        monthlyCost: planFeatures.perMinuteCharge || '200.00',
        perMinuteCost: '0.0000'
      }));
      
      numbersToAssign = [...numbersToAssign, ...additionalNumbers];
      console.log(`Total numbers to assign: ${numbersToAssign.length}`);
      
      // Assign the numbers
      const tollFreeNumberService = require('./src/services/tollFreeNumberService');
      for (const numberData of additionalNumbers) {
        if (numberData && numberData.id) {
          console.log(`Assigning number ${numberData.number}`);
          await tollFreeNumberService.assignNumberToCustomer(
            subscription.customerId,
            numberData.id,
            subscription.id
          );
        }
      }
      
      // Update subscription metadata
      subscription.metadata = {
        ...subscription.metadata,
        selectedNumbers: numbersToAssign,
        autoAssignedNumbers: true,
      };
      await subscription.save();
      
      console.log('Metadata updated');
    } else {
      console.log('No additional numbers needed');
    }
    
    console.log('Fix complete');
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
})();