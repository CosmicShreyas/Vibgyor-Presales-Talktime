# Fix Axios Module Resolution Error

## Problem
Metro bundler cannot resolve axios modules due to incorrect version and missing configuration.

## Solution

### Step 1: Delete node_modules and lock files
```bash
cd TalkTime-main
rm -rf node_modules
rm package-lock.json
# If using pnpm
rm pnpm-lock.yaml
```

### Step 2: Install dependencies
```bash
npm install
# or if using pnpm
pnpm install
```

### Step 3: Clear Metro cache
```bash
npx expo start --clear
```

## Changes Made

1. **Updated package.json**
   - Changed axios version from `^1.15.1` to `^1.7.7`
   - Version 1.15.1 doesn't exist, causing module resolution issues

2. **Created metro.config.js**
   - Added support for `.cjs` file extensions
   - Helps Metro resolve CommonJS modules properly

3. **Files Created/Modified**
   - `metro.config.js` - Metro bundler configuration
   - `package.json` - Fixed axios version

## Alternative: Use fetch API instead of axios

If axios continues to cause issues, you can use the native fetch API:

### Update services/api.ts

```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = 'http://192.168.1.10:5000/api';

// Helper to make authenticated requests
const fetchWithAuth = async (endpoint: string, options: RequestInit = {}) => {
  const token = await AsyncStorage.getItem('authToken');
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });
  
  if (response.status === 401) {
    await AsyncStorage.removeItem('authToken');
    await AsyncStorage.removeItem('employee');
    throw new Error('Unauthorized');
  }
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Request failed');
  }
  
  return response.json();
};

// Example usage
export const apiService = {
  login: async (identifier: string, password: string, type: 'employee' | 'mapping') => {
    const payload = type === 'employee' 
      ? { employeeId: identifier, password }
      : { mappingId: identifier, password };
    
    const data = await fetchWithAuth('/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    
    if (data.token) {
      await AsyncStorage.setItem('authToken', data.token);
      await AsyncStorage.setItem('employee', JSON.stringify(data.user));
    }
    
    return data;
  },
  
  getLeads: async () => {
    return fetchWithAuth('/clients');
  },
  
  // ... other methods
};
```

## Recommended Steps

1. Try the npm install approach first
2. If that doesn't work, switch to fetch API
3. Fetch API is native to React Native and has no dependencies

## Testing

After fixing, test:
```bash
# Clear everything
npx expo start --clear

# Test on device
npx expo start --android
# or
npx expo start --ios
```

## Notes

- Axios version 1.15.1 doesn't exist (typo in original package.json)
- Latest stable axios is 1.7.x
- React Native has native fetch API support
- No additional dependencies needed for fetch
