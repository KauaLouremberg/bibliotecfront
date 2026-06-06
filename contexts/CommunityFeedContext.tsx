import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';

type CommunityFeedContextValue = {
  searchMode: boolean;
  setSearchMode: (value: boolean) => void;
  openSearch: () => void;
  registerOpenSearch: (fn: (() => void) | null) => void;
};

const CommunityFeedContext = createContext<CommunityFeedContextValue | null>(null);

export function CommunityFeedProvider({ children }: { children: ReactNode }) {
  const [searchMode, setSearchMode] = useState(false);
  const openSearchRef = useRef<(() => void) | null>(null);

  const registerOpenSearch = useCallback((fn: (() => void) | null) => {
    openSearchRef.current = fn;
  }, []);

  const openSearch = useCallback(() => {
    openSearchRef.current?.();
  }, []);

  const value = useMemo(
    () => ({
      searchMode,
      setSearchMode,
      openSearch,
      registerOpenSearch,
    }),
    [searchMode, openSearch, registerOpenSearch],
  );

  return <CommunityFeedContext.Provider value={value}>{children}</CommunityFeedContext.Provider>;
}

export function useCommunityFeedContext() {
  const ctx = useContext(CommunityFeedContext);
  if (!ctx) {
    throw new Error('useCommunityFeedContext must be used within CommunityFeedProvider');
  }
  return ctx;
}

export function useCommunityFeedContextOptional() {
  return useContext(CommunityFeedContext);
}
