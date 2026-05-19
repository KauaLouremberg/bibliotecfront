import { isAxiosError } from 'axios';

export function extractApiErrorMessage(error: unknown, fallback: string): string {
  if (isAxiosError(error)) {
    const data = error.response?.data as { detail?: unknown } | undefined;
    if (data && typeof data.detail === 'string') {
      return data.detail;
    }
  }

  return fallback;
}
