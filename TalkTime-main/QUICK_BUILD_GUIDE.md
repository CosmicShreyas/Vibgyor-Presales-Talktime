# Quick Build Guide - Get App on Your Phone in 5 Minutes

## Fastest Method: USB Installation

### Step 1: Enable Developer Mode on Phone
1. Go to **Settings** → **About Phone**
2. Tap **Build Number** 7 times
3. Go back to **Settings** → **Developer Options**
4. Enable **USB Debugging**

### Step 2: Connect Phone to Computer
1. Connect phone via USB cable
2. On phone, allow USB debugging when prompted
3. Select "File Transfer" mode

### Step 3: Build and Install
Open terminal in the project folder:

```bash
cd TalkTime-main
npm install
npx expo run:android
```

**That's it!** The app will build and install automatically on your phone.

---

## Alternative: Build APK File

If USB method doesn't work, build an APK file:

### Option A: Using EAS (Easiest)

```bash
cd TalkTime-main
npm install -g eas-cli
eas login
eas build -p android --profile preview
```

Wait 10-20 minutes, then download the APK from the link provided.

### Option B: Build Locally

```bash
cd TalkTime-main
npx expo prebuild --clean
cd android
./gradlew assembleDebug
```

APK will be at: `android/app/build/outputs/apk/debug/app-debug.apk`

Transfer this file to your phone and install it.

---

## Install APK on Phone

1. Copy APK file to your phone
2. Open the APK file
3. If prompted, allow "Install from Unknown Sources"
4. Tap Install
5. Open the app

---

## Troubleshooting

**Phone not detected?**
```bash
adb devices
```
If empty, check USB cable and enable USB debugging.

**Build fails?**
```bash
cd TalkTime-main
rm -rf node_modules
npm install
npx expo start -c
```

**Need to update API URL?**
Edit `TalkTime-main/services/api.ts` and change:
```typescript
const API_BASE_URL = 'http://YOUR_COMPUTER_IP:5000/api';
```

---

## What You Need Installed

- ✅ Node.js (you have this)
- ✅ npm (you have this)
- ⚠️ Android Studio (download if building locally)

For USB method, you just need Node.js!

---

## Recommended: USB Method

**Pros:**
- Fastest (2-5 minutes)
- Automatic installation
- Easy to test changes
- No file transfer needed

**Cons:**
- Requires USB cable
- Need to enable developer mode

Just run:
```bash
cd TalkTime-main
npx expo run:android
```

Done! 🎉
