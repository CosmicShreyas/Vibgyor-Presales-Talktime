# Brand Partner Profile API

## Overview
These endpoints allow brand partners to access and manage their profile information from their dashboard.

## Authentication
All endpoints require brand partner JWT token in the Authorization header:
```
Authorization: Bearer <brand_partner_token>
```

## Endpoints

### 1. Get Brand Partner Profile

Retrieves the complete profile information of the authenticated brand partner.

**Endpoint:**
```
GET /api/brand-partners/profile
```

**Headers:**
```
Authorization: Bearer <brand_partner_token>
```

**Response (200 OK):**
```json
{
  "_id": "507f1f77bcf86cd799439011",
  "partnerCode": "VP001",
  "partnerName": "ABC Enterprises",
  "nickName": "ABC",
  "contactPerson1": "John Doe",
  "phoneNo1": "9876543210",
  "contactPerson2": "Jane Smith",
  "phoneNo2": "9876543211",
  "email": "abc@example.com",
  "address": "123 Main St, Mumbai, Maharashtra 400001",
  "accountHolderName": "John Doe",
  "accountNumber": "1234567890",
  "bankName": "State Bank of India",
  "ifscCode": "SBIN0001234",
  "pan": "ABCDE1234F",
  "panDocument": "data:image/png;base64,...",
  "ifscDocument": "data:image/png;base64,...",
  "remarks": "Preferred partner",
  "paymentTerms": "Net 30 days",
  "about": "We are a leading real estate company with 10+ years of experience...",
  "isActive": true,
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-20T15:45:00.000Z"
}
```

**Error Responses:**

401 Unauthorized:
```json
{
  "message": "Authentication required"
}
```

404 Not Found:
```json
{
  "message": "Brand partner not found"
}
```

### 2. Update About Section

Updates the "about" section of the brand partner's profile. This is the only field that can be updated directly by the brand partner from their dashboard.

**Endpoint:**
```
PUT /api/brand-partners/profile/about
```

**Headers:**
```
Authorization: Bearer <brand_partner_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "about": "We are a leading real estate company with 10+ years of experience in residential and commercial properties. Our team of experts helps clients find their dream homes and investment opportunities."
}
```

**Response (200 OK):**
```json
{
  "message": "About section updated successfully",
  "about": "We are a leading real estate company with 10+ years of experience in residential and commercial properties. Our team of experts helps clients find their dream homes and investment opportunities."
}
```

**Error Responses:**

400 Bad Request:
```json
{
  "message": "About field is required"
}
```

401 Unauthorized:
```json
{
  "message": "Invalid token"
}
```

404 Not Found:
```json
{
  "message": "Brand partner not found"
}
```

## About Field Details

### Purpose
The "about" field is designed for brand partners to describe their business, services, and expertise. This information can be displayed on their profile page in the brand partner dashboard.

### Characteristics
- **Default Value**: Empty string ("")
- **Editable By**: Only the brand partner themselves (not admin)
- **Not Included In**: Admin's add/edit brand partner forms
- **Max Length**: No hard limit (but recommended to keep under 1000 characters for UI purposes)
- **Format**: Plain text (can include line breaks)

### Use Cases
- Company description
- Services offered
- Years of experience
- Specializations
- Contact information
- Business hours
- Any other relevant information

## Testing

### 1. Get Profile Information

First, login as a brand partner:
```bash
curl -X POST http://localhost:5000/api/brand-partners/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "abc@example.com",
    "password": "password123"
  }'
```

Save the token, then get profile:
```bash
curl -X GET http://localhost:5000/api/brand-partners/profile \
  -H "Authorization: Bearer <brand_partner_token>"
```

### 2. Update About Section

```bash
curl -X PUT http://localhost:5000/api/brand-partners/profile/about \
  -H "Authorization: Bearer <brand_partner_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "about": "We are a leading real estate company with 10+ years of experience in residential and commercial properties."
  }'
```

### 3. Verify Update

Get profile again to verify the about section was updated:
```bash
curl -X GET http://localhost:5000/api/brand-partners/profile \
  -H "Authorization: Bearer <brand_partner_token>"
```

## Frontend Integration

### Brand Partner Dashboard

The brand partner dashboard should:

1. **Profile Page**
   - Display all profile information (read-only)
   - Show partner code prominently
   - Display contact information
   - Show bank details (masked for security)

2. **About Section Editor**
   - Provide a textarea for editing the about section
   - Show character count
   - Save button to update
   - Success/error notifications

3. **Example Implementation**

```javascript
// Fetch profile on dashboard load
const fetchProfile = async () => {
  const token = localStorage.getItem('brandPartnerToken')
  const response = await fetch('http://localhost:5000/api/brand-partners/profile', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  })
  const profile = await response.json()
  setProfile(profile)
}

// Update about section
const updateAbout = async (aboutText) => {
  const token = localStorage.getItem('brandPartnerToken')
  const response = await fetch('http://localhost:5000/api/brand-partners/profile/about', {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ about: aboutText })
  })
  
  if (response.ok) {
    const result = await response.json()
    showNotification('About section updated successfully', 'success')
    // Refresh profile
    fetchProfile()
  } else {
    showNotification('Failed to update about section', 'error')
  }
}
```

## Security Considerations

1. **Authentication**: Only authenticated brand partners can access their own profile
2. **Authorization**: Brand partners can only view and update their own profile
3. **Password**: Never returned in profile response (excluded via `.select('-password')`)
4. **Token Validation**: JWT token must be valid and of type 'brand-partner'
5. **Active Status**: Only active brand partners can access these endpoints

## Database Schema

The `about` field is added to the BrandPartner model:

```javascript
about: {
  type: String,
  trim: true,
  default: ''
}
```

## API Documentation

Full API documentation is available in Swagger:
```
http://localhost:5000/api-docs
```

Look for the "Brand Partners" section for these endpoints.

## Notes

- The about field is optional and defaults to an empty string
- Brand partners can update their about section as many times as they want
- The about section is separate from remarks (which is set by admin)
- All other profile fields can only be updated by admin through the admin dashboard
- The profile endpoint returns all information except the password for security

## Future Enhancements

Potential improvements:
1. Rich text editor for about section
2. Image upload for brand partner logo
3. Social media links
4. Business hours
5. Service areas/locations
6. Certifications and awards
7. Team member profiles
8. Portfolio/gallery
