# Brand Partner Authentication Troubleshooting

## Issue: 401 Unauthorized Error on /api/brand-partners/images

If you're receiving a 401 error when calling the brand partner images endpoint, follow these troubleshooting steps:

## Step 1: Verify Your Token

Make sure you're sending the JWT token correctly in the Authorization header:

```javascript
fetch('/api/brand-partners/images', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`,  // Note the "Bearer " prefix
    'Content-Type': 'application/json'
  }
})
```

## Step 2: Check Token Type

The token must be a brand partner token (not an admin or sales employee token). When you log in via `/api/brand-partners/login`, the token is encoded with `type: 'brand-partner'`.

**Correct Login Endpoint:**
```javascript
POST /api/brand-partners/login
{
  "email": "partner@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "brandPartner": {
    "_id": "...",
    "partnerName": "...",
    "partnerCode": "VP001",
    ...
  }
}
```

## Step 3: Verify Brand Partner is Active

The brand partner account must have `isActive: true`. Inactive accounts will receive a 401 error.

## Step 4: Check Token Expiration

Brand partner tokens expire after 30 days. If your token is expired, you'll need to log in again.

## Step 5: Run the Test Script

We've provided a test script to help diagnose authentication issues:

```bash
cd server
node test-brand-partner-images.js
```

Update the credentials in the script first:
```javascript
const credentials = {
  email: 'your-partner@example.com',
  password: 'your-password'
};
```

The script will test:
1. Login endpoint
2. Authentication middleware (test-auth endpoint)
3. Images endpoint
4. Profile endpoint

## Common Error Messages

### "Authentication required" / "No token provided"
- The Authorization header is missing
- The token is not being sent with the request

### "Access denied. Brand partner authentication required." / "Invalid token type"
- You're using an admin or employee token instead of a brand partner token
- Log in via `/api/brand-partners/login` to get the correct token

### "Brand partner not found"
- The brand partner ID in the token doesn't exist in the database
- The brand partner may have been deleted

### "Brand partner account is inactive"
- The brand partner's `isActive` field is set to `false`
- An admin needs to activate the account

### "Invalid token" / "Token verification failed"
- The token is malformed or corrupted
- The JWT_SECRET on the server doesn't match the one used to sign the token

### "Token expired"
- The token has expired (30 days after issuance)
- Log in again to get a new token

## Enhanced Error Logging

The authentication middleware now includes detailed error logging. Check your server console for messages like:

```
Brand partner auth failed: No token provided
Brand partner auth failed: Wrong token type admin
Brand partner auth failed: Brand partner not found 507f1f77bcf86cd799439011
Brand partner auth failed: Brand partner inactive 507f1f77bcf86cd799439011
Brand partner auth error: JsonWebTokenError: invalid signature
```

## Test Authentication Endpoint

Use the test endpoint to verify your token is working:

```bash
GET /api/brand-partners/test-auth
Authorization: Bearer YOUR_TOKEN
```

**Success Response:**
```json
{
  "success": true,
  "message": "Authentication successful",
  "brandPartner": {
    "id": "...",
    "partnerName": "...",
    "partnerCode": "VP001",
    "email": "..."
  }
}
```

## Frontend Example

Here's a complete example of how to properly authenticate and fetch images:

```javascript
// 1. Login
const loginResponse = await fetch('/api/brand-partners/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    email: 'partner@example.com',
    password: 'password123'
  })
});

const loginData = await loginResponse.json();

if (!loginResponse.ok) {
  console.error('Login failed:', loginData.message);
  return;
}

const token = loginData.token;

// Store token (localStorage, sessionStorage, or state management)
localStorage.setItem('brandPartnerToken', token);

// 2. Fetch images with token
const imagesResponse = await fetch('/api/brand-partners/images', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});

const imagesData = await imagesResponse.json();

if (!imagesResponse.ok) {
  console.error('Failed to fetch images:', imagesData.message);
  console.error('Error details:', imagesData.error);
  
  // If 401, token might be expired - redirect to login
  if (imagesResponse.status === 401) {
    localStorage.removeItem('brandPartnerToken');
    // Redirect to login page
  }
  return;
}

console.log('Images:', imagesData.images);
```

## React Hook Example

```javascript
import { useState, useEffect } from 'react';

function useImages() {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchImages = async () => {
      try {
        const token = localStorage.getItem('brandPartnerToken');
        
        if (!token) {
          throw new Error('No authentication token found');
        }

        const response = await fetch('/api/brand-partners/images', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || 'Failed to fetch images');
        }

        setImages(data.images);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchImages();
  }, []);

  return { images, loading, error };
}

// Usage
function ImageGallery() {
  const { images, loading, error } = useImages();

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      {images.map(img => (
        <div key={img.imageId}>
          <h3>{img.title}</h3>
          <p>Lead: {img.leadName}</p>
        </div>
      ))}
    </div>
  );
}
```

## Checklist

Before reporting an authentication issue, verify:

- [ ] You're using the brand partner login endpoint (not admin login)
- [ ] The Authorization header includes "Bearer " prefix
- [ ] The token is being sent with every request
- [ ] The brand partner account is active
- [ ] The token hasn't expired (30 days)
- [ ] The server is running and MongoDB is connected
- [ ] JWT_SECRET is set in the .env file
- [ ] You've checked the server console for error messages
- [ ] The test script runs successfully

## Still Having Issues?

If you've followed all the steps above and still experiencing issues:

1. Check the server console for detailed error messages
2. Run the test script and share the output
3. Verify the JWT_SECRET in your .env file
4. Ensure MongoDB is running and the brand partner exists in the database
5. Try creating a new brand partner and testing with that account
