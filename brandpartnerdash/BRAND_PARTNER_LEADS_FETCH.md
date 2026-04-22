# Brand Partner Leads Management API

## Overview
These endpoints allow brand partners to manage (fetch, update, delete) the leads they have uploaded through their dashboard. All endpoints use JWT authentication to identify the brand partner and ensure they can only access their own leads.

## API Endpoints

### 1. Get Brand Partner Leads
```
GET /api/brand-partners/leads
```

#### Authentication
Requires brand partner JWT token in the Authorization header:
```
Authorization: Bearer <brand_partner_token>
```

#### Response (200 OK)
```json
{
  "success": true,
  "count": 5,
  "leads": [
    {
      "name": "Rajesh Kumar",
      "uniqueId": "LEAD-1234567890",
      "city": "Bangalore",
      "state": "Karnataka",
      "project": "Prestige Lakeside",
      "budget": "50-75 Lakhs",
      "priority": "medium",
      "status": "pending",
      "createdAt": "2024-01-15T10:30:00.000Z"
    }
  ]
}
```

### 2. Update Lead
```
PUT /api/brand-partners/leads/:uniqueId
```

#### Authentication
Requires brand partner JWT token in the Authorization header:
```
Authorization: Bearer <brand_partner_token>
```

#### Parameters
- `uniqueId` (path parameter, required): The unique ID of the lead to update

#### Request Body
```json
{
  "name": "Rajesh Kumar Updated",
  "city": "Mumbai",
  "state": "Maharashtra",
  "project": "New Project Name",
  "budget": "1-2 Crores",
  "remarks": "Updated remarks"
}
```

**Note**: All fields are optional. Only include the fields you want to update.

#### Response (200 OK)
```json
{
  "success": true,
  "message": "Lead updated successfully",
  "lead": {
    "name": "Rajesh Kumar Updated",
    "uniqueId": "LEAD-1234567890",
    "city": "Mumbai",
    "state": "Maharashtra",
    "project": "New Project Name",
    "budget": "1-2 Crores",
    "priority": "medium",
    "status": "pending",
    "createdAt": "2024-01-15T10:30:00.000Z"
  }
}
```

#### Error Responses

**404 Not Found:**
```json
{
  "success": false,
  "message": "Lead not found"
}
```

**403 Forbidden:**
```json
{
  "success": false,
  "message": "You can only update your own leads"
}
```

### 3. Delete Lead
```
DELETE /api/brand-partners/leads/:uniqueId
```

#### Authentication
Requires brand partner JWT token in the Authorization header:
```
Authorization: Bearer <brand_partner_token>
```

#### Parameters
- `uniqueId` (path parameter, required): The unique ID of the lead to delete

#### Response (200 OK)
```json
{
  "success": true,
  "message": "Lead deleted successfully",
  "uniqueId": "LEAD-1234567890"
}
```

#### Error Responses

**404 Not Found:**
```json
{
  "success": false,
  "message": "Lead not found"
}
```

**403 Forbidden:**
```json
{
  "success": false,
  "message": "You can only delete your own leads"
}
```

**401 Unauthorized:**
```json
{
  "message": "Authentication required"
}
```

**500 Server Error:**
```json
{
  "success": false,
  "message": "Server error",
  "error": "Error details"
}
```

## Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `success` | boolean | Indicates if the request was successful |
| `count` | number | Total number of leads returned |
| `leads` | array | Array of lead objects |

### Lead Object Fields

| Field | Type | Description | Default |
|-------|------|-------------|---------|
| `name` | string | Lead's full name | - |
| `uniqueId` | string | Unique identifier for the lead | Auto-generated |
| `city` | string | City of the lead | "N/A" if not provided |
| `state` | string | State of the lead | "N/A" if not provided |
| `project` | string | Project/property name the lead is interested in | "N/A" if not provided |
| `budget` | string | Budget range of the lead | "N/A" if not provided |
| `priority` | string | Lead priority (low, medium, high) | "medium" |
| `status` | string | Lead status (pending, contacted, qualified, converted, lost) | "pending" |
| `createdAt` | string (ISO 8601) | Date and time when the lead was created | Auto-generated |

## How It Works

1. **Authentication**: The endpoint uses the `brandPartnerAuth` middleware to verify the JWT token
2. **Brand Partner Identification**: Extracts the brand partner ID from the authenticated token
3. **Query Leads**: Searches for all leads where `metadata.brandPartnerId` matches the authenticated brand partner's ID
4. **Format Response**: Returns leads with specific fields, mapping `company` field to `project` for clarity
5. **Sorting**: Leads are sorted by creation date (most recent first)

## Usage Examples

### 1. Fetch Leads (cURL)

```bash
curl -X GET http://localhost:5000/api/brand-partners/leads \
  -H "Authorization: Bearer <brand_partner_token>"
```

### 2. Update Lead (cURL)

```bash
curl -X PUT http://localhost:5000/api/brand-partners/leads/LEAD-1234567890 \
  -H "Authorization: Bearer <brand_partner_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Rajesh Kumar Updated",
    "city": "Mumbai",
    "state": "Maharashtra",
    "project": "New Project Name",
    "budget": "1-2 Crores",
    "remarks": "Updated remarks"
  }'
```

### 3. Delete Lead (cURL)

```bash
curl -X DELETE http://localhost:5000/api/brand-partners/leads/LEAD-1234567890 \
  -H "Authorization: Bearer <brand_partner_token>"
```

### 4. Fetch Leads (JavaScript/Fetch)

```javascript
const fetchMyLeads = async () => {
  const token = localStorage.getItem('brandPartnerToken')
  
  try {
    const response = await fetch('http://localhost:5000/api/brand-partners/leads', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    
    if (!response.ok) {
      throw new Error('Failed to fetch leads')
    }
    
    const data = await response.json()
    console.log(`Total leads: ${data.count}`)
    console.log('Leads:', data.leads)
    
    return data.leads
  } catch (error) {
    console.error('Error fetching leads:', error)
    throw error
  }
}
```

### 5. Update Lead (JavaScript/Fetch)

```javascript
const updateLead = async (uniqueId, updateData) => {
  const token = localStorage.getItem('brandPartnerToken')
  
  try {
    const response = await fetch(`http://localhost:5000/api/brand-partners/leads/${uniqueId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(updateData)
    })
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Failed to update lead')
    }
    
    const data = await response.json()
    console.log('Lead updated:', data.lead)
    return data.lead
  } catch (error) {
    console.error('Error updating lead:', error)
    throw error
  }
}

// Usage
updateLead('LEAD-1234567890', {
  name: 'Updated Name',
  city: 'Mumbai',
  budget: '1-2 Crores'
})
```

### 6. Delete Lead (JavaScript/Fetch)

```javascript
const deleteLead = async (uniqueId) => {
  const token = localStorage.getItem('brandPartnerToken')
  
  try {
    const response = await fetch(`http://localhost:5000/api/brand-partners/leads/${uniqueId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Failed to delete lead')
    }
    
    const data = await response.json()
    console.log('Lead deleted:', data.uniqueId)
    return data
  } catch (error) {
    console.error('Error deleting lead:', error)
    throw error
  }
}

// Usage
deleteLead('LEAD-1234567890')
```

### 7. Complete CRUD Operations (Axios)

```javascript
import axios from 'axios'

const API_BASE_URL = 'http://localhost:5000/api/brand-partners'

// Get token from localStorage
const getToken = () => localStorage.getItem('brandPartnerToken')

// Fetch all leads
export const fetchLeads = async () => {
  const response = await axios.get(`${API_BASE_URL}/leads`, {
    headers: { 'Authorization': `Bearer ${getToken()}` }
  })
  return response.data
}

// Update a lead
export const updateLead = async (uniqueId, updateData) => {
  const response = await axios.put(
    `${API_BASE_URL}/leads/${uniqueId}`,
    updateData,
    {
      headers: { 
        'Authorization': `Bearer ${getToken()}`,
        'Content-Type': 'application/json'
      }
    }
  )
  return response.data
}

// Delete a lead
export const deleteLead = async (uniqueId) => {
  const response = await axios.delete(`${API_BASE_URL}/leads/${uniqueId}`, {
    headers: { 'Authorization': `Bearer ${getToken()}` }
  })
  return response.data
}
```

## Frontend Integration

### Complete Lead Management Component

```javascript
import React, { useState, useEffect } from 'react'

const BrandPartnerLeads = () => {
  const [leads, setLeads] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [editingLead, setEditingLead] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    city: '',
    state: '',
    project: '',
    budget: '',
    remarks: ''
  })

  useEffect(() => {
    fetchLeads()
  }, [])

  const fetchLeads = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('brandPartnerToken')
      
      const response = await fetch('http://localhost:5000/api/brand-partners/leads', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (!response.ok) {
        throw new Error('Failed to fetch leads')
      }
      
      const data = await response.json()
      setLeads(data.leads)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (lead) => {
    setEditingLead(lead.uniqueId)
    setFormData({
      name: lead.name,
      city: lead.city === 'N/A' ? '' : lead.city,
      state: lead.state === 'N/A' ? '' : lead.state,
      project: lead.project === 'N/A' ? '' : lead.project,
      budget: lead.budget === 'N/A' ? '' : lead.budget,
      remarks: ''
    })
  }

  const handleUpdate = async (e) => {
    e.preventDefault()
    
    try {
      const token = localStorage.getItem('brandPartnerToken')
      
      const response = await fetch(`http://localhost:5000/api/brand-partners/leads/${editingLead}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to update lead')
      }
      
      await fetchLeads()
      setEditingLead(null)
      setFormData({
        name: '',
        city: '',
        state: '',
        project: '',
        budget: '',
        remarks: ''
      })
      alert('Lead updated successfully!')
    } catch (err) {
      alert(`Error: ${err.message}`)
    }
  }

  const handleDelete = async (uniqueId) => {
    if (!window.confirm('Are you sure you want to delete this lead?')) {
      return
    }
    
    try {
      const token = localStorage.getItem('brandPartnerToken')
      
      const response = await fetch(`http://localhost:5000/api/brand-partners/leads/${uniqueId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to delete lead')
      }
      
      await fetchLeads()
      alert('Lead deleted successfully!')
    } catch (err) {
      alert(`Error: ${err.message}`)
    }
  }

  const handleCancel = () => {
    setEditingLead(null)
    setFormData({
      name: '',
      city: '',
      state: '',
      project: '',
      budget: '',
      remarks: ''
    })
  }

  if (loading) return <div>Loading leads...</div>
  if (error) return <div>Error: {error}</div>

  return (
    <div>
      <h2>My Leads ({leads.length})</h2>
      
      {editingLead && (
        <form onSubmit={handleUpdate} style={{ marginBottom: '20px', padding: '20px', border: '1px solid #ccc' }}>
          <h3>Edit Lead</h3>
          <div>
            <label>Name:</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>
          <div>
            <label>City:</label>
            <input
              type="text"
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
            />
          </div>
          <div>
            <label>State:</label>
            <input
              type="text"
              value={formData.state}
              onChange={(e) => setFormData({ ...formData, state: e.target.value })}
            />
          </div>
          <div>
            <label>Project:</label>
            <input
              type="text"
              value={formData.project}
              onChange={(e) => setFormData({ ...formData, project: e.target.value })}
            />
          </div>
          <div>
            <label>Budget:</label>
            <input
              type="text"
              value={formData.budget}
              onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
            />
          </div>
          <div>
            <label>Remarks:</label>
            <textarea
              value={formData.remarks}
              onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
            />
          </div>
          <button type="submit">Update</button>
          <button type="button" onClick={handleCancel}>Cancel</button>
        </form>
      )}
      
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Unique ID</th>
            <th>City</th>
            <th>State</th>
            <th>Project</th>
            <th>Budget</th>
            <th>Priority</th>
            <th>Status</th>
            <th>Created Date</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {leads.map(lead => (
            <tr key={lead.uniqueId}>
              <td>{lead.name}</td>
              <td>{lead.uniqueId}</td>
              <td>{lead.city}</td>
              <td>{lead.state}</td>
              <td>{lead.project}</td>
              <td>{lead.budget}</td>
              <td>{lead.priority}</td>
              <td>{lead.status}</td>
              <td>{new Date(lead.createdAt).toLocaleDateString()}</td>
              <td>
                <button onClick={() => handleEdit(lead)}>Edit</button>
                <button onClick={() => handleDelete(lead.uniqueId)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default BrandPartnerLeads
```

## Status Values

The `status` field can have the following values:
- `pending` - Lead has been created but not yet contacted
- `contacted` - Lead has been contacted by sales team
- `qualified` - Lead has been qualified as a potential customer
- `converted` - Lead has been converted to a customer
- `lost` - Lead is no longer interested or lost to competitor

## Priority Values

The `priority` field can have the following values:
- `low` - Low priority lead
- `medium` - Medium priority lead (default)
- `high` - High priority lead

## Notes

1. **Read-Only Access**: Brand partners can only view their leads, not modify them
2. **Automatic Filtering**: The endpoint automatically filters leads based on the authenticated brand partner's ID
3. **No Pagination**: Currently returns all leads. Consider adding pagination for large datasets
4. **Sorting**: Leads are sorted by creation date (newest first)
5. **Field Mapping**: The `company` field in the database is returned as `project` for clarity
6. **Default Values**: Fields that are not provided show "N/A" instead of null or empty strings

## Updatable Fields

Brand partners can update the following fields for their leads:

| Field | Description | Required | Notes |
|-------|-------------|----------|-------|
| `name` | Lead's full name | No | - |
| `city` | City | No | - |
| `state` | State | No | - |
| `project` | Project/property name | No | Mapped to `company` field internally |
| `budget` | Budget range | No | - |
| `remarks` | Additional notes | No | Mapped to `notes` field internally |

**Fields that CANNOT be updated by brand partners:**
- `uniqueId` - Auto-generated and immutable
- `priority` - Managed by admin
- `status` - Managed by admin/sales team
- `createdAt` - Auto-generated timestamp
- `metadata` - System-managed data

## Security

### Authentication & Authorization

1. **JWT Authentication**: All endpoints require valid brand partner JWT token
2. **Data Isolation**: Brand partners can only access their own leads
3. **Ownership Verification**: 
   - Update endpoint verifies lead belongs to the brand partner
   - Delete endpoint verifies lead belongs to the brand partner
4. **Token Validation**: Token must be valid and of type 'brand-partner'
5. **Active Status**: Only active brand partners can access these endpoints

### Permission Checks

Before any update or delete operation:
1. Lead existence is verified
2. Lead ownership is checked against `metadata.brandPartnerId`
3. If ownership doesn't match, returns 403 Forbidden error

### Error Handling

All endpoints return appropriate HTTP status codes:
- `200` - Success
- `401` - Unauthorized (invalid/missing token)
- `403` - Forbidden (not your lead)
- `404` - Not Found (lead doesn't exist)
- `500` - Server Error

## Future Enhancements

Potential improvements:
1. Add pagination support (limit, offset, page)
2. Add filtering options (by status, priority, date range)
3. Add sorting options (by name, date, status, etc.)
4. Add search functionality
5. Add statistics (total leads, by status, by priority)
6. Add export functionality (CSV, Excel)
7. Add date range filters
8. Add lead details endpoint for individual lead information

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

### 2. Fetch Leads

```bash
curl -X GET http://localhost:5000/api/brand-partners/leads \
  -H "Authorization: Bearer <brand_partner_token>"
```

### 3. Verify Response

Check that:
- Response includes `success: true`
- `count` matches the number of leads in the array
- Each lead has all required fields
- Leads are sorted by creation date (newest first)
- Only leads uploaded by this brand partner are returned

## API Documentation

Full API documentation is available in Swagger:
```
http://localhost:5000/api-docs
```

Look for the "Brand Partners" section and the "Get brand partner's uploaded leads" endpoint.
