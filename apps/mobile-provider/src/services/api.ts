import { CONFIG } from '../config';

export const api = {
  login: async (email: string, password: string) => {
    const res = await fetch(`${CONFIG.API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    if (!res.ok) throw new Error('Login failed');
    return res.json();
  },

  toggleOnline: async (token: string, providerId: string, isOnline: boolean, lat: number, lng: number) => {
    // Ideally we call matching-service directly or users-service.
    // Plan said Matching has POST /providers/:id/online.
    // Or Users Service. Users service updates profile.
    // Let's call users service (via gateway).
    const res = await fetch(`${CONFIG.API_URL}/providers/${providerId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ isOnline, specialties: [] }) // Add current location logic if needed
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
      // We can use socket or REST. Using REST as fallback implementation here.
      const res = await fetch(`${CONFIG.API_URL}/tracking/jobs/${jobId}/location`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ lat, lng, providerId })
      });
      return res.json();
  }
};
