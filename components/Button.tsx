import type { PropsWithChildren } from 'react';
import { ActivityIndicator, Pressable, Text } from 'react-native';

type ButtonProps = PropsWithChildren<{
  onPress?: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: 'primary' | 'secondary';
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
  const isDisabled = disabled || loading;
  const base =
    'min-h-12 w-full items-center justify-center rounded-xl px-4 active:opacity-80';
  const variants =
    variant === 'primary'
      ? 'bg-slate-900 dark:bg-slate-100'
      : 'border border-slate-300 bg-transparent dark:border-slate-600';

  return (
    <Pressable
      accessibilityRole="button"
      disabled={isDisabled}
      onPress={onPress}
      className={`${base} ${variants} ${isDisabled ? 'opacity-50' : ''} ${className}`}>
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? '#f8fafc' : '#0f172a'} />
      ) : (
        <Text
          className={`text-center text-base font-semibold ${
            variant === 'primary' ? 'text-slate-50 dark:text-slate-900' : 'text-slate-900 dark:text-slate-100'
          }`}>
          {children}
        </Text>
      )}
    </Pressable>
  );
}
