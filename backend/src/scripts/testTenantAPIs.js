/**
 * Test Tenant APIs
 * Simple script to test the tenant endpoints
 */

// Load environment variables first
require('dotenv').config();

const axios = require('axios');
const logger = require('../utils/logger');

const API_BASE = 'http://localhost:3000/api';

async function testTenantAPIs() {
  try {
    logger.info('Testing Tenant APIs...');

    // Skip login for now - using modified routes without auth
    const headers = {
      'Content-Type': 'application/json',
    };

    // Create a tenant
    logger.info('Creating a tenant...');
    const tenantResponse = await axios.post(`${API_BASE}/tenants`, {
      name: 'TestTenant',
      description: 'A test tenant for toll-free management',
      domain: 'test.balatrix.com',
    }, { headers });

    const tenant = tenantResponse.data.data;
    logger.info(`Tenant created: ${tenant.name} (ID: ${tenant.id})`);

    // Get all tenants
    logger.info('Getting all tenants...');
    const tenantsResponse = await axios.get(`${API_BASE}/tenants`, { headers });
    logger.info(`Found ${tenantsResponse.data.data.tenants.length} tenants`);

    // Create an extension
    logger.info('Creating an extension...');
    const extensionResponse = await axios.post(`${API_BASE}/tenants/${tenant.id}/extensions`, {
      extension: '1001',
      password: 'testpass123',
      displayName: 'Test Extension',
    }, { headers });

    const extension = extensionResponse.data.data;
    logger.info(`Extension created: ${extension.extension}`);

    // Get tenant extensions
    logger.info('Getting tenant extensions...');
    const extensionsResponse = await axios.get(`${API_BASE}/tenants/${tenant.id}/extensions`, { headers });
    logger.info(`Found ${extensionsResponse.data.data.length} extensions`);

    // Assign a toll-free number
    logger.info('Assigning toll-free number...');
    const numberResponse = await axios.post(`${API_BASE}/tenants/${tenant.id}/numbers`, {
      number: '18001234567',
      provider: 'balatrix',
      monthlyCost: 10.00,
      perMinuteCost: 0.02,
    }, { headers });

    const tollFreeNumber = numberResponse.data.data;
    logger.info(`Toll-free number assigned: ${tollFreeNumber.number}`);

    // Create routing rule
    logger.info('Creating routing rule...');
    const ruleResponse = await axios.post(`${API_BASE}/tenants/${tenant.id}/routing-rules`, {
      tollFreeNumberId: tollFreeNumber.id,
      ruleType: 'extension',
      priority: 1,
      actions: {
        extensionId: extension.id,
      },
      description: 'Route to test extension',
    }, { headers });

    const rule = ruleResponse.data.data;
    logger.info(`Routing rule created: ${rule.ruleType} -> ${rule.actions.extensionId}`);

    // Get routing rules
    logger.info('Getting tenant routing rules...');
    const rulesResponse = await axios.get(`${API_BASE}/tenants/${tenant.id}/routing-rules`, { headers });
    logger.info(`Found ${rulesResponse.data.data.length} routing rules`);

    logger.info('✅ All tenant API tests passed!');

  } catch (error) {
    logger.error('❌ API test failed:', error.response?.data?.error?.message || error.message);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  testTenantAPIs()
    .then(() => {
      logger.info('Tenant API tests completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('Tenant API tests failed:', error);
      process.exit(1);
    });
}

module.exports = { testTenantAPIs };