import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// For Android emulator, use 10.0.2.2. For iOS/Web/Physical Device, use your computer's LAN IP or localhost
// For Android emulator, use 10.0.2.2. For iOS/Web/Physical Device, use your computer's LAN IP or localhost
const BASE_URL = process.env.EXPO_PUBLIC_API_URL || (Platform.OS === 'android' ? 'http://10.0.2.2:8015' : 'http://localhost:8015');

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to add token to requests
api.interceptors.request.use(async (config) => {
  try {
    const token = await SecureStore.getItemAsync('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch (error) {
    console.error('Error getting token', error);
  }
  return config;
});

export default api;
