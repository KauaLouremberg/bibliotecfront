import { router } from 'expo-router';
import { useEffect } from 'react';
import { BackHandler, Platform } from 'react-native';

/**
 * No Android, o botão voltar deve fechar modais/telas empilhadas antes de sair do app.
 * O logout fica apenas no menu do perfil.
 */
export function useAuthenticatedBackGuard() {
  useEffect(() => {
    if (Platform.OS === 'web') {
      return undefined;
    }

    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      if (router.canGoBack()) {
        router.back();
        return true;
      }
      return false;
    });

    return () => subscription.remove();
  }, []);
}
