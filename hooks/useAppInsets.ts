import { useSafeAreaInsets } from 'react-native-safe-area-context';

const EXTRA_TOP = 10;

export function useAppInsets() {
  const insets = useSafeAreaInsets();

  return {
    insets,
    /** Espaço abaixo da status bar (bateria, hora, etc.) */
    topInset: insets.top + EXTRA_TOP,
    /** Altura da status bar para headers nativos */
    headerStatusBarHeight: insets.top,
  };
}
