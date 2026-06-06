import { type PropsWithChildren, useEffect, useRef } from 'react';
import { Animated, Easing, type ViewStyle } from 'react-native';

type AnimatedRevealProps = PropsWithChildren<{
  delay?: number;
  distance?: number;
  className?: string;
  style?: ViewStyle;
  /** Desativa animação (útil em listas que remontam com frequência). */
  static?: boolean;
}>;

function revealVisible(opacity: Animated.Value, translateY: Animated.Value) {
  opacity.setValue(1);
  translateY.setValue(0);
}

export function AnimatedReveal({
  children,
  delay = 0,
  distance = 14,
  className,
  style,
  static: isStatic = false,
}: AnimatedRevealProps) {
  const opacity = useRef(new Animated.Value(isStatic ? 1 : 0)).current;
  const translateY = useRef(new Animated.Value(isStatic ? 0 : distance)).current;

  useEffect(() => {
    if (isStatic) {
      revealVisible(opacity, translateY);
      return;
    }

    opacity.setValue(0);
    translateY.setValue(distance);

    const animation = Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 420,
        delay,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 420,
        delay,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]);

    animation.start(({ finished }) => {
      if (finished) {
        revealVisible(opacity, translateY);
      }
    });

    return () => {
      animation.stop();
      // Evita conteúdo invisível quando o efeito é interrompido (Strict Mode, refetch, etc.).
      revealVisible(opacity, translateY);
    };
  }, [delay, distance, isStatic, opacity, translateY]);

  return (
    <Animated.View
      className={className}
      style={[
        style,
        {
          opacity,
          transform: [{ translateY }],
        },
      ]}>
      {children}
    </Animated.View>
  );
}
