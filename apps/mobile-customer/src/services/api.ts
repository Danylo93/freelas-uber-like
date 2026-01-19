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

  createRequest: async (token: string, data: any) => {
    const res = await fetch(`${CONFIG.API_URL}/requests`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to create request');
    return res.json();
  }
};
