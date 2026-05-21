import { Text, View } from 'react-native';

import { useInterfaceMode } from '@/contexts/InterfaceContext';

type PillProps = {
  label: string;
  tone?: 'neutral' | 'accent' | 'success' | 'warning' | 'danger';
};

const toneMap: Record<NonNullable<PillProps['tone']>, { bg: string; text: string; darkBg: string; darkText: string }> = {
  neutral: { bg: 'bg-[#F5ECD7]', text: 'text-[#4A3520]', darkBg: '', darkText: '' },
  accent: { bg: 'bg-[#C9A96E]/35', text: 'text-[#4A3520]', darkBg: '', darkText: '' },
  success: { bg: 'bg-emerald-100', text: 'text-emerald-800', darkBg: 'dark:bg-emerald-900/40', darkText: 'dark:text-emerald-200' },
  warning: { bg: 'bg-amber-100', text: 'text-amber-800', darkBg: 'dark:bg-amber-900/40', darkText: 'dark:text-amber-200' },
  danger: { bg: 'bg-rose-100', text: 'text-rose-800', darkBg: 'dark:bg-rose-900/40', darkText: 'dark:text-rose-200' },
};

export function Pill({ label, tone = 'neutral' }: PillProps) {
  const { monochrome } = useInterfaceMode();

  if (monochrome) {
    return (
      <View className="rounded-full border border-neutral-400 bg-neutral-200 px-3 py-1">
        <Text className="text-xs font-semibold uppercase tracking-[0.8px] text-neutral-900">{label}</Text>
      </View>
    );
  }

  const t = toneMap[tone];

  return (
    <View className={`rounded-full px-3 py-1.5 ${t.bg} ${t.darkBg}`}>
      <Text className={`text-xs font-bold uppercase tracking-[0.8px] ${t.text} ${t.darkText}`}>
        {label}
      </Text>
    </View>
  );
}
