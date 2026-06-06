import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';

import { API_URL, SECURE_ACCESS_KEY, SECURE_REFRESH_KEY } from '@/constants/config';
import { emitSessionCleared } from '@/utils/authEvents';
import { deleteSecureItem, getSecureItem, setSecureItem } from '@/utils/secureStorage';

function isFormData(value: unknown): value is FormData {
  return typeof FormData !== 'undefined' && value instanceof FormData;
}

function stripContentType(headers: InternalAxiosRequestConfig['headers']) {
  if (!headers) return;
  const record = headers as Record<string, unknown> & {
    setContentType?: (value: string | false) => void;
    set?: (key: string, value: string | false) => void;
  };
  if (typeof record.setContentType === 'function') {
    record.setContentType(false);
    return;
  }
  if (typeof record.set === 'function') {
    record.set('Content-Type', false);
    return;
  }
  delete record['Content-Type'];
  delete record['content-type'];
}

export const api = axios.create({
  baseURL: API_URL.replace(/\/$/, ''),
  transformResponse: [
    (data) => {
      if (data === '' || data === null || data === undefined) {
        return null;
      }
      if (typeof data === 'string') {
        try {
          return JSON.parse(data);
        } catch {
          return data;
        }
      }
      return data;
    },
  ],
  transformRequest: [
    (data, headers) => {
      if (isFormData(data)) {
        stripContentType(headers);
        return data;
      }
      if (data !== undefined && data !== null && typeof data === 'object') {
        if (typeof headers.setContentType === 'function') {
          headers.setContentType('application/json');
        } else {
          (headers as Record<string, string>)['Content-Type'] = 'application/json';
        }
        return JSON.stringify(data);
      }
      return data;
    },
  ],
});

const raw = axios.create({
  baseURL: API_URL.replace(/\/$/, ''),
  headers: {
    'Content-Type': 'application/json',
  },
});

async function getAccessToken(): Promise<string | null> {
  return getSecureItem(SECURE_ACCESS_KEY);
}

export async function persistTokens(access: string, refresh: string): Promise<void> {
  await setSecureItem(SECURE_ACCESS_KEY, access);
  await setSecureItem(SECURE_REFRESH_KEY, refresh);
}

export async function clearStoredTokens(): Promise<void> {
  await deleteSecureItem(SECURE_ACCESS_KEY);
  await deleteSecureItem(SECURE_REFRESH_KEY);
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
  if (isFormData(config.data)) {
    stripContentType(config.headers);
  }

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
      const refresh = await getSecureItem(SECURE_REFRESH_KEY);
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
