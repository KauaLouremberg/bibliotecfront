import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Pressable, Text, View } from 'react-native';

import { useInterfaceMode } from '@/contexts/InterfaceContext';

type StarRatingProps = {
  value?: number | null;
  average?: number;
  count?: number;
  disabled?: boolean;
  onChange?: (rating: number) => void;
};

export function StarRating({
  value,
  average = 0,
  count = 0,
  disabled,
  onChange,
}: StarRatingProps) {
  const { monochrome } = useInterfaceMode();
  const activeColor = monochrome ? '#111111' : '#C9A96E';
  const inactiveColor = monochrome ? '#a3a3a3' : '#D8C49F';
  const textColor = monochrome ? 'text-neutral-600' : 'text-[#4A3520]/80';
  const displayValue = value ?? Math.round(average);

  return (
    <View className="flex-row flex-wrap items-center gap-2">
      <View className="flex-row items-center">
        {[1, 2, 3, 4, 5].map((rating) => {
          const selected = rating <= displayValue;
          return (
            <Pressable
              key={rating}
              accessibilityRole="button"
              accessibilityLabel={`Avaliar com ${rating} estrela${rating > 1 ? 's' : ''}`}
              disabled={disabled || !onChange}
              hitSlop={8}
              onPress={() => onChange?.(rating)}
              className="pr-1">
              <FontAwesome
                name={selected ? 'star' : 'star-o'}
                size={20}
                color={selected ? activeColor : inactiveColor}
              />
            </Pressable>
          );
        })}
      </View>
      <Text className={`text-xs font-semibold ${textColor}`}>
        {count ? `${average.toFixed(1)} (${count})` : 'Sem avaliações'}
      </Text>
    </View>
  );
}
