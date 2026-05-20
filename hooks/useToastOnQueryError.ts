import { useEffect } from 'react';

import { extractApiErrorMessage } from '@/utils/apiError';
import { showErrorToast } from '@/utils/feedback';

type QueryErrorState = {
  isError: boolean;
  error: unknown;
};

export function useToastOnQueryError(query: QueryErrorState, title: string, fallback: string) {
  useEffect(() => {
    if (query.isError) {
      showErrorToast(title, extractApiErrorMessage(query.error, fallback));
    }
  }, [fallback, query.error, query.isError, title]);
}
