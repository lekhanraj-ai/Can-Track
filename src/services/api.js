import axios from 'axios';

// Fallback API URL (change to your machine IP when testing on a physical device).
// Prefer setting EXPO_PUBLIC_API_URL in your environment when running on device.
const DEFAULT_API = 'http://10.247.172.187:5000/api';
const API_URL = process.env.EXPO_PUBLIC_API_URL || DEFAULT_API;

// Create axios instance with default config
export const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// Centralized error translator — always throw an Error with friendly message
const handleApiError = (error) => {
  if (error?.response) {
    const data = error.response.data;
    // prefer server-provided message, fallback to statusText
    const message = data?.error || data?.message || error.response.statusText || 'Server error';
    console.error('API Error Response:', error.response.status, data);
    throw new Error(message);
  } else if (error?.request) {
    console.error('API No Response:', error.request);
    throw new Error('Cannot connect to server. Check your network and try again.');
  }
  console.error('API Request Error:', error.message);
  throw new Error(error.message || 'Unexpected error');
};

export const locationAPI = {
  updateBusLocation: async (locationData) => {
    try {
      const response = await apiClient.post('/location/update', locationData);
      return response.data;
    } catch (err) {
      throw handleApiError(err);
    }
  },

  getBusLocation: async (busNumber) => {
    try {
      const response = await apiClient.get(`/location/${busNumber}`);
      return response.data;
    } catch (err) {
      throw handleApiError(err);
    }
  },

  updateBusStatus: async (statusData) => {
    try {
      const response = await apiClient.post('/location/status', statusData);
      return response.data;
    } catch (err) {
      throw handleApiError(err);
    }
  }
};

export const authAPI = {
  signup: async (userData) => {
    try {
      console.log('Sending signup data:', { ...userData, password: '[REDACTED]' });
      const response = await apiClient.post('/auth/signup', userData);
      console.log('Signup response:', response.data);
      return response.data;
    } catch (err) {
      throw handleApiError(err);
    }
  },

  login: async (credentials) => {
    try {
      console.log('Sending login credentials:', { ...credentials, password: '[REDACTED]' });
      const response = await apiClient.post('/auth/login', credentials);
      console.log('Login response:', response.data);
      return response.data;
    } catch (err) {
      throw handleApiError(err);
    }
  },
};