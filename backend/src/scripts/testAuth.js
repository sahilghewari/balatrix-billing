/**
 * Test Admin Login
 * Tests the admin login functionality
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api';

async function testAdminLogin() {
  try {
    console.log('Testing admin login...');

    const response = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'admin@balatrix.com',
      password: 'Admin123!'
    });

    console.log('✅ Login successful!');
    console.log('User:', response.data.data.user);
    console.log('Access Token:', response.data.data.accessToken ? 'Present' : 'Missing');

    return {
      success: true,
      user: response.data.data.user,
      accessToken: response.data.data.accessToken
    };

  } catch (error) {
    console.error('❌ Login failed:', error.response?.data || error.message);
    return { success: false, error: error.response?.data || error.message };
  }
}

// Test tenant creation with authentication
async function testTenantCreation(accessToken) {
  try {
    console.log('\nTesting tenant creation with authentication...');

    const response = await axios.post(`${BASE_URL}/tenants`, {
      name: 'AuthenticatedTestTenant',
      description: 'A test tenant created with authentication',
      domain: 'auth-test.balatrix.com'
    }, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    console.log('✅ Tenant created successfully!');
    console.log('Tenant:', response.data.data);

    return { success: true, tenant: response.data.data };

  } catch (error) {
    console.error('❌ Tenant creation failed:', error.response?.data || error.message);
    return { success: false, error: error.response?.data || error.message };
  }
}

// Test getting all tenants
async function testGetTenants(accessToken) {
  try {
    console.log('\nTesting get all tenants...');

    const response = await axios.get(`${BASE_URL}/tenants`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    console.log('✅ Tenants retrieved successfully!');
    console.log('Tenants count:', response.data.data.length);

    return { success: true, tenants: response.data.data };

  } catch (error) {
    console.error('❌ Get tenants failed:', error.response?.data || error.message);
    return { success: false, error: error.response?.data || error.message };
  }
}

// Run all tests
async function runTests() {
  const loginResult = await testAdminLogin();

  if (loginResult.success) {
    await testTenantCreation(loginResult.accessToken);
    await testGetTenants(loginResult.accessToken);
  }

  console.log('\n🎯 Authentication testing complete!');
}

// Run if called directly
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = { testAdminLogin, testTenantCreation, testGetTenants };