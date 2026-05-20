import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { getSecureItem, setSecureItem } from '@/utils/secureStorage';

const MONOCHROME_KEY = 'bibliotec_monochrome_mode';

type InterfaceContextValue = {
  monochrome: boolean;
  setMonochromeMode: (enabled: boolean) => void;
  toggleMonochrome: () => void;
};

const InterfaceContext = createContext<InterfaceContextValue | null>(null);

export function InterfaceProvider({ children }: { children: React.ReactNode }) {
  const [monochrome, setMonochrome] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const stored = await getSecureItem(MONOCHROME_KEY);
      if (!cancelled) {
        setMonochrome(stored === '1');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const setMonochromeMode = useCallback((enabled: boolean) => {
    setMonochrome(enabled);
    void setSecureItem(MONOCHROME_KEY, enabled ? '1' : '0');
  }, []);

  const toggleMonochrome = useCallback(() => {
    setMonochrome((current) => {
      const next = !current;
      void setSecureItem(MONOCHROME_KEY, next ? '1' : '0');
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({ monochrome, setMonochromeMode, toggleMonochrome }),
    [monochrome, setMonochromeMode, toggleMonochrome],
  );

  return <InterfaceContext.Provider value={value}>{children}</InterfaceContext.Provider>;
}

export function useInterfaceMode() {
  const ctx = useContext(InterfaceContext);
  if (!ctx) {
    throw new Error('useInterfaceMode deve ser usado dentro de InterfaceProvider');
  }
  return ctx;
}
