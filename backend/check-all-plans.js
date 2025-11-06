require('dotenv').config();
const { RatePlan } = require('./src/models');
const sequelize = require('./src/config/database').sequelize;

(async () => {
  try {
    await sequelize.authenticate();

    // Get all plans
    const plans = await RatePlan.findAll();

    console.log(`Found ${plans.length} plans:`);
    plans.forEach((plan, index) => {
      console.log(`${index + 1}. ${plan.planCode} - ${plan.planName}`);
      console.log(`   Features: ${JSON.stringify(plan.features)}`);
      console.log(`   Limits: ${JSON.stringify(plan.limits)}`);
      console.log('');
    });

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
})();