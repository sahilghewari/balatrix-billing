require('dotenv').config();
const { RatePlan } = require('./src/models');

(async () => {
  const plans = await RatePlan.findAll({where: {isActive: true}});
  console.log('Active Plans and Extension Counts:');
  plans.forEach(p => {
    console.log(`${p.planName}: ${p.features?.extensions || 0} extensions`);
  });
})();