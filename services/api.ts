import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';
import * as SecureStore from 'expo-secure-store';

import { API_URL, SECURE_ACCESS_KEY, SECURE_REFRESH_KEY } from '@/constants/config';
import { emitSessionCleared } from '@/utils/authEvents';

export const api = axios.create({
  baseURL: API_URL.replace(/\/$/, ''),
  headers: {
    'Content-Type': 'application/json',
  },
});

const raw = axios.create({
  baseURL: API_URL.replace(/\/$/, ''),
  headers: {
    'Content-Type': 'application/json',
  },
});

async function getAccessToken(): Promise<string | null> {
  return SecureStore.getItemAsync(SECURE_ACCESS_KEY);
}

export async function persistTokens(access: string, refresh: string): Promise<void> {
  await SecureStore.setItemAsync(SECURE_ACCESS_KEY, access);
  await SecureStore.setItemAsync(SECURE_REFRESH_KEY, refresh);
}

export async function clearStoredTokens(): Promise<void> {
  await SecureStore.deleteItemAsync(SECURE_ACCESS_KEY);
  await SecureStore.deleteItemAsync(SECURE_REFRESH_KEY);
}

function isPublicAuthPath(url: string | undefined): boolean {
  if (!url) return false;
  return (
    url.includes('/api/auth/login') ||
    url.includes('/api/auth/register') ||
    url.includes('/api/auth/refresh')
  );
}

api.interceptors.request.use(async (config) => {
  if (isPublicAuthPath(config.url)) {
    if (config.headers) {
      delete (config.headers as Record<string, unknown>).Authorization;
    }
    return config;
  }
  const token = await getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

type RetryConfig = InternalAxiosRequestConfig & { _retry?: boolean };

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as RetryConfig | undefined;
    const status = error.response?.status;

    if (
      status === 401 &&
      original &&
      !original._retry &&
      !original.url?.includes('/api/auth/refresh') &&
      !original.url?.includes('/api/auth/login') &&
      !original.url?.includes('/api/auth/register')
    ) {
      original._retry = true;
      const refresh = await SecureStore.getItemAsync(SECURE_REFRESH_KEY);
      if (!refresh) {
        await clearStoredTokens();
        emitSessionCleared();
        return Promise.reject(error);
      }
      try {
        const { data } = await raw.post<{ access: string; refresh: string }>('/api/auth/refresh', {
          refresh,
        });
        await persistTokens(data.access, data.refresh);
        original.headers.Authorization = `Bearer ${data.access}`;
        return api(original);
      } catch {
        await clearStoredTokens();
        emitSessionCleared();
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  },
);
