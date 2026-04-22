import apiService, { User } from './api';

export interface AuthResult {
  success: boolean;
  employee?: User;
  error?: string;
}

export const authService = {
  login: async (identifier: string, password: string): Promise<AuthResult> => {
    try {
      // Determine if it's an employee ID or mapping ID based on format
      const type = identifier.toUpperCase().startsWith('VIB2-') ? 'mapping' : 'employee';
      
      const response = await apiService.login(identifier, password, type);
      
      return {
        success: true,
        employee: response.user as any, // User type is compatible with Employee
      };
    } catch (error: any) {
      console.error('Login error:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Invalid credentials. Please try again.',
      };
    }
  },

  logout: async (): Promise<void> => {
    try {
      await apiService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  },

  getCurrentUser: async (): Promise<User | null> => {
    try {
      return await apiService.getCurrentUser();
    } catch (error) {
      console.error('Get current user error:', error);
      return null;
    }
  },

  isAuthenticated: async (): Promise<boolean> => {
    return await apiService.isAuthenticated();
  },
};
