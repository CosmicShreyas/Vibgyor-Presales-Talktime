# Debug White Screen Issue

## Step 1: Check Logs

Connect your phone via USB and run:

```bash
adb logcat | grep -i "error\|exception\|react"
```

Or on Windows:
```bash
adb logcat | findstr /i "error exception react"
```

This will show you the actual error causing the white screen.

## Step 2: Common Fixes

### Fix 1: Clear Cache and Rebuild
```bash
cd TalkTime-main
rm -rf node_modules
npm install
npx expo start -c
```

Then rebuild:
```bash
npx expo run:android
```

### Fix 2: Check Metro Bundler
Make sure Metro bundler is running:
```bash
npx expo start
```

Keep this terminal open while the app runs on your phone.

### Fix 3: Update API URL
The app might be trying to connect to localhost. Update the API URL:

Edit `TalkTime-main/services/api.ts` and change:
```typescript
const API_BASE_URL = 'http://192.168.1.10:5000/api';
```

Replace `192.168.1.10` with your computer's actual IP address.

To find your IP:
- Windows: `ipconfig` (look for IPv4 Address)
- Mac/Linux: `ifconfig` (look for inet)

### Fix 4: Add Error Boundary

The app might be crashing silently. Let's add error handling.

## Step 3: Get Detailed Logs

Run this command while the app is open on your phone:
```bash
adb logcat *:E
```

This shows only errors. Share the output to identify the issue.

## Step 4: Test in Development Mode

Instead of building, try running in development mode:
```bash
cd TalkTime-main
npx expo start
```

Then scan the QR code with Expo Go app. If it works here but not in the build, it's a build configuration issue.
