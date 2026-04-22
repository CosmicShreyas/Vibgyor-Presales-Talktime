# Brand Partner Lead Statistics API Documentation

## Overview
This endpoint provides comprehensive statistics for brand partner leads, categorized by status with flexible time period filters (monthly, quarterly, year-to-date, or all time).

## Endpoint

**GET** `/api/brand-partners/leads/statistics`

## Authentication
Requires brand partner JWT authentication token in the Authorization header.

## Query Parameters

| Parameter | Type | Required | Description | Values |
|-----------|------|----------|-------------|--------|
| period | String | No | Time period filter | `monthly`, `quarterly`, `ytd`, or omit for all time |

### Period Options:
- **monthly**: Current month (from 1st of current month to today)
- **quarterly**: Current quarter (Q1: Jan-Mar, Q2: Apr-Jun, Q3: Jul-Sep, Q4: Oct-Dec)
- **ytd**: Year to date (from January 1st to today)
- **No parameter**: All time statistics

## Response Format

### Success Response (200)
```json
{
  "success": true,
  "period": "Monthly",
  "dateRange": {
    "startDate": "2024-04-01",
    "endDate": "2024-04-22"
  },
  "statistics": {
    "totalLeads": 790,
    "yetToContact": 400,
    "followUp": 180,
    "qualified": 64,
    "disqualified": 41,
    "lost": 23,
    "won": 22
  }
}
```

### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| success | Boolean | Indicates if the request was successful |
| period | String | The time period label (Monthly, Quarterly, Year to Date, All Time) |
| dateRange | Object | Start and end dates for the period |
| statistics | Object | Lead counts by category |

### Statistics Object

| Field | Type | Description | Status Mapping |
|-------|------|-------------|----------------|
| totalLeads | Number | Total number of leads submitted | All leads |
| yetToContact | Number | Leads not yet contacted | `pending`, `new` |
| followUp | Number | Leads requiring follow-up | `follow-up`, `followup`, `no-response`, `callback` |
| qualified | Number | Qualified/interested leads | `qualified`, `interested` |
| disqualified | Number | Disqualified leads | `disqualified`, `not-interested`, `invalid` |
| lost | Number | Lost opportunities | `lost`, `cancelled` |
| won | Number | Converted/won leads | `won`, `closed`, `already-finalised` |

## Usage Examples

### Example 1: Get Monthly Statistics
Get statistics for the current month:

```bash
GET /api/brand-partners/leads/statistics?period=monthly
Authorization: Bearer YOUR_BRAND_PARTNER_TOKEN
```

**Response:**
```json
{
  "success": true,
  "period": "Monthly",
  "dateRange": {
    "startDate": "2024-04-01",
    "endDate": "2024-04-22"
  },
  "statistics": {
    "totalLeads": 125,
    "yetToContact": 60,
    "followUp": 30,
    "qualified": 15,
    "disqualified": 10,
    "lost": 5,
    "won": 5
  }
}
```

### Example 2: Get Quarterly Statistics
Get statistics for the current quarter:

```bash
GET /api/brand-partners/leads/statistics?period=quarterly
Authorization: Bearer YOUR_BRAND_PARTNER_TOKEN
```

**Response:**
```json
{
  "success": true,
  "period": "Quarterly",
  "dateRange": {
    "startDate": "2024-04-01",
    "endDate": "2024-04-22"
  },
  "statistics": {
    "totalLeads": 350,
    "yetToContact": 150,
    "followUp": 80,
    "qualified": 45,
    "disqualified": 30,
    "lost": 20,
    "won": 25
  }
}
```

### Example 3: Get Year-to-Date Statistics
Get statistics from January 1st to today:

```bash
GET /api/brand-partners/leads/statistics?period=ytd
Authorization: Bearer YOUR_BRAND_PARTNER_TOKEN
```

**Response:**
```json
{
  "success": true,
  "period": "Year to Date",
  "dateRange": {
    "startDate": "2024-01-01",
    "endDate": "2024-04-22"
  },
  "statistics": {
    "totalLeads": 790,
    "yetToContact": 400,
    "followUp": 180,
    "qualified": 64,
    "disqualified": 41,
    "lost": 23,
    "won": 22
  }
}
```

### Example 4: Get All-Time Statistics
Get statistics for all leads ever submitted:

```bash
GET /api/brand-partners/leads/statistics
Authorization: Bearer YOUR_BRAND_PARTNER_TOKEN
```

**Response:**
```json
{
  "success": true,
  "period": "All Time",
  "dateRange": {
    "startDate": "All time",
    "endDate": "Present"
  },
  "statistics": {
    "totalLeads": 1250,
    "yetToContact": 500,
    "followUp": 300,
    "qualified": 150,
    "disqualified": 100,
    "lost": 80,
    "won": 120
  }
}
```

## JavaScript/Fetch Example

```javascript
async function getBrandPartnerStatistics(period = null) {
  const token = localStorage.getItem('brandPartnerToken');
  
  // Build URL with optional period parameter
  let url = '/api/brand-partners/leads/statistics';
  if (period) {
    url += `?period=${period}`;
  }
  
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch statistics');
    }
    
    return data;
  } catch (error) {
    console.error('Error fetching statistics:', error);
    throw error;
  }
}

// Usage examples
const monthlyStats = await getBrandPartnerStatistics('monthly');
const quarterlyStats = await getBrandPartnerStatistics('quarterly');
const ytdStats = await getBrandPartnerStatistics('ytd');
const allTimeStats = await getBrandPartnerStatistics();
```

## React Component Example

```jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';

const BrandPartnerDashboard = () => {
  const [statistics, setStatistics] = useState(null);
  const [period, setPeriod] = useState('monthly');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchStatistics();
  }, [period]);

  const fetchStatistics = async () => {
    setLoading(true);
    setError(null);

    try {
      const params = period ? { period } : {};
      const response = await axios.get('/api/brand-partners/leads/statistics', {
        params
      });

      setStatistics(response.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch statistics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading statistics...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!statistics) return null;

  return (
    <div className="dashboard">
      <div className="header">
        <h1>Welcome</h1>
        <p>A quick summary of your lead flow, follow ups, and project pipeline</p>
      </div>

      {/* Period Filter */}
      <div className="period-filter">
        <button
          className={period === 'monthly' ? 'active' : ''}
          onClick={() => setPeriod('monthly')}
        >
          Monthly
        </button>
        <button
          className={period === 'quarterly' ? 'active' : ''}
          onClick={() => setPeriod('quarterly')}
        >
          Quarterly
        </button>
        <button
          className={period === 'ytd' ? 'active' : ''}
          onClick={() => setPeriod('ytd')}
        >
          Year to date
        </button>
      </div>

      {/* Statistics Cards */}
      <div className="stats-grid">
        <StatCard
          title="Total leads"
          value={statistics.statistics.totalLeads}
          description="Access all current and past opportunities"
          icon="📊"
        />
        
        <StatCard
          title="Yet to contact"
          value={statistics.statistics.yetToContact}
          description="Largest bucket that needs immediate action"
          icon="📞"
        />
        
        <StatCard
          title="Follow up"
          value={statistics.statistics.followUp}
          description="Warm leads waiting for the next outpoint"
          icon="🔄"
        />
        
        <StatCard
          title="Qualified"
          value={statistics.statistics.qualified}
          description="High-intent leads ready to move ahead"
          icon="✅"
        />
        
        <StatCard
          title="Disqualified"
          value={statistics.statistics.disqualified}
          description="Leads removed due to mismatch or drop off"
          icon="❌"
        />
        
        <StatCard
          title="Lost"
          value={statistics.statistics.lost}
          description="Closed opportunities that did not convert"
          icon="💔"
        />
        
        <StatCard
          title="Won"
          value={statistics.statistics.won}
          description="Converted into confirmed business"
          icon="🎉"
        />
      </div>

      {/* Date Range Info */}
      <div className="date-range">
        <p>
          Showing {statistics.period} data 
          ({statistics.dateRange.startDate} to {statistics.dateRange.endDate})
        </p>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, description, icon }) => (
  <div className="stat-card">
    <div className="stat-header">
      <span className="stat-title">{title}</span>
      <span className="stat-icon">{icon}</span>
    </div>
    <div className="stat-value">{value}</div>
    <div className="stat-description">{description}</div>
  </div>
);

export default BrandPartnerDashboard;
```

## Status Mapping Reference

The endpoint automatically categorizes leads based on their status field:

### Yet to Contact
- `pending`
- `new`
- Any unknown status (defaults here)

### Follow Up
- `follow-up`
- `followup`
- `no-response`
- `callback`

### Qualified
- `qualified`
- `interested`

### Disqualified
- `disqualified`
- `not-interested`
- `invalid`

### Lost
- `lost`
- `cancelled`

### Won
- `won`
- `closed`
- `already-finalised`

## Date Calculations

### Monthly
- Start: 1st day of current month at 00:00:00
- End: Current date and time

### Quarterly
Quarters are calculated as:
- Q1: January 1 - March 31
- Q2: April 1 - June 30
- Q3: July 1 - September 30
- Q4: October 1 - December 31

Start date is the first day of the current quarter.

### Year to Date (YTD)
- Start: January 1 of current year at 00:00:00
- End: Current date and time

### All Time
- No date filter applied
- Returns statistics for all leads ever submitted by the brand partner

## Error Responses

### 401 Unauthorized
```json
{
  "message": "Authentication required"
}
```

### 500 Server Error
```json
{
  "success": false,
  "message": "Server error",
  "error": "Detailed error message"
}
```

## Performance Considerations

- The endpoint fetches all leads for the brand partner within the specified period
- Statistics are calculated in-memory after fetching
- For brand partners with thousands of leads, consider caching the results
- The endpoint uses indexed queries on `metadata.brandPartnerId` and `createdAt`

## Integration Tips

1. **Dashboard Refresh**: Call this endpoint when the dashboard loads and when the period filter changes
2. **Real-time Updates**: Consider polling this endpoint every few minutes for near real-time statistics
3. **Caching**: Cache results for a few minutes to reduce server load
4. **Default Period**: Start with 'monthly' as the default period for most users
5. **Visual Feedback**: Show loading states while fetching statistics

## Related Endpoints

- `GET /api/brand-partners/leads` - Get detailed list of all leads
- `GET /api/brand-partners/profile` - Get brand partner profile information
- `POST /api/brand-partners/leads/import` - Import new leads
- `PUT /api/brand-partners/leads/:uniqueId` - Update a specific lead

## Notes

- Statistics are calculated based on the `createdAt` field of leads
- Only leads uploaded by the authenticated brand partner are included
- The endpoint is optimized for dashboard display
- All dates are in UTC timezone
- Period filters are based on the current date/time when the request is made
