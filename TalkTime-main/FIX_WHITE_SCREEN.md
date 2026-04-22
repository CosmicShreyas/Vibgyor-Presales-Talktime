# Fix White Screen - Step by Step

## The Problem
White screen after installation usually means:
1. JavaScript error is crashing the app
2. API connection issue
3. Missing dependencies
4. Build configuration problem

## Solution Steps

### Step 1: Get Error Logs (MOST IMPORTANT)

Connect your phone via USB and run:

```bash
adb logcat | grep -E "ReactNativeJS|Error|Exception"
```

**Keep this running** while you open the app on your phone. You'll see the actual error.

Common errors you might see:
- `Network request failed` → API connection issue
- `Unable to resolve module` → Missing dependency
- `undefined is not an object` → Code error
- `Permission denied` → Permission issue

### Step 2: Fix API Connection

The app is probably trying to connect to `localhost` which doesn't work on a real device.

**Find your computer's IP address:**

Windows:
```bash
ipconfig
```
Look for "IPv4 Address" (e.g., 192.168.1.10)

Mac/Linux:
```bash
ifconfig | grep "inet "
```

**Update API URL:**

Edit `TalkTime-main/services/api.ts`:

```typescript
// Change this line (around line 7):
const API_BASE_URL = 'http://192.168.1.10:5000/api';
// Replace 192.168.1.10 with YOUR computer's IP
```

**Make sure your API server is running:**
```bash
cd server
npm start
```

### Step 3: Rebuild the App

```bash
cd TalkTime-main

# Clear everything
rm -rf node_modules
rm -rf android/build
rm -rf android/app/build

# Reinstall
npm install

# Rebuild
npx expo run:android
```

### Step 4: Check if Metro Bundler is Running

You need TWO terminals:

**Terminal 1 - Metro Bundler:**
```bash
cd TalkTime-main
npx expo start
```
Keep this running!

**Terminal 2 - Install App:**
```bash
cd TalkTime-main
npx expo run:android
```

### Step 5: Test in Development Mode First

Before building, test with Expo Go:

```bash
cd TalkTime-main
npx expo start
```

1. Install "Expo Go" app from Play Store
2. Scan the QR code
3. If it works here, the issue is with the build

### Step 6: Check Permissions

Make sure `app.json` has the permissions:

```json
"android": {
  "permissions": [
    "READ_PHONE_STATE",
    "CALL_PHONE"
  ]
}
```

### Step 7: Verify Dependencies

Check if all packages are installed:

```bash
cd TalkTime-main
npm install @react-native-async-storage/async-storage
npm install @react-native-community/datetimepicker
npm install expo-contacts
```

## Quick Fix Commands

Run these in order:

```bash
# 1. Navigate to project
cd TalkTime-main

# 2. Clean everything
rm -rf node_modules
rm -rf android/build
rm -rf android/app/build
rm -rf .expo

# 3. Reinstall
npm install

# 4. Clear cache
npx expo start -c

# 5. Rebuild (in a new terminal)
npx expo run:android
```

## Check These Common Issues

### Issue 1: API Server Not Running
```bash
cd server
npm start
```
Should show: "Server running on port 5000"

### Issue 2: Wrong API URL
Edit `TalkTime-main/services/api.ts`:
```typescript
const API_BASE_URL = 'http://YOUR_COMPUTER_IP:5000/api';
```

### Issue 3: Phone and Computer on Different Networks
- Both must be on the same WiFi network
- Or use USB tethering

### Issue 4: Firewall Blocking
- Disable firewall temporarily
- Or allow port 5000 through firewall

## Get Detailed Logs

### Method 1: ADB Logcat
```bash
adb logcat *:E
```

### Method 2: React Native Logs
```bash
adb logcat | grep "ReactNativeJS"
```

### Method 3: All Errors
```bash
adb logcat | grep -i error
```

## Test Checklist

- [ ] API server is running (`cd server && npm start`)
- [ ] Computer IP is correct in `api.ts`
- [ ] Phone and computer on same WiFi
- [ ] Metro bundler is running (`npx expo start`)
- [ ] App is rebuilt after changes
- [ ] Permissions are in `app.json`
- [ ] No errors in `adb logcat`

## Still Not Working?

### Try Development Build

Instead of production build, use development mode:

```bash
cd TalkTime-main
npx expo start --dev-client
```

### Check React Native Version

```bash
cd TalkTime-main
npm list react-native
```

Should be compatible with Expo version.

### Reinstall Expo CLI

```bash
npm install -g expo-cli
npm install -g eas-cli
```

## Expected Behavior

When working correctly:
1. App opens
2. Shows loading spinner briefly
3. Shows login screen
4. Can login and see dashboard

## Share Logs

If still stuck, share the output of:

```bash
adb logcat | grep -E "ReactNativeJS|Error" > error_log.txt
```

This will save all errors to a file you can review.

## Emergency: Start Fresh

If nothing works, start with a clean slate:

```bash
cd TalkTime-main

# Delete everything
rm -rf node_modules
rm -rf android
rm -rf .expo
rm -rf ios

# Reinstall
npm install

# Regenerate native code
npx expo prebuild --clean

# Rebuild
npx expo run:android
```

## Contact for Help

When asking for help, provide:
1. Error logs from `adb logcat`
2. Your `api.ts` API_BASE_URL value
3. Output of `npm list` in TalkTime-main folder
4. Android version of your phone
