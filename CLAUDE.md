# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with the **TalkTime** mono‑repo.


## Prerequisites
- Install Node.js (>=20) and npm.
- `npx expo install` will install native dependencies.
- (Optional) EAS CLI `npm i -g eas-cli` for production builds.

## Common Commands

### Expo/React‑Native (TalkTime‑main)
| Action | Command |
|-------|----------|
| Start dev server | `npm run start` |
| Start dev server with clearing cache | `npm run start:clear` |
| Run Android emulator | `npm run android` |
| Run iOS simulator | `npm run ios` |
| Open web version | `npm run web` |
| Lint | `npm run lint` |

### Client (React Vite)
| Action | Command |
|-------|----------|
| Dev server | `npm run dev` |
| Build | `npm run build` |
| Preview | `npm run preview` |

### Server (Express)
| Action | Command |
|-------|----------|
| Dev | `npm run dev` |
| Build/Start | `npm run start` |
| Setup | `npm run setup` |
| Reset DB | `npm run reset-db` |

If you want to debug the app in a physical device use `adb install` to drop an APK.

## Architecture Overview

- **Expo Router** drives navigation via file‑based routes under `app/`.
- Global state uses **Zustand** with optional persistence to AsyncStorage.
- Backend services are provided by **Supabase** (`@supabase/supabase-js`). API keys are stored in a `.env` file (ignored by git).
- Phone‑call functionality relies on native Android APIs (`CALL_PHONE`, `READ_PHONE_STATE`). Expo Go is insufficient; a development or standalone build is required.
- Styling largely uses **react-native-paper** and **react-native-vector-icons** with a shared theme defined in `theme.ts`.
- Unit testing is currently not in place; consider adding Jest/Wrapped tests in `__tests__`.

## Important Notes
- Expo Go does not support custom native permissions; tests that require calling need a real device or a build configured via EAS.
- `npm install` installs both `npm` and `yarn` compatible dependencies; use `yarn` if preferred.
- Environment variables should be added to a `.env` file at the repo root.
