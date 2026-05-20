import type { PropsWithChildren } from 'react';
import { ActivityIndicator, Pressable, Text } from 'react-native';

import { useInterfaceMode } from '@/contexts/InterfaceContext';

type ButtonProps = PropsWithChildren<{
  onPress?: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: 'primary' | 'secondary' | 'danger';
  className?: string;
}>;

export function Button({
  onPress,
  disabled,
  loading,
  variant = 'primary',
  className = '',
  children,
}: ButtonProps) {
  const { monochrome } = useInterfaceMode();
  const isDisabled = disabled || loading;
  const base =
    'min-h-[52px] w-full items-center justify-center rounded-2xl px-5 active:scale-[0.98] active:opacity-85';

  const variants = monochrome
    ? variant === 'secondary'
      ? 'border border-neutral-400 bg-white'
      : variant === 'danger'
        ? 'bg-neutral-800'
        : 'bg-black'
    : variant === 'primary'
      ? 'bg-stone-900 dark:bg-stone-100'
      : variant === 'danger'
        ? 'bg-rose-600 dark:bg-rose-500'
        : 'border border-stone-200 bg-white dark:border-stone-600 dark:bg-stone-800';

  const spinnerColor = variant === 'secondary' ? (monochrome ? '#171717' : '#0f172a') : '#f8fafc';

  const textColor =
    variant === 'secondary'
      ? monochrome
        ? 'text-black'
        : 'text-stone-800 dark:text-stone-100'
      : monochrome
        ? 'text-white'
        : variant === 'danger'
          ? 'text-white'
          : 'text-stone-50 dark:text-stone-900';

  return (
    <Pressable
      accessibilityRole="button"
      disabled={isDisabled}
      onPress={onPress}
      className={`${base} ${variants} ${isDisabled ? 'opacity-40' : ''} ${className}`}>
      {loading ? (
        <ActivityIndicator color={spinnerColor} />
      ) : (
        <Text className={`text-center text-base font-semibold ${textColor}`}>{children}</Text>
      )}
    </Pressable>
  );
}
