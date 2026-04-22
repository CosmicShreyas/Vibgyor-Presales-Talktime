# Brand Partner Leads Import Feature

## Overview
This feature allows brand partners to upload leads via CSV files from their dashboard. All leads imported by brand partners are automatically tagged with the "Brand Partners" source and linked to the specific brand partner who uploaded them.

## API Endpoint

### Import Leads (CSV or JSON)
```
POST /api/brand-partners/leads/import
```

#### Authentication
Requires brand partner JWT token in the Authorization header:
```
Authorization: Bearer <brand_partner_token>
```

#### Request Formats

The endpoint supports two formats:

##### 1. CSV File Upload
- Content-Type: `multipart/form-data`
- Body: Form data with CSV file

**Form Fields:**
- `csvFile` (required): CSV file containing leads

##### 2. JSON Data
- Content-Type: `application/json`
- Body: JSON object with leads array

**JSON Structure:**
```json
{
  "leads": [
    {
      "name": "Rajesh Kumar",
      "phone": "9876543210",
      "alternatePhone": "9876543211",
      "email": "rajesh@example.com",
      "project": "Prestige Lakeside",
      "address": "123 MG Road, Bangalore",
      "city": "Bangalore",
      "state": "Karnataka",
      "remarks": "Interested in 2BHK apartment"
    }
  ]
}
```

#### CSV Format
The CSV file should contain the following columns:

**Required Fields:**
- `name` - Lead name (required)
- `phone` - Primary phone number (required)

**Optional Fields:**
- `alternatePhone` - Alternate phone number
- `email` - Email address
- `project` - Project name (mapped to company field internally)
- `address` - Full address
- `city` - City
- `state` - State
- `remarks` - Additional remarks (mapped to notes field internally)

**Note:** The following fields are NOT supported in brand partner imports:
- ~~company~~ (use `project` instead)
- ~~description~~
- ~~budget~~
- ~~priority~~ (automatically set to 'medium')
- ~~tags~~

#### Response
```json
{
  "success": 5,
  "failed": 0,
  "errors": [],
  "brandPartnerCode": "VP001",
  "importId": "BP-VP001-1234567890",
  "message": "Successfully imported 5 lead(s). 0 failed."
}
```

## Field Mapping

Brand partner lead imports use a simplified field set. Here's how they map to the internal Client model:

| Brand Partner Field | Internal Field | Notes |
|---------------------|----------------|-------|
| `name` | `name` | Required |
| `phone` | `phone` | Required |
| `alternatePhone` | `alternatePhone` | Optional |
| `email` | `email` | Optional |
| `project` | `company` | Mapped to company field |
| `address` | `address` | Optional |
| `city` | `city` | Optional |
| `state` | `state` | Optional |
| `remarks` | `notes` | Mapped to notes field |
| - | `source` | Auto-set to "Brand Partners" |
| - | `status` | Auto-set to "pending" |
| - | `priority` | Auto-set to "medium" |
| - | `importMethod` | Auto-set to "csv" or "manual" |
| - | `isUnassigned` | Auto-set to `true` |

### Fields NOT Supported
The following fields from regular lead imports are NOT available for brand partner imports:
- `description` - Not used
- `budget` - Not used
- `tags` - Not used
- `priority` - Automatically set to "medium"
- `assignedTo` - All leads are unassigned by default

## Automatic Features

### 1. Source Assignment
All leads imported by brand partners are automatically assigned:
- **Source**: "Brand Partners"
- The system automatically creates this project source if it doesn't exist

### 2. Brand Partner Tracking
Each imported lead includes metadata:
```javascript
{
  brandPartnerId: ObjectId,
  brandPartnerCode: "VP001",
  brandPartnerName: "ABC Enterprises",
  importedBy: "brand-partner"
}
```

### 3. Import Tracking
Each CSV import is tracked with:
- **CSV File Name**: `VP001_2024-01-15.csv` (format: `{partnerCode}_{date}.csv`)
- **Import ID**: `BP-VP001-1234567890` (format: `BP-{partnerCode}-{timestamp}`)

### 4. Unassigned Status
All brand partner leads are marked as `isUnassigned: true` so that:
- They appear in the admin's "Unassigned Leads" section
- Admin can review and assign them to sales team members
- They're grouped separately from other leads

## Admin Dashboard Integration

### Viewing Brand Partner Leads

#### 1. All Brand Partner Leads
```
GET /api/clients?source=Brand Partners
```

This returns all leads imported by any brand partner.

#### 2. Unassigned Brand Partner Leads
```
GET /api/clients/unassigned
```

This includes all unassigned leads, including those from brand partners.

#### 3. Lead Metadata
Each lead contains metadata showing:
- Which brand partner imported it
- Brand partner code
- Brand partner name
- Import batch ID

### Filtering in Dashboard

The admin dashboard can filter leads by:
- Source: "Brand Partners"
- Brand Partner Code (via metadata)
- Import Date
- Unassigned status

## Testing

### 1. Get Brand Partner Token
First, login as a brand partner:
```bash
curl -X POST http://localhost:5000/api/brand-partners/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "abc@example.com",
    "password": "password123"
  }'
```

Save the returned token.

### 2. Import Leads via CSV
```bash
curl -X POST http://localhost:5000/api/brand-partners/leads/import \
  -H "Authorization: Bearer <brand_partner_token>" \
  -F "csvFile=@server/sample-brand-partner-leads-import.csv"
```

### 3. Import Leads via JSON
```bash
curl -X POST http://localhost:5000/api/brand-partners/leads/import \
  -H "Authorization: Bearer <brand_partner_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "leads": [
      {
        "name": "Rajesh Kumar",
        "phone": "9876543210",
        "alternatePhone": "9876543211",
        "email": "rajesh@example.com",
        "project": "Prestige Lakeside",
        "address": "123 MG Road, Bangalore",
        "city": "Bangalore",
        "state": "Karnataka",
        "remarks": "Interested in 2BHK apartment"
      },
      {
        "name": "Priya Sharma",
        "phone": "9876543212",
        "email": "priya.sharma@example.com",
        "project": "Brigade Gateway",
        "address": "456 Park Street, Mumbai",
        "city": "Mumbai",
        "state": "Maharashtra",
        "remarks": "Looking for office space"
      }
    ]
  }'
```

### 4. Verify in Admin Dashboard
Login as admin and check:
- Unassigned leads section
- Filter by source "Brand Partners"
- Check lead metadata for brand partner information

## Sample CSV File

A sample CSV file is provided at:
```
server/sample-brand-partner-leads-import.csv
```

**CSV Format:**
```csv
name,phone,alternatePhone,email,project,address,city,state,remarks
Rajesh Kumar,9876543210,9876543211,rajesh@example.com,Prestige Lakeside,"123 MG Road, Bangalore",Bangalore,Karnataka,Interested in 2BHK apartment
```

This file contains 5 sample leads with the supported fields.

## Sample JSON Request

```json
{
  "leads": [
    {
      "name": "Rajesh Kumar",
      "phone": "9876543210",
      "alternatePhone": "9876543211",
      "email": "rajesh@example.com",
      "project": "Prestige Lakeside",
      "address": "123 MG Road, Bangalore",
      "city": "Bangalore",
      "state": "Karnataka",
      "remarks": "Interested in 2BHK apartment"
    },
    {
      "name": "Priya Sharma",
      "phone": "9876543212",
      "email": "priya.sharma@example.com",
      "project": "Brigade Gateway",
      "address": "456 Park Street, Mumbai",
      "city": "Mumbai",
      "state": "Maharashtra",
      "remarks": "Looking for office space"
    }
  ]
}
```

## Error Handling

### Common Errors

1. **No file uploaded**
   - Status: 400
   - Message: "No file uploaded"

2. **Invalid token**
   - Status: 401
   - Message: "Invalid token"

3. **Inactive brand partner**
   - Status: 401
   - Message: "Brand partner not found or inactive"

4. **Missing required fields**
   - Included in response errors array
   - Format: "Row X: name and phone are required"

5. **Duplicate entries**
   - Included in response errors array
   - Format: "Row X: Duplicate entry (uniqueId conflict)"

### Partial Success
The import process continues even if some rows fail. The response includes:
- Count of successful imports
- Count of failed imports
- First 10 error messages

## Security Features

1. **Brand Partner Authentication**: Only authenticated brand partners can import leads
2. **Token Validation**: JWT token must be valid and of type 'brand-partner'
3. **Active Status Check**: Only active brand partners can import leads
4. **Automatic Tracking**: All imports are tracked with brand partner information

## Database Schema Updates

### Client Model
No schema changes required. Uses existing fields:
- `source`: Set to "Brand Partners"
- `importMethod`: Set to "csv"
- `csvFileName`: Generated filename
- `csvImportId`: Unique import batch ID
- `isUnassigned`: Set to true
- `metadata`: Contains brand partner information

### ProjectSource Model
Automatically creates "Brand Partners" source if it doesn't exist.

## Frontend Integration

### Brand Partner Dashboard
The brand partner dashboard should:
1. Provide a CSV upload interface
2. Use the brand partner's JWT token for authentication
3. Display import results (success/failed counts)
4. Show any validation errors
5. Provide a sample CSV template for download

### Admin Dashboard
The admin dashboard should:
1. Show a "Brand Partners" folder/section
2. Display leads with brand partner metadata
3. Allow filtering by brand partner code
4. Show import batch information
5. Enable assignment of brand partner leads to sales team

## API Documentation

Full API documentation is available in Swagger:
```
http://localhost:5000/api-docs
```

Look for the "Brand Partners" section and the "Import leads from CSV" endpoint.

## Future Enhancements

Potential improvements:
1. Real-time import progress tracking
2. Email notifications to admin when brand partner imports leads
3. Brand partner dashboard to view their imported leads
4. Analytics on brand partner lead quality
5. Automatic lead assignment rules for brand partner leads
6. Bulk operations on brand partner leads
