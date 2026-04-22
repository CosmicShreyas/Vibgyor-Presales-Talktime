// Test script for brand partner image endpoints
// Usage: node test-brand-partner-images.js

const API_URL = 'http://localhost:5000/api';

async function testBrandPartnerImages() {
  console.log('Testing Brand Partner Image Endpoints...\n');

  // Step 1: Login
  const credentials = {
    email: 'shreyasbrillint@gmail.com', // Change this to your test brand partner email
    password: 'sales123'        // Change this to your test brand partner password
  };

  let token;

  try {
    console.log('Step 1: Logging in...');
    const loginResponse = await fetch(`${API_URL}/brand-partners/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(credentials)
    });

    const loginData = await loginResponse.json();

    if (!loginResponse.ok) {
      console.log('✗ Login failed:', loginData.message);
      console.log('\nPlease create a brand partner first or update the credentials in this script.');
      return;
    }

    token = loginData.token;
    console.log('✓ Login successful!');
    console.log('  Brand Partner:', loginData.brandPartner.partnerName);
    console.log('  Partner Code:', loginData.brandPartner.partnerCode);
    console.log('  Token:', token.substring(0, 20) + '...\n');

    // Step 2: Test authentication endpoint
    console.log('Step 2: Testing authentication...');
    const authTestResponse = await fetch(`${API_URL}/brand-partners/test-auth`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    const authTestData = await authTestResponse.json();

    if (!authTestResponse.ok) {
      console.log('✗ Authentication test failed');
      console.log('  Status:', authTestResponse.status);
      console.log('  Error:', authTestData.message);
      console.log('  Details:', authTestData.error);
      console.log('\nThis indicates an issue with the authentication middleware.');
      return;
    }

    console.log('✓ Authentication test passed!');
    console.log('  Authenticated as:', authTestData.brandPartner.partnerName);
    console.log('  Partner Code:', authTestData.brandPartner.partnerCode + '\n');

    // Step 3: Test GET /images endpoint
    console.log('Step 3: Fetching images...');
    const imagesResponse = await fetch(`${API_URL}/brand-partners/images`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    const imagesData = await imagesResponse.json();

    if (!imagesResponse.ok) {
      console.log('✗ Failed to fetch images');
      console.log('  Status:', imagesResponse.status);
      console.log('  Error:', imagesData.message);
      console.log('  Details:', imagesData.error);
      return;
    }

    console.log('✓ Images fetched successfully!');
    console.log('  Count:', imagesData.count);
    
    if (imagesData.count > 0) {
      console.log('\n  Images:');
      imagesData.images.forEach((img, idx) => {
        console.log(`    ${idx + 1}. ${img.title}`);
        console.log(`       Image ID: ${img.imageId}`);
        console.log(`       Lead: ${img.leadName} (${img.leadUniqueId})`);
        console.log(`       Tags: ${img.tags.join(', ') || 'None'}`);
        console.log(`       Size: ${(img.size / 1024).toFixed(2)} KB`);
        console.log(`       Uploaded: ${new Date(img.uploadedAt).toLocaleString()}`);
      });
    } else {
      console.log('  No images uploaded yet.');
    }

    // Step 4: Test profile endpoint
    console.log('\nStep 4: Fetching profile...');
    const profileResponse = await fetch(`${API_URL}/brand-partners/profile`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    const profileData = await profileResponse.json();

    if (!profileResponse.ok) {
      console.log('✗ Failed to fetch profile');
      console.log('  Status:', profileResponse.status);
      console.log('  Error:', profileData.message);
      return;
    }

    console.log('✓ Profile fetched successfully!');
    console.log('  Partner Name:', profileData.partnerName);
    console.log('  Partner Code:', profileData.partnerCode);
    console.log('  Email:', profileData.email);
    console.log('  Status:', profileData.isActive ? 'Active' : 'Inactive');

    console.log('\n✓ All tests passed!');

  } catch (error) {
    console.error('✗ Request failed:', error.message);
    console.log('\nMake sure:');
    console.log('  1. The server is running on port 5000');
    console.log('  2. MongoDB is running');
    console.log('  3. A brand partner exists with the credentials above');
  }
}

testBrandPartnerImages();
