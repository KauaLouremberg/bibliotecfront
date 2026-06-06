import { useFocusEffect } from 'expo-router';
import { useCallback, useRef } from 'react';

export function useRefreshOnFocus(refetch: () => Promise<unknown>, enabled = true) {
  const refetchRef = useRef(refetch);
  refetchRef.current = refetch;

  useFocusEffect(
    useCallback(() => {
      if (!enabled) return;
      void refetchRef.current();
    }, [enabled]),
  );
}
