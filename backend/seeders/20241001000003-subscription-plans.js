'use strict';

const { v4: uuidv4 } = require('uuid');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const now = new Date();
    
    const ratePlans = [
      // STARTER PLAN
      {
        id: uuidv4(),
        name: 'Starter Plan',
        plan_code: 'STARTER_MONTHLY',
        planName: 'Starter - Monthly',
        planType: 'starter',
        monthlyPrice: 349.00,
        annualPrice: 3349.00, // 20% discount: 349 * 12 * 0.8 = 3349
        currency: 'INR',
        features: JSON.stringify({
          tollFreeNumbers: 1,
          freeMinutes: 100,
          extensions: 2,
          perMinuteCharge: 1.99,
          support: 'Email',
          callRecording: true,
          basicAnalytics: true,
        }),
        limits: JSON.stringify({
          maxTollFreeNumbers: 1,
          maxExtensions: 2,
          monthlyMinuteAllowance: 100,
        }),
        billingCycle: 'monthly',
        trialDays: 7,
        setupFee: 0.00,
        isActive: true,
        isPublic: true,
        displayOrder: 1,
        description: 'Perfect for startups and small businesses just getting started with toll-free numbers',
        metadata: JSON.stringify({
          recommended: false,
          popular: false,
          badge: null,
          features: [
            '1 Toll-Free Number',
            '100 Free Minutes',
            '2 Extensions',
            '₹1.99/minute after limit',
            'Email Support',
            'Call Recording',
            'Basic Analytics',
          ],
          addons: {
            tfnCharge: { payAsYouGo: 1.00, oneTime: 199.00 },
            extensionCharge: { payAsYouGo: 1.00, oneTime: 99.00 },
            perMinuteCharge: 1.99,
          }
        }),
        createdAt: now,
        updatedAt: now,
      },
      
      // PROFESSIONAL PLAN
      {
        id: uuidv4(),
        name: 'Professional Plan',
        plan_code: 'PROFESSIONAL_MONTHLY',
        planName: 'Professional - Monthly',
        planType: 'professional',
        monthlyPrice: 999.00,
        annualPrice: 9590.00, // 20% discount: 999 * 12 * 0.8 = 9590
        currency: 'INR',
        features: JSON.stringify({
          tollFreeNumbers: 2,
          freeMinutes: 500,
          extensions: 10,
          perMinuteCharge: 1.60,
          support: 'Priority Email & Chat',
          callRecording: true,
          advancedAnalytics: true,
          callRouting: true,
          ivr: true,
        }),
        limits: JSON.stringify({
          maxTollFreeNumbers: 2,
          maxExtensions: 10,
          monthlyMinuteAllowance: 500,
        }),
        billingCycle: 'monthly',
        trialDays: 14,
        setupFee: 0.00,
        isActive: true,
        isPublic: true,
        displayOrder: 2,
        description: 'Ideal for growing businesses with moderate call volumes',
        metadata: JSON.stringify({
          recommended: true,
          popular: true,
          badge: 'Most Popular',
          features: [
            '2 Toll-Free Numbers',
            '500 Free Minutes',
            '10 Extensions',
            '₹1.60/minute after limit',
            'Priority Support',
            'Advanced Analytics',
            'IVR System',
            'Call Routing',
            'Call Recording',
          ],
          addons: {
            tfnCharge: { payAsYouGo: 1.00, oneTime: 199.00 },
            extensionCharge: { payAsYouGo: 1.00, oneTime: 99.00 },
            perMinuteCharge: 1.60,
          }
        }),
        createdAt: now,
        updatedAt: now,
      },
      
      // CALL CENTER PLAN
      {
        id: uuidv4(),
        name: 'Call Center Plan',
        plan_code: 'CALLCENTER_MONTHLY',
        planName: 'Call Center - Monthly',
        planType: 'callCenter',
        monthlyPrice: 4999.00,
        annualPrice: 47990.00, // 20% discount: 4999 * 12 * 0.8 = 47990
        currency: 'INR',
        features: JSON.stringify({
          tollFreeNumbers: 5,
          freeMinutes: 1500,
          extensions: 50,
          perMinuteCharge: 1.45,
          support: '24/7 Phone & Chat',
          callRecording: true,
          advancedAnalytics: true,
          callRouting: true,
          ivr: true,
          queueManagement: true,
          reporting: true,
          api: true,
        }),
        limits: JSON.stringify({
          maxTollFreeNumbers: 5,
          maxExtensions: 50,
          monthlyMinuteAllowance: 1500,
        }),
        billingCycle: 'monthly',
        trialDays: 30,
        setupFee: 0.00,
        isActive: true,
        isPublic: true,
        displayOrder: 3,
        description: 'Enterprise-grade solution for call centers and high-volume businesses',
        metadata: JSON.stringify({
          recommended: false,
          popular: false,
          badge: 'Enterprise',
          features: [
            '5 Toll-Free Numbers',
            '1500 Free Minutes',
            '50 Extensions',
            '₹1.45/minute after limit',
            '24/7 Support',
            'Advanced Analytics',
            'IVR System',
            'Call Routing',
            'Queue Management',
            'Detailed Reporting',
            'API Access',
          ],
          addons: {
            tfnCharge: { payAsYouGo: 1.00, oneTime: 199.00 },
            extensionCharge: { payAsYouGo: 1.00, oneTime: 99.00 },
            perMinuteCharge: 1.45,
          }
        }),
        createdAt: now,
        updatedAt: now,
      },
    ];

    await queryInterface.bulkInsert('rate_plans', ratePlans, {});
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('rate_plans', {
      plan_code: {
        [Sequelize.Op.in]: ['STARTER_MONTHLY', 'PROFESSIONAL_MONTHLY', 'CALLCENTER_MONTHLY'],
      },
    }, {});
  },
};
