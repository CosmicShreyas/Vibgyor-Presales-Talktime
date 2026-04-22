# Build Android App - Complete Guide

## Prerequisites

### 1. Install Required Software

#### Node.js and npm
Already installed ✅

#### Android Studio
1. Download from: https://developer.android.com/studio
2. Install Android Studio
3. During installation, make sure to install:
   - Android SDK
   - Android SDK Platform
   - Android Virtual Device (optional, for emulator)

#### Java Development Kit (JDK)
- Android Studio includes JDK
- Or download JDK 17: https://www.oracle.com/java/technologies/downloads/

### 2. Set Up Environment Variables

#### On Windows:
1. Open "Environment Variables" (Search in Start menu)
2. Add these to System Variables:

```
ANDROID_HOME = C:\Users\YourUsername\AppData\Local\Android\Sdk
JAVA_HOME = C:\Program Files\Android\Android Studio\jbr
```

3. Add to PATH:
```
%ANDROID_HOME%\platform-tools
%ANDROID_HOME%\tools
%ANDROID_HOME%\tools\bin
%JAVA_HOME%\bin
```

4. Restart your terminal/command prompt

### 3. Verify Installation

Open terminal and run:
```bash
# Check Node
node --version

# Check npm
npm --version

# Check Java
java -version

# Check Android SDK
adb --version
```

## Building the App

### Method 1: Development Build (Recommended for Testing)

#### Step 1: Navigate to Project
```bash
cd TalkTime-main
```

#### Step 2: Install Dependencies
```bash
npm install
```

#### Step 3: Start Metro Bundler
```bash
npx expo start
```

#### Step 4: Connect Your Phone
1. Enable Developer Options on your Android phone:
   - Go to Settings → About Phone
   - Tap "Build Number" 7 times
   - Developer Options will appear in Settings

2. Enable USB Debugging:
   - Go to Settings → Developer Options
   - Enable "USB Debugging"

3. Connect phone to computer via USB cable

4. Allow USB debugging when prompted on phone

#### Step 5: Install on Phone
In the Expo terminal, press `a` for Android

OR run:
```bash
npx expo run:android
```

The app will be built and installed on your connected phone.

---

### Method 2: Build APK (For Distribution)

#### Step 1: Install EAS CLI
```bash
npm install -g eas-cli
```

#### Step 2: Login to Expo
```bash
eas login
```
(Create a free account at expo.dev if you don't have one)

#### Step 3: Configure EAS Build
```bash
eas build:configure
```

#### Step 4: Build APK
```bash
eas build -p android --profile preview
```

This will:
- Upload your code to Expo servers
- Build the APK in the cloud
- Provide a download link when complete (takes 10-20 minutes)

#### Step 5: Download and Install
1. Download the APK from the link provided
2. Transfer to your phone
3. Open the APK file on your phone
4. Allow "Install from Unknown Sources" if prompted
5. Install the app

---

### Method 3: Build APK Locally (Fastest)

#### Step 1: Prebuild Native Code
```bash
cd TalkTime-main
npx expo prebuild --clean
```

#### Step 2: Build Debug APK
```bash
cd android
./gradlew assembleDebug
```

On Windows:
```bash
cd android
gradlew.bat assembleDebug
```

#### Step 3: Find the APK
The APK will be at:
```
TalkTime-main/android/app/build/outputs/apk/debug/app-debug.apk
```

#### Step 4: Install on Phone
1. Copy `app-debug.apk` to your phone
2. Open the file on your phone
3. Allow installation from unknown sources
4. Install

---

## Quick Commands Reference

### Development (USB Connected Phone)
```bash
cd TalkTime-main
npm install
npx expo run:android
```

### Build APK Locally
```bash
cd TalkTime-main
npx expo prebuild --clean
cd android
./gradlew assembleDebug
# APK at: android/app/build/outputs/apk/debug/app-debug.apk
```

### Build APK via EAS (Cloud)
```bash
cd TalkTime-main
npm install -g eas-cli
eas login
eas build -p android --profile preview
```

---

## Troubleshooting

### "adb not found"
- Install Android SDK Platform Tools
- Add to PATH: `%ANDROID_HOME%\platform-tools`

### "ANDROID_HOME not set"
- Set environment variable as shown above
- Restart terminal

### "Device not found"
- Enable USB Debugging on phone
- Try different USB cable
- Install phone drivers (Google USB Driver)

### "Build failed"
- Clear cache: `npx expo start -c`
- Delete node_modules: `rm -rf node_modules && npm install`
- Clean Android build: `cd android && ./gradlew clean`

### "Permission denied" on gradlew
```bash
chmod +x android/gradlew
```

### App crashes on phone
- Check if API server is running
- Update API URL in `TalkTime-main/services/api.ts`
- Check phone logs: `adb logcat`

---

## Production Build (For Play Store)

### Step 1: Update app.json
```json
{
  "expo": {
    "name": "TalkTime",
    "slug": "talktime",
    "version": "1.0.0",
    "android": {
      "package": "com.yourcompany.talktime",
      "versionCode": 1
    }
  }
}
```

### Step 2: Generate Keystore
```bash
keytool -genkeypair -v -keystore my-release-key.keystore -alias my-key-alias -keyalg RSA -keysize 2048 -validity 10000
```

### Step 3: Build Release APK
```bash
eas build -p android --profile production
```

### Step 4: Submit to Play Store
```bash
eas submit -p android
```

---

## Recommended Workflow

### For Testing (Fastest):
1. Connect phone via USB
2. Run `npx expo run:android`
3. App installs and runs immediately

### For Sharing with Team:
1. Build APK: `eas build -p android --profile preview`
2. Share download link
3. Team members install APK

### For Production:
1. Build release: `eas build -p android --profile production`
2. Submit to Play Store: `eas submit -p android`

---

## Important Notes

1. **First build takes longer** (10-30 minutes)
2. **Subsequent builds are faster** (2-5 minutes)
3. **USB method is fastest** for development
4. **EAS build is easiest** for distribution
5. **Local build gives most control** but requires setup

## Next Steps After Installation

1. Open the app on your phone
2. Allow phone permissions when prompted
3. Login with your credentials
4. Test the call feature
5. Verify call duration tracking works

---

## File Sizes

- Debug APK: ~50-80 MB
- Release APK: ~30-50 MB (optimized)
- AAB (Play Store): ~25-40 MB (smallest)

---

## Support

If you encounter issues:
1. Check Expo documentation: https://docs.expo.dev
2. Check React Native docs: https://reactnative.dev
3. Check Android Studio logs
4. Run `adb logcat` for phone logs
