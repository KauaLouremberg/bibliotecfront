import { View } from 'react-native';

import { useInterfaceMode } from '@/contexts/InterfaceContext';

type SkeletonBlockProps = {
  className?: string;
};

export function SkeletonBlock({ className = '' }: SkeletonBlockProps) {
  const { monochrome } = useInterfaceMode();
  return (
    <View
      className={`overflow-hidden rounded-2xl ${
        monochrome ? 'bg-neutral-200' : 'bg-[#D9C296]'
      } ${className}`}
    />
  );
}

export function BookCardSkeleton({ horizontal = false }: { horizontal?: boolean }) {
  return (
    <View className={`${horizontal ? 'w-[310px]' : 'w-full'} h-[430px] rounded-[24px] border border-[#C9A96E]/40 bg-[#E8D5B0] p-5`}>
      <View className="flex-row gap-4">
        <SkeletonBlock className="h-36 w-24" />
        <View className="flex-1">
          <SkeletonBlock className="h-6 w-20 rounded-full" />
          <SkeletonBlock className="mt-4 h-6 w-full" />
          <SkeletonBlock className="mt-2 h-4 w-3/4" />
          <SkeletonBlock className="mt-2 h-4 w-1/2" />
        </View>
      </View>
      <SkeletonBlock className="mt-5 h-4 w-full" />
      <SkeletonBlock className="mt-2 h-4 w-full" />
      <SkeletonBlock className="mt-2 h-4 w-2/3" />
      <SkeletonBlock className="mt-auto h-12 w-full" />
    </View>
  );
}
