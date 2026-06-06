import FontAwesome from '@expo/vector-icons/FontAwesome';
import { router } from 'expo-router';
import { useCallback } from 'react';
import { FlatList, RefreshControl, Text, TouchableOpacity, View } from 'react-native';

import { BackButton } from '@/components/BackButton';
import { Pill } from '@/components/Pill';
import { postIntentLabels, postIntentTones } from '@/constants/library';
import { useInterfaceMode } from '@/contexts/InterfaceContext';
import { useAppInsets } from '@/hooks/useAppInsets';
import { useRefreshOnFocus } from '@/hooks/useRefreshOnFocus';
import { useSignalChatThreads, type SignalChatThread } from '@/hooks/useSignalChat';
import { useToastOnQueryError } from '@/hooks/useToastOnQueryError';

function formatWhen(value: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

function participantLabel(thread: SignalChatThread) {
  return thread.other_participant.full_name.trim() || thread.other_participant.email;
}

export default function ChatsScreen() {
  const { monochrome } = useInterfaceMode();
  const { topInset } = useAppInsets();
  const chatsQuery = useSignalChatThreads();
  useToastOnQueryError(chatsQuery, 'Conversas indisponíveis', 'Não foi possível carregar.');

  const refresh = useCallback(() => chatsQuery.refetch(), [chatsQuery.refetch]);
  useRefreshOnFocus(refresh);

  const items = chatsQuery.data ?? [];
  const bg = monochrome ? 'bg-white' : 'bg-[#F5ECD7]';
  const heading = monochrome ? 'text-black' : 'text-[#4A3520]';
  const muted = monochrome ? 'text-neutral-600' : 'text-[#8B6534]';

  return (
    <View className={`flex-1 ${bg}`} style={{ paddingTop: topInset }}>
      <View className="flex-row items-center justify-between px-4 pb-3 pt-2">
        <BackButton fallbackHref="/(app)/notifications" />
        <Text className={`text-lg font-extrabold ${heading}`}>Conversas</Text>
        <View className="h-10 w-10" />
      </View>

      <Text className={`px-4 pb-3 text-sm ${muted}`}>
        Todas as conversas iniciadas sobre sinais da comunidade.
      </Text>

      {chatsQuery.isPending && items.length === 0 ? (
        <View className="flex-1 items-center justify-center">
          <Text className={muted}>Carregando…</Text>
        </View>
      ) : items.length === 0 ? (
        <View className="flex-1 items-center justify-center px-8">
          <FontAwesome name="comments-o" size={40} color={monochrome ? '#ccc' : '#C9A96E'} style={{ opacity: 0.4 }} />
          <Text className={`mt-4 text-center text-base ${muted}`}>
            Nenhuma conversa ainda. Abra um sinal em Conexões e toque em «Falar com…» para iniciar.
          </Text>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => String(item.id)}
          contentContainerClassName="gap-3 px-4 pb-6"
          refreshControl={
            <RefreshControl
              refreshing={chatsQuery.isRefetching}
              tintColor={monochrome ? '#111' : '#8B6534'}
              onRefresh={() => void refresh()}
            />
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              activeOpacity={0.75}
              onPress={() =>
                router.push({
                  pathname: '/(app)/signal-chat/[threadId]',
                  params: { threadId: String(item.id) },
                })
              }
              className={`rounded-[22px] border px-4 py-4 ${
                monochrome ? 'border-neutral-200 bg-white' : 'border-[#C9A96E]/30 bg-white/80'
              }`}>
              <View className="flex-row items-start justify-between gap-2">
                <Pill label={postIntentLabels[item.post.intent as keyof typeof postIntentLabels]} tone={postIntentTones[item.post.intent as keyof typeof postIntentTones]} />
                <Text className={`text-xs ${muted}`}>{formatWhen(item.last_message_at)}</Text>
              </View>
              <Text className={`mt-3 text-lg font-bold ${heading}`}>{item.post.book_title}</Text>
              <Text className={`mt-1 text-sm ${muted}`}>{item.post.book_author}</Text>
              <View className="mt-3 flex-row items-center gap-2">
                <FontAwesome name="user" size={12} color={monochrome ? '#666' : '#8B6534'} />
                <Text className={`text-sm font-semibold ${heading}`}>{participantLabel(item)}</Text>
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}
