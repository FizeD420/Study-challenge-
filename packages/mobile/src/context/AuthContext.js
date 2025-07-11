import React, { createContext, useContext, useReducer, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { showMessage } from 'react-native-flash-message';
import authService from '../services/authService';

const AuthContext = createContext();

// Initial state
const initialState = {
  user: null,
  tokens: null,
  isLoading: true,
  isAuthenticated: false,
  isInitialized: false,
};

// Action types
const AUTH_ACTIONS = {
  INITIALIZE: 'INITIALIZE',
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGOUT: 'LOGOUT',
  UPDATE_USER: 'UPDATE_USER',
  SET_LOADING: 'SET_LOADING',
  REFRESH_TOKEN: 'REFRESH_TOKEN',
};

// Reducer function
const authReducer = (state, action) => {
  switch (action.type) {
    case AUTH_ACTIONS.INITIALIZE:
      return {
        ...state,
        isLoading: false,
        isInitialized: true,
        user: action.payload.user,
        tokens: action.payload.tokens,
        isAuthenticated: !!action.payload.user,
      };

    case AUTH_ACTIONS.LOGIN_SUCCESS:
      return {
        ...state,
        isLoading: false,
        user: action.payload.user,
        tokens: action.payload.tokens,
        isAuthenticated: true,
      };

    case AUTH_ACTIONS.LOGOUT:
      return {
        ...state,
        user: null,
        tokens: null,
        isAuthenticated: false,
        isLoading: false,
      };

    case AUTH_ACTIONS.UPDATE_USER:
      return {
        ...state,
        user: { ...state.user, ...action.payload },
      };

    case AUTH_ACTIONS.SET_LOADING:
      return {
        ...state,
        isLoading: action.payload,
      };

    case AUTH_ACTIONS.REFRESH_TOKEN:
      return {
        ...state,
        tokens: action.payload,
      };

    default:
      return state;
  }
};

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Initialize auth state on app start
  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    try {
      const tokens = await AsyncStorage.getItem('tokens');
      const user = await AsyncStorage.getItem('user');

      if (tokens && user) {
        const parsedTokens = JSON.parse(tokens);
        const parsedUser = JSON.parse(user);

        // Set tokens in auth service
        authService.setTokens(parsedTokens);

        // Verify token validity by fetching user data
        try {
          const userData = await authService.getCurrentUser();
          dispatch({
            type: AUTH_ACTIONS.INITIALIZE,
            payload: {
              user: userData.user,
              tokens: parsedTokens,
            },
          });
        } catch (error) {
          // Token invalid, clear storage
          await clearStorage();
          dispatch({
            type: AUTH_ACTIONS.INITIALIZE,
            payload: { user: null, tokens: null },
          });
        }
      } else {
        dispatch({
          type: AUTH_ACTIONS.INITIALIZE,
          payload: { user: null, tokens: null },
        });
      }
    } catch (error) {
      console.error('Auth initialization error:', error);
      dispatch({
        type: AUTH_ACTIONS.INITIALIZE,
        payload: { user: null, tokens: null },
      });
    }
  };

  const clearStorage = async () => {
    await AsyncStorage.multiRemove(['tokens', 'user']);
  };

  const login = async (email, password) => {
    try {
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true });

      const response = await authService.login(email, password);
      const { user, tokens } = response.data;

      // Store in AsyncStorage
      await AsyncStorage.setItem('tokens', JSON.stringify(tokens));
      await AsyncStorage.setItem('user', JSON.stringify(user));

      // Set tokens in auth service
      authService.setTokens(tokens);

      dispatch({
        type: AUTH_ACTIONS.LOGIN_SUCCESS,
        payload: { user, tokens },
      });

      showMessage({
        message: 'Login successful!',
        type: 'success',
      });

      return { success: true };
    } catch (error) {
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false });
      
      const message = error.response?.data?.message || 'Login failed. Please try again.';
      showMessage({
        message,
        type: 'danger',
      });

      return { success: false, error: message };
    }
  };

  const register = async (userData) => {
    try {
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true });

      const response = await authService.register(userData);
      const { user, tokens } = response.data;

      // Store in AsyncStorage
      await AsyncStorage.setItem('tokens', JSON.stringify(tokens));
      await AsyncStorage.setItem('user', JSON.stringify(user));

      // Set tokens in auth service
      authService.setTokens(tokens);

      dispatch({
        type: AUTH_ACTIONS.LOGIN_SUCCESS,
        payload: { user, tokens },
      });

      showMessage({
        message: 'Registration successful! Please verify your email.',
        type: 'success',
      });

      return { success: true };
    } catch (error) {
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false });
      
      const message = error.response?.data?.message || 'Registration failed. Please try again.';
      showMessage({
        message,
        type: 'danger',
      });

      return { success: false, error: message };
    }
  };

  const logout = async () => {
    try {
      // Call logout API
      await authService.logout();
    } catch (error) {
      console.error('Logout API error:', error);
    } finally {
      // Clear local storage and state regardless of API call result
      await clearStorage();
      authService.clearTokens();
      
      dispatch({ type: AUTH_ACTIONS.LOGOUT });

      showMessage({
        message: 'Logged out successfully',
        type: 'info',
      });
    }
  };

  const updateUser = async (userData) => {
    try {
      const response = await authService.updateProfile(userData);
      const updatedUser = response.data.user;

      // Update AsyncStorage
      await AsyncStorage.setItem('user', JSON.stringify(updatedUser));

      dispatch({
        type: AUTH_ACTIONS.UPDATE_USER,
        payload: updatedUser,
      });

      showMessage({
        message: 'Profile updated successfully',
        type: 'success',
      });

      return { success: true, user: updatedUser };
    } catch (error) {
      const message = error.response?.data?.message || 'Update failed. Please try again.';
      showMessage({
        message,
        type: 'danger',
      });

      return { success: false, error: message };
    }
  };

  const refreshToken = async () => {
    try {
      if (!state.tokens?.refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await authService.refreshToken(state.tokens.refreshToken);
      const newTokens = response.data.tokens;

      // Update AsyncStorage
      await AsyncStorage.setItem('tokens', JSON.stringify(newTokens));

      // Set new tokens in auth service
      authService.setTokens(newTokens);

      dispatch({
        type: AUTH_ACTIONS.REFRESH_TOKEN,
        payload: newTokens,
      });

      return newTokens;
    } catch (error) {
      console.error('Token refresh failed:', error);
      // If refresh fails, logout user
      await logout();
      throw error;
    }
  };

  const forgotPassword = async (email) => {
    try {
      await authService.forgotPassword(email);
      
      showMessage({
        message: 'Password reset instructions sent to your email',
        type: 'success',
      });

      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to send reset email';
      showMessage({
        message,
        type: 'danger',
      });

      return { success: false, error: message };
    }
  };

  const changePassword = async (currentPassword, newPassword) => {
    try {
      await authService.changePassword(currentPassword, newPassword);
      
      showMessage({
        message: 'Password changed successfully',
        type: 'success',
      });

      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to change password';
      showMessage({
        message,
        type: 'danger',
      });

      return { success: false, error: message };
    }
  };

  const verifyEmail = async (token) => {
    try {
      await authService.verifyEmail(token);
      
      // Update user verification status
      dispatch({
        type: AUTH_ACTIONS.UPDATE_USER,
        payload: { isEmailVerified: true },
      });

      showMessage({
        message: 'Email verified successfully',
        type: 'success',
      });

      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Email verification failed';
      showMessage({
        message,
        type: 'danger',
      });

      return { success: false, error: message };
    }
  };

  const resendVerification = async () => {
    try {
      await authService.resendVerification();
      
      showMessage({
        message: 'Verification email sent',
        type: 'success',
      });

      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to send verification email';
      showMessage({
        message,
        type: 'danger',
      });

      return { success: false, error: message };
    }
  };

  const value = {
    // State
    ...state,
    
    // Actions
    login,
    register,
    logout,
    updateUser,
    refreshToken,
    forgotPassword,
    changePassword,
    verifyEmail,
    resendVerification,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;