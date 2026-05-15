import { type ComponentProps, forwardRef } from 'react';
import { Text, TextInput, View } from 'react-native';

export type TextFieldProps = {
  label: string;
  error?: string;
} & ComponentProps<typeof TextInput>;

export const TextField = forwardRef<TextInput, TextFieldProps>(function TextField(
  { label, error, className, ...inputProps },
  ref,
) {
  return (
    <View className="mb-4 w-full">
      <Text className="mb-1.5 text-sm font-medium text-slate-700 dark:text-slate-200">{label}</Text>
      <TextInput
        ref={ref}
        placeholderTextColor="#94a3b8"
        className={`w-full rounded-xl border px-3 py-3 text-base text-slate-900 dark:text-slate-100 ${
          error
            ? 'border-red-500 bg-red-50 dark:bg-red-950/30'
            : 'border-slate-200 bg-white dark:border-slate-600 dark:bg-slate-900'
        } ${className ?? ''}`}
        {...inputProps}
      />
      {error ? <Text className="mt-1 text-sm text-red-600 dark:text-red-400">{error}</Text> : null}
    </View>
  );
});
