/**
 * Customer Service
 * Business logic for customer management
 */

const { sequelize } = require('../config/database');
const {
  Customer,
  User,
  Account,
  Subscription,
  RatePlan,
  Payment,
  Invoice,
} = require('../models');
const {
  NotFoundError,
  ValidationError,
  BusinessLogicError,
} = require('../utils/errors');
const logger = require('../utils/logger');
const { CUSTOMER_STATUS, ACCOUNT_TYPE } = require('../utils/constants');
const { Op } = require('sequelize');

class CustomerService {
  /**
   * Create a new customer
   */
  async createCustomer(customerData, userId) {
    const transaction = await sequelize.transaction();

    try {
      // Create customer
      const customer = await Customer.create(
        {
          ...customerData,
          userId,
          status: CUSTOMER_STATUS.ACTIVE,
        },
        { transaction }
      );

      // Create default prepaid account
      const account = await Account.create(
        {
          customerId: customer.id,
          accountType: ACCOUNT_TYPE.PREPAID,
          balance: 0,
          status: 'active',
        },
        { transaction }
      );

      await transaction.commit();

      logger.info('Customer created', {
        customerId: customer.id,
        userId,
        companyName: customer.companyName,
      });

      // Return customer with account
      return await this.getCustomerById(customer.id);
    } catch (error) {
      await transaction.rollback();
      logger.error('Failed to create customer', { error: error.message, userId });
      throw error;
    }
  }

  /**
   * Get customer by ID
   */
  async getCustomerById(customerId, options = {}) {
    const { includeAccounts = true, includeSubscriptions = true } = options;

    const include = [
      {
        model: User,
        as: 'user',
        attributes: ['id', 'email', 'firstName', 'lastName', 'phoneNumber'],
      },
    ];

    if (includeAccounts) {
      include.push({
        model: Account,
        as: 'accounts',
      });
    }

    if (includeSubscriptions) {
      include.push({
        model: Subscription,
        as: 'subscriptions',
        include: [
          {
            model: RatePlan,
            as: 'ratePlan',
          },
        ],
      });
    }

    const customer = await Customer.findByPk(customerId, { include });

    if (!customer) {
      throw new NotFoundError('Customer not found');
    }

    return customer;
  }

  /**
   * Get all customers with pagination and filtering
   */
  async getAllCustomers(options = {}) {
    const {
      page = 1,
      limit = 20,
      status,
      search,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
    } = options;

    const offset = (page - 1) * limit;

    // Build where clause
    const where = {};

    if (status) {
      where.status = status;
    }

    if (search) {
      where[Op.or] = [
        { companyName: { [Op.iLike]: `%${search}%` } },
        { displayName: { [Op.iLike]: `%${search}%` } },
        { gstin: { [Op.iLike]: `%${search}%` } },
      ];
    }

    const { count, rows: customers } = await Customer.findAndCountAll({
      where,
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'email', 'firstName', 'lastName'],
        },
        {
          model: Account,
          as: 'accounts',
          attributes: ['id', 'accountType', 'balance', 'status'],
        },
      ],
      limit,
      offset,
      order: [[sortBy, sortOrder]],
    });

    return {
      customers,
      pagination: {
        total: count,
        page,
        limit,
        totalPages: Math.ceil(count / limit),
      },
    };
  }

  /**
   * Update customer
   */
  async updateCustomer(customerId, updateData) {
    const customer = await Customer.findByPk(customerId);

    if (!customer) {
      throw new NotFoundError('Customer not found');
    }

    // Update customer
    await customer.update(updateData);

    logger.info('Customer updated', {
      customerId,
      updatedFields: Object.keys(updateData),
    });

    return await this.getCustomerById(customerId);
  }

  /**
   * Suspend customer
   */
  async suspendCustomer(customerId, reason) {
    const transaction = await sequelize.transaction();

    try {
      const customer = await Customer.findByPk(customerId, {
        include: [{ model: Account, as: 'accounts' }],
        transaction,
      });

      if (!customer) {
        throw new NotFoundError('Customer not found');
      }

      // Suspend customer
      await customer.suspend(transaction);

      // Suspend all accounts
      for (const account of customer.accounts) {
        account.status = 'suspended';
        await account.save({ transaction });
      }

      await transaction.commit();

      logger.warn('Customer suspended', {
        customerId,
        reason,
        accountsAffected: customer.accounts.length,
      });

      return await this.getCustomerById(customerId);
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Activate customer
   */
  async activateCustomer(customerId) {
    const transaction = await sequelize.transaction();

    try {
      const customer = await Customer.findByPk(customerId, {
        include: [{ model: Account, as: 'accounts' }],
        transaction,
      });

      if (!customer) {
        throw new NotFoundError('Customer not found');
      }

      // Activate customer
      await customer.activate(transaction);

      // Activate all accounts
      for (const account of customer.accounts) {
        account.status = 'active';
        await account.save({ transaction });
      }

      await transaction.commit();

      logger.info('Customer activated', {
        customerId,
        accountsAffected: customer.accounts.length,
      });

      return await this.getCustomerById(customerId);
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Delete customer (soft delete)
   */
  async deleteCustomer(customerId) {
    const customer = await Customer.findByPk(customerId, {
      include: [
        { model: Account, as: 'accounts' },
        { model: Subscription, as: 'subscriptions' },
      ],
    });

    if (!customer) {
      throw new NotFoundError('Customer not found');
    }

    // Check if customer has active subscriptions
    const activeSubscriptions = customer.subscriptions.filter(
      (sub) => sub.status === 'active'
    );

    if (activeSubscriptions.length > 0) {
      throw new BusinessLogicError(
        'Cannot delete customer with active subscriptions. Please cancel all subscriptions first.'
      );
    }

    // Soft delete
    await customer.destroy();

    logger.info('Customer deleted', { customerId });

    return { message: 'Customer deleted successfully' };
  }

  /**
   * Get customer statistics
   */
  async getCustomerStatistics(customerId) {
    const customer = await Customer.findByPk(customerId, {
      include: [
        { model: Account, as: 'accounts' },
        { model: Subscription, as: 'subscriptions' },
      ],
    });

    if (!customer) {
      throw new NotFoundError('Customer not found');
    }

    // Get payment statistics
    const payments = await Payment.findAll({
      where: { customerId },
      attributes: [
        [sequelize.fn('COUNT', sequelize.col('id')), 'totalPayments'],
        [sequelize.fn('SUM', sequelize.col('amount')), 'totalAmount'],
        [
          sequelize.fn(
            'SUM',
            sequelize.literal("CASE WHEN status = 'success' THEN amount ELSE 0 END")
          ),
          'successfulAmount',
        ],
      ],
      raw: true,
    });

    // Get invoice statistics
    const invoices = await Invoice.findAll({
      where: { customerId },
      attributes: [
        [sequelize.fn('COUNT', sequelize.col('id')), 'totalInvoices'],
        [sequelize.fn('SUM', sequelize.col('totalAmount')), 'totalInvoiceAmount'],
        [
          sequelize.fn(
            'COUNT',
            sequelize.literal("CASE WHEN status = 'paid' THEN 1 END")
          ),
          'paidInvoices',
        ],
        [
          sequelize.fn(
            'COUNT',
            sequelize.literal("CASE WHEN status = 'overdue' THEN 1 END")
          ),
          'overdueInvoices',
        ],
      ],
      raw: true,
    });

    return {
      customer: {
        id: customer.id,
        companyName: customer.companyName,
        status: customer.status,
        createdAt: customer.createdAt,
      },
      accounts: customer.accounts.map((acc) => ({
        id: acc.id,
        accountType: acc.accountType,
        balance: acc.balance,
        status: acc.status,
      })),
      subscriptions: {
        total: customer.subscriptions.length,
        active: customer.subscriptions.filter((s) => s.status === 'active').length,
        suspended: customer.subscriptions.filter((s) => s.status === 'suspended').length,
      },
      payments: payments[0] || {
        totalPayments: 0,
        totalAmount: 0,
        successfulAmount: 0,
      },
      invoices: invoices[0] || {
        totalInvoices: 0,
        totalInvoiceAmount: 0,
        paidInvoices: 0,
        overdueInvoices: 0,
      },
    };
  }

  /**
   * Get customer accounts
   */
  async getCustomerAccounts(customerId) {
    const customer = await Customer.findByPk(customerId);

    if (!customer) {
      throw new NotFoundError('Customer not found');
    }

    const accounts = await Account.findAll({
      where: { customerId },
      order: [['createdAt', 'ASC']],
    });

    return accounts;
  }

  /**
   * Create additional account for customer
   */
  async createAccount(customerId, accountData) {
    const customer = await Customer.findByPk(customerId);

    if (!customer) {
      throw new NotFoundError('Customer not found');
    }

    const account = await Account.create({
      customerId,
      ...accountData,
      status: 'active',
    });

    logger.info('Account created for customer', {
      customerId,
      accountId: account.id,
      accountType: account.accountType,
    });

    return account;
  }

  /**
   * Get customer by user ID
   */
  async getCustomerByUserId(userId) {
    const customer = await Customer.findOne({
      where: { userId },
      include: [
        {
          model: Account,
          as: 'accounts',
        },
        {
          model: Subscription,
          as: 'subscriptions',
          include: [
            {
              model: RatePlan,
              as: 'ratePlan',
            },
          ],
        },
      ],
    });

    if (!customer) {
      throw new NotFoundError('Customer not found for this user');
    }

    return customer;
  }

  /**
   * Search customers
   */
  async searchCustomers(searchTerm) {
    const customers = await Customer.findAll({
      where: {
        [Op.or]: [
          { companyName: { [Op.iLike]: `%${searchTerm}%` } },
          { displayName: { [Op.iLike]: `%${searchTerm}%` } },
          { gstin: { [Op.iLike]: `%${searchTerm}%` } },
          { pan: { [Op.iLike]: `%${searchTerm}%` } },
        ],
      },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'email', 'firstName', 'lastName'],
        },
      ],
      limit: 20,
    });

    return customers;
  }
}

module.exports = new CustomerService();
