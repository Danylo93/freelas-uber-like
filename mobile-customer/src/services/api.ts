import { CONFIG } from '../config';

// Helper function to get auth token
const getAuthToken = async (): Promise<string | null> => {
  try {
    const { getItemAsync } = await import('expo-secure-store');
    return await getItemAsync('auth_token');
  } catch {
    return null;
  }
};

// Generic API client
const apiClient = async (method: string, endpoint: string, data?: any, requiresAuth = false) => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (requiresAuth) {
    const token = await getAuthToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  const options: RequestInit = {
    method,
    headers,
  };

  if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
    options.body = JSON.stringify(data);
  }

  const res = await fetch(`${CONFIG.API_URL}${endpoint}`, options);
  
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(errorData.message || `HTTP ${res.status}: ${res.statusText}`);
  }

  return res.json();
};

export const api = {
  // Auth
  login: async (email: string, password: string) => {
    return apiClient('POST', '/auth/login', { email, password });
  },

  register: async (userData: any) => {
    return apiClient('POST', '/auth/register', userData);
  },

  // Categories
  getCategories: async () => {
    return apiClient('GET', '/categories');
  },

  // Providers
  getProviders: async () => {
    return apiClient('GET', '/providers', undefined, true);
  },

  getProvider: async (providerId: string) => {
    return apiClient('GET', `/providers/${providerId}`, undefined, true);
  },

  // Requests
  createRequest: async (data: any) => {
    return apiClient('POST', '/requests', data, true);
  },

  getRequests: async () => {
    return apiClient('GET', '/requests', undefined, true);
  },

  getClientRequests: async (clientId: string, status?: string) => {
    const query = status ? `?status=${status}` : '';
    return apiClient('GET', `/requests/client/${clientId}${query}`, undefined, true);
  },

  acceptRequest: async (requestId: string) => {
    return apiClient('PUT', `/requests/${requestId}/accept`, {}, true);
  },

  updateRequestStatus: async (requestId: string, status: string) => {
    return apiClient('PUT', `/requests/${requestId}/update-status`, { status }, true);
  },

  getRequestReceipt: async (requestId: string) => {
    return apiClient('GET', `/requests/${requestId}/receipt`, undefined, true);
  },

  // Reviews
  createReview: async (requestId: string, rating: number, comment?: string) => {
    return apiClient('POST', `/reviews`, { jobId: requestId, rating, comment }, true);
  },

  // Payments
  processPayment: async (requestId: string, paymentData: any) => {
    return apiClient('POST', `/requests/${requestId}/payment`, paymentData, true);
  },

  // Provider Wallet
  getProviderWallet: async (providerId: string) => {
    return apiClient('GET', `/providers/${providerId}/wallet`, undefined, true);
  },

  // Provider Location
  updateProviderLocation: async (lat: number, lng: number) => {
    return apiClient('PUT', '/provider/location', { lat, lng }, true);
  },

  // Generic methods for compatibility
  get: async (endpoint: string, requiresAuth = true) => {
    return apiClient('GET', endpoint, undefined, requiresAuth);
  },

  post: async (endpoint: string, data?: any, requiresAuth = true) => {
    return apiClient('POST', endpoint, data, requiresAuth);
  },

  put: async (endpoint: string, data?: any, requiresAuth = true) => {
    return apiClient('PUT', endpoint, data, requiresAuth);
  },

  delete: async (endpoint: string, requiresAuth = true) => {
    return apiClient('DELETE', endpoint, undefined, requiresAuth);
  },
};
