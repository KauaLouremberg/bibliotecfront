const trimTrailingSlash = (url: string) => url.replace(/\/+$/, '');

export const API_URL = trimTrailingSlash(process.env.EXPO_PUBLIC_API_URL ?? 'http://127.0.0.1:8000');

export const SECURE_ACCESS_KEY = 'bibliotec_access_token';
export const SECURE_REFRESH_KEY = 'bibliotec_refresh_token';
