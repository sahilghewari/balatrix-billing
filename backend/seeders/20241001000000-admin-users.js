'use strict';
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const adminId = uuidv4();
    const hashedPassword = await bcrypt.hash('Admin@123', 12);

    await queryInterface.bulkInsert('users', [
      {
        id: adminId,
        username: 'admin',
        email: 'admin@balatrix.com',
        password: hashedPassword,
        firstName: 'System',
        lastName: 'Administrator',
        phoneNumber: '+919876543210',
        role: 'admin',
        isActive: true,
        isEmailVerified: true,
        isPhoneVerified: true,
        mfaEnabled: false,
        passwordChangedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: uuidv4(),
        username: 'support',
        email: 'support@balatrix.com',
        password: hashedPassword,
        firstName: 'Support',
        lastName: 'Team',
        phoneNumber: '+919876543211',
        role: 'support',
        isActive: true,
        isEmailVerified: true,
        isPhoneVerified: true,
        mfaEnabled: false,
        passwordChangedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);

    console.log('✅ Admin and Support users created');
    console.log('📧 Admin Email: admin@balatrix.com');
    console.log('🔑 Admin Password: Admin@123');
    console.log('📧 Support Email: support@balatrix.com');
    console.log('🔑 Support Password: Admin@123');
    console.log('⚠️  Please change these passwords after first login!');
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('users', {
      email: {
        [Sequelize.Op.in]: ['admin@balatrix.com', 'support@balatrix.com'],
      },
    });
  },
};
