/**
 * Test Admin Login
 * Tests the admin login flow
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
    console.log('Access Token:', response.data.data.accessToken.substring(0, 50) + '...');

    // Test accessing protected route with token
    console.log('\nTesting protected route...');
    console.log('Token payload:', JSON.parse(Buffer.from(response.data.data.accessToken.split('.')[1], 'base64').toString()));
    
    const tenantResponse = await axios.get(`${BASE_URL}/tenants`, {
      headers: {
        'Authorization': `Bearer ${response.data.data.accessToken}`
      }
    });

    console.log('✅ Protected route access successful!');
    console.log('Tenants:', tenantResponse.data.data);

    return response.data.data;

  } catch (error) {
    console.error('❌ Login test failed:', error.response?.data || error.message);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  testAdminLogin()
    .then(() => {
      console.log('\n🎉 Admin login flow test completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Admin login flow test failed:', error.message);
      process.exit(1);
    });
}

module.exports = { testAdminLogin };