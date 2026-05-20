import { type PropsWithChildren, useEffect, useRef } from 'react';
import { Animated, Easing, type ViewStyle } from 'react-native';

type AnimatedRevealProps = PropsWithChildren<{
  delay?: number;
  distance?: number;
  className?: string;
  style?: ViewStyle;
}>;

export function AnimatedReveal({
  children,
  delay = 0,
  distance = 14,
  className,
  style,
}: AnimatedRevealProps) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(distance)).current;

  useEffect(() => {
    Animated.parallel([
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
    ]).start();
  }, [delay, opacity, translateY]);

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
