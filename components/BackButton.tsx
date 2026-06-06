import FontAwesome from '@expo/vector-icons/FontAwesome';
import { router, type Href } from 'expo-router';
import { TouchableOpacity } from 'react-native';

import { useInterfaceMode } from '@/contexts/InterfaceContext';

type BackButtonProps = {
  color?: string;
  fallbackHref?: Href;
  className?: string;
};

export function BackButton({ color, fallbackHref, className }: BackButtonProps) {
  const { monochrome } = useInterfaceMode();
  const iconColor = color ?? (monochrome ? '#111111' : '#4A3520');

  return (
    <TouchableOpacity
      accessibilityLabel="Voltar"
      className={`h-10 w-10 items-center justify-center rounded-full ${className ?? ''}`}
      onPress={() => {
        if (router.canGoBack()) {
          router.back();
        } else if (fallbackHref) {
          router.replace(fallbackHref);
        } else {
          router.back();
        }
      }}>
      <FontAwesome name="arrow-left" size={18} color={iconColor} />
    </TouchableOpacity>
  );
}
