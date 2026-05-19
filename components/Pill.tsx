import { Text, View } from 'react-native';

type PillProps = {
  label: string;
  tone?: 'neutral' | 'accent' | 'success' | 'warning' | 'danger';
};

const toneClasses: Record<NonNullable<PillProps['tone']>, string> = {
  neutral: 'bg-stone-200 text-stone-700',
  accent: 'bg-orange-100 text-orange-700',
  success: 'bg-emerald-100 text-emerald-700',
  warning: 'bg-amber-100 text-amber-700',
  danger: 'bg-rose-100 text-rose-700',
};

export function Pill({ label, tone = 'neutral' }: PillProps) {
  const classes = toneClasses[tone];
  const [backgroundClassName, textClassName] = classes.split(' ');

  return (
    <View className={`rounded-full px-3 py-1 ${backgroundClassName}`}>
      <Text className={`text-xs font-semibold uppercase tracking-[0.8px] ${textClassName}`}>
        {label}
      </Text>
    </View>
  );
}
