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
  const url = `${CONFIG.API_URL}${endpoint}`;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  // Add ngrok bypass header if needed
  if (CONFIG.API_URL.includes('ngrok')) {
    headers['ngrok-skip-browser-warning'] = 'true';
  }

  if (requiresAuth) {
    const token = await getAuthToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    } else {
      console.warn(`⚠️ [API] No token found for authenticated request: ${endpoint}`);
    }
  }

  const options: RequestInit = {
    method,
    headers,
  };

  if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
    options.body = JSON.stringify(data);
  }

  try {
    console.log(`📤 [API] ${method} ${endpoint}`);
    const res = await fetch(url, options);
    
    if (!res.ok) {
      let errorMessage = `HTTP ${res.status}: ${res.statusText}`;
      try {
        const errorData = await res.json();
        errorMessage = errorData.message || errorData.detail || errorMessage;
        console.error(`❌ [API] Error response:`, errorData);
      } catch (e) {
        const text = await res.text().catch(() => '');
        console.error(`❌ [API] Error response (text):`, text);
        errorMessage = text || errorMessage;
      }
      throw new Error(errorMessage);
    }

    const responseData = await res.json();
    console.log(`✅ [API] ${method} ${endpoint} - Success`);
    return { data: responseData };
  } catch (error: any) {
    if (error.message && !error.message.includes('HTTP')) {
      // Network error or other fetch error
      console.error(`❌ [API] Network error for ${method} ${endpoint}:`, error.message);
      throw new Error(`Erro de conexão: ${error.message}`);
    }
    throw error;
  }
};

export const api = {
  // Auth methods (for AuthContext compatibility)
  login: async (email: string, password: string) => {
    return apiClient('POST', '/auth/login', { email, password }, false);
  },

  register: async (userData: any) => {
    return apiClient('POST', '/auth/register', userData, false);
  },

  // Generic methods for compatibility
  get: async (endpoint: string, requiresAuth = true) => {
    return apiClient('GET', endpoint, undefined, requiresAuth);
  },

  post: async (endpoint: string, data?: any, requiresAuth = false) => {
    return apiClient('POST', endpoint, data, requiresAuth);
  },

  put: async (endpoint: string, data?: any, requiresAuth = true) => {
    return apiClient('PUT', endpoint, data, requiresAuth);
  },

  delete: async (endpoint: string, requiresAuth = true) => {
    return apiClient('DELETE', endpoint, undefined, requiresAuth);
  },

  // Legacy methods (kept for backward compatibility)
  toggleOnline: async (token: string, providerId: string, isOnline: boolean, lat: number, lng: number) => {
    const res = await fetch(`${CONFIG.API_URL}/providers/${providerId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ isOnline, specialties: [] })
    });
    if (!res.ok) throw new Error('Failed to update status');
    return res.json();
  },

  acceptOffer: async (token: string, requestId: string, providerId: string) => {
     const res = await fetch(`${CONFIG.API_URL}/matching/offers/${requestId}/accept`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ providerId })
    });
    if (!res.ok) throw new Error('Failed to accept offer');
    return res.json();
  },

  sendPing: async (token: string, jobId: string, lat: number, lng: number, providerId: string) => {
      const res = await fetch(`${CONFIG.API_URL}/tracking/jobs/${jobId}/location`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ lat, lng, providerId })
      });
      return res.json();
  }
};

export default api;
