import { Image, Text, TouchableOpacity, View } from 'react-native';

import type { CatalogBook } from '@/hooks/useLibrary';

type CatalogPosterCardProps = {
  book: CatalogBook;
  width: number;
  monochrome: boolean;
  onPress: (book: CatalogBook) => void;
  compact?: boolean;
};

export function CatalogPosterCard({ book, width, monochrome, onPress, compact = false }: CatalogPosterCardProps) {
  const height = Math.round(width * 1.45);

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={() => onPress(book)}
      style={{ width }}
      className={compact ? '' : 'mr-3'}>
      {book.cover_url ? (
        <Image
          source={{ uri: book.cover_url }}
          style={{ width, height }}
          className="rounded-2xl bg-[#C9A96E]/20"
          resizeMode="cover"
        />
      ) : (
        <View
          style={{ width, height }}
          className={`items-center justify-center rounded-2xl px-3 ${
            monochrome ? 'bg-neutral-200' : 'bg-[#E8D5B0]'
          }`}>
          <Text
            className={`text-center text-xs font-bold uppercase tracking-[1px] ${
              monochrome ? 'text-neutral-700' : 'text-[#4A3520]'
            }`}>
            Sem capa
          </Text>
        </View>
      )}
      <Text
        className={`mt-2 text-sm font-bold leading-5 ${monochrome ? 'text-black' : 'text-[#F5ECD7]'}`}
        numberOfLines={2}>
        {book.title}
      </Text>
      <Text className={`mt-0.5 text-xs ${monochrome ? 'text-neutral-600' : 'text-[#E8D5B0]/80'}`} numberOfLines={1}>
        {book.author}
      </Text>
    </TouchableOpacity>
  );
}
