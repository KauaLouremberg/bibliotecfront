import { useEffect } from 'react';
import { BackHandler, Platform } from 'react-native';

import { useAuth } from '@/hooks/useAuth';

export function useAuthenticatedBackGuard() {
  const { isAuthenticated, logout } = useAuth();

  useEffect(() => {
    if (!isAuthenticated || Platform.OS === 'web') {
      return undefined;
    }

    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      void logout();
      return true;
    });

    return () => subscription.remove();
  }, [isAuthenticated, logout]);
}
