require('dotenv').config();
const { RatePlan } = require('./src/models');
const sequelize = require('./src/config/database').sequelize;

(async () => {
  try {
    await sequelize.authenticate();

    // Get the Professional plan
    const plan = await RatePlan.findOne({
      where: { planCode: 'PROFESSIONAL' }
    });

    if (plan) {
      console.log('Professional Plan Details:');
      console.log(`ID: ${plan.id}`);
      console.log(`Name: ${plan.planName}`);
      console.log(`Features: ${JSON.stringify(plan.features, null, 2)}`);
      console.log(`Limits: ${JSON.stringify(plan.limits, null, 2)}`);
      console.log(`Metadata: ${JSON.stringify(plan.metadata, null, 2)}`);
    } else {
      console.log('Professional plan not found');
    }

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
})();