import api from './api';

class AuthService {
  constructor() {
    this.tokens = null;
  }

  // Set tokens for API requests
  setTokens(tokens) {
    this.tokens = tokens;
    if (tokens?.accessToken) {
      api.defaults.headers.common['Authorization'] = `Bearer ${tokens.accessToken}`;
    }
  }

  // Clear tokens
  clearTokens() {
    this.tokens = null;
    delete api.defaults.headers.common['Authorization'];
  }

  // Get current tokens
  getTokens() {
    return this.tokens;
  }

  // Register new user
  async register(userData) {
    const response = await api.post('/auth/register', userData);
    return response.data;
  }

  // Login user
  async login(email, password) {
    const response = await api.post('/auth/login', {
      email,
      password,
    });
    return response.data;
  }

  // Logout user
  async logout() {
    const response = await api.post('/auth/logout');
    return response.data;
  }

  // Get current user
  async getCurrentUser() {
    const response = await api.get('/auth/me');
    return response.data;
  }

  // Refresh access token
  async refreshToken(refreshToken) {
    const response = await api.post('/auth/refresh', {
      refreshToken,
    });
    return response.data;
  }

  // Forgot password
  async forgotPassword(email) {
    const response = await api.post('/auth/forgot-password', {
      email,
    });
    return response.data;
  }

  // Reset password
  async resetPassword(token, password) {
    const response = await api.post('/auth/reset-password', {
      token,
      password,
    });
    return response.data;
  }

  // Change password
  async changePassword(currentPassword, newPassword) {
    const response = await api.post('/auth/change-password', {
      currentPassword,
      newPassword,
    });
    return response.data;
  }

  // Verify email
  async verifyEmail(token) {
    const response = await api.post('/auth/verify-email', {
      token,
    });
    return response.data;
  }

  // Resend verification email
  async resendVerification() {
    const response = await api.post('/auth/resend-verification');
    return response.data;
  }

  // Update user profile
  async updateProfile(userData) {
    const response = await api.put('/users/profile', userData);
    return response.data;
  }

  // Update user preferences
  async updatePreferences(preferences) {
    const response = await api.put('/users/preferences', preferences);
    return response.data;
  }

  // Add device token for push notifications
  async addDeviceToken(token, platform) {
    const response = await api.post('/users/device-token', {
      token,
      platform,
    });
    return response.data;
  }

  // Remove device token
  async removeDeviceToken(token) {
    const response = await api.delete('/users/device-token', {
      data: { token },
    });
    return response.data;
  }

  // Get user statistics
  async getUserStats() {
    const response = await api.get('/users/stats');
    return response.data;
  }
}

export default new AuthService();