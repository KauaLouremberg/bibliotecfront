import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { router } from 'expo-router';

import { SECURE_ACCESS_KEY } from '@/constants/config';
import { getSecureItem } from '@/utils/secureStorage';
import { api, clearStoredTokens, persistTokens } from '@/services/api';
import { subscribeSessionCleared } from '@/utils/authEvents';
import { showWarningToast } from '@/utils/feedback';

type UserMe = {
  id: number;
  email: string;
  full_name: string;
  avatar_url: string;
  course: string;
  semester: string;
};

type TokenPair = {
  access: string;
  refresh: string;
};

type AuthContextValue = {
  accessToken: string | null;
  isReady: boolean;
  isAuthenticated: boolean;
  user: UserMe | undefined;
  userError: unknown;
  isUserLoading: boolean;
  refetchUser: () => void;
  loginPending: boolean;
  registerPending: boolean;
  avatarPending: boolean;
  profilePending: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (payload: { email: string; password: string; full_name: string }) => Promise<void>;
  updateAvatar: (payload: { file?: { uri: string; name: string; type: string } | null; remove?: boolean }) => Promise<void>;
  updateProfile: (payload: {
    full_name: string;
    course: string;
    semester: string;
    current_password?: string;
    new_password?: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const stored = await getSecureItem(SECURE_ACCESS_KEY);
        if (!cancelled) {
          setAccessToken(stored);
        }
      } finally {
        if (!cancelled) {
          setIsReady(true);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    return subscribeSessionCleared(() => {
      if (accessToken) {
        showWarningToast('Sessão expirada', 'Entre novamente para continuar.');
      }
      setAccessToken(null);
      queryClient.removeQueries({ queryKey: ['auth', 'me'] });
    });
  }, [accessToken, queryClient]);

  const meQuery = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: async () => {
      const { data } = await api.get<UserMe>('/api/auth/me');
      return data;
    },
    enabled: isReady && !!accessToken,
  });

  const loginMutation = useMutation({
    mutationFn: async (vars: { email: string; password: string }) => {
      const { data } = await api.post<TokenPair>('/api/auth/login', vars);
      return data;
    },
    onSuccess: async (data) => {
      await persistTokens(data.access, data.refresh);
      setAccessToken(data.access);
      await queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (vars: { email: string; password: string; full_name: string }) => {
      const { data } = await api.post<TokenPair>('/api/auth/register', vars);
      return data;
    },
    onSuccess: async (data) => {
      await persistTokens(data.access, data.refresh);
      setAccessToken(data.access);
      await queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
    },
  });

  const avatarMutation = useMutation({
    mutationFn: async (vars: { file?: { uri: string; name: string; type: string } | null; remove?: boolean }) => {
      const formData = new FormData();
      if (vars.remove) {
        formData.append('remove_avatar', 'true');
      }
      if (vars.file) {
        formData.append('avatar', {
          uri: vars.file.uri,
          name: vars.file.name,
          type: vars.file.type,
        } as never);
      }
      const { data } = await api.patch<UserMe>('/api/auth/profile/avatar', formData);
      return data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
    },
  });

  const profileMutation = useMutation({
    mutationFn: async (vars: {
      full_name: string;
      course: string;
      semester: string;
      current_password?: string;
      new_password?: string;
    }) => {
      const { data } = await api.patch<UserMe>('/api/auth/profile', vars);
      return data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
    },
  });

  const login = useCallback(
    async (email: string, password: string) => {
      await loginMutation.mutateAsync({ email: email.trim().toLowerCase(), password });
    },
    [loginMutation],
  );

  const register = useCallback(
    async (payload: { email: string; password: string; full_name: string }) => {
      await registerMutation.mutateAsync({
        email: payload.email.trim().toLowerCase(),
        password: payload.password,
        full_name: payload.full_name.trim(),
      });
    },
    [registerMutation],
  );

  const logout = useCallback(async () => {
    await clearStoredTokens();
    setAccessToken(null);
    queryClient.removeQueries({ queryKey: ['auth', 'me'] });
    router.dismissAll();
    router.replace('/(auth)/login');
  }, [queryClient]);

  const updateAvatar = useCallback(
    async (payload: { file?: { uri: string; name: string; type: string } | null; remove?: boolean }) => {
      await avatarMutation.mutateAsync(payload);
    },
    [avatarMutation],
  );

  const updateProfile = useCallback(
    async (payload: {
      full_name: string;
      course: string;
      semester: string;
      current_password?: string;
      new_password?: string;
    }) => {
      await profileMutation.mutateAsync(payload);
    },
    [profileMutation],
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      accessToken,
      isReady,
      isAuthenticated: !!accessToken,
      user: meQuery.data,
      userError: meQuery.error,
      isUserLoading: meQuery.isPending,
      refetchUser: () => {
        void meQuery.refetch();
      },
      loginPending: loginMutation.isPending,
      registerPending: registerMutation.isPending,
      avatarPending: avatarMutation.isPending,
      profilePending: profileMutation.isPending,
      login,
      register,
      updateAvatar,
      updateProfile,
      logout,
    }),
    [
      accessToken,
      isReady,
      meQuery.data,
      meQuery.error,
      meQuery.isPending,
      meQuery.refetch,
      loginMutation.isPending,
      registerMutation.isPending,
      avatarMutation.isPending,
      profileMutation.isPending,
      login,
      register,
      updateAvatar,
      updateProfile,
      logout,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth deve ser usado dentro de AuthProvider');
  }
  return ctx;
}
