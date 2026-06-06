import { useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';

import { shuffleArray } from '@/utils/shuffleArray';

export function useShuffleOnFocus<T>(items: T[]) {
  const [shuffleToken, setShuffleToken] = useState(0);

  useFocusEffect(
    useCallback(() => {
      setShuffleToken((current) => current + 1);
    }, []),
  );

  return useMemo(() => {
    if (!items.length) return items;
    return shuffleArray(items);
  }, [items, shuffleToken]);
}
