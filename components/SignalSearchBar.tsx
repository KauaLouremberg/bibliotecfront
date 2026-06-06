import FontAwesome from '@expo/vector-icons/FontAwesome';
import { ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';

import { postIntentLabels, postIntentOptions } from '@/constants/library';
import type { PostIntent } from '@/hooks/useLibrary';

export type SignalSearchValues = {
  search: string;
  intent: PostIntent | null;
};

const emptySearch: SignalSearchValues = { search: '', intent: null };

export function createEmptySignalSearch(): SignalSearchValues {
  return { ...emptySearch };
}

export function hasActiveSignalSearch(v: SignalSearchValues) {
  return Boolean(v.search.trim() || v.intent);
}

type Props = {
  values: SignalSearchValues;
  onChange: (v: SignalSearchValues) => void;
  onClose: () => void;
  resultCount?: number;
  variant: 'dark' | 'light';
  monochrome?: boolean;
};

const intentChips: Array<{ value: PostIntent | null; label: string }> = [
  { value: null, label: 'Todos' },
  ...postIntentOptions.map((o) => ({ value: o.value, label: o.label })),
];

export function SignalSearchBar({
  values,
  onChange,
  onClose,
  resultCount,
  variant,
  monochrome = false,
}: Props) {
  const isDark = variant === 'dark';

  const bgClass = monochrome
    ? 'bg-white'
    : isDark
      ? 'bg-[#3A2A18]'
      : 'bg-[#E8D5B0]';
  const inputBg = monochrome
    ? 'bg-neutral-100 text-black'
    : isDark
      ? 'bg-white/10 text-white'
      : 'bg-white text-[#4A3520]';
  const placeholder = monochrome ? '#999' : isDark ? '#a8a29e' : '#8B6534';
  const iconColor = monochrome ? '#111' : isDark ? '#F5ECD7' : '#4A3520';
  const hintColor = monochrome ? 'text-neutral-500' : isDark ? 'text-stone-500' : 'text-[#8B6534]/80';

  return (
    <View className={`px-4 pb-3 pt-3 ${bgClass}`}>
      <View className="flex-row items-center gap-3">
        <View className={`flex-1 flex-row items-center rounded-2xl px-4 py-3 ${inputBg}`}>
          <FontAwesome name="search" size={14} color={placeholder} style={{ marginRight: 10 }} />
          <TextInput
            value={values.search}
            onChangeText={(search) => onChange({ ...values, search })}
            placeholder="Buscar livro, autor, local..."
            placeholderTextColor={placeholder}
            className="flex-1 text-base"
            autoFocus
            returnKeyType="search"
          />
          {values.search.length > 0 ? (
            <TouchableOpacity onPress={() => onChange({ ...values, search: '' })} className="ml-2">
              <FontAwesome name="times-circle" size={16} color={placeholder} />
            </TouchableOpacity>
          ) : null}
        </View>
        <TouchableOpacity
          accessibilityLabel="Fechar busca"
          onPress={onClose}
          className="h-10 w-10 items-center justify-center rounded-full">
          <FontAwesome name="times" size={20} color={iconColor} />
        </TouchableOpacity>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="mt-3"
        contentContainerClassName="gap-2 pr-2">
        {intentChips.map((chip) => {
          const selected = values.intent === chip.value;
          return (
            <TouchableOpacity
              key={chip.label}
              className={`rounded-full px-4 py-2 ${
                selected
                  ? monochrome
                    ? 'bg-neutral-900'
                    : isDark
                      ? 'bg-[#C9A96E]/30'
                      : 'bg-[#8B6534]'
                  : monochrome
                    ? 'bg-neutral-200'
                    : isDark
                      ? 'bg-white/8'
                      : 'bg-white/80'
              }`}
              onPress={() => onChange({ ...values, intent: selected ? null : chip.value })}>
              <Text
                className={`text-xs font-bold uppercase tracking-[0.8px] ${
                  selected
                    ? monochrome
                      ? 'text-white'
                      : isDark
                        ? 'text-[#F5ECD7]'
                        : 'text-white'
                    : monochrome
                      ? 'text-neutral-700'
                      : isDark
                        ? 'text-stone-400'
                        : 'text-[#4A3520]'
                }`}>
                {chip.value ? postIntentLabels[chip.value] : chip.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {typeof resultCount === 'number' ? (
        <View className="mt-2 flex-row items-center justify-between">
          <Text className={`text-xs ${hintColor}`}>
            {resultCount} {resultCount === 1 ? 'resultado' : 'resultados'}
          </Text>
          {hasActiveSignalSearch(values) ? (
            <TouchableOpacity onPress={() => onChange(createEmptySignalSearch())}>
              <Text className={`text-xs font-semibold ${hintColor}`}>Limpar</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}
