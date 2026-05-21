import Constants from 'expo-constants';
import { Platform } from 'react-native';

const trimTrailingSlash = (url: string) => url.replace(/\/+$/, '');

/** IP do Metro/Expo na rede local (ex.: 192.168.1.10:8081 → 192.168.1.10). */
function getDevLanHost(): string | null {
  const hostUri = Constants.expoConfig?.hostUri;
  if (!hostUri) return null;
  const host = hostUri.split(':')[0]?.trim();
  if (!host || host === 'localhost' || host === '127.0.0.1') return null;
  return host;
}

function resolveApiUrl(): string {
  const fromEnv = process.env.EXPO_PUBLIC_API_URL ?? 'http://127.0.0.1:8000';
  let url = trimTrailingSlash(fromEnv);

  if (Platform.OS === 'web') {
    return url;
  }

  const pointsToLocalhost = /\/\/(localhost|127\.0\.0\.1)(:\d+)?/.test(url);
  if (!pointsToLocalhost) {
    return url;
  }

  const lanHost = getDevLanHost();
  if (lanHost) {
    try {
      const parsed = new URL(url);
      parsed.hostname = lanHost;
      return trimTrailingSlash(parsed.toString());
    } catch {
      return `http://${lanHost}:8000`;
    }
  }

  return url;
}

export const API_URL = resolveApiUrl();

export const SECURE_ACCESS_KEY = 'bibliotec_access_token';
export const SECURE_REFRESH_KEY = 'bibliotec_refresh_token';
