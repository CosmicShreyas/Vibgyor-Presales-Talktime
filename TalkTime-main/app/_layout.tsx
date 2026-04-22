import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Platform } from 'react-native';
import { AlertProvider } from '@/template';
import { AuthProvider } from '@/contexts/AuthContext';
import { CallsProvider } from '@/contexts/CallsContext';
import { ConnectionProvider } from '@/contexts/ConnectionContext';
import { phoneService } from '@/services/phoneService';
import { ErrorBoundary } from '@/components/ErrorBoundary';

export default function RootLayout() {
  useEffect(() => {
    // Request phone permissions on Android when app starts
    if (Platform.OS === 'android') {
      phoneService.requestPhonePermissions().catch(err => {
        console.warn('Failed to request phone permissions:', err);
      });
    }
  }, []);

  return (
    <ErrorBoundary>
      <AlertProvider>
        <SafeAreaProvider>
          <ConnectionProvider>
            <AuthProvider>
              <CallsProvider>
                <Stack screenOptions={{ headerShown: false }}>
                  <Stack.Screen name="index" />
                  <Stack.Screen name="login" />
                  <Stack.Screen name="(tabs)" />
                </Stack>
              </CallsProvider>
            </AuthProvider>
          </ConnectionProvider>
        </SafeAreaProvider>
      </AlertProvider>
    </ErrorBoundary>
  );
}
