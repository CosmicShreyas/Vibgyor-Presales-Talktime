# TalkTime Mobile API Integration Guide

This guide explains how to use the integrated API service in the TalkTime mobile application.

## Setup

The API service is already configured in `services/api.ts`. Make sure to update the `API_BASE_URL` constant based on your environment:

```typescript
// For Android Emulator
const API_BASE_URL = 'http://10.0.2.2:5000/api';

// For iOS Simulator
const API_BASE_URL = 'http://localhost:5000/api';

// For Physical Device (same network)
const API_BASE_URL = 'http://192.168.1.10:5000/api';

// For Production
const API_BASE_URL = 'https://your-production-server.com/api';
```

## Import the API Service

```typescript
import apiService from '../services/api';
```

## Authentication

### Login (Sales Employee)
```typescript
try {
  const response = await apiService.login('VIB_001', 'sales123', 'employee');
  console.log('Logged in:', response.user);
  // Token is automatically stored
} catch (error) {
  console.error('Login failed:', error.response?.data?.message);
}
```

### Login (Mapping Partner)
```typescript
try {
  const response = await apiService.login('VIB2-1234', 'mapping123', 'mapping');
  console.log('Logged in:', response.user);
} catch (error) {
  console.error('Login failed:', error.response?.data?.message);
}
```

### Get Current User
```typescript
try {
  const user = await apiService.getCurrentUser();
  console.log('Current user:', user);
} catch (error) {
  console.error('Failed to get user:', error);
}
```

### Logout
```typescript
await apiService.logout();
```

### Check Authentication Status
```typescript
const isAuth = await apiService.isAuthenticated();
if (isAuth) {
  console.log('User is authenticated');
}
```

### Get Stored User Data
```typescript
const user = await apiService.getStoredUser();
if (user) {
  console.log('Stored user:', user.name);
}
```

## Leads Management

### Get All Leads (Assigned to Current User)
```typescript
try {
  const leads = await apiService.getLeads();
  console.log('Total leads:', leads.length);
  leads.forEach(lead => {
    console.log(`${lead.name} - ${lead.status}`);
  });
} catch (error) {
  console.error('Failed to fetch leads:', error);
}
```

### Get Single Lead
```typescript
try {
  const lead = await apiService.getLead('507f1f77bcf86cd799439011');
  console.log('Lead details:', lead);
} catch (error) {
  console.error('Failed to fetch lead:', error);
}
```

### Update Lead Status
```typescript
try {
  const updatedLead = await apiService.updateLead('507f1f77bcf86cd799439011', {
    status: 'qualified',
    notes: 'Customer is interested in premium package'
  });
  console.log('Lead updated:', updatedLead);
} catch (error) {
  console.error('Failed to update lead:', error);
}
```

### Get Unassigned Leads (Admin Only)
```typescript
try {
  const unassignedLeads = await apiService.getUnassignedLeads();
  console.log('Unassigned leads:', unassignedLeads.length);
} catch (error) {
  console.error('Failed to fetch unassigned leads:', error);
}
```

## Call Records

### Create Call Record
```typescript
try {
  const callRecord = await apiService.createCallRecord({
    clientId: '507f1f77bcf86cd799439011',
    status: 'qualified',
    notes: 'Discussed pricing and features',
    callDuration: 180, // seconds
    timestamp: new Date().toISOString()
  });
  console.log('Call recorded:', callRecord);
} catch (error) {
  console.error('Failed to create call record:', error);
}
```

### Get Call History
```typescript
try {
  const history = await apiService.getCallHistory();
  console.log('Call history:', history.length);
  history.forEach(call => {
    console.log(`${call.timestamp} - ${call.status}`);
  });
} catch (error) {
  console.error('Failed to fetch call history:', error);
}
```

### Get Call History for Specific Lead
```typescript
try {
  const leadHistory = await apiService.getLeadCallHistory('507f1f77bcf86cd799439011');
  console.log('Lead call history:', leadHistory);
} catch (error) {
  console.error('Failed to fetch lead call history:', error);
}
```

### Get Call Statistics
```typescript
try {
  const stats = await apiService.getCallStats();
  console.log('Total calls:', stats.totalCalls);
  console.log('This month:', stats.thisMonth);
  console.log('Success rate:', stats.successRate + '%');
} catch (error) {
  console.error('Failed to fetch stats:', error);
}
```

## Complete Example: Login Screen

```typescript
import React, { useState } from 'react';
import { View, TextInput, Button, Alert } from 'react-native';
import apiService from '../services/api';

const LoginScreen = ({ navigation }) => {
  const [employeeId, setEmployeeId] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!employeeId || !password) {
      Alert.alert('Error', 'Please enter Employee ID and password');
      return;
    }

    setLoading(true);
    try {
      const response = await apiService.login(employeeId, password, 'employee');
      Alert.alert('Success', `Welcome ${response.user.name}!`);
      navigation.replace('Home');
    } catch (error: any) {
      Alert.alert(
        'Login Failed',
        error.response?.data?.message || 'Invalid credentials'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <View>
      <TextInput
        placeholder="Employee ID (e.g., VIB_001)"
        value={employeeId}
        onChangeText={setEmployeeId}
        autoCapitalize="characters"
      />
      <TextInput
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      <Button
        title={loading ? 'Logging in...' : 'Login'}
        onPress={handleLogin}
        disabled={loading}
      />
    </View>
  );
};

export default LoginScreen;
```

## Complete Example: Leads List Screen

```typescript
import React, { useState, useEffect } from 'react';
import { View, FlatList, Text, TouchableOpacity, RefreshControl } from 'react-native';
import apiService from '../services/api';

const LeadsScreen = ({ navigation }) => {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchLeads = async () => {
    setLoading(true);
    try {
      const data = await apiService.getLeads();
      setLeads(data);
    } catch (error) {
      console.error('Failed to fetch leads:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  const renderLead = ({ item }) => (
    <TouchableOpacity
      onPress={() => navigation.navigate('LeadDetail', { leadId: item._id })}
    >
      <View>
        <Text>{item.name}</Text>
        <Text>{item.phone}</Text>
        <Text>Status: {item.status}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <FlatList
      data={leads}
      renderItem={renderLead}
      keyExtractor={(item) => item._id}
      refreshControl={
        <RefreshControl refreshing={loading} onRefresh={fetchLeads} />
      }
    />
  );
};

export default LeadsScreen;
```

## Complete Example: Call Recording

```typescript
import React, { useState } from 'react';
import { View, Button, TextInput, Alert } from 'react-native';
import apiService from '../services/api';

const CallRecordScreen = ({ route, navigation }) => {
  const { leadId } = route.params;
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState('qualified');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await apiService.createCallRecord({
        clientId: leadId,
        status: status,
        notes: notes,
        callDuration: 120,
        timestamp: new Date().toISOString()
      });
      
      Alert.alert('Success', 'Call recorded successfully');
      navigation.goBack();
    } catch (error: any) {
      Alert.alert(
        'Error',
        error.response?.data?.message || 'Failed to record call'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <View>
      <TextInput
        placeholder="Call notes"
        value={notes}
        onChangeText={setNotes}
        multiline
      />
      <Button
        title={loading ? 'Saving...' : 'Save Call Record'}
        onPress={handleSubmit}
        disabled={loading}
      />
    </View>
  );
};

export default CallRecordScreen;
```

## Error Handling

All API calls should be wrapped in try-catch blocks:

```typescript
try {
  const data = await apiService.getLeads();
  // Handle success
} catch (error: any) {
  if (error.response) {
    // Server responded with error
    console.error('Server error:', error.response.data.message);
  } else if (error.request) {
    // Request made but no response
    console.error('Network error:', error.message);
  } else {
    // Other errors
    console.error('Error:', error.message);
  }
}
```

## Available Lead Statuses

- `pending` - Initial status, not yet contacted
- `no-response` - No answer from client
- `not-interested` - Client not interested
- `qualified` - Qualified lead (triggers Vibgyor API sync)
- `number-inactive` - Phone number inactive
- `number-switched-off` - Phone switched off
- `on-hold` - Client asked to hold/wait
- `no-requirement` - No current requirement
- `follow-up` - Needs follow-up call
- `disqualified` - Lead disqualified
- `disconnected` - Call disconnected
- `already-finalised` - Already finalized with another provider

## TypeScript Types

All types are exported from the API service:

```typescript
import apiService, { User, Lead, CallRecord, CallStats } from '../services/api';

const user: User = await apiService.getCurrentUser();
const leads: Lead[] = await apiService.getLeads();
const stats: CallStats = await apiService.getCallStats();
```

## Utility Functions

### Change API Base URL
```typescript
apiService.setBaseURL('https://new-server.com/api');
```

### Get Current Base URL
```typescript
const url = apiService.getBaseURL();
console.log('API URL:', url);
```

## Notes

- All API calls require authentication (except login)
- Token is automatically added to all requests
- Token is stored in AsyncStorage
- 401 errors automatically clear stored credentials
- Network errors include helpful messages
- All timestamps are in ISO 8601 format
