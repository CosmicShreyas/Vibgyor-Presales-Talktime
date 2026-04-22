# Brand Partner Leads Import - Updated Fields

## Overview
Updated the brand partner leads import endpoint to support both CSV and JSON formats with a simplified field set tailored for brand partner use.

## Changes Made

### 1. Dual Format Support
The endpoint now accepts:
- **CSV File Upload**: `multipart/form-data` with `csvFile`
- **JSON Data**: `application/json` with `leads` array

### 2. Updated Field Set

#### Supported Fields
- `name` (required) - Lead name
- `phone` (required) - Primary phone number
- `alternatePhone` (optional) - Alternate phone number
- `email` (optional) - Email address
- `project` (optional) - Project name (replaces "company")
- `address` (optional) - Full address
- `city` (optional) - City
- `state` (optional) - State
- `budget` (optional) - Budget range
- `remarks` (optional) - Additional remarks (replaces "notes")

#### Removed Fields
The following fields are NO LONGER supported:
- ~~company~~ → Use `project` instead
- ~~description~~ → Not used
- ~~tags~~ → Not used
- ~~priority~~ → Automatically set to "medium"

### 3. Field Mapping

| Input Field | Database Field | Value |
|-------------|----------------|-------|
| `name` | `name` | As provided |
| `phone` | `phone` | As provided |
| `alternatePhone` | `alternatePhone` | As provided |
| `email` | `email` | As provided |
| `project` | `company` | Mapped |
| `address` | `address` | As provided |
| `city` | `city` | As provided |
| `state` | `state` | As provided |
| `budget` | `budget` | As provided |
| `remarks` | `notes` | Mapped |
| - | `source` | "Brand Partners" |
| - | `status` | "pending" |
| - | `priority` | "medium" |
| - | `importMethod` | "csv" or "manual" |
| - | `isUnassigned` | true |

## API Usage

### CSV Import
```bash
curl -X POST http://localhost:5000/api/brand-partners/leads/import \
  -H "Authorization: Bearer <token>" \
  -F "csvFile=@leads.csv"
```

**CSV Format:**
```csv
name,phone,alternatePhone,email,project,address,city,state,budget,remarks
John Doe,9876543210,9876543211,john@example.com,Prestige Project,"123 Main St",Bangalore,Karnataka,50-75 Lakhs,VIP client
```

### JSON Import
```bash
curl -X POST http://localhost:5000/api/brand-partners/leads/import \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "leads": [
      {
        "name": "John Doe",
        "phone": "9876543210",
        "alternatePhone": "9876543211",
        "email": "john@example.com",
        "project": "Prestige Project",
        "address": "123 Main St",
        "city": "Bangalore",
        "state": "Karnataka",
        "budget": "50-75 Lakhs",
        "remarks": "VIP client"
      }
    ]
  }'
```

## Response Format

Both CSV and JSON imports return the same response:

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

## Error Handling

### Validation Errors
```json
{
  "success": 3,
  "failed": 2,
  "errors": [
    "Row 2: name and phone are required",
    "Row 5: Duplicate entry (uniqueId conflict)"
  ],
  "brandPartnerCode": "VP001",
  "importId": "BP-VP001-1234567890",
  "message": "Successfully imported 3 lead(s). 2 failed."
}
```

### Request Errors

**No data provided:**
```json
{
  "message": "Either csvFile or leads array is required"
}
```

**Invalid token:**
```json
{
  "message": "Invalid token"
}
```

## Frontend Integration

### CSV Upload Component
```javascript
const uploadCSV = async (file) => {
  const formData = new FormData()
  formData.append('csvFile', file)
  
  const response = await fetch('/api/brand-partners/leads/import', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    },
    body: formData
  })
  
  return await response.json()
}
```

### JSON Submit Component
```javascript
const submitLeads = async (leads) => {
  const response = await fetch('/api/brand-partners/leads/import', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ leads })
  })
  
  return await response.json()
}
```

### Manual Lead Entry Form
```javascript
const [leads, setLeads] = useState([{
  name: '',
  phone: '',
  alternatePhone: '',
  email: '',
  project: '',
  address: '',
  city: '',
  state: '',
  remarks: ''
}])

const handleSubmit = async () => {
  const result = await submitLeads(leads)
  if (result.success > 0) {
    showNotification(`Successfully imported ${result.success} lead(s)`, 'success')
  }
  if (result.failed > 0) {
    showNotification(`${result.failed} lead(s) failed to import`, 'error')
  }
}
```

## Benefits

### 1. Simplified Interface
- Fewer fields to manage
- Focus on essential lead information
- Easier for brand partners to use

### 2. Flexible Input
- Support both CSV bulk upload and manual JSON entry
- Same endpoint for both methods
- Consistent response format

### 3. Project-Focused
- `project` field instead of generic `company`
- More relevant for real estate context
- Better alignment with brand partner workflow

### 4. Automatic Processing
- All leads marked as unassigned
- Automatic source tagging
- Consistent metadata tracking

## Migration Notes

### For Existing Integrations
If you have existing code using the old field names:

**Old CSV Format:**
```csv
name,phone,email,company,description,budget,tags,priority,notes
```

**New CSV Format:**
```csv
name,phone,alternatePhone,email,project,address,city,state,remarks
```

### Field Mapping Guide
- `company` → `project`
- `notes` → `remarks`
- `description` → Remove (not used)
- `budget` → Remove (not used)
- `tags` → Remove (not used)
- `priority` → Remove (auto-set to "medium")

## Testing Checklist

- [ ] CSV import with all fields
- [ ] CSV import with only required fields (name, phone)
- [ ] JSON import with single lead
- [ ] JSON import with multiple leads
- [ ] Error handling for missing required fields
- [ ] Error handling for duplicate entries
- [ ] Verify leads appear in admin dashboard
- [ ] Verify leads are marked as unassigned
- [ ] Verify source is "Brand Partners"
- [ ] Verify metadata contains brand partner info

## Files Modified

1. `server/routes/brandPartners.js`
   - Updated `/leads/import` endpoint
   - Added support for JSON format
   - Updated field mapping

2. `server/sample-brand-partner-leads-import.csv`
   - Updated with new field names
   - Removed unsupported fields

3. `BRAND_PARTNER_LEADS_IMPORT.md`
   - Updated documentation
   - Added JSON examples
   - Added field mapping table

## Backward Compatibility

⚠️ **Breaking Change**: This update changes the expected field names in CSV files.

Existing CSV files with old field names will need to be updated to use:
- `project` instead of `company`
- `remarks` instead of `notes`
- Remove `description`, `budget`, `tags`, `priority` fields

The endpoint will still work but will ignore the old field names.
