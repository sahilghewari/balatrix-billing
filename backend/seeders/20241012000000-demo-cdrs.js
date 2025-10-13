'use strict';
const { v4: uuidv4 } = require('uuid');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // First, find the user with email sahil@nexaworks.tech
    const users = await queryInterface.sequelize.query(
      `SELECT id FROM users WHERE email = 'sahil@nexaworks.tech' LIMIT 1;`,
      { type: Sequelize.QueryTypes.SELECT }
    );

    if (users.length === 0) {
      console.log('User sahil@nexaworks.tech not found. Skipping CDR seeding.');
      return;
    }

    const userId = users[0].id;

    // Find the customer for this user
    const customers = await queryInterface.sequelize.query(
      `SELECT id FROM customers WHERE "userId" = :userId LIMIT 1;`,
      {
        replacements: { userId },
        type: Sequelize.QueryTypes.SELECT,
      }
    );

    if (customers.length === 0) {
      console.log('Customer not found for user. Skipping CDR seeding.');
      return;
    }

    const customerId = customers[0].id;

    // Find the active subscription for this customer
    const subscriptions = await queryInterface.sequelize.query(
      `SELECT id, "accountId" FROM subscriptions WHERE "customerId" = :customerId AND status = 'active' LIMIT 1;`,
      {
        replacements: { customerId },
        type: Sequelize.QueryTypes.SELECT,
      }
    );

    if (subscriptions.length === 0) {
      console.log('No active subscription found. Skipping CDR seeding.');
      return;
    }

    const subscriptionId = subscriptions[0].id;
    const accountId = subscriptions[0].accountId;

    console.log(`Creating demo CDRs for user: ${userId}, subscription: ${subscriptionId}`);

    // Generate demo CDR data
    const now = new Date();
    const cdrs = [];

    // Create 25 demo calls with varying types and durations
    const callScenarios = [
      // Local calls (10 calls, ~15 minutes total)
      { type: 'local', calledNumber: '+912012345601', duration: 60, billsec: 55, minutes: 1 },
      { type: 'local', calledNumber: '+912012345602', duration: 120, billsec: 115, minutes: 2 },
      { type: 'local', calledNumber: '+912012345603', duration: 90, billsec: 85, minutes: 2 },
      { type: 'local', calledNumber: '+912012345604', duration: 45, billsec: 40, minutes: 1 },
      { type: 'local', calledNumber: '+912012345605', duration: 180, billsec: 175, minutes: 3 },
      { type: 'local', calledNumber: '+912012345606', duration: 75, billsec: 70, minutes: 2 },
      { type: 'local', calledNumber: '+912012345607', duration: 150, billsec: 145, minutes: 3 },
      { type: 'local', calledNumber: '+912012345608', duration: 30, billsec: 25, minutes: 1 },
      { type: 'local', calledNumber: '+912012345609', duration: 95, billsec: 90, minutes: 2 },
      { type: 'local', calledNumber: '+912012345610', duration: 110, billsec: 105, minutes: 2 },

      // Mobile calls (10 calls, ~20 minutes total)
      { type: 'mobile', calledNumber: '+919876543210', duration: 180, billsec: 175, minutes: 3 },
      { type: 'mobile', calledNumber: '+918765432109', duration: 240, billsec: 235, minutes: 4 },
      { type: 'mobile', calledNumber: '+917654321098', duration: 150, billsec: 145, minutes: 3 },
      { type: 'mobile', calledNumber: '+919123456789', duration: 90, billsec: 85, minutes: 2 },
      { type: 'mobile', calledNumber: '+918234567890', duration: 120, billsec: 115, minutes: 2 },
      { type: 'mobile', calledNumber: '+917345678901', duration: 200, billsec: 195, minutes: 4 },
      { type: 'mobile', calledNumber: '+919456789012', duration: 60, billsec: 55, minutes: 1 },
      { type: 'mobile', calledNumber: '+918567890123', duration: 135, billsec: 130, minutes: 3 },
      { type: 'mobile', calledNumber: '+917678901234', duration: 75, billsec: 70, minutes: 2 },
      { type: 'mobile', calledNumber: '+919789012345', duration: 105, billsec: 100, minutes: 2 },

      // STD calls (3 calls, ~8 minutes total)
      { type: 'std', calledNumber: '+910221234567', duration: 180, billsec: 175, minutes: 3 },
      { type: 'std', calledNumber: '+910801234567', duration: 150, billsec: 145, minutes: 3 },
      { type: 'std', calledNumber: '+910331234567', duration: 120, billsec: 115, minutes: 2 },

      // ISD calls (2 calls, ~5 minutes total)
      { type: 'isd', calledNumber: '+14155551234', duration: 180, billsec: 175, minutes: 3 },
      { type: 'isd', calledNumber: '+442071234567', duration: 120, billsec: 115, minutes: 2 },
    ];

    callScenarios.forEach((scenario, index) => {
      const callTime = new Date(now.getTime() - (24 - index) * 60 * 60 * 1000); // Spread over last 24 hours
      const endTime = new Date(callTime.getTime() + scenario.billsec * 1000);

      cdrs.push({
        id: uuidv4(),
        uuid: `demo-${uuidv4()}`,
        subscriptionId,
        accountId,
        callerId: '+919876543210', // User's number
        destination: scenario.calledNumber,
        callDirection: 'outbound',
        callType: scenario.type,
        callStatus: 'answered',
        startTime: callTime,
        endTime: endTime,
        duration: scenario.duration,
        billableSeconds: scenario.billsec,
        hangupCause: 'NORMAL_CLEARING',
        cost: scenario.minutes * 1.99, // Using default rate
        processingStatus: 'processed',
        createdAt: callTime,
        updatedAt: callTime,
      });
    });

    // Insert CDRs
    await queryInterface.bulkInsert('cdrs', cdrs);

    console.log(`✅ Created ${cdrs.length} demo CDRs successfully!`);
    console.log(`📊 Total minutes: ~48 minutes (Local: 19, Mobile: 26, STD: 8, ISD: 5)`);
    console.log(`💡 Note: Run the CDR processor to update SubscriptionUsage or use the manual update script below`);
    
    return cdrs;
  },

  down: async (queryInterface, Sequelize) => {
    // Remove demo CDRs (those with uuid starting with 'demo-')
    await queryInterface.sequelize.query(
      `DELETE FROM cdrs WHERE uuid LIKE 'demo-%';`
    );
    console.log('Demo CDRs removed.');
  },
};
