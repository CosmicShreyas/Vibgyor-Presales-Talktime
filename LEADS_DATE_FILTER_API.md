# Leads Date Filter API Documentation

## Overview
This endpoint allows you to filter leads by a custom date range. It's useful for generating reports, analyzing lead trends, or viewing leads from specific time periods.

## Endpoint

**GET** `/api/clients/filter/by-date`

## Authentication
Requires JWT authentication token in the Authorization header.

## Access Control
- **Admin users**: Can view all leads within the date range
- **Sales users**: Can only view their assigned leads within the date range

## Query Parameters

| Parameter | Type | Required | Description | Example |
|-----------|------|----------|-------------|---------|
| startDate | String (Date) | Yes | Start date in YYYY-MM-DD format | `2024-01-01` |
| endDate | String (Date) | Yes | End date in YYYY-MM-DD format | `2024-12-31` |
| source | String | No | Filter by lead source | `Brand Partners` |
| status | String | No | Filter by lead status | `qualified` |
| assignedTo | String | No | Filter by employee ID (admin only) | `507f1f77bcf86cd799439011` |

## Date Format
- Dates must be in **YYYY-MM-DD** format
- Start date must be before or equal to end date
- End date is automatically set to 23:59:59.999 to include the entire day

## Response Format

### Success Response (200)
```json
{
  "success": true,
  "count": 25,
  "dateRange": {
    "startDate": "2024-01-01",
    "endDate": "2024-12-31"
  },
  "filters": {
    "source": "Brand Partners",
    "status": "qualified",
    "assignedTo": "John Doe"
  },
  "leads": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "uniqueId": "LEAD-12345",
      "name": "John Smith",
      "phone": "1234567890",
      "email": "john@example.com",
      "company": "ABC Corp",
      "source": "Brand Partners",
      "status": "qualified",
      "priority": "high",
      "assignedTo": {
        "_id": "507f1f77bcf86cd799439012",
        "name": "Jane Sales",
        "email": "jane@company.com",
        "employeeId": "VIB_001"
      },
      "createdAt": "2024-06-15T10:30:00.000Z",
      "updatedAt": "2024-06-15T14:20:00.000Z"
    }
    // ... more leads
  ]
}
```

### Error Responses

#### 400 Bad Request - Missing Parameters
```json
{
  "success": false,
  "message": "startDate and endDate are required",
  "example": "/api/clients/filter/by-date?startDate=2024-01-01&endDate=2024-12-31"
}
```

#### 400 Bad Request - Invalid Date Format
```json
{
  "success": false,
  "message": "Invalid date format. Use YYYY-MM-DD format",
  "example": "2024-01-01"
}
```

#### 400 Bad Request - Invalid Date Range
```json
{
  "success": false,
  "message": "startDate cannot be after endDate"
}
```

#### 401 Unauthorized
```json
{
  "message": "Access denied. No token provided."
}
```

#### 500 Server Error
```json
{
  "success": false,
  "message": "Server error",
  "error": "Detailed error message"
}
```

## Usage Examples

### Example 1: Basic Date Range Filter
Get all leads created in January 2024:

```bash
GET /api/clients/filter/by-date?startDate=2024-01-01&endDate=2024-01-31
Authorization: Bearer YOUR_JWT_TOKEN
```

### Example 2: Filter by Date and Source
Get all Brand Partner leads from Q1 2024:

```bash
GET /api/clients/filter/by-date?startDate=2024-01-01&endDate=2024-03-31&source=Brand%20Partners
Authorization: Bearer YOUR_JWT_TOKEN
```

### Example 3: Filter by Date, Source, and Status
Get all qualified leads from Brand Partners in 2024:

```bash
GET /api/clients/filter/by-date?startDate=2024-01-01&endDate=2024-12-31&source=Brand%20Partners&status=qualified
Authorization: Bearer YOUR_JWT_TOKEN
```

### Example 4: Admin Filter by Specific Employee
Admin viewing leads assigned to a specific employee:

```bash
GET /api/clients/filter/by-date?startDate=2024-01-01&endDate=2024-12-31&assignedTo=507f1f77bcf86cd799439012
Authorization: Bearer ADMIN_JWT_TOKEN
```

## JavaScript/Fetch Example

```javascript
async function getLeadsByDateRange(startDate, endDate, filters = {}) {
  const token = localStorage.getItem('token');
  
  // Build query parameters
  const params = new URLSearchParams({
    startDate,
    endDate,
    ...filters
  });
  
  try {
    const response = await fetch(`/api/clients/filter/by-date?${params}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch leads');
    }
    
    console.log(`Found ${data.count} leads`);
    return data.leads;
  } catch (error) {
    console.error('Error fetching leads:', error);
    throw error;
  }
}

// Usage
const leads = await getLeadsByDateRange('2024-01-01', '2024-12-31', {
  source: 'Brand Partners',
  status: 'qualified'
});
```

## React Component Example

```jsx
import React, { useState } from 'react';
import axios from 'axios';

const LeadsDateFilter = () => {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [source, setSource] = useState('');
  const [status, setStatus] = useState('');
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchLeads = async () => {
    if (!startDate || !endDate) {
      setError('Please select both start and end dates');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const params = {
        startDate,
        endDate
      };

      if (source) params.source = source;
      if (status) params.status = status;

      const response = await axios.get('/api/clients/filter/by-date', {
        params
      });

      setLeads(response.data.leads);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch leads');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="leads-date-filter">
      <h2>Filter Leads by Date</h2>
      
      <div className="filters">
        <div>
          <label>Start Date:</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </div>

        <div>
          <label>End Date:</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>

        <div>
          <label>Source (optional):</label>
          <select value={source} onChange={(e) => setSource(e.target.value)}>
            <option value="">All Sources</option>
            <option value="Brand Partners">Brand Partners</option>
            <option value="Website">Website</option>
            <option value="Referral">Referral</option>
          </select>
        </div>

        <div>
          <label>Status (optional):</label>
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="qualified">Qualified</option>
            <option value="closed">Closed</option>
          </select>
        </div>

        <button onClick={fetchLeads} disabled={loading}>
          {loading ? 'Loading...' : 'Filter Leads'}
        </button>
      </div>

      {error && <div className="error">{error}</div>}

      <div className="results">
        <h3>Results: {leads.length} leads</h3>
        <ul>
          {leads.map(lead => (
            <li key={lead._id}>
              {lead.name} - {lead.source} - {lead.status}
              <br />
              Created: {new Date(lead.createdAt).toLocaleDateString()}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default LeadsDateFilter;
```

## Common Use Cases

### 1. Monthly Report
Get all leads from the previous month:
```javascript
const now = new Date();
const firstDay = new Date(now.getFullYear(), now.getMonth() - 1, 1);
const lastDay = new Date(now.getFullYear(), now.getMonth(), 0);

const startDate = firstDay.toISOString().split('T')[0];
const endDate = lastDay.toISOString().split('T')[0];
```

### 2. Quarterly Analysis
Get all leads from Q1 2024:
```javascript
const startDate = '2024-01-01';
const endDate = '2024-03-31';
```

### 3. Year-to-Date
Get all leads from the beginning of the year:
```javascript
const now = new Date();
const startDate = `${now.getFullYear()}-01-01`;
const endDate = now.toISOString().split('T')[0];
```

### 4. Last 7 Days
Get leads from the last week:
```javascript
const end = new Date();
const start = new Date();
start.setDate(start.getDate() - 7);

const startDate = start.toISOString().split('T')[0];
const endDate = end.toISOString().split('T')[0];
```

## Performance Considerations

- The endpoint uses MongoDB's indexed `createdAt` field for efficient date range queries
- Results are sorted by creation date (most recent first)
- For large date ranges, consider implementing pagination
- The endpoint populates the `assignedTo` field, which adds a small overhead

## Notes

- All dates are stored in UTC in the database
- The end date is automatically extended to 23:59:59.999 to include the entire day
- Sales users can only see their own assigned leads, regardless of date range
- Admin users can see all leads and can filter by specific employees
- The `source` and `status` filters are case-sensitive
- Empty result sets return an empty array with count: 0

## Related Endpoints

- `GET /api/clients` - Get all leads (with optional source filter)
- `GET /api/clients/unassigned` - Get unassigned leads (admin only)
- `GET /api/clients/:id` - Get a specific lead by ID
