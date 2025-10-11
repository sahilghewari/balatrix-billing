'use strict';
const { v4: uuidv4 } = require('uuid');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const starterPlanId = uuidv4();
    const professionalPlanId = uuidv4();
    const callCenterPlanId = uuidv4();

    await queryInterface.bulkInsert('rate_plans', [
      {
        id: starterPlanId,
        name: 'Starter',
        description: 'Perfect for individuals and small teams getting started with VoIP',
        planType: 'prepaid',
        monthlyPrice: 349.00,
        annualPrice: 4008.00, // 4% discount (349 * 12 * 0.96)
        setupFee: 0,
        includedMinutes: 500,
        includedDIDs: 1,
        maxConcurrentCalls: 2,
        overageRatePerMinute: 0.50,
        didMonthlyRate: 99.00,
        features: JSON.stringify({
          voicemail: true,
          callForwarding: true,
          callRecording: false,
          ivr: false,
          analytics: 'basic',
          support: 'email',
          api: false,
        }),
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: professionalPlanId,
        name: 'Professional',
        description: 'Ideal for growing businesses with advanced features',
        planType: 'prepaid',
        monthlyPrice: 999.00,
        annualPrice: 11508.00, // 4% discount (999 * 12 * 0.96)
        setupFee: 0,
        includedMinutes: 2000,
        includedDIDs: 3,
        maxConcurrentCalls: 5,
        overageRatePerMinute: 0.40,
        didMonthlyRate: 79.00,
        features: JSON.stringify({
          voicemail: true,
          callForwarding: true,
          callRecording: true,
          ivr: true,
          analytics: 'advanced',
          support: 'email_chat',
          api: true,
          customGreeting: true,
          callQueuing: true,
        }),
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: callCenterPlanId,
        name: 'Call Center',
        description: 'Enterprise-grade solution for call centers and large teams',
        planType: 'postpaid',
        monthlyPrice: 4999.00,
        annualPrice: 49990.00, // 16.7% discount (4999 * 12 * 0.833)
        setupFee: 0,
        includedMinutes: 10000,
        includedDIDs: 10,
        maxConcurrentCalls: 25,
        overageRatePerMinute: 0.30,
        didMonthlyRate: 49.00,
        features: JSON.stringify({
          voicemail: true,
          callForwarding: true,
          callRecording: true,
          ivr: true,
          analytics: 'enterprise',
          support: '24x7_phone',
          api: true,
          customGreeting: true,
          callQueuing: true,
          autoDialer: true,
          crm: true,
          reporting: true,
          sla: '99.9%',
          dedicatedManager: true,
        }),
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);

    console.log('✅ Rate plans created successfully');
    console.log('📦 Starter Plan: ₹349/month (500 minutes)');
    console.log('📦 Professional Plan: ₹999/month (2000 minutes)');
    console.log('📦 Call Center Plan: ₹4999/month (10000 minutes)');
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('rate_plans', {
      name: {
        [Sequelize.Op.in]: ['Starter', 'Professional', 'Call Center'],
      },
    });
  },
};
