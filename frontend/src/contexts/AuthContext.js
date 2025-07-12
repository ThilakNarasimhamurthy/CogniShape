import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../utils/api';
import toast from 'react-hot-toast';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('token'));

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('token');
      if (storedToken) {
        try {
          // Set the token in API headers
          api.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
          
          // Fetch user profile to validate token
          const response = await api.get('/user/profile');
          setUser(response.data.user);
          setToken(storedToken);
        } catch (error) {
          console.error('Token validation failed:', error);
          localStorage.removeItem('token');
          delete api.defaults.headers.common['Authorization'];
          setToken(null);
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email, password) => {
    try {
      setLoading(true);
      const response = await api.post('/auth/login', { email, password });
      
      const { access_token, user: userData } = response.data;
      
      // Store token
      localStorage.setItem('token', access_token);
      api.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
      
      setToken(access_token);
      setUser(userData);
      
      toast.success('Login successful!');
      return true;
    } catch (error) {
      const message = error.response?.data?.detail || 'Login failed';
      toast.error(message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const register = async (email, password, role) => {
    try {
      setLoading(true);
      const response = await api.post('/auth/register', { email, password, role });
      
      const { access_token, user: userData } = response.data;
      
      // Store token
      localStorage.setItem('token', access_token);
      api.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
      
      setToken(access_token);
      setUser(userData);
      
      toast.success('Registration successful!');
      return true;
    } catch (error) {
      const message = error.response?.data?.detail || 'Registration failed';
      toast.error(message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    delete api.defaults.headers.common['Authorization'];
    setToken(null);
    setUser(null);
    toast.success('Logged out successfully');
  };

  const updateUserProfile = async (profileData) => {
    try {
      const response = await api.put('/user/profile', profileData);
      setUser(response.data.user);
      toast.success('Profile updated successfully');
      return true;
    } catch (error) {
      const message = error.response?.data?.detail || 'Profile update failed';
      toast.error(message);
      return false;
    }
  };

  const refreshUserData = async () => {
    try {
      const response = await api.get('/user/profile');
      setUser(response.data.user);
      return response.data;
    } catch (error) {
      console.error('Failed to refresh user data:', error);
      return null;
    }
  };

  const value = {
    user,
    token,
    loading,
    login,
    register,
    logout,
    updateUserProfile,
    refreshUserData,
    isAuthenticated: !!user,
    userRole: user?.role
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};