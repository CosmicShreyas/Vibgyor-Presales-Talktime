import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import apiService from '@/services/api';

type ConnectionStatus = 'connected' | 'reconnecting' | 'disconnected';

interface ConnectionContextType {
  status: ConnectionStatus;
  isConnected: boolean;
  retryCount: number;
  maxRetries: number;
}

const ConnectionContext = createContext<ConnectionContextType>({
  status: 'connected',
  isConnected: true,
  retryCount: 0,
  maxRetries: 3,
});

export const useConnection = () => useContext(ConnectionContext);

const MAX_RETRIES = 3;
const RETRY_INTERVAL = 3000; // 3 seconds
const HEALTH_CHECK_INTERVAL = 30000; // 30 seconds

export function ConnectionProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<ConnectionStatus>('connected');
  const [retryCount, setRetryCount] = useState(0);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const healthCheckIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const appState = useRef(AppState.currentState);

  const checkConnection = async (): Promise<boolean> => {
    try {
      // Use the dedicated health check endpoint
      const isHealthy = await apiService.checkHealth();
      return isHealthy;
    } catch (error) {
      console.log('Connection check failed:', error);
      return false;
    }
  };

  const attemptReconnect = async () => {
    if (retryCount >= MAX_RETRIES) {
      setStatus('disconnected');
      return;
    }

    setStatus('reconnecting');
    setRetryCount(prev => prev + 1);

    const isConnected = await checkConnection();

    if (isConnected) {
      setStatus('connected');
      setRetryCount(0);
      startHealthCheck();
    } else {
      // Schedule next retry
      retryTimeoutRef.current = setTimeout(() => {
        attemptReconnect();
      }, RETRY_INTERVAL);
    }
  };

  const startHealthCheck = () => {
    // Clear existing interval
    if (healthCheckIntervalRef.current) {
      clearInterval(healthCheckIntervalRef.current);
    }

    // Start periodic health checks
    healthCheckIntervalRef.current = setInterval(async () => {
      const isConnected = await checkConnection();
      
      if (!isConnected && status === 'connected') {
        // Connection lost, start reconnecting
        setStatus('reconnecting');
        setRetryCount(0);
        attemptReconnect();
      }
    }, HEALTH_CHECK_INTERVAL);
  };

  const handleAppStateChange = (nextAppState: AppStateStatus) => {
    if (
      appState.current.match(/inactive|background/) &&
      nextAppState === 'active'
    ) {
      // App came to foreground, check connection
      checkConnection().then(isConnected => {
        if (isConnected) {
          setStatus('connected');
          setRetryCount(0);
        } else if (status !== 'reconnecting') {
          attemptReconnect();
        }
      });
    }

    appState.current = nextAppState;
  };

  useEffect(() => {
    // Initial connection check
    checkConnection().then(isConnected => {
      if (isConnected) {
        setStatus('connected');
        startHealthCheck();
      } else {
        attemptReconnect();
      }
    });

    // Listen to app state changes
    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription.remove();
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
      if (healthCheckIntervalRef.current) {
        clearInterval(healthCheckIntervalRef.current);
      }
    };
  }, []);

  const value: ConnectionContextType = {
    status,
    isConnected: status === 'connected',
    retryCount,
    maxRetries: MAX_RETRIES,
  };

  return (
    <ConnectionContext.Provider value={value}>
      {children}
    </ConnectionContext.Provider>
  );
}
