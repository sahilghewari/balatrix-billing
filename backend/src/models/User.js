/**
 * User Model
 * System users (admins, support staff, customers)
 */

const { DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');
const { sequelize } = require('../config/database');
const { USER_ROLES } = require('../utils/constants');

const User = sequelize.define(
  'User',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    username: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
      },
    },
    password: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        len: [12, 255],
      },
    },
    firstName: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    lastName: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    phoneNumber: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    role: {
      type: DataTypes.ENUM(...Object.values(USER_ROLES)),
      allowNull: false,
      defaultValue: USER_ROLES.CUSTOMER,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    isEmailVerified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    lastLoginAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    failedLoginAttempts: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    lockedUntil: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    mfaEnabled: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  },
  {
    tableName: 'users',
    timestamps: true,
    paranoid: false, // Database doesn't have deletedAt column
    hooks: {
      beforeCreate: async (user) => {
        if (user.password) {
          const salt = await bcrypt.genSalt(parseInt(process.env.BCRYPT_ROUNDS, 10) || 12);
          user.password = await bcrypt.hash(user.password, salt);
        }
      },
      beforeUpdate: async (user) => {
        if (user.changed('password')) {
          const salt = await bcrypt.genSalt(parseInt(process.env.BCRYPT_ROUNDS, 10) || 12);
          user.password = await bcrypt.hash(user.password, salt);
        }
      },
    },
    indexes: [
      { fields: ['email'] },
      { fields: ['role'] },
      { fields: ['isActive'] },
      { fields: ['createdAt'] },
    ],
  }
);

// Instance methods
User.prototype.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

User.prototype.isAccountLocked = function () {
  return this.lockedUntil && this.lockedUntil > new Date();
};

User.prototype.incrementFailedLoginAttempts = async function () {
  this.failedLoginAttempts += 1;

  const maxAttempts = parseInt(process.env.MAX_LOGIN_ATTEMPTS, 10) || 5;
  if (this.failedLoginAttempts >= maxAttempts) {
    const lockoutDuration = parseInt(process.env.LOCKOUT_DURATION, 10) || 900000; // 15 minutes
    this.lockedUntil = new Date(Date.now() + lockoutDuration);
  }

  await this.save();
};

User.prototype.resetFailedLoginAttempts = async function () {
  this.failedLoginAttempts = 0;
  this.lockedUntil = null;
  await this.save();
};

User.prototype.toJSON = function () {
  const values = { ...this.get() };
  delete values.password;
  return values;
};

module.exports = User;
