const baseUrl = process.env.EXPO_PUBLIC_API_BASE_URL ?? '';

export const CONFIG = {
  API_URL: baseUrl,
  SOCKET_URL: baseUrl
};
