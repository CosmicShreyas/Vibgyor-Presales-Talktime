# Brand Partner Management Implementation - Updated Schema

## Overview
This implementation provides a complete brand partner management system with authentication capabilities, CSV import functionality, file upload support for documents, and full CRUD operations (Create, Read, Update, Delete).

## Backend Implementation

### 1. Database Model (`server/models/BrandPartner.js`)
Updated Mongoose schema with the following structure:

#### Partner Information
- Partner Name (required)
- Nick Name (optional)
- Partner Code (auto-generated, format: VP001, VP002, etc.)

#### Contact Information
- Contact Person 1 (required)
- Phone No 1 (required, validated for 10-digit Indian mobile)
- Contact Person 2 (optional)
- Phone No 2 (optional, validated)
- Email Address (required, unique, validated)
- Password (required, min 6 chars, bcrypt hashed)
- Address (required)

#### Bank Details
- Account Holder Name (required)
- Account Number (required)
- Bank Name (required)
- IFSC Code (required, validated format: XXXX0XXXXXX)

#### Documents
- PAN (optional, validated format: ABCDE1234F)
- PAN Document (optional, stored as base64)
- IFSC Document (optional, stored as base64)

#### Additional Information
- Remarks (optional)
- Payment Terms (optional)
- About (optional, editable only by brand partner)
- Member Since (auto-generated on creation)

### 2. API Routes (`server/routes/brandPartners.js`)

#### Authentication Endpoint
```
POST /api/brand-partners/login
Body: { email, password }
Response: { token (30 days expiry), brandPartner }
```

#### CRUD Endpoints (Require Authentication)
```
GET    /api/brand-partners              - List all brand partners
POST   /api/brand-partners              - Create new brand partner
GET    /api/brand-partners/:id          - Get single brand partner
PUT    /api/brand-partners/:id          - Update brand partner
DELETE /api/brand-partners/:id          - Delete brand partner
POST   /api/brand-partners/bulk-import  - Bulk import from CSV
```

### 3. Auto-Generated Partner Code
The system automatically generates unique partner codes in the format VP001, VP002, VP003, etc. when creating new brand partners.

## Frontend Implementation

### Brand Partner Management Component (`client/src/components/BrandPartnerManagement.jsx`)

Features:
- List view with search functionality (searches by partner code, name, contact person, email)
- Create new brand partners with modal form
- Edit existing brand partners (password optional when editing)
- Delete brand partners with confirmation dialog
- CSV import functionality
- Real-time form validation
- Password visibility toggle
- File upload for PAN and IFSC documents (converted to base64)
- Responsive design with dark mode support
- Action buttons (Edit/Delete) for each brand partner

#### Form Sections:
1. Partner Information
   - Partner Name, Nick Name, Partner Code (auto-generated)

2. Contact Information
   - Contact Person 1 & 2, Phone No 1 & 2, Email, Password, Address

3. Bank Details
   - Account Holder Name, Account Number, Bank Name, IFSC Code

4. Documents
   - PAN number input, PAN document upload, IFSC document upload

5. Additional Information
   - Remarks, Payment Terms

#### Form Validations:
- Phone numbers: 10-digit Indian mobile format (starts with 6-9)
- Email: Standard email format validation
- Password: Minimum 6 characters
- IFSC Code: Standard Indian IFSC format (e.g., SBIN0001234)
- PAN: Standard Indian PAN format (e.g., ABCDE1234F) - optional
- File uploads: Images and PDFs accepted

### CSV Import Component (`client/src/components/BrandPartnerCsvImportModal.jsx`)

Features:
- Drag and drop CSV file upload
- Real-time validation of CSV data
- Shows validation errors with row numbers
- Imports only valid entries
- Skips duplicate emails automatically
- Hidden scrollbar for clean UI

#### CSV Format:
```
Partner Name, Nick Name, Contact Person 1, Phone No 1, Contact Person 2, Phone No 2, Email, Password, Address, Account Holder Name, Account Number, Bank Name, IFSC Code, PAN, Remarks, Payment Terms
```

Sample CSV file provided: `server/sample-brand-partners-import.csv`

## Testing

### Manual Testing Steps

1. Start the server:
```bash
cd server
npm start
```

2. Start the client:
```bash
cd client
npm run dev
```

3. Navigate to Brand Partner Management page

#### Create Brand Partner
1. Click "Add Brand Partner" button
2. Fill in all required fields
3. Upload PAN and IFSC documents (optional)
4. Submit and verify the partner code is auto-generated
5. Verify the partner appears in the list

#### Edit Brand Partner
1. Click the edit icon (pencil) next to any brand partner
2. Modify the desired fields
3. Password field is optional - leave blank to keep current password
4. Click "Update Brand Partner"
5. Verify changes are reflected in the list

#### Delete Brand Partner
1. Click the delete icon (trash) next to any brand partner
2. Confirm deletion in the dialog
3. Verify the partner is removed from the list

#### CSV Import
1. Click "Import CSV" button
2. Upload the sample file: `server/sample-brand-partners-import.csv`
3. Review validation results
4. Click "Import" to complete

### Test CSV Import
1. Use the sample CSV file: `server/sample-brand-partners-import.csv`
2. Click "Import CSV" button
3. Upload the sample file
4. Review validation results
5. Click "Import" to complete

### Test Login API
```bash
curl -X POST http://localhost:5000/api/brand-partners/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "abc@example.com",
    "password": "password123"
  }'
```

## Key Features

### 1. Full CRUD Operations
- **Create**: Add new brand partners with complete information
- **Read**: View all brand partners in a searchable table
- **Update**: Edit existing brand partners (password optional)
- **Delete**: Remove brand partners with confirmation

### 2. Auto-generated Partner Codes
Partner codes are automatically generated in the format VP001, VP002, etc. when creating new brand partners.

### 3. File Upload Support
Documents are:
- Converted to base64 strings before storage
- Validated for file type (images and PDFs only)
- Stored directly in MongoDB
- Can be retrieved and displayed in the UI

### 4. Smart Password Handling
- Required when creating new brand partners
- Optional when editing (leave blank to keep current password)
- Securely hashed using bcrypt (12 rounds)
- Never displayed in edit form for security

### 5. Search Functionality
Search across multiple fields:
- Partner Code
- Partner Name
- Contact Person
- Email Address

### 6. Action Buttons
Each brand partner row includes:
- Edit button (pencil icon) - Opens edit modal with pre-filled data
- Delete button (trash icon) - Shows confirmation dialog before deletion

## Removed Fields:
- primaryPhone, secondaryPhone → replaced with phoneNo1, phoneNo2
- name → replaced with partnerName
- businessName, businessAddress, city, state, pincode → replaced with single address field
- accountType → removed

## Added Fields:
- nickName
- partnerCode (auto-generated)
- contactPerson1, contactPerson2
- pan, panDocument, ifscDocument
- remarks, paymentTerms
- about (editable only by brand partner)
- memberSince (auto-generated on creation)

## New Features:
- Auto-generated partner codes (VP001, VP002, etc.)
- File upload support for documents (PAN, IFSC)
- Base64 encoding for document storage
- Simplified address field (single textarea instead of multiple fields)
- Edit functionality with pre-filled forms
- Delete functionality with confirmation dialog
- Smart password handling (optional on edit)

## Security Features

1. Password hashing using bcrypt (12 rounds)
2. JWT token-based authentication (30 days expiry)
3. Input validation on both frontend and backend
4. Email uniqueness constraint
5. Active status flag for soft deletion
6. Duplicate email detection during bulk import
7. File type validation for uploads (images and PDFs only)

## API Documentation

All endpoints are documented in Swagger. Access at:
```
http://localhost:5000/api-docs
```

## Database Indexes

The model automatically creates indexes on:
- email (unique)
- partnerCode (unique)
- All fields used in queries

## Error Handling

The API returns appropriate HTTP status codes:
- 200: Success
- 201: Created
- 400: Validation error
- 401: Authentication failed
- 404: Not found
- 500: Server error

## CSV Import Error Handling

During bulk import:
- Validates all fields before import
- Shows validation errors with row numbers
- Skips invalid entries automatically
- Reports success/failure counts
- Handles duplicate emails gracefully

## File Upload Handling

Documents are:
- Converted to base64 strings before storage
- Validated for file type (images and PDFs only)
- Stored directly in MongoDB
- Can be retrieved and displayed in the UI

## Next Steps

To implement the brand partner dashboard:
1. Create a separate login page for brand partners
2. Use the `/api/brand-partners/login` endpoint
3. Store the JWT token in localStorage
4. Create brand partner-specific routes/pages
5. Use the token for authenticated requests
6. Display partner code prominently in the dashboard
