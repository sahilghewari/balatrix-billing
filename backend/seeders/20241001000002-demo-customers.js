'use strict';
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Create demo users
    const demoUser1Id = uuidv4();
    const demoUser2Id = uuidv4();
    const demoUser3Id = uuidv4();
    
    const hashedPassword = await bcrypt.hash('Demo@123', 12);

    await queryInterface.bulkInsert('users', [
      {
        id: demoUser1Id,
        username: 'john.doe',
        email: 'john.doe@example.com',
        password: hashedPassword,
        firstName: 'John',
        lastName: 'Doe',
        phoneNumber: '+919876543212',
        role: 'customer',
        isActive: true,
        isEmailVerified: true,
        isPhoneVerified: true,
        mfaEnabled: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: demoUser2Id,
        username: 'jane.smith',
        email: 'jane.smith@example.com',
        password: hashedPassword,
        firstName: 'Jane',
        lastName: 'Smith',
        phoneNumber: '+919876543213',
        role: 'customer',
        isActive: true,
        isEmailVerified: true,
        isPhoneVerified: false,
        mfaEnabled: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: demoUser3Id,
        username: 'acme.corp',
        email: 'admin@acmecorp.com',
        password: hashedPassword,
        firstName: 'Robert',
        lastName: 'Johnson',
        phoneNumber: '+919876543214',
        role: 'customer',
        isActive: true,
        isEmailVerified: true,
        isPhoneVerified: true,
        mfaEnabled: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);

    // Create demo customers
    const demoCustomer1Id = uuidv4();
    const demoCustomer2Id = uuidv4();
    const demoCustomer3Id = uuidv4();

    await queryInterface.bulkInsert('customers', [
      {
        id: demoCustomer1Id,
        userId: demoUser1Id,
        tenantId: '5a98f0ca-b2ef-478a-8d7c-85e6f61aa7ea',
        companyName: null,
        businessType: 'individual',
        gstin: null,
        pan: 'ABCDE1234F',
        billingAddress: '123 MG Road',
        billingCity: 'Bangalore',
        billingState: 'Karnataka',
        billingCountry: 'India',
        billingPincode: '560001',
        status: 'active',
        creditLimit: 0,
        kycStatus: 'verified',
        taxExempt: false,
        notes: 'Demo customer - Individual user',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: demoCustomer2Id,
        userId: demoUser2Id,
        tenantId: '5a98f0ca-b2ef-478a-8d7c-85e6f61aa7ea',
        companyName: 'Smith Consulting',
        businessType: 'small_business',
        gstin: '29ABCDE1234F1Z5',
        pan: 'ABCDE1234G',
        billingAddress: '456 Park Street',
        billingCity: 'Mumbai',
        billingState: 'Maharashtra',
        billingCountry: 'India',
        billingPincode: '400001',
        status: 'active',
        creditLimit: 5000,
        kycStatus: 'verified',
        taxExempt: false,
        notes: 'Demo customer - Small business',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: demoCustomer3Id,
        userId: demoUser3Id,
        tenantId: '5a98f0ca-b2ef-478a-8d7c-85e6f61aa7ea',
        companyName: 'Acme Corporation',
        businessType: 'enterprise',
        gstin: '07ABCDE1234F1Z5',
        pan: 'ABCDE1234H',
        billingAddress: '789 Sector 18',
        billingCity: 'Gurugram',
        billingState: 'Haryana',
        billingCountry: 'India',
        billingPincode: '122001',
        status: 'active',
        creditLimit: 50000,
        kycStatus: 'verified',
        taxExempt: false,
        notes: 'Demo customer - Enterprise',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);

    // Create demo accounts
    const demoAccount1Id = uuidv4();
    const demoAccount2Id = uuidv4();
    const demoAccount3Id = uuidv4();

    await queryInterface.bulkInsert('accounts', [
      {
        id: demoAccount1Id,
        customerId: demoCustomer1Id,
        tenantId: '5a98f0ca-b2ef-478a-8d7c-85e6f61aa7ea',
        accountNumber: 'ACC-10001',
        accountType: 'prepaid',
        balance: 500.00,
        creditLimit: 0,
        status: 'active',
        currency: 'INR',
        billingCycle: 'monthly',
        billingDay: 1,
        autoRecharge: false,
        lowBalanceAlert: true,
        lowBalanceThreshold: 100.00,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: demoAccount2Id,
        customerId: demoCustomer2Id,
        tenantId: '5a98f0ca-b2ef-478a-8d7c-85e6f61aa7ea',
        accountNumber: 'ACC-10002',
        accountType: 'prepaid',
        balance: 2000.00,
        creditLimit: 5000,
        status: 'active',
        currency: 'INR',
        billingCycle: 'monthly',
        billingDay: 1,
        autoRecharge: true,
        autoRechargeAmount: 1000.00,
        autoRechargeThreshold: 500.00,
        lowBalanceAlert: true,
        lowBalanceThreshold: 500.00,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: demoAccount3Id,
        customerId: demoCustomer3Id,
        tenantId: '5a98f0ca-b2ef-478a-8d7c-85e6f61aa7ea',
        accountNumber: 'ACC-10003',
        accountType: 'postpaid',
        balance: 0,
        creditLimit: 50000,
        status: 'active',
        currency: 'INR',
        billingCycle: 'monthly',
        billingDay: 1,
        autoRecharge: false,
        lowBalanceAlert: false,
        lowBalanceThreshold: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);

    // Get rate plan IDs (from previous seeder)
    const [ratePlans] = await queryInterface.sequelize.query(
      `SELECT id, name FROM rate_plans WHERE name IN ('Starter', 'Professional', 'Call Center')`
    );

    const starterPlan = ratePlans.find(p => p.name === 'Starter');
    const professionalPlan = ratePlans.find(p => p.name === 'Professional');
    const callCenterPlan = ratePlans.find(p => p.name === 'Call Center');

    // Create demo subscriptions
    const now = new Date();
    const oneMonthLater = new Date(now);
    oneMonthLater.setMonth(oneMonthLater.getMonth() + 1);

    await queryInterface.bulkInsert('subscriptions', [
      {
        id: uuidv4(),
        customerId: demoCustomer1Id,
        tenantId: '5a98f0ca-b2ef-478a-8d7c-85e6f61aa7ea',
        accountId: demoAccount1Id,
        planId: starterPlan.id,
        subscriptionNumber: 'SUB-10001',
        status: 'active',
        billingCycle: 'monthly',
        startDate: now,
        endDate: null,
        nextBillingDate: oneMonthLater,
        currentPeriodStart: now,
        currentPeriodEnd: oneMonthLater,
        autoRenew: true,
        cancelAtPeriodEnd: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: uuidv4(),
        customerId: demoCustomer2Id,
        tenantId: '5a98f0ca-b2ef-478a-8d7c-85e6f61aa7ea',
        accountId: demoAccount2Id,
        planId: professionalPlan.id,
        subscriptionNumber: 'SUB-10002',
        status: 'active',
        billingCycle: 'annual',
        startDate: now,
        endDate: null,
        nextBillingDate: new Date(now.setFullYear(now.getFullYear() + 1)),
        currentPeriodStart: now,
        currentPeriodEnd: new Date(now.setFullYear(now.getFullYear() + 1)),
        autoRenew: true,
        cancelAtPeriodEnd: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: uuidv4(),
        customerId: demoCustomer3Id,
        tenantId: '5a98f0ca-b2ef-478a-8d7c-85e6f61aa7ea',
        accountId: demoAccount3Id,
        planId: callCenterPlan.id,
        subscriptionNumber: 'SUB-10003',
        status: 'active',
        billingCycle: 'monthly',
        startDate: now,
        endDate: null,
        nextBillingDate: oneMonthLater,
        currentPeriodStart: now,
        currentPeriodEnd: oneMonthLater,
        autoRenew: true,
        cancelAtPeriodEnd: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);

    console.log('✅ Demo customers created successfully');
    console.log('👤 Demo User 1: john.doe@example.com (Password: Demo@123)');
    console.log('👤 Demo User 2: jane.smith@example.com (Password: Demo@123)');
    console.log('👤 Demo User 3: admin@acmecorp.com (Password: Demo@123)');
    console.log('💳 3 Accounts created with balances');
    console.log('📦 3 Active subscriptions created');
  },

  down: async (queryInterface, Sequelize) => {
    // Delete in reverse order due to foreign keys
    await queryInterface.bulkDelete('subscriptions', {
      subscriptionNumber: {
        [Sequelize.Op.in]: ['SUB-10001', 'SUB-10002', 'SUB-10003'],
      },
    });

    await queryInterface.bulkDelete('accounts', {
      accountNumber: {
        [Sequelize.Op.in]: ['ACC-10001', 'ACC-10002', 'ACC-10003'],
      },
    });

    await queryInterface.bulkDelete('customers', {});

    await queryInterface.bulkDelete('users', {
      email: {
        [Sequelize.Op.in]: ['john.doe@example.com', 'jane.smith@example.com', 'admin@acmecorp.com'],
      },
    });
  },
};
