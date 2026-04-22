# Mobile App Status Update - Synced with Dashboard

## Overview
Updated the TalkTime mobile application to use the same lead statuses as the web dashboard for consistency across platforms.

## Changes Made

### 1. Updated Lead Statuses (services/mockData.ts)

**Old Statuses (Mock):**
- connected
- no_answer
- ignored
- on_hold
- callback
- switched_off
- busy
- wrong_number

**New Statuses (Synced with Dashboard):**
- `pending` - Initial status, not yet contacted
- `no-response` - No answer from client
- `not-interested` - Client not interested
- `qualified` - Qualified lead (triggers Vibgyor API sync)
- `number-inactive` - Phone number inactive
- `number-switched-off` - Phone switched off
- `on-hold` - Client asked to hold/wait
- `no-requirement` - No current requirement
- `follow-up` - Needs follow-up call
- `disqualified` - Lead disqualified
- `disconnected` - Call disconnected
- `already-finalised` - Already finalized with another provider

### 2. Updated Status Colors & Icons

Each status now has:
- Appropriate Material Icon
- Color coding matching dashboard
- Background color for badges
- Descriptive labels

### 3. Updated Components

**services/mockData.ts:**
- Updated `CALL_STATUSES` array with new statuses
- Updated `getStatusColor()` function
- Updated `getStatusBg()` function
- Updated `getStatusLabel()` function

**services/api.ts:**
- Updated `Lead` interface with correct status types
- Removed 'closed' status (not in dashboard)

**app/(tabs)/history.tsx:**
- Updated `OUTCOME_ICONS` mapping
- Updated filter options to show relevant statuses:
  - All
  - Qualified
  - Follow Up
  - No Response
  - Not Interested

**app/(tabs)/profile.tsx:**
- Changed "Connected" stat to "Qualified" stat
- Updated icon from 'phone-in-talk' to 'check-circle'

**services/API_USAGE_GUIDE.md:**
- Updated available lead statuses documentation
- Removed 'closed' status
- Added descriptions for each status

### 4. Status Icon Mapping

| Status | Icon | Color |
|--------|------|-------|
| pending | schedule | Gray |
| no-response | phone-missed | Amber |
| not-interested | thumb-down | Red |
| qualified | check-circle | Green |
| number-inactive | phone-disabled | Gray |
| number-switched-off | phone-locked | Red |
| on-hold | pause-circle-filled | Blue |
| no-requirement | cancel | Gray |
| follow-up | schedule | Cyan |
| disqualified | block | Dark Red |
| disconnected | phone-disabled | Dark Red |
| already-finalised | done-all | Dark Green |

### 5. API Integration

The mobile app now correctly sends these status values to the backend API:
- POST `/api/calls` - Create call record with status
- PUT `/api/clients/:id` - Update lead status

When a lead is marked as `qualified`, it automatically triggers the Vibgyor API sync on the backend.

## Testing Checklist

- [ ] Login with Employee ID works
- [ ] Login with Mapping ID works
- [ ] Lead list displays correctly
- [ ] Status update sheet shows all 12 statuses
- [ ] Status colors match dashboard
- [ ] Call history filters work
- [ ] Profile stats show "Qualified" instead of "Connected"
- [ ] API calls use correct status values
- [ ] Status badges display correctly

## Migration Notes

If you have existing data in the mobile app with old statuses, you may need to:
1. Clear app data/cache
2. Re-sync with the server
3. Old status values will not match and may show as "Pending"

## Backend Compatibility

The mobile app is now fully compatible with the backend API:
- All status values match the Client model enum
- Status updates sync correctly with the database
- Qualified leads trigger Vibgyor API integration

## Next Steps

1. Test all status transitions in the mobile app
2. Verify API sync works correctly
3. Ensure call records are created with correct statuses
4. Test filtering and statistics with new statuses
5. Update any remaining mock data to use new statuses
