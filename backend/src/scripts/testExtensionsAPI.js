/**
 * Test Extensions API
 * Tests the extension management endpoints
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api';

// First login to get token
async function loginAndGetToken() {
  try {
    const response = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'admin@balatrix.com',
      password: 'Admin123!'
    });

    return response.data.data.accessToken;
  } catch (error) {
    console.error('Login failed:', error.response?.data || error.message);
    throw error;
  }
}

async function testExtensionsAPI() {
  try {
    console.log('Testing Extensions API...');

    // Login first
    const token = await loginAndGetToken();
    console.log('✅ Login successful, got token');

    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };

    // Get tenant ID from existing tenant
    const tenantsResponse = await axios.get(`${BASE_URL}/tenants`, { headers });
    const tenantId = tenantsResponse.data.data.tenants[0].id;
    console.log('✅ Got tenant ID:', tenantId);

    // Test creating an extension
    console.log('\nTesting extension creation...');
    const extensionNumber = '10' + Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    const createResponse = await axios.post(`${BASE_URL}/extensions`, {
      tenantId,
      extension: extensionNumber,
      password: 'testpass123',
      displayName: 'Test Extension'
    }, { headers });

    console.log('✅ Extension created:', createResponse.data.message.extension.extension);

    const extensionId = createResponse.data.message.extension.id;

    // Test getting extension by ID
    console.log('\nTesting get extension by ID...');
    const getResponse = await axios.get(`${BASE_URL}/extensions/${extensionId}`, { headers });
    console.log('✅ Extension retrieved:', getResponse.data.message.extension.extension);

    // Test getting extensions for tenant
    console.log('\nTesting get extensions for tenant...');
    const listResponse = await axios.get(`${BASE_URL}/extensions/tenant/${tenantId}`, { headers });
    console.log('✅ Extensions retrieved:', listResponse.data.message.extensions.length, 'extensions');

    // Test updating extension
    console.log('\nTesting extension update...');
    const updateResponse = await axios.put(`${BASE_URL}/extensions/${extensionId}`, {
      displayName: 'Updated Test Extension'
    }, { headers });
    console.log('✅ Extension updated:', updateResponse.data.message.extension.displayName);

    // Test extension registration status
    console.log('\nTesting extension registration status...');
    const statusResponse = await axios.get(`${BASE_URL}/extensions/${extensionId}/register-status`, { headers });
    console.log('✅ Registration status:', statusResponse.data.data.status);

    // Test extension active calls
    console.log('\nTesting extension active calls...');
    const callsResponse = await axios.get(`${BASE_URL}/extensions/${extensionId}/call-status`, { headers });
    console.log('✅ Active calls:', callsResponse.data.data.activeCalls.length, 'calls');

    // Test tenant sync
    console.log('\nTesting tenant extensions sync...');
    const syncResponse = await axios.post(`${BASE_URL}/extensions/tenant/${tenantId}/sync`, {}, { headers });
    console.log('✅ Tenant sync result:', syncResponse.data.data.result);

    console.log('\n🎉 All extension API tests completed successfully!');

  } catch (error) {
    console.error('❌ Extension API test failed:', error.response?.data || error.message);
    if (error.response?.data?.error) {
      console.error('Error details:', error.response.data.error);
    }
  }
}

// Run if called directly
if (require.main === module) {
  testExtensionsAPI()
    .then(() => {
      console.log('\n🎉 Extensions API test completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Extensions API test failed:', error.message);
      process.exit(1);
    });
}

module.exports = { testExtensionsAPI };