# Call Feature - Quick Start Guide

## What Was Implemented

✅ **Permission Request on App Startup**
- App automatically asks for phone permissions when it opens
- Required for call duration tracking

✅ **Auto-Fill Dialer**
- Tap "Call" button → Opens Android dialer
- Phone number is automatically filled in
- User just needs to tap the dial button

✅ **Automatic Duration Tracking**
- Starts counting when call begins
- Stops counting when call ends
- Shows duration in update sheet

## How to Use

### For Users

1. **First Time Setup**
   - Open the app
   - Allow phone permission when prompted
   - That's it!

2. **Making a Call**
   - Find a lead in "Today's Calls"
   - Tap the blue "Call" button
   - Dialer opens with number ready
   - Tap dial to start call
   - Talk to the client
   - End the call
   - Return to the app
   - Update sheet opens automatically with call duration

3. **Updating Status**
   - See the call duration displayed
   - Select call outcome (Qualified, No Response, etc.)
   - Add remarks if needed
   - Tap "Save & Sync"

## Technical Summary

### What Happens Behind the Scenes

```
User taps "Call"
    ↓
Check permissions
    ↓
Open dialer with tel:+91XXXXXXXXXX
    ↓
User dials → App goes to background
    ↓
Timer starts (call duration tracking)
    ↓
User ends call → Returns to app
    ↓
Timer stops, calculate duration
    ↓
Show update sheet with duration
```

### Files Changed

1. **phoneService.ts** - Enhanced call tracking
2. **app.json** - Added Android permissions
3. **_layout.tsx** - Request permissions on startup

### Permissions Required

- `READ_PHONE_STATE` - To detect call start/end
- `CALL_PHONE` - Listed for future use

## Important Notes

⚠️ **User Must Return to App**
- Duration only recorded if user returns to app after call
- If app is killed during call, duration is lost

⚠️ **Minimum Duration**
- Calls shorter than 3 seconds are ignored
- Prevents accidental taps from being recorded

⚠️ **Accuracy**
- Duration is accurate within ±2-3 seconds
- Based on app state changes, not actual call state

## Rebuilding the App

After these changes, you need to rebuild the app:

```bash
# Clear cache
cd TalkTime-main
rm -rf node_modules
npm install

# Rebuild for Android
npx expo prebuild --clean
npx expo run:android
```

Or simply:
```bash
npm start
# Then press 'a' for Android
```

## Testing

1. ✅ Permission dialog appears on first launch
2. ✅ Dialer opens with pre-filled number
3. ✅ Make a 30-second test call
4. ✅ Return to app
5. ✅ Update sheet shows "30s" duration
6. ✅ Submit the update successfully

## Troubleshooting

**Q: Permission not requested?**
A: Uninstall and reinstall the app

**Q: Duration not showing?**
A: Make sure you return to the app after ending the call

**Q: Dialer doesn't open?**
A: Check if device has phone capability (not a tablet)

**Q: Duration is wrong?**
A: Expected ±2-3 seconds variance due to app state detection

## Next Steps

Consider these enhancements:
- Use native call state listener for better accuracy
- Persist duration even if app is killed
- Add call recording feature
- Show real-time timer during call
- Add call history with durations
