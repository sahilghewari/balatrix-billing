# Database Migrations and Seeders

This directory contains Sequelize migrations and seeders for the Balatrix Telecom Billing Backend.

## Migrations

Migrations are executed in order based on their timestamp prefix. The order is critical to respect foreign key constraints.

### Migration Order

1. **20241001000000-create-users.js** - Users table (no dependencies)
2. **20241001000001-create-customers.js** - Customers table (depends on users)
3. **20241001000002-create-rate-plans.js** - Rate plans table (no dependencies)
4. **20241001000003-create-accounts.js** - Accounts table (depends on customers)
5. **20241001000004-create-subscriptions.js** - Subscriptions table (depends on customers, accounts, rate_plans)
6. **20241001000005-create-cdrs.js** - CDRs table (depends on subscriptions, accounts)
7. **20241001000006-create-payments.js** - Payments table (depends on customers, accounts, subscriptions)
8. **20241001000007-create-invoices.js** - Invoices table (depends on customers, accounts, subscriptions)
9. **20241001000008-add-invoice-payment-fkey.js** - Add foreign key from payments to invoices (circular dependency resolution)
10. **20241001000009-create-dids.js** - DIDs table (depends on subscriptions)
11. **20241001000010-create-refresh-tokens.js** - Refresh tokens table (depends on users)
12. **20241001000011-create-payment-methods.js** - Payment methods table (depends on customers)
13. **20241001000012-create-subscription-usage.js** - Subscription usage table (depends on subscriptions)

## Running Migrations

### Development

```bash
# Run all pending migrations
npm run migrate

# Undo last migration
npm run migrate:undo

# Undo all migrations
npm run migrate:undo:all
```

### Production

```bash
# Always run migrations before starting the app
NODE_ENV=production npm run migrate
```

## Seeders

Seeders populate the database with initial data.

### Available Seeders

1. **20241001000000-admin-users.js** - Creates admin and support users
   - Admin: admin@balatrix.com / Admin@123
   - Support: support@balatrix.com / Admin@123

2. **20241001000001-rate-plans.js** - Creates default rate plans
   - Starter: ₹349/month (500 minutes)
   - Professional: ₹999/month (2000 minutes)
   - Call Center: ₹4999/month (10000 minutes)

3. **20241001000002-demo-customers.js** - Creates demo customers and subscriptions
   - 3 demo users with different business types
   - 3 accounts with balances
   - 3 active subscriptions

## Running Seeders

### Development

```bash
# Run all seeders
npm run seed

# Run specific seeder
npx sequelize-cli db:seed --seed 20241001000000-admin-users.js

# Undo all seeders
npx sequelize-cli db:seed:undo:all
```

### Production

**⚠️ WARNING: Never run demo customer seeders in production!**

Only run the admin and rate plan seeders in production:

```bash
# Admin users
npx sequelize-cli db:seed --seed 20241001000000-admin-users.js

# Rate plans
npx sequelize-cli db:seed --seed 20241001000001-rate-plans.js
```

## Creating New Migrations

```bash
# Generate a new migration file
npx sequelize-cli migration:generate --name migration-name
```

### Migration Template

```javascript
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Add your migration code here
  },

  down: async (queryInterface, Sequelize) => {
    // Add your rollback code here
  },
};
```

## Creating New Seeders

```bash
# Generate a new seeder file
npx sequelize-cli seed:generate --name seeder-name
```

### Seeder Template

```javascript
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.bulkInsert('table_name', [
      {
        // your data
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('table_name', null, {});
  },
};
```

## Best Practices

### Migrations

1. **Never modify existing migrations** - Create a new migration instead
2. **Always provide a `down` method** - For rollback capability
3. **Test migrations thoroughly** - Run up and down multiple times
4. **Add indexes** - For foreign keys and frequently queried columns
5. **Use transactions** - For complex migrations with multiple operations
6. **Document changes** - Add comments for complex migrations

### Seeders

1. **Use UUIDs consistently** - Use `uuidv4()` for primary keys
2. **Hash passwords** - Always hash passwords using bcrypt
3. **Set timestamps** - Always set createdAt and updatedAt
4. **Handle dependencies** - Run seeders in the correct order
5. **Make seeders idempotent** - Check for existing data before inserting
6. **Clean up in down method** - Remove exactly what was inserted

## Database Schema

### Core Tables

- **users** - User authentication and profiles
- **customers** - Customer information and billing details
- **accounts** - Customer accounts (prepaid/postpaid)
- **rate_plans** - Subscription plans and pricing
- **subscriptions** - Active subscriptions
- **cdrs** - Call Detail Records
- **payments** - Payment transactions
- **invoices** - Generated invoices
- **dids** - DID number inventory

### Supporting Tables

- **refresh_tokens** - JWT refresh tokens
- **payment_methods** - Saved payment methods
- **subscription_usage** - Usage tracking per billing period

## Troubleshooting

### Migration Failed

```bash
# Check migration status
npx sequelize-cli db:migrate:status

# Undo last migration
npm run migrate:undo

# Fix the migration file
# Run again
npm run migrate
```

### Seeder Failed

```bash
# Check what was inserted
# Undo seeder
npx sequelize-cli db:seed:undo --seed seeder-file-name.js

# Fix the seeder file
# Run again
npx sequelize-cli db:seed --seed seeder-file-name.js
```

### Foreign Key Constraint Error

This usually means:
1. Parent record doesn't exist
2. Wrong order of migrations
3. Wrong order of seeders

Solution:
- Check migration order
- Ensure parent records are created first
- Run migrations/seeders in dependency order

### Unique Constraint Violation

This usually means:
- Seeder was already run
- Duplicate data in seeder

Solution:
- Make seeders idempotent
- Check for existing data before inserting
- Use `bulkDelete` in down method

## Initial Setup

For a fresh database setup:

```bash
# 1. Create database
createdb telecom_billing_dev

# 2. Run migrations
npm run migrate

# 3. Run seeders
npm run seed

# 4. Verify
psql telecom_billing_dev -c "\dt"
```

You should see all 13 tables created and populated with initial data.

## Production Deployment

```bash
# 1. Backup existing database
pg_dump -Fc telecom_billing_prod > backup_$(date +%Y%m%d_%H%M%S).dump

# 2. Run migrations
NODE_ENV=production npm run migrate

# 3. Run production seeders only
NODE_ENV=production npx sequelize-cli db:seed --seed 20241001000000-admin-users.js
NODE_ENV=production npx sequelize-cli db:seed --seed 20241001000001-rate-plans.js

# 4. Verify
NODE_ENV=production npm start
```

## Default Credentials

After running seeders, use these credentials to log in:

### Admin Account
- **Email**: admin@balatrix.com
- **Password**: Admin@123
- **Role**: admin

### Support Account
- **Email**: support@balatrix.com
- **Password**: Admin@123
- **Role**: support

### Demo Customers (Development Only)
- **john.doe@example.com** / Demo@123
- **jane.smith@example.com** / Demo@123
- **admin@acmecorp.com** / Demo@123

**⚠️ IMPORTANT: Change all default passwords immediately after first login!**
