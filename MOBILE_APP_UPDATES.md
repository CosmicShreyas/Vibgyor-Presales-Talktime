# Mobile Application Updates

## Overview
Updated the TalkTime mobile application with connection status indicators and improved mapping partner profile statistics.

## Changes Made

### 1. Connection Status System

#### Created ConnectionContext (`contexts/ConnectionContext.tsx`)
- Monitors API connection status in real-time
- Three states: `connected`, `reconnecting`, `disconnected`
- Automatic reconnection with retry logic (max 3 retries)
- Periodic health checks every 30 seconds
- App state awareness (checks connection when app comes to foreground)

**Features:**
- **Connected**: API is reachable and working
- **Reconnecting**: Lost connection, attempting to reconnect (shows retry count)
- **Disconnected**: Max retries exceeded, connection failed

#### Created ConnectionIndicator Component (`components/ConnectionIndicator.tsx`)
- Visual indicator showing connection status
- Animated breathing effect for connected state (green dot)
- Blinking animation for reconnecting state (red blinking dot)
- Stable red dot for disconnected state
- Positioned globally at top-right of all screens

**Animations:**
- **Green Breathing Dot**: Smooth pulse animation (1.5s cycle) when connected
- **Red Blinking Dot**: Fast blink animation (0.5s cycle) when reconnecting
- **Red Stable Dot**: No animation when disconnected (max retries exceeded)

### 2. Profile Page Updates

#### For Mapping Partners:
- **Changed**: "Pending Review" → "Avg Monthly Submissions"
- **Calculation**: Total submissions divided by months since account creation
- **Formula**: `avgMonthly = totalSubmissions / monthsSinceCreation`
- **Minimum**: At least 1 month to avoid division by zero

#### For All Users:
- **Changed**: "API Status" → "Status"
- **Dynamic Status**: Shows real connection status
  - "Connected" (green)
  - "Reconnecting (X/3)" (yellow/warning)
  - "Disconnected" (red)

### 3. Global Integration

#### Updated Root Layout (`app/_layout.tsx`)
- Added `ConnectionProvider` wrapping the entire app
- Provides connection status to all screens

#### Updated Tabs Layout (`app/(tabs)/_layout.tsx`)
- Added global `ConnectionIndicator` component
- Positioned at top-right corner (respects safe area insets)
- Visible on all tab screens (Today's Calls, Mapping, History, Profile)
- Z-index: 9999 to stay on top of all content

## Technical Details

### Connection Monitoring
```typescript
// Health check interval
const HEALTH_CHECK_INTERVAL = 30000; // 30 seconds

// Retry configuration
const MAX_RETRIES = 3;
const RETRY_INTERVAL = 3000; // 3 seconds between retries
```

### Status Indicators

**Connected (Green Breathing):**
- Color: `Colors.success` (#10B981)
- Animation: Opacity 0.6 → 1.0 → 0.6 (1.5s cycle)
- Indicates: Live connection to API

**Reconnecting (Red Blinking):**
- Color: `Colors.warning` (#F59E0B)
- Animation: Opacity 0.3 → 1.0 → 0.3 (0.5s cycle)
- Indicates: Attempting to reconnect
- Shows: Retry count (e.g., "Reconnecting (2/3)")

**Disconnected (Red Stable):**
- Color: `Colors.error` (#EF4444)
- Animation: None (stable)
- Indicates: Max retries exceeded, connection failed

### Average Monthly Submissions Calculation

```typescript
// Get account creation date
const accountCreatedDate = new Date(employee?.createdAt || Date.now());

// Calculate months since creation
const monthsSinceCreation = Math.max(1, 
  (new Date().getFullYear() - accountCreatedDate.getFullYear()) * 12 +
  (new Date().getMonth() - accountCreatedDate.getMonth()) + 1
);

// Calculate average
const avgMonthly = totalSubmissions > 0 
  ? Math.round(totalSubmissions / monthsSinceCreation) 
  : 0;
```

## User Experience

### Connection Indicator Visibility
- **Always visible** on all screens
- **Top-right corner** for easy visibility
- **Non-intrusive** small dot design
- **Animated** to draw attention when status changes

### Profile Page
- **Mapping Partners** see relevant statistics:
  - Total Submissions
  - This Month
  - Avg Monthly Submissions (NEW)
  
- **Sales Team** see call statistics:
  - Total Calls Made
  - Success Rate
  - This Month

- **All Users** see dynamic connection status:
  - Real-time status updates
  - Color-coded for quick recognition
  - Retry count when reconnecting

## Benefits

1. **Transparency**: Users always know their connection status
2. **Confidence**: Green breathing dot confirms live connection
3. **Awareness**: Red blinking alerts to connection issues
4. **Clarity**: Retry count shows reconnection progress
5. **Relevance**: Mapping partners see meaningful statistics
6. **Consistency**: Status indicator visible across all screens

## Future Enhancements

Potential improvements:
1. Add mapping submissions API endpoint for real data
2. Show connection speed/latency indicator
3. Add manual reconnect button
4. Show last successful sync timestamp
5. Add offline mode with data queuing
6. Show network type (WiFi/Cellular)
7. Add connection quality indicator (good/fair/poor)

## Testing

To test the connection indicator:
1. **Connected State**: Normal app usage with server running
2. **Reconnecting State**: Stop the server temporarily
3. **Disconnected State**: Keep server stopped for >9 seconds (3 retries × 3 seconds)
4. **Recovery**: Restart server and watch automatic reconnection

## Notes

- Connection checks use existing API authentication
- No additional API endpoints required
- Minimal performance impact (30s check interval)
- Graceful degradation when offline
- Automatic recovery when connection restored
