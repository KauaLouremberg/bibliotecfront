import { Image, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { Pill } from '@/components/Pill';
import { postIntentLabels, postIntentTones, sharingStatusLabels } from '@/constants/library';
import type { SocialPost } from '@/hooks/useLibrary';

type MySignalCardProps = {
  item: SocialPost;
  monochrome: boolean;
  onEdit: (postId: number) => void;
  onDelete: (postId: number) => void;
  deletingPostId: number | null;
};

function formatDateLabel(value: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value));
}

export function MySignalCard({
  item,
  monochrome,
  onEdit,
  onDelete,
  deletingPostId,
}: MySignalCardProps) {
  const coverUrl = item.inventory_book?.cover_url ?? '';

  return (
    <View
      className={`rounded-[28px] border p-5 ${
        monochrome ? 'border-neutral-300 bg-white' : 'border-[#C9A96E]/30 bg-[#F5ECD7]'
      }`}>
      <View className="flex-row items-start justify-between gap-3">
        <Pill label={postIntentLabels[item.intent]} tone={postIntentTones[item.intent]} />
        <Text className={`text-xs ${monochrome ? 'text-neutral-500' : 'text-[#8B6534]'}`}>
          {formatDateLabel(item.created_at)}
        </Text>
      </View>

      <View className="mt-4 flex-row gap-4">
        {coverUrl ? (
          <Image
            source={{ uri: coverUrl }}
            className="h-36 w-24 rounded-2xl bg-[#C9A96E]/20"
            resizeMode="cover"
          />
        ) : null}
        <View className="flex-1">
          <Text className={`text-xl font-bold ${monochrome ? 'text-black' : 'text-[#4A3520]'}`}>
            {item.book_title}
          </Text>
          <Text className={`mt-1 text-sm ${monochrome ? 'text-neutral-600' : 'text-[#8B6534]'}`}>
            {item.book_author}
          </Text>
          {item.location_label ? (
            <Text className={`mt-2 text-xs ${monochrome ? 'text-neutral-500' : 'text-[#8B6534]/80'}`}>
              Local: {item.location_label}
            </Text>
          ) : null}
        </View>
      </View>

      {item.caption ? (
        <Text className={`mt-4 text-sm leading-6 ${monochrome ? 'text-neutral-700' : 'text-[#4A3520]/90'}`}>
          {item.caption}
        </Text>
      ) : null}

      {item.inventory_book ? (
        <View className="mt-3 flex-row flex-wrap gap-2">
          <Pill label="Inventário" tone="accent" />
          <Pill label={sharingStatusLabels[item.inventory_book.sharing_status]} tone="neutral" />
          {item.inventory_book.has_physical_copy ? <Pill label="Tem físico" tone="success" /> : null}
        </View>
      ) : null}

      <View className="mt-5 flex-row gap-3">
        <Button className="flex-1" variant="secondary" onPress={() => onEdit(item.id)}>
          Editar
        </Button>
        <Button
          className="flex-1"
          loading={deletingPostId === item.id}
          variant="danger"
          onPress={() => onDelete(item.id)}>
          Excluir
        </Button>
      </View>
    </View>
  );
}
