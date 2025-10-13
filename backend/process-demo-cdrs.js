/**
 * Script to process demo CDRs and update subscription usage
 * Run this after seeding demo CDRs
 */

const { sequelize } = require('./src/config/database');
const usageService = require('./src/services/usageService');
const { CDR } = require('./src/models');
const logger = require('./src/utils/logger');

async function processDemoCDRs() {
  try {
    console.log('🔄 Starting demo CDR processing...\n');

    // Find all demo CDRs that haven't been processed for usage
    const demoCDRs = await CDR.findAll({
      where: {
        uuid: {
          [require('sequelize').Op.like]: 'demo-%',
        },
        processingStatus: 'processed',
      },
      order: [['startTime', 'ASC']],
    });

    if (demoCDRs.length === 0) {
      console.log('❌ No demo CDRs found. Please run the seeder first:');
      console.log('   npx sequelize-cli db:seed --seed 20241012000000-demo-cdrs.js\n');
      process.exit(0);
    }

    console.log(`📞 Found ${demoCDRs.length} demo CDRs to process\n`);

    // Group CDRs by subscription
    const cdrsBySubscription = {};
    demoCDRs.forEach((cdr) => {
      if (!cdrsBySubscription[cdr.subscriptionId]) {
        cdrsBySubscription[cdr.subscriptionId] = [];
      }
      cdrsBySubscription[cdr.subscriptionId].push(cdr);
    });

    // Process each subscription's CDRs
    for (const [subscriptionId, cdrs] of Object.entries(cdrsBySubscription)) {
      console.log(`\n📊 Processing subscription: ${subscriptionId}`);
      console.log(`   Total CDRs: ${cdrs.length}`);

      let totalMinutes = 0;
      const callTypeCounts = { local: 0, mobile: 0, std: 0, isd: 0 };

      // Process each CDR
      for (const cdr of cdrs) {
        const minutes = Math.ceil(cdr.billableSeconds / 60);
        const callType = cdr.callType || 'local';

        try {
          await usageService.addMinutesUsed(subscriptionId, minutes, callType);
          totalMinutes += minutes;
          callTypeCounts[callType]++;
          
          process.stdout.write('.');
        } catch (error) {
          console.error(`\n   ❌ Error processing CDR ${cdr.uuid}:`, error.message);
        }
      }

      console.log('\n   ✅ Subscription usage updated!');
      console.log(`   📈 Total minutes added: ${totalMinutes}`);
      console.log(`   📱 Call breakdown:`);
      console.log(`      - Local: ${callTypeCounts.local} calls`);
      console.log(`      - Mobile: ${callTypeCounts.mobile} calls`);
      console.log(`      - STD: ${callTypeCounts.std} calls`);
      console.log(`      - ISD: ${callTypeCounts.isd} calls`);
    }

    console.log('\n\n✅ Demo CDR processing complete!');
    console.log('🌐 Check your dashboard to see the updated usage\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error processing demo CDRs:', error);
    logger.error('Demo CDR processing failed', { error: error.message });
    process.exit(1);
  }
}

/**
 * Determine call type based on called number
 */
function determineCallType(calledNumber) {
  const number = calledNumber.replace(/^\+91/, '').replace(/^\+/, '');

  // Mobile numbers in India start with 6, 7, 8, 9 and are 10 digits
  if (/^[6-9]\d{9}$/.test(number)) {
    return 'mobile';
  }

  // International numbers (not India)
  if (calledNumber.startsWith('+') && !calledNumber.startsWith('+91')) {
    return 'isd';
  }

  // STD codes are typically 2-5 digits followed by 6-8 digits
  if (/^0[1-9]\d{8,10}$/.test(number)) {
    return 'std';
  }

  // Default to local
  return 'local';
}

// Run the script
processDemoCDRs();
