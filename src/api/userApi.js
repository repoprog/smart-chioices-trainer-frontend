import apiClient from './apiClient';
import { API_PATHS } from '../constants/apiConstants';

export const userApi = {
  updateProfile: async (profileData) => {
    
    const response = await apiClient.put(API_PATHS.USERS.PROFILE, profileData);
    return response.data;
  },

  updatePassword: async (passwordData) => {
    // passwordData to obiekt { currentPassword, newPassword }
    const response = await apiClient.put(API_PATHS.USERS.PASSWORD, passwordData);
    return response.data;
  }
};