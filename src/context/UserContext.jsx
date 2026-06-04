import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import http from '../utils/http';
import { authStorage } from '../utils/auth';
import { toast } from '../utils/toast';
import { updateFCMTokenWithCustomerId, removeCustomerIdFromFCMToken } from '../utils/initializeNotifications';
import { userAPI } from '../utils/api';

const UserContext = createContext(null);

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);

  const loadMe = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await http.get('/auth/customer/me');
      setUser(data);
      
      // Update FCM token with customerId after user data is loaded
      if (data) {
        const customerId = data.id || data._id;
        if (customerId) {
          // Update FCM token in background (don't block UI)
          updateFCMTokenWithCustomerId(customerId).catch(err => {
            console.warn("Failed to update FCM token:", err);
          });
        }
      }
      
      return data;
    } catch (err) {
      setUser(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const login = useCallback(async (email, password) => {
    const { data } = await http.post('/auth/customer/login', { email, password });
    const access = data?.token;
    const refresh = data?.refreshToken;
    if (access && refresh) {
      authStorage.setAccessToken(access);
      authStorage.setRefreshToken(refresh);
    }
    await loadMe();
    // toast.success('Logged in successfully');
  }, [loadMe]);

  const logout = useCallback(async () => {
    // Remove customerId from FCM token before logout (make it anonymous/public)
    try {
      await removeCustomerIdFromFCMToken();
    } catch (error) {
      console.warn("Failed to remove customerId from FCM token on logout:", error);
      // Don't block logout if FCM update fails
    }
    
    authStorage.clearAll();
    setUser(null);
    toast.success('Logged out');
  }, []);

  const updateProfile = useCallback(async (data) => {
    try {
      const response = await userAPI.updateProfile(data);
      if (response.data?.success || response.success) {
        // Reload user data after successful update
        await loadMe();
        return response;
      }
      throw new Error(response.message || 'Failed to update profile');
    } catch (error) {
      console.error('Update profile error:', error);
      throw error;
    }
  }, [loadMe]);

  const deleteAccount = useCallback(async () => {
    try {
      const { data } = await http.delete('/auth/customer/request-deletion');
      try {
        await removeCustomerIdFromFCMToken();
      } catch (error) {
        console.warn("Failed to remove customerId from FCM token on delete:", error);
      }
      authStorage.clearAll();
      setUser(null);
      toast.success(data?.message || 'Your account will be deleted soon');
    } catch (error) {
      console.error('Delete account error:', error);
      throw error;
    }
  }, []);

  useEffect(() => {
    // Attempt to load profile if tokens exist
    const hasRefresh = !!authStorage.getRefreshToken();
    if (hasRefresh) {
      loadMe();
    }
  }, [loadMe]);

  const value = { user, loading, login, logout, reload: loadMe, updateProfile, deleteAccount };
  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);

export default UserContext;


