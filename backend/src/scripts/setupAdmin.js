/**
 * Setup Admin User
 * Creates an admin user for testing
 */

// Load environment variables first
require('dotenv').config();

const { sequelize } = require('../config/database');
const { User } = require('../models');
const bcrypt = require('bcryptjs');
const logger = require('../utils/logger');

async function setupAdmin() {
  try {
    logger.info('Setting up admin user...');

    // Hash password once
    const hashedPassword = await bcrypt.hash('Admin123!', 12);

    // Check if admin already exists
    const existingAdmin = await User.findOne({
      where: { email: 'admin@balatrix.com' }
    });

    if (existingAdmin) {
      logger.info('Admin user already exists, updating password...');
      // Use direct SQL to avoid model hooks that would double-hash the password
      await sequelize.query(
        'UPDATE users SET password = ?, "isEmailVerified" = true, "isActive" = true, "failedLoginAttempts" = 0, "lockedUntil" = null WHERE email = ?',
        {
          replacements: [hashedPassword, 'admin@balatrix.com'],
          type: sequelize.QueryTypes.UPDATE
        }
      );
      logger.info('Admin password and status updated');
      return;
    }

    const admin = await User.create({
      username: 'admin_' + Date.now(),
      email: 'admin@balatrix.com',
      password: hashedPassword,
      firstName: 'Admin',
      lastName: 'User',
      role: 'admin',
      isActive: true,
      isEmailVerified: true,
    });

    logger.info(`Admin user created: ${admin.email}`);
    logger.info('Admin login credentials:');
    logger.info('Email: admin@balatrix.com');
    logger.info('Password: Admin123!');

  } catch (error) {
    logger.error('Error setting up admin user:', error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  setupAdmin()
    .then(() => {
      logger.info('Admin setup completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('Admin setup failed:', error);
      process.exit(1);
    });
}

module.exports = { setupAdmin };