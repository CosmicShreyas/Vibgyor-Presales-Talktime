const axios = require('axios');
require('dotenv').config();

const API_URL = `http://localhost:${process.env.PORT || 5000}/api`;

async function testLogin() {
  console.log('🧪 Testing TalkTime Login API\n');
  console.log(`API URL: ${API_URL}\n`);

  const tests = [
    {
      name: 'Sales User Login (Should succeed)',
      email: 'john@talktime.com',
      password: 'sales123',
      shouldSucceed: true
    },
    {
      name: 'Admin User Login (Should fail - mobile app)',
      email: 'admin@talktime.com',
      password: 'admin123',
      shouldSucceed: false
    },
    {
      name: 'Invalid Credentials (Should fail)',
      email: 'john@talktime.com',
      password: 'wrongpassword',
      shouldSucceed: false
    },
    {
      name: 'Non-existent User (Should fail)',
      email: 'notexist@talktime.com',
      password: 'password123',
      shouldSucceed: false
    }
  ];

  for (const test of tests) {
    try {
      console.log(`Testing: ${test.name}`);
      console.log(`  Email: ${test.email}`);
      
      const response = await axios.post(`${API_URL}/auth/login`, {
        email: test.email,
        password: test.password
      });

      if (test.shouldSucceed) {
        console.log('  ✅ SUCCESS');
        console.log(`  Token: ${response.data.token.substring(0, 20)}...`);
        console.log(`  User: ${response.data.user.name} (${response.data.user.role})`);
      } else {
        console.log('  ❌ UNEXPECTED SUCCESS (should have failed)');
      }
    } catch (error) {
      if (!test.shouldSucceed) {
        console.log('  ✅ CORRECTLY FAILED');
        console.log(`  Error: ${error.response?.data?.message || error.message}`);
      } else {
        console.log('  ❌ UNEXPECTED FAILURE');
        console.log(`  Error: ${error.response?.data?.message || error.message}`);
      }
    }
    console.log('');
  }

  console.log('🏁 Test completed\n');
}

// Check if server is running
axios.get(`${API_URL}/health`)
  .then(() => {
    console.log('✓ Server is running\n');
    testLogin();
  })
  .catch(() => {
    console.error('❌ Server is not running!');
    console.error(`Please start the server first: cd server && npm start`);
    process.exit(1);
  });
