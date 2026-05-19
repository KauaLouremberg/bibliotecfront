import { router } from 'expo-router';
import { FlatList, RefreshControl, Text, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import * as Linking from 'expo-linking';

import { Button } from '@/components/Button';
import { Pill } from '@/components/Pill';
import { postIntentLabels, postIntentTones, sharingStatusLabels } from '@/constants/library';
import { useCommunityFeed } from '@/hooks/useLibrary';

function formatDateLabel(value: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
  }).format(new Date(value));
}

export default function CommunityFeedScreen() {
  const feedQuery = useCommunityFeed();
  const { height } = useWindowDimensions();
  const feed = feedQuery.data;
  const cardHeight = Math.max(520, height - 250);

  return (
    <View className="flex-1 bg-stone-950">
      <View className="px-5 pb-4 pt-4">
        <Text className="text-sm uppercase tracking-[1.5px] text-orange-300">Conexões</Text>
        <Text className="mt-2 text-3xl font-bold text-white">Sinais em destaque</Text>
        <Text className="mt-2 text-sm leading-6 text-stone-300">
          Deslize como um feed vertical para ver quem precisa de um livro, quem está doando e quem topa emprestar.
        </Text>

        <View className="mt-4 flex-row flex-wrap gap-2">
          <Pill label={`${feed?.stats.need_posts ?? 0} pedidos`} tone="warning" />
          <Pill label={`${feed?.stats.donation_posts ?? 0} doações`} tone="success" />
          <Pill label={`${feed?.stats.exchange_posts ?? 0} trocas`} tone="accent" />
          <Pill label={`${feed?.stats.loan_posts ?? 0} empréstimos`} tone="danger" />
        </View>
      </View>

      {feedQuery.isPending ? (
        <View className="flex-1 items-center justify-center px-8">
          <Text className="text-center text-base text-stone-300">Carregando sinais da comunidade...</Text>
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
              tintColor="#fdba74"
              onRefresh={() => {
                void feedQuery.refetch();
              }}
            />
          }
          contentContainerClassName="px-5 pb-10"
          renderItem={({ item }) => (
            <View
              style={{ minHeight: cardHeight }}
              className="mb-5 rounded-[36px] border border-white/10 bg-[#1c1917] px-5 py-6">
              <View className="flex-row items-center justify-between">
                <Pill label={postIntentLabels[item.intent]} tone={postIntentTones[item.intent]} />
                <Text className="text-sm font-medium text-stone-400">{formatDateLabel(item.created_at)}</Text>
              </View>

              <View className="mt-8">
                <Text className="text-4xl font-bold leading-tight text-white">{item.book_title}</Text>
                <Text className="mt-3 text-lg text-stone-300">{item.book_author}</Text>
              </View>

              <View className="mt-8 rounded-[28px] bg-white/5 px-4 py-4">
                <Text className="text-sm uppercase tracking-[1px] text-stone-400">Publicado por</Text>
                <Text className="mt-2 text-2xl font-semibold text-white">
                  {item.owner.full_name || item.owner.email}
                </Text>
                <Text className="mt-1 text-base text-stone-300">{item.owner.email}</Text>
                {item.location_label ? (
                  <Text className="mt-3 text-sm text-stone-300">Local de referência: {item.location_label}</Text>
                ) : null}
              </View>

              {item.caption ? (
                <Text className="mt-8 text-base leading-7 text-stone-200">{item.caption}</Text>
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
                      onPress={() => {
                        void Linking.openURL(
                          `mailto:${item.owner.email}?subject=${encodeURIComponent(`Contato sobre ${item.book_title}`)}`,
                        );
                      }}>
                      Falar com {item.owner.full_name?.split(' ')[0] || 'usuário'}
                    </Button>
                    <TouchableOpacity
                      onPress={() => {
                        router.push('/(app)/signal-form');
                      }}>
                      <Text className="text-center text-sm font-semibold text-orange-300">
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
          <View className="rounded-[32px] bg-white/5 px-5 py-6">
            <Text className="text-2xl font-bold text-white">Nenhum sinal publicado ainda.</Text>
            <Text className="mt-3 text-sm leading-6 text-stone-300">
              Publique pedidos, doações e ofertas para começar o fluxo de contatos entre usuários.
            </Text>
            <Button
              className="mt-5"
              onPress={() => {
                router.push('/(app)/signal-form');
              }}>
              Criar primeiro sinal
            </Button>
          </View>
        </View>
      )}
    </View>
  );
}
