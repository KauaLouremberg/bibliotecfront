import { isAxiosError } from 'axios';

export function shouldRetryServerMutation(failureCount: number, error: unknown) {
  if (failureCount >= 2) return false;
  if (!isAxiosError(error)) return false;
  if (!error.response) return true;
  const status = error.response.status;
  return status >= 500 || status === 429;
}

export function mutationRetryDelay(attempt: number) {
  return Math.min(1000 * 2 ** attempt, 4000);
}
