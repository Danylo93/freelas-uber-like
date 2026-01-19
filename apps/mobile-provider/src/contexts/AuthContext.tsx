import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import api from '@/src/services/api';

interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  user_type: number; // 1 = prestador, 2 = cliente
  created_at: string;
  is_active: boolean;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
}

interface RegisterData {
  name: string;
  email: string;
  phone: string;
  password: string;
  user_type: number;
  category?: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStoredAuth();
  }, []);

  const loadStoredAuth = async () => {
    try {
      const storedToken = await SecureStore.getItemAsync('auth_token');
      const storedUser = await AsyncStorage.getItem('user');

      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error('Error loading stored auth:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      console.log('🔑 [AUTH] Tentando login para:', email);
      setIsLoading(true);
      const response = await api.post('/auth/login', { email, password });

      const { access_token, user_data } = response.data;
      console.log('✅ [AUTH] Login bem-sucedido:', user_data.name);

      setToken(access_token);
      setUser(user_data);

      await SecureStore.setItemAsync('auth_token', access_token);
      await AsyncStorage.setItem('user', JSON.stringify(user_data));

    } catch (error: any) {
      console.error('❌ [AUTH] Erro no login:', error.response?.data || error.message);
      throw new Error(error.response?.data?.detail || 'Erro ao fazer login');
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData: RegisterData) => {
    try {
      console.log('📝 [AUTH] Tentando registrar usuário:', userData.email);
      setIsLoading(true);
      const response = await api.post('/auth/register', userData);

      const { access_token, user_data } = response.data;
      console.log('✅ [AUTH] Registro bem-sucedido:', user_data.name);

      setToken(access_token);
      setUser(user_data);

      await SecureStore.setItemAsync('auth_token', access_token);
      await AsyncStorage.setItem('user', JSON.stringify(user_data));

    } catch (error: any) {
      console.error('❌ [AUTH] Erro no registro:', error.response?.data || error.message);
      throw new Error(error.response?.data?.detail || 'Erro ao fazer registro');
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await SecureStore.deleteItemAsync('auth_token');
      await AsyncStorage.removeItem('user');

      setToken(null);
      setUser(null);

    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  const value: AuthContextType = {
    user,
    token,
    isLoading,
    login,
    register,
    logout,
    isAuthenticated: !!user && !!token,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
