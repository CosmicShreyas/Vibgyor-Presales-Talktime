# Lead Card Fields Fix

## Issue
The lead cards in the mobile app were showing "N/A" for three important fields:
1. **Location icon** (pin) - Should show city
2. **Building icon** - Should show company/project name
3. **Rupee icon** - Should show budget

Additionally, the spacing between these fields was too wide.

## Solution

### 1. Updated Lead Interface
**File**: `TalkTime-main/services/api.ts`

Added missing fields to the Lead interface:
```typescript
export interface Lead {
  // ... existing fields
  city?: string;      // Added
  budget?: string;    // Added
  // project was already present
}
```

### 2. Updated Data Conversion
**File**: `TalkTime-main/services/callsService.ts`

Updated the `convertLeadToClient` function to map API fields correctly:

```typescript
const convertLeadToClient = (lead: Lead): any => {
  return {
    id: lead._id,
    name: lead.name,
    company: lead.project || lead.company || 'N/A',  // Project takes priority
    phone: lead.phone,
    email: lead.email || '',
    industry: lead.company || 'N/A',                 // Company name
    value: lead.budget || 'N/A',                     // Budget (₹)
    location: lead.city || 'N/A',                    // City
    priority: lead.priority || 'medium',
    notes: lead.notes || '',
    status: lead.status,
    lastContact: lead.updatedAt ? new Date(lead.updatedAt).toISOString().split('T')[0] : '',
    callHistory: [],
  };
};
```

### 3. Reduced Spacing in Card Layout
**File**: `TalkTime-main/components/feature/ClientCard.tsx`

Changed the meta row spacing:
- `gap: Spacing.md` → `gap: Spacing.xs` (reduced gap between items)
- `minWidth: 80` → `minWidth: 70` (allows items to be closer)

## Field Mapping Summary

| Icon | Display Field | API Source | Fallback |
|------|--------------|------------|----------|
| 📍 Location | `location` | `lead.city` | 'N/A' |
| 🏢 Building | `industry` | `lead.company` | 'N/A' |
| ₹ Rupee | `value` | `lead.budget` | 'N/A' |

**Note**: The `company` field shown under the client name uses `lead.project` first, then falls back to `lead.company`.

## Testing

To verify the fix:
1. Ensure leads in the database have `city`, `budget`, and `project`/`company` fields populated
2. Open the mobile app and check the Today's Calls page
3. Verify the three icons show correct data instead of "N/A"
4. Verify the spacing between the three fields is tighter

## Sample Lead Data

For testing, leads should have:
```json
{
  "name": "John Doe",
  "phone": "+91 98765 43210",
  "city": "Mumbai",
  "company": "ABC Corp",
  "project": "Luxury Apartments",
  "budget": "₹50L",
  "status": "pending",
  "priority": "high"
}
```

This will display:
- Location: Mumbai
- Building: ABC Corp
- Budget: ₹50L
- Company under name: Luxury Apartments
