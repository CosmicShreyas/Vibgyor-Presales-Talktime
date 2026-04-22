# Employee ID Display Fix

## Issue
The ID displayed in the mobile app's "Today's Calls" page header was showing the MongoDB `_id` (a long random string) instead of the human-readable `employeeId` or `mappingId`.

## Solution

### 1. Updated Employee Type Definition
**File**: `TalkTime-main/types/index.ts`

Added `employeeId` and `mappingId` fields to the Employee interface:

```typescript
export interface Employee {
  id: string;
  employeeId?: string;  // Added
  mappingId?: string;   // Added
  name: string;
  // ... other fields
}
```

### 2. Fixed ID Display in Header
**File**: `TalkTime-main/app/(tabs)/index.tsx` (Line 146)

Changed from:
```typescript
<Text style={styles.idText}>{employee?.id}</Text>
```

To:
```typescript
<Text style={styles.idText}>{employee?.employeeId || employee?.mappingId || 'N/A'}</Text>
```

This displays:
- `employeeId` for sales employees (e.g., "EMP001")
- `mappingId` for mapping partners (e.g., "VIB2-1234")
- "N/A" as fallback if neither exists

## Other ID Usage (Correct - No Changes Needed)

The following locations correctly use `employee.id` (MongoDB _id) for API calls:

1. **index.tsx**:
   - Line 52: `fetchTodayCalls(employee.id)` ✅
   - Line 107: `updateClientStatus(employee.id, {...})` ✅
   - Line 200: `fetchTodayCalls(employee.id)` ✅

2. **history.tsx**:
   - Line 54: `fetchHistory(employee.id)` ✅
   - Line 189: `fetchHistory(employee.id)` ✅

3. **profile.tsx**:
   - Line 83: Already displays `employee.employeeId || employee.mappingId || employee.id` ✅

## API Integration Note

The `callsService.ts` methods accept an `employeeId` parameter but don't actually use it in the API calls. The API uses the JWT token from the authenticated session to identify the user. The MongoDB `_id` is still passed for consistency, but the actual authentication is token-based.

## Testing

To verify the fix:
1. Login as a sales employee → Should see employeeId (e.g., "EMP001")
2. Login as a mapping partner → Should see mappingId (e.g., "VIB2-1234")
3. Check that API calls still work correctly (they use the MongoDB _id internally)

## TypeScript Notes

If you see TypeScript errors about `employeeId` or `mappingId` not existing on Employee type, restart the TypeScript language server or Metro bundler to clear the cache.
