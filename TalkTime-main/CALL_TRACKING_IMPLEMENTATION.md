# Call Tracking Implementation

## Overview
Implemented automatic call duration tracking for Android with proper permission handling and call state monitoring.

## Features

### 1. Permission Request on App Startup
- Automatically requests `READ_PHONE_STATE` permission when app opens
- Shows native Android permission dialog
- Graceful handling if user denies permission

### 2. Dialer Integration
- Taps on "Call" button opens native Android dialer
- Phone number is automatically pre-filled
- Uses `tel:` URI scheme for compatibility

### 3. Automatic Call Duration Tracking
- Detects when call starts (app goes to background)
- Tracks duration in real-time
- Detects when call ends (app returns to foreground)
- Automatically calculates total call duration

### 4. Smart Duration Calculation
- Only counts calls longer than 3 seconds (filters out accidental taps)
- Accurate to the second
- Formatted display (e.g., "2m 35s" or "45s")

## Implementation Details

### Files Modified

#### 1. `TalkTime-main/services/phoneService.ts`
Enhanced with:
- `requestPhonePermissions()` - Request Android phone permissions
- `hasPhonePermissions()` - Check if permissions are granted
- Improved call state tracking using interval-based monitoring
- Better detection of call start/end events

**Key Methods:**
```typescript
// Request permissions
await phoneService.requestPhonePermissions();

// Check permissions
const hasPermission = await phoneService.hasPhonePermissions();

// Initiate call with tracking
await phoneService.initiateCall(phoneNumber, (duration) => {
  console.log(`Call duration: ${duration} seconds`);
});
```

#### 2. `TalkTime-main/app.json`
Added Android permissions:
```json
"android": {
  "permissions": [
    "READ_PHONE_STATE",
    "CALL_PHONE"
  ]
}
```

#### 3. `TalkTime-main/app/_layout.tsx`
Added permission request on app startup:
```typescript
useEffect(() => {
  if (Platform.OS === 'android') {
    phoneService.requestPhonePermissions();
  }
}, []);
```

## How It Works

### Call Flow

1. **User taps "Call" button**
   ```
   ClientCard → handleCallPress → phoneService.initiateCall()
   ```

2. **Permission Check**
   - Checks if `READ_PHONE_STATE` permission is granted
   - If not, requests permission from user
   - If denied, shows error message

3. **Open Dialer**
   - Opens native Android dialer with `tel:` URI
   - Phone number is pre-filled
   - User can modify number if needed

4. **Call Tracking Starts**
   - Monitors app state every second
   - Detects when app goes to background (call started)
   - Records start time

5. **During Call**
   - Timer runs in background
   - Continues tracking even if user switches apps

6. **Call Ends**
   - Detects when app returns to foreground
   - Calculates total duration
   - Calls callback with duration in seconds

7. **Update Sheet Opens**
   - Shows call duration banner
   - Pre-fills current status
   - User can add remarks and submit

### State Detection Logic

```typescript
// App goes to background → Call started
if (currentState === 'background' && !wasInBackground) {
  callStartTime = Date.now();
  wasInBackground = true;
}

// App returns to foreground → Call ended
if (currentState === 'active' && wasInBackground) {
  duration = (Date.now() - callStartTime) / 1000;
  callback(duration);
}
```

## Android Permissions

### READ_PHONE_STATE
- Required to monitor call state
- Allows app to detect when call starts/ends
- Does NOT allow app to make calls automatically
- User must manually dial from the dialer

### CALL_PHONE (Optional)
- Listed in manifest for future enhancements
- Currently not used (using `tel:` URI instead)
- Would allow direct calling without dialer

## User Experience

### First Time User
1. Opens app
2. Sees permission dialog: "Allow TalkTime to access phone state?"
3. Taps "Allow"
4. Can now make tracked calls

### Making a Call
1. Taps "Call" button on lead card
2. Dialer opens with number pre-filled
3. User taps dial button
4. Call connects
5. Duration tracking starts automatically
6. User ends call
7. Returns to app
8. Update sheet opens with duration shown

### Visual Feedback
```
┌─────────────────────────────────────┐
│ ⏱️ Call Duration Recorded           │
│    2m 35s                           │
└─────────────────────────────────────┘
```

## Edge Cases Handled

1. **Permission Denied**
   - Shows error message
   - Explains why permission is needed
   - User can still make calls (without tracking)

2. **Short Calls (<3 seconds)**
   - Filtered out as accidental taps
   - No duration recorded

3. **App Killed During Call**
   - Tracking stops
   - No duration recorded (limitation)

4. **Multiple Calls**
   - Each call tracked independently
   - Previous tracking stopped before new call

5. **User Doesn't Dial**
   - Opens dialer but backs out
   - No duration recorded (correct behavior)

## Limitations

1. **Requires App to Return**
   - User must return to app after call
   - If app is killed, duration is lost

2. **Background Restrictions**
   - Some Android versions may limit background monitoring
   - Battery optimization may affect tracking

3. **Not Real-Time**
   - Uses app state changes, not actual call state
   - Approximation based on foreground/background transitions

## Future Enhancements

### Option 1: Native Module
- Use Android's `TelephonyManager`
- Listen to `CALL_STATE_RINGING`, `CALL_STATE_OFFHOOK`, `CALL_STATE_IDLE`
- More accurate call state detection

### Option 2: Third-Party Library
- Use `react-native-call-detection`
- Better call state monitoring
- Works even if app is killed

### Option 3: Background Service
- Run tracking in background service
- Persist data even if app is closed
- Requires additional permissions

## Testing Checklist

- [ ] App requests phone permission on first launch
- [ ] Permission dialog shows correct message
- [ ] Tap "Call" button opens dialer
- [ ] Phone number is pre-filled in dialer
- [ ] Make a call and end it
- [ ] Return to app - verify update sheet opens
- [ ] Verify call duration is displayed
- [ ] Check duration is accurate (±2 seconds)
- [ ] Test with short call (<3s) - should not record
- [ ] Test denying permission - should show error
- [ ] Test multiple calls in sequence

## Troubleshooting

### Permission Not Requested
- Check `app.json` has permissions listed
- Rebuild app after adding permissions
- Clear app data and reinstall

### Duration Not Tracking
- Verify permission is granted in Android settings
- Check app is not being killed by battery optimization
- Ensure user returns to app after call

### Inaccurate Duration
- Expected ±2-3 seconds variance
- Based on app state changes, not actual call time
- Consider using native module for better accuracy

## Code Examples

### Basic Usage
```typescript
// In ClientCard component
const handleCallPress = async (client: Client) => {
  const result = await phoneService.initiateCall(
    client.phone,
    (duration) => {
      // Call ended, duration in seconds
      setCallDuration(duration);
      setShowUpdateSheet(true);
    }
  );

  if (!result.success) {
    alert(result.error);
  }
};
```

### Check Permissions
```typescript
const hasPermission = await phoneService.hasPhonePermissions();
if (!hasPermission) {
  const granted = await phoneService.requestPhonePermissions();
  if (!granted) {
    // Handle permission denied
  }
}
```

### Format Duration
```typescript
const formatted = PhoneService.formatDuration(155);
// Returns: "2m 35s"
```
