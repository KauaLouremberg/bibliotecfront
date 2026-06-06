import { router } from 'expo-router';
import { useState } from 'react';
import { FlatList, RefreshControl, Text, TouchableOpacity, View, useWindowDimensions } from 'react-native';

import { AnimatedReveal } from '@/components/AnimatedReveal';
import { Button } from '@/components/Button';
import { Pill } from '@/components/Pill';
import { postIntentLabels, postIntentTones, sharingStatusLabels } from '@/constants/library';
import { useInterfaceMode } from '@/contexts/InterfaceContext';
import { useCommunityFeed } from '@/hooks/useLibrary';
import { useOpenSignalChat, useSignalChatThreads } from '@/hooks/useSignalChat';
import { useToastOnQueryError } from '@/hooks/useToastOnQueryError';
import { extractApiErrorMessage } from '@/utils/apiError';
import { showErrorToast } from '@/utils/feedback';

function formatDateLabel(value: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
  }).format(new Date(value));
}

export default function CommunityFeedScreen() {
  const feedQuery = useCommunityFeed();
  const chatsQuery = useSignalChatThreads();
  const openChat = useOpenSignalChat();
  const { monochrome } = useInterfaceMode();
  const [openingPostId, setOpeningPostId] = useState<number | null>(null);
  useToastOnQueryError(feedQuery, 'Feed indisponível', 'Não foi possível carregar os sinais da comunidade.');
  const { height } = useWindowDimensions();
  const feed = feedQuery.data;
  const cardHeight = Math.max(520, height - 250);

  async function startChat(postId: number) {
    setOpeningPostId(postId);
    try {
      const data = await openChat.mutateAsync(postId);
      router.push({
        pathname: '/(app)/signal-chat/[threadId]',
        params: { threadId: String(data.thread.id) },
      });
    } catch (error) {
      showErrorToast('Não foi possível abrir o chat', extractApiErrorMessage(error, 'Tente novamente.'));
    } finally {
      setOpeningPostId(null);
    }
  }

  return (
    <View className={`flex-1 ${monochrome ? 'bg-black' : 'bg-[#4A3520]'}`}>
      <AnimatedReveal className="px-5 pb-4 pt-6">
        <Text className={`text-sm uppercase tracking-[1.5px] ${monochrome ? 'text-neutral-400' : 'text-[#C9A96E]'}`}>Conexões</Text>
        <Text className="mt-2 text-3xl font-black leading-tight text-white">Sinais em destaque</Text>
        <Text className="mt-2 text-sm leading-6 text-stone-400">
          Deslize como um feed vertical para ver quem precisa de um livro, quem está doando e quem topa emprestar.
        </Text>

        <View className="mt-4 flex-row flex-wrap gap-2">
          <Pill label={`${feed?.stats.need_posts ?? 0} pedidos`} tone="warning" />
          <Pill label={`${feed?.stats.donation_posts ?? 0} doações`} tone="success" />
          <Pill label={`${feed?.stats.exchange_posts ?? 0} trocas`} tone="accent" />
          <Pill label={`${feed?.stats.loan_posts ?? 0} empréstimos`} tone="danger" />
        </View>

        {chatsQuery.data && chatsQuery.data.length > 0 ? (
          <View className="mt-6 rounded-[24px] bg-white/5 px-4 py-4">
            <Text className="text-xs uppercase tracking-[1px] text-stone-400">Conversas abertas</Text>
            <View className="mt-3 gap-2">
              {chatsQuery.data.map((thread) => (
                <TouchableOpacity
                  key={thread.id}
                  className="rounded-2xl bg-white/5 px-4 py-3"
                  onPress={() => {
                    router.push({
                      pathname: '/(app)/signal-chat/[threadId]',
                      params: { threadId: String(thread.id) },
                    });
                  }}>
                  <Text className="text-sm font-semibold text-white">{thread.post.book_title}</Text>
                  <Text className="mt-1 text-xs text-stone-400">
                    com {thread.other_participant.full_name || thread.other_participant.email}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ) : null}
      </AnimatedReveal>

      {feedQuery.isPending ? (
        <View className="flex-1 items-center justify-center px-8">
          <Text className="text-center text-base text-stone-400">Carregando sinais da comunidade...</Text>
        </View>
      ) : feed?.items.length ? (
        <FlatList
          data={feed.items}
          keyExtractor={(item) => String(item.id)}
          className="flex-1"
          pagingEnabled
          decelerationRate="fast"
          snapToAlignment="start"
          refreshControl={
            <RefreshControl
              refreshing={feedQuery.isRefetching}
              tintColor="#fb923c"
              onRefresh={() => {
                void feedQuery.refetch();
                void chatsQuery.refetch();
              }}
            />
          }
          contentContainerClassName="px-5 pb-4"
          renderItem={({ item }) => (
            <View
              style={{ minHeight: cardHeight }}
              className={`mb-5 rounded-[32px] border px-6 py-7 ${monochrome ? 'border-white/20 bg-neutral-900' : 'border-stone-800 bg-[#4A3520]'}`}>
              {!monochrome ? (
                <View className="absolute -right-12 top-24 h-32 w-32 rounded-full bg-[#F5ECD7]0/10" />
              ) : null}
              <View className="flex-row items-center justify-between">
                <Pill label={postIntentLabels[item.intent]} tone={postIntentTones[item.intent]} />
                <Text className="text-sm font-medium text-stone-400">{formatDateLabel(item.created_at)}</Text>
              </View>

              <View className="mt-8">
                <Text className="text-3xl font-bold leading-tight text-white">{item.book_title}</Text>
                <Text className="mt-3 text-lg text-stone-400">{item.book_author}</Text>
              </View>

              <View className="mt-8 rounded-[24px] bg-white/5 px-5 py-5">
                <Text className="text-xs uppercase tracking-[1px] text-stone-400">Publicado por</Text>
                <Text className="mt-2 text-xl font-semibold text-white">
                  {item.owner.full_name || item.owner.email}
                </Text>
                {item.location_label ? (
                  <Text className="mt-3 text-sm text-stone-400">Local de referência: {item.location_label}</Text>
                ) : null}
              </View>

              {item.caption ? (
                <Text className="mt-8 text-base leading-7 text-stone-300">{item.caption}</Text>
              ) : (
                <Text className="mt-8 text-base leading-7 text-stone-400">
                  Sem observações extras. O foco aqui é conectar rápido.
                </Text>
              )}

              {item.inventory_book ? (
                <View className="mt-8 flex-row flex-wrap gap-2">
                  <Pill label="Ligado ao inventário" tone="accent" />
                  <Pill label={sharingStatusLabels[item.inventory_book.sharing_status]} tone="neutral" />
                  {item.inventory_book.has_physical_copy ? <Pill label="Possui físico" tone="success" /> : null}
                </View>
              ) : null}

              <View className="mt-auto pt-10">
                {item.is_owner ? (
                  <View className="gap-3">
                    <Button
                      onPress={() => {
                        router.push({
                          pathname: '/(app)/signal-form',
                          params: { postId: String(item.id) },
                        });
                      }}>
                      Editar sinal
                    </Button>
                    <Text className="text-center text-sm text-stone-400">
                      Este post é seu. Ajuste o texto ou a disponibilidade quando quiser.
                    </Text>
                  </View>
                ) : (
                  <View className="gap-3">
                    <Button
                      loading={openingPostId === item.id}
                      onPress={() => {
                        void startChat(item.id);
                      }}>
                      Falar com {item.owner.full_name?.split(' ')[0] || 'usuário'}
                    </Button>
                    <TouchableOpacity
                      onPress={() => {
                        router.push('/(app)/signal-form');
                      }}>
                      <Text className="text-center text-sm font-semibold text-[#C9A96E]">
                        Quero publicar um sinal parecido
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </View>
          )}
        />
      ) : (
        <View className="flex-1 px-5">
          <AnimatedReveal className="rounded-[28px] bg-white/5 px-6 py-7">
            <Text className="text-2xl font-bold text-white">Nenhum sinal publicado ainda.</Text>
            <Text className="mt-3 text-sm leading-6 text-stone-400">
              Publique pedidos, doações e ofertas para começar o fluxo de contatos entre usuários.
            </Text>
            <Button
              className="mt-6"
              onPress={() => {
                router.push('/(app)/signal-form');
              }}>
              Criar primeiro sinal
            </Button>
          </AnimatedReveal>
        </View>
      )}
    </View>
  );
}
