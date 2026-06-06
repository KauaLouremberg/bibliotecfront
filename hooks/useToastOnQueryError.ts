import { useEffect, useRef } from 'react';

import { extractApiErrorMessage } from '@/utils/apiError';
import { showErrorToast } from '@/utils/feedback';

type QueryErrorState = {
  isError: boolean;
  error: unknown;
  isFetching?: boolean;
  data?: unknown;
};

type ToastOnQueryErrorOptions = {
  /** Não exibe toast se já existe dado em cache (evita falso erro após refetch). */
  onlyWhenEmpty?: boolean;
  /** Permite toast mesmo quando já existe dado em cache. */
  showWhenStaleData?: boolean;
  /** Evita repetir o mesmo toast em sequência curta (ms). */
  dedupeWindowMs?: number;
};

export function useToastOnQueryError(
  query: QueryErrorState,
  title: string,
  fallback: string,
  options?: ToastOnQueryErrorOptions,
) {
  const lastErrorRef = useRef<unknown>(null);
  const lastMessageRef = useRef<string | null>(null);
  const lastShownAtRef = useRef<number>(0);

  useEffect(() => {
    const onlyWhenEmpty = options?.onlyWhenEmpty ?? true;
    const showWhenStaleData = options?.showWhenStaleData ?? false;
    const dedupeWindowMs = options?.dedupeWindowMs ?? 8000;
    const hasData = query.data != null;

    if (!showWhenStaleData && hasData && onlyWhenEmpty) {
      lastErrorRef.current = null;
      return;
    }

    if (query.isError && query.error !== lastErrorRef.current) {
      const message = extractApiErrorMessage(query.error, fallback);
      const now = Date.now();
      const sameMessage = message === lastMessageRef.current;
      const insideWindow = now - lastShownAtRef.current < dedupeWindowMs;
      if (sameMessage && insideWindow) {
        lastErrorRef.current = query.error;
        return;
      }
      lastErrorRef.current = query.error;
      lastMessageRef.current = message;
      lastShownAtRef.current = now;
      showErrorToast(title, message);
      return;
    }

    if (!query.isError) {
      lastErrorRef.current = null;
    }
  }, [
    fallback,
    options?.dedupeWindowMs,
    options?.onlyWhenEmpty,
    options?.showWhenStaleData,
    query.data,
    query.error,
    query.isError,
    title,
  ]);
}
