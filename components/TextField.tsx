import { type ComponentProps, forwardRef } from 'react';
import { Text, TextInput, View } from 'react-native';

import { useInterfaceMode } from '@/contexts/InterfaceContext';

export type TextFieldProps = {
  label: string;
  error?: string;
} & ComponentProps<typeof TextInput>;

export const TextField = forwardRef<TextInput, TextFieldProps>(function TextField(
  { label, error, className, ...inputProps },
  ref,
) {
  const { monochrome } = useInterfaceMode();

  return (
    <View className="mb-5 w-full">
      <Text className={`mb-2 text-sm font-semibold ${monochrome ? 'text-neutral-900' : 'text-[#4A3520]'}`}>
        {label}
      </Text>
      <TextInput
        ref={ref}
        placeholderTextColor={monochrome ? '#737373' : '#8B6534'}
        className={`w-full rounded-2xl border px-4 py-3.5 text-base ${
          error
            ? 'border-red-500 bg-red-50 text-red-900 dark:bg-red-950/30 dark:text-red-200'
            : monochrome
              ? 'border-neutral-400 bg-white text-neutral-950'
              : 'border-[#C9A96E]/70 bg-[#F5ECD7] text-[#4A3520]'
        } ${className ?? ''}`}
        {...inputProps}
      />
      {error ? <Text className="mt-1.5 text-sm text-red-600 dark:text-red-400">{error}</Text> : null}
    </View>
  );
});
