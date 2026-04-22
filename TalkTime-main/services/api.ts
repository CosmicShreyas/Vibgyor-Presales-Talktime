import axios, { AxiosInstance, AxiosRequestConfig, AxiosError } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Update this to your server URL
// For local development on Android emulator: http://10.0.2.2:5000/api
// For local development on iOS simulator: http://localhost:5000/api
// For physical device on same network: http://YOUR_COMPUTER_IP:5000/api (e.g., http://192.168.1.100:5000/api)
// For production: https://your-production-server.com/api
const API_BASE_URL = 'http://192.168.1.21:5000/api';

console.log('API Base URL:', API_BASE_URL); // Debug log

const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use(
  async (config: any) => {
    const token = await AsyncStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// Handle response errors
api.interceptors.response.use(
  (response: any) => response,
  async (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      await AsyncStorage.removeItem('authToken');
      await AsyncStorage.removeItem('employee');
    }
    
    // Add more context to network errors
    if (!error.response) {
      error.message = 'Network error. Please check your connection and server URL.';
    }
    
    return Promise.reject(error);
  }
);

// Types
export interface User {
  _id: string;
  id: string;
  employeeId?: string;
  mappingId?: string;
  name: string;
  email: string;
  role: 'admin' | 'sales' | 'mapping';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export interface Lead {
  _id: string;
  name: string;
  phone: string;
  alternatePhone?: string;
  email?: string;
  company?: string;
  source?: string;
  project?: string;
  city?: string;
  budget?: string;
  status: 'pending' | 'no-response' | 'not-interested' | 'qualified' | 'number-inactive' | 
          'number-switched-off' | 'on-hold' | 'no-requirement' | 'follow-up' | 
          'disqualified' | 'disconnected' | 'already-finalised';
  priority?: 'low' | 'medium' | 'high';
  notes?: string;
  assignedTo?: {
    _id: string;
    name: string;
    email: string;
    employeeId?: string;
  };
  isUnassigned?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CallRecord {
  _id: string;
  clientId: string | {
    _id: string;
    name: string;
    company?: string;
    phone: string;
    email?: string;
  };
  employeeId: string | {
    _id: string;
    name: string;
    email: string;
  };
  status: string;
  notes?: string;
  callbackDate?: string;
  callDuration?: number;
  timestamp: string;
  createdAt: string;
  updatedAt: string;
}

export interface CallStats {
  totalCalls: number;
  thisMonth: number;
  successRate: number;
}

// API Service
const apiService = {
  // ============ Authentication ============
  
  /**
   * Login with employeeId or mappingId
   */
  login: async (identifier: string, password: string, type: 'employee' | 'mapping' = 'employee'): Promise<LoginResponse> => {
    const payload = type === 'employee' 
      ? { employeeId: identifier, password }
      : { mappingId: identifier, password };
    
    const response = await api.post<LoginResponse>('/auth/login', payload);
    
    // Store token and user data
    if (response.data.token) {
      await AsyncStorage.setItem('authToken', response.data.token);
      await AsyncStorage.setItem('employee', JSON.stringify(response.data.user));
    }
    
    return response.data;
  },

  /**
   * Get current user information
   */
  getCurrentUser: async (): Promise<User> => {
    const response = await api.get<User>('/auth/me');
    return response.data;
  },

  /**
   * Logout
   */
  logout: async (): Promise<void> => {
    await AsyncStorage.removeItem('authToken');
    await AsyncStorage.removeItem('employee');
  },

  // ============ Leads ============
  
  /**
   * Get all leads (assigned to current user for sales, all for admin)
   */
  getLeads: async (): Promise<Lead[]> => {
    const response = await api.get<Lead[]>('/clients');
    return response.data;
  },

  /**
   * Get a single lead by ID
   */
  getLead: async (id: string): Promise<Lead> => {
    const response = await api.get<Lead>(`/clients/${id}`);
    return response.data;
  },

  /**
   * Update a lead
   */
  updateLead: async (id: string, data: Partial<Lead>): Promise<Lead> => {
    const response = await api.put<Lead>(`/clients/${id}`, data);
    return response.data;
  },

  /**
   * Get unassigned leads (admin only)
   */
  getUnassignedLeads: async (): Promise<Lead[]> => {
    const response = await api.get<Lead[]>('/clients/unassigned');
    return response.data;
  },

  // ============ Call Records ============
  
  /**
   * Create a call record
   */
  createCallRecord: async (data: {
    clientId: string;
    status: string;
    notes?: string;
    callbackDate?: string;
    callDuration?: number;
    timestamp?: string;
  }): Promise<CallRecord> => {
    const response = await api.post<CallRecord>('/calls', data);
    return response.data;
  },

  /**
   * Get call history for current user
   */
  getCallHistory: async (): Promise<CallRecord[]> => {
    const response = await api.get<CallRecord[]>('/calls/history');
    return response.data;
  },

  /**
   * Get call history for a specific lead
   */
  getLeadCallHistory: async (clientId: string): Promise<CallRecord[]> => {
    const response = await api.get<CallRecord[]>(`/calls/client/${clientId}`);
    return response.data;
  },

  /**
   * Get call statistics for current user
   */
  getCallStats: async (): Promise<CallStats> => {
    const response = await api.get<CallStats>('/calls/stats');
    return response.data;
  },

  // ============ Utility ============
  
  /**
   * Check if user is authenticated
   */
  isAuthenticated: async (): Promise<boolean> => {
    const token = await AsyncStorage.getItem('authToken');
    return !!token;
  },

  /**
   * Get stored user data
   */
  getStoredUser: async (): Promise<User | null> => {
    const userData = await AsyncStorage.getItem('employee');
    return userData ? JSON.parse(userData) : null;
  },

  /**
   * Update API base URL (useful for switching environments)
   */
  setBaseURL: (url: string): void => {
    api.defaults.baseURL = url;
  },

  /**
   * Get current API base URL
   */
  getBaseURL: (): string => {
    return api.defaults.baseURL || API_BASE_URL;
  },

  /**
   * Check API health
   */
  checkHealth: async (): Promise<boolean> => {
    try {
      const response = await axios.get(`${api.defaults.baseURL || API_BASE_URL}/health`, {
        timeout: 5000, // 5 second timeout for health check
      });
      return response.status === 200 && response.data?.status === 'OK';
    } catch (error) {
      console.log('Health check failed:', error);
      return false;
    }
  },
};

export default apiService;
export { api };
