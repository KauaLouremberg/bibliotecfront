import { Image, Text, TouchableOpacity, View } from 'react-native';

import { Pill } from '@/components/Pill';
import { postIntentLabels, postIntentTones, sharingStatusLabels } from '@/constants/library';
import type { SocialPost } from '@/hooks/useLibrary';

type Props = {
  item: SocialPost;
  monochrome: boolean;
  onPress: (postId: number) => void;
};

function formatDateLabel(value: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
  }).format(new Date(value));
}

export function SignalSearchCard({ item, monochrome, onPress }: Props) {
  const coverUrl = item.inventory_book?.cover_url ?? '';

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={() => onPress(item.id)}
      className={`rounded-[22px] border p-4 ${
        monochrome ? 'border-neutral-300 bg-white' : 'border-white/10 bg-white/5'
      }`}>
      <View className="flex-row gap-4">
        {coverUrl ? (
          <Image
            source={{ uri: coverUrl }}
            className="h-28 w-20 rounded-xl bg-white/10"
            resizeMode="cover"
          />
        ) : null}
        <View className="flex-1">
          <View className="flex-row items-center justify-between gap-2">
            <Pill label={postIntentLabels[item.intent]} tone={postIntentTones[item.intent]} />
            <Text className={`text-xs ${monochrome ? 'text-neutral-500' : 'text-stone-500'}`}>
              {formatDateLabel(item.created_at)}
            </Text>
          </View>
          <Text
            className={`mt-2 text-lg font-bold ${monochrome ? 'text-black' : 'text-white'}`}
            numberOfLines={2}>
            {item.book_title}
          </Text>
          <Text className={`mt-1 text-sm ${monochrome ? 'text-neutral-600' : 'text-stone-400'}`}>
            {item.book_author}
          </Text>
          <Text className={`mt-2 text-xs ${monochrome ? 'text-neutral-500' : 'text-stone-500'}`}>
            {item.owner.full_name || item.owner.email}
            {item.location_label ? ` · ${item.location_label}` : ''}
          </Text>
        </View>
      </View>
      {item.inventory_book ? (
        <View className="mt-3 flex-row flex-wrap gap-2">
          <Pill label={sharingStatusLabels[item.inventory_book.sharing_status]} tone="neutral" />
          {item.inventory_book.has_physical_copy ? <Pill label="Físico" tone="success" /> : null}
        </View>
      ) : null}
    </TouchableOpacity>
  );
}
