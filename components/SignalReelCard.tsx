import { Image, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { Pill } from '@/components/Pill';
import { postIntentLabels, postIntentTones, sharingStatusLabels } from '@/constants/library';
import type { SocialPost } from '@/hooks/useLibrary';

type SignalReelCardProps = {
  item: SocialPost;
  slideHeight: number;
  monochrome: boolean;
  openingPostId: number | null;
  onChat: (postId: number) => void;
  onPublishSimilar: () => void;
};

function formatDateLabel(value: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
  }).format(new Date(value));
}

export function SignalReelCard({
  item,
  slideHeight,
  monochrome,
  openingPostId,
  onChat,
  onPublishSimilar,
}: SignalReelCardProps) {
  const coverUrl = item.inventory_book?.cover_url ?? '';

  return (
    <View
      style={{ height: slideHeight }}
      className={`justify-between px-5 py-5 ${monochrome ? 'bg-black' : 'bg-[#4A3520]'}`}>
      {!monochrome ? (
        <View className="pointer-events-none absolute -right-16 top-20 h-40 w-40 rounded-full bg-[#F5ECD7]/10" />
      ) : null}

      <View>
        <View className="flex-row items-center justify-between">
          <Pill label={postIntentLabels[item.intent]} tone={postIntentTones[item.intent]} />
          <Text className="text-sm font-medium text-stone-400">{formatDateLabel(item.created_at)}</Text>
        </View>

        <View className="mt-6 flex-row gap-4">
          {coverUrl ? (
            <Image
              source={{ uri: coverUrl }}
              className="h-40 w-28 rounded-2xl bg-white/10"
              resizeMode="cover"
            />
          ) : null}
          <View className="flex-1">
            <Text className="text-3xl font-black leading-tight text-white">{item.book_title}</Text>
            <Text className="mt-2 text-lg text-stone-400">{item.book_author}</Text>
          </View>
        </View>

        <View className="mt-6 rounded-[24px] bg-white/5 px-5 py-4">
          <Text className="text-xs uppercase tracking-[1px] text-stone-400">Publicado por</Text>
          <Text className="mt-2 text-lg font-semibold text-white">
            {item.owner.full_name || item.owner.email}
          </Text>
          {item.location_label ? (
            <Text className="mt-2 text-sm text-stone-400">Local: {item.location_label}</Text>
          ) : null}
        </View>

        {item.caption ? (
          <Text className="mt-5 text-base leading-7 text-stone-300" numberOfLines={4}>
            {item.caption}
          </Text>
        ) : (
          <Text className="mt-5 text-base leading-7 text-stone-400">
            Sem observações extras. Deslize para ver outros sinais.
          </Text>
        )}

        {item.inventory_book ? (
          <View className="mt-4 flex-row flex-wrap gap-2">
            <Pill label="Inventário" tone="accent" />
            <Pill label={sharingStatusLabels[item.inventory_book.sharing_status]} tone="neutral" />
            {item.inventory_book.has_physical_copy ? <Pill label="Tem físico" tone="success" /> : null}
          </View>
        ) : null}
      </View>

      <View className="gap-3 pb-2">
        <Button loading={openingPostId === item.id} onPress={() => onChat(item.id)}>
          Falar com {item.owner.full_name?.split(' ')[0] || 'usuário'}
        </Button>
        <Button variant="secondary" onPress={onPublishSimilar}>
          Publicar sinal parecido
        </Button>
      </View>
    </View>
  );
}
