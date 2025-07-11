import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { showMessage } from 'react-native-flash-message';

// API Configuration
const BASE_URL = __DEV__ 
  ? 'http://10.0.2.2:5000/api'  // Android emulator
  : 'https://your-production-api.com/api';

// Create axios instance
const api = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Token refresh promise to prevent multiple refresh requests
let refreshPromise = null;

// Request interceptor to add auth token
api.interceptors.request.use(
  async (config) => {
    try {
      const tokens = await AsyncStorage.getItem('tokens');
      if (tokens) {
        const parsedTokens = JSON.parse(tokens);
        if (parsedTokens.accessToken) {
          config.headers.Authorization = `Bearer ${parsedTokens.accessToken}`;
        }
      }
    } catch (error) {
      console.error('Error adding auth token:', error);
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // If the error is 401 and we haven't already tried to refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // If there's already a refresh in progress, wait for it
        if (refreshPromise) {
          await refreshPromise;
          return api(originalRequest);
        }

        // Start token refresh
        refreshPromise = refreshAccessToken();
        const newTokens = await refreshPromise;
        refreshPromise = null;

        if (newTokens) {
          // Update the original request with new token
          originalRequest.headers.Authorization = `Bearer ${newTokens.accessToken}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        refreshPromise = null;
        console.error('Token refresh failed:', refreshError);
        
        // Clear storage and redirect to login
        await clearAuthData();
        
        // Show error message
        showMessage({
          message: 'Session expired. Please login again.',
          type: 'warning',
        });
        
        // You might want to navigate to login screen here
        // navigationRef.current?.navigate('Login');
        
        return Promise.reject(refreshError);
      }
    }

    // Handle other error responses
    if (error.response) {
      const { status, data } = error.response;
      
      switch (status) {
        case 400:
          showMessage({
            message: data.message || 'Invalid request',
            type: 'danger',
          });
          break;
        case 403:
          showMessage({
            message: 'Access denied',
            type: 'warning',
          });
          break;
        case 404:
          showMessage({
            message: 'Resource not found',
            type: 'warning',
          });
          break;
        case 500:
          showMessage({
            message: 'Server error. Please try again later.',
            type: 'danger',
          });
          break;
        default:
          if (data?.message) {
            showMessage({
              message: data.message,
              type: 'danger',
            });
          }
      }
    } else if (error.request) {
      // Network error
      showMessage({
        message: 'Network error. Please check your connection.',
        type: 'danger',
      });
    }

    return Promise.reject(error);
  }
);

// Function to refresh access token
const refreshAccessToken = async () => {
  try {
    const tokens = await AsyncStorage.getItem('tokens');
    if (!tokens) {
      throw new Error('No tokens found');
    }

    const parsedTokens = JSON.parse(tokens);
    if (!parsedTokens.refreshToken) {
      throw new Error('No refresh token found');
    }

    // Make refresh request without interceptors to avoid infinite loop
    const response = await axios.post(
      `${BASE_URL}/auth/refresh`,
      { refreshToken: parsedTokens.refreshToken },
      { headers: { 'Content-Type': 'application/json' } }
    );

    const newTokens = response.data.data.tokens;
    
    // Store new tokens
    await AsyncStorage.setItem('tokens', JSON.stringify(newTokens));
    
    return newTokens;
  } catch (error) {
    console.error('Token refresh failed:', error);
    throw error;
  }
};

// Function to clear authentication data
const clearAuthData = async () => {
  try {
    await AsyncStorage.multiRemove(['tokens', 'user']);
  } catch (error) {
    console.error('Error clearing auth data:', error);
  }
};

// Helper function to set authorization header
export const setAuthToken = (token) => {
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common['Authorization'];
  }
};

// Helper function to check if response is successful
export const isSuccess = (response) => {
  return response.status >= 200 && response.status < 300;
};

// Helper function to extract error message
export const getErrorMessage = (error) => {
  if (error.response?.data?.message) {
    return error.response.data.message;
  }
  if (error.message) {
    return error.message;
  }
  return 'An unexpected error occurred';
};

// Export API configuration
export const API_CONFIG = {
  BASE_URL,
  TIMEOUT: 30000,
};

export default api;