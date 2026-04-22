// Test script for brand partner login
// Usage: node test-brand-partner-login.js

const API_URL = 'http://localhost:5000/api';

async function testBrandPartnerLogin() {
  console.log('Testing Brand Partner Login Endpoint...\n');

  // Test credentials (you'll need to create a brand partner first)
  const credentials = {
    email: 'partner@example.com',
    password: 'password123'
  };

  try {
    console.log('Attempting login with:', credentials.email);
    
    const response = await fetch(`${API_URL}/brand-partners/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(credentials)
    });

    const data = await response.json();

    if (response.ok) {
      console.log('✓ Login successful!');
      console.log('\nToken:', data.token);
      console.log('\nBrand Partner Info:');
      console.log('  ID:', data.brandPartner._id);
      console.log('  Name:', data.brandPartner.name);
      console.log('  Email:', data.brandPartner.email);
      console.log('  Business:', data.brandPartner.businessName);
      console.log('  Phone:', data.brandPartner.primaryPhone);
      console.log('  Status:', data.brandPartner.isActive ? 'Active' : 'Inactive');
    } else {
      console.log('✗ Login failed');
      console.log('Error:', data.message);
    }
  } catch (error) {
    console.error('✗ Request failed:', error.message);
    console.log('\nMake sure the server is running on port 5000');
  }
}

testBrandPartnerLogin();
